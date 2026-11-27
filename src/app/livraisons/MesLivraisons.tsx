"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Fuel } from "lucide-react";
import { LigneTotal, PastilleStatut } from "@/components/depannage/Elements";
import { dateLongue, livraisons, NOM_CARBURANT, resume, total, type Livraison } from "@/lib/depannage";

type Filtre = "toutes" | "confirmees" | "signalees";
const FILTRES: [Filtre, string][] = [["toutes", "Toutes"], ["confirmees", "Confirmées"], ["signalees", "Signalées"]];

export function MesLivraisons() {
  const [liste, setListe] = useState<Livraison[] | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  useEffect(() => setListe(livraisons()), []);
  if (!liste) return <div className="page" />;

  const vues = liste.filter((l) => filtre === "toutes" || (filtre === "confirmees" ? l.statut === "confirmee" : l.statut === "signalee"));
  const parJour = new Map<string, Livraison[]>();
  for (const l of vues) { const j = dateLongue(l.creee); parJour.set(j, [...(parJour.get(j) ?? []), l]); }

  return (
    <div className="page formulaire">
      <div className="onglets-filtre" role="tablist" aria-label="Filtrer">
        {FILTRES.map(([f, t]) => <button key={f} type="button" role="tab" aria-selected={filtre === f} onClick={() => setFiltre(f)}>{t}</button>)}
      </div>
      {vues.length === 0 && (
        <div className="encart-info"><span><strong>{liste.length ? "Aucune livraison ici." : "Aucune livraison pour le moment."}</strong>
          {!liste.length && <>En panne sèche ? <Link href="/depannage/carburant" className="lien-orange">Demander du carburant</Link></>}</span></div>
      )}
      {[...parJour].map(([jour, ls]) => (
        <section key={jour} className="formulaire" aria-label={jour}>
          <h2 className="titre-jour">{jour}</h2>
          {ls.map((l) => {
            const m = l.prixLitre != null && l.km != null && l.prixKm != null ? total({ prixLitre: l.prixLitre, km: l.km, prixKm: l.prixKm }, l.litres).total : null;
            return (
              <Link key={l.id} href={`/livraisons/${l.id}`} className="carte-livraison">
                <span className="carte-livraison-haut">
                  <Fuel size={30} color="var(--orange)" aria-hidden="true" />
                  <span className="separateur" />
                  <span><strong>{NOM_CARBURANT[l.carburant]} · {l.litres} L</strong><small>{resume(l)}</small><PastilleStatut s={l.statut} /></span>
                </span>
                {m != null && <LigneTotal montant={m} />}
                <span className="voir-detail">Voir le détail<ChevronRight size={18} aria-hidden="true" /></span>
              </Link>
            );
          })}
        </section>
      ))}
    </div>
  );
}
