import Link from "next/link";
import { redirect } from "next/navigation";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { modeDemo } from "@/lib/donnees";
import { dateCourte } from "@/lib/format";
import { compteConnecte } from "@/lib/session";
import { supabaseServeur } from "@/lib/supabase/server";

export const metadata = { title: "Mes demandes", robots: { index: false } };
export const dynamic = "force-dynamic";

type Demande = { id: number; besoin: string; quartier: string | null; statut: string; created_at: string; professionnel_id: string | null; professionnel: string | null };

// Écran provisoire (pas encore de maquette). Les demandes sont saisies par le conseiller WhatsApp.
export default async function Demandes() {
  if (!(await compteConnecte())) redirect("/espace?suite=/espace/demandes");
  const demandes: Demande[] = modeDemo ? [] :
    ((await (await supabaseServeur()).from("mes_demandes").select("*").order("created_at", { ascending: false })).data ?? []);
  return (
    <>
      <EnTete titre="Mes demandes" retour={{ href: "/espace" }} />
      <main className="corps">
        <div className="page" style={{ width: "100%" }}>
          {demandes.length === 0 ? <p>Aucune demande pour le moment.</p> : (
            <ul className="liste">
              {demandes.map((d) => (
                <li key={d.id} className="carte" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <strong>{d.besoin}</strong>
                  <p className="muet">{dateCourte(d.created_at)}{d.quartier && ` · ${d.quartier}`} · {d.statut}</p>
                  {d.professionnel_id && <p>Mis en relation avec <Link className="lien-orange" href={`/pro/${d.professionnel_id}`}>{d.professionnel}</Link></p>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <PiluleRetour href="/espace" label="Retour à mon espace" />
      </main>
    </>
  );
}
