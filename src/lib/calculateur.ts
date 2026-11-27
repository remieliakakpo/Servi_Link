// Calculateur de matériaux (V1-05).
// Fonctions pures, sans réseau : la page marche hors connexion une fois chargée.
// Les coefficients viennent de la table parametres_calculateur (version active) ;
// COEFFS_V1 n'est que la copie de secours embarquée dans l'appli, identique au seed.
// ⚠ Valeurs courantes au Togo, à faire valider par l'ingénieur partenaire (10 cas de test).

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
  /** Ajoutés le 28/11 (absents des anciennes versions en base : on reprend alors ceux de l'appli). */
  beton_arme?: { ciment_kg_m3: number; sable_m3_par_m3: number; gravier_m3_par_m3: number; fer_kg_m3: { fondation: number; poteau: number; poutre: number } };
  beton_sol?: { ciment_kg_m3: number; sable_m3_par_m3: number; gravier_m3_par_m3: number };
  chape?: { ciment_kg_m3: number; sable_m3_par_m3: number };
  carrelage?: { pertes: number; colle_kg_m2: number; sac_colle_kg: number; joint_kg_m2: number };
  peinture?: { m2_par_litre: number; seau_l: number };
  paves?: { par_m2: number; sable_m3_par_m2: number };
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
  beton_arme: { ciment_kg_m3: 350, sable_m3_par_m3: 0.45, gravier_m3_par_m3: 0.85, fer_kg_m3: { fondation: 50, poteau: 130, poutre: 110 } },
  beton_sol: { ciment_kg_m3: 300, sable_m3_par_m3: 0.45, gravier_m3_par_m3: 0.85 },
  chape: { ciment_kg_m3: 350, sable_m3_par_m3: 1.1 },
  carrelage: { pertes: 0.1, colle_kg_m2: 5, sac_colle_kg: 25, joint_kg_m2: 0.4 },
  peinture: { m2_par_litre: 10, seau_l: 20 },
  paves: { par_m2: 40, sable_m3_par_m2: 0.05 },
};

export type Entrees =
  | { ouvrage: "mur_cloture"; longueur_m: number; hauteur_m: number; ouvertures_m2?: number; epaisseur: Epaisseur; enduit_faces: 0 | 1 | 2 }
  | { ouvrage: "piece"; longueur_m: number; largeur_m: number; hauteur_m: number; ouvertures_m2: number; epaisseur: Epaisseur; enduit_faces: 0 | 1 | 2 }
  | { ouvrage: "dalle"; longueur_m: number; largeur_m: number; epaisseur_cm: number; diametre: Diametre }
  | { ouvrage: "fondation"; longueur_m: number; largeur_cm: number; profondeur_cm: number; diametre: Diametre }
  | { ouvrage: "poteaux"; nombre: number; hauteur_m: number; section: Section; diametre: Diametre }
  | { ouvrage: "chainage"; longueur_m: number; section: Section; diametre: Diametre }
  | { ouvrage: "dallage"; longueur_m: number; largeur_m: number; epaisseur_cm: number }
  | { ouvrage: "chape"; longueur_m: number; largeur_m: number; epaisseur_cm: number }
  | { ouvrage: "enduit"; surface_m2: number; enduit_faces: 1 | 2 }
  | { ouvrage: "carrelage"; surface_m2: number }
  | { ouvrage: "peinture"; surface_m2: number; couches: 1 | 2 | 3 }
  | { ouvrage: "paves"; surface_m2: number };
/** Section de poteau ou de poutre, en cm. */
export type Section = "15x15" | "15x20" | "20x20" | "20x30" | "20x40";
export const SECTIONS: Section[] = ["15x15", "15x20", "20x20", "20x30", "20x40"];
const aireSection = (s: Section) => s.split("x").reduce((a, b) => a * Number(b), 1) / 10000;

/** Autre matériau du résultat (carreaux, colle, peinture, pavés). */
export type Autre = { materiau: string; quantite: number; unite: string; detail: string };

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
  autres: Autre[];
};

