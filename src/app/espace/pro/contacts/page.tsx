import { EnTete, PiluleRetour } from "@/components/EnTete";
import { MesContacts } from "../Ecrans";

export const metadata = { title: "Contacts professionnels", robots: { index: false } };

export default function Page() {
  return (
    <>
      <EnTete titre="Contacts professionnels" retour={{ href: "/espace/pro", label: "Ma fiche" }} />
      <main className="corps">
        <MesContacts />
        <PiluleRetour href="/espace/pro" label="Retour" />
      </main>
    </>
  );
}
