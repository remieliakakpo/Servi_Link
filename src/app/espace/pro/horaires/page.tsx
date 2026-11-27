import { EnTete, PiluleRetour } from "@/components/EnTete";
import { MesHoraires } from "../Ecrans";

export const metadata = { title: "Horaires de l’atelier", robots: { index: false } };

export default function Page() {
  return (
    <>
      <EnTete titre="Horaires de l’atelier" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <MesHoraires />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
