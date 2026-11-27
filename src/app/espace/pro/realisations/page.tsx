import { EnTete, PiluleRetour } from "@/components/EnTete";
import { MesRealisations } from "../Ecrans";

export const metadata = { title: "Mes réalisations", robots: { index: false } };

export default function Page() {
  return (
    <>
      <EnTete titre="Mes réalisations" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <MesRealisations />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
