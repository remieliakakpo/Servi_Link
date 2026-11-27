-- ServiLink V1 : données de départ (métiers BTP, matériaux de base, réglages, calculateur v1)
-- Idempotent : on peut le relancer.

insert into metiers (slug, libelle, type, ordre) values
  ('macon',            'Maçon',                 'Artisan', 10),
  ('ferrailleur',      'Ferrailleur',           'Artisan', 20),
  ('coffreur',         'Coffreur',              'Artisan', 30),
  ('electricien',      'Électricien bâtiment',  'Artisan', 40),
  ('plombier',         'Plombier',              'Artisan', 50),
  ('carreleur',        'Carreleur',             'Artisan', 60),
  ('menuisier',        'Menuisier',             'Artisan', 70),
  ('peintre',          'Peintre bâtiment',      'Artisan', 80),
  ('soudeur',          'Soudeur / ferronnier',  'Artisan', 90),
  ('toiture',          'Couvreur (toiture)',    'Artisan', 92),
  ('vitrier',          'Aluminium et vitrerie', 'Artisan', 93),
  ('decoration',       'Décoration intérieure', 'Artisan', 94),
  ('staffeur',         'Staffeur / plafonds',   'Artisan', 95),
  ('amenagement',      'Aménagement et jardin', 'Artisan', 97),
  ('architecte',       'Architecte',            'Artisan', 96),
  ('mecanicien',       'Mécanicien auto',       'Artisan', 98),
  ('materiaux',        'Matériaux de construction', 'Fournisseur', 105),
  ('quincaillerie',    'Quincaillerie',         'Fournisseur', 110),
  ('ciment',           'Ciment',                'Fournisseur', 120),
  ('fer-a-beton',      'Fer à béton',           'Fournisseur', 130),
  ('agglos',           'Agglos / briqueterie',  'Fournisseur', 140),
  ('sable-gravier',    'Sable et gravier',      'Fournisseur', 150),
  ('carreaux-sanitaires', 'Carreaux et sanitaires', 'Fournisseur', 160),
  ('bois',             'Bois',                  'Fournisseur', 170)
on conflict (slug) do update set libelle = excluded.libelle, type = excluded.type, ordre = excluded.ordre;

insert into materiaux (slug, nom, variante, unite_achat, ordre) values
  ('ciment-cpj45-50kg',  'Ciment',            'CPJ 45',           'sac de 50 kg',  10),
  ('fer-ha8-12m',        'Fer à béton',       'HA 8',             'barre de 12 m', 20),
  ('fer-ha10-12m',       'Fer à béton',       'HA 10',            'barre de 12 m', 21),
  ('fer-ha12-12m',       'Fer à béton',       'HA 12',            'barre de 12 m', 22),
  ('agglo-creux-15',     'Agglos',            'creux de 15',      'agglo',         30),
  ('agglo-creux-20',     'Agglos',            'creux de 20',      'agglo',         31),
  ('sable-lagune',       'Sable',             'de lagune',        'm³',            40),
  ('gravier-5-15',       'Gravier',           '5/15',             'm³',            50),
  ('fil-ligaturer',      'Fil à ligaturer',   'recuit',           'rouleau de 25 kg', 60)
on conflict (slug) do nothing;

insert into parametres (cle, valeur, description, public) values
  ('whatsapp_servilink',  '"+228 90 00 08 37"', 'Numéro WhatsApp de ServiLink (provisoire)', true),
  ('message_contact_pro', '"Bonjour {nom}, je vous contacte via ServiLink (fiche {id}). "', 'Message pré-rempli vers un pro', true),
  ('message_demande',     '"Bonjour ServiLink, je cherche "', 'Message pré-rempli « Demander à ServiLink »', true),
  ('message_liste',       '"Bonjour, voici ma liste de matériaux calculée sur ServiLink (code {code}) :"', 'Message « Envoyer ma liste »', true),
  ('prix_jours_ancien',   '14', 'Un prix plus vieux que ce nombre de jours est marqué « ancien » (à confirmer)', true),
  ('prix_jours_masque',   '30', 'Un prix plus vieux que ce nombre de jours est masqué (à confirmer)', true)
on conflict (cle) do nothing;

-- Calculateur v1 : coefficients PROVISOIRES, à faire valider par l'ingénieur partenaire (10 cas de test).
-- Tant que valide_par est vide, l'appli affiche « formules en cours de validation ».
insert into parametres_calculateur (version, actif, notes, coefficients) values (1, true,
  'Valeurs usuelles de chantier en Afrique de l''Ouest, non validées.',
  '{
    "marge_pertes": 0.05,
    "agglo": { "par_m2": { "15": 10, "20": 10 }, "format": "50 × 20 cm" },
    "mortier_pose": { "m3_par_m2": { "15": 0.015, "20": 0.02 }, "ciment_kg_m3": 300, "sable_m3_par_m3": 1.1 },
    "enduit":       { "epaisseur_m": 0.015, "ciment_kg_m3": 350, "sable_m3_par_m3": 1.1 },
    "beton_dalle":  { "ciment_kg_m3": 350, "sable_m3_par_m3": 0.45, "gravier_m3_par_m3": 0.85 },
    "fer_dalle":    { "kg_par_m3": 80 },
    "fer_kg_par_m": { "HA8": 0.395, "HA10": 0.617, "HA12": 0.888 },
    "barre_m": 12,
    "sac_kg": 50,
    "beton_arme":   { "ciment_kg_m3": 350, "sable_m3_par_m3": 0.45, "gravier_m3_par_m3": 0.85, "fer_kg_m3": { "fondation": 50, "poteau": 130, "poutre": 110 } },
    "beton_sol":    { "ciment_kg_m3": 300, "sable_m3_par_m3": 0.45, "gravier_m3_par_m3": 0.85 },
    "chape":        { "ciment_kg_m3": 350, "sable_m3_par_m3": 1.1 },
    "carrelage":    { "pertes": 0.1, "colle_kg_m2": 5, "sac_colle_kg": 25, "joint_kg_m2": 0.4 },
    "peinture":     { "m2_par_litre": 10, "seau_l": 20 },
    "paves":        { "par_m2": 40, "sable_m3_par_m2": 0.05 }
  }'::jsonb)
on conflict (version) do nothing;

-- Quartiers du Grand Lomé : centres APPROXIMATIFS (à corriger depuis le back-office avec un vrai relevé).
-- Ils servent à placer sur la carte une fiche sans GPS et à proposer la liste « Grand Lomé ▾ ».
insert into quartiers (nom, lat, lng, ordre) values
  ('Agoè',          6.2350, 1.2000, 10),
  ('Adidogomé',     6.1800, 1.1600, 20),
  ('Sagbado',       6.1900, 1.1350, 30),
  ('Avédji',        6.1900, 1.1950, 40),
  ('Djidjolé',      6.1650, 1.2000, 50),
  ('Tokoin',        6.1500, 1.2150, 60),
  ('Nyékonakpoè',   6.1320, 1.2050, 70),
  ('Bè',            6.1380, 1.2400, 80),
  ('Hédzranawoé',   6.1600, 1.2450, 90),
  ('Kégué',         6.1700, 1.2550, 100),
  ('Bè-Kpota',      6.1500, 1.2550, 110),
  ('Akodésséwa',    6.1420, 1.2700, 120),
  ('Baguida',       6.1600, 1.3200, 130),
  ('Légbassito',    6.2700, 1.1500, 140)
on conflict (nom) do nothing;
