-- Tests de la migration 0002 (à lancer après test_v1.sql, qui a créé ID-001 et ID-002)
\set QUIET on
set role anon;
select 'quartiers_public', count(*) >= 10 as ok from quartiers_public;
-- ID-002 a un GPS ; on retire celui d'ID-001 pour vérifier le repli sur le centre du quartier (Agoè)
reset role;
update professionnels set latitude = null, longitude = null where id = 'ID-001';
set role anon;
select 'position de secours (Agoè)', id, latitude, longitude, position_approx
from rechercher_annuaire(p_par_page => 500) order by id;
select 'autour de moi depuis Hédzranawoé', id, distance_km
from rechercher_annuaire(p_tri => 'distance', p_lat => 6.16, p_lng => 1.245);
do $$ begin
  perform * from favoris;
  raise exception 'ÉCHEC : anon lit les favoris';
exception when insufficient_privilege then raise notice 'OK : anon ne lit pas les favoris';
end $$;

-- Un client (pas dans l'équipe) : ses favoris et ses demandes seulement
reset role;
insert into auth.users values ('00000000-0000-0000-0000-0000000000c1'), ('00000000-0000-0000-0000-0000000000c2');
insert into demandes (besoin, client_id, professionnel_id) values ('Un maçon pour un mur', '00000000-0000-0000-0000-0000000000c1', 'ID-001'),
                                                                 ('Autre client', '00000000-0000-0000-0000-0000000000c2', null);
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
insert into favoris (professionnel_id) values ('ID-001');
insert into clients (nom) values ('Afi');
select 'mes_favoris', id, nom from mes_favoris;
select 'mes_demandes (1 seule)', besoin, professionnel from mes_demandes;
select 'client ne lit pas les fiches internes', count(*) = 0 as ok from professionnels;
select 'client ne lit pas toutes les demandes', count(*) = 0 as ok from demandes;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
select 'autre client ne voit pas les favoris du 1er', count(*) = 0 as ok from mes_favoris;
reset role;