// Arrondis au-dessus (on n'achète pas 3,78 sacs), en tolérant les erreurs de virgule flottante
const entierSup = (v: number) => Math.max(0, Math.ceil(v - 1e-9));
const m3 = (v: number) => entierSup(v * 10) / 10; // au 0,1 m³ supérieur
const fr = (v: number, d: number) => v.toFixed(d).replace(".", ",");
const positif = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

export function calculer(e: Entrees, coeffs: Coefficients = COEFFS_V1): Resultat {
  const c: Required<Coefficients> = { ...COEFFS_V1, ...coeffs } as Required<Coefficients>;
  const marge = 1 + c.marge_pertes;
  let cimentKg = 0, sable = 0, gravier = 0, agglos = 0, ferKg = 0;
  let diametre: Diametre | null = null;
  let surfaceMur = 0, volumeBeton = 0;
  const autres: Autre[] = [];
  const hyp: string[] = [`${Math.round(c.marge_pertes * 100)} % de pertes ajoutées sur chaque matériau.`];
  // Béton : ciment, sable, gravier (et fer pour le béton armé)
  const beton = (volume: number, d: { ciment_kg_m3: number; sable_m3_par_m3: number; gravier_m3_par_m3: number }) => {
    volumeBeton += volume; cimentKg += volume * d.ciment_kg_m3; sable += volume * d.sable_m3_par_m3; gravier += volume * d.gravier_m3_par_m3;
  };
  const mortier = (volume: number, d: { ciment_kg_m3: number; sable_m3_par_m3: number }) => { cimentKg += volume * d.ciment_kg_m3; sable += volume * d.sable_m3_par_m3; };

  switch (e.ouvrage) {
    case "mur_cloture":
    case "piece": {
      const surface = e.ouvrage === "piece"
        ? positif(2 * (positif(e.longueur_m) + positif(e.largeur_m)) * positif(e.hauteur_m) - positif(e.ouvertures_m2))
        : positif(positif(e.longueur_m) * positif(e.hauteur_m) - positif(e.ouvertures_m2 ?? 0));
      surfaceMur = surface;
      agglos = surface * c.agglo.par_m2[e.epaisseur];
      mortier(surface * c.mortier_pose.m3_par_m2[e.epaisseur], c.mortier_pose);
      mortier(surface * e.enduit_faces * c.enduit.epaisseur_m, c.enduit);
      hyp.push(
        `Surface de mur : ${fr(surface, 1)} m²${e.ouvrage === "piece" || e.ouvertures_m2 ? " (ouvertures déduites)" : ""}.`,
        `${c.agglo.par_m2[e.epaisseur]} agglos de ${e.epaisseur} au m², mortier de pose dosé à ${c.mortier_pose.ciment_kg_m3} kg/m³.`,
        e.enduit_faces ? `Enduit de ${fr(c.enduit.epaisseur_m * 100, 1)} cm sur ${e.enduit_faces} face(s), dosé à ${c.enduit.ciment_kg_m3} kg/m³.` : "Sans enduit.",
        "Fondations, chaînages et poteaux non compris : ajoutez-les à part.",
      );
      break;
    }
    case "dalle": {
      const volume = positif(e.longueur_m) * positif(e.largeur_m) * positif(e.epaisseur_cm) / 100;
      beton(volume, c.beton_dalle);
      ferKg = volume * c.fer_dalle.kg_par_m3; diametre = e.diametre;
      hyp.push(`Volume de béton : ${fr(volume, 2)} m³, dosé à ${c.beton_dalle.ciment_kg_m3} kg/m³.`,
        `Ferraillage moyen de ${c.fer_dalle.kg_par_m3} kg/m³ en ${e.diametre}.`, "Coffrage, étais et poutres non compris.");
      break;
    }
    case "fondation":
    case "poteaux":
    case "chainage": {
      const volume = e.ouvrage === "fondation" ? positif(e.longueur_m) * positif(e.largeur_cm) / 100 * positif(e.profondeur_cm) / 100
        : e.ouvrage === "poteaux" ? Math.round(positif(e.nombre)) * positif(e.hauteur_m) * aireSection(e.section)
        : positif(e.longueur_m) * aireSection(e.section);
      const cle = e.ouvrage === "fondation" ? "fondation" : e.ouvrage === "poteaux" ? "poteau" : "poutre";
      beton(volume, c.beton_arme);
      ferKg = volume * c.beton_arme.fer_kg_m3[cle]; diametre = e.diametre;
      hyp.push(`Volume de béton armé : ${fr(volume, 2)} m³, dosé à ${c.beton_arme.ciment_kg_m3} kg/m³.`,
        `Ferraillage moyen de ${c.beton_arme.fer_kg_m3[cle]} kg/m³ (barres et cadres), compté en ${e.diametre}.`,
        e.ouvrage === "fondation" ? "Fouille et béton de propreté non compris." : "Coffrage non compris.");
      break;
    }
    case "dallage":
    case "chape": {
      const volume = positif(e.longueur_m) * positif(e.largeur_m) * positif(e.epaisseur_cm) / 100;
      if (e.ouvrage === "dallage") { beton(volume, c.beton_sol); hyp.push(`Béton de sol non armé : ${fr(volume, 2)} m³, dosé à ${c.beton_sol.ciment_kg_m3} kg/m³.`); }
      else { mortier(volume, c.chape); volumeBeton = volume; hyp.push(`Mortier de chape : ${fr(volume, 2)} m³, dosé à ${c.chape.ciment_kg_m3} kg/m³.`); }
      break;
    }
    case "enduit": {
      const surface = positif(e.surface_m2); surfaceMur = surface;
      mortier(surface * e.enduit_faces * c.enduit.epaisseur_m, c.enduit);
      hyp.push(`Enduit de ${fr(c.enduit.epaisseur_m * 100, 1)} cm sur ${e.enduit_faces} face(s) de ${fr(surface, 1)} m², dosé à ${c.enduit.ciment_kg_m3} kg/m³.`);
      break;
    }
    case "carrelage": {
      const surface = positif(e.surface_m2); const k = c.carrelage;
      if (surface) autres.push(
        { materiau: "Carreaux", quantite: m3(surface * (1 + k.pertes)), unite: "m²", detail: `${Math.round(k.pertes * 100)} % de coupes et casse` },
        { materiau: "Colle à carrelage", quantite: entierSup(surface * k.colle_kg_m2 * marge / k.sac_colle_kg), unite: `sacs de ${k.sac_colle_kg} kg`, detail: `${k.colle_kg_m2} kg au m²` },
        { materiau: "Joint", quantite: entierSup(surface * k.joint_kg_m2 * marge), unite: "kg", detail: `${fr(k.joint_kg_m2, 1)} kg au m²` },
      );
      hyp.push(`Pose à la colle sur ${fr(surface, 1)} m² de sol ou de mur déjà dressé.`, "Plinthes non comprises.");
      break;
    }
    case "peinture": {
      const surface = positif(e.surface_m2); const k = c.peinture;
      const litres = entierSup(surface * e.couches / k.m2_par_litre * marge);
      const sousCouche = entierSup(surface / k.m2_par_litre * marge);
      if (surface) autres.push(
        { materiau: "Peinture", quantite: litres, unite: "litres", detail: `${e.couches} couche${e.couches > 1 ? "s" : ""} · ${Math.ceil(litres / k.seau_l)} seau${litres > k.seau_l ? "x" : ""} de ${k.seau_l} L` },
        { materiau: "Sous-couche", quantite: sousCouche, unite: "litres", detail: "1 couche sur mur neuf" },
      );
      hyp.push(`Rendement de ${k.m2_par_litre} m² par litre et par couche sur ${fr(surface, 1)} m².`);
      break;
    }
    case "paves": {
      const surface = positif(e.surface_m2); const k = c.paves;
      if (surface) autres.push({ materiau: "Pavés", quantite: entierSup(surface * k.par_m2 * marge), unite: "pavés", detail: `${k.par_m2} au m²` });
      sable += surface * k.sable_m3_par_m2;
      hyp.push(`${k.par_m2} pavés au m² (pavé autobloquant courant), lit de sable de ${Math.round(k.sable_m3_par_m2 * 100)} cm.`, "Bordures et compactage non compris.");
      break;
    }
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
    autres,
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
  for (const a of r.autres) l.push(`- ${a.materiau} : ${a.quantite.toLocaleString("fr-FR")} ${a.unite}`);
  return l.join("\n");
}
