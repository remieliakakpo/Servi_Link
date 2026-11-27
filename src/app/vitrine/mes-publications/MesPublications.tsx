"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Check, Eye, X } from "lucide-react";
import { Vignette } from "@/components/fiche/Realisations";
import { dateLongue } from "@/lib/depannage";
import { mesEnvois, texteEtiquette, type Realisation } from "@/lib/realisations";

/** Les étapes d'une publication : envoyée, vérifiée par ServiLink, en ligne (ou refusée, avec le motif). */
function Etapes({ r }: { r: Realisation }) {
  const refusee = r.statut === "refusee", enLigne = r.statut === "en_ligne";
  const etapes = [
    { texte: "Envoyée", etat: "fait" },
    { texte: refusee ? "Refusée" : enLigne ? "Vérifiée" : "En vérification", etat: refusee ? "refus" : enLigne ? "fait" : "encours" },
    { texte: "En ligne", etat: enLigne ? "fait" : "afaire" },
  ];
  return (
    <ol className="etapes-pub">
      {etapes.map((e) => (
        <li key={e.texte} className={e.etat}>
          <span>{e.etat === "fait" ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : e.etat === "refus" ? <X size={14} strokeWidth={3} aria-hidden="true" /> : null}</span>{e.texte}
        </li>
      ))}
    </ol>
  );
}

/** Ce que le pro a publié depuis l'appli, avec l'étape où en est chaque publication. */
export function MesPublications() {
  const [liste, setListe] = useState<Realisation[] | null>(null);
  useEffect(() => { mesEnvois().then(setListe).catch(() => setListe([])); }, []);
  if (liste == null) return null;
  if (!liste.length) return (
    <div className="publier publier-fini">
      <p>Vous n&apos;avez encore rien publié.</p>
      <Link href="/vitrine/publier" className="bouton vitrine-bouton bouton-plein"><Camera size={22} aria-hidden="true" />Publier mon travail</Link>
    </div>
  );
  return (
    <div className="publier">
      <ul className="mes-publications">
        {liste.map((r) => (
          <li key={r.id}>
            <Vignette m={r} />
            <div className="mes-publications-texte">
              <strong>{r.type === "video" ? "Vidéo" : "Photo"}{r.etiquette && ` · ${texteEtiquette(r.etiquette)}`}</strong>
              <small>Envoyée le {dateLongue(r.recu_le)}</small>
              <Etapes r={r} />
              {r.statut === "refusee" && r.motif && <small className="motif">Motif : {r.motif}</small>}
              {r.statut === "en_ligne" && r.pro && <Link href={`/vitrine?pro=${r.pro.id}`} className="lien-orange voir-vitrine"><Eye size={16} aria-hidden="true" />Voir dans la Vitrine</Link>}
            </div>
          </li>
        ))}
      </ul>
      <Link href="/vitrine/publier" className="bouton vitrine-bouton bouton-plein"><Camera size={22} aria-hidden="true" />Publier une autre</Link>
    </div>
  );
}
