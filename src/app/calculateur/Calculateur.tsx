"use client";
import { ListeChoix } from "@/components/ListeChoix";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Box, BrickWall, Layers, Mountain, Package, Ruler, Scale, type LucideIcon } from "lucide-react";
import { calculer, listeTexte, type Coefficients, type Entrees, type Resultat } from "@/lib/calculateur";
import { compter, rpcPublique } from "@/lib/compter";

type Props = { version: number; coefficients: Coefficients; modeleMessage: string };
type Ouvrage = Entrees["ouvrage"];

const OUVRAGES: Record<Ouvrage, { label: string; Icone: LucideIcon }> = {
  mur_cloture: { label: "Mur de clôture", Icone: BrickWall },
  piece: { label: "Murs d'une pièce", Icone: BrickWall },
  dalle: { label: "Dalle", Icone: Layers },
};

const CHAMPS: Record<Ouvrage, [string, string][]> = {
  mur_cloture: [["longueur", "Longueur (m)"], ["hauteur", "Hauteur (m)"], ["ouvertures", "Ouvertures (m²)"]],
  piece: [["longueur", "Longueur (m)"], ["largeur", "Largeur (m)"], ["hauteur", "Hauteur (m)"], ["ouvertures", "Ouvertures (m²)"]],
  dalle: [["longueur", "Longueur (m)"], ["largeur", "Largeur (m)"], ["epaisseur", "Épaisseur (cm)"]],
};

const nb = (s: string) => Number(s.replace(",", "."));
const fr = (n: number) => n.toLocaleString("fr-FR");

