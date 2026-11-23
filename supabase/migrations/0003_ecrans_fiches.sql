-- =====================================================================
-- ServiLink : données des écrans de Tammy44 du 22/11/2026
-- (cartes riches de l'annuaire, filtres multiples, fiches artisan et fournisseur)
-- =====================================================================

-- 1. Nouveaux champs de fiche
alter table professionnels
  add column langues           text,                       -- « Français, Mina »
  add column disponibilite     text,                       -- « Dès aujourd'hui »
  add column moyens_paiement   text,                       -- « Espèces, Flooz, T-Money »
  add column livraison_frais_min int check (livraison_frais_min >= 0), -- « à partir de 1 000 F »
  add column livraison_delai   text;                       -- « 24–48 h »

-- Photos : la photo principale est marquée ; les autres sont les chantiers de référence
alter table photos add column principale boolean not null default false;

-- Référence publique de la fiche, citée dans WhatsApp : ID-042 -> SLK-A-0042 (A artisan, F fournisseur)
create or replace function public.reference_fiche(p_id text, p_type type_pro)
returns text language sql immutable as $$
  select 'SLK-' || case p_type when 'Artisan' then 'A' else 'F' end || '-' || lpad(regexp_replace(p_id, '\D', '', 'g'), 4, '0')
$$;

-- 2. Vue publique enrichie (on la recrée : les vues qui en dépendent aussi)
drop view if exists mes_favoris, mes_demandes, prix_moyens_semaine, prix_materiaux_public, tarifs_public, photos_public;
drop function if exists public.rechercher_annuaire(text, type_pro, text, text, text, numeric, numeric, int, text, int);
drop view annuaire_public;

create view annuaire_public as
select p.id, public.reference_fiche(p.id, p.type) as reference,
       p.nom, p.type, p.metier, p.metier_slug, p.quartier, p.quartiers_intervention,
       p.whatsapp, p.telephone, p.description, p.annees_experience,
       p.date_verification, p.nb_chantiers_vus, p.nb_clients_appeles,
       (p.piece_identite = 'Oui') as identite_verifiee,
       (p.carte_artisan_rccm is not null) as carte_ou_rccm_verifie,
       (p.atelier_visite = 'Oui') as atelier_visite,
       (p.charte_signee = 'Oui') as charte_signee,
       n.qualite_travail, n.respect_delais, n.avis_clients as note_avis_clients, n.clarte_prix, n.reactivite, n.note_moyenne,
       (select count(*) from avis a where a.professionnel_id = p.id and a.statut = 'publié')::int as nb_avis,
       p.livraison, p.zone_livraison, p.livraison_frais_min, p.livraison_delai,
       p.domaine, p.ville, p.axe, p.point_repere, p.latitude, p.longitude, p.rayon_km,
       p.depannage_route, p.service_domicile, p.horaires, p.urgences_nuit,
       p.langues, p.disponibilite, p.moyens_paiement,
       (select ph.chemin from photos ph where ph.professionnel_id = p.id order by ph.principale desc, ph.ordre, ph.id limit 1) as photo_principale,
       p.recherche
from professionnels p
left join notations n on n.professionnel_id = p.id
where p.statut = 'Retenu'
  and p.charte_signee = 'Oui'
  and p.date_verification is not null
  and p.prochaine_reverif >= current_date;

create view photos_public as
select ph.professionnel_id, ph.chemin, ph.legende, ph.ordre, ph.principale
from photos ph where ph.professionnel_id in (select id from annuaire_public);

create view tarifs_public as
select t.professionnel_id, t.service, t.unite, t.prix_min, t.prix_max, t.frais_deplacement, t.date_releve,
       (current_date - t.date_releve) > public.param_int('prix_jours_ancien', 14) as ancien
from tarifs t
where t.professionnel_id in (select id from annuaire_public)
  and t.date_releve is not null
  and (current_date - t.date_releve) <= public.param_int('prix_jours_masque', 30);

create view prix_materiaux_public as
with derniers as (
  select distinct on (r.materiau_id, r.professionnel_id)
         r.materiau_id, r.professionnel_id, r.prix, r.livraison, r.frais_livraison, r.date_releve
  from releves_prix r
  where r.professionnel_id in (select id from annuaire_public where type = 'Fournisseur')
    and (current_date - r.date_releve) <= public.param_int('prix_jours_masque', 30)
  order by r.materiau_id, r.professionnel_id, r.date_releve desc
)
select m.id as materiau_id, m.slug, m.nom, m.variante, m.unite_achat, m.ordre,
       d.professionnel_id, a.nom as fournisseur, a.quartier, a.whatsapp, a.telephone,
       d.prix, d.livraison, d.frais_livraison, d.date_releve,
       (current_date - d.date_releve) > public.param_int('prix_jours_ancien', 14) as ancien,
       d.prix = min(d.prix) over (partition by d.materiau_id) as le_moins_cher
from derniers d
join materiaux m on m.id = d.materiau_id and m.actif
join annuaire_public a on a.id = d.professionnel_id;

create view prix_moyens_semaine as
select r.materiau_id, m.slug, r.semaine, round(avg(r.prix))::int as prix_moyen, min(r.prix) as prix_min, count(*) as nb_releves
from releves_prix r join materiaux m on m.id = r.materiau_id
where r.professionnel_id in (select id from annuaire_public where type = 'Fournisseur')
  and r.semaine >= date_trunc('week', current_date - 56)::date
group by r.materiau_id, m.slug, r.semaine;

create view mes_demandes as
select d.id, d.besoin, d.quartier, d.statut, d.created_at, d.professionnel_id, a.nom as professionnel
from demandes d left join annuaire_public a on a.id = d.professionnel_id
where d.client_id = auth.uid();

create view mes_favoris as
select f.professionnel_id as id, a.nom, a.type, a.metier, a.metier_slug, a.quartier, f.created_at
from favoris f join annuaire_public a on a.id = f.professionnel_id
where f.user_id = auth.uid();

-- Avis publiés : prénom + initiale, jamais le numéro du client
create view avis_public as
select a.professionnel_id, a.id, a.prenom_client, a.created_at, a.commentaire,
       round((coalesce(a.qualite_travail, 0) + coalesce(a.respect_delais, 0) + coalesce(a.avis_clients, 0)
              + coalesce(a.clarte_prix, 0) + coalesce(a.reactivite, 0))::numeric
             / nullif((a.qualite_travail is not null)::int + (a.respect_delais is not null)::int + (a.avis_clients is not null)::int
                      + (a.clarte_prix is not null)::int + (a.reactivite is not null)::int, 0), 1) as note
from avis a
where a.statut = 'publié' and a.professionnel_id in (select id from annuaire_public);

-- 3. Recherche : plusieurs métiers, « livre à domicile », et ce qu'affichent les cartes
create function public.rechercher_annuaire(
  q           text default null,
  p_type      type_pro default null,
  p_metiers   text[] default null,       -- cases cochées de « Métier ou produit »
  p_quartier  text default null,
  p_tri       text default 'note',       -- 'note' | 'experience' | 'distance'
  p_lat       numeric default null,
  p_lng       numeric default null,
  p_page      int default 1,
  p_domaine   text default 'BTP',
  p_par_page  int default 20,
  p_livraison boolean default false
) returns table (
  id text, reference text, nom text, type type_pro, metier text, metier_slug text, quartier text,
  note_moyenne numeric, nb_avis int, annees_experience int, nb_chantiers_vus int, date_verification date,
  photo_principale text, whatsapp text, telephone text, service_domicile oui_non, livraison oui_non,
  prix_depart int, nb_produits int,
  latitude numeric, longitude numeric, position_approx boolean, distance_km numeric, total bigint
) language sql stable security definer set search_path = public as $$
  with base as (
    select a.*, pos.lat as plat, pos.lng as plng, (a.latitude is null) as approx
    from annuaire_public a
    cross join lateral public.position_fiche(a.latitude, a.longitude, a.quartier) pos
    where a.domaine = p_domaine
      and (p_type is null or a.type = p_type)
      and (p_metiers is null or cardinality(p_metiers) = 0 or a.metier_slug = any (p_metiers))
      and (not p_livraison or a.livraison = 'Oui')
      and (p_quartier is null
           or normaliser(a.quartier) = normaliser(p_quartier)
           or normaliser(p_quartier) = any (select normaliser(x) from unnest(a.quartiers_intervention) x))
      and (q is null or btrim(q) = '' or not exists (
             select 1 from regexp_split_to_table(normaliser(q), ' ') mot
             where mot <> ''
               and position(' ' || mot in ' ' || a.recherche || ' ' || normaliser(array_to_string(a.quartiers_intervention, ' '))) = 0))
  ), filtre as (
    select b.*,
           case when p_lat is not null and p_lng is not null and b.plat is not null then
             round((6371 * 2 * asin(sqrt(
               power(sin(radians(b.plat - p_lat) / 2), 2) +
               cos(radians(p_lat)) * cos(radians(b.plat)) * power(sin(radians(b.plng - p_lng) / 2), 2)
             )))::numeric, 1)
           end as distance_km,
           (select min(t.prix_min) from tarifs_public t where t.professionnel_id = b.id) as prix_depart,
           (select count(*) from prix_materiaux_public pm where pm.professionnel_id = b.id)::int as nb_produits
    from base b
  )
  select f.id, f.reference, f.nom, f.type, f.metier, f.metier_slug, f.quartier, f.note_moyenne, f.nb_avis,
         f.annees_experience, f.nb_chantiers_vus, f.date_verification, f.photo_principale, f.whatsapp, f.telephone,
         f.service_domicile, f.livraison, f.prix_depart, f.nb_produits,
         f.plat, f.plng, f.approx, f.distance_km, count(*) over () as total
  from filtre f
  order by
    case when p_tri = 'distance' then f.distance_km end asc nulls last,
    case when p_tri = 'experience' then f.annees_experience end desc nulls last,
    f.note_moyenne desc nulls last, f.nb_chantiers_vus desc nulls last, f.nom
  limit least(greatest(p_par_page, 1), 500) offset greatest(p_page - 1, 0) * least(greatest(p_par_page, 1), 500)
$$;

-- 4. Droits (les vues recréées repartent sans droits)
revoke all on annuaire_public, photos_public, tarifs_public, prix_materiaux_public, prix_moyens_semaine,
              mes_demandes, mes_favoris, avis_public from anon, authenticated;
grant select on annuaire_public, photos_public, tarifs_public, prix_materiaux_public, prix_moyens_semaine, avis_public to anon, authenticated;
grant select on mes_demandes, mes_favoris to authenticated;
revoke all on function public.rechercher_annuaire(text, type_pro, text[], text, text, numeric, numeric, int, text, int, boolean) from public;
grant execute on function public.rechercher_annuaire(text, type_pro, text[], text, text, numeric, numeric, int, text, int, boolean) to anon, authenticated;
grant execute on function public.reference_fiche(text, type_pro) to anon, authenticated;
