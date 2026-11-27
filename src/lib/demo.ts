// Données du mode démo (aucune variable Supabase). Les professionnels sont de VRAIS pros relevés
// par Tammy44 sur Google Maps (src/lib/collecte.ts) : seuls les champs lus à l'écran sont remplis,
// tout le reste est vide et donc masqué. Aucun n'est marqué « vérifié par ServiLink ».
// Les prix, eux, sont des EXEMPLES (aucun relevé réel encore) et sont affichés comme tels.
import { COLLECTE, DATE_COLLECTE } from "./collecte";
import { COLLECTE_AUTO } from "./collecte_auto";
import type { Fiche, Metier, PrixMateriau, ProListe, Quartier } from "./types";

const jours = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

export const DEMO_METIERS: Metier[] = [
  { slug: "macon", libelle: "Maçon", type: "Artisan" },
  { slug: "ferrailleur", libelle: "Ferrailleur", type: "Artisan" },
  { slug: "carreleur", libelle: "Carreleur", type: "Artisan" },
  { slug: "plombier", libelle: "Plombier", type: "Artisan" },
  { slug: "electricien", libelle: "Électricien bâtiment", type: "Artisan" },
  { slug: "menuisier", libelle: "Menuisier", type: "Artisan" },
  { slug: "peintre", libelle: "Peintre bâtiment", type: "Artisan" },
  { slug: "toiture", libelle: "Couvreur (toiture)", type: "Artisan" },
  { slug: "soudeur", libelle: "Soudeur / ferronnier", type: "Artisan" },
  { slug: "vitrier", libelle: "Aluminium et vitrerie", type: "Artisan" },
  { slug: "decoration", libelle: "Décoration intérieure", type: "Artisan" },
  { slug: "staffeur", libelle: "Staffeur / plafonds", type: "Artisan" },
  { slug: "amenagement", libelle: "Aménagement et jardin", type: "Artisan" },
  { slug: "architecte", libelle: "Architecte", type: "Artisan" },
  { slug: "mecanicien", libelle: "Mécanicien auto", type: "Artisan" },
  { slug: "materiaux", libelle: "Matériaux de construction", type: "Fournisseur" },
  { slug: "quincaillerie", libelle: "Quincaillerie", type: "Fournisseur" },
];

// Mêmes valeurs approximatives que supabase/seed.sql
export const DEMO_QUARTIERS: Quartier[] = [
  ["Agoè", 6.235, 1.2], ["Adidogomé", 6.18, 1.16], ["Sagbado", 6.19, 1.135], ["Avédji", 6.19, 1.195],
  ["Djidjolé", 6.165, 1.2], ["Tokoin", 6.15, 1.215], ["Nyékonakpoè", 6.132, 1.205], ["Bè", 6.138, 1.24],
  ["Hédzranawoé", 6.16, 1.245], ["Kégué", 6.17, 1.255], ["Bè-Kpota", 6.15, 1.255], ["Akodésséwa", 6.142, 1.27],
  ["Baguida", 6.16, 1.32], ["Légbassito", 6.27, 1.15],
].map(([nom, lat, lng]) => ({ nom: nom as string, zone: "Grand Lomé", lat: lat as number, lng: lng as number }));

const metier = (slug: string) => DEMO_METIERS.find((m) => m.slug === slug)!;

