"use client";
import { useRef, useState } from "react";
import { ListeChoix } from "@/components/ListeChoix";
import { flushSync } from "react-dom";
import { ChevronDown, MapPin } from "lucide-react";
import { demanderPosition, MESSAGES_POSITION, type ErreurPosition } from "@/lib/position";

import { AUTOUR_DE_MOI } from "@/lib/geo";

type Props = {
  quartiers: string[];
  valeur?: string;             // nom du quartier, "moi" ou vide (Grand Lomé)
  position?: { lat?: number; lng?: number };
  style: "pilule" | "selecteur";
  envoyerAuChoix?: boolean;    // l'annuaire relance la recherche dès qu'on change de zone
};

/**
 * Liste « Grand Lomé ▾ » : tout le Grand Lomé, « Autour de moi » (position du téléphone)
 * ou un quartier. Écrit zone, lat et lng dans le formulaire qui la contient.
 */
export function ChoixZone({ quartiers, valeur = "", position, style, envoyerAuChoix = false }: Props) {
  const [zone, setZone] = useState(valeur);
  const [pos, setPos] = useState(position?.lat != null ? position : undefined);
  const [etat, setEtat] = useState<"" | "recherche" | ErreurPosition>("");
  const formulaire = useRef<HTMLFormElement | null>(null);

  async function changer(v: string, form: HTMLFormElement | null) {
    formulaire.current = form;
    setEtat("");
    if (v !== AUTOUR_DE_MOI) {
      setZone(v); setPos(undefined);
      if (envoyerAuChoix) setTimeout(() => formulaire.current?.requestSubmit());
      return;
    }
    setZone(v); setEtat("recherche");
    try {
      const p = await demanderPosition();
      // On écrit lat / lng dans le formulaire avant de l'envoyer
      flushSync(() => { setPos(p); setEtat(""); });
      if (envoyerAuChoix) formulaire.current?.requestSubmit();
    } catch (e) {
      setZone(""); setPos(undefined); setEtat(e as ErreurPosition);
    }
  }

  const select = (
    <ListeChoix name="zone" valeur={zone} onChoix={changer} aria-label="Zone"
      className={style === "selecteur" ? "selecteur" : undefined}
      options={[
        { value: "", label: "Grand Lomé" },
        { value: AUTOUR_DE_MOI, label: etat === "recherche" ? "Recherche de votre position…" : "Autour de moi" },
        ...quartiers.map((q) => ({ value: q, label: q, groupe: "Quartiers" })),
      ]} />
  );

  return (
    <>
      {style === "pilule" ? (
        <span className="pilule-blanche"><MapPin size={20} aria-hidden="true" />{select}<ChevronDown size={18} aria-hidden="true" /></span>
      ) : select}
      {pos && zone === AUTOUR_DE_MOI && <><input type="hidden" name="lat" value={pos.lat} /><input type="hidden" name="lng" value={pos.lng} /></>}
      {etat && etat !== "recherche" && <p className="alerte" role="status">{MESSAGES_POSITION[etat]}</p>}
    </>
  );
}
