import { redirect } from "next/navigation";
import { CartePro } from "@/components/CartePro";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { demoListe } from "@/lib/demo";
import { modeDemo } from "@/lib/donnees";
import { compteConnecte, idsFavoris } from "@/lib/session";
import { supabaseServeur } from "@/lib/supabase/server";
import type { ProListe } from "@/lib/types";

export const metadata = { title: "Mes favoris", robots: { index: false } };
export const dynamic = "force-dynamic";

// Écran provisoire (pas encore de maquette) : réutilise les cartes de l'annuaire
export default async function Favoris() {
  if (!(await compteConnecte())) redirect("/espace?suite=/espace/favoris");
  let pros: ProListe[];
  if (modeDemo) {
    const ids = await idsFavoris();
    pros = demoListe().filter((p) => ids.includes(p.id));
  } else {
    const { data } = await (await supabaseServeur()).from("mes_favoris").select("id, nom, type, metier, metier_slug, quartier").order("created_at", { ascending: false });
    pros = (data ?? []) as ProListe[];
  }
  return (
    <>
      <EnTete titre="Mes favoris" retour={{ href: "/espace" }} />
      <main className="corps">
        <div className="page" style={{ width: "100%" }}>
          {pros.length ? <ul className="liste">{pros.map((p) => <CartePro key={p.id} p={p} />)}</ul>
            : <p>Aucun professionnel enregistré. Sur une fiche, touchez « Enregistrer dans mes favoris ».</p>}
        </div>
        <PiluleRetour href="/espace" label="Retour à mon espace" />
      </main>
    </>
  );
}
