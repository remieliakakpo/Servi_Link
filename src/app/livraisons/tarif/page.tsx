import Link from "next/link";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { depuisParams } from "@/lib/depannage";
import { TarifLivreur } from "./TarifLivreur";

export const metadata = { title: "Tarif du livreur", robots: { index: false } };

export default async function Tarif({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const lu = depuisParams(await searchParams);
  return (
    <>
      <EnTete titre="Tarif du livreur" retour={{ href: "/livraisons", label: "Mes livraisons" }} />
      <main className="corps">
        {lu?.t ? <TarifLivreur d={lu.d} t={lu.t} /> : (
          <div className="page formulaire">
            <p className="alerte">Ce lien de tarif est incomplet. Demandez au livreur de vous le renvoyer.</p>
            <Link href="/livraisons" className="lien-simple">Mes livraisons</Link>
          </div>
        )}
        <PiluleRetour href="/livraisons" label="Retour" />
      </main>
    </>
  );
}
