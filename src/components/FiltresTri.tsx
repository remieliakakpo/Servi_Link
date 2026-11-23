"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListeChoix } from "@/components/ListeChoix";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Box, ChevronDown, Filter, HardHat, Info, MapPin, RotateCcw, SlidersHorizontal, Star, X } from "lucide-react";
import { lienAnnuaire, type ParamsAnnuaire } from "@/lib/annuaire";
import { AUTOUR_DE_MOI } from "@/lib/geo";
import { demanderPosition, MESSAGES_POSITION, type ErreurPosition } from "@/lib/position";
import type { Metier } from "@/lib/types";

// Les 8 cases de la maquette, dans son ordre (2 colonnes) ; « Autre… » déplie les autres métiers.
const CASES: [string, string][] = [
  ["macon", "Maçon"], ["carreleur", "Carreleur"], ["plombier", "Plombier"], ["menuisier", "Menuisier"],
  ["electricien", "Électricien"], ["soudeur", "Ferronnier"], ["peintre", "Peintre"],
];

type Tri = "note" | "experience" | "distance";
type Props = {
  sp: ParamsAnnuaire; nbActifs: number; total: number;
  tri: Tri; autour: boolean; metiers: Metier[]; quartiers: string[];
};

/** Bouton « Filtrer et trier (N) » et sa feuille du bas (maquette « Filtres et tri »). */
export function FiltresTri({ sp, nbActifs, total, tri: triActuel, autour, metiers, quartiers }: Props) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [tri, setTri] = useState<Tri>(triActuel);
  const [type, setType] = useState(sp.type ?? "");
  const [coches, setCoches] = useState<string[]>((sp.metiers ?? "").split(",").filter(Boolean));
  const [quartier, setQuartier] = useState(sp.zone && sp.zone !== AUTOUR_DE_MOI ? sp.zone : "");
  const [livraison, setLivraison] = useState(sp.livraison === "1");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(autour ? { lat: Number(sp.lat), lng: Number(sp.lng) } : null);
  const [erreur, setErreur] = useState<ErreurPosition | "">("");
  const [autres, setAutres] = useState(false);
  const [nb, setNb] = useState<number | null>(total);
  const fermer = useRef<HTMLButtonElement>(null);

  const zone = quartier || (pos ? AUTOUR_DE_MOI : "");
  const cible = lienAnnuaire(sp, {
    tri: tri === (zone === AUTOUR_DE_MOI ? "distance" : "note") ? undefined : tri,
    type: type || undefined, metiers: coches.join(",") || undefined,
    zone: zone || undefined, lat: zone === AUTOUR_DE_MOI ? String(pos!.lat) : undefined, lng: zone === AUTOUR_DE_MOI ? String(pos!.lng) : undefined,
    livraison: livraison ? "1" : undefined,
  });

  // Compte en direct pendant qu'on coche (une requête légère, 1 ligne + total)
  useEffect(() => {
    if (!ouvert) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setNb(null);
      fetch(`/api/resultats?${cible.split("?")[1] ?? ""}`, { signal: ctrl.signal })
        .then((r) => r.json()).then((d) => setNb(d.total)).catch(() => {});
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [cible, ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    fermer.current?.focus();
    const echap = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", echap);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", echap); document.body.style.overflow = ""; };
  }, [ouvert]);

  async function choisirTri(t: Tri) {
    setErreur("");
    if (t === "distance" && !pos) {
      try { setPos(await demanderPosition()); setQuartier(""); }
      catch (e) { setErreur(e as ErreurPosition); return; }
    }
    setTri(t);
  }

  function effacer() {
    setTri(pos ? "distance" : "note"); setType(""); setCoches([]); setQuartier(""); setLivraison(false); setErreur("");
  }

  const basculer = (slug: string) => setCoches((c) => c.includes(slug) ? c.filter((x) => x !== slug) : [...c, slug]);
  const autresMetiers = metiers.filter((m) => !CASES.some(([s]) => s === m.slug));
  const puce = (actif: boolean) => ({ className: "puce-choix", "aria-pressed": actif, type: "button" as const });

  return (
    <>
      <button type="button" className="segment segment-filtres" onClick={() => setOuvert(true)} aria-haspopup="dialog">
        <Filter size={18} aria-hidden="true" />Filtrer et trier{nbActifs > 0 && ` (${nbActifs})`}
      </button>
      {/* Portail vers <body> : la barre collante crée son propre empilement, la feuille passerait sous la barre du bas */}
      {ouvert && createPortal(
        <>
          <div className="voile" onClick={() => setOuvert(false)} aria-hidden="true" />
          <div className="feuille" role="dialog" aria-modal="true" aria-labelledby="t-filtres">
            <div>
              <div className="feuille-poignee" />
              <div className="feuille-tete">
                <SlidersHorizontal size={28} aria-hidden="true" />
                <h2 id="t-filtres">Filtres et tri</h2>
                <button ref={fermer} type="button" onClick={() => setOuvert(false)} aria-label="Fermer"><X size={26} aria-hidden="true" /></button>
              </div>
            </div>
            <div className="feuille-corps">
              <h3>Trier par</h3>
              <div className="puces">
                <button {...puce(tri === "note")} onClick={() => choisirTri("note")}><Star size={20} aria-hidden="true" />Note</button>
                <button {...puce(tri === "experience")} onClick={() => choisirTri("experience")}><BriefcaseBusiness size={20} aria-hidden="true" />Expérience</button>
                <button {...puce(tri === "distance")} onClick={() => choisirTri("distance")}><MapPin size={20} aria-hidden="true" />Distance</button>
              </div>
              {erreur && <p className="alerte" role="status">{MESSAGES_POSITION[erreur]}</p>}

              <h3>Type</h3>
              <div className="puces">
                <button {...puce(type === "artisan")} onClick={() => setType(type === "artisan" ? "" : "artisan")}><HardHat size={20} aria-hidden="true" />Artisan</button>
                <button {...puce(type === "fournisseur")} onClick={() => setType(type === "fournisseur" ? "" : "fournisseur")}><Box size={20} aria-hidden="true" />Fournisseur</button>
              </div>

              <h3>Métier ou produit</h3>
              <div className="cases">
                {CASES.map(([slug, libelle]) => (
                  <label key={slug} className="case"><input type="checkbox" checked={coches.includes(slug)} onChange={() => basculer(slug)} />{libelle}</label>
                ))}
                <label className="case"><input type="checkbox" checked={autres || coches.some((c) => autresMetiers.some((m) => m.slug === c))}
                  onChange={(e) => setAutres(e.target.checked)} />Autre…</label>
                {(autres || coches.some((c) => autresMetiers.some((m) => m.slug === c))) && autresMetiers.map((m) => (
                  <label key={m.slug} className="case"><input type="checkbox" checked={coches.includes(m.slug)} onChange={() => basculer(m.slug)} />{m.libelle}</label>
                ))}
              </div>

              <h3><label htmlFor="f-quartier">Quartier</label></h3>
              <label className="selecteur-icone">
                <MapPin size={20} aria-hidden="true" />
                <ListeChoix id="f-quartier" valeur={quartier} onChoix={setQuartier} aria-label="Quartier"
                  options={[{ value: "", label: pos ? "Autour de moi" : "Tous les quartiers" }, ...quartiers.map((q) => ({ value: q, label: q }))]} />
                <ChevronDown size={20} aria-hidden="true" />
              </label>
              <p className="info"><Info size={16} aria-hidden="true" />Inclut les pros qui interviennent dans ce quartier</p>

              <h3>Fournisseurs</h3>
              <label className="case"><input type="checkbox" checked={livraison} onChange={(e) => setLivraison(e.target.checked)} />Livre à domicile</label>
            </div>
            <div className="feuille-pied">
              <button type="button" className="bouton bouton-contour-vert" onClick={effacer}><RotateCcw size={20} aria-hidden="true" />Effacer</button>
              <button type="button" className="bouton bouton-vert" onClick={() => { setOuvert(false); router.push(cible); }}>
                {nb == null ? "Voir les résultats" : `Voir ${nb} résultat${nb > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </>, document.body,
      )}
    </>
  );
}
