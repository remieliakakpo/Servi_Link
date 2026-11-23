"use client";
import { useMemo, useState } from "react";
import { CartePro } from "@/components/CartePro";
import { CADRE, dansLeCadre, latCote, projeter } from "@/lib/geo";
import type { ProListe, Quartier } from "@/lib/types";

const L = 420, H = 240;

/**
 * Carte « Zones d'intervention » (schéma indicatif) : le Grand Lomé dessiné simplement,
 * un point orange par quartier où il y a des pros, le point bleu « vous » si la position est partagée.
 * Toucher un point affiche les pros de ce quartier en dessous. Aucun fond de carte téléchargé :
 * l'écran reste léger en 3G.
 */
export function SchemaQuartiers({ pros, quartiers, moi }: { pros: ProListe[]; quartiers: Quartier[]; moi?: { lat: number; lng: number } }) {
  const [choix, setChoix] = useState<string | null>(null);

  const points = useMemo(() => {
    const parQuartier = new Map<string, { nom: string; lat: number; lng: number; pros: ProListe[] }>();
    for (const p of pros) {
      const q = quartiers.find((x) => x.nom === p.quartier);
      const lat = q?.lat ?? p.latitude, lng = q?.lng ?? p.longitude;
      if (lat == null || lng == null || !dansLeCadre({ lat, lng })) continue;
      const cle = p.quartier ?? `${lat},${lng}`;
      const e = parQuartier.get(cle) ?? { nom: p.quartier ?? "", lat, lng, pros: [] };
      e.pros.push(p);
      parQuartier.set(cle, e);
    }
    return [...parQuartier.values()];
  }, [pros, quartiers]);

  // Schéma : contour approximatif du Grand Lomé, mer en bas, grands axes en blanc
  const xy = (lng: number, lat: number) => { const p = projeter({ lat, lng }, L, H); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; };
  const contour = [[1.105, latCote(1.105)], [1.102, 6.2], [1.115, 6.245], [1.14, 6.285], [1.175, 6.293], [1.21, 6.285],
    [1.235, 6.262], [1.265, 6.245], [1.295, 6.228], [1.32, 6.205], [1.34, 6.185], [1.342, latCote(1.342)]];
  const terre = `M ${contour.map(([lng, lat]) => xy(lng, lat)).join(" L ")} Z`;
  const mer = `M ${xy(CADRE.ouest, latCote(CADRE.ouest))} L ${xy(CADRE.est, latCote(CADRE.est))} L ${L},${H} L 0,${H} Z`;
  const axes = [
    [[1.215, 6.132], [1.205, 6.2], [1.2, 6.285]],          // vers Agoè et Tsévié
    [[1.215, 6.132], [1.16, 6.18], [1.11, 6.225]],         // vers Kpalimé
    [[1.12, latCote(1.12) + 0.006], [1.335, latCote(1.335) + 0.006]], // route côtière
  ];
  const visibles = choix ? points.find((p) => p.nom === choix)?.pros ?? [] : pros;
  const ici = moi && dansLeCadre(moi) ? projeter(moi, L, H) : null;

  return (
    <>
      <div className="schema-titre"><h2>Zones d&apos;intervention</h2><em>Schéma indicatif</em></div>
      <svg className="schema" viewBox={`0 0 ${L} ${H}`} role="img" aria-label={`Carte de ${points.length} quartiers avec des professionnels`}>
        <path className="mer" d={mer} />
        <path className="terre" d={terre} />
        {axes.map((a, i) => <polyline key={i} className="axe" points={a.map(([lng, lat]) => xy(lng, lat)).join(" ")} />)}
        {points.map((p) => {
          const { x, y } = projeter(p, L, H);
          const actif = choix === p.nom;
          return (
            <g key={p.nom} role="button" tabIndex={0} aria-pressed={actif} aria-label={`${p.nom} : ${p.pros.length} professionnel(s)`}
               onClick={() => setChoix(actif ? null : p.nom)} onKeyDown={(e) => e.key === "Enter" && setChoix(actif ? null : p.nom)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r="22" fill="transparent" />
              <circle cx={x} cy={y} r={actif ? 10 : 8} className={actif ? "point point-actif" : "point"} />
              <text x={x + 12} y={y - 10}>{p.nom}</text>
            </g>
          );
        })}
        {ici && <circle cx={ici.x} cy={ici.y} r="8" className="moi"><title>Vous êtes ici</title></circle>}
      </svg>
      {points.length === 0 && <p className="muet">Aucun professionnel à placer sur la carte.</p>}
      <ul className="liste">{visibles.map((p) => <CartePro key={p.id} p={p} />)}</ul>
    </>
  );
}
