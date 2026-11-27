"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { CarteLieu, PastilleStatut, TitreSection } from "@/components/depannage/Elements";
import { enregistrer, livraison, type Livraison } from "@/lib/depannage";
import { lienWhatsApp, NUMERO_CONTACT_TEMPORAIRE } from "@/lib/whatsapp";

const MOTS = ["", "Mauvais", "Moyen", "Correct", "Bien", "Excellent"];

export function EvaluerLivraison({ id }: { id: string }) {
  const router = useRouter();
  const [l, setL] = useState<Livraison | null | undefined>(undefined);
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  useEffect(() => { const x = livraison(id) ?? null; setL(x); if (x?.note) { setNote(x.note); setCommentaire(x.commentaire ?? ""); } }, [id]);
  if (l === undefined) return <div className="page" />;
  if (!l) return <p className="alerte page">Cette livraison n&apos;est pas enregistrée sur ce téléphone.</p>;

  function enregistrerAvis(e: React.FormEvent) {
    e.preventDefault();
    if (!note) return;
    enregistrer({ ...l!, note, commentaire: commentaire.trim() || undefined });
    // L'avis part aussi chez ServiLink, qui suit la qualité des livreurs
    const wa = lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE, `Avis sur la livraison ${l!.id} : ${note}/5${commentaire.trim() ? ` · ${commentaire.trim()}` : ""}`);
    if (wa) window.open(wa, "_blank", "noopener");
    router.push("/livraisons");
  }

  return (
    <form className="page formulaire" onSubmit={enregistrerAvis}>
      <PastilleStatut s={l.statut} />
      <CarteLieu d={l} />
      <TitreSection id="t-note">Quelle note donnez-vous à la livraison ?</TitreSection>
      <div className="etoiles-choix" role="radiogroup" aria-labelledby="t-note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={note === n} aria-label={`${n} sur 5`} onClick={() => setNote(n)}>
            <Star size={40} strokeWidth={1.6} fill={n <= note ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="aide" style={{ textAlign: "center" }} aria-live="polite">{note ? `${note} sur 5 · ${MOTS[note]}` : "Touchez une étoile"}</p>
      <label className="champ-groupe">
        <span className="titre-form"><h2>Commentaire <small>(facultatif)</small></h2></span>
        <textarea className="champ zone-texte" rows={3} maxLength={400} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Ex. le livreur a vite trouvé le point de rendez-vous." />
      </label>
      <button type="submit" className="bouton bouton-orange bouton-plein" disabled={!note}>Enregistrer mon avis</button>
    </form>
  );
}
