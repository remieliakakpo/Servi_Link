"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Box, BrickWall, Columns3, Fence, Grid2x2, House, Layers, LayoutGrid, Mountain, Package, PaintRoller, PanelTop, Rows3, Ruler,
  Scale, Shovel, Square, type LucideIcon,
} from "lucide-react";
import { calculer, listeTexte, SECTIONS, type Coefficients, type Diametre, type Entrees, type Epaisseur, type Resultat, type Section } from "@/lib/calculateur";
import { compter, rpcPublique } from "@/lib/compter";

type Props = { version: number; coefficients: Coefficients; modeleMessage: string };
type Ouvrage = Entrees["ouvrage"];

/** Les ouvrages, dans l'ordre d'un chantier : du sol au toit, puis les finitions. */
const OUVRAGES: { cle: Ouvrage; label: string; Icone: LucideIcon; groupe: "Gros œuvre" | "Sols et finitions" }[] = [
  { cle: "fondation", label: "Fondation", Icone: Shovel, groupe: "Gros œuvre" },
  { cle: "poteaux", label: "Poteaux", Icone: Columns3, groupe: "Gros œuvre" },
  { cle: "piece", label: "Murs d'une pièce", Icone: House, groupe: "Gros œuvre" },
  { cle: "mur_cloture", label: "Mur de clôture", Icone: Fence, groupe: "Gros œuvre" },
  { cle: "chainage", label: "Chaînage, poutre", Icone: PanelTop, groupe: "Gros œuvre" },
  { cle: "dalle", label: "Dalle", Icone: Layers, groupe: "Gros œuvre" },
  { cle: "dallage", label: "Dallage au sol", Icone: Square, groupe: "Sols et finitions" },
  { cle: "chape", label: "Chape", Icone: Rows3, groupe: "Sols et finitions" },
  { cle: "enduit", label: "Crépissage", Icone: BrickWall, groupe: "Sols et finitions" },
  { cle: "carrelage", label: "Carrelage", Icone: Grid2x2, groupe: "Sols et finitions" },
  { cle: "peinture", label: "Peinture", Icone: PaintRoller, groupe: "Sols et finitions" },
  { cle: "paves", label: "Pavés", Icone: LayoutGrid, groupe: "Sols et finitions" },
];

type Champ = [cle: string, label: string, unite: string];
const CHAMPS: Record<Ouvrage, Champ[]> = {
  fondation: [["longueur", "Longueur", "m"], ["largeur_cm", "Largeur", "cm"], ["profondeur", "Hauteur", "cm"]],
  poteaux: [["nombre", "Nombre", ""], ["hauteur", "Hauteur", "m"]],
  piece: [["longueur", "Longueur", "m"], ["largeur", "Largeur", "m"], ["hauteur", "Hauteur", "m"], ["ouvertures", "Ouvertures", "m²"]],
  mur_cloture: [["longueur", "Longueur", "m"], ["hauteur", "Hauteur", "m"], ["ouvertures", "Portail", "m²"]],
  chainage: [["longueur", "Longueur totale", "m"]],
  dalle: [["longueur", "Longueur", "m"], ["largeur", "Largeur", "m"], ["epaisseur", "Épaisseur", "cm"]],
  dallage: [["longueur", "Longueur", "m"], ["largeur", "Largeur", "m"], ["epaisseur", "Épaisseur", "cm"]],
  chape: [["longueur", "Longueur", "m"], ["largeur", "Largeur", "m"], ["epaisseur", "Épaisseur", "cm"]],
  enduit: [["surface", "Surface de mur", "m²"]],
  carrelage: [["surface", "Surface", "m²"]],
  peinture: [["surface", "Surface de mur", "m²"]],
  paves: [["surface", "Surface", "m²"]],
};
/** Valeurs proposées au départ pour chaque ouvrage (courantes au Togo). */
const DEPART: Record<Ouvrage, Record<string, string>> = {
  fondation: { longueur: "40", largeur_cm: "40", profondeur: "30" },
  poteaux: { nombre: "12", hauteur: "3" },
  piece: { longueur: "4", largeur: "4", hauteur: "3", ouvertures: "3" },
  mur_cloture: { longueur: "20", hauteur: "2", ouvertures: "0" },
  chainage: { longueur: "40" },
  dalle: { longueur: "5", largeur: "4", epaisseur: "15" },
  dallage: { longueur: "5", largeur: "4", epaisseur: "10" },
  chape: { longueur: "5", largeur: "4", epaisseur: "4" },
  enduit: { surface: "50" },
  carrelage: { surface: "20" },
  peinture: { surface: "60" },
  paves: { surface: "50" },
};

