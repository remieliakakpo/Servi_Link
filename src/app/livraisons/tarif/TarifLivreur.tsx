"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CarteLieu, DetailTarif, TitreSection } from "@/components/depannage/Elements";
import { enregistrer, livraison, partagerWhatsApp, total, type Demande, type Livraison, type Tarif } from "@/lib/depannage";
import { fcfa } from "@/lib/format";

export function TarifLivreur({ d, t }: { d: Demande; t: Tarif }) {
  const router = useRouter();
  const [deja, setDeja] = useState<Livraison | undefined>();
  useEffect(() => setDeja(livraison(d.id)), [d.id]);
  const m = total(t, d.litres);
  const decide = deja && deja.statut !== "envoyee";

  function repondre(accepte: boolean) {
    const now = new Date().toISOString();
    enregistrer({ ...(deja ?? { creee: now }), ...d, ...t, statut: accepte ? "acceptee" : "refusee", majLe: now } as Livraison);
    // On prévient le livreur dans la même discussion WhatsApp
    window.open(partagerWhatsApp(accepte
      ? `J'accepte votre tarif de ${fcfa(m.total)} CFA pour la demande ${d.id}. Je vous attends.`
      : `Merci, mais je refuse le tarif de ${fcfa(m.total)} CFA pour la demande ${d.id}.`), "_blank", "noopener");
    router.push(accepte ? `/livraisons/${d.id}` : "/livraisons");
  }

  return (
    <div className="page formulaire">
      <TitreSection>Votre livraison</TitreSection>
      <CarteLieu d={d} />
      <TitreSection>Détail du tarif</TitreSection>
      <DetailTarif t={t} litres={d.litres} />
      {decide ? (
        <p className="alerte">Vous avez déjà répondu à ce tarif.</p>
      ) : (
        <>
          <button type="button" className="bouton bouton-orange bouton-plein" onClick={() => repondre(true)}>Accepter le tarif</button>
          <button type="button" className="lien-simple" onClick={() => repondre(false)}>Refuser le tarif</button>
          <p className="aide">Après votre accord, le livreur vous prévient à chaque étape sur WhatsApp.</p>
        </>
      )}
    </div>
  );
}
