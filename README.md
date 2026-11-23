# ServiLink V1 : le cœur BTP

Annuaire vérifié des artisans et fournisseurs du BTP de Lomé, prix des matériaux datés, calculateur de matériaux, back-office de l'équipe. PWA Next.js + Supabase + Vercel, contact par WhatsApp (`wa.me`).

Plan technique et ordre des livrables : [docs/PLAN_TECHNIQUE.md](docs/PLAN_TECHNIQUE.md).

## Démarrer

```bash
npm install
npm run dev            # http://localhost:3000, en mode démo (données fictives) sans .env.local
npm test               # tests unitaires (formats, prix, WhatsApp, calculateur)
npm run test:sql       # tests du schéma sur un PostgreSQL 16 jetable (binaires postgres requis)
npm run build
```

## Brancher Supabase

1. Créer le projet Supabase (au nom de ServiLink).
2. Dans l'éditeur SQL : `supabase/migrations/0001_init.sql`, puis `supabase/seed.sql`.
3. Créer le bucket Storage public `photos`.
4. Copier `.env.example` en `.env.local` et remplir l'URL et la clé `anon`.
5. Créer le premier compte dans Auth, puis : `insert into equipe (user_id, nom, role) values ('<uuid>', 'Nom', 'admin');`

## Importer le fichier de collecte

```bash
python3 scripts/import_excel.py annuaire_lome_collecte.xlsx > import.sql
```

Puis exécuter `import.sql` dans l'éditeur SQL. Relançable sans doublon (upsert par ID). Les fiches au statut Retenu, charte signée et vérifiées depuis moins de 6 mois deviennent publiques.

## Arborescence

```
src/app/            pages (accueil, annuaire, pro/[id], prix, calculateur, admin)
src/lib/            données (donnees.ts), calculateur, formats, prix, WhatsApp
src/components/     barre de navigation, carte de fiche, boutons de contact
public/sw.js        service worker (hors connexion)
supabase/           migrations, seed, tests SQL
scripts/            import du fichier Excel de collecte
```

## Règles

- Le public ne lit que les vues `*_public` : ne jamais lire une table depuis une page publique.
- Montants en entiers FCFA, dates en UTC affichées à l'heure de Lomé.
- Le BTP d'abord : aucune fonction du volet services avant la fin d'une fonction BTP (E2).