const nb = (s: string | undefined) => Number((s ?? "").replace(",", "."));
const fr = (n: number) => n.toLocaleString("fr-FR");

function Choix<T extends string | number>({ titre, valeur, options, choisir }: { titre: string; valeur: T; options: [T, string][]; choisir: (v: T) => void }) {
  return (
    <div className="calc-choix" role="radiogroup" aria-label={titre}>
      <span>{titre}</span>
      <div>
        {options.map(([v, l]) => (
          <button key={String(v)} type="button" role="radio" aria-checked={valeur === v} onClick={() => choisir(v)}>{l}</button>
        ))}
      </div>
    </div>
  );
}

export function Calculateur({ version, coefficients, modeleMessage }: Props) {
  const [ouvrage, setOuvrage] = useState<Ouvrage>("piece");
  const [v, setV] = useState<Record<string, string>>(DEPART.piece);
  const [agglo, setAgglo] = useState<Epaisseur>("15");
  const [faces, setFaces] = useState<0 | 1 | 2>(0);
  const [fer, setFer] = useState<Diametre>("HA10");
  const [section, setSection] = useState<Section>("20x20");
  const [couches, setCouches] = useState<1 | 2 | 3>(2);
  const [resultat, setResultat] = useState<{ r: Resultat; e: Entrees } | null>(null);
  const [partage, setPartage] = useState<"" | "en_cours">("");

  function changerOuvrage(o: Ouvrage) {
    setOuvrage(o); setV(DEPART[o]); setResultat(null);
    if (o === "poteaux") setSection("20x20");
    if (o === "chainage") setSection("20x30");
    if (o === "enduit") setFaces(2);
    setFer(o === "poteaux" ? "HA12" : o === "dalle" || o === "chainage" ? "HA10" : "HA12");
  }
  const raz = <T,>(f: (x: T) => void) => (x: T) => { f(x); setResultat(null); };

  const entrees: Entrees = useMemo((): Entrees => {
    switch (ouvrage) {
      case "piece": return { ouvrage, longueur_m: nb(v.longueur), largeur_m: nb(v.largeur), hauteur_m: nb(v.hauteur), ouvertures_m2: nb(v.ouvertures), epaisseur: agglo, enduit_faces: faces };
      case "mur_cloture": return { ouvrage, longueur_m: nb(v.longueur), hauteur_m: nb(v.hauteur), ouvertures_m2: nb(v.ouvertures), epaisseur: agglo, enduit_faces: faces };
      case "dalle": return { ouvrage, longueur_m: nb(v.longueur), largeur_m: nb(v.largeur), epaisseur_cm: nb(v.epaisseur), diametre: fer };
      case "fondation": return { ouvrage, longueur_m: nb(v.longueur), largeur_cm: nb(v.largeur_cm), profondeur_cm: nb(v.profondeur), diametre: fer };
      case "poteaux": return { ouvrage, nombre: nb(v.nombre), hauteur_m: nb(v.hauteur), section, diametre: fer };
      case "chainage": return { ouvrage, longueur_m: nb(v.longueur), section, diametre: fer };
      case "dallage": return { ouvrage, longueur_m: nb(v.longueur), largeur_m: nb(v.largeur), epaisseur_cm: nb(v.epaisseur) };
      case "chape": return { ouvrage, longueur_m: nb(v.longueur), largeur_m: nb(v.largeur), epaisseur_cm: nb(v.epaisseur) };
      case "enduit": return { ouvrage, surface_m2: nb(v.surface), enduit_faces: faces === 0 ? 1 : faces };
      case "carrelage": return { ouvrage, surface_m2: nb(v.surface) };
      case "paves": return { ouvrage, surface_m2: nb(v.surface) };
      case "peinture": return { ouvrage, surface_m2: nb(v.surface), couches };
    }
  }, [ouvrage, v, agglo, faces, fer, section, couches]);

  function estimer(ev: React.FormEvent) {
    ev.preventDefault();
    setResultat({ r: calculer(entrees, coefficients), e: entrees });
    compter("calcul", ouvrage);
    setTimeout(() => document.getElementById("resultat")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // « Partager ma liste » : enregistre le calcul pour obtenir un code SLK, puis ouvre le partage du téléphone (WhatsApp à défaut)
  async function partager() {
    if (!resultat) return;
    setPartage("en_cours");
    let code = "à attribuer";
    try {
      code = await rpcPublique<string>("enregistrer_calcul", { p_version: version, p_type_ouvrage: resultat.e.ouvrage, p_entrees: resultat.e, p_resultats: resultat.r });
    } catch { /* hors connexion */ }
    const texte = `${modeleMessage.replace("{code}", code)}\n${nomOuvrage(resultat.e.ouvrage)}\n${listeTexte(resultat.r)}`;
    setPartage("");
    try {
      if (navigator.share) return await navigator.share({ text: texte });
    } catch { return; /* partage annulé */ }
    window.location.href = `https://wa.me/?text=${encodeURIComponent(texte)}`;
  }

  const r = resultat?.r;
  const lignes: { materiau: string; valeur: string; detail: string; Icone: LucideIcon; prix?: string }[] = r ? [
    ...(r.ciment_sacs ? [{ materiau: "Ciment", valeur: `${fr(r.ciment_sacs)} sac${r.ciment_sacs > 1 ? "s" : ""}`, detail: `de ${coefficients.sac_kg} kg`, Icone: Package, prix: "Ciment" }] : []),
    ...(r.agglos ? [{ materiau: "Agglos", valeur: `${fr(r.agglos)}`, detail: `de ${agglo} · ${fr(r.surface_m2)} m² de mur`, Icone: Box, prix: "Agglos" }] : []),
    ...(r.fer_barres ? [{ materiau: "Fer à béton", valeur: `${fr(r.fer_barres)} barres`, detail: `${r.fer_diametre} de ${coefficients.barre_m} m`, Icone: Ruler, prix: "Fer à béton" }] : []),
    ...(r.sable_m3 ? [{ materiau: "Sable", valeur: `${fr(r.sable_m3)} m³`, detail: "", Icone: Mountain, prix: "Sable" }] : []),
    ...(r.gravier_m3 ? [{ materiau: "Gravier", valeur: `${fr(r.gravier_m3)} m³`, detail: "", Icone: Mountain, prix: "Gravier" }] : []),
    ...r.autres.filter((a) => a.quantite > 0).map((a) => ({ materiau: a.materiau, valeur: `${fr(a.quantite)} ${a.unite}`, detail: a.detail, Icone: a.materiau === "Pavés" ? LayoutGrid : a.materiau.startsWith("Carreaux") ? Grid2x2 : a.materiau.includes("einture") || a.materiau.includes("ouche") ? PaintRoller : Package })),
  ] : [];
  const avecFer = ouvrage === "dalle" || ouvrage === "fondation" || ouvrage === "poteaux" || ouvrage === "chainage";
  const avecAgglos = ouvrage === "piece" || ouvrage === "mur_cloture";

  return (
    <div className="page calc" style={{ display: "grid", gap: 16, width: "100%" }}>
      <form onSubmit={estimer} className="calc-form">
        <fieldset className="calc-ouvrages">
          <legend className="champ-titre">Que voulez-vous construire ?</legend>
          {(["Gros œuvre", "Sols et finitions"] as const).map((g) => (
            <div key={g} className="calc-groupe">
              <span className="calc-groupe-titre">{g}</span>
              <div className="calc-tuiles" role="radiogroup" aria-label={g}>
                {OUVRAGES.filter((o) => o.groupe === g).map(({ cle, label, Icone }) => (
                  <button key={cle} type="button" role="radio" aria-checked={ouvrage === cle} className="calc-tuile" onClick={() => changerOuvrage(cle)}>
                    <Icone size={26} strokeWidth={1.7} aria-hidden="true" />{label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </fieldset>

        <div className="calc-champs">
          {CHAMPS[ouvrage].map(([cle, label, unite]) => (
            <label key={cle}>
              <span>{label}</span>
              <span className="calc-saisie">
                <input className="champ" inputMode="decimal" value={v[cle] ?? ""} maxLength={7}
                  onChange={(e) => { setV({ ...v, [cle]: e.target.value.replace(/[^\d.,]/g, "") }); setResultat(null); }} />
                {unite && <em>{unite}</em>}
              </span>
            </label>
          ))}
        </div>

        {avecAgglos && <Choix titre="Agglos" valeur={agglo} choisir={raz(setAgglo)} options={[["15", "de 15"], ["20", "de 20"]]} />}
        {(avecAgglos || ouvrage === "enduit") && (
          <Choix titre="Crépissage" valeur={faces} choisir={raz(setFaces)}
            options={ouvrage === "enduit" ? [[1, "1 face"], [2, "2 faces"]] : [[0, "Sans"], [1, "1 face"], [2, "2 faces"]]} />
        )}
        {(ouvrage === "poteaux" || ouvrage === "chainage") && (
          <Choix titre="Section (cm)" valeur={section} choisir={raz(setSection)} options={SECTIONS.map((s) => [s, s.replace("x", " × ")])} />
        )}
        {avecFer && <Choix titre="Fer" valeur={fer} choisir={raz(setFer)} options={[["HA8", "HA8"], ["HA10", "HA10"], ["HA12", "HA12"]]} />}
        {ouvrage === "peinture" && <Choix titre="Couches" valeur={couches} choisir={raz(setCouches)} options={[[1, "1"], [2, "2"], [3, "3"]]} />}

        <button className="bouton bouton-orange bouton-plein" type="submit">Calculer</button>
      </form>

      {r && (
        <section id="resultat" className="carte calc-resultat" aria-live="polite">
          <h2>{nomOuvrage(ouvrage)} : à acheter</h2>
          {lignes.length === 0 ? <p className="alerte">Saisissez des dimensions pour obtenir une estimation.</p> : (
            <ul>
              {lignes.map((l) => (
                <li key={l.materiau}>
                  <span className="calc-icone"><l.Icone size={22} aria-hidden="true" /></span>
                  <span className="calc-mat"><strong>{l.materiau}</strong>{l.detail && <small>{l.detail}</small>}</span>
                  <span className="calc-qte">{l.valeur}</span>
                </li>
              ))}
            </ul>
          )}
          {lignes.length > 0 && (
            <>
              <details className="muet">
                <summary>Comment c&apos;est calculé (à ± 10 %)</summary>
                <ul>{r.hypotheses.map((h) => <li key={h}>{h}</li>)}</ul>
              </details>
              <div className="duo-actions">
                <Link href={`/prix?m=${encodeURIComponent(lignes.find((l) => l.prix)?.prix ?? "Ciment")}`} className="bouton bouton-contour">
                  <Scale size={20} aria-hidden="true" />Comparer les prix
                </Link>
                <button type="button" className="bouton bouton-orange" onClick={partager} disabled={partage === "en_cours"}>
                  {partage ? "Préparation…" : "Partager ma liste"}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

const nomOuvrage = (o: Ouvrage) => OUVRAGES.find((x) => x.cle === o)?.label ?? "";
