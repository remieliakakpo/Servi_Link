-- =====================================================================
-- ServiLink V1 (cœur BTP) : schéma initial Supabase / PostgreSQL
-- Reprend schema.sql (professionnels, notations, photos, tarifs) et ajoute
-- les tables du chapitre 05 du cahier des charges (indice D).
--
-- Principes :
--   * Le public (rôle anon) ne lit JAMAIS une table : seulement des vues
--     filtrées et quelques fonctions (RPC) qui n'exposent rien de sensible.
--   * L'équipe se connecte (rôle authenticated) et ses droits dépendent de
--     son rôle dans la table equipe (admin, verificateur, enqueteur, conseiller).
--   * Montants en entiers FCFA, dates en UTC (timestamptz), affichées à l'heure de Lomé
--     (Africa/Lome = UTC toute l'année, donc pas de décalage).
-- =====================================================================

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm  with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Types
-- ---------------------------------------------------------------------
create type type_pro      as enum ('Artisan', 'Fournisseur');
create type statut_pro    as enum ('À appeler', 'À visiter', 'Visité – à noter', 'Retenu', 'Écarté', 'À re-vérifier');
create type oui_non       as enum ('Oui', 'Non', 'En attente');
create type role_equipe   as enum ('admin', 'verificateur', 'enqueteur', 'conseiller');
create type emplacement_sponso as enum ('accueil', 'liste_metier', 'prix');

-- ---------------------------------------------------------------------
-- 2. Recherche sans accents ni pluriel
--    « Maçons à Agoè » et « macon agoe » donnent la même chaîne normalisée.
-- ---------------------------------------------------------------------
create or replace function public.normaliser(t text)
returns text language sql immutable parallel safe as $$
  select regexp_replace(
           regexp_replace(lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, ''))),
                          '[^a-z0-9]+', ' ', 'g'),
           '([a-z]{3,})[sx]\M', '\1', 'g')   -- pluriel simple : agglos -> agglo, barres -> barre
$$;

