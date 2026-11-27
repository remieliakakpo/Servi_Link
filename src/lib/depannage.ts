// Dépannage et livraison de carburant, sans serveur pour l'instant : la demande, le tarif du livreur
// et chaque étape voyagent dans des liens partagés sur WhatsApp, et le téléphone du client garde
// ses livraisons (localStorage). Quand la base sera branchée, ces liens deviendront des lignes en base.

export type Carburant = "essence" | "gazole";
export type Demande = { id: string; lieu: string; repere?: string; carburant: Carburant; litres: number; lat?: number; lng?: number };
export type Tarif = { prixLitre: number; km: number; prixKm: number };
export type Etape = "acceptee" | "station" | "route" | "livree";
export type Statut = "envoyee" | Etape | "confirmee" | "signalee" | "refusee";
export type Livraison = Demande & Partial<Tarif> & {
  statut: Statut; creee: string; majLe: string;
  probleme?: string; note?: number; commentaire?: string;
};

export const ETAPES: { cle: Etape; titre: string; detail: string }[] = [
  { cle: "acceptee", titre: "Tarif accepté", detail: "Le livreur part vers la station." },
  { cle: "station", titre: "À la station", detail: "Le livreur récupère votre carburant." },
  { cle: "route", titre: "En route vers vous", detail: "Le livreur arrive à votre point de repère." },
  { cle: "livree", titre: "Livraison terminée", detail: "Le livreur indique avoir livré votre carburant." },
];

export const NOM_CARBURANT: Record<Carburant, string> = { essence: "Essence", gazole: "Gazole" };

export const total = (t: Tarif, litres: number) => ({
  carburant: Math.round(t.prixLitre * litres),
  deplacement: Math.round(t.km * t.prixKm),
  total: Math.round(t.prixLitre * litres + t.km * t.prixKm),
});

export const nouvelId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const resume = (d: Pick<Demande, "lieu" | "repere">) => [d.lieu, d.repere].filter(Boolean).join(" · ");

// ---- Liens : la demande (vers le livreur) et le tarif (vers le client) tiennent dans l'adresse ----
export function versParams(d: Demande, t?: Tarif): URLSearchParams {
  const p = new URLSearchParams({ id: d.id, lieu: d.lieu, c: d.carburant, l: String(d.litres) });
  if (d.repere) p.set("r", d.repere);
  if (d.lat != null && d.lng != null) { p.set("lat", String(d.lat)); p.set("lng", String(d.lng)); }
  if (t) { p.set("p", String(t.prixLitre)); p.set("km", String(t.km)); p.set("t", String(t.prixKm)); }
  return p;
}

const nombre = (v: string | null | undefined) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);

export function depuisParams(sp: Record<string, string | undefined>): { d: Demande; t?: Tarif } | null {
  const litres = nombre(sp.l);
  if (!sp.id || !sp.lieu || (sp.c !== "essence" && sp.c !== "gazole") || !litres) return null;
  const d: Demande = { id: sp.id.slice(0, 12), lieu: sp.lieu.slice(0, 80), repere: sp.r?.slice(0, 120), carburant: sp.c, litres,
    lat: nombre(sp.lat), lng: nombre(sp.lng) };
  const p = nombre(sp.p), km = nombre(sp.km), t = nombre(sp.t);
  return { d, t: p != null && km != null && t != null ? { prixLitre: p, km, prixKm: t } : undefined };
}

export const origine = () => (typeof window === "undefined" ? "" : window.location.origin);

/** Lien WhatsApp sans destinataire : WhatsApp laisse choisir la discussion. */
export const partagerWhatsApp = (texte: string) => `https://wa.me/?text=${encodeURIComponent(texte)}`;

// ---- Livraisons gardées sur le téléphone du client ----
const CLE = "slk-livraisons";
const CLE_BROUILLON = "slk-demande-carburant";

export function livraisons(): Livraison[] {
  try { return JSON.parse(localStorage.getItem(CLE) ?? "[]"); } catch { return []; }
}
export function livraison(id: string): Livraison | undefined {
  return livraisons().find((l) => l.id === id);
}
export function enregistrer(l: Livraison) {
  try {
    const autres = livraisons().filter((x) => x.id !== l.id);
    localStorage.setItem(CLE, JSON.stringify([{ ...l, majLe: new Date().toISOString() }, ...autres].slice(0, 50)));
  } catch { /* stockage indisponible (navigation privée) : la page reste utilisable */ }
}
export function brouillon(): Demande | null {
  try { return JSON.parse(sessionStorage.getItem(CLE_BROUILLON) ?? "null"); } catch { return null; }
}
export function garderBrouillon(d: Demande) {
  try { sessionStorage.setItem(CLE_BROUILLON, JSON.stringify(d)); } catch { /* idem */ }
}

/** Une étape ne recule jamais (un vieux lien « à la station » n'efface pas « livrée »). */
export function avancer(l: Livraison, e: Etape): Livraison {
  const ordre: Statut[] = ["envoyee", "acceptee", "station", "route", "livree", "confirmee"];
  if (l.statut === "signalee" || l.statut === "refusee") return l;
  return ordre.indexOf(e) > ordre.indexOf(l.statut) ? { ...l, statut: e } : l;
}

export const dateLongue = (iso: string, heure = false) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", ...(heure ? { hour: "2-digit", minute: "2-digit" } : {}) });

export const LIBELLE_STATUT: Record<Statut, { texte: string; ton: "vert" | "orange" | "gris" }> = {
  envoyee: { texte: "En attente du tarif", ton: "gris" },
  acceptee: { texte: "Tarif accepté", ton: "orange" },
  station: { texte: "À la station", ton: "orange" },
  route: { texte: "En route", ton: "orange" },
  livree: { texte: "À confirmer", ton: "orange" },
  confirmee: { texte: "Réception confirmée", ton: "vert" },
  signalee: { texte: "Problème signalé", ton: "orange" },
  refusee: { texte: "Tarif refusé", ton: "gris" },
};
