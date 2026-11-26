import { BarreNav } from "@/components/BarreNav";
import { parametres } from "@/lib/donnees";
import { ShortsClient } from "./ShortsClient";

export const metadata = {
  title: "Chantiers en Action — ServiLink Shorts",
  description: "Découvrez les vidéos courtes et notes vocales des artisans vérifiés sur leurs chantiers à Lomé.",
};

export default async function PageShorts() {
  const p = await parametres();
  return (
    <>
      <ShortsClient numeroServiLink={String(p.whatsapp_servilink)} />
      <BarreNav />
    </>
  );
}
