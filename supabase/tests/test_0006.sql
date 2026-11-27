-- Tests de la migration 0006 (comptes de l'équipe)
\set QUIET on
reset role;
insert into auth.users values ('aaaaaaaa-0000-0000-0000-000000000001', 'patron@exemple.tg'), ('aaaaaaaa-0000-0000-0000-000000000002', 'Collegue@Exemple.tg');
insert into equipe (user_id, nom, role) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Admin', 'admin');
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
select 'admin ajoute un collègue par son e-mail', public.ajouter_membre('collegue@exemple.tg', 'Collègue', 'verificateur') is not null;
select 'équipe vue par l''admin', nom, email, role from public.liste_equipe() order by nom;
do $$ begin perform public.ajouter_membre('inconnu@exemple.tg', 'X Y', 'conseiller'); raise exception 'compte inexistant accepté';
exception when raise_exception then if sqlerrm <> 'compte_introuvable' then raise; end if; end $$;
select 'compte inexistant refusé (ok)';
do $$ begin perform public.retirer_membre('aaaaaaaa-0000-0000-0000-000000000001'); raise exception 'l''admin s''est retiré';
exception when raise_exception then if sqlerrm <> 'pas_soi_meme' then raise; end if; end $$;
select 'l''admin ne peut pas se retirer (ok)';
-- Le collègue (vérificateur) ne peut pas ajouter quelqu'un
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000002';
do $$ begin perform public.ajouter_membre('patron@exemple.tg', 'Pirate', 'admin'); raise exception 'un non-admin a ajouté un membre';
exception when insufficient_privilege then null; end $$;
select 'non-admin refusé (ok)', public.mon_role();
reset role;
