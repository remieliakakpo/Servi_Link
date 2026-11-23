// Paramètres de l'adresse de l'annuaire (/annuaire?…), lus par la page et par /api/resultats.
// Une seule fonction pour que « Voir N résultats » annonce exactement ce que la liste affichera.
import { AUTOUR_DE_MOI } from "./geo";
import type { Recherche } from "./types";

export type ParamsAnnuaire = {
  q?: string; metiers?: string; zone?: string; lat?: string; lng?: string; type?: string;
  tri?: string; livraison?: string; vue?: string; page?: string; pro?: string;
};

const coord = (v: string | undefined, min: number, max: number) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

export const PAR_PAGE = 20;

export function lireRecherche(sp: ParamsAnnuaire): Recherche & { autour: boolean; vue: "liste" | "carte" } {
  const vue = sp.vue === "carte" ? "carte" : "liste";
  const lat = coord(sp.lat, -90, 90), lng = coord(sp.lng, -180, 180);
  const autour = sp.zone === AUTOUR_DE_MOI && lat != null && lng != null;
  const tri = sp.tri === "note" || sp.tri === "experience" ? sp.tri
    : sp.tri === "distance" && autour ? "distance" : autour ? "distance" : "note";
  return {
    q: sp.q?.trim().slice(0, 80) || undefined,
    type: sp.type === "artisan" ? "Artisan" : sp.type === "fournisseur" ? "Fournisseur" : undefined,
    metiers: (sp.metiers ?? "").split(",").map((m) => m.trim()).filter((m) => /^[a-z0-9-]{1,40}$/.test(m)).slice(0, 20),
    quartier: sp.zone && sp.zone !== AUTOUR_DE_MOI ? sp.zone.slice(0, 60) : undefined,
    livraison: sp.livraison === "1",
    tri, lat: autour ? lat : undefined, lng: autour ? lng : undefined,
    page: Math.min(25, Math.max(1, Number(sp.page) || 1)),
    parPage: vue === "carte" ? 500 : PAR_PAGE,
    autour, vue,
  };
}

/** Nombre de filtres actifs dans la feuille « Filtrer et trier (N) » (le type a ses propres onglets). */
export function nbFiltres(r: Recherche & { autour: boolean }): number {
  const triParDefaut = r.autour ? "distance" : "note";
  return (r.metiers?.length ? 1 : 0) + (r.quartier ? 1 : 0) + (r.livraison ? 1 : 0) + (r.tri !== triParDefaut ? 1 : 0);
}

/** Adresse de l'annuaire en gardant les paramètres actuels, sauf ceux qu'on change (undefined = retirer). */
export function lienAnnuaire(sp: ParamsAnnuaire, maj: Partial<ParamsAnnuaire>): string {
  const u = new URLSearchParams(
    Object.entries({ ...sp, page: undefined, ...maj }).filter(([, v]) => v) as [string, string][]);
  const s = u.toString();
  return s ? `/annuaire?${s}` : "/annuaire";
}
