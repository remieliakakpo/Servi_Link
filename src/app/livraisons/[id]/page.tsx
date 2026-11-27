import { EnTete, PiluleRetour } from "@/components/EnTete";
import { SuiviLivraison } from "./SuiviLivraison";

export const metadata = { title: "Ma livraison", robots: { index: false } };

export default async function Livraison({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string }> }) {
  const [{ id }, { e }] = await Promise.all([params, searchParams]);
  return (
    <>
      <EnTete titre="Livraison de carburant" retour={{ href: "/livraisons", label: "Mes livraisons" }} />
      <main className="corps">
        <SuiviLivraison id={id} etape={e} />
        <PiluleRetour href="/livraisons" label="Retour" />
      </main>
    </>
  );
}
