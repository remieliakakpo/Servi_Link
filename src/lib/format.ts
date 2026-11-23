// Formats d'affichage : « 5 250 F », « 17/11/2026 », « +228 90 12 34 56 » (chapitre 06)
// Lomé est en UTC toute l'année ; on fixe quand même le fuseau pour ne pas dépendre du serveur.

const FUSEAU = "Africa/Lome";

/** 5250 -> « 5 250 F » (espace insécable fine comme séparateur de milliers). */
export function fcfa(montant: number | null | undefined): string {
  if (montant == null) return "–";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(montant).replace(/\u202f/g, "\u00a0") + "\u00a0F";
}

/** Fourchette « 2 500 – 3 500 F » ou un seul prix si min = max. */
export function fourchette(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Sur devis";
  if (min == null || max == null || min === max) return fcfa(min ?? max);
  return `${fcfa(min).replace(/\u00a0F$/, "")} – ${fcfa(max)}`;
}

/** Date ISO (YYYY-MM-DD ou timestamp) -> « 17/11/2026 ». */
export function dateCourte(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = iso.length === 10 ? new Date(iso + "T12:00:00Z") : new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** Nombre de jours entre une date ISO et aujourd'hui (heure de Lomé). */
export function joursDepuis(iso: string, maintenant: Date = new Date()): number {
  const aujourdhui = new Date(maintenant.toISOString().slice(0, 10) + "T00:00:00Z");
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  return Math.round((aujourdhui.getTime() - d.getTime()) / 86_400_000);
}

/** Même règle que scripts/import_excel.py : 8 chiffres togolais -> « +228 XX XX XX XX ». */
export function telephone(v: string | null | undefined): string | null {
  if (!v) return null;
  let d = v.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("228")) d = d.slice(3);
  if (d.length === 8) return `+228 ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
  return v.trim();
}

/** Chiffres seuls au format international, pour wa.me et tel: (« 22890123456 »). */
export function numeroInternational(v: string | null | undefined): string | null {
  const t = telephone(v);
  if (!t) return null;
  const d = t.replace(/\D/g, "");
  return d.length >= 8 ? d : null;
}

/** 4.6 -> « 4,6 » ; 1.25 km -> « 1,3 km ». */
export const decimal = (n: number, chiffres = 1) => n.toFixed(chiffres).replace(".", ",");
export const km = (d: number) => `${decimal(d)} km`;
export const ans = (n: number) => `${n} an${n > 1 ? "s" : ""}`;
