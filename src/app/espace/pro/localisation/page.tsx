import { EnTete, PiluleRetour } from "@/components/EnTete";
import { quartiers } from "@/lib/donnees";
import { MonLieu } from "../Ecrans";

export const metadata = { title: "Localisation de l’atelier", robots: { index: false } };

export default async function Page() {
  const qs = await quartiers();
  return (
    <>
      <EnTete titre="Localisation de l’atelier" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <MonLieu quartiers={qs.map((x) => x.nom)} />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
