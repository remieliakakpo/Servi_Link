// Fiche d'un professionnel du dépannage (livreur de carburant, vulcanisateur, mécanicien, dépanneur),
// remplie par le pro lui-même. Sans serveur pour l'instant : gardée sur son téléphone, puis envoyée
// à l'équipe ServiLink par un lien WhatsApp qui contient la fiche ; la réponse revient de la même façon.

export type Service = "carburant" | "pneus" | "mecanique" | "remorquage";
export const SERVICES: { cle: Service; libelle: string }[] = [
  { cle: "carburant", libelle: "Livraison de carburant" },
  { cle: "pneus", libelle: "Réparation de pneus" },
  { cle: "mecanique", libelle: "Dépannage mécanique" },
  { cle: "remorquage", libelle: "Remorquage" },
];
export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

/** « 08:00 » -> « 8 h », « 17:30 » -> « 17 h 30 » (même écriture sur la fiche, l'aperçu et l'examen). */
export const heure = (h: string) => { const [hh, mm] = h.split(":"); return `${Number(hh)} h${mm && mm !== "00" ? ` ${mm}` : ""}`; };
/** Créneaux proposés dans les listes d'horaires : de 5 h à 23 h 30, toutes les demi-heures. */
export const CRENEAUX = Array.from({ length: 38 }, (_, i) => { const m = 300 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`; });
/** « Lun. 8 h – 17 h · Mar. … » */
export const resumeHoraires = (h: { ouvert: boolean; de: string; a: string }[]) =>
  h.map((x, i) => (x.ouvert ? `${JOURS[i].slice(0, 3)}. ${heure(x.de)} – ${heure(x.a)}` : null)).filter(Boolean).join(" · ");

export type Horaire = { ouvert: boolean; de: string; a: string };
export type StatutFiche = "brouillon" | "envoyee" | "correction" | "conforme";
export type FichePro = {
  nom: string; presentation: string; services: Service[]; quartiers: string[]; disponible: boolean;
  appel: boolean; telephone: string; whatsapp: boolean; memeNumero: boolean; numeroWhatsapp: string;
  horaires: Horaire[]; surPlace: boolean | null; quartier: string; repere: string; lat?: number; lng?: number;
  statut: StatutFiche; correction?: string;
};

export const FICHE_VIDE: FichePro = {
  nom: "", presentation: "", services: [], quartiers: [], disponible: true,
  appel: true, telephone: "", whatsapp: true, memeNumero: true, numeroWhatsapp: "",
  horaires: JOURS.map((_, i) => ({ ouvert: i < 6, de: "08:00", a: i === 5 ? "12:00" : "17:00" })),
  surPlace: null, quartier: "", repere: "", statut: "brouillon",
};

const CLE = "slk-fiche-pro";
export function lireFiche(): FichePro {
  try { return { ...FICHE_VIDE, ...JSON.parse(localStorage.getItem(CLE) ?? "{}") }; } catch { return FICHE_VIDE; }
}
export function ecrireFiche(f: FichePro) {
  try { localStorage.setItem(CLE, JSON.stringify(f)); } catch { /* stockage indisponible */ }
}

export const initiales = (nom: string) => nom.trim().split(/\s+/).slice(0, 2).map((m) => m[0]?.toUpperCase() ?? "").join("") || "?";
export const libelleService = (s: Service) => SERVICES.find((x) => x.cle === s)?.libelle ?? s;
export const numeroWa = (f: FichePro) => (f.memeNumero ? f.telephone : f.numeroWhatsapp);

/** Ce qu'il manque avant l'envoi pour validation. */
export function manques(f: FichePro): string[] {
  return [
    !f.nom.trim() && "le nom de l'activité",
    !f.services.length && "au moins un service",
    !f.quartiers.length && "au moins un quartier",
    !(f.appel && f.telephone.trim()) && !(f.whatsapp && numeroWa(f).trim()) && "un numéro de contact",
  ].filter((x): x is string => !!x);
}

// ---- Fiche dans un lien (base64url du JSON, sans les champs de suivi) ----
export function encoderFiche(f: FichePro): string {
  const { statut: _s, correction: _c, ...reste } = f;
  const json = new TextEncoder().encode(JSON.stringify(reste));
  let bin = ""; json.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decoderFiche(s: string | undefined): FichePro | null {
  if (!s) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    return typeof o?.nom === "string" ? { ...FICHE_VIDE, ...o, statut: "envoyee" } : null;
  } catch { return null; }
}
