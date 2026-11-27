-- =====================================================================
-- ServiLink : Vitrine (27/11/2026) — photos et vidéos courtes du travail des pros
-- Deux arrivées : le pro publie depuis l'appli (connecté, « à vérifier », fiche à rattacher),
-- ou l'envoie sur le WhatsApp de ServiLink et l'équipe l'ajoute. Rien n'est public avant vérification.
-- =====================================================================

create type statut_realisation as enum ('a_verifier', 'en_ligne', 'refusee');
create type etiquette_realisation as enum ('avant', 'en_cours', 'termine');

create table realisations (
  id                text primary key,                      -- R…, donné par l'appli
  professionnel_id  text references professionnels(id) on delete cascade, -- vide tant que l'équipe n'a pas rattaché l'envoi
  type              text not null check (type in ('photo', 'video')),
  chemin            text not null,                         -- chemin dans le bucket « realisations »
  vignette          text,                                  -- image de couverture d'une vidéo (même bucket), faite par le téléphone
  etiquette         etiquette_realisation,
  legende           text check (char_length(legende) <= 120),
  statut            statut_realisation not null default 'a_verifier',
  motif             text,                                  -- motif du refus
  duree             int check (duree >= 0),                -- secondes, vidéos seulement
  source            text not null default 'whatsapp' check (source in ('whatsapp', 'appli')),
  envoyeur_nom      text check (char_length(envoyeur_nom) <= 80),
  envoyeur_tel      text check (char_length(envoyeur_tel) <= 20),
  recu_le           timestamptz not null default now(),
  publie_le         timestamptz,
  envoye_par        uuid default auth.uid(),
  check (statut <> 'en_ligne' or professionnel_id is not null)  -- on ne publie qu'une réalisation rattachée à une fiche
);
create index realisations_pro on realisations (professionnel_id, statut, publie_le desc);
create index realisations_envoyeur on realisations (envoye_par);

alter table realisations enable row level security;
-- Équipe : admin et vérificateur gèrent tout (suppression : admin seul)
create policy realisations_equipe_lecture on realisations for select to authenticated using (public.a_role('admin', 'verificateur'));
create policy realisations_equipe_ajout   on realisations for insert to authenticated with check (public.a_role('admin', 'verificateur'));
create policy realisations_equipe_maj     on realisations for update to authenticated using (public.a_role('admin', 'verificateur')) with check (public.a_role('admin', 'verificateur'));
create policy realisations_equipe_suppr   on realisations for delete to authenticated using (public.a_role('admin'));
-- Pro connecté : envoie depuis l'appli (toujours à vérifier, sans fiche) et voit ses propres envois
create policy realisations_pro_envoi on realisations for insert to authenticated
  with check (envoye_par = auth.uid() and source = 'appli' and statut = 'a_verifier' and professionnel_id is null and publie_le is null
              -- fichier dans son dossier du stockage, ou vidéo envoyée chez Bunny Stream (bunny/<identifiant>)
              and (chemin like 'envois/' || auth.uid()::text || '/%' or chemin ~ '^bunny/[0-9a-f-]{36}$')
              and (vignette is null or vignette like 'envois/' || auth.uid()::text || '/%' or vignette ~ '^bunny/[0-9a-f-]{36}/thumbnail\.jpg$'));
create policy realisations_pro_lecture on realisations for select to authenticated using (envoye_par = auth.uid());

-- Anti-abus : un compte qui n'est pas de l'équipe envoie au plus 20 médias par 24 h (fichiers : 50, vignettes comprises)
create or replace function public.envois_du_jour(uid uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from realisations where envoye_par = uid and recu_le > now() - interval '1 day'
$$;
revoke all on function public.envois_du_jour(uuid) from public;
grant execute on function public.envois_du_jour(uuid) to authenticated;
create or replace function public.limiter_envois() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.a_role('admin', 'verificateur') and public.envois_du_jour(auth.uid()) >= 20 then
    raise exception 'limite_envois' using errcode = 'P0001', hint = 'Au plus 20 envois par jour. Réessayez demain.';
  end if;
  return new;
end $$;
create trigger realisations_limite before insert on realisations for each row execute function public.limiter_envois();

-- Fil public : réalisations en ligne des fiches publiées, avec ce qu'il faut pour l'afficher
create view vitrine_public as
select r.id, r.type, r.chemin, r.vignette, r.etiquette, r.legende, r.publie_le, r.duree,
       a.id as pro_id, a.nom as pro_nom, a.metier, a.metier_slug, a.type as type_pro, a.reference,
       coalesce(a.quartier, 'Grand Lomé') as lieu, a.latitude as lat, a.longitude as lng
from realisations r join annuaire_public a on a.id = r.professionnel_id
where r.statut = 'en_ligne';

revoke all on vitrine_public from anon, authenticated;
grant select on vitrine_public to anon, authenticated;

-- Stockage : bucket public en lecture ; l'équipe dépose partout, un pro connecté seulement dans envois/<son id>/
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    execute $f$create or replace function public.fichiers_du_jour(uid uuid) returns int
      language sql stable security definer set search_path = public, storage as $q$
        select count(*)::int from storage.objects where bucket_id = 'realisations' and owner = uid and created_at > now() - interval '1 day'
      $q$
    $f$;
    revoke all on function public.fichiers_du_jour(uuid) from public;
    grant execute on function public.fichiers_du_jour(uuid) to authenticated;
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    -- 200 Mo par fichier : une vidéo de 5 min filmée au téléphone (l'offre gratuite de Supabase plafonne à 50 Mo)
    values ('realisations', 'realisations', true, 209715200, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'])
    on conflict (id) do nothing;
    execute $p$create policy realisations_depot_equipe on storage.objects for insert to authenticated
      with check (bucket_id = 'realisations' and public.a_role('admin', 'verificateur'))$p$;
    execute $p$create policy realisations_depot_pro on storage.objects for insert to authenticated
      with check (bucket_id = 'realisations' and (storage.foldername(name))[1] = 'envois' and (storage.foldername(name))[2] = auth.uid()::text
                  and public.fichiers_du_jour(auth.uid()) < 50)$p$;
    execute $p$create policy realisations_retrait on storage.objects for delete to authenticated
      using (bucket_id = 'realisations' and public.a_role('admin'))$p$;
  end if;
end $$;
