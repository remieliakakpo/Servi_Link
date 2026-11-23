import Link from "next/link";
import { ArrowLeft, Heart, Info, MapPin, Phone, Star, StarHalf, TriangleAlert, UserRound } from "lucide-react";
import { basculerFavori } from "@/app/espace/actions";
import { BoutonContact } from "@/components/BoutonContact";
import { PiluleRetour } from "@/components/EnTete";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { dateCourte, decimal } from "@/lib/format";
import type { Avis, Fiche } from "@/lib/types";
import { lienAppel, lienWhatsApp, messageViaServiLink, NUMERO_CONTACT_TEMPORAIRE, remplir } from "@/lib/whatsapp";

/** Barre verte du haut : « ← Annuaire » et « Voir sur la carte » (la carte de l'annuaire, centrée sur la fiche). */
export function BarreFiche({ f }: { f: Fiche }) {
  return (
    <div className="barre-fiche">
      <Link href="/annuaire" className="retour"><ArrowLeft size={26} aria-hidden="true" />Annuaire</Link>
      {f.latitude != null && (
        <Link href={`/annuaire?vue=carte&pro=${encodeURIComponent(f.id)}`} className="pilule-blanche"><MapPin size={20} aria-hidden="true" />Voir sur la carte</Link>
      )}
    </div>
  );
}

export function Etoiles({ note, taille = 14 }: { note: number; taille?: number }) {
  const pleines = Math.floor(note + 0.25), demi = note - pleines >= 0.25 && note - pleines < 0.75;
  return (
    <span className="etoiles" role="img" aria-label={`${String(note).replace(".", ",")} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => i < pleines ? <Star key={i} size={taille} className="etoile" aria-hidden="true" />
        : i === pleines && demi ? <StarHalf key={i} size={taille} className="etoile" aria-hidden="true" />
        : <Star key={i} size={taille} color="#d8d0c4" aria-hidden="true" />)}
    </span>
  );
}

export function AvisCarte({ a }: { a: Avis }) {
  return (
    <li className="avis-carte">
      <header>
        <span className="avatar"><UserRound size={22} aria-hidden="true" /></span>
        <span><strong>{a.prenom_client ?? "Client"}</strong><br /><small className="muet">{dateCourte(a.created_at)}</small>{a.note != null && <><br /><Etoiles note={a.note} taille={11} /></>}</span>
      </header>
      {a.commentaire && <p>{a.commentaire}</p>}
    </li>
  );
}

/** Appeler (contour) et Écrire sur WhatsApp (vert). Le message cite la référence de la fiche. */
export function DuoContact({ f, message }: { f: Fiche; message: string }) {
  const wa = NUMERO_CONTACT_TEMPORAIRE
    ? lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE, messageViaServiLink(f.nom, f.reference))
    : lienWhatsApp(f.whatsapp, remplir(message, { nom: f.nom, id: f.reference }));
  const tel = lienAppel(NUMERO_CONTACT_TEMPORAIRE ?? f.telephone ?? f.whatsapp);
  return (
    <div className="duo-contact">
      {tel ? <BoutonContact href={tel} type="appel" cible={f.id} className="bouton bouton-contour-vert"><Phone size={22} fill="currentColor" aria-hidden="true" />Appeler</BoutonContact> : <span />}
      {wa && <BoutonContact href={wa} type="whatsapp" cible={f.id} className="bouton bouton-vert"><IconeWhatsApp taille={26} />Écrire sur WhatsApp</BoutonContact>}
    </div>
  );
}

/** Favoris, signalement et référence de la fiche, en bas des deux fiches. */
export function BasDeFiche({ f, favori, numeroServiLink }: { f: Fiche; favori: boolean; numeroServiLink: string }) {
  const signaler = lienWhatsApp(numeroServiLink, `Bonjour ServiLink, je signale un problème sur la fiche ${f.reference} (${f.nom}) : `);
  return (
    <>
      <div className="duo-actions">
        <form action={basculerFavori} style={{ display: "grid" }}>
          <input type="hidden" name="id" value={f.id} />
          <button type="submit" className="bouton bouton-contour-vert" aria-pressed={favori}>
            <Heart size={22} fill={favori ? "currentColor" : "none"} aria-hidden="true" />{favori ? "Dans mes favoris" : "Ajouter à mes favoris"}
          </button>
        </form>
        {signaler && <a href={signaler} target="_blank" rel="noopener" className="bouton bouton-rouge-contour"><TriangleAlert size={22} aria-hidden="true" />Signaler un problème</a>}
      </div>
      <p className="reference">Réf. {f.reference}</p>
      <PiluleRetour href="/annuaire" label="Retour" />
    </>
  );
}

/** Fiche issue de la collecte Google Maps, pas encore vérifiée sur place : on le dit, et on n'affiche que ce qui est connu. */
export function BandeNonVerifiee({ f }: { f: Fiche }) {
  return (
    <p className="bande-non-verifiee">
      <Info size={22} aria-hidden="true" />
      <span><strong>Pas encore vérifié par ServiLink</strong><small>{f.a_confirmer
        ? <>Infos lues sur Google Maps le {dateCourte(f.date_verification)}, à confirmer (nom, téléphone, horaires)</>
        : <>Infos relevées sur Google Maps le {dateCourte(f.date_verification)}</>}</small></span>
    </p>
  );
}

/** « 4,6 / 5 (20 avis Google) » ou « Pas encore d'avis ». */
export function NoteGoogle({ f, taille = 16 }: { f: Fiche; taille?: number }) {
  if (f.note_google == null) return f.a_confirmer ? null : <span className="muet">Pas encore d&apos;avis</span>;
  return <span className="ligne-icone" style={{ margin: 0 }}><Star size={taille} className="etoile" aria-hidden="true" />{decimal(f.note_google)} / 5<small className="muet">({f.avis_google ?? 0} avis Google)</small></span>;
}
