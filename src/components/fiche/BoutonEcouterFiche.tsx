"use client";
import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function BoutonEcouterFiche({ texte }: { texte: string }) {
  const [lecture, setLecture] = useState(false);

  function basculer() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (lecture) {
      window.speechSynthesis.cancel();
      setLecture(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = "fr-FR";
    u.rate = 0.98;
    u.onend = () => setLecture(false);
    setLecture(true);
    window.speechSynthesis.speak(u);
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className={lecture ? "btn-ecouter-fiche actif" : "btn-ecouter-fiche"}
      aria-pressed={lecture}
    >
      {lecture ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
      <span>{lecture ? "Arrêter la lecture vocale" : "🔊 Écouter cette fiche (Voix)"}</span>
    </button>
  );
}
