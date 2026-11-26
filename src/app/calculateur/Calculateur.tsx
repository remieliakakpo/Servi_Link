"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Box,
  BrickWall,
  Check,
  Copy,
  Globe,
  House,
  Layers,
  Minus,
  Mountain,
  Package,
  Plus,
  Ruler,
  Scale,
  Share2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { calculer, listeTexte, type Coefficients, type Entrees, type Resultat } from "@/lib/calculateur";
import { compter, rpcPublique } from "@/lib/compter";
import type { PrixMateriau } from "@/lib/types";
import { lienWhatsApp } from "@/lib/whatsapp";

type Props = {
  version: number;
  coefficients: Coefficients;
  modeleMessage: string;
  numeroServiLink: string;
  prixActuels: PrixMateriau[];
};
type Ouvrage = Entrees["ouvrage"];

const OUVRAGES: { cle: Ouvrage; label: string; sous: string; Icone: LucideIcon }[] = [
  { cle: "mur_cloture", label: "Mur de clôture", sous: "En lots ou mètres", Icone: BrickWall },
  { cle: "piece", label: "Chambre / Pièce", sous: "4 murs + ouvertures", Icone: House },
  { cle: "dalle", label: "Dalle béton", sous: "Béton + ferraillage", Icone: Layers },
];

/** Repères culturels togolais : tout le monde parle en façade, demi-lot ou 1 lot (20×30m = 100m de périmètre). */
const LOTS_TOGO = [
  { label: "Façade (20 m)", longueur: 20 },
  { label: "1/4 Lot (35 m)", longueur: 35 },
  { label: "1/2 Lot (50 m)", longueur: 50 },
  { label: "1 Lot (100 m)", longueur: 100 },
] as const;

const TAUX_EURO = 655.957;
const fr = (n: number) => n.toLocaleString("fr-FR");

