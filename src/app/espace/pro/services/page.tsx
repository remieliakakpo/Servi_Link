import { EnTete, PiluleRetour } from "@/components/EnTete";
import { MesServices } from "../Ecrans";

export const metadata = { title: "Mes services", robots: { index: false } };

export default function Page() {
  return (
    <>
      <EnTete titre="Mes services" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <MesServices />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
