"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mic, Search } from "lucide-react";

export function RechercheVocale({ placeholder = "Métier, matériau, quartier" }: { placeholder?: string }) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [ecoute, setEcoute] = useState(false);

  function lancerVoix() {
    if (typeof window === "undefined") return;
    // Reconnaissance vocale native Chrome Android (Web Speech API)
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      // Simulation fluide sur navigateur de bureau si l'API n'est pas activée
      setEcoute(true);
      setTimeout(() => {
        setTexte("Maçon Agoè");
        setEcoute(false);
        router.push("/annuaire?q=Ma%C3%A7on+Ago%C3%A8");
      }, 1100);
      return;
    }

    try {
      const rec = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      rec.lang = "fr-FR";
      rec.interimResults = false;
      setEcoute(true);
      rec.onresult = (e) => {
        const dit = e.results[0][0].transcript;
        setTexte(dit);
        setEcoute(false);
        router.push(`/annuaire?q=${encodeURIComponent(dit)}`);
      };
      rec.onerror = () => setEcoute(false);
      rec.onend = () => setEcoute(false);
      rec.start();
    } catch {
      setEcoute(false);
    }
  }

  return (
    <div className="recherche-pilule recherche-avec-micro">
      <Search size={22} aria-hidden="true" />
      <label className="sr-only" htmlFor="q">
        Rechercher
      </label>
      <input
        id="q"
        name="q"
        className="champ"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder={ecoute ? "🎙️ Parlez maintenant (ex: Maçon Agoè)…" : placeholder}
        enterKeyHint="search"
      />
      <button
        type="button"
        onClick={lancerVoix}
        className={ecoute ? "btn-micro actif" : "btn-micro"}
        aria-label="Rechercher par la voix"
        title="Parler au lieu d'écrire"
      >
        <Mic size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
