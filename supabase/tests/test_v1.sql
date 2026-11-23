-- Tests du schéma V1 : psql -v ON_ERROR_STOP=1 -f test_v1.sql (après stub + migration + seed)
\set QUIET on
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'),
                              ('00000000-0000-0000-0000-00000000000c'), ('00000000-0000-0000-0000-00000000000d');
insert into equipe (user_id, nom, role) values
  ('00000000-0000-0000-0000-00000000000a', 'Admin', 'admin'),
  ('00000000-0000-0000-0000-00000000000b', 'Vérif', 'verificateur'),
  ('00000000-0000-0000-0000-00000000000c', 'Enquêteur', 'enqueteur'),
  ('00000000-0000-0000-0000-00000000000d', 'Conseiller', 'conseiller');

-- 1. Le vérificateur crée une fiche mais ne peut pas la publier
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
insert into professionnels (id, nom, type, metier, metier_slug, quartier, quartiers_intervention, whatsapp, telephone,
  statut, piece_identite, carte_artisan_rccm, charte_signee, date_verification, annees_experience, latitude, longitude)
values ('ID-001', 'Kossi Maçonnerie', 'Artisan', 'Maçon', 'macon', 'Agoè', '{Adidogomé,"Bè"}', '+228 90 11 22 33', '+228 90 11 22 33',
        'Visité – à noter', 'Oui', 'CA-12345', 'Oui', current_date - 10, 12, 6.2100, 1.2000),
       ('ID-002', 'Ets Fer Plus', 'Fournisseur', 'Fer à béton, ciment', 'quincaillerie', 'Hédzranawoé', '{}', '+228 91 00 00 01', null,
        'Visité – à noter', 'Oui', 'RCCM-1', 'Oui', current_date - 3, null, 6.1500, 1.2300),
       ('ID-003', 'Quincaillerie Ancienne', 'Fournisseur', 'Ciment', 'quincaillerie', 'Bè', '{}', '+228 92 00 00 02', null,
        'Visité – à noter', 'Oui', null, 'Oui', current_date - 200, null, null, null);
insert into notations (professionnel_id, qualite_travail, respect_delais, avis_clients, clarte_prix, reactivite)
values ('ID-001', 5, 4, 5, 4, 4), ('ID-002', 3, 2, 4, 5, 5);
select 'retenir_suggere', professionnel_id, note_moyenne, retenir_suggere from notations order by 2;
do $$ begin
  update professionnels set statut = 'Retenu' where id = 'ID-001';
  raise exception 'ÉCHEC : le vérificateur a pu publier';
exception when insufficient_privilege then raise notice 'OK : publication refusée au vérificateur';
end $$;
update professionnels set publication_proposee = true where id = 'ID-001';

-- 2. L'enquêteur ne peut pas modifier une fiche (RLS : 0 ligne touchée), mais saisit les prix
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
update professionnels set nom = 'piraté' where id = 'ID-001';
select 'enqueteur_modif_fiche', count(*) filter (where nom = 'piraté') = 0 as ok from professionnels;
do $$ begin
  insert into notations (professionnel_id, qualite_travail) values ('ID-003', 5);
  raise exception 'ÉCHEC : l''enquêteur a pu noter';
exception when insufficient_privilege then raise notice 'OK : notation refusée à l''enquêteur';
end $$;
insert into releves_prix (materiau_id, professionnel_id, prix, livraison, date_releve)
select id, 'ID-002', 5250, 'Oui'::oui_non, current_date - 2 from materiaux where slug = 'ciment-cpj45-50kg'
union all select id, 'ID-003', 5100, 'Non', current_date - 1 from materiaux where slug = 'ciment-cpj45-50kg'
union all select id, 'ID-002', 4300, 'Oui', current_date - 20 from materiaux where slug = 'fer-ha10-12m'
union all select id, 'ID-002', 30000, 'Oui', current_date - 40 from materiaux where slug = 'gravier-5-15';

-- 3. L'admin publie
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update professionnels set statut = 'Retenu' where id in ('ID-001', 'ID-002', 'ID-003');
select 'publication_proposee remise à zéro', publication_proposee = false as ok from professionnels where id = 'ID-001';
insert into tarifs (professionnel_id, service, unite, prix_min, prix_max, date_releve) values
  ('ID-001', 'Élévation de mur en agglos', 'm²', 2500, 3500, current_date - 5),
  ('ID-001', 'Coulage de dalle', 'm²', 4000, 6000, current_date - 45);

-- 4. Ce que voit le public
reset request.jwt.claim.sub;
set role anon;
select 'annuaire_public (ID-003 vérifié il y a 200 j donc masqué)', string_agg(id, ',' order by id) from annuaire_public;
do $$ begin
  perform * from professionnels;
  raise exception 'ÉCHEC : anon lit la table professionnels';
exception when insufficient_privilege then raise notice 'OK : anon ne lit pas les tables';
end $$;
do $$ begin
  perform carte_artisan_rccm from annuaire_public;
  raise exception 'ÉCHEC : colonne sensible exposée';
exception when undefined_column then raise notice 'OK : pas de numéro de carte dans la vue publique';
end $$;
select 'tarifs_public (45 j masqué)', service, ancien from tarifs_public;
select 'prix_public', slug, fournisseur, prix, ancien, le_moins_cher from prix_materiaux_public order by slug, prix;
select 'recherche « macons agoe »', id from rechercher_annuaire('macons agoe');
select 'recherche « MAÇON be » (quartier d''intervention)', id from rechercher_annuaire('MAÇON be');
select 'filtre quartier Adidogomé', id from rechercher_annuaire(p_quartier => 'adidogome');
select 'recherche « fer à béton »', id from rechercher_annuaire('fer à béton');
select 'recherche « be » = début de mot (Bè et béton)', id from rechercher_annuaire('be');
select 'tri distance depuis Agoè', id, distance_km from rechercher_annuaire(p_tri => 'distance', p_lat => 6.21, p_lng => 1.20);
select 'code SLK', enregistrer_calcul(1, 'dalle', '{"surface_m2": 20}', '{"ciment_sacs": 30}', 'ID-002') ~ '^SLK-[2-9A-HJKMNP-Z]{6}$' as ok;
do $$ begin
  insert into evenements (type, cible, nombre) values ('whatsapp', 'x', 1000);
  raise exception 'ÉCHEC : anon écrit directement dans evenements';
exception when insufficient_privilege then raise notice 'OK : anon passe par compter() seulement';
end $$;

-- 5. Plaintes : 2 fondées => retrait du badge proposé
reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
insert into plaintes (professionnel_id, description, fondee) values ('ID-001', 'Retard', 'Oui'), ('ID-001', 'Malfaçon', 'Oui');
select 'retrait_badge_propose', retrait_badge_propose as ok from professionnels where id = 'ID-001';

-- 6. Journal et compteurs (lus par l'équipe)
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select 'compteurs', type, cible, nombre from evenements;
select 'journal', table_nom, action, count(*) from journal group by 1,2,3 order by 2,3;
reset role;
