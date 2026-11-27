-- Tests de la migration 0004 (Vitrine)
\set QUIET on
reset role;
insert into auth.users values ('11111111-1111-1111-1111-111111111111');
insert into realisations (id, professionnel_id, type, chemin, statut, publie_le) values
  ('R1', 'ID-001', 'photo', 'ID-001/R1.jpg', 'en_ligne', now()),
  ('R2', 'ID-001', 'video', 'ID-001/R2.mp4', 'a_verifier', null),
  ('R3', 'ID-001', 'photo', 'ID-001/R3.jpg', 'refusee', null);
set role anon;
select 'fil public : seulement en ligne, avec le pro', id, pro_id, reference from vitrine_public order by id;
select 'anon : aucune ligne de la table (RLS)', count(*) from realisations;
-- Un pro connecté publie depuis l'appli : accepté à vérifier, refusé s'il tente de publier lui-même
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into realisations (id, type, chemin, source, envoyeur_nom, envoyeur_tel) values ('R4', 'video', 'envois/11111111-1111-1111-1111-111111111111/R4.mp4', 'appli', 'Atelier', '+228 90 00 00 00');
select 'le pro voit son envoi (et seulement lui)', id, statut from realisations order by id;
do $$ begin
  insert into realisations (id, professionnel_id, type, chemin, source, statut, publie_le) values ('R5', 'ID-001', 'photo', 'x', 'appli', 'en_ligne', now());
  raise exception 'un pro ne doit pas publier directement';
exception when insufficient_privilege then null;
end $$;
select 'publication directe par un pro refusée (ok)';
do $$ begin
  insert into realisations (id, type, chemin, source) values ('R6', 'photo', 'ID-001/R1.jpg', 'appli');
  raise exception 'un pro ne doit pas pointer vers le fichier d''un autre';
exception when insufficient_privilege then null;
end $$;
select 'chemin hors de son dossier refusé (ok)';
do $$ begin
  for i in 1..19 loop
    insert into realisations (id, type, chemin, source) values ('RL' || i, 'photo', 'envois/11111111-1111-1111-1111-111111111111/L' || i || '.jpg', 'appli');
  end loop;
  insert into realisations (id, type, chemin, source) values ('RL20', 'photo', 'envois/11111111-1111-1111-1111-111111111111/L20.jpg', 'appli');
  raise exception 'le 21e envoi du jour doit être refusé';
exception when raise_exception then
  if sqlerrm <> 'limite_envois' then raise; end if;
end $$;
select 'limite de 20 envois par jour (ok)', count(*) from realisations;
insert into realisations (id, type, chemin, vignette, source) values ('RB', 'video', 'bunny/0a1b2c3d-0000-4000-8000-00000000abcd', 'bunny/0a1b2c3d-0000-4000-8000-00000000abcd/thumbnail.jpg', 'appli');
select 'vidéo Bunny acceptée', count(*) from realisations where id = 'RB';
reset role;
reset request.jwt.claim.sub;
do $$ begin
  update realisations set statut = 'en_ligne' where id = 'R4';
  raise exception 'une réalisation sans fiche ne doit pas passer en ligne';
exception when check_violation then null;
end $$;
select 'en ligne sans fiche refusé (ok)';
