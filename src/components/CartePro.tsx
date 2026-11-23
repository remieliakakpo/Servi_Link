import Link from "next/link";
import { BriefcaseBusiness, Check, ChevronRight, MapPin, Navigation, Package, Phone, Star, Truck } from "lucide-react";
import { BoutonContact } from "@/components/BoutonContact";
import { IconeMetier } from "@/components/IconeMetier";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { ans, decimal, fcfa, km } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";
import type { ProListe } from "@/lib/types";
import { lienAppel, lienWhatsApp, messageViaServiLink, NUMERO_CONTACT_TEMPORAIRE, remplir } from "@/lib/whatsapp";

type Props = {
  p: ProListe;
  /** Modèle du message WhatsApp ({nom}, {id}) ; sans lui, pas de boutons de contact. */
  message?: string;
  /** Remplace les boutons WhatsApp / Appeler (carte de la vue Carte : « Voir la fiche »). */
  bas?: React.ReactNode;
  as?: "li" | "div";
};

/** Carte riche de l'annuaire (maquette « Annuaire liste ») : photo vérifiée, infos, note, prix, contact. */
export function CartePro({ p, message, bas, as: Balise = "li" }: Props) {
  const ref = p.reference ?? p.id;
  const wa = message == null ? null : NUMERO_CONTACT_TEMPORAIRE
    ? lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE, messageViaServiLink(p.nom, ref))
    : lienWhatsApp(p.whatsapp, remplir(message, { nom: p.nom, id: ref }));
  const tel = message != null ? lienAppel(NUMERO_CONTACT_TEMPORAIRE ?? p.telephone ?? p.whatsapp) : null;
  const artisan = p.type === "Artisan";
  return (
    <Balise className="carte-pro">
      <div className="carte-pro-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.photo_principale ? <img src={urlPhoto(p.photo_principale)} alt="" loading="lazy" /> : <IconeMetier slug={p.metier_slug} type={p.type} taille={48} />}
        {p.verifie && <span className="badge-verifie"><Check size={14} strokeWidth={3} aria-hidden="true" />Vérifié</span>}
      </div>
      <div className="carte-pro-infos">
        <h3><Link href={`/pro/${p.id}`}>{p.nom}</Link></h3>
        <p className="ligne-icone"><span style={{ color: "var(--orange)", display: "flex" }}><IconeMetier slug={p.metier_slug} type={p.type} taille={18} /></span>{p.metier}</p>
        <p className="ligne-icone"><MapPin size={18} aria-hidden="true" /><span className="deux-lignes">{p.quartier ? `${p.quartier}, Lomé` : p.adresse ?? "Grand Lomé"}</span></p>
        {p.distance_km != null && (
          <p className="ligne-icone" title={p.position_approx ? "Distance depuis le centre du quartier" : undefined}>
            <Navigation size={18} aria-hidden="true" />{p.position_approx && "≈ "}{km(p.distance_km)}
          </p>
        )}
      </div>
      <div className="carte-pro-stats">
        {p.note_moyenne != null && (
          <>
            <span className="note-etoile"><Star size={18} className="etoile" aria-hidden="true" />{decimal(p.note_moyenne)} / 5</span>
            <small className="muet">({p.nb_avis} avis)</small>
          </>
        )}
        {p.note_moyenne == null && p.note_google != null && (
          <>
            <span className="note-etoile"><Star size={18} className="etoile" aria-hidden="true" />{decimal(p.note_google)} / 5</span>
            <small className="muet">({p.avis_google ?? 0} avis Google)</small>
          </>
        )}
        {p.note_moyenne == null && p.note_google == null && !p.a_confirmer && <small className="muet">Pas encore d&apos;avis</small>}
        {p.annees_experience != null && <span className="ligne-icone"><BriefcaseBusiness size={16} aria-hidden="true" />{ans(p.annees_experience)} d&apos;expérience</span>}
        {artisan && p.prix_depart != null && <><span className="apartir">À partir de</span><span className="prix-depart">{fcfa(p.prix_depart)}</span></>}
        {!artisan && p.livraison === "Oui" && <span className="ligne-icone"><Truck size={16} aria-hidden="true" />Livre à domicile</span>}
        {!artisan && p.nb_produits > 0 && <span className="ligne-icone"><Package size={16} aria-hidden="true" />{p.nb_produits} prix relevé{p.nb_produits > 1 ? "s" : ""}</span>}
      </div>
      <ChevronRight className="carte-pro-chevron" size={22} aria-hidden="true" />
      {bas ?? ((wa || tel) && (
        <div className="carte-pro-boutons">
          {wa && <BoutonContact href={wa} type="whatsapp" cible={p.id} className="mini-bouton mini-whatsapp"><IconeWhatsApp taille={20} />WhatsApp</BoutonContact>}
          {tel && <BoutonContact href={tel} type="appel" cible={p.id} className="mini-bouton mini-appel"><Phone size={18} fill="currentColor" aria-hidden="true" />Appeler</BoutonContact>}
        </div>
      ))}
    </Balise>
  );
}
