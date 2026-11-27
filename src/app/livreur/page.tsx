import Link from "next/link";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { depuisParams } from "@/lib/depannage";
import { ProposerTarif } from "./ProposerTarif";

export const metadata = { title: "Espace livreur · proposer un tarif", robots: { index: false } };

export default async function Livreur({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const lu = depuisParams(await searchParams);
  return (
    <>
      <EnTete titre="Proposer un tarif" sousTitre="Espace livreur" retour={{ href: "/", label: "Accueil" }} />
      <main className="corps">
        {lu ? <ProposerTarif d={lu.d} initial={lu.t} /> : (
          <div className="page formulaire">
            <p className="alerte">Ouvrez cette page avec le lien de la demande reçu sur WhatsApp.</p>
            <Link href="/" className="lien-simple">Retour à l&apos;accueil</Link>
          </div>
        )}
        <PiluleRetour href="/" label="Retour" />
      </main>
    </>
  );
}
