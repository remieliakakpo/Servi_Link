import { EnTete, PiluleRetour } from "@/components/EnTete";
import { EvaluerLivraison } from "./EvaluerLivraison";

export const metadata = { title: "Évaluer la livraison", robots: { index: false } };

export default async function Evaluer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <EnTete titre="Évaluer la livraison" retour={{ href: `/livraisons/${id}`, label: "Détail" }} />
      <main className="corps">
        <EvaluerLivraison id={id} />
        <PiluleRetour href={`/livraisons/${id}`} label="Retour" />
      </main>
    </>
  );
}
