// Professionnels relevés par Tammy44 sur Google Maps (vidéos du 19/11/2026), recopiés et
// contrôlés à l'œil image par image. On ne garde que ce qui est lisible à l'écran : un champ
// absent ici est inconnu et reste masqué dans l'appli. Aucun n'est encore vérifié par ServiLink.
// Les résultats hors Togo (recherche « maçon » partie sur Mâcon en France, numéros +33 / +229) sont écartés.

export const DATE_COLLECTE = "2026-11-19";

export type Releve = {
  nom: string; slug: string;
  note?: number; avis?: number;            // note Google et nombre d'avis Google
  adresse?: string; quartier?: string;     // tels qu'affichés sur Google Maps
  tel?: string;                            // 8 chiffres togolais
  h24?: boolean; ouvre?: string;           // « Ouvert 24 h/24 » ou heure d'ouverture affichée
  domicile?: boolean; livraison?: boolean; // « On-site services » / « Delivery »
  auto?: boolean;                          // lu automatiquement, pas encore contrôlé à l'œil
};

export const COLLECTE: Releve[] = [
  // Maçons
  { nom: "ETS SALIFOU ET FRÈRES", slug: "macon", note: 1.0, avis: 1, tel: "91 67 92 78", ouvre: "7 h", domicile: true },
  { nom: "Franck", slug: "macon", adresse: "Rue de Togblékopé", tel: "97 82 75 92", ouvre: "7 h" },
  { nom: "Noé construction", slug: "macon", note: 5.0, avis: 1, tel: "99 88 75 88", ouvre: "7 h" },
  { nom: "Adamavo", slug: "macon" },
  // Carreleurs
  { nom: "Florent carrelage finition - intérieure Lomé", slug: "carreleur", tel: "70 20 41 32", h24: true },
  { nom: "Carefour la grâce", slug: "carreleur" },
  // Menuisiers (bois et aluminium)
  { nom: "GMAF-ALU | Global Menuiserie d'Afrique Aluminium", slug: "menuisier", note: 5.0, avis: 7, adresse: "Sogbossito, à 200 m de la station Oando, face à l'EPP Sogbossito", tel: "90 00 65 30", ouvre: "7 h 30" },
  { nom: "Az Ameublement TOGO", slug: "menuisier", adresse: "Légbassito", quartier: "Légbassito", tel: "92 88 25 59", h24: true },
  { nom: "MATERIAE GALERIE", slug: "menuisier", tel: "90 01 98 27", h24: true },
  { nom: "ÉBÉNISTERIE LAMARQ", slug: "menuisier", note: 5.0, avis: 1 },
  { nom: "SQUARE ALUMINIUM", slug: "menuisier", note: 4.3, avis: 4, adresse: "Rue de Tome", tel: "90 53 37 68", ouvre: "9 h" },
  { nom: "AluNet", slug: "menuisier", note: 5.0, avis: 4, tel: "90 12 70 66", ouvre: "7 h" },
  { nom: "Goodgrace menuiserie", slug: "menuisier", note: 5.0, avis: 1, tel: "91 94 75 29", ouvre: "8 h" },
  { nom: "Dos menuiserie Plus Haut", slug: "menuisier", tel: "90 73 58 48", h24: true },
  { nom: "Phénix Alu-Meubles Déco", slug: "menuisier", note: 4.7, avis: 7, tel: "90 74 43 59", ouvre: "7 h 30" },
  { nom: "Ayoubdécorpro", slug: "menuisier", adresse: "Agoè Logopé", quartier: "Agoè", tel: "96 28 52 88", ouvre: "8 h" },
  { nom: "Vivant", slug: "menuisier", tel: "71 17 05 00", ouvre: "8 h" },
  // Plombiers
  { nom: "O'care plomberie générale", slug: "plombier", note: 4.6, avis: 20, adresse: "Attiégou", tel: "70 46 92 99", h24: true, domicile: true },
  { nom: "NKR PLOMBERIE SERVICE", slug: "plombier", tel: "97 92 12 92", ouvre: "7 h 30" },
  { nom: "Aquaservice", slug: "plombier", tel: "79 19 42 53", h24: true },
  { nom: "Plomberie team type one", slug: "plombier", tel: "70 03 43 89", ouvre: "7 h 30" },
  { nom: "SA plomberie", slug: "plombier", tel: "70 40 90 37", h24: true },
  { nom: "MR YAO TECHNICIEN PLOMBIER", slug: "plombier", note: 5.0, avis: 1, tel: "90 49 91 56", h24: true },
  { nom: "ADK GENIE CIVIL SARLU", slug: "plombier", note: 5.0, avis: 1, adresse: "Totsi Gblinkomé, Pharmacie Bétania", tel: "93 44 97 87", ouvre: "8 h", domicile: true },
  { nom: "albarka", slug: "plombier", note: 5.0, avis: 2, adresse: "Salmane, Ouro-gaou", tel: "93 41 76 64", ouvre: "5 h" },
  { nom: "NovaDesign228", slug: "plombier", note: 1.0, avis: 1, adresse: "Sogbossito", tel: "93 67 75 98", ouvre: "8 h" },
  // Électriciens
  { nom: "ETINSEL", slug: "electricien", note: 4.8, avis: 16, tel: "22 50 68 32", ouvre: "8 h" },
  { nom: "AMENUVEVE Entreprise", slug: "electricien", tel: "90 82 53 95", h24: true, domicile: true },
  { nom: "Global Service Électrotechnique", slug: "electricien", tel: "92 74 89 08", h24: true },
  { nom: "Ets LA RÉFÉRENCE ELECTRO-TECH", slug: "electricien", adresse: "Sanguera", tel: "93 10 20 34", ouvre: "7 h" },
  { nom: "OMEGA Tech", slug: "electricien", note: 5.0, avis: 1, tel: "90 52 48 38", h24: true },
  { nom: "ETS JEANNOT LUZ", slug: "electricien", tel: "90 96 19 43", ouvre: "7 h 30" },
  { nom: "JAK INGENIERIE", slug: "electricien", note: 4.0, avis: 1, tel: "70 19 96 21", ouvre: "7 h 30" },
  // Peintres
  { nom: "Pratic decor", slug: "peintre", note: 5.0, avis: 2, tel: "90 66 67 66", ouvre: "7 h 30" },
  { nom: "Gyan l'omniscient Décor", slug: "peintre", note: 5.0, avis: 1, tel: "90 26 50 58", h24: true },
  // Toiture
  { nom: "La Toiture Plus", slug: "toiture", note: 2.9, avis: 16, adresse: "Rue Motel Mon Pays", tel: "93 66 55 95", ouvre: "7 h 30" },
  // Décoration intérieure
  { nom: "DECO BY AYABA", slug: "decoration", note: 5.0, avis: 10, tel: "79 92 78 78", ouvre: "9 h", domicile: true },
  { nom: "WORLD DECOR DESIGN", slug: "decoration", note: 3.8, avis: 5, adresse: "Zopomahé", tel: "92 90 82 35", ouvre: "7 h" },
  { nom: "Ali Décor", slug: "decoration", note: 4.8, avis: 4, tel: "70 28 33 33", h24: true, domicile: true },
  { nom: "AllNice prestation", slug: "decoration", tel: "93 98 99 04", h24: true },
  { nom: "Modern Decor Togo", slug: "decoration", note: 1.0, avis: 1, adresse: "Zongo", tel: "70 22 28 54", h24: true },
  { nom: "NST", slug: "decoration", note: 4.0, avis: 1, tel: "93 61 39 90", ouvre: "7 h" },
  { nom: "Deco-International", slug: "decoration", tel: "90 39 00 46", ouvre: "8 h" },
  // Architectes
  { nom: "Sara Consult", slug: "architecte", note: 4.4, avis: 53, adresse: "Avenue Akeï", tel: "22 26 84 86", ouvre: "8 h", domicile: true },
  { nom: "ATELIER JML ARCHITECTURE", slug: "architecte", note: 3.7, avis: 35, tel: "90 77 26 21", ouvre: "8 h" },
  { nom: "K-ARCHITECTES", slug: "architecte", note: 4.4, avis: 8, tel: "90 38 67 84", ouvre: "7 h" },
  { nom: "Cabinet JEFF CAD", slug: "architecte", note: 4.0, avis: 3, tel: "90 85 16 65", ouvre: "8 h" },
  { nom: "Cabinet Les tropiques", slug: "architecte", tel: "90 00 04 52", ouvre: "8 h" },
  // Mécaniciens auto
  { nom: "MEGATRAM", slug: "mecanicien", note: 3.8, avis: 60, adresse: "Kégué", quartier: "Kégué", tel: "22 33 92 98", ouvre: "8 h" },
  { nom: "BAMOUE REPAIR SHOP", slug: "mecanicien", note: 4.3, avis: 12, tel: "91 76 24 00", ouvre: "8 h" },
  { nom: "GARAGE MINAMADOU", slug: "mecanicien", note: 5.0, avis: 3, tel: "97 55 00 33", h24: true },
  { nom: "2A AUTO", slug: "mecanicien", note: 4.0, avis: 2, adresse: "Agoè Avédji", quartier: "Avédji", tel: "93 42 73 64", h24: true },
  { nom: "GARAGE CHRISTOPHE", slug: "mecanicien", tel: "90 15 26 09", ouvre: "7 h" },
  { nom: "Garage Ellyvich", slug: "mecanicien", adresse: "Massouhoui", tel: "70 80 80 60", ouvre: "9 h" },
  { nom: "Garage sawari", slug: "mecanicien", note: 1.0, avis: 1, adresse: "Massouhoin", tel: "93 95 80 83" },
  { nom: "P.CHAMPION (Mécanicien)", slug: "mecanicien", note: 5.0, avis: 1, adresse: "Agoè Cacaveli", quartier: "Agoè", tel: "99 77 07 22", ouvre: "7 h" },
  // Fournisseurs : matériaux de construction
  { nom: "Providence Toiture & Alu", slug: "materiaux", note: 5.0, avis: 31, tel: "92 41 30 01", ouvre: "7 h 30", livraison: true },
  { nom: "BENIBERTINO", slug: "materiaux", note: 5.0, avis: 3, adresse: "Rue Agoè-Nyivé, Sanguera", tel: "97 17 50 75", ouvre: "7 h 30" },
  { nom: "BATIMAX", slug: "materiaux", note: 5.0, avis: 1, adresse: "Carrefour 2 Lions", tel: "71 95 44 44", ouvre: "8 h" },
  { nom: "HOME PLUS", slug: "materiaux", note: 5.0, avis: 4, tel: "70 87 29 67", ouvre: "7 h 30", livraison: true },
  { nom: "Ets GERALUX (vente de matériaux de construction)", slug: "materiaux", note: 5.0, avis: 1, tel: "91 71 02 17", ouvre: "7 h 30", livraison: true },
  { nom: "Ets B.PAUL", slug: "materiaux", tel: "92 74 91 18", ouvre: "7 h 30", livraison: true },
  { nom: "NOMA HOUSE TOGO", slug: "materiaux", note: 4.6, avis: 7, tel: "99 88 03 00", ouvre: "6 h" },
  { nom: "OWUOBA sarl", slug: "materiaux", tel: "90 21 18 00", ouvre: "7 h" },
  { nom: "EDOLE PARC ECHAFAUDAGE TOGO", slug: "materiaux", note: 4.5, avis: 2, adresse: "Agoè Cacaveli, non loin de l'Hôtel Maison Blanche", quartier: "Agoè", tel: "92 12 99 40", ouvre: "8 h" },
  // Fournisseurs : quincailleries
  { nom: "Orass", slug: "quincaillerie", note: 4.6, avis: 5, adresse: "Face Église Temple du Calvaire, rue du Chemin de Fer", tel: "22 21 19 94", ouvre: "8 h", livraison: true },
  { nom: "A.BRUXELLES", slug: "quincaillerie", note: 4.8, avis: 4, tel: "92 85 81 75", ouvre: "8 h", livraison: true },
  { nom: "ABNER DISTRIBUTION", slug: "quincaillerie", note: 5.0, avis: 2, tel: "91 69 29 39", ouvre: "6 h 30", livraison: true },
  { nom: "Ets OBALOHU", slug: "quincaillerie", note: 5.0, avis: 1, tel: "90 21 18 00", ouvre: "7 h" },
  { nom: "EFAM Quincaillerie général", slug: "quincaillerie", note: 4.0, avis: 1, ouvre: "7 h" },
];