-- ---------------------------------------------------------------------
-- 3. Équipe et rôles
-- ---------------------------------------------------------------------
create table equipe (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  nom         text not null,
  telephone   text,
  role        role_equipe not null,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Rôle de la personne connectée (null si elle n'est pas dans l'équipe ou inactive).
create or replace function public.mon_role()
returns role_equipe language sql stable security definer set search_path = public as $$
  select role from equipe where user_id = auth.uid() and actif
$$;

create or replace function public.a_role(variadic roles role_equipe[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(mon_role() = any(roles), false)
$$;

create or replace function public.est_equipe()
returns boolean language sql stable security definer set search_path = public as $$
  select mon_role() is not null
$$;

-- ---------------------------------------------------------------------
-- 4. Réglages (numéro WhatsApp, messages pré-remplis, seuils des prix…)
-- ---------------------------------------------------------------------
create table parametres (
  cle          text primary key,
  valeur       jsonb not null,
  description  text,
  public       boolean not null default false,   -- lisible par l'application publique
  updated_at   timestamptz not null default now()
);

create or replace function public.param_int(p_cle text, p_defaut int)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (valeur #>> '{}')::int from parametres where cle = p_cle), p_defaut)
$$;

-- ---------------------------------------------------------------------
-- 5. Métiers (grille de l'accueil, gérée dans le back-office)
-- ---------------------------------------------------------------------
create table metiers (
  slug      text primary key,               -- 'macon', 'fer-a-beton'
  libelle   text not null unique,           -- 'Maçon', 'Fer à béton'
  type      type_pro not null,
  domaine   text not null default 'BTP',    -- BTP en V1 ; 'Auto et moto', 'Maison' en V2
  icone     text,
  ordre     int not null default 100,
  actif     boolean not null default true
);

-- ---------------------------------------------------------------------
-- 6. Professionnels (feuille « Annuaire »)
-- ---------------------------------------------------------------------
create table professionnels (
  id                    text primary key,              -- A  "ID-001"
  nom                   text not null,                 -- B
  type                  type_pro not null,             -- C
  metier                text not null,                 -- D  Métier / produits (texte libre de l'Excel)
  metier_slug           text references metiers(slug) on update cascade, -- rattachement à la grille
  quartier              text,                          -- E  quartier où il est installé
  quartiers_intervention text[] not null default '{}', -- quartiers où il intervient (filtre V1-02)
  telephone             text,                          -- F  +228 XX XX XX XX
  whatsapp              text,                          -- G
  source                text,                          -- H
  date_premier_contact  date,                          -- I
  statut                statut_pro not null default 'À appeler', -- J
  piece_identite        oui_non,                       -- K  vérifiée oui / non (le numéro n'est jamais stocké ici)
  carte_artisan_rccm    text,                          -- L
  atelier_visite        oui_non,                       -- M
  chantier_ref_1        text,                          -- N  (contacts clients : jamais publics)
  chantier_ref_2        text,                          -- O
  chantier_ref_3        text,                          -- P
  nb_chantiers_vus      int,                           -- Q
  photos_lien           text,                          -- R
  nb_clients_appeles    int,                           -- S
  avis_clients          text,                          -- T
  charte_signee         oui_non,                       -- V
  ajoute_whatsapp       oui_non,                       -- W
  date_verification     date,                          -- X
  prochaine_reverif     date generated always as ((date_verification + interval '6 months')::date) stored, -- Y
  verifie_par           text,                          -- Z
  remarques             text,                          -- AA
  domaine               text not null default 'BTP',   -- AB
  ville                 text,                          -- AC
  axe                   text,                          -- AD
  point_repere          text,                          -- AE
  latitude              numeric(8,5) check (latitude between 6.0 and 11.2),   -- AF
  longitude             numeric(8,5) check (longitude between -0.2 and 1.9),  -- AG
  rayon_km              int,                           -- AI
  depannage_route       oui_non,                       -- AJ
  service_domicile      oui_non,                       -- AK
  horaires              text,                          -- AL
  urgences_nuit         oui_non,                       -- AM
  -- Ajouts V1
  annees_experience     int check (annees_experience between 0 and 80),
  description           text,                          -- présentation courte affichée sur la fiche
  livraison             oui_non,                       -- fournisseur : livre ou non
  zone_livraison        text,
  publication_proposee  boolean not null default false, -- le vérificateur propose, l'admin publie
  retrait_badge_propose boolean not null default false, -- posé à la 2e plainte fondée
  recherche             text generated always as (
                          public.normaliser(nom || ' ' || metier || ' ' || coalesce(quartier, '') || ' ' || coalesce(ville, ''))
                        ) stored,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index professionnels_recherche_trgm on professionnels using gin (recherche extensions.gin_trgm_ops);
create index professionnels_metier on professionnels (metier_slug);

-- Feuille « Notation » : la note publique en découle
create table notations (
  professionnel_id   text primary key references professionnels(id) on delete cascade,
  qualite_travail    smallint check (qualite_travail between 1 and 5),
  respect_delais     smallint check (respect_delais between 1 and 5),
  avis_clients       smallint check (avis_clients between 1 and 5),
  clarte_prix        smallint check (clarte_prix between 1 and 5),
  reactivite         smallint check (reactivite between 1 and 5),
  note_mini          smallint generated always as (least(qualite_travail, respect_delais, avis_clients, clarte_prix, reactivite)) stored,
  note_moyenne       numeric(2,1) generated always as (round((qualite_travail + respect_delais + avis_clients + clarte_prix + reactivite) / 5.0, 1)) stored,
  -- « Retenir » suggéré si moyenne ≥ 3,5 et aucun critère sous 3 (V1-07)
  retenir_suggere    boolean generated always as (
                       round((qualite_travail + respect_delais + avis_clients + clarte_prix + reactivite) / 5.0, 1) >= 3.5
                       and least(qualite_travail, respect_delais, avis_clients, clarte_prix, reactivite) >= 3) stored,
  commentaire        text,
  updated_at         timestamptz not null default now()
);

-- Photos de réalisations (bucket Supabase Storage « photos », compressées avant envoi)
create table photos (
  id                bigint generated always as identity primary key,
  professionnel_id  text not null references professionnels(id) on delete cascade,
  chemin            text not null,          -- chemin dans le bucket
  legende           text,
  ordre             int not null default 0,
  created_at        timestamptz not null default now()
);

-- Feuille « Tarifs » : prix indicatifs des artisans (main-d'œuvre), en fourchette
create table tarifs (
  id                 bigint generated always as identity primary key,
  professionnel_id   text not null references professionnels(id) on delete cascade,
  service            text not null,
  unite              text,
  prix_min           int check (prix_min >= 0),
  prix_max           int check (prix_max >= 0),
  frais_deplacement  int check (frais_deplacement >= 0),
  date_releve        date,
  source_prix        text,
  remarques          text,
  check (prix_max is null or prix_min is null or prix_max >= prix_min),
  unique (professionnel_id, service)
);

-- ---------------------------------------------------------------------
-- 7. Prix des matériaux (V1-04)
-- ---------------------------------------------------------------------
create table materiaux (
  id          bigint generated always as identity primary key,
  slug        text not null unique,          -- 'ciment-cpj45-50kg'
  nom         text not null,                 -- 'Ciment'
  variante    text,                          -- 'CPJ 45'
  unite_achat text not null,                 -- 'sac de 50 kg', 'barre de 12 m', 'm³'
  ordre       int not null default 100,
  actif       boolean not null default true,
  unique (nom, variante, unite_achat)
);

-- Un prix par fournisseur, matériau et semaine (la semaine commence le lundi)
create table releves_prix (
  id               bigint generated always as identity primary key,
  materiau_id      bigint not null references materiaux(id) on delete restrict,
  professionnel_id text   not null references professionnels(id) on delete cascade,
  prix             int    not null check (prix > 0),
  livraison        oui_non,
  frais_livraison  int check (frais_livraison >= 0),
  date_releve      date   not null default current_date,
  semaine          date   generated always as (date_trunc('week', date_releve::timestamp)::date) stored,
  saisi_par        uuid references auth.users(id) default auth.uid(),
  remarques        text,
  created_at       timestamptz not null default now(),
  unique (materiau_id, professionnel_id, semaine)
);
create index releves_prix_materiau_date on releves_prix (materiau_id, date_releve desc);

-- ---------------------------------------------------------------------
-- 8. Calculateur (V1-05) : formules versionnées, calculs anonymes, codes SLK
-- ---------------------------------------------------------------------
create table parametres_calculateur (
  version       int primary key,
  coefficients  jsonb not null,             -- voir src/lib/calculateur.ts pour la structure
  notes         text,
  valide_par    text,                       -- ingénieur qui a validé les 10 cas de test
  valide_le     date,
  actif         boolean not null default false,
  created_by    uuid references auth.users(id) default auth.uid(),
  created_at    timestamptz not null default now()
);
create unique index un_seul_calculateur_actif on parametres_calculateur (actif) where actif;

create table calculs (
  id             uuid primary key default gen_random_uuid(),
  version        int not null references parametres_calculateur(version),
  type_ouvrage   text not null,             -- 'piece', 'dalle', 'mur_cloture'
  entrees        jsonb not null,
  resultats      jsonb not null,
  created_at     timestamptz not null default now()
);

-- Code SLK : non devinable (6 caractères parmi 31, sans 0/O/1/I/L), lié à un calcul
create or replace function public.nouveau_code_slk()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  octets bytea := extensions.gen_random_bytes(6);
  code text := 'SLK-';
begin
  for i in 0..5 loop
    code := code || substr(alphabet, 1 + (get_byte(octets, i) % 31), 1);
  end loop;
  return code;
end $$;

create table codes_servilink (
  code            text primary key default public.nouveau_code_slk(),
  calcul_id       uuid references calculs(id) on delete set null,
  fournisseur_id  text references professionnels(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table ventes_declarees (
  id              bigint generated always as identity primary key,
  code            text not null references codes_servilink(code),
  fournisseur_id  text not null references professionnels(id),
  montant         int  not null check (montant >= 0),
  date_vente      date not null,
  statut          text not null default 'déclarée' check (statut in ('déclarée', 'contrôlée', 'rejetée')),
  controle_notes  text,
  saisi_par       uuid references auth.users(id) default auth.uid(),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9. Relation client : demandes, avis, plaintes (conseiller WhatsApp)
-- ---------------------------------------------------------------------
create table demandes (
  id                bigint generated always as identity primary key,
  client_whatsapp   text,                  -- seule donnée qui identifie le client
  besoin            text not null,
  metier_slug       text references metiers(slug),
  quartier          text,
  professionnel_id  text references professionnels(id) on delete set null, -- pro mis en relation
  statut            text not null default 'nouvelle' check (statut in ('nouvelle', 'mise en relation', 'terminée', 'sans suite')),
  notes             text,
  conseiller        uuid references auth.users(id) default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table avis (
  id                bigint generated always as identity primary key,
  professionnel_id  text not null references professionnels(id) on delete cascade,
  demande_id        bigint references demandes(id) on delete set null,
  qualite_travail   smallint check (qualite_travail between 1 and 5),
  respect_delais    smallint check (respect_delais between 1 and 5),
  avis_clients      smallint check (avis_clients between 1 and 5),
  clarte_prix       smallint check (clarte_prix between 1 and 5),
  reactivite        smallint check (reactivite between 1 and 5),
  commentaire       text,
  prenom_client     text,                  -- affiché « Afi K. », jamais le numéro
  statut            text not null default 'à valider' check (statut in ('à valider', 'publié', 'rejeté')),
  created_at        timestamptz not null default now()
);

create table plaintes (
  id                bigint generated always as identity primary key,
  professionnel_id  text not null references professionnels(id) on delete cascade,
  demande_id        bigint references demandes(id) on delete set null,
  description       text not null,
  fondee            oui_non not null default 'En attente',
  decision          text,
  created_at        timestamptz not null default now()
);

-- À la 2e plainte fondée, on propose le retrait du badge à l'administrateur (V1-07)
create or replace function public.verifier_plaintes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.fondee = 'Oui' and (select count(*) from plaintes where professionnel_id = new.professionnel_id and fondee = 'Oui') >= 2 then
    update professionnels set retrait_badge_propose = true where id = new.professionnel_id;
  end if;
  return new;
end $$;
create trigger plaintes_retrait_badge after insert or update of fondee on plaintes
  for each row execute function public.verifier_plaintes();

-- ---------------------------------------------------------------------
-- 10. Encarts sponsorisés (V1-08) et comptage des clics (V1-06)
-- ---------------------------------------------------------------------
create table sponsorises (
  id           bigint generated always as identity primary key,
  annonceur    text not null,
  emplacement  emplacement_sponso not null,
  metier_slug  text references metiers(slug),  -- pour l'emplacement liste_metier
  titre        text not null,
  texte        text,
  image        text,
  lien         text not null,
  debut        date not null,
  fin          date not null,
  actif        boolean not null default true,
  created_at   timestamptz not null default now(),
  check (fin >= debut)
);

-- Compteurs agrégés par jour, sans aucune donnée personnelle
create table evenements (
  jour    date not null default current_date,
  type    text not null check (type in ('vue_fiche', 'whatsapp', 'appel', 'envoi_liste', 'demande_servilink',
                                        'affichage_sponso', 'clic_sponso', 'calcul')),
  cible   text not null default '',          -- ID de fiche, id d'encart, type d'ouvrage…
  nombre  int  not null default 0,
  primary key (jour, type, cible)
);

-- ---------------------------------------------------------------------
-- 11. Journal des modifications (qui, quoi, quand), gardé 2 ans
-- ---------------------------------------------------------------------
create table journal (
  id         bigint generated always as identity primary key,
  quand      timestamptz not null default now(),
  qui        uuid default auth.uid(),
  table_nom  text not null,
  ligne_id   text,
  action     text not null,
  avant      jsonb,
  apres      jsonb
);
create index journal_quand on journal (quand);

create or replace function public.journaliser() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ligne jsonb := to_jsonb(coalesce(new, old));
begin
  insert into journal (table_nom, ligne_id, action, avant, apres)
  values (tg_table_name,
          coalesce(ligne ->> 'id', ligne ->> 'professionnel_id', ligne ->> 'code', ligne ->> 'cle', ligne ->> 'version', ligne ->> 'slug', ligne ->> 'user_id'),
          lower(tg_op),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create or replace function public.maj_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['professionnels', 'notations', 'photos', 'tarifs', 'materiaux', 'releves_prix',
                           'parametres_calculateur', 'ventes_declarees', 'demandes', 'avis', 'plaintes',
                           'sponsorises', 'equipe', 'parametres', 'metiers'] loop
    execute format('create trigger %I after insert or update or delete on %I for each row execute function public.journaliser()',
                   t || '_journal', t);
  end loop;
  foreach t in array array['professionnels', 'notations', 'demandes', 'parametres'] loop
    execute format('create trigger %I before update on %I for each row execute function public.maj_updated_at()',
                   t || '_updated_at', t);
  end loop;
end $$;

-- Seul l'administrateur publie une fiche (passe au statut Retenu) (chapitre 03)
create or replace function public.controler_publication() returns trigger
language plpgsql as $$
begin
  if new.statut = 'Retenu' and (tg_op = 'INSERT' or old.statut is distinct from 'Retenu')
     and auth.uid() is not null and not public.a_role('admin') then
    raise exception 'Seul un administrateur peut publier une fiche (statut Retenu). Utilisez « Proposer la publication ».'
      using errcode = '42501';
  end if;
  if new.statut = 'Retenu' then
    new.publication_proposee := false;
  end if;
  return new;
end $$;
create trigger professionnels_publication before insert or update of statut on professionnels
  for each row execute function public.controler_publication();
-- Remarque : auth.uid() est null pour l'import fait par le propriétaire de la base (éditeur SQL),
-- qui garde donc le droit d'importer des fiches déjà Retenues.

-- ---------------------------------------------------------------------
-- 12. Vues publiques (le public ne lit que ça)
--     Les vues s'exécutent avec les droits de leur propriétaire : elles
--     filtrent elles-mêmes et ne sortent que des colonnes non sensibles.
-- ---------------------------------------------------------------------
create view annuaire_public as
select p.id, p.nom, p.type, p.metier, p.metier_slug, p.quartier, p.quartiers_intervention,
       p.whatsapp, p.telephone, p.description, p.annees_experience,
       p.date_verification, p.nb_chantiers_vus, p.nb_clients_appeles,
       -- Bloc « Ce que nous avons vérifié » : des oui / non, jamais les numéros
       (p.piece_identite = 'Oui') as identite_verifiee,
       (p.carte_artisan_rccm is not null) as carte_ou_rccm_verifie,
       (p.atelier_visite = 'Oui') as atelier_visite,
       n.qualite_travail, n.respect_delais, n.avis_clients as note_avis_clients, n.clarte_prix, n.reactivite, n.note_moyenne,
       p.livraison, p.zone_livraison,
       p.domaine, p.ville, p.axe, p.point_repere, p.latitude, p.longitude, p.rayon_km,
       p.depannage_route, p.service_domicile, p.horaires, p.urgences_nuit,
       (select ph.chemin from photos ph where ph.professionnel_id = p.id order by ph.ordre, ph.id limit 1) as photo_principale,
       p.recherche
from professionnels p
left join notations n on n.professionnel_id = p.id
where p.statut = 'Retenu'
  and p.charte_signee = 'Oui'
  and p.date_verification is not null
  and p.prochaine_reverif >= current_date;   -- la fiche disparaît seule après 6 mois

create view photos_public as
select ph.professionnel_id, ph.chemin, ph.legende, ph.ordre
from photos ph where ph.professionnel_id in (select id from annuaire_public);

-- Tarifs des artisans : « ancien » après 14 jours, masqués après 30 (réglables)
create view tarifs_public as
select t.professionnel_id, t.service, t.unite, t.prix_min, t.prix_max, t.frais_deplacement, t.date_releve,
       (current_date - t.date_releve) > public.param_int('prix_jours_ancien', 14) as ancien
from tarifs t
where t.professionnel_id in (select id from annuaire_public)
  and t.date_releve is not null
  and (current_date - t.date_releve) <= public.param_int('prix_jours_masque', 30);

-- Dernier prix de chaque fournisseur visible, par matériau, avec les mêmes règles de fraîcheur
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

-- Prix moyen par matériau et par semaine (cette semaine vs précédente, calculé côté appli)
create view prix_moyens_semaine as
select r.materiau_id, r.semaine, round(avg(r.prix))::int as prix_moyen, count(*) as nb_releves
from releves_prix r
where r.professionnel_id in (select id from annuaire_public where type = 'Fournisseur')
  and r.semaine >= date_trunc('week', current_date - 56)::date
group by r.materiau_id, r.semaine;

create view metiers_public as
select slug, libelle, type, domaine, icone, ordre from metiers where actif;

create view parametres_public as
select cle, valeur from parametres where public;

create view calculateur_actif as
select version, coefficients from parametres_calculateur where actif;

create view sponsorises_actifs as
select id, annonceur, emplacement, metier_slug, titre, texte, image, lien
from sponsorises where actif and current_date between debut and fin;

-- ---------------------------------------------------------------------
-- 13. Fonctions publiques (RPC)
-- ---------------------------------------------------------------------

-- Recherche de l'annuaire (V1-02) : texte sans accents ni pluriel, filtres, tri, pages de 20
create or replace function public.rechercher_annuaire(
  q           text default null,
  p_type      type_pro default null,
  p_metier    text default null,
  p_quartier  text default null,
  p_tri       text default 'note',        -- 'note' | 'experience' | 'distance'
  p_lat       numeric default null,
  p_lng       numeric default null,
  p_page      int default 1,
  p_domaine   text default 'BTP'
) returns table (
  id text, nom text, type type_pro, metier text, metier_slug text, quartier text,
  note_moyenne numeric, annees_experience int, nb_chantiers_vus int, date_verification date,
  photo_principale text, whatsapp text, telephone text, distance_km numeric, total bigint
) language sql stable security definer set search_path = public as $$
  with filtre as (
    select a.*,
           case when p_lat is not null and p_lng is not null and a.latitude is not null then
             round((6371 * 2 * asin(sqrt(
               power(sin(radians(a.latitude - p_lat) / 2), 2) +
               cos(radians(p_lat)) * cos(radians(a.latitude)) * power(sin(radians(a.longitude - p_lng) / 2), 2)
             )))::numeric, 1)
           end as distance_km
    from annuaire_public a
    where a.domaine = p_domaine
      and (p_type is null or a.type = p_type)
      and (p_metier is null or a.metier_slug = p_metier)
      and (p_quartier is null
           or normaliser(a.quartier) = normaliser(p_quartier)
           or normaliser(p_quartier) = any (select normaliser(x) from unnest(a.quartiers_intervention) x))
      and (q is null or btrim(q) = '' or not exists (
             -- chaque mot de la recherche doit se retrouver dans la fiche ou ses quartiers d'intervention
             select 1 from regexp_split_to_table(normaliser(q), ' ') mot
             where mot <> ''  -- début de mot : « be » trouve Bè mais pas béton
               and position(' ' || mot in ' ' || a.recherche || ' ' || normaliser(array_to_string(a.quartiers_intervention, ' '))) = 0))
  )
  select f.id, f.nom, f.type, f.metier, f.metier_slug, f.quartier, f.note_moyenne, f.annees_experience,
         f.nb_chantiers_vus, f.date_verification, f.photo_principale, f.whatsapp, f.telephone,
         f.distance_km, count(*) over () as total
  from filtre f
  order by
    case when p_tri = 'distance' then f.distance_km end asc nulls last,
    case when p_tri = 'experience' then f.annees_experience end desc nulls last,
    f.note_moyenne desc nulls last, f.nb_chantiers_vus desc nulls last, f.nom
  limit 20 offset greatest(p_page - 1, 0) * 20
$$;

-- Compter un clic, une vue ou un affichage (V1-06), sans donnée personnelle
create or replace function public.compter(p_type text, p_cible text default '')
returns void language sql volatile security definer set search_path = public as $$
  insert into evenements (jour, type, cible, nombre) values (current_date, p_type, coalesce(left(p_cible, 64), ''), 1)
  on conflict (jour, type, cible) do update set nombre = evenements.nombre + 1
$$;

-- Enregistrer un calcul et créer son code SLK (bouton « Envoyer ma liste »)
create or replace function public.enregistrer_calcul(
  p_version int, p_type_ouvrage text, p_entrees jsonb, p_resultats jsonb, p_fournisseur_id text default null
) returns text language plpgsql volatile security definer set search_path = public as $$
declare
  v_calcul uuid;
  v_code text;
begin
  if pg_column_size(p_entrees) + pg_column_size(p_resultats) > 8000 then
    raise exception 'Calcul trop volumineux';
  end if;
  if p_fournisseur_id is not null and not exists (select 1 from annuaire_public where id = p_fournisseur_id and type = 'Fournisseur') then
    p_fournisseur_id := null;
  end if;
  insert into calculs (version, type_ouvrage, entrees, resultats)
  values (p_version, left(p_type_ouvrage, 32), p_entrees, p_resultats) returning id into v_calcul;
  loop
    begin
      insert into codes_servilink (calcul_id, fournisseur_id) values (v_calcul, p_fournisseur_id) returning code into v_code;
      exit;
    exception when unique_violation then
      -- collision très improbable : on retire un code
    end;
  end loop;
  perform compter('envoi_liste', coalesce(p_fournisseur_id, ''));
  return v_code;
end $$;

-- ---------------------------------------------------------------------
-- 14. Sécurité : RLS et droits
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon, public;

do $$
declare t text;
begin
  foreach t in array array['equipe', 'parametres', 'metiers', 'professionnels', 'notations', 'photos', 'tarifs',
                           'materiaux', 'releves_prix', 'parametres_calculateur', 'calculs', 'codes_servilink',
                           'ventes_declarees', 'demandes', 'avis', 'plaintes', 'sponsorises', 'evenements', 'journal'] loop
    execute format('alter table %I enable row level security', t);
    -- Toute l'équipe lit (sauf journal et equipe, traités à part)
    if t not in ('journal', 'equipe') then
      execute format('create policy %I on %I for select to authenticated using (public.est_equipe())', t || '_lecture', t);
    end if;
  end loop;
end $$;

-- Qui écrit quoi (chapitre 03)
create policy equipe_lecture on equipe for select to authenticated using (user_id = auth.uid() or public.a_role('admin'));
create policy equipe_admin   on equipe for all    to authenticated using (public.a_role('admin')) with check (public.a_role('admin'));
create policy journal_admin  on journal for select to authenticated using (public.a_role('admin'));

create policy parametres_admin on parametres for all to authenticated using (public.a_role('admin')) with check (public.a_role('admin'));
create policy metiers_admin    on metiers    for all to authenticated using (public.a_role('admin')) with check (public.a_role('admin'));
create policy materiaux_admin  on materiaux  for all to authenticated using (public.a_role('admin')) with check (public.a_role('admin'));
create policy calc_admin       on parametres_calculateur for all to authenticated using (public.a_role('admin')) with check (public.a_role('admin'));
create policy sponso_admin     on sponsorises for all to authenticated using (public.a_role('admin')) with check (public.a_role('admin'));

-- Fiches, notation, photos, tarifs : administrateur et vérificateur terrain (suppression : admin seul)
create policy pro_ecriture  on professionnels for insert to authenticated with check (public.a_role('admin', 'verificateur'));
create policy pro_modif     on professionnels for update to authenticated using (public.a_role('admin', 'verificateur')) with check (public.a_role('admin', 'verificateur'));
create policy pro_suppr     on professionnels for delete to authenticated using (public.a_role('admin'));
create policy notations_ecr on notations for all to authenticated using (public.a_role('admin', 'verificateur')) with check (public.a_role('admin', 'verificateur'));
create policy photos_ecr    on photos    for all to authenticated using (public.a_role('admin', 'verificateur')) with check (public.a_role('admin', 'verificateur'));
create policy tarifs_ecr    on tarifs    for all to authenticated using (public.a_role('admin', 'verificateur')) with check (public.a_role('admin', 'verificateur'));

-- Relevés de prix : administrateur et enquêteur
create policy releves_ecr on releves_prix for all to authenticated using (public.a_role('admin', 'enqueteur')) with check (public.a_role('admin', 'enqueteur'));

-- Relation client : administrateur et conseiller WhatsApp
create policy demandes_ecr on demandes for all to authenticated using (public.a_role('admin', 'conseiller')) with check (public.a_role('admin', 'conseiller'));
create policy avis_ecr     on avis     for all to authenticated using (public.a_role('admin', 'conseiller')) with check (public.a_role('admin', 'conseiller'));
create policy plaintes_ecr on plaintes for all to authenticated using (public.a_role('admin', 'conseiller')) with check (public.a_role('admin', 'conseiller'));
create policy ventes_ecr   on ventes_declarees for all to authenticated using (public.a_role('admin', 'conseiller')) with check (public.a_role('admin', 'conseiller'));

-- Ce que le public peut lire et appeler
grant select on annuaire_public, photos_public, tarifs_public, prix_materiaux_public, prix_moyens_semaine,
                metiers_public, parametres_public, calculateur_actif, sponsorises_actifs to anon, authenticated;
grant execute on function public.rechercher_annuaire(text, type_pro, text, text, text, numeric, numeric, int, text) to anon, authenticated;
grant execute on function public.compter(text, text) to anon, authenticated;
grant execute on function public.enregistrer_calcul(int, text, jsonb, jsonb, text) to anon, authenticated;
grant execute on function public.normaliser(text), public.param_int(text, int), public.nouveau_code_slk() to anon, authenticated;
grant execute on function public.mon_role(), public.a_role(role_equipe[]), public.est_equipe() to authenticated;
