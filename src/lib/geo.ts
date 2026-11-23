// Proximité : distance, zone de la carte schématique du Grand Lomé, projection en SVG.

export type Point = { lat: number; lng: number };

/** Distance à vol d'oiseau en km (même formule que rechercher_annuaire en SQL). */
export function distanceKm(a: Point, b: Point): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/** Cadre de la carte schématique (Grand Lomé). */
export const CADRE = { nord: 6.30, sud: 6.105, ouest: 1.10, est: 1.345 };

/** Latitude approximative du littoral à une longitude donnée (la côte monte vers l'est). */
export const latCote = (lng: number) => 6.118 + (lng - 1.1) * 0.06;

export function dansLeCadre(p: Point): boolean {
  return p.lat <= CADRE.nord && p.lat >= CADRE.sud && p.lng >= CADRE.ouest && p.lng <= CADRE.est;
}

/** Projection équirectangulaire vers un SVG de largeur l et hauteur h. */
export function projeter(p: Point, l: number, h: number): { x: number; y: number } {
  return {
    x: ((p.lng - CADRE.ouest) / (CADRE.est - CADRE.ouest)) * l,
    y: ((CADRE.nord - p.lat) / (CADRE.nord - CADRE.sud)) * h,
  };
}

/** Lien « Voir sur la carte » / itinéraire vers Google Maps. */
export function lienCarte(p: Point | null, repli: string): string {
  return p
    ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(repli)}`;
}

/** Valeur de la liste des zones pour « Autour de moi » (partagée serveur / navigateur). */
export const AUTOUR_DE_MOI = "moi";
