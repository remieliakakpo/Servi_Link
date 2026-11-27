import { EnTete, PiluleRetour } from "@/components/EnTete";
import { ReponseDemande } from "../Ecrans";

export const metadata = { title: "Réponse à ma demande", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  return (
    <>
      <EnTete titre="Réponse à ma demande" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <ReponseDemande statut={s === "conforme" || s === "correction" ? s : undefined} message={m?.slice(0, 300)} />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
