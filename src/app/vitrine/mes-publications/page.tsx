import { PageVitrine } from "../EnTeteVitrine";
import { MesPublications } from "./MesPublications";

export const metadata = { title: "Mes publications", robots: { index: false } };

export default function Page() {
  return <PageVitrine titre="Espace pro" retour={{ href: "/vitrine", label: "Vitrine" }} actif="publications"><MesPublications /></PageVitrine>;
}