export function Calculateur({ version, coefficients, modeleMessage, numeroServiLink, prixActuels }: Props) {
  const [ouvrage, setOuvrage] = useState<Ouvrage>("mur_cloture");
  const [longueur, setLongueur] = useState<number>(50);
  const [largeur, setLargeur] = useState<number>(4);
  const [hauteur, setHauteur] = useState<number>(2.2);
  const [epaisseurDalle, setEpaisseurDalle] = useState<number>(15);
  const [epaisseurAgglo, setEpaisseurAgglo] = useState<"15" | "20">("15");
  const [portes, setPortes] = useState<number>(1);
  const [fenetres, setFenetres] = useState<number>(2);
  const [portail, setPortail] = useState<boolean>(true);
  const [modeDiaspora, setModeDiaspora] = useState<boolean>(false);
  const [codeSlk, setCodeSlk] = useState<string>("SLK-8K4M9P");
  const [copieOk, setCopieOk] = useState<boolean>(false);
  const [partage, setPartage] = useState<"" | "en_cours">("");

  // Calcul automatique des m² d'ouvertures sans obliger l'utilisateur à faire des maths
  const ouverturesM2 = useMemo(() => {
    if (ouvrage === "mur_cloture") {
      return (portail ? 7.5 : 0) + portes * 2.0;
    }
    if (ouvrage === "piece") {
      return portes * 1.9 + fenetres * 1.44;
    }
    return 0;
  }, [ouvrage, portes, fenetres, portail]);

  const entrees: Entrees = useMemo(() => {
    if (ouvrage === "dalle") {
      return { ouvrage, longueur_m: longueur, largeur_m: largeur, epaisseur_cm: epaisseurDalle, diametre: "HA10" };
    }
    if (ouvrage === "piece") {
      return {
        ouvrage,
        longueur_m: longueur,
        largeur_m: largeur,
        hauteur_m: hauteur,
        ouvertures_m2: ouverturesM2,
        epaisseur: epaisseurAgglo,
        enduit_faces: 0,
      };
    }
    return {
      ouvrage,
      longueur_m: longueur,
      hauteur_m: hauteur,
      ouvertures_m2: ouverturesM2,
      epaisseur: epaisseurAgglo,
      enduit_faces: 0,
    };
  }, [ouvrage, longueur, largeur, hauteur, epaisseurDalle, epaisseurAgglo, ouverturesM2]);

  // Le calcul se met à jour en direct dès qu'on touche un bouton (Zéro friction)
  const r: Resultat = useMemo(() => calculer(entrees, coefficients), [entrees, coefficients]);

  // Prix unitaires les plus bas relevés cette semaine (avec repli sur les valeurs de référence de Lomé)
  const prixUnitaire = useMemo(() => {
    const minPrix = (slugPart: string, defaut: number) => {
      const matches = prixActuels.filter((p) => p.slug.includes(slugPart));
      return matches.length ? Math.min(...matches.map((m) => m.prix)) : defaut;
    };
    return {
      ciment: minPrix("ciment", 5250),
      agglo: minPrix("agglo", epaisseurAgglo === "20" ? 450 : 350),
      fer: minPrix("fer", 4300),
      sable: 10000,   // prix indicatif par m³ livré
      gravier: 16500, // prix indicatif par m³ livré
    };
  }, [prixActuels, epaisseurAgglo]);

  const formatMontant = (fcfaVal: number) => {
    if (modeDiaspora) {
      const eur = Math.round(fcfaVal / TAUX_EURO);
      return `${fr(eur)} € (≈ ${fr(fcfaVal)} F)`;
    }
    return `${fr(fcfaVal)} F CFA`;
  };

  const formatMontantCourt = (fcfaVal: number) => {
    if (modeDiaspora) {
      return `${fr(Math.round(fcfaVal / TAUX_EURO))} €`;
    }
    return `${fr(fcfaVal)} F`;
  };

  function choisirOuvrage(c: Ouvrage) {
    setOuvrage(c);
    if (c === "mur_cloture") {
      setLongueur(50);
      setHauteur(2.2);
      setPortes(1);
    } else if (c === "piece") {
      setLongueur(4);
      setLargeur(4);
      setHauteur(3);
      setPortes(1);
      setFenetres(2);
    } else {
      setLongueur(8);
      setLargeur(5);
      setEpaisseurDalle(15);
    }
    compter("calcul", c);
  }

  const marge = `marge de ${Math.round(coefficients.marge_pertes * 100)} % incluse`;

  // Traduction en unités logistiques de Lomé (voyages de tricycle, camion benne, tonnes)
  const lignes = [
    ...(r.agglos
      ? [
          {
            titre: `Agglos de ${epaisseurAgglo}`,
            valeur: `${fr(r.agglos)} blocs`,
            cout: r.agglos * prixUnitaire.agglo,
            logistique: `🚚 ≈ ${Math.max(1, Math.ceil(r.agglos / 450))} voyage(s) de tricycle · ${fr(r.surface_m2)} m² de mur`,
            Icone: Box,
            materiau: "Agglos",
          },
        ]
      : []),
    ...(r.ciment_sacs
      ? [
          {
            titre: "Ciment CPJ 45 (50 kg)",
            valeur: `${r.ciment_sacs} sac${r.ciment_sacs > 1 ? "s" : ""}`,
            cout: r.ciment_sacs * prixUnitaire.ciment,
            logistique: `⚖️ Soit ${((r.ciment_sacs * 50) / 1000).toFixed(2).replace(".", ",")} tonne · Dès ${fr(prixUnitaire.ciment)} F/sac`,
            Icone: Package,
            materiau: "Ciment",
          },
        ]
      : []),
    ...(r.fer_barres
      ? [
          {
            titre: `Fer à béton ${r.fer_diametre}`,
            valeur: `${r.fer_barres} barres`,
            cout: r.fer_barres * prixUnitaire.fer,
            logistique: `📏 Barres de ${coefficients.barre_m} m · Dès ${fr(prixUnitaire.fer)} F/barre`,
            Icone: Ruler,
            materiau: "Fer à béton",
          },
        ]
      : []),
    ...(r.sable_m3
      ? [
          {
            titre: "Sable de chantier",
            valeur: `${fr(r.sable_m3)} m³`,
            cout: Math.ceil(r.sable_m3) * prixUnitaire.sable,
            logistique: `🚛 ≈ ${Math.max(1, Math.ceil(r.sable_m3 / 6))} petit camion benne (6 m³) · ${marge}`,
            Icone: Mountain,
            materiau: "Sable",
          },
        ]
      : []),
    ...(r.gravier_m3
      ? [
          {
            titre: "Gravier concassé",
            valeur: `${fr(r.gravier_m3)} m³`,
            cout: Math.ceil(r.gravier_m3) * prixUnitaire.gravier,
            logistique: `🚛 ≈ ${Math.max(1, Math.ceil(r.gravier_m3 / 6))} camion benne · ${marge}`,
            Icone: Mountain,
            materiau: "Gravier",
          },
        ]
      : []),
  ];

  const budgetTotalFcfa = lignes.reduce((acc, l) => acc + l.cout, 0);

  async function genererEtCopierCode() {
    try {
      const c = await rpcPublique<string>("enregistrer_calcul", {
        p_version: version,
        p_type_ouvrage: entrees.ouvrage,
        p_entrees: entrees,
        p_resultats: r,
      });
      if (c) setCodeSlk(c);
    } catch {
      /* mode démo ou hors-ligne */
    }
    try {
      await navigator.clipboard.writeText(codeSlk);
      setCopieOk(true);
      setTimeout(() => setCopieOk(false), 2500);
    } catch {
      /* ignore */
    }
  }

  async function partagerDevisDiaspora() {
    setPartage("en_cours");
    const eur = Math.round(budgetTotalFcfa / TAUX_EURO);
    const texte = [
      `🇹🇬 CERTIFICAT DE QUANTITÉS & PRIX SERVILINK (Réf. ${codeSlk})`,
      `Ouvrage : ${OUVRAGES.find((o) => o.cle === ouvrage)?.label} (${longueur}m)`,
      listeTexte(r),
      `💰 Budget matériaux estimé aux prix relevés cette semaine à Lomé : ${fr(budgetTotalFcfa)} F CFA (soit environ ${fr(eur)} €).`,
      `Vérifiable sur ServiLink Lomé.`,
    ].join("\n");
    setPartage("");
    try {
      if (navigator.share) return await navigator.share({ text: texte });
    } catch {
      return;
    }
    window.location.href = `https://wa.me/?text=${encodeURIComponent(texte)}`;
  }

  const messageReservation = [
    modeleMessage.replace("{code}", codeSlk),
    listeTexte(r),
    `Budget estimé au prix ServiLink : ${fr(budgetTotalFcfa)} F CFA.`,
  ].join("\n");

  const lienWaFournisseur = lienWhatsApp(numeroServiLink, messageReservation);
  const rangeesAgglos = Math.max(1, Math.round(hauteur / 0.2));

  return (
    <div className="page calc-v2" style={{ display: "grid", gap: 16, width: "100%" }}>
      {/* Barre supérieure : Bascule Mode Diaspora (FCFA / € EUR) */}
      <div className="calc-barre-diaspora">
        <div>
          <strong>Mode Diaspora & Famille</strong>
          <small>Convertir les prix certifiés de Lomé en Euros (€)</small>
        </div>
        <button
          type="button"
          className={modeDiaspora ? "calc-pilule-devise active" : "calc-pilule-devise"}
          onClick={() => setModeDiaspora(!modeDiaspora)}
          aria-pressed={modeDiaspora}
        >
          <Globe size={16} aria-hidden="true" />
          {modeDiaspora ? "€ EUR + FCFA" : "FCFA seul"}
        </button>
      </div>

      {/* Étape 1 : Choix de l'ouvrage en 1 seul tap (3 grosses tuiles visuelles) */}
      <section aria-labelledby="t-etape-1">
        <p id="t-etape-1" className="champ-titre" style={{ marginBottom: 8 }}>
          1. Que voulez-vous construire ?
        </p>
        <div className="calc-tuiles-ouvrage" role="radiogroup" aria-labelledby="t-etape-1">
          {OUVRAGES.map(({ cle, label, sous, Icone }) => {
            const actif = ouvrage === cle;
            return (
              <button
                key={cle}
                type="button"
                role="radio"
                aria-checked={actif}
                className={actif ? "calc-tuile-ouv active" : "calc-tuile-ouv"}
                onClick={() => choisirOuvrage(cle)}
              >
                <Icone size={28} strokeWidth={1.7} aria-hidden="true" />
                <strong>{label}</strong>
                <small>{sous}</small>
              </button>
            );
          })}
        </div>
      </section>

      {/* Étape 2 : Dimensions en Lots Togolais ou curseur visuel */}
      <section className="bloc calc-bloc" aria-labelledby="t-etape-2">
        <div className="bloc-tete">
          <h2 id="t-etape-2">2. Dimensions de l&apos;ouvrage</h2>
          <span className="calc-badge-mesure">
            {ouvrage === "mur_cloture"
              ? `${longueur} m linéaires`
              : `${longueur} m × ${largeur} m`}
          </span>
        </div>

        {ouvrage === "mur_cloture" && (
          <>
            <p className="muet" style={{ margin: "4px 0 8px", fontSize: ".88rem" }}>
              Touchez un repère de terrain habituel au Togo ou glissez le curseur :
            </p>
            <div className="calc-lots-grille">
              {LOTS_TOGO.map((l) => (
                <button
                  key={l.longueur}
                  type="button"
                  className={longueur === l.longueur ? "calc-lot-btn actif" : "calc-lot-btn"}
                  onClick={() => setLongueur(l.longueur)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <label className="calc-curseur-label">
              <span>Longueur totale du mur : <strong>{longueur} mètres</strong></span>
              <input
                type="range"
                min={5}
                max={150}
                step={1}
                value={longueur}
                onChange={(e) => setLongueur(Number(e.target.value))}
              />
            </label>
          </>
        )}

        {ouvrage !== "mur_cloture" && (
          <div className="calc-duo-curseurs">
            <label className="calc-curseur-label">
              <span>Longueur : <strong>{longueur} m</strong></span>
              <input
                type="range"
                min={2}
                max={25}
                step={0.5}
                value={longueur}
                onChange={(e) => setLongueur(Number(e.target.value))}
              />
            </label>
            <label className="calc-curseur-label">
              <span>Largeur : <strong>{largeur} m</strong></span>
              <input
                type="range"
                min={2}
                max={20}
                step={0.5}
                value={largeur}
                onChange={(e) => setLargeur(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        {ouvrage !== "dalle" ? (
          <div className="calc-options-mur">
            <label className="calc-curseur-label">
              <span>Hauteur du mur : <strong>{String(hauteur).replace(".", ",")} m</strong> ({rangeesAgglos} rangées d&apos;agglos)</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.2}
                value={hauteur}
                onChange={(e) => setHauteur(Number(e.target.value))}
              />
            </label>
            <div className="calc-choix-agglo">
              <span>Type de brique :</span>
              <div className="puces">
                <button
                  type="button"
                  className="puce-choix"
                  aria-pressed={epaisseurAgglo === "15"}
                  onClick={() => setEpaisseurAgglo("15")}
                >
                  Agglo de 15 (Standard)
                </button>
                <button
                  type="button"
                  className="puce-choix"
                  aria-pressed={epaisseurAgglo === "20"}
                  onClick={() => setEpaisseurAgglo("20")}
                >
                  Agglo de 20 (Porteur)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label className="calc-curseur-label">
            <span>Épaisseur de la dalle : <strong>{epaisseurDalle} cm</strong> (Ferraillage HA10 inclus)</span>
            <input
              type="range"
              min={10}
              max={25}
              step={1}
              value={epaisseurDalle}
              onChange={(e) => setEpaisseurDalle(Number(e.target.value))}
            />
          </label>
        )}
      </section>

      {/* Étape 3 : Portes & Fenêtres en boutons + / - (Zéro calcul de m² !) */}
      {ouvrage !== "dalle" && (
        <section className="bloc calc-bloc" aria-labelledby="t-etape-3">
          <div className="bloc-tete">
            <h2 id="t-etape-3">3. Ouvertures à déduire (Zéro calcul)</h2>
            <small className="muet">−{String(Math.round(ouverturesM2 * 10) / 10).replace(".", ",")} m²</small>
          </div>
          <div className="calc-compteurs-grille">
            {ouvrage === "mur_cloture" && (
              <div className="calc-compteur-item">
                <span>🚗 Grand portail</span>
                <button
                  type="button"
                  className={portail ? "calc-toggle-btn actif" : "calc-toggle-btn"}
                  onClick={() => setPortail(!portail)}
                >
                  {portail ? "Oui (1 portail)" : "Non"}
                </button>
              </div>
            )}
            <div className="calc-compteur-item">
              <span>🚪 Portes / Portillons</span>
              <div className="calc-plus-moins">
                <button type="button" onClick={() => setPortes(Math.max(0, portes - 1))} aria-label="Retirer une porte">
                  <Minus size={18} />
                </button>
                <strong>{portes}</strong>
                <button type="button" onClick={() => setPortes(Math.min(10, portes + 1))} aria-label="Ajouter une porte">
                  <Plus size={18} />
                </button>
              </div>
            </div>
            {ouvrage === "piece" && (
              <div className="calc-compteur-item">
                <span>🪟 Fenêtres</span>
                <div className="calc-plus-moins">
                  <button type="button" onClick={() => setFenetres(Math.max(0, fenetres - 1))} aria-label="Retirer une fenêtre">
                    <Minus size={18} />
                  </button>
                  <strong>{fenetres}</strong>
                  <button type="button" onClick={() => setFenetres(Math.min(12, fenetres + 1))} aria-label="Ajouter une fenêtre">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Schéma visuel SVG en direct : l'utilisateur voit son ouvrage se dessiner */}
      <section className="calc-schema-boite" aria-label="Schéma visuel de votre ouvrage">
        <div className="calc-schema-entete">
          <span>📐 Aperçu visuel en direct</span>
          <strong>
            {ouvrage === "dalle"
              ? `Volume béton : ${fr(r.volume_m3)} m³`
              : `Surface nette : ${fr(r.surface_m2)} m² · ${rangeesAgglos} rangées`}
          </strong>
        </div>
        <svg viewBox="0 0 320 82" className="calc-schema-svg" role="img" aria-label="Dessin du chantier">
          {ouvrage !== "dalle" ? (
            <>
              <rect x="20" y="12" width="280" height="52" rx="4" fill="#d97724" stroke="#fde3c3" strokeWidth="1.5" />
              {[22, 32, 42, 52].map((y) => (
                <line key={y} x1="20" y1={y} x2="300" y2={y} stroke="#1d2b3a" strokeWidth="0.9" opacity="0.4" />
              ))}
              {ouvrage === "mur_cloture" && portail && (
                <rect x="38" y="20" width="44" height="44" rx="2" fill="#1d2b3a" stroke="#fff" strokeWidth="1.2" />
              )}
              {Array.from({ length: Math.min(portes, 4) }).map((_, i) => (
                <rect
                  key={`p-${i}`}
                  x={98 + i * 36}
                  y="30"
                  width="20"
                  height="34"
                  rx="2"
                  fill="#1d2b3a"
                  stroke="#fff"
                  strokeWidth="1.2"
                />
              ))}
              {ouvrage === "piece" &&
                Array.from({ length: Math.min(fenetres, 4) }).map((_, i) => (
                  <rect
                    key={`f-${i}`}
                    x={260 - i * 34}
                    y="22"
                    width="20"
                    height="18"
                    rx="2"
                    fill="#8fb3d9"
                    stroke="#fff"
                    strokeWidth="1.2"
                  />
                ))}
            </>
          ) : (
            <>
              <polygon points="40,54 110,18 280,18 210,54" fill="#64748b" stroke="#fde3c3" strokeWidth="1.5" />
              <line x1="65" y1="42" x2="235" y2="42" stroke="#f47b0a" strokeWidth="1.2" strokeDasharray="4 3" />
              <line x1="90" y1="30" x2="260" y2="30" stroke="#f47b0a" strokeWidth="1.2" strokeDasharray="4 3" />
            </>
          )}
          <text x="160" y="76" textAnchor="middle" fill="#fde3c3" fontSize="10" fontWeight="bold">
            {ouvrage === "mur_cloture"
              ? `Mur de ${longueur} m × ${String(hauteur).replace(".", ",")} m · Agglos de ${epaisseurAgglo}`
              : ouvrage === "piece"
              ? `Pièce de ${longueur} m × ${largeur} m (H: ${String(hauteur).replace(".", ",")} m)`
              : `Dalle béton de ${longueur} m × ${largeur} m × ${epaisseurDalle} cm`}
          </text>
        </svg>
      </section>

      {/* Résultats détaillés avec équivalents logistiques (tricycle / benne) et coût par ligne */}
      <section className="calc-resultats-bloc" aria-live="polite">
        <div className="calc-budget-banniere">
          <div>
            <span className="calc-budget-surtitre">Budget matériaux estimé (Prix Lomé)</span>
            <strong className="calc-budget-montant">{formatMontant(budgetTotalFcfa)}</strong>
          </div>
          <Truck size={32} strokeWidth={1.6} aria-hidden="true" />
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {lignes.map((l) => (
            <article key={l.titre} className="carte calc-ligne-carte">
              <span className="tuile tuile-sombre" style={{ width: 52, height: 52 }}>
                <l.Icone size={28} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div className="carte-texte">
                <strong>{l.titre}</strong>
                <p className="muet" style={{ fontSize: ".85rem" }}>{l.logistique}</p>
              </div>
              <div className="calc-ligne-droite">
                <span className="prix-pastille">{l.valeur}</span>
                <small className="calc-ligne-cout">≈ {formatMontantCourt(l.cout)}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Écran E10 intégré : Ticket / Bon de réservation de prix avec Code ServiLink SLK-XXXXXX */}
      <section className="calc-ticket-slk" aria-labelledby="t-ticket-slk">
        <div className="calc-ticket-tete">
          <div>
            <span className="calc-ticket-badge">BON DE PRIX GARANTI (E10)</span>
            <h2 id="t-ticket-slk">Votre code ServiLink</h2>
          </div>
          <button type="button" className="calc-code-copie" onClick={genererEtCopierCode}>
            <strong>{codeSlk}</strong>
            {copieOk ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <p className="muet" style={{ margin: "6px 0 12px", fontSize: ".9rem" }}>
          Montrez ce code au fournisseur ou envoyez-lui votre liste sur WhatsApp : il vous réserve les prix affichés sur ServiLink.
        </p>

        <div className="calc-actions-finales">
          {lienWaFournisseur && (
            <a href={lienWaFournisseur} target="_blank" rel="noopener" className="bouton bouton-whatsapp bouton-plein">
              <IconeWhatsApp taille={22} /> Envoyer ma liste ({codeSlk})
            </a>
          )}
          <div className="duo-actions">
            <button
              type="button"
              className="bouton bouton-contour-vert"
              onClick={partagerDevisDiaspora}
              disabled={partage === "en_cours"}
            >
              <Share2 size={19} aria-hidden="true" />
              {partage ? "Préparation…" : "Certificat Diaspora (€)"}
            </button>
            <Link href="/prix" className="bouton bouton-contour">
              <Scale size={19} aria-hidden="true" /> Comparer les prix
            </Link>
          </div>
        </div>
      </section>

      <details className="muet">
        <summary style={{ cursor: "pointer", minHeight: 44 }}>
          Hypothèses techniques du calcul (estimation à ± 10 %, formules v{version})
        </summary>
        <ul>
          {r.hypotheses.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
