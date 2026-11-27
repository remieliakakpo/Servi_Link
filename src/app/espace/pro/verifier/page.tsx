import { EnTete, PiluleRetour } from "@/components/EnTete";
import { VerifierFiche } from "../Ecrans";

export const metadata = { title: "Vérifier ma fiche", robots: { index: false } };

export default function Page() {
  return (
    <>
      <EnTete titre="Vérifier ma fiche" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <VerifierFiche />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
