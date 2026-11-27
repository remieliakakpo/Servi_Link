import Link from "next/link";
import { EnTete } from "@/components/EnTete";

export const metadata = { title: "Connexion équipe", robots: { index: false } };

// L'équipe se connecte comme tout le monde : avec son e-mail et un code reçu par e-mail (pas de mot de passe à retenir).
// L'accès au back-office dépend ensuite du rôle donné par un administrateur (page Équipe).
export default function Connexion() {
  return (
    <>
    <EnTete titre="Connexion de l’équipe" retour={{ href: "/" }} />
    <main className="corps"><div className="page" style={{ display: "grid", gap: 14 }}>
      <p>Connectez-vous avec votre adresse e-mail : vous recevez un code à 6 chiffres.</p>
      <Link href="/espace?canal=email&suite=/admin" className="bouton bouton-orange bouton-plein">Recevoir mon code</Link>
      <p className="muet">Première fois ? Après votre connexion, donnez votre adresse e-mail à l&apos;administrateur pour qu&apos;il vous ajoute à l&apos;équipe.</p>
    </div></main>
    </>
  );
}
