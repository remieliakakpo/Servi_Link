// Calculateur de matériaux (V1-05).
// Fonctions pures, sans réseau : la page marche hors connexion une fois chargée.
// Les coefficients viennent de la table parametres_calculateur (version active) ;
// COEFFS_V1 n'est que la copie de secours embarquée dans l'appli, identique au seed.
// ⚠ Valeurs PROVISOIRES tant que l'ingénieur partenaire n'a pas validé les 10 cas de test.

export type Coefficients = {
  marge_pertes: number;
  agglo: { par_m2: Record<Epaisseur, number>; format?: string };
  mortier_pose: { m3_par_m2: Record<Epaisseur, number>; ciment_kg_m3: number; sable_m3_par_m3: number };
  enduit: { epaisseur_m: number; ciment_kg_m3: number; sable_m3_par_m3: number };
  beton_dalle: { ciment_kg_m3: number; sable_m3_par_m3: number; gravier_m3_par_m3: number };
  fer_dalle: { kg_par_m3: number };
  fer_kg_par_m: Record<Diametre, number>;
  barre_m: number;
  sac_kg: number;
};
export type Epaisseur = "15" | "20";
export type Diametre = "HA8" | "HA10" | "HA12";

export const COEFFS_V1: Coefficients = {
  marge_pertes: 0.05,
  agglo: { par_m2: { "15": 10, "20": 10 }, format: "50 × 20 cm" },
  mortier_pose: { m3_par_m2: { "15": 0.015, "20": 0.02 }, ciment_kg_m3: 300, sable_m3_par_m3: 1.1 },
  enduit: { epaisseur_m: 0.015, ciment_kg_m3: 350, sable_m3_par_m3: 1.1 },
  beton_dalle: { ciment_kg_m3: 350, sable_m3_par_m3: 0.45, gravier_m3_par_m3: 0.85 },
  fer_dalle: { kg_par_m3: 80 },
  fer_kg_par_m: { HA8: 0.395, HA10: 0.617, HA12: 0.888 },
  barre_m: 12,
  sac_kg: 50,
};

export type Entrees =
  | { ouvrage: "mur_cloture"; longueur_m: number; hauteur_m: number; ouvertures_m2?: number; epaisseur: Epaisseur; enduit_faces: 0 | 1 | 2 }
  | { ouvrage: "piece"; longueur_m: number; largeur_m: number; hauteur_m: number; ouvertures_m2: number; epaisseur: Epaisseur; enduit_faces: 0 | 1 | 2 }
  | { ouvrage: "dalle"; longueur_m: number; largeur_m: number; epaisseur_cm: number; diametre: Diametre };

/** Résultat en unités d'achat (sacs de 50 kg, agglos, barres de 12 m, m³). */
export type Resultat = {
  ciment_sacs: number;
  agglos: number;
  sable_m3: number;
  gravier_m3: number;
  fer_barres: number;
  fer_diametre: Diametre | null;
  /** Surface de mur (m²) ou volume de béton (m³), pour le détail sous le résultat. */
  surface_m2: number;
  volume_m3: number;
  hypotheses: string[];
};

// Arrondis au-dessus (on n'achète pas 3,78 sacs), en tolérant les erreurs de virgule flottante
const entierSup = (v: number) => Math.max(0, Math.ceil(v - 1e-9));
const m3 = (v: number) => entierSup(v * 10) / 10; // au 0,1 m³ supérieur
const fr = (v: number, d: number) => v.toFixed(d).replace(".", ",");
const positif = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

