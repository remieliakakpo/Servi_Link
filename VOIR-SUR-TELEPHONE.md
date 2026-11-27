# Voir l'appli ServiLink sur ton téléphone

L'appli tourne **sans base de données** (mode démo) : il suffit de Node.js.
Les 380 professionnels affichés sont les vrais pros relevés dans tes vidéos Google Maps du 19/11/2026,
marqués « Pas encore vérifié par ServiLink ». Les prix des matériaux sont des exemples.

## 1. Préparer l'ordinateur (une seule fois)

1. Installe **Node.js 20 ou plus récent** : https://nodejs.org (version « LTS »).
2. Dézippe `servilink-code-2026-11-27-lancement.zip` dans un dossier, par exemple `Documents/servilink`.
3. Ouvre un terminal dans ce dossier (Windows : clic droit dans le dossier > « Ouvrir dans le terminal »), puis tape :

```
npm install
```

## 2. Lancer l'appli

```
npm run build
npm start -- -H 0.0.0.0
```

L'appli est prête quand le terminal affiche `Ready`. Sur l'ordinateur, elle s'ouvre sur http://localhost:3000.
Laisse le terminal ouvert tant que tu regardes l'appli (Ctrl + C pour l'arrêter).

Pour modifier le code et voir les changements tout de suite, utilise plutôt `npm run dev -- -H 0.0.0.0`.

## 3. L'ouvrir sur le téléphone

1. Le téléphone et l'ordinateur doivent être sur **le même Wi-Fi**.
2. Trouve l'adresse IP de l'ordinateur :
   - Windows : tape `ipconfig` et lis « Adresse IPv4 » (par exemple 192.168.1.23) ;
   - Mac : Réglages > Wi-Fi > Détails, ou tape `ipconfig getifaddr en0`.
3. Sur le téléphone, ouvre Chrome et va sur `http://192.168.1.23:3000` (avec ton adresse).
4. Si la page ne s'ouvre pas : autorise Node.js dans le pare-feu de l'ordinateur (Windows le demande au premier lancement, coche « Réseaux privés »).

Pour l'avoir comme une appli : menu de Chrome > « Ajouter à l'écran d'accueil ».

## 4. Se connecter (Mon espace)

En mode démo, aucun SMS ni e-mail n'est envoyé : saisis n'importe quel e-mail, puis le code **123456**.

## Bon à savoir

- **Me localiser / Autour de moi** : sur le téléphone, la position n'est accordée par le navigateur que sur une adresse en https.
  En http://192.168.x.x elle est refusée, et l'appli l'explique. Pour la tester, utilise la mise en ligne ci-dessous.
- Les fonds de carte viennent d'OpenStreetMap : il faut Internet.
- Pour l'instant, tous les boutons WhatsApp et Appeler mènent au +228 90 00 08 37 (numéro provisoire de ServiLink).

## Option : une adresse en ligne (https)

1. Crée un compte sur https://vercel.com (avec GitHub).
2. Mets le dossier dans un dépôt GitHub au nom de ServiLink, puis dans Vercel : « Add New > Project » et choisis le dépôt.
3. Ne renseigne aucune variable : sans Supabase, l'appli reste en mode démo.
4. Vercel donne une adresse `https://…vercel.app` à ouvrir sur n'importe quel téléphone, avec la géolocalisation.

## Fichiers livrés avec le zip

- `collecte_google_maps_2026-11-19.csv` : les 409 fiches lues sur tes 5 vidéos (11 recherches). La colonne « Contrôlé à l'œil » dit lesquelles sont dans l'appli ; les autres sont à contrôler avant import.
- `captures/ecrans-2026-11-27/` : les captures des écrans.

## Nouveaux écrans du 27/11 à ouvrir

