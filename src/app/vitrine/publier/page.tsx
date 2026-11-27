import { PageVitrine } from "../EnTeteVitrine";
import { Publier } from "./Publier";

export const metadata = { title: "Publier mon travail", robots: { index: false } };

export default function Page() {
  return <PageVitrine titre="Espace pro" retour={{ href: "/vitrine", label: "Vitrine" }} actif="publier"><Publier /></PageVitrine>;
}
