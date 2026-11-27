"use client";
import { useState } from "react";
import { ArrowUpRight, Bike, Check, Fuel, MapPinned, Navigation } from "lucide-react";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { CarteLieu, DetailTarif, TitreSection } from "@/components/depannage/Elements";
import { NOM_CARBURANT, partagerWhatsApp, total, versParams, type Demande, type Etape, type Tarif } from "@/lib/depannage";
import { fcfa } from "@/lib/format";
import { useOrigine } from "@/lib/useOrigine";

const nb = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) && n >= 0 ? n : NaN; };

// Messages d'étape envoyés au client : son lien de suivi avance tout seul quand il l'ouvre
const ETAPES_LIVREUR: { e: Etape; libelle: string; texte: string; Icone: typeof Fuel }[] = [
  { e: "station", libelle: "Je suis à la station", texte: "Je suis à la station, je récupère votre carburant.", Icone: Fuel },
  { e: "route", libelle: "Je suis en route", texte: "Je suis en route vers vous.", Icone: Bike },
  { e: "livree", libelle: "Carburant livré", texte: "Votre carburant est livré. Merci de confirmer la réception.", Icone: Check },
];

export function ProposerTarif({ d, initial }: { d: Demande; initial?: Tarif }) {
  const origine = useOrigine();
  const [prix, setPrix] = useState(initial ? String(initial.prixLitre) : "");
  const [km, setKm] = useState(initial ? String(initial.km) : "");
  const [parKm, setParKm] = useState(initial ? String(initial.prixKm) : "");
  const t: Tarif = { prixLitre: nb(prix), km: nb(km), prixKm: nb(parKm) };
  const complet = prix !== "" && km !== "" && parKm !== "" && Object.values(t).every((v) => !Number.isNaN(v));
  const m = complet ? total(t, d.litres) : null;

  const lienTarif = complet ? `${origine}/livraisons/tarif?${versParams(d, t)}` : "";
  const proposition = m && origine ? partagerWhatsApp(
    `Bonjour, voici mon tarif pour votre livraison de carburant (demande ${d.id}) :\n`
    + `${NOM_CARBURANT[d.carburant]} ${d.litres} L : ${fcfa(m.carburant)} CFA\nDéplacement : ${fcfa(m.deplacement)} CFA\nTotal : ${fcfa(m.total)} CFA\n\n`
    + `Acceptez ou refusez ici : ${lienTarif}`) : undefined;
  const etape = (e: Etape, texte: string) => partagerWhatsApp(`${texte}\nSuivi de votre livraison : ${origine}/livraisons/${d.id}?e=${e}`);
  const carte = d.lat != null ? `https://www.google.com/maps?q=${d.lat},${d.lng}` : `https://www.google.com/maps/search/${encodeURIComponent(`${d.lieu} ${d.repere ?? ""}, Lomé`)}`;

  return (
    <div className="page formulaire">
      <CarteLieu d={d} />
      <a href={carte} target="_blank" rel="noopener" className="lien-position"><MapPinned size={20} aria-hidden="true" />Voir le lieu sur la carte<ArrowUpRight size={18} aria-hidden="true" /></a>

      <label className="champ-groupe">
        <span className="titre-form"><h2>Prix du carburant à la station</h2></span>
        <span className="champ-unite"><input className="champ" inputMode="decimal" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Prix affiché à la pompe" /><span>F CFA/L</span></span>
      </label>
      <label className="champ-groupe">
        <span className="titre-form"><h2>Distance aller-retour</h2></span>
        <span className="champ-unite"><input className="champ" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="Station ↔ client" /><span>km</span></span>
      </label>
      <label className="champ-groupe">
        <span className="titre-form"><h2>Tarif de déplacement</h2></span>
        <span className="champ-unite"><input className="champ" inputMode="decimal" value={parKm} onChange={(e) => setParKm(e.target.value)} placeholder="Votre prix au km" /><span>F CFA/km</span></span>
      </label>

      {complet ? <DetailTarif t={t} litres={d.litres} /> : <p className="aide">Remplissez les trois champs : le total se calcule tout seul.</p>}

      {proposition
        ? <a href={proposition} target="_blank" rel="noopener" className="bouton bouton-vert bouton-plein"><IconeWhatsApp taille={24} />Envoyer ma proposition</a>
        : <button type="button" className="bouton bouton-vert bouton-plein" disabled><IconeWhatsApp taille={24} />Envoyer ma proposition</button>}

      <section className="formulaire" aria-labelledby="t-suivi">
        <TitreSection id="t-suivi"><Navigation size={20} aria-hidden="true" />Tenir le client informé</TitreSection>
        <p className="aide">Une fois le tarif accepté, envoyez chaque étape : le suivi du client se met à jour.</p>
        <div className="etapes-livreur">
          {ETAPES_LIVREUR.map(({ e, libelle, texte, Icone }) => (
            <a key={e} href={etape(e, texte)} target="_blank" rel="noopener" className="bouton bouton-contour-vert"><Icone size={20} aria-hidden="true" />{libelle}</a>
          ))}
        </div>
      </section>
    </div>
  );
}