- `/depannage` : Je suis en panne (aussi depuis la carte de l'accueil)
- `/depannage/carburant` puis Vérifier, puis Envoyer : la demande part sur WhatsApp
- `/livreur?…` : écran du livreur (le lien arrive dans le message WhatsApp de la demande)
- `/livraisons` : Mes livraisons ; `/livraisons/<n°>` : suivi, réception, évaluation, problème
- `/espace/pro` : Ma fiche professionnelle (services, disponibilité, contacts, horaires, lieu, aperçu, envoi)
- `/admin/examen?f=…` : examen d'une fiche par l'équipe (le lien arrive dans le message WhatsApp du pro)

## Vitrine (version complète du 27/11)

Essai complet sur un seul téléphone (sans base, les vidéos restent dans le téléphone qui les a ajoutées) :

1. **Côté artisan** : onglet **Vitrine** (au centre de la barre du bas) → **Publier** → **Filmer** (ou Photo, ou la galerie) → choisir Avant / En cours / Terminé si on veut → nom et numéro WhatsApp (demandés une seule fois) → **Envoyer**. On retrouve l'envoi dans **Mes publications** (« En attente »).
2. **Côté équipe** : ouvrir `/admin/realisations` → onglet **À vérifier** → chercher la fiche du pro → **Publier** (ou Refuser avec un motif). Les médias reçus sur WhatsApp s'ajoutent dans l'onglet **Ajouter**.
3. **Côté client** : onglet **Vitrine**. Glisser vers le haut = pro suivant, glisser sur le côté = ses autres réalisations, filtres par métier en haut, boutons Fiche / WhatsApp / Appeler / Partager à droite. Les vignettes du bloc « Réalisations » d'une fiche ouvrent aussi la Vitrine sur ce pro.

Avec Supabase : appliquer `supabase/migrations/0004_realisations.sql` (table, fil public `vitrine_public`, bucket « realisations », droits : un pro connecté envoie « à vérifier », seule l'équipe publie). Pour publier depuis l'appli, le pro doit être connecté à son espace.

### Vidéos jusqu'à 5 minutes (mise à jour du 27/11, fin d'après-midi)
- Le bouton Filmer indique « 5 min au plus » ; une vidéo plus longue est signalée et ne peut pas être envoyée.
- En 4G, le fil ne charge que la vidéo regardée et prépare juste le début des voisines : rien n'est téléchargé pour les pros plus loin dans le fil.
- Base : le bucket accepte 200 Mo par fichier (l'offre gratuite de Supabase plafonne à 50 Mo, à prévoir dans le choix de l'offre).

### Corrections du 27/11 au soir
- **Vitrine, visiteur** : en haut, « Pour toi » (tout le fil ; « Voir d'abord les pros près de moi » les classe par distance) et « Métiers » (filtres). L'en-tête reste fixe pendant le défilement. La loupe ouvre l'annuaire, le « + » ouvre l'espace pro.
- **Vitrine, professionnel** : « + » → Espace pro avec deux onglets, **Publier** et **Mes publications** (chaque envoi montre ses étapes : Envoyée, En vérification, En ligne, ou Refusée avec le motif).
- **Logo** : « Servi » blanc (ou anthracite sur fond clair) et « Link » orange, avec le trait orange, sur toutes les pages.
- **Métiers ajoutés** : Aluminium et vitrerie, Staffeur / plafonds, Aménagement et jardin (en plus de Décoration intérieure). Base : relancer `supabase/seed.sql`.

## Nouveau dans cette version (lancement)

- Pages « introuvable » et « un souci est survenu » avec boutons pour repartir.
- Adresse `/api/sante` : répond « ok » si le serveur et la base vont bien (à brancher sur une alerte).
- Vitrine : les photos sont allégées avant l'envoi, chaque vidéo a son image de couverture, bouton « Signaler »,
  et en ligne (avec Supabase) les grosses vidéos reprennent leur envoi si la 4G coupe.
- Tests : `npm test` (code) et `npm run test:sql` (base, il faut PostgreSQL 16).

## Nouveau (retours du 27/11 au soir)

- Publier : boutons « Mes vidéos » et « Mes photos » qui ouvrent la galerie du téléphone.
- Tous écrans : plus rien ne déborde de 320 px aux grands téléphones, même en grande police.
- Estimation : 12 ouvrages (fondation, poteaux, chaînage, dalle, dallage, chape, crépissage, carrelage, peinture, pavés, murs, clôture).
- Base : migrations `0005_securite.sql` (limites anti-robots) et `0006_equipe.sql` (comptes de l'équipe) à exécuter après 0004.
- Vidéos chez Bunny Stream et comptes des collaborateurs : suivre le guide « ServiLink : brancher Supabase, Bunny et Vercel ». Variables dans `.env.example`.
- Ce qu'il faut configurer avant d'ouvrir au public et l'entretien mensuel sont dans le document « ServiLink : version de lancement ».
