import { PageVitrine } from "../EnTeteVitrine";
import { MesPublications } from "./MesPublications";

export const metadata = { title: "Mes publications", robots: { index: false } };

export default function Page() {
  return <PageVitrine titre="Mes publications" retour={{ href: "/vitrine/publier", label: "Publier" }}><MesPublications /></PageVitrine>;
}
