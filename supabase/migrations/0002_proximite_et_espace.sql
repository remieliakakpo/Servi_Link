-- =====================================================================
-- ServiLink : proximité (quartiers, carte, « Autour de moi ») et « Mon espace »
-- (comptes publics par code, favoris, mes demandes), pour les écrans de Tammy44.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Quartiers : liste « Grand Lomé ▾ », points de la carte, position de secours
--    d'une fiche sans GPS (on prend le centre de son quartier).
-- ---------------------------------------------------------------------
create table quartiers (
  nom     text primary key,
  zone    text not null default 'Grand Lomé',
  lat     numeric(8,5) not null check (lat between 6.0 and 11.2),
  lng     numeric(8,5) not null check (lng between -0.2 and 1.9),
  ordre   int not null default 100,
  actif   boolean not null default true
);
create unique index quartiers_nom_norm on quartiers (public.normaliser(nom));

alter table quartiers enable row level security;
create policy quartiers_lecture on quartiers for select to authenticated using (public.est_equipe());
create policy quartiers_admin   on quartiers for all    to authenticated using (public.a_role('admin')) with check (public.a_role('admin'));
create trigger quartiers_journal after insert or update or delete on quartiers for each row execute function public.journaliser();

create view quartiers_public as
select nom, zone, lat, lng from quartiers where actif order by ordre, nom;

-- Position d'une fiche : son GPS, sinon le centre de son quartier
create or replace function public.position_fiche(p_lat numeric, p_lng numeric, p_quartier text, out lat numeric, out lng numeric)
language sql stable security definer set search_path = public as $$
  select coalesce(p_lat, q.lat), coalesce(p_lng, q.lng)
  from (select 1) x left join quartiers q on public.normaliser(q.nom) = public.normaliser(p_quartier)
$$;

-- ---------------------------------------------------------------------
-- 2. Recherche : renvoie aussi la position (pour la carte) et le domicile
-- ---------------------------------------------------------------------
drop function public.rechercher_annuaire(text, type_pro, text, text, text, numeric, numeric, int, text);

create function public.rechercher_annuaire(
  q           text default null,
  p_type      type_pro default null,
  p_metier    text default null,
  p_quartier  text default null,
  p_tri       text default 'note',        -- 'note' | 'experience' | 'distance'
  p_lat       numeric default null,
  p_lng       numeric default null,
  p_page      int default 1,
  p_domaine   text default 'BTP',
  p_par_page  int default 20              -- la carte demande toutes les fiches (max 500)
) returns table (
  id text, nom text, type type_pro, metier text, metier_slug text, quartier text,
  note_moyenne numeric, annees_experience int, nb_chantiers_vus int, date_verification date,
  photo_principale text, whatsapp text, telephone text, service_domicile oui_non,
  latitude numeric, longitude numeric, position_approx boolean, distance_km numeric, total bigint
) language sql stable security definer set search_path = public as $$
  with base as (
    select a.*, pos.lat as plat, pos.lng as plng, (a.latitude is null) as approx
    from annuaire_public a
    cross join lateral public.position_fiche(a.latitude, a.longitude, a.quartier) pos
    where a.domaine = p_domaine
      and (p_type is null or a.type = p_type)
      and (p_metier is null or a.metier_slug = p_metier)
      and (p_quartier is null
           or normaliser(a.quartier) = normaliser(p_quartier)
           or normaliser(p_quartier) = any (select normaliser(x) from unnest(a.quartiers_intervention) x))
      and (q is null or btrim(q) = '' or not exists (
             select 1 from regexp_split_to_table(normaliser(q), ' ') mot
             where mot <> ''  -- début de mot : « be » trouve Bè (et béton)
               and position(' ' || mot in ' ' || a.recherche || ' ' || normaliser(array_to_string(a.quartiers_intervention, ' '))) = 0))
  ), filtre as (
    select b.*,
           case when p_lat is not null and p_lng is not null and b.plat is not null then
             round((6371 * 2 * asin(sqrt(
               power(sin(radians(b.plat - p_lat) / 2), 2) +
               cos(radians(p_lat)) * cos(radians(b.plat)) * power(sin(radians(b.plng - p_lng) / 2), 2)
             )))::numeric, 1)
           end as distance_km
    from base b
  )
  select f.id, f.nom, f.type, f.metier, f.metier_slug, f.quartier, f.note_moyenne, f.annees_experience,
         f.nb_chantiers_vus, f.date_verification, f.photo_principale, f.whatsapp, f.telephone, f.service_domicile,
         f.plat, f.plng, f.approx, f.distance_km, count(*) over () as total
  from filtre f
  order by
    case when p_tri = 'distance' then f.distance_km end asc nulls last,
    case when p_tri = 'experience' then f.annees_experience end desc nulls last,
    f.note_moyenne desc nulls last, f.nb_chantiers_vus desc nulls last, f.nom
  limit least(greatest(p_par_page, 1), 500) offset greatest(p_page - 1, 0) * least(greatest(p_par_page, 1), 500)
$$;

-- ---------------------------------------------------------------------
-- 3. Mon espace : profil, favoris, mes demandes
--    Un client se connecte par code (e-mail ou SMS, Supabase Auth). Il n'est pas dans
--    la table equipe : il ne voit donc aucune table métier, seulement ses propres lignes.
-- ---------------------------------------------------------------------
create table clients (
  user_id     uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  nom         text,
  telephone   text,
  quartier    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger clients_updated_at before update on clients for each row execute function public.maj_updated_at();

create table favoris (
  user_id           uuid not null references auth.users(id) on delete cascade default auth.uid(),
  professionnel_id  text not null references professionnels(id) on delete cascade,
  created_at        timestamptz not null default now(),
  primary key (user_id, professionnel_id)
);

alter table clients enable row level security;
alter table favoris enable row level security;
create policy clients_soi   on clients for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy clients_equipe on clients for select to authenticated using (public.est_equipe());
create policy favoris_soi   on favoris for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Une demande peut être rattachée au compte du client (le conseiller le fait, ou le client depuis l'appli)
alter table demandes add column client_id uuid references auth.users(id) on delete set null;

-- Le client voit ses demandes sans les notes internes du conseiller
create view mes_demandes as
select d.id, d.besoin, d.quartier, d.statut, d.created_at, d.professionnel_id, a.nom as professionnel
from demandes d
left join annuaire_public a on a.id = d.professionnel_id
where d.client_id = auth.uid();

-- Favoris encore publiés (une fiche dépubliée disparaît des favoris sans être effacée)
create view mes_favoris as
select f.professionnel_id as id, a.nom, a.type, a.metier, a.metier_slug, a.quartier, f.created_at
from favoris f join annuaire_public a on a.id = f.professionnel_id
where f.user_id = auth.uid();

revoke all on quartiers, clients, favoris, mes_demandes, mes_favoris from anon;
grant select on quartiers_public to anon, authenticated;
grant select on mes_demandes, mes_favoris to authenticated;
grant select, insert, update, delete on clients, favoris to authenticated;
revoke all on function public.position_fiche(numeric, numeric, text) from anon, public;
grant execute on function public.position_fiche(numeric, numeric, text) to authenticated;
revoke all on function public.rechercher_annuaire(text, type_pro, text, text, text, numeric, numeric, int, text, int) from public;
grant execute on function public.rechercher_annuaire(text, type_pro, text, text, text, numeric, numeric, int, text, int) to anon, authenticated;