// D'abord les fiches contrôlées à l'œil (ID-101 à ID-170), puis celles lues automatiquement (à confirmer)
export const DEMO_FICHES: Fiche[] = [...COLLECTE, ...COLLECTE_AUTO.map((r) => ({ ...r, auto: true }))].map((r, i) => {
  const m = metier(r.slug);
  const num = 101 + i;
  const q = r.quartier ? DEMO_QUARTIERS.find((x) => x.nom === r.quartier) : undefined;
  const tel = r.tel ? `+228 ${r.tel}` : null;
  return {
    id: `ID-${num}`, reference: `SLK-${m.type === "Artisan" ? "A" : "F"}-${String(num).padStart(4, "0")}`,
    nom: r.nom, type: m.type, metier: m.libelle, metier_slug: m.slug,
    quartier: r.quartier ?? null, quartiers_intervention: [], adresse: r.adresse ?? null,
    whatsapp: tel, telephone: tel, description: null, annees_experience: null,
    verifie: false, date_verification: DATE_COLLECTE,
    nb_chantiers_vus: null, nb_clients_appeles: null, identite_verifiee: false, carte_ou_rccm_verifie: false, atelier_visite: false, charte_signee: false,
    qualite_travail: null, respect_delais: null, note_avis_clients: null, clarte_prix: null, reactivite: null, note_moyenne: null,
    note_google: r.note ?? null, avis_google: r.avis ?? (r.note == null && !r.auto ? 0 : null), nb_avis: 0, a_confirmer: !!r.auto,
    livraison: r.livraison ? "Oui" : null, zone_livraison: null, livraison_frais_min: null, livraison_delai: null,
    service_domicile: r.domicile ? "Oui" : null,
    photo_principale: null, distance_km: null, prix_depart: null, nb_produits: 0,
    // Sans GPS : centre approximatif du quartier quand on le connaît, sinon pas de point sur la carte
    latitude: q?.lat ?? null, longitude: q?.lng ?? null, position_approx: !!q,
    horaires: r.h24 ? "Ouvert 24 h/24" : r.ouvre ? `Ouvre à ${r.ouvre}` : null,
    point_repere: null, langues: null, disponibilite: null, moyens_paiement: null,
    tarifs: [], photos: [], avis: [], prix: [], realisations: [],
  };
});

// Prix d'EXEMPLE : montrent le comparateur tant qu'aucun relevé réel n'existe. Aucun fournisseur nommé.
const prix = (materiau_id: number, slug: string, nom: string, variante: string, unite_achat: string, n: number, p: number, j: number): PrixMateriau => ({
  materiau_id, slug, nom, variante, unite_achat, professionnel_id: `EX-${n}`, fournisseur: `Point de vente ${n}`, quartier: null, whatsapp: null,
  prix: p, livraison: null, date_releve: jours(j), ancien: j > 14, le_moins_cher: false, exemple: true,
});

export const DEMO_PRIX: PrixMateriau[] = (() => {
  const l = [
    prix(1, "ciment-cpj45-50kg", "Ciment", "CPJ 45", "sac de 50 kg", 1, 5250, 4),
    prix(1, "ciment-cpj45-50kg", "Ciment", "CPJ 45", "sac de 50 kg", 2, 5400, 4),
    prix(3, "fer-ha10-12m", "Fer à béton", "HA 10", "barre de 12 m", 1, 4300, 16),
    prix(5, "agglo-creux-15", "Agglos", "creux de 15", "agglo", 1, 350, 4),
  ];
  return l.map((p) => ({ ...p, le_moins_cher: p.prix === Math.min(...l.filter((x) => x.materiau_id === p.materiau_id).map((x) => x.prix)) }));
})();

/** Courbe d'exemple du prix du ciment sur 5 semaines (carte de l'accueil). */
export const DEMO_SERIE_CIMENT = [5050, 5150, 5200, 5350, 5250];

// Encart publicitaire : emplacement à vendre, pas d'annonceur inventé
export const DEMO_SPONSO = { id: 0, annonceur: "ServiLink", titre: "Votre publicité ici", texte: "Annoncez votre quincaillerie ou vos matériaux sur ServiLink", image: "/demo/sponso-ciment.webp", lien: "/espace" };

export const demoListe = (): ProListe[] => DEMO_FICHES.map(({ tarifs: _t, photos: _p, avis: _a, prix: _x, charte_signee: _c, horaires: _h, point_repere: _r, langues: _l, disponibilite: _d, moyens_paiement: _m, livraison_frais_min: _f, livraison_delai: _ld, ...p }) => p);
