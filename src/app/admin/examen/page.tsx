import { EnTete, PiluleRetour } from "@/components/EnTete";
import { ExamenFiche } from "./ExamenFiche";

export const metadata = { title: "Examiner une fiche", robots: { index: false } };

export default async function Examen({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  return (
    <>
      <EnTete titre="Examiner une fiche" sousTitre="Équipe ServiLink" retour={{ href: "/admin", label: "Back-office" }} />
      <main className="corps">
        <ExamenFiche code={f} />
        <PiluleRetour href="/admin" label="Retour" />
      </main>
    </>
  );
}
