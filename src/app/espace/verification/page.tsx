import Link from "next/link";
import { redirect } from "next/navigation";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { SaisieCode } from "./SaisieCode";

export const metadata = { title: "Vérification", robots: { index: false } };

/** a••••@exemple.com / +228 •• •• •• 56 */
function masquer(canal: string, d: string) {
  if (canal === "email") { const [nom, dom] = d.split("@"); return `${nom.slice(0, 1)}••••@${dom}`; }
  return d.replace(/\d{2} \d{2} \d{2} (\d{2})$/, "•• •• •• $1");
}

export default async function Verification({ searchParams }: { searchParams: Promise<{ canal?: string; d?: string; suite?: string }> }) {
  const { canal: c, d, suite } = await searchParams;
  if (!d) redirect("/espace");
  const canal = c === "sms" ? "sms" : "email";
  return (
    <>
      <EnTete titre="Vérification" retour={{ href: `/espace?canal=${canal}` }}
        sousTitre={canal === "email" ? "Confirmez votre adresse e-mail." : "Confirmez votre numéro de téléphone."} />
      <main className="corps">
        <div className="page" style={{ display: "grid", gap: 16, width: "100%" }}>
          <h2 className="titre-ecran">Saisissez votre code</h2>
          <p style={{ margin: 0, fontSize: "1.1rem" }}>Code à 6 chiffres envoyé à<br /><strong>{masquer(canal, d)}</strong></p>
          <SaisieCode canal={canal} destination={d} suite={suite ?? "/espace"} />
          <Link href={`/espace?canal=${canal}`} className="lien-simple lien-souligne">
            {canal === "email" ? "Modifier mon adresse e-mail" : "Modifier mon numéro"}
          </Link>
        </div>
        <PiluleRetour href="/espace" label="Retour" />
      </main>
    </>
  );
}
