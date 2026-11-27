import { MapPin } from "lucide-react";
import { fcfa } from "@/lib/format";
import { NOM_CARBURANT, LIBELLE_STATUT, resume, total, type Demande, type Statut, type Tarif } from "@/lib/depannage";

/** Pneu (pas d'icône pneu dans la bibliothèque) : jante et sculptures. */
export function IconePneu({ taille = 28 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </svg>
  );
}

/** Dépanneuse : camion et flèche de remorquage. */
export function IconeRemorque({ taille = 28 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 16V11l2.5-4H10v9" /><path d="M10 16h4.5" /><path d="M10 9h4l5-5" /><path d="M19 4v7.5a1.5 1.5 0 0 1-3 0" />
      <circle cx="6" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </svg>
  );
}

/** Carte « Agoè · Devant la pharmacie / Essence · 2 L » avec l'épingle orange. */
export function CarteLieu({ d, children }: { d: Demande; children?: React.ReactNode }) {
  return (
    <div className="carte-lieu">
      <div className="carte-lieu-haut">
        <MapPin size={28} fill="var(--orange)" color="var(--carte)" aria-hidden="true" />
        <span className="separateur" />
        <span><strong>{resume(d)}</strong><span>{NOM_CARBURANT[d.carburant]} · {d.litres} L</span></span>
      </div>
      {children}
    </div>
  );
}

export function LigneTotal({ montant }: { montant: number }) {
  return <p className="ligne-total"><span>Total</span><strong>{fcfa(montant)} CFA</strong></p>;
}

/** Détail carburant + déplacement + total. */
export function DetailTarif({ t, litres }: { t: Tarif; litres: number }) {
  const m = total(t, litres);
  return (
    <div className="detail-tarif">
      <p><span><strong>Carburant</strong><small>{litres} L × {fcfa(t.prixLitre)} CFA/L</small></span><b>{fcfa(m.carburant)} CFA</b></p>
      <p><span><strong>Déplacement</strong><small>{String(t.km).replace(".", ",")} km aller-retour × {fcfa(t.prixKm)} CFA/km</small></span><b>{fcfa(m.deplacement)} CFA</b></p>
      <p className="detail-tarif-total"><span>Total</span><b>{fcfa(m.total)} CFA</b></p>
    </div>
  );
}

export function PastilleStatut({ s }: { s: Statut }) {
  const { texte, ton } = LIBELLE_STATUT[s];
  return <span className={`pastille-statut pastille-${ton}`}>{texte}</span>;
}

/** Titre de section des formulaires : plus petit et moins gras que les titres de page. */
export function TitreSection({ children, id, action }: { children: React.ReactNode; id?: string; action?: React.ReactNode }) {
  return <div className="titre-form"><h2 id={id}>{children}</h2>{action}</div>;
}
