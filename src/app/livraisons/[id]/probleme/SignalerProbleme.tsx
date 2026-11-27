"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CarteLieu, TitreSection } from "@/components/depannage/Elements";
import { enregistrer, livraison, type Livraison } from "@/lib/depannage";

const MOTIFS = (l: Livraison) => [
  `J'ai reçu moins que les ${l.litres} L demandés.`,
  "Le carburant n'a pas été livré.",
  "Le total payé ne correspond pas au tarif accepté.",
  "Le livreur est arrivé très en retard.",
];

export function SignalerProbleme({ id }: { id: string }) {
  const router = useRouter();
  const [l, setL] = useState<Livraison | null | undefined>(undefined);
  const [motif, setMotif] = useState("");
  const [detail, setDetail] = useState("");
  useEffect(() => setL(livraison(id) ?? null), [id]);
  if (l === undefined) return <div className="page" />;
  if (!l) return <p className="alerte page">Cette livraison n&apos;est pas enregistrée sur ce téléphone.</p>;

  function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const texte = [motif, detail.trim()].filter(Boolean).join(" ");
    if (!texte) return;
    enregistrer({ ...l!, statut: "signalee", probleme: texte });
    router.push(`/livraisons/${id}`);
  }

  return (
    <form className="page formulaire" onSubmit={envoyer}>
      <CarteLieu d={l} />
      <TitreSection id="t-motif">Que s&apos;est-il passé ?</TitreSection>
      <div role="radiogroup" aria-labelledby="t-motif" className="choix-liste">
        {MOTIFS(l).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={motif === m} className="choix choix-compact" onClick={() => setMotif(m)}>
            <span className="choix-texte">{m}</span><span className="radio" aria-hidden="true" />
          </button>
        ))}
      </div>
      <label className="champ-groupe">
        <span className="titre-form"><h2>Précisions <small>(facultatif)</small></h2></span>
        <textarea className="champ zone-texte" rows={3} maxLength={400} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ex. j'ai reçu 1 L au lieu de 2 L." />
      </label>
      <button type="submit" className="bouton bouton-orange bouton-plein" disabled={!motif && !detail.trim()}>Enregistrer le signalement</button>
    </form>
  );
}
