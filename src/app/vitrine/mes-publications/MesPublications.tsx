"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, CircleCheck, Clock, CircleX } from "lucide-react";
import { Vignette } from "@/components/fiche/Realisations";
import { dateLongue } from "@/lib/depannage";
import { mesEnvois, type Realisation } from "@/lib/realisations";

const STATUT = {
  a_verifier: { texte: "En attente", Icone: Clock, ton: "orange" },
  en_ligne: { texte: "En ligne", Icone: CircleCheck, ton: "vert" },
  refusee: { texte: "Refusée", Icone: CircleX, ton: "gris" },
} as const;

/** Ce que le pro a publié depuis l'appli, avec la réponse de ServiLink. */
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
        {liste.map((r) => {
          const s = STATUT[r.statut];
          return (
            <li key={r.id}>
              {r.statut === "en_ligne" && r.pro
                ? <Link href={`/vitrine?pro=${r.pro.id}`}><Vignette m={r} /></Link>
                : <Vignette m={r} />}
              <span className={`pastille-statut pastille-${s.ton}`}><s.Icone size={14} aria-hidden="true" />{s.texte}</span>
              <small>{dateLongue(r.recu_le)}</small>
              {r.statut === "refusee" && r.motif && <small className="motif">{r.motif}</small>}
            </li>
          );
        })}
      </ul>
      <Link href="/vitrine/publier" className="bouton vitrine-bouton bouton-plein"><Camera size={22} aria-hidden="true" />Publier une autre</Link>
    </div>
  );
}
