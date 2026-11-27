"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, CircleCheck, Star } from "lucide-react";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { CarteLieu, LigneTotal, PastilleStatut, TitreSection } from "@/components/depannage/Elements";
import { avancer, dateLongue, enregistrer, ETAPES, livraison, partagerWhatsApp, total, type Etape, type Livraison } from "@/lib/depannage";
import { NUMERO_CONTACT_TEMPORAIRE, lienWhatsApp } from "@/lib/whatsapp";

const ETAPES_VALIDES: Etape[] = ["acceptee", "station", "route", "livree"];

/** Une page pour toute la vie d'une livraison : attente du tarif, suivi, réception, détail. */
export function SuiviLivraison({ id, etape }: { id: string; etape?: string }) {
  const router = useRouter();
  const [l, setL] = useState<Livraison | null | undefined>(undefined);

  useEffect(() => {
    let x = livraison(id) ?? null;
    // Lien d'étape envoyé par le livreur : le suivi avance
    if (x && etape && ETAPES_VALIDES.includes(etape as Etape)) {
      const y = avancer(x, etape as Etape);
      if (y !== x) { enregistrer(y); x = y; }
    }
    setL(x);
  }, [id, etape]);

  if (l === undefined) return <div className="page" />;
  if (!l) return (
    <div className="page formulaire">
      <p className="alerte">Cette livraison n&apos;est pas enregistrée sur ce téléphone. Ouvrez le lien sur le téléphone qui a fait la demande.</p>
      <Link href="/livraisons" className="lien-simple">Mes livraisons</Link>
    </div>
  );

  const montant = l.prixLitre != null && l.km != null && l.prixKm != null ? total({ prixLitre: l.prixLitre, km: l.km, prixKm: l.prixKm }, l.litres).total : null;
  const maj = (s: Livraison["statut"]) => { const y = { ...l, statut: s }; enregistrer(y); setL(y); };
  const carte = l.lat != null ? `https://www.google.com/maps?q=${l.lat},${l.lng}` : `https://www.google.com/maps/search/${encodeURIComponent(`${l.lieu} ${l.repere ?? ""}, Lomé`)}`;
  const relancer = lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE, `Bonjour ServiLink, j'attends toujours un tarif pour ma demande de carburant ${l.id} (${l.lieu}).`);

  // Demande envoyée, pas encore de tarif
  if (l.statut === "envoyee") return (
    <div className="page formulaire">
      <PastilleStatut s="envoyee" />
      <CarteLieu d={l} />
      <div className="encart-info"><span><strong>Demande envoyée à ServiLink</strong>Un livreur va vous envoyer son tarif sur WhatsApp. Ouvrez son lien pour l&apos;accepter.</span></div>
      {relancer && <a href={relancer} target="_blank" rel="noopener" className="bouton bouton-contour-vert bouton-plein"><IconeWhatsApp taille={22} />Relancer ServiLink</a>}
    </div>
  );

  // Livreur en chemin
  if (["acceptee", "station", "route"].includes(l.statut)) {
    const i = ETAPES.findIndex((e) => e.cle === l.statut);
    return (
      <div className="page formulaire">
        <h2 className="titre-vue">Suivre ma livraison</h2>
        <CarteLieu d={l} />
        <TitreSection>Progression</TitreSection>
        <ol className="progression">
          {ETAPES.map((e, k) => (
            <li key={e.cle} className={k < i ? "faite" : k === i ? "en-cours" : ""} aria-current={k === i ? "step" : undefined}>
              <span className="pastille-etape" aria-hidden="true">{k < i && <Check size={14} strokeWidth={3} />}</span>
              <span><strong>{e.titre}</strong>{k === i && <small>{e.detail}</small>}</span>
            </li>
          ))}
        </ol>
        {montant != null && <LigneTotal montant={montant} />}
        <a href={carte} target="_blank" rel="noopener" className="bouton bouton-contour-vert bouton-plein">Voir le lieu sur la carte<ArrowUpRight size={20} aria-hidden="true" /></a>
        <button type="button" className="lien-simple" onClick={() => maj("livree")}>J&apos;ai déjà reçu mon carburant</button>
      </div>
    );
  }

  // Livrée : le client confirme ou signale
  if (l.statut === "livree") return (
    <div className="page formulaire">
      <h2 className="titre-vue">Réception du carburant</h2>
      <CarteLieu d={l} />
      <p className="ligne-statut"><CircleCheck size={26} fill="var(--vert-ok)" color="var(--blanc)" aria-hidden="true" /><span><strong>Livraison déclarée terminée</strong><small>Le livreur indique avoir livré votre carburant.</small></span></p>
      {montant != null && <LigneTotal montant={montant} />}
      <TitreSection>Avez-vous reçu votre carburant ?</TitreSection>
      <button type="button" className="bouton bouton-orange bouton-plein" onClick={() => { maj("confirmee"); router.push(`/livraisons/${l.id}/evaluer`); }}>Confirmer la réception</button>
      <Link href={`/livraisons/${l.id}/probleme`} className="lien-simple">Signaler un problème</Link>
    </div>
  );

  // Détail (confirmée, signalée ou refusée)
  const partager = l.probleme ? partagerWhatsApp(`Bonjour, pour la livraison ${l.id} (${l.lieu}) : ${l.probleme}`) : null;
  return (
    <div className="page formulaire">
      <h2 className="titre-vue">Détail de la livraison</h2>
      <div><PastilleStatut s={l.statut} /><p className="aide" style={{ marginTop: 8 }}>{dateLongue(l.majLe, true)}</p></div>
      <TitreSection>Livraison</TitreSection>
      <CarteLieu d={l}>{montant != null && <LigneTotal montant={montant} />}</CarteLieu>
      {l.probleme && (<>
        <TitreSection>Votre signalement</TitreSection>
        <p className="encadre">{l.probleme}</p>
        {partager && <a href={partager} target="_blank" rel="noopener" className="bouton bouton-vert bouton-plein"><IconeWhatsApp taille={22} />Envoyer au livreur</a>}
      </>)}
      {l.statut === "confirmee" && (l.note
        ? <p className="ligne-statut"><Star size={22} className="etoile" fill="currentColor" aria-hidden="true" /><span><strong>Votre note : {l.note} sur 5</strong>{l.commentaire && <small>{l.commentaire}</small>}</span></p>
        : <Link href={`/livraisons/${l.id}/evaluer`} className="bouton bouton-orange bouton-plein">Évaluer la livraison</Link>)}
    </div>
  );
}
