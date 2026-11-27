import { EnTete, PiluleRetour } from "@/components/EnTete";
import { MesLivraisons } from "./MesLivraisons";

export const metadata = { title: "Mes livraisons", robots: { index: false } };

export default function Livraisons() {
  return (
    <>
      <EnTete titre="Mes livraisons" retour={{ href: "/espace", label: "Mon espace" }} />
      <main className="corps">
        <MesLivraisons />
        <PiluleRetour href="/" label="Accueil" />
      </main>
    </>
  );
}
