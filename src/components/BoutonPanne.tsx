"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { compter } from "@/lib/compter";
import { lienCarte } from "@/lib/geo";
import { demanderPosition } from "@/lib/position";
import { lienWhatsApp } from "@/lib/whatsapp";

/**
 * « Je suis en panne » (provisoire, en attendant le mode dépannage V2 et son écran de confirmation) :
 * prend la position si possible et ouvre WhatsApp vers ServiLink avec un lien Google Maps.
 */
export function BoutonPanne({ numeroServiLink }: { numeroServiLink: string }) {
  const [attente, setAttente] = useState(false);

  async function panne() {
    setAttente(true);
    let ou = "Je ne peux pas partager ma position.";
    try {
      const p = await demanderPosition();
      ou = `Ma position : ${lienCarte(p, "")}`;
    } catch { /* on envoie sans position */ }
    compter("demande_servilink", "panne");
    const lien = lienWhatsApp(numeroServiLink, `Bonjour ServiLink, je suis en panne (carburant, crevaison ou mécanique). ${ou}`);
    setAttente(false);
    if (lien) window.location.href = lien;
  }

  return (
    <button type="button" className="carte carte-forte" onClick={panne} disabled={attente} aria-busy={attente}>
      <svg width="56" height="48" viewBox="0 0 56 48" aria-hidden="true" style={{ flex: "none", color: "var(--orange)" }}>
        <path d="M18 4 6 44M38 4l12 40M28 6v6M28 20v8M28 36v8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
      <span className="separateur" />
      <span className="carte-texte">
        <strong>Je suis en panne</strong>
        <p>{attente ? "Recherche de votre position…" : "Carburant, crevaison, mécanique"}</p>
      </span>
      <ChevronRight className="chevron" size={28} aria-hidden="true" />
    </button>
  );
}
