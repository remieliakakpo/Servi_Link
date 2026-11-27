"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, LocateFixed, Minus, Plus } from "lucide-react";
import { TitreSection } from "@/components/depannage/Elements";
import { ListeChoix } from "@/components/ListeChoix";
import { brouillon, garderBrouillon, nouvelId, type Carburant } from "@/lib/depannage";
import { demanderPosition, MESSAGES_POSITION, type ErreurPosition, type Position } from "@/lib/position";

const MIN = 1, MAX = 40;

export function DemandeCarburant({ quartiers, lieuInitial }: { quartiers: string[]; lieuInitial?: string }) {
  const router = useRouter();
  const [lieu, setLieu] = useState(lieuInitial && quartiers.includes(lieuInitial) ? lieuInitial : "");
  const [repere, setRepere] = useState("");
  const [carburant, setCarburant] = useState<Carburant>("essence");
  const [litres, setLitres] = useState(2);
  const [pos, setPos] = useState<Position | null>(null);
  const [etat, setEtat] = useState<"" | "recherche" | ErreurPosition>("");
  const [erreur, setErreur] = useState(false);

  // Retour depuis « Vérifier ma demande » (Modifier) : on reprend la demande en cours
  useEffect(() => {
    const b = brouillon();
    if (!b) return;
    setLieu(b.lieu); setRepere(b.repere ?? ""); setCarburant(b.carburant); setLitres(b.litres);
    if (b.lat != null && b.lng != null) setPos({ lat: b.lat, lng: b.lng });
  }, []);

  async function localiser() {
    setEtat("recherche");
    try { setPos(await demanderPosition()); setEtat(""); } catch (e) { setEtat(e as ErreurPosition); }
  }

  function verifier(e: React.FormEvent) {
    e.preventDefault();
    if (!lieu) { setErreur(true); return; }
    garderBrouillon({ id: brouillon()?.id ?? nouvelId(), lieu, repere: repere.trim() || undefined, carburant, litres, lat: pos?.lat, lng: pos?.lng });
    router.push("/depannage/carburant/verifier");
  }

  return (
    <form className="page formulaire" onSubmit={verifier} noValidate>
      <div className="champ-groupe">
        <TitreSection id="t-lieu">Lieu de livraison</TitreSection>
        <ListeChoix className="selecteur" valeur={lieu} onChoix={(v) => { setLieu(v); setErreur(false); }} aria-label="Lieu de livraison"
          options={[{ value: "", label: "Choisir un quartier" }, ...quartiers.map((q) => ({ value: q, label: q }))]} />
        {erreur && <p className="alerte" role="alert">Choisissez le quartier où vous êtes.</p>}
        <button type="button" className="lien-position" aria-pressed={!!pos} onClick={localiser} disabled={etat === "recherche"}>
          <LocateFixed size={20} aria-hidden="true" />
          {etat === "recherche" ? "Recherche de votre position…" : pos ? "Position ajoutée pour le livreur" : "Ajouter ma position exacte (conseillé)"}
        </button>
        {etat && etat !== "recherche" && <p className="alerte" role="status">{MESSAGES_POSITION[etat]}</p>}
      </div>

      <label className="champ-groupe">
        <span className="titre-form"><h2>Point de repère <small>(facultatif)</small></h2></span>
        <input className="champ" value={repere} onChange={(e) => setRepere(e.target.value)} maxLength={120} placeholder="Ex. devant la pharmacie" />
      </label>

      <div className="champ-groupe">
        <TitreSection id="t-carburant">Carburant</TitreSection>
        <div className="bascule-orange" role="radiogroup" aria-labelledby="t-carburant">
          {(["essence", "gazole"] as const).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={carburant === c} onClick={() => setCarburant(c)}>
              <span className="radio" aria-hidden="true" />{c === "essence" ? "Essence" : "Gazole"}
            </button>
          ))}
        </div>
      </div>

      <div className="champ-groupe">
        <TitreSection id="t-quantite">Quantité</TitreSection>
        <div className="compteur-quantite" role="group" aria-labelledby="t-quantite">
          <button type="button" onClick={() => setLitres((l) => Math.max(MIN, l - 1))} disabled={litres <= MIN} aria-label="Un litre de moins"><Minus size={24} aria-hidden="true" /></button>
          <output aria-live="polite">{litres} L</output>
          <button type="button" onClick={() => setLitres((l) => Math.min(MAX, l + 1))} disabled={litres >= MAX} aria-label="Un litre de plus"><Plus size={24} aria-hidden="true" /></button>
        </div>
      </div>

      <div className="encart-info">
        <Info size={20} aria-hidden="true" />
        <span><strong>Frais de déplacement</strong>Selon la distance aller-retour à la station. Le livreur vous envoie le total avant votre accord.</span>
      </div>

      <button type="submit" className="bouton bouton-orange bouton-plein">Vérifier ma demande<ArrowRight size={22} aria-hidden="true" /></button>
    </form>
  );
}