export function calculer(e: Entrees, c: Coefficients = COEFFS_V1): Resultat {
  const marge = 1 + c.marge_pertes;
  let cimentKg = 0, sable = 0, gravier = 0, agglos = 0, ferKg = 0;
  let diametre: Diametre | null = null;
  let surfaceMur = 0, volumeBeton = 0;
  const hyp: string[] = [`${Math.round(c.marge_pertes * 100)} % de pertes ajoutées sur chaque matériau.`];

  if (e.ouvrage === "mur_cloture" || e.ouvrage === "piece") {
    const surface = e.ouvrage === "piece"
      ? positif(2 * (positif(e.longueur_m) + positif(e.largeur_m)) * positif(e.hauteur_m) - positif(e.ouvertures_m2))
      : positif(positif(e.longueur_m) * positif(e.hauteur_m) - positif(e.ouvertures_m2 ?? 0));
    surfaceMur = surface;
    agglos = surface * c.agglo.par_m2[e.epaisseur];
    const mortier = surface * c.mortier_pose.m3_par_m2[e.epaisseur];
    cimentKg += mortier * c.mortier_pose.ciment_kg_m3;
    sable += mortier * c.mortier_pose.sable_m3_par_m3;
    const enduit = surface * e.enduit_faces * c.enduit.epaisseur_m;
    cimentKg += enduit * c.enduit.ciment_kg_m3;
    sable += enduit * c.enduit.sable_m3_par_m3;
    hyp.push(
      `Surface de mur : ${fr(surface, 1)} m²${e.ouvrage === "piece" || e.ouvertures_m2 ? " (ouvertures déduites)" : ""}.`,
      `${c.agglo.par_m2[e.epaisseur]} agglos de ${e.epaisseur} au m², mortier de pose dosé à ${c.mortier_pose.ciment_kg_m3} kg/m³.`,
      e.enduit_faces ? `Enduit de ${fr(c.enduit.epaisseur_m * 100, 1)} cm sur ${e.enduit_faces} face(s), dosé à ${c.enduit.ciment_kg_m3} kg/m³.` : "Sans enduit.",
      "Fondations, chaînages et poteaux non compris.",
    );
  } else {
    const volume = positif(e.longueur_m) * positif(e.largeur_m) * positif(e.epaisseur_cm) / 100;
    volumeBeton = volume;
    cimentKg += volume * c.beton_dalle.ciment_kg_m3;
    sable += volume * c.beton_dalle.sable_m3_par_m3;
    gravier += volume * c.beton_dalle.gravier_m3_par_m3;
    ferKg = volume * c.fer_dalle.kg_par_m3;
    diametre = e.diametre;
    hyp.push(
      `Volume de béton : ${fr(volume, 2)} m³, dosé à ${c.beton_dalle.ciment_kg_m3} kg/m³.`,
      `Ferraillage moyen de ${c.fer_dalle.kg_par_m3} kg/m³ en ${e.diametre} (${fr(c.fer_kg_par_m[e.diametre], 3)} kg/m).`,
      "Coffrage, étais et poutres non compris.",
    );
  }

  return {
    ciment_sacs: entierSup((cimentKg * marge) / c.sac_kg),
    agglos: entierSup(agglos * marge),
    sable_m3: m3(sable * marge),
    gravier_m3: m3(gravier * marge),
    fer_barres: diametre ? entierSup((ferKg * marge) / (c.fer_kg_par_m[diametre] * c.barre_m)) : 0,
    fer_diametre: diametre,
    surface_m2: Math.round(surfaceMur * 10) / 10,
    volume_m3: Math.round(volumeBeton * 100) / 100,
    hypotheses: hyp,
  };
}

/** Liste lisible pour le message WhatsApp « Envoyer ma liste ». */
export function listeTexte(r: Resultat): string {
  const l: string[] = [];
  if (r.ciment_sacs) l.push(`- Ciment : ${r.ciment_sacs} sacs de 50 kg`);
  if (r.agglos) l.push(`- Agglos : ${r.agglos}`);
  if (r.fer_barres) l.push(`- Fer ${r.fer_diametre} : ${r.fer_barres} barres de 12 m`);
  if (r.sable_m3) l.push(`- Sable : ${r.sable_m3.toLocaleString("fr-FR")} m³`);
  if (r.gravier_m3) l.push(`- Gravier : ${r.gravier_m3.toLocaleString("fr-FR")} m³`);
  return l.join("\n");
}
