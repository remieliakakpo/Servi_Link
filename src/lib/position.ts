"use client";

// Position du téléphone pour « Autour de moi ». On ne la demande qu'au moment où la personne
// choisit cette option, on la garde 10 minutes dans l'onglet, et elle ne quitte jamais le
// téléphone sauf dans l'adresse de la recherche (arrondie à ~100 m).
const CLE = "slk-position";
const DUREE_MS = 10 * 60 * 1000;

export type Position = { lat: number; lng: number };
export type ErreurPosition = "refusee" | "indisponible" | "non_supportee";

const arrondir = (v: number) => Math.round(v * 1000) / 1000;

export function positionMemorisee(): Position | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(CLE) ?? "null");
    return p && Date.now() - p.t < DUREE_MS ? { lat: p.lat, lng: p.lng } : null;
  } catch {
    return null;
  }
}

export function demanderPosition(): Promise<Position> {
  const deja = positionMemorisee();
  if (deja) return Promise.resolve(deja);
  return new Promise((ok, ko) => {
    if (!("geolocation" in navigator)) return ko("non_supportee" satisfies ErreurPosition);
    navigator.geolocation.getCurrentPosition(
      (g) => {
        const p = { lat: arrondir(g.coords.latitude), lng: arrondir(g.coords.longitude) };
        try { sessionStorage.setItem(CLE, JSON.stringify({ ...p, t: Date.now() })); } catch { /* navigation privée */ }
        ok(p);
      },
      (e) => ko((e.code === e.PERMISSION_DENIED ? "refusee" : "indisponible") satisfies ErreurPosition),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

export const MESSAGES_POSITION: Record<ErreurPosition, string> = {
  refusee: "Position refusée. Choisissez votre quartier dans la liste.",
  indisponible: "Position introuvable pour le moment. Choisissez votre quartier dans la liste.",
  non_supportee: "Ce téléphone ne donne pas sa position. Choisissez votre quartier dans la liste.",
};
