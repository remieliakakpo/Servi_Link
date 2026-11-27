import { EnTete, PiluleRetour } from "@/components/EnTete";
import { quartiers } from "@/lib/donnees";
import { MaDisponibilite } from "../Ecrans";

export const metadata = { title: "Ma disponibilité", robots: { index: false } };

export default async function Page() {
  const qs = await quartiers();
  return (
    <>
      <EnTete titre="Ma disponibilité" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <MaDisponibilite quartiers={qs.map((x) => x.nom)} />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
