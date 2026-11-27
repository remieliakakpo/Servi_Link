import { EnTete, PiluleRetour } from "@/components/EnTete";
import { quartiers } from "@/lib/donnees";
import { ChoixPanne } from "./ChoixPanne";

export const metadata = { title: "Je suis en panne" };

export default async function Depannage() {
  const qs = await quartiers();
  return (
    <>
      <EnTete titre="Je suis en panne" sousTitre="Trouvez un service de dépannage à proximité." retour={{ href: "/", label: "Accueil" }} />
      <main className="corps">
        <ChoixPanne quartiers={qs.map((q) => q.nom)} />
        <PiluleRetour href="/" label="Retour" />
      </main>
    </>
  );
}
