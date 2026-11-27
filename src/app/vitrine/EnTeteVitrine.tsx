import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BoutonRetourBas } from "@/components/BoutonRetourBas";

/** En-tête des pages de la Vitrine : fond crème avec halo orange et vert, titre en dégradé. */
export function PageVitrine({ titre, retour, children }: { titre: string; retour: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="fond-vitrine">
      <header className="entete-vitrine page">
        <div className="entete-vitrine-barre">
          <Link href={retour.href} className="retour"><ArrowLeft size={26} aria-hidden="true" />{retour.label}</Link>
          <Logo />
        </div>
        <h1 className="titre-degrade">{titre}</h1>
      </header>
      <main className="corps-vitrine page">
        {children}
        <BoutonRetourBas href={retour.href} label="Retour" />
      </main>
    </div>
  );
}
