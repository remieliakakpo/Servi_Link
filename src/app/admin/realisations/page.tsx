import { EnTete, PiluleRetour } from "@/components/EnTete";
import { rechercher } from "@/lib/donnees";
import { Moderation, type ProChoix } from "./Moderation";

export const metadata = { title: "Réalisations des pros", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PageRealisations({ searchParams }: { searchParams: Promise<{ pro?: string }> }) {
  const [{ pro }, { pros }] = await Promise.all([searchParams, rechercher({ parPage: 2000 })]);
  const choix: ProChoix[] = pros.map((p) => ({ id: p.id, nom: p.nom, metier: p.metier, metier_slug: p.metier_slug, type: p.type, lieu: p.quartier ?? "Grand Lomé", reference: p.reference, lat: p.latitude, lng: p.longitude }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  return (
    <>
      <EnTete titre="Réalisations des pros" sousTitre="Équipe ServiLink · reçues par WhatsApp" retour={{ href: "/admin", label: "Back-office" }} />
      <main className="corps">
        <Moderation pros={choix} proDepart={pro} />
        <PiluleRetour href="/admin" label="Retour" />
      </main>
    </>
  );
}
