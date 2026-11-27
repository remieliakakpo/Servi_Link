"use client";
import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

/**
 * Erreur dans une page : au lieu d'un écran blanc, un message simple et un bouton pour réessayer.
 * Le code de l'erreur (digest) permet de la retrouver dans les journaux Vercel.
 */
export default function Erreur({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("ServiLink : erreur de page", error.digest ?? error.message); }, [error]);
  return (
    <main className="corps">
      <div className="page page-erreur">
        <h1>Un souci est survenu</h1>
        <p>La page n&apos;a pas pu s&apos;afficher. Vérifiez votre connexion internet, puis réessayez.</p>
        <div className="liens-erreur">
          <button type="button" className="bouton bouton-orange" onClick={reset}><RotateCcw size={20} aria-hidden="true" />Réessayer</button>
          <Link href="/" className="bouton bouton-contour-vert">Accueil</Link>
        </div>
        {error.digest && <p className="muet petit">Code : {error.digest}</p>}
      </div>
    </main>
  );
}
