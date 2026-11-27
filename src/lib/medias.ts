import { urlPhoto } from "./photos";
import type { Fiche, RealisationPublique } from "./types";

/** Ce que le bloc Réalisations montre : les réalisations publiées, puis les anciennes photos de chantier. */
export function mediasFiche(f: Pick<Fiche, "realisations" | "photos">): RealisationPublique[] {
  return [...f.realisations, ...f.photos.filter((p) => !p.principale).map((p) => ({
    id: p.chemin, type: "photo" as const, url: urlPhoto(p.chemin), etiquette: null, legende: p.legende, publie_le: null, duree: null,
  }))];
}
