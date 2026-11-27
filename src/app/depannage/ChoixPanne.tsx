"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Fuel, LocateFixed, Search, Wrench } from "lucide-react";
import { IconePneu, TitreSection } from "@/components/depannage/Elements";
import { ListeChoix } from "@/components/ListeChoix";
import { demanderPosition, MESSAGES_POSITION, type ErreurPosition, type Position } from "@/lib/position";

type Besoin = "carburant" | "crevaison" | "mecanique";
const BESOINS: { cle: Besoin; titre: string; detail: string; Icone: React.ComponentType<{ size?: number }> }[] = [
  { cle: "carburant", titre: "Carburant", detail: "Livraison ou station-service", Icone: Fuel },
  { cle: "crevaison", titre: "Crevaison", detail: "Réparation de pneus", Icone: ({ size }) => <IconePneu taille={size} /> },
  { cle: "mecanique", titre: "Mécanique", detail: "Garage ou mécanicien", Icone: Wrench },
];
// Recherche Google Maps (les vulcanisateurs ne sont pas encore dans l'annuaire)
const RECHERCHE: Record<Besoin, string> = { carburant: "station-service", crevaison: "vulcanisateur", mecanique: "garage mécanicien" };

export function ChoixPanne({ quartiers }: { quartiers: string[] }) {
  const [besoin, setBesoin] = useState<Besoin>("carburant");
  const [zone, setZone] = useState("");
  const [pos, setPos] = useState<Position | null>(null);
  const [etat, setEtat] = useState<"" | "recherche" | ErreurPosition>("");

  async function localiser() {
    if (pos) { setPos(null); return; }
    setEtat("recherche");
    try { setPos(await demanderPosition()); setEtat(""); } catch (e) { setEtat(e as ErreurPosition); }
  }

  const ou = pos ? `${pos.lat},${pos.lng}` : `${zone || "Grand Lomé"}, Lomé, Togo`;
  const maps = pos
    ? `https://www.google.com/maps/search/${encodeURIComponent(RECHERCHE[besoin])}/@${pos.lat},${pos.lng},15z`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${RECHERCHE[besoin]} ${ou}`)}`;
  const annuaire = `/annuaire?metiers=mecanicien${pos ? `&zone=moi&lat=${pos.lat}&lng=${pos.lng}&tri=distance` : zone ? `&zone=${encodeURIComponent(zone)}` : ""}`;
  const carburant = `/depannage/carburant${zone ? `?lieu=${encodeURIComponent(zone)}` : ""}`;

  return (
    <div className="page formulaire">
      <section aria-labelledby="t-besoin" className="formulaire">
        <TitreSection id="t-besoin">De quoi avez-vous besoin ?</TitreSection>
        <div role="radiogroup" aria-labelledby="t-besoin" className="choix-liste">
          {BESOINS.map(({ cle, titre, detail, Icone }) => (
            <button key={cle} type="button" role="radio" aria-checked={besoin === cle} className="choix" onClick={() => setBesoin(cle)}>
              <span className="choix-icone"><Icone size={28} /></span>
              <span className="choix-texte"><strong>{titre}</strong><small>{detail}</small></span>
              <span className="radio" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="t-ou" className="formulaire">
        <TitreSection id="t-ou">Où êtes-vous ?</TitreSection>
        <p className="aide">Quartier ou point de repère</p>
        {!pos && (
          <span className="selecteur-icone">
            <Search size={20} aria-hidden="true" />
            <ListeChoix valeur={zone} onChoix={setZone} aria-label="Quartier"
              options={[{ value: "", label: "Grand Lomé" }, ...quartiers.map((q) => ({ value: q, label: q }))]} />
          </span>
        )}
        <button type="button" className="lien-position" aria-pressed={!!pos} onClick={localiser} disabled={etat === "recherche"}>
          <LocateFixed size={20} aria-hidden="true" />
          {etat === "recherche" ? "Recherche de votre position…" : pos ? "Position utilisée · choisir un quartier" : "Utiliser ma position"}
        </button>
        {etat && etat !== "recherche" && <p className="alerte" role="status">{MESSAGES_POSITION[etat]}</p>}
      </section>

      <div className="formulaire">
        {besoin === "carburant" && <Link href={carburant} className="bouton bouton-orange bouton-plein"><Fuel size={22} aria-hidden="true" />Me faire livrer du carburant</Link>}
        {besoin === "mecanique" && <Link href={annuaire} className="bouton bouton-orange bouton-plein"><Wrench size={22} aria-hidden="true" />Voir les mécaniciens de l&apos;annuaire</Link>}
        <a href={maps} target="_blank" rel="noopener" className={besoin === "crevaison" ? "bouton bouton-orange bouton-plein" : "bouton bouton-contour-vert bouton-plein"}>
          {besoin === "carburant" ? "Station la plus proche" : "Chercher sur Google Maps"}<ArrowUpRight size={20} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
