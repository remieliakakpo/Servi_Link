import { redirect } from "next/navigation";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { compteConnecte } from "@/lib/session";
import { deconnecter } from "../actions";

export const metadata = { title: "Mon profil", robots: { index: false } };
export const dynamic = "force-dynamic";

// Écran provisoire (pas encore de maquette)
export default async function Profil() {
  const compte = await compteConnecte();
  if (!compte) redirect("/espace?suite=/espace/profil");
  return (
    <>
      <EnTete titre="Mon profil" retour={{ href: "/espace" }} />
      <main className="corps">
        <div className="page" style={{ display: "grid", gap: 12, width: "100%" }}>
          {compte.email && <p style={{ margin: 0 }}>E-mail : <strong>{compte.email}</strong></p>}
          {compte.telephone && <p style={{ margin: 0 }}>Téléphone : <strong>{compte.telephone}</strong></p>}
          <form action={deconnecter}><button className="bouton bouton-contour bouton-plein" type="submit">Se déconnecter</button></form>
        </div>
        <PiluleRetour href="/espace" label="Retour à mon espace" />
      </main>
    </>
  );
}
