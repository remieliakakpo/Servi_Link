"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Search } from "lucide-react";

type Props = { titre?: string; retour?: string; recherche?: boolean; seuil?: number };

/**
 * Barre verte compacte qui reste en haut pendant le défilement : elle apparaît (glisse)
 * quand le grand en-tête sort de l'écran, avec le titre, le retour et la recherche.
 */
export function BarreCompacte({ titre, retour, recherche = false, seuil = 150 }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const maj = () => setVisible(window.scrollY > seuil);
    maj();
    window.addEventListener("scroll", maj, { passive: true });
    return () => window.removeEventListener("scroll", maj);
  }, [seuil]);

  function chercher() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => (document.getElementById("q") as HTMLInputElement | null)?.focus(), 350);
  }

  return (
    <div className={visible ? "barre-compacte visible" : "barre-compacte"} aria-hidden={!visible}>
      {retour ? <Link href={retour} className="retour" tabIndex={visible ? 0 : -1} aria-label="Retour"><ArrowLeft size={24} aria-hidden="true" /></Link> : <span />}
      {titre ? <strong>{titre}</strong> : <Logo tabIndex={visible ? 0 : -1} />}
      {recherche ? <button type="button" onClick={chercher} tabIndex={visible ? 0 : -1} aria-label="Rechercher"><Search size={22} aria-hidden="true" /></button> : <span />}
    </div>
  );
}
