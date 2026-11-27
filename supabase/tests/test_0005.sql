-- Tests de la migration 0005 (anti-abus)
\set QUIET on
set role anon;
select 'calcul partagé accepté', length(public.enregistrer_calcul(1, 'poteaux', '{}'::jsonb, '{}'::jsonb)) > 0;
do $$ begin
  perform public.enregistrer_calcul(1, 'n''importe quoi', '{}'::jsonb, '{}'::jsonb);
  raise exception 'un ouvrage inconnu doit être refusé';
exception when raise_exception then if sqlerrm <> 'ouvrage_inconnu' then raise; end if;
end $$;
select 'ouvrage inconnu refusé (ok)';
select public.compter('calcul', 'piece'); select public.compter('calcul', 'piece');
reset role;
select 'compteur cumulé', nombre from evenements where type = 'calcul' and cible = 'piece' and jour = current_date;
insert into evenements (jour, type, cible, nombre) select current_date, 'vue_fiche', 'X' || g, 1 from generate_series(1, 20000) g;
set role anon;
select public.compter('vue_fiche', 'robot-123');
select public.compter('calcul', 'piece');
reset role;
select 'cible inventée ignorée au-delà de 20 000 lignes', count(*) = 0 from evenements where cible = 'robot-123';
select 'les vraies cibles comptent toujours', nombre from evenements where type = 'calcul' and cible = 'piece' and jour = current_date;
