import { EnTete, PiluleRetour } from "@/components/EnTete";

export default function Introuvable() {
  return (
    <>
      <EnTete titre="Page introuvable" retour={{ href: "/" }} />
      <main className="corps">
        <p className="page">Cette fiche n&apos;existe pas ou n&apos;est plus publiée (vérification de plus de 6 mois).</p>
        <PiluleRetour href="/annuaire" label="Voir l’annuaire" />
      </main>
    </>
  );
}
