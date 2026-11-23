"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";

/** Partager la fiche (feuille de partage du téléphone, sinon copie du lien). */
export function BoutonPartager({ titre, texte }: { titre: string; texte: string }) {
  const [copie, setCopie] = useState(false);
  async function partager() {
    const url = location.href.split("?")[0];
    if (navigator.share) {
      try { await navigator.share({ title: titre, text: texte, url }); } catch { /* annulé */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); setCopie(true); setTimeout(() => setCopie(false), 2500); } catch { /* refusé */ }
  }
  return (
    <>
      <button type="button" className="bouton-partager" onClick={partager}><Share2 size={18} aria-hidden="true" />Partager</button>
      {copie && <p className="toast" role="status">Lien copié</p>}
    </>
  );
}
