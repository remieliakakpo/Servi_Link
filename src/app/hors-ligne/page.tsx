import { EnTete, PiluleRetour } from "@/components/EnTete";

export const metadata = { title: "Hors connexion" };

// Écran provisoire (maquette à venir)
export default function HorsLigne() {
  return (
    <>
      <EnTete titre="Pas de réseau" />
      <main className="corps">
        <p className="page">Les fiches déjà vues, les prix et le calculateur restent disponibles. Le reste reviendra avec le réseau.</p>
        <PiluleRetour href="/" label="Retour à l’accueil" />
      </main>
    </>
  );
}
