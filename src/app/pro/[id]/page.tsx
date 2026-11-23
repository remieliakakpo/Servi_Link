import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FicheArtisan } from "@/components/fiche/FicheArtisan";
import { FicheFournisseur } from "@/components/fiche/FicheFournisseur";
import { fiche, parametres } from "@/lib/donnees";
import { dateCourte } from "@/lib/format";
import { idsFavoris } from "@/lib/session";

export const dynamic = "force-dynamic"; // l'état « favori » dépend de la personne connectée

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ avis?: string; photos?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await fiche((await params).id);
  if (!f) return {};
  const titre = `${f.nom}, ${f.metier.toLowerCase()} à ${f.quartier ?? "Lomé"}`;
  const description = !f.verifie ? `${f.metier} à ${f.quartier ?? "Lomé"}. Fiche pas encore vérifiée par ServiLink. Réf. ${f.reference}.` : `Vérifié par ServiLink le ${dateCourte(f.date_verification)}${f.note_moyenne ? `, noté ${String(f.note_moyenne).replace(".", ",")}/5` : ""}. Réf. ${f.reference}.`;
  return { title: titre, description, openGraph: { title: titre, description, type: "profile", locale: "fr_TG" } };
}

export default async function FichePro({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [f, p, favoris] = await Promise.all([fiche(id), parametres(), idsFavoris()]);
  if (!f) notFound();
  const commun = {
    f, message: String(p.message_contact_pro), favori: favoris.includes(f.id),
    numeroServiLink: String(p.whatsapp_servilink), tousAvis: sp.avis === "tous",
  };
  return f.type === "Artisan"
    ? <FicheArtisan {...commun} toutesPhotos={sp.photos === "toutes"} />
    : <FicheFournisseur {...commun} />;
}
