"use client";
import { useMemo, useState } from "react";
import { CalendarClock, MapPin, Phone, Wrench } from "lucide-react";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { TitreSection } from "@/components/depannage/Elements";
import { CarteFiche } from "@/app/espace/pro/Ecrans";
import { decoderFiche, libelleService, numeroWa, resumeHoraires } from "@/lib/fichePro";
import { lienWhatsApp } from "@/lib/whatsapp";
import { useOrigine } from "@/lib/useOrigine";

/** L'équipe ouvre la fiche reçue sur WhatsApp, répond « conforme » ou « correction », et renvoie le lien au pro. */
export function ExamenFiche({ code }: { code?: string }) {
  const f = useMemo(() => decoderFiche(code), [code]);
  const origine = useOrigine();
  const [decision, setDecision] = useState<"conforme" | "correction">("correction");
  const [precisions, setPrecisions] = useState("");
  if (!f) return <p className="alerte page">Ouvrez cette page avec le lien de fiche reçu sur WhatsApp.</p>;

  const lignes = [
    { Icone: Wrench, titre: "Services", texte: f.services.map(libelleService).join(" · ") },
    { Icone: MapPin, titre: "Quartiers", texte: f.quartiers.join(" · ") },
    { Icone: Phone, titre: "Contacts", texte: [f.appel && f.telephone && `Appel +228 ${f.telephone}`, f.whatsapp && numeroWa(f) && `WhatsApp +228 ${numeroWa(f)}`].filter(Boolean).join(" · ") },
    { Icone: CalendarClock, titre: "Horaires", texte: resumeHoraires(f.horaires) },
    { Icone: MapPin, titre: "Atelier", texte: [f.quartier, f.repere, f.surPlace === true ? "accueil sur place" : f.surPlace === false ? "pas d'accueil sur place" : null, f.lat != null ? "position GPS fournie" : null].filter(Boolean).join(" · ") },
  ];
  const peutEnvoyer = decision === "conforme" || precisions.trim().length > 0;
  const lienReponse = origine
    ? `${origine}/espace/pro/reponse?s=${decision}${decision === "correction" ? `&m=${encodeURIComponent(precisions.trim())}` : ""}` : "";
  const texte = decision === "conforme"
    ? `Bonjour, votre fiche « ${f.nom} » est conforme. Merci !\n${lienReponse}`
    : `Bonjour, votre fiche « ${f.nom} » demande une correction : ${precisions.trim()}\nVoir et corriger : ${lienReponse}`;
  const wa = lienWhatsApp(numeroWa(f) || f.telephone, texte);

  return (
    <div className="page formulaire">
      <CarteFiche f={f} />
      <div className="carte-recap">
        {lignes.map(({ Icone, titre, texte }) => (
          <p key={titre}><Icone size={24} aria-hidden="true" /><span><strong>{titre}</strong><small>{texte || "Non renseigné"}</small></span></p>
        ))}
      </div>
      <TitreSection id="t-reponse">Réponse au prestataire</TitreSection>
      <div role="radiogroup" aria-labelledby="t-reponse" className="choix-liste">
        {([["conforme", "Fiche conforme"], ["correction", "Correction demandée"]] as const).map(([v, t]) => (
          <button key={v} type="button" role="radio" aria-checked={decision === v} className="choix choix-compact" onClick={() => setDecision(v)}>
            <span className="radio" aria-hidden="true" /><span className="choix-texte"><strong>{t}</strong></span>
          </button>
        ))}
      </div>
      {decision === "correction" && (
        <label className="champ-groupe">
          <span className="titre-form"><h2>Précisions</h2></span>
          <textarea className="champ zone-texte" rows={3} maxLength={400} value={precisions} onChange={(e) => setPrecisions(e.target.value)} placeholder="Ex. précisez le point de repère de votre atelier." />
        </label>
      )}
      {wa && peutEnvoyer && origine
        ? <a href={wa} target="_blank" rel="noopener" className="bouton bouton-vert bouton-plein"><IconeWhatsApp taille={24} />Envoyer la réponse</a>
        : <button type="button" className="bouton bouton-vert bouton-plein" disabled><IconeWhatsApp taille={24} />Envoyer la réponse</button>}
      {!wa && <p className="alerte">Le prestataire n&apos;a pas donné de numéro.</p>}
    </div>
  );
}
