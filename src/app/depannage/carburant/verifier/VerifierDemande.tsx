"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { TitreSection } from "@/components/depannage/Elements";
import { brouillon, enregistrer, NOM_CARBURANT, origine, versParams, type Demande } from "@/lib/depannage";
import { lienWhatsApp, NUMERO_CONTACT_TEMPORAIRE } from "@/lib/whatsapp";

export function VerifierDemande() {
  const router = useRouter();
  const [d, setD] = useState<Demande | null | undefined>(undefined);
  useEffect(() => setD(brouillon()), []);

  if (d === undefined) return <div className="page" />;
  if (!d) return (
    <div className="page formulaire">
      <p className="alerte">Aucune demande en cours.</p>
      <Link href="/depannage/carburant" className="bouton bouton-orange bouton-plein">Demander du carburant</Link>
    </div>
  );

  const lignes: [string, string][] = [
    ["Lieu", d.lieu], ["Point de repère", d.repere ?? "Aucun"], ["Carburant", NOM_CARBURANT[d.carburant]], ["Quantité", `${d.litres} L`],
    ...(d.lat != null ? [["Position", "Ajoutée"] as [string, string]] : []),
  ];

  function partager() {
    const lien = `${origine()}/livreur?${versParams(d!)}`;
    const carte = d!.lat != null ? `\nPosition : https://www.google.com/maps?q=${d!.lat},${d!.lng}` : "";
    const texte = `Bonjour ServiLink, je demande une livraison de carburant (demande ${d!.id}) :\n`
      + `${NOM_CARBURANT[d!.carburant]} · ${d!.litres} L\n${[d!.lieu, d!.repere].filter(Boolean).join(" · ")}${carte}\n\nPour le livreur : ${lien}`;
    const wa = lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE, texte);
    const now = new Date().toISOString();
    enregistrer({ ...d!, statut: "envoyee", creee: now, majLe: now });
    if (wa) window.open(wa, "_blank", "noopener");
    router.push(`/livraisons/${d!.id}`);
  }

  return (
    <div className="page formulaire">
      <TitreSection action={<Link href="/depannage/carburant" className="lien-souligne">Modifier</Link>}>Livraison</TitreSection>
      <dl className="recap">
        {lignes.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      <TitreSection>Coût de la livraison</TitreSection>
      <div className="detail-tarif">
        <p><span><strong>Carburant</strong><small>Prix à la station × {d.litres} L</small></span></p>
        <p><span><strong>Déplacement</strong><small>Selon la distance aller-retour à la station</small></span></p>
      </div>
      <p className="aide">Le livreur vous envoie le total avant votre accord. Vous ne payez rien maintenant.</p>

      <button type="button" className="bouton bouton-vert bouton-plein" onClick={partager}>
        <IconeWhatsApp taille={24} />Envoyer sur WhatsApp
      </button>
    </div>
  );
}
