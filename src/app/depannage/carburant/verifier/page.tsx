import { EnTete, PiluleRetour } from "@/components/EnTete";
import { VerifierDemande } from "./VerifierDemande";

export const metadata = { title: "Vérifier ma demande", robots: { index: false } };

export default function Verifier() {
  return (
    <>
      <EnTete titre="Vérifier ma demande" retour={{ href: "/depannage/carburant", label: "Retour" }} />
      <main className="corps">
        <VerifierDemande />
        <PiluleRetour href="/depannage/carburant" label="Retour" />
      </main>
    </>
  );
}
