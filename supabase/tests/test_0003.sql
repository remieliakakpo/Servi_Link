-- Tests de la migration 0003 (après test_v1 et test_0002)
\set QUIET on
reset role;
update professionnels set livraison = 'Oui', langues = 'Français, Mina' where id = 'ID-002';
insert into avis (professionnel_id, qualite_travail, respect_delais, avis_clients, clarte_prix, reactivite, commentaire, prenom_client, statut)
values ('ID-001', 5, 5, 5, 5, 4, 'Travail propre', 'D.J.', 'publié'), ('ID-001', 1, 1, 1, 1, 1, 'En attente', 'X.', 'à valider');
set role anon;
select 'référence', id, reference from annuaire_public order by id;
select 'nb_avis (1 publié sur 2)', nb_avis from annuaire_public where id = 'ID-001';
select 'avis_public', prenom_client, note from avis_public;
select 'prix de départ / produits', id, prix_depart, nb_produits from rechercher_annuaire() order by id;
select 'plusieurs métiers', id from rechercher_annuaire(p_metiers => array['macon', 'quincaillerie']) order by id;
select 'un métier', id from rechercher_annuaire(p_metiers => array['macon']);
select 'livre à domicile', id from rechercher_annuaire(p_livraison => true);
select 'total pour « Voir N résultats »', total from rechercher_annuaire(p_par_page => 1) limit 1;
reset role;
