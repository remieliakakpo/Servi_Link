import Link from "next/link";
import { BarreCompacte } from "@/components/BarreCompacte";
import { BoutonRetourBas } from "@/components/BoutonRetourBas";
import { ArrowLeft, CircleUserRound } from "lucide-react";

export { Logo, Trait, Virgule } from "@/components/Logo";
import { Logo, Virgule } from "@/components/Logo";

type Props = { titre: string; sousTitre?: string; retour?: { href: string; label?: string }; children?: React.ReactNode };

/** En-tête sombre des écrans intérieurs : retour à gauche, logo à droite, titre souligné. */
export function EnTete({ titre, sousTitre, retour, children }: Props) {
  return (
    <header className="entete">
      <BarreCompacte titre={titre} retour={retour?.href} seuil={110} />
      <div className="entete-barre page">
        {retour ? (
          <Link href={retour.href} className="retour" aria-label={retour.label ? undefined : "Retour"}>
            <ArrowLeft size={28} aria-hidden="true" />{retour.label}
          </Link>
        ) : <span />}
        <Logo />
      </div>
      <div className="page">
        <h1>{titre}</h1>
        {sousTitre && <p className="entete-sous">{sousTitre}</p>}
        {children}
      </div>
    </header>
  );
}

/** Bouton de retour en bas de page : revient à l'écran précédent (ou à href si on arrive directement). */
export function PiluleRetour({ href, label }: { href: string; label: string }) {
  return <BoutonRetourBas href={href} label={label} />;
}

/** Logo blanc et orange avec la virgule orange dessous (maquettes du 22/11/2026). */
export function LogoSwoosh() {
  return (
    <Link href="/" className="logo logo-grand logo-swoosh" aria-label="ServiLink, accueil">
      <span style={{ color: "var(--blanc)" }}>Servi<span>Link</span></span>
      <Virgule />
    </Link>
  );
}

/** En-tête vert avec la photo de l'ouvrier : accueil et annuaire. */
export function EnTetePhoto({ titre, question, children }: { titre?: string; question?: string; children?: React.ReactNode }) {
  return (
    <header className="entete-photo">
      <BarreCompacte titre={titre} retour={titre ? "/" : undefined} recherche seuil={200} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="entete-photo-img" src="/demo/entete-ouvrier.webp" alt="" fetchPriority="high" />
      <div className="entete-barre">
        <LogoSwoosh />
        <Link href="/espace" className="bouton-espace"><CircleUserRound size={24} aria-hidden="true" />Mon espace</Link>
      </div>
      {titre && <h1>{titre}</h1>}
      {question && <h1 className="entete-question">{question}</h1>}
      {children}
    </header>
  );
}
