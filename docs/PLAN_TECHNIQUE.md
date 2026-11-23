# Plan technique V1 : le cœur BTP

Référence : cahier des charges indice D (livrables V1-01 à V1-09). Pas de délais ici : l'ordre seul compte.

## 1. Architecture

| Brique | Choix | Pourquoi |
|---|---|---|
| Application | Next.js 15 (App Router) + TypeScript, une seule appli publique + `/admin` | Pages rendues côté serveur : lisibles sans JavaScript, indexables par Google, légères en 3G. Un seul code pour le public et le back-office (D2). |
| Base | Supabase (PostgreSQL 15+, Auth, Storage) | Les règles métier critiques vivent dans la base : vues publiques filtrées, RLS par rôle, journal. L'appli ne peut pas « oublier » un filtre. |
| Hébergement | Vercel | Déploiement à chaque push, une préproduction par branche (recette R1). |
| Contact | Liens `wa.me` pré-remplis | D3 : pas d'API payante en V1. |
| Hors connexion | Service worker maison (`public/sw.js`) | Réseau d'abord pour les pages, copie en cache sinon ; 40 pages max. Pas de librairie PWA lourde. |
| Polices | Inter et Plus Jakarta Sans auto-hébergées (`@fontsource`) | Aucun appel à Google au chargement, le navigateur ne prend que le sous-ensemble latin. |

Version de Next.js : la 15.5 (stable, très documentée). Passage à la 16 possible plus tard sans refonte.

## 2. Données (supabase/migrations/0001_init.sql)

Le schéma testé (professionnels, notations, photos, tarifs) est repris tel quel et complété par les tables du chapitre 05 :

- **Équipe et droits** : `equipe` (rôle admin, vérificateur, enquêteur, conseiller), fonctions `mon_role()`, `a_role()`. Chaque table a la RLS ; la matrice de droits du chapitre 03 est codée dans les politiques.
- **Publication** : seul un admin passe une fiche à « Retenu » (déclencheur). Le vérificateur coche `publication_proposee`. La vue `annuaire_public` n'expose une fiche que si elle est Retenue, charte signée, vérifiée il y a moins de 6 mois : elle disparaît seule à 6 mois.
- **Notation** : `retenir_suggere` calculé (moyenne ≥ 3,5 et aucun critère < 3).
- **Recherche** : colonne `recherche` normalisée (sans accents, pluriels simples retirés) + index trigramme ; fonction `rechercher_annuaire()` avec filtres, quartiers d'intervention, tri note / expérience / distance, pages de 20.
- **Prix des matériaux** : `materiaux` (catalogue réglable), `releves_prix` (un prix par fournisseur, matériau et semaine). Vues `prix_materiaux_public` (dernier prix, « ancien » après 14 j, masqué après 30 j, « le moins cher ») et `prix_moyens_semaine`.
- **Calculateur** : `parametres_calculateur` versionné (une seule version active), `calculs` anonymes avec leur version, `codes_servilink` (SLK-XXXXXX), `ventes_declarees`.
- **Relation client** : `demandes`, `avis`, `plaintes` (à la 2e plainte fondée, `retrait_badge_propose` passe à vrai).
- **Mesure** : `evenements` (compteurs par jour, type et fiche, sans donnée personnelle), `sponsorises`.
- **Traçabilité** : `journal` alimenté par déclencheur sur toutes les tables métier (qui, quoi, quand, avant, après).
- **Réglages** : `parametres` (numéro WhatsApp, messages pré-remplis, seuils 14 / 30 j) ; une partie est publique.

Le public (rôle `anon`) ne lit aucune table : seulement les vues `*_public` et 3 fonctions (`rechercher_annuaire`, `compter`, `enregistrer_calcul`). Ce point est vérifié par `supabase/tests/test_v1.sql`.

## 3. Ordre de développement

1. **V1-01 Socle** (ce livrable) : schéma, seed, import Excel, squelette Next.js, mode démo, tests. Reste : dépôt GitHub, projets Supabase test et prod, Vercel, sauvegarde quotidienne et test de restauration.
2. **V1-07 Back-office, partie 1** : connexion, équipe et rôles, fiches (création sur téléphone, photos compressées, GPS du téléphone), notation, publication. Sans ça, l'annuaire reste vide.
3. **V1-02 / V1-03 Annuaire et fiches** : finitions (photos, aperçu WhatsApp généré, tri par position, quartiers voisins quand la liste est vide).
4. **V1-04 Prix** : saisie rapide de l'enquêteur (10 prix en moins de 3 minutes), page publique.
5. **V1-05 Calculateur** : écran des formules versionnées dans l'admin, 10 cas de test de l'ingénieur en tests automatiques.
6. **V1-06 PWA et pages d'information** : installation Android, hors connexion, CGU, charte, confidentialité.
7. **V1-07 Back-office, partie 2** : demandes, avis, plaintes, codes et ventes, tableau de bord, export Excel, saisies hors connexion, double authentification admin.
8. **V1-08 Encarts sponsorisés** (après le lancement public), **V1-09** documentation et recette.

## 4. Ce qui est fait dans ce premier livrable

- `supabase/migrations/0001_init.sql`, `supabase/seed.sql`, tests SQL (`npm run test:sql`) : droits par rôle, publication, vues publiques, recherche, fraîcheur des prix, codes SLK, plaintes, journal.
- `scripts/import_excel.py` : rattache chaque fiche à un métier de la grille BTP, normalise les numéros (y compris `00228…`), relançable sans doublon (testé deux fois de suite).
- Appli : accueil, annuaire, fiche, prix, calculateur (marche hors réseau, « Envoyer ma liste » avec code SLK), connexion de l'équipe, page hors connexion, manifeste et icônes provisoires. Sans variables Supabase, l'appli tourne en **mode démo** avec des données fictives.
- `npm test` : formats, fraîcheur des prix, liens WhatsApp, calculateur.

## 5. Points à trancher

| Point | Proposition |
|---|---|
| Seuils des prix 14 j / 30 j | Gardés, réglables dans `parametres`. Les tarifs de main-d'œuvre suivent la même règle ; à 30 j ils risquent d'être souvent masqués. On peut leur donner un seuil plus long. |
| Format du code SLK | 6 caractères (`SLK-7KQ2MX`) au lieu de 4 : 4 caractères se devinent trop facilement. |
| Coefficients du calculateur | Valeurs usuelles provisoires, affichées comme « en cours de validation » tant que l'ingénieur n'a pas signé les 10 cas. |
| Connexion de l'équipe | E-mail + mot de passe en V1, double authentification (TOTP) pour les admins. Le code par SMS attendra la V2 (coût des SMS). |
| Envoi de la liste | Vers le numéro ServiLink en V1 (le conseiller relaie aux fournisseurs les moins chers). Envoi direct au fournisseur possible ensuite. |
