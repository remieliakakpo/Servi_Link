import { BarreNav } from "@/components/BarreNav";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { calculateurActif, parametres, prixMateriaux } from "@/lib/donnees";
import { Calculateur } from "./Calculateur";

export const metadata = { title: "Préparer mon chantier" };
export const revalidate = 3600;

export default async function PageCalculateur() {
  const [{ version, coefficients }, p, prix] = await Promise.all([
    calculateurActif(),
    parametres(),
    prixMateriaux(),
  ]);
  return (
    <>
      <EnTete titre="Préparer mon chantier" retour={{ href: "/", label: "Accueil" }} sousTitre="Calculateur visuel en lots togolais, sans calcul compliqué." />
      <main className="corps corps-avec-nav">
        <Calculateur
          version={version}
          coefficients={coefficients}
          modeleMessage={String(p.message_liste)}
          numeroServiLink={String(p.whatsapp_servilink)}
          prixActuels={prix}
        />
        <PiluleRetour href="/" label="Retour" />
      </main>
      <BarreNav />
    </>
  );
}
