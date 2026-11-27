import type { Metadata } from "next";
import { BarreNav } from "@/components/BarreNav";
import { metiers, vitrine } from "@/lib/donnees";
import { Fil } from "./Fil";

export const metadata: Metadata = { title: "Vitrine", description: "Les réalisations des artisans et commerçants de Lomé, en photos et courtes vidéos, vérifiées par ServiLink." };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ metier?: string; pro?: string; i?: string }> };

export default async function Vitrine({ searchParams }: Props) {
  const [sp, liste, items] = await Promise.all([searchParams, metiers(), vitrine()]);
  const metier = sp.metier && liste.some((m) => m.slug === sp.metier) ? sp.metier : undefined;
  return (
    <>
      <Fil serveur={items} metiers={liste} metierDepart={metier} proDepart={sp.pro?.slice(0, 20)} indexDepart={Math.max(0, Number(sp.i) || 0)} />
      <BarreNav sombre />
    </>
  );
}
