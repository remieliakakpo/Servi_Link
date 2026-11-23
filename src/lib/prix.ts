import { joursDepuis } from "./format";

// Règle de fraîcheur des prix (V1-03, V1-04) : « ancien » après 14 jours, masqué après 30.
// Les seuils sont réglables dans le back-office (table parametres) ; ces valeurs sont les défauts.
// La base applique déjà la règle dans les vues publiques ; on la rejoue côté appli pour les
// prix gardés hors connexion, qui vieillissent dans le téléphone.
export const SEUILS_DEFAUT = { ancien: 14, masque: 30 } as const;
export type Seuils = { ancien: number; masque: number };

export type Fraicheur = "frais" | "ancien" | "masque";

export function fraicheur(dateReleve: string, seuils: Seuils = SEUILS_DEFAUT, maintenant = new Date()): Fraicheur {
  const j = joursDepuis(dateReleve, maintenant);
  if (j > seuils.masque) return "masque";
  if (j > seuils.ancien) return "ancien";
  return "frais";
}

/** Écart en % entre la moyenne de la semaine et celle de la semaine d'avant (arrondi à 0,1). */
export function ecartPourcent(actuel: number | null, precedent: number | null): number | null {
  if (actuel == null || precedent == null || precedent === 0) return null;
  return Math.round(((actuel - precedent) / precedent) * 1000) / 10;
}

/** « sac de 50 kg » -> « par sac », « m³ » -> « le m³ » (sous le prix). */
export function parUnite(unite: string): string {
  if (unite === "m³") return "le m³";
  return `par ${unite.split(" ")[0]}`;
}
