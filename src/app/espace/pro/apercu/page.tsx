import { EnTete, PiluleRetour } from "@/components/EnTete";
import { ApercuFiche } from "../Ecrans";

export const metadata = { title: "Aperçu de ma fiche", robots: { index: false } };

export default function Page() {
  return (
    <>
      <EnTete titre="Aperçu de ma fiche" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <ApercuFiche />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
