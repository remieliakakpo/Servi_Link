import { describe, expect, it } from "vitest";
import { calculer, COEFFS_V1, listeTexte } from "./calculateur";
import { dateCourte, fcfa, fourchette, telephone, numeroInternational } from "./format";
import { ecartPourcent, fraicheur } from "./prix";
import { lienWhatsApp, remplir } from "./whatsapp";

describe("format", () => {
  it("affiche les montants en FCFA", () => {
    expect(fcfa(5250).replace(/\s/g, " ")).toBe("5 250 F");
    expect(fourchette(2500, 3500).replace(/\s/g, " ")).toBe("2 500 – 3 500 F");
    expect(fourchette(null, null)).toBe("Sur devis");
  });
  it("normalise les numéros togolais comme le script d'import", () => {
    expect(telephone("90123456")).toBe("+228 90 12 34 56");
    expect(telephone("00228 90-12-34-56")).toBe("+228 90 12 34 56");
    expect(numeroInternational("+228 90 12 34 56")).toBe("22890123456");
  });
  it("affiche les dates au format togolais", () => {
    expect(dateCourte("2026-11-17")).toBe("17/11/2026");
  });
});

describe("prix", () => {
  const le = new Date("2026-11-17T10:00:00Z");
  it("applique 14 j ancien / 30 j masqué", () => {
    expect(fraicheur("2026-11-03", undefined, le)).toBe("frais");   // 14 j
    expect(fraicheur("2026-11-02", undefined, le)).toBe("ancien");  // 15 j
    expect(fraicheur("2026-10-18", undefined, le)).toBe("ancien");  // 30 j
    expect(fraicheur("2026-10-17", undefined, le)).toBe("masque");  // 31 j
  });
  it("calcule l'écart avec la semaine précédente", () => {
    expect(ecartPourcent(5250, 5000)).toBe(5);
    expect(ecartPourcent(5000, null)).toBeNull();
  });
});

describe("whatsapp", () => {
  it("pré-remplit le message avec ServiLink et la référence de la fiche", () => {
    const msg = remplir("Bonjour {nom}, je vous contacte via ServiLink (fiche {id}).", { nom: "Kossi", id: "ID-001" });
    expect(lienWhatsApp("90 12 34 56", msg)).toBe(
      "https://wa.me/22890123456?text=" + encodeURIComponent("Bonjour Kossi, je vous contacte via ServiLink (fiche ID-001)."),
    );
    expect(lienWhatsApp(null, msg)).toBeNull();
  });
});

describe("calculateur : autres ouvrages", () => {
  it("12 poteaux 20 × 20 de 3 m en HA12", () => {
    const r = calculer({ ouvrage: "poteaux", nombre: 12, hauteur_m: 3, section: "20x20", diametre: "HA12" });
    // 1,44 m³ : ciment 504 kg × 1,05 / 50 = 10,6 -> 11 sacs ; fer 187,2 kg × 1,05 / (0,888 × 12) = 18,4 -> 19 barres
    expect(r.volume_m3).toBe(1.44);
    expect(r.ciment_sacs).toBe(11);
    expect(r.fer_barres).toBe(19);
  });
  it("carrelage 20 m² : carreaux avec 10 % de coupes, colle en sacs de 25 kg", () => {
    const r = calculer({ ouvrage: "carrelage", surface_m2: 20 });
    expect(r.autres.map((a) => [a.materiau, a.quantite])).toEqual([["Carreaux", 22], ["Colle à carrelage", 5], ["Joint", 9]]);
    expect(listeTexte(r)).toContain("Carreaux : 22 m²");
  });
  it("peinture 60 m² en 2 couches", () => {
    const r = calculer({ ouvrage: "peinture", surface_m2: 60, couches: 2 });
    expect(r.autres[0].quantite).toBe(13); // 12 L × 1,05 = 12,6 -> 13 L
    expect(r.ciment_sacs).toBe(0);
  });
  it("anciennes versions en base sans les nouveaux coefficients", () => {
    const { beton_arme: _, ...ancien } = COEFFS_V1;
    expect(calculer({ ouvrage: "chainage", longueur_m: 10, section: "20x30", diametre: "HA10" }, ancien).ciment_sacs).toBeGreaterThan(0);
  });
});

describe("calculateur (coefficients provisoires)", () => {
  it("mur de clôture 20 m × 2 m en agglos de 15, sans enduit", () => {
    const r = calculer({ ouvrage: "mur_cloture", longueur_m: 20, hauteur_m: 2, epaisseur: "15", enduit_faces: 0 });
    // 40 m² × 10 agglos × 1,05 = 420 ; mortier 0,6 m³ × 300 kg = 180 kg × 1,05 / 50 = 3,78 -> 4 sacs
    expect(r.agglos).toBe(420);
    expect(r.ciment_sacs).toBe(4);
    expect(r.sable_m3).toBe(0.7);
    expect(r.fer_barres).toBe(0);
  });
  it("exemple de la maquette : mur 10 × 2 m, 2 m² d'ouvertures -> 18 m², 189 agglos", () => {
    const r = calculer({ ouvrage: "mur_cloture", longueur_m: 10, hauteur_m: 2, ouvertures_m2: 2, epaisseur: "15", enduit_faces: 0 });
    expect(r.surface_m2).toBe(18);
    expect(r.agglos).toBe(189);
  });
  it("dalle 5 × 4 m de 15 cm en HA10", () => {
    const r = calculer({ ouvrage: "dalle", longueur_m: 5, largeur_m: 4, epaisseur_cm: 15, diametre: "HA10" });
    // 3 m³ : ciment 1050 kg × 1,05 / 50 = 22,05 -> 23 sacs ; fer 240 kg × 1,05 / (0,617 × 12) = 34,03 -> 35 barres
    expect(r.ciment_sacs).toBe(23);
    expect(r.gravier_m3).toBe(2.7);
    expect(r.fer_barres).toBe(35);
    expect(listeTexte(r)).toContain("Fer HA10 : 35 barres de 12 m");
  });
  it("ignore les valeurs négatives ou vides", () => {
    const r = calculer({ ouvrage: "piece", longueur_m: -4, largeur_m: Number.NaN, hauteur_m: 3, ouvertures_m2: 0, epaisseur: "20", enduit_faces: 2 });
    expect(r.agglos).toBe(0);
    expect(r.ciment_sacs).toBe(0);
  });
});
