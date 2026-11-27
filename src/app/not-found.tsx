import Link from "next/link";
import { House, Play, Search } from "lucide-react";
import { EnTete, PiluleRetour } from "@/components/EnTete";

export const metadata = { title: "Page introuvable", robots: { index: false } };

/** 404 : page ou fiche qui n'existe pas (lien ancien, fiche retirée). On propose toujours une suite. */
export default function Introuvable() {
  return (
    <>
      <EnTete titre="Page introuvable" retour={{ href: "/" }} />
      <main className="corps">
        <div className="page page-erreur">
          <p>Cette page n&apos;existe pas ou n&apos;est plus en ligne. Une fiche peut être retirée quand sa vérification date de plus de 6 mois.</p>
          <div className="liens-erreur">
            <Link href="/" className="bouton bouton-orange"><House size={20} aria-hidden="true" />Accueil</Link>
            <Link href="/annuaire" className="bouton bouton-contour-vert"><Search size={20} aria-hidden="true" />Annuaire</Link>
            <Link href="/vitrine" className="bouton bouton-contour-vert"><Play size={20} aria-hidden="true" />Vitrine</Link>
          </div>
        </div>
        <PiluleRetour href="/" label="Retour" />
      </main>
    </>
  );
}
