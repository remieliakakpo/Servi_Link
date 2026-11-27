import Link from "next/link";
import { ArrowLeft, Camera, Images } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BoutonRetourBas } from "@/components/BoutonRetourBas";

/**
 * Pages de la Vitrine côté professionnel : fond crème avec halo orange et vert, en-tête fixe
 * (retour, logo, titre en dégradé) et les deux onglets du pro : Publier et Mes publications.
 */
export function PageVitrine({ titre, retour, actif, children }: {
  titre: string; retour: { href: string; label: string }; actif?: "publier" | "publications"; children: React.ReactNode;
}) {
  return (
    <div className="fond-vitrine">
      <header className="entete-vitrine">
        <div className="page entete-vitrine-dedans">
          <div className="entete-vitrine-barre">
            <Link href={retour.href} className="retour"><ArrowLeft size={26} aria-hidden="true" />{retour.label}</Link>
            <Logo />
          </div>
          <h1 className="titre-degrade">{titre}</h1>
          {actif && (
            <nav className="onglets-pro" aria-label="Espace pro de la Vitrine">
              <Link href="/vitrine/publier" aria-current={actif === "publier" ? "page" : undefined}><Camera size={20} aria-hidden="true" />Publier</Link>
              <Link href="/vitrine/mes-publications" aria-current={actif === "publications" ? "page" : undefined}><Images size={20} aria-hidden="true" />Mes publications</Link>
            </nav>
          )}
        </div>
      </header>
      <main className="corps-vitrine page">
        {children}
        <BoutonRetourBas href={retour.href} label="Retour" />
      </main>
    </div>
  );
}
