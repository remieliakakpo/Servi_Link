import { EnTete, PiluleRetour } from "@/components/EnTete";
import { quartiers } from "@/lib/donnees";
import { DemandeCarburant } from "./DemandeCarburant";

export const metadata = { title: "Demander du carburant" };

export default async function Carburant({ searchParams }: { searchParams: Promise<{ lieu?: string }> }) {
  const [{ lieu }, qs] = await Promise.all([searchParams, quartiers()]);
  return (
    <>
      <EnTete titre="Demander du carburant" sousTitre="Préparez votre demande pour un livreur." retour={{ href: "/depannage", label: "Retour" }} />
      <main className="corps">
        <DemandeCarburant quartiers={qs.map((q) => q.nom)} lieuInitial={lieu} />
        <PiluleRetour href="/depannage" label="Retour" />
      </main>
    </>
  );
}
