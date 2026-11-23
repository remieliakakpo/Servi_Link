import { EnTete, PiluleRetour } from "@/components/EnTete";
import { calculateurActif, parametres } from "@/lib/donnees";
import { Calculateur } from "./Calculateur";

export const metadata = { title: "Préparer mon chantier" };
export const revalidate = 3600;

export default async function PageCalculateur() {
  const [{ version, coefficients }, p] = await Promise.all([calculateurActif(), parametres()]);
  return (
    <>
      <EnTete titre="Préparer mon chantier" retour={{ href: "/", label: "Accueil" }} />
      <main className="corps">
        <Calculateur version={version} coefficients={coefficients} modeleMessage={String(p.message_liste)} />
        <PiluleRetour href="/" label="Retour" />
      </main>
    </>
  );
}
