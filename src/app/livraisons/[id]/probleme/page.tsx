import { EnTete, PiluleRetour } from "@/components/EnTete";
import { SignalerProbleme } from "./SignalerProbleme";

export const metadata = { title: "Signaler un problème", robots: { index: false } };

export default async function Probleme({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <EnTete titre="Signaler un problème" retour={{ href: `/livraisons/${id}`, label: "Détail" }} />
      <main className="corps">
        <SignalerProbleme id={id} />
        <PiluleRetour href={`/livraisons/${id}`} label="Retour" />
      </main>
    </>
  );
}