export function Calculateur({ version, coefficients, modeleMessage }: Props) {
  const [ouvrage, setOuvrage] = useState<Ouvrage>("mur_cloture");
  const [v, setV] = useState<Record<string, string>>({ longueur: "10", largeur: "4", hauteur: "2", ouvertures: "2", epaisseur: "15" });
  const [resultat, setResultat] = useState<{ r: Resultat; e: Entrees } | null>(null);
  const [partage, setPartage] = useState<"" | "en_cours">("");

  // Options pas encore dans la maquette : agglos de 15, sans enduit, fer HA10
  const entrees: Entrees = useMemo(() => {
    if (ouvrage === "dalle") return { ouvrage, longueur_m: nb(v.longueur), largeur_m: nb(v.largeur), epaisseur_cm: nb(v.epaisseur), diametre: "HA10" };
    if (ouvrage === "piece") return { ouvrage, longueur_m: nb(v.longueur), largeur_m: nb(v.largeur), hauteur_m: nb(v.hauteur), ouvertures_m2: nb(v.ouvertures), epaisseur: "15", enduit_faces: 0 };
    return { ouvrage, longueur_m: nb(v.longueur), hauteur_m: nb(v.hauteur), ouvertures_m2: nb(v.ouvertures), epaisseur: "15", enduit_faces: 0 };
  }, [ouvrage, v]);

  function estimer(ev: React.FormEvent) {
    ev.preventDefault();
    setResultat({ r: calculer(entrees, coefficients), e: entrees });
    compter("calcul", ouvrage);
  }

  // « Partager ma liste » : enregistre le calcul pour obtenir un code SLK (sans réseau : sans code),
  // puis ouvre le partage du téléphone, ou WhatsApp à défaut.
  async function partager() {
    if (!resultat) return;
    setPartage("en_cours");
    let code = "à attribuer";
    try {
      code = await rpcPublique<string>("enregistrer_calcul", { p_version: version, p_type_ouvrage: resultat.e.ouvrage, p_entrees: resultat.e, p_resultats: resultat.r });
    } catch { /* hors connexion ou mode démo */ }
    const texte = `${modeleMessage.replace("{code}", code)}\n${listeTexte(resultat.r)}`;
    setPartage("");
    try {
      if (navigator.share) return await navigator.share({ text: texte });
    } catch { return; /* partage annulé */ }
    window.location.href = `https://wa.me/?text=${encodeURIComponent(texte)}`;
  }

  const marge = `marge de ${Math.round(coefficients.marge_pertes * 100)} %`;
  const r = resultat?.r;
  const lignes: { titre: string; valeur: string; details: string[]; Icone: LucideIcon; materiau: string }[] = r ? [
    ...(r.agglos ? [{ titre: "Agglos à prévoir", valeur: `${fr(r.agglos)} blocs`, Icone: Box, materiau: "Agglos",
      details: [`${fr(r.surface_m2)} m² de mur · ${marge}`, ...(coefficients.agglo.format ? [`Format de pose : ${coefficients.agglo.format}`] : [])] }] : []),
    ...(r.ciment_sacs ? [{ titre: "Ciment à prévoir", valeur: `${r.ciment_sacs} sac${r.ciment_sacs > 1 ? "s" : ""}`, Icone: Package, materiau: "Ciment",
      details: [`Sacs de ${coefficients.sac_kg} kg · ${marge}`, r.volume_m3 ? `${fr(r.volume_m3)} m³ de béton` : "Mortier de pose"] }] : []),
    ...(r.fer_barres ? [{ titre: "Fer à prévoir", valeur: `${r.fer_barres} barres`, Icone: Ruler, materiau: "Fer à béton",
      details: [`${r.fer_diametre} de ${coefficients.barre_m} m · ${marge}`] }] : []),
    ...(r.sable_m3 ? [{ titre: "Sable à prévoir", valeur: `${fr(r.sable_m3)} m³`, Icone: Mountain, materiau: "Sable", details: [marge] }] : []),
    ...(r.gravier_m3 ? [{ titre: "Gravier à prévoir", valeur: `${fr(r.gravier_m3)} m³`, Icone: Mountain, materiau: "Gravier", details: [marge] }] : []),
  ] : [];
  const { Icone: IconeOuvrage } = OUVRAGES[ouvrage];

  return (
    <div className="page" style={{ display: "grid", gap: 16, width: "100%" }}>
      <form onSubmit={estimer} style={{ display: "grid", gap: 16 }}>
        <p className="champ-titre">Ouvrage</p>
        <div className="selecteur-tuile">
          <span className="tuile tuile-sombre"><IconeOuvrage size={40} strokeWidth={1.6} aria-hidden="true" /></span>
          <ListeChoix className="selecteur" valeur={ouvrage} aria-label="Ouvrage"
            onChoix={(k) => { setOuvrage(k as Ouvrage); setResultat(null); }}
            options={Object.entries(OUVRAGES).map(([k, o]) => ({ value: k, label: o.label }))} />
        </div>
        <div className="trois-champs">
          {CHAMPS[ouvrage].map(([cle, label]) => (
            <label key={cle}>{label}
              <input className="champ" inputMode="decimal" value={v[cle]} onChange={(e) => { setV({ ...v, [cle]: e.target.value }); setResultat(null); }} />
            </label>
          ))}
        </div>
        <button className="bouton bouton-orange bouton-plein" type="submit">Estimer les quantités</button>
      </form>

      {r && (
        <>
          <div aria-live="polite" style={{ display: "grid", gap: 12 }}>
            {lignes.length === 0 && <p className="alerte">Saisissez des dimensions pour obtenir une estimation.</p>}
            {lignes.map((l) => (
              <section key={l.titre} className="carte resultat">
                <h2>{l.titre}</h2>
                <span className="tuile tuile-grande tuile-sombre"><l.Icone size={52} strokeWidth={1.5} aria-hidden="true" /></span>
                <div>
                  <span className="resultat-valeur">{l.valeur}</span>
                  {l.details.map((d) => <p key={d}>{d}</p>)}
                </div>
              </section>
            ))}
          </div>
          {lignes.length > 0 && (
            <>
              {/* Hypothèses et marge d'erreur exigées par le cahier des charges (V1-05) : présentation provisoire */}
              <details className="muet">
                <summary style={{ cursor: "pointer", minHeight: 44 }}>Hypothèses du calcul (estimation à ± 10 %)</summary>
                <ul>{r.hypotheses.map((h) => <li key={h}>{h}</li>)}</ul>
                <p>Formules version {version}, en cours de validation par un ingénieur.</p>
              </details>
              <Link href={`/prix?m=${encodeURIComponent(lignes[0].materiau)}`} className="bouton bouton-contour bouton-plein">
                <Scale size={28} aria-hidden="true" />Comparer les prix
              </Link>
              <button type="button" className="lien-simple lien-orange lien-souligne" onClick={partager} disabled={partage === "en_cours"}>
                {partage ? "Préparation…" : "Partager ma liste"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
