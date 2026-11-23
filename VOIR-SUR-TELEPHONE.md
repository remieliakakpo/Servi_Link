# Voir l'appli ServiLink sur ton téléphone

L'appli tourne **sans base de données** (mode démo) : il suffit de Node.js.
Les 380 professionnels affichés sont les vrais pros relevés dans tes vidéos Google Maps du 19/11/2026,
marqués « Pas encore vérifié par ServiLink ». Les prix des matériaux sont des exemples.

## 1. Préparer l'ordinateur (une seule fois)

1. Installe **Node.js 20 ou plus récent** : https://nodejs.org (version « LTS »).
2. Dézippe `servilink-code-2026-11-23.zip` dans un dossier, par exemple `Documents/servilink`.
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
- `captures/ecrans-2026-11-23/` : les captures des écrans.
