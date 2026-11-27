import { EnTete, PiluleRetour } from "@/components/EnTete";
import { MaFiche } from "./Ecrans";

export const metadata = { title: "Ma fiche professionnelle", robots: { index: false } };

export default function Page() {
  return (
    <>
      <EnTete titre="Ma fiche professionnelle" retour={{ href: "/espace", label: "Mon espace" }} />
      <main className="corps">
        <MaFiche />
        <PiluleRetour href="/espace" label="Retour" />
      </main>
    </>
  );
}
