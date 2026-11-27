"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Camera, CalendarClock, Images, Check, ChevronRight, Clock, Eye, Fuel, LocateFixed, MapPin, Phone, Send, Wrench } from "lucide-react";
import { IconePneu, IconeRemorque, TitreSection } from "@/components/depannage/Elements";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { ListeChoix } from "@/components/ListeChoix";
import {
  CRENEAUX, ecrireFiche, encoderFiche, FICHE_VIDE, heure, resumeHoraires, initiales, JOURS, libelleService, lireFiche, manques, numeroWa, SERVICES,
  type FichePro, type Service,
} from "@/lib/fichePro";
import { demanderPosition, MESSAGES_POSITION, type ErreurPosition } from "@/lib/position";
import { lienWhatsApp, NUMERO_CONTACT_TEMPORAIRE } from "@/lib/whatsapp";
import { messageEnvoiRealisations } from "@/lib/realisations";

export const ICONES_SERVICE: Record<Service, React.ReactNode> = {
  carburant: <Fuel size={26} aria-hidden="true" />, pneus: <IconePneu taille={26} />,
  mecanique: <Wrench size={26} aria-hidden="true" />, remorquage: <IconeRemorque taille={26} />,
};

/** Fiche du téléphone : lue après le premier rendu (localStorage), enregistrée à la demande. */
function useFiche() {
  const [f, setF] = useState<FichePro | null>(null);
  useEffect(() => setF(lireFiche()), []);
  const enregistrer = (g: FichePro) => { const h = { ...g, statut: g.statut === "conforme" || g.statut === "envoyee" ? "brouillon" as const : g.statut }; ecrireFiche(h); setF(h); };
  return [f, setF, enregistrer] as const;
}

function Interrupteur({ actif, onChange, label }: { actif: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={actif} aria-label={label} className="interrupteur" onClick={() => onChange(!actif)}><span /></button>;
}

function Puces({ items, ton = "orange" }: { items: string[]; ton?: "orange" | "vert" }) {
  return items.length ? <ul className={`puces-info puces-${ton}`}>{items.map((i) => <li key={i}>{i}</li>)}</ul> : <p className="aide">Rien pour l&apos;instant.</p>;
}

function Chargement() { return <div className="page" />; }

// ---------------------------------------------------------------- Ma fiche
export function MaFiche() {
  const router = useRouter();
  const [f, setF, enregistrer] = useFiche();
  const [ok, setOk] = useState(false);
  if (!f) return <Chargement />;
  const ouverts = f.horaires.filter((h) => h.ouvert).length;
  const sections = [
    { href: "/espace/pro/contacts", titre: "Contacts", detail: [f.appel && "Appel", f.whatsapp && "WhatsApp"].filter(Boolean).join(" · ") || "À compléter", Icone: Phone },
    { href: "/espace/pro/horaires", titre: "Horaires", detail: ouverts ? `${ouverts} jour${ouverts > 1 ? "s" : ""} par semaine` : "À compléter", Icone: Clock },
    { href: "/espace/pro/localisation", titre: "Localisation", detail: f.quartier ? [f.quartier, f.repere].filter(Boolean).join(" · ") : "À compléter", Icone: MapPin },
    { href: "/espace/pro/disponibilite", titre: "Disponibilité", detail: f.disponible ? "Disponible" : "Indisponible", Icone: CalendarClock },
    { href: "/espace/pro/realisations", titre: "Mes réalisations", detail: "Publier dans la Vitrine", Icone: Images },
  ];

  return (
    <form className="page formulaire" onSubmit={(e) => { e.preventDefault(); enregistrer(f); setOk(true); }}>
      {f.statut === "correction" && <Link href="/espace/pro/reponse" className="encart-info encart-orange"><span><strong>Correction demandée</strong>{f.correction}</span><ChevronRight size={20} aria-hidden="true" /></Link>}
      {f.statut === "envoyee" && <p className="encart-info"><span><strong>Fiche envoyée</strong>L&apos;équipe ServiLink la vérifie et vous répond sur WhatsApp.</span></p>}
      {f.statut === "conforme" && <p className="encart-info encart-vert"><span><strong>Fiche validée</strong>Votre fiche est conforme.</span></p>}

      <label className="champ-groupe">
        <span className="titre-form"><h2>Nom de l&apos;activité</h2></span>
        <input className="champ" value={f.nom} maxLength={80} onChange={(e) => { setF({ ...f, nom: e.target.value }); setOk(false); }} placeholder="Ex. nom de votre atelier ou de votre service" />
      </label>
      <label className="champ-groupe">
        <span className="titre-form"><h2>Présentation</h2></span>
        <textarea className="champ zone-texte" rows={3} maxLength={300} value={f.presentation} onChange={(e) => { setF({ ...f, presentation: e.target.value }); setOk(false); }}
          placeholder="Ce que vous faites, où vous intervenez." />
      </label>
      <div className="champ-groupe">
        <TitreSection action={<Link href="/espace/pro/services" className="lien-souligne">Modifier</Link>}>Services proposés</TitreSection>
        <Puces items={f.services.map(libelleService)} />
      </div>
      <div className="champ-groupe">
        <TitreSection action={<Link href="/espace/pro/disponibilite" className="lien-souligne">Modifier</Link>}>Quartiers d&apos;intervention</TitreSection>
        <Puces items={f.quartiers} ton="vert" />
      </div>

      <ul className="liste-sections">
        {sections.map(({ href, titre, detail, Icone }) => (
          <li key={href}><Link href={href}><Icone size={22} aria-hidden="true" /><span><strong>{titre}</strong><small>{detail}</small></span><ChevronRight size={20} aria-hidden="true" /></Link></li>
        ))}
      </ul>

      <button type="submit" className="bouton bouton-orange bouton-plein">{ok ? <><Check size={22} aria-hidden="true" />Fiche enregistrée</> : "Enregistrer ma fiche"}</button>
      <div className="duo-liens">
        <button type="button" className="bouton bouton-contour-vert" onClick={() => { enregistrer(f); router.push("/espace/pro/apercu"); }}><Eye size={20} aria-hidden="true" />Aperçu</button>
        <button type="button" className="bouton bouton-contour-vert" onClick={() => { enregistrer(f); router.push("/espace/pro/verifier"); }}><Send size={20} aria-hidden="true" />Valider</button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- Mes services
export function MesServices() {
  const router = useRouter();
  const [f, setF, enregistrer] = useFiche();
  if (!f) return <Chargement />;
  const basculer = (s: Service) => setF({ ...f, services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s] });
  return (
    <form className="page formulaire" onSubmit={(e) => { e.preventDefault(); enregistrer(f); router.push("/espace/pro"); }}>
      <p className="aide">Sélectionnez les interventions que vous proposez.</p>
      <div className="choix-liste">
        {SERVICES.map(({ cle, libelle }) => (
          <label key={cle} className="choix">
            <span className="choix-icone">{ICONES_SERVICE[cle]}</span>
            <span className="choix-texte"><strong>{libelle}</strong></span>
            <input type="checkbox" className="coche" checked={f.services.includes(cle)} onChange={() => basculer(cle)} />
          </label>
        ))}
      </div>
      <button type="submit" className="bouton bouton-orange bouton-plein">Enregistrer</button>
    </form>
  );
}

// ---------------------------------------------------------------- Ma disponibilité (et quartiers)
export function MaDisponibilite({ quartiers }: { quartiers: string[] }) {
  const router = useRouter();
  const [f, setF, enregistrer] = useFiche();
  if (!f) return <Chargement />;
  const basculer = (q: string) => setF({ ...f, quartiers: f.quartiers.includes(q) ? f.quartiers.filter((x) => x !== q) : [...f.quartiers, q] });
  return (
    <form className="page formulaire" onSubmit={(e) => { e.preventDefault(); enregistrer(f); router.push("/espace/pro"); }}>
      <TitreSection id="t-dispo">Disponibilité</TitreSection>
      <div role="radiogroup" aria-labelledby="t-dispo" className="choix-liste">
        {([[true, "Disponible", "Je peux recevoir des demandes."], [false, "Indisponible", "Je suspends les nouvelles demandes."]] as const).map(([v, t, d]) => (
          <button key={t} type="button" role="radio" aria-checked={f.disponible === v} className="choix" onClick={() => setF({ ...f, disponible: v })}>
            <span className={`radio${v ? " radio-vert" : ""}`} aria-hidden="true" />
            <span className="choix-texte"><strong>{t}</strong><small>{d}</small></span>
          </button>
        ))}
      </div>
      <TitreSection id="t-quartiers">Quartiers d&apos;intervention</TitreSection>
      <div className="grille-cases" role="group" aria-labelledby="t-quartiers">
        {quartiers.map((q) => (
          <label key={q} className="case-cadre"><input type="checkbox" className="coche" checked={f.quartiers.includes(q)} onChange={() => basculer(q)} />{q}</label>
        ))}
      </div>
      <button type="submit" className="bouton bouton-orange bouton-plein">Enregistrer</button>
    </form>
  );
}

// ---------------------------------------------------------------- Contacts
export function MesContacts() {
  const router = useRouter();
  const [f, setF, enregistrer] = useFiche();
  if (!f) return <Chargement />;
  const valide = (n: string) => n.replace(/\D/g, "").replace(/^228/, "").length === 8;
  const erreur = (f.appel && f.telephone && !valide(f.telephone)) || (f.whatsapp && !f.memeNumero && f.numeroWhatsapp && !valide(f.numeroWhatsapp));
  return (
    <form className="page formulaire" onSubmit={(e) => { e.preventDefault(); if (!erreur) { enregistrer(f); router.push("/espace/pro"); } }}>
      <p className="aide">Choisissez comment les clients peuvent vous joindre.</p>
      <div className="bloc-contact">
        <div className="bloc-contact-tete"><Phone size={24} color="var(--orange)" aria-hidden="true" /><strong>Appel téléphonique</strong>
          <Interrupteur actif={f.appel} onChange={(v) => setF({ ...f, appel: v })} label="Accepter les appels" /></div>
        {f.appel && (
          <label className="champ-groupe"><span className="titre-form"><h2>Numéro professionnel</h2></span>
            <span className="champ-indicatif"><span>🇹🇬 +228</span><input className="champ" inputMode="tel" autoComplete="tel-national" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} placeholder="90 00 00 00" /></span>
          </label>
        )}
      </div>
      <div className="bloc-contact">
        <div className="bloc-contact-tete"><span style={{ color: "var(--vert-ok)", display: "flex" }}><IconeWhatsApp taille={24} /></span><strong>WhatsApp</strong>
          <Interrupteur actif={f.whatsapp} onChange={(v) => setF({ ...f, whatsapp: v })} label="Accepter WhatsApp" /></div>
        {f.whatsapp && (<>
          {f.appel && <label className="case"><input type="checkbox" className="coche" checked={f.memeNumero} onChange={(e) => setF({ ...f, memeNumero: e.target.checked })} />Utiliser le même numéro</label>}
          {(!f.appel || !f.memeNumero) && (
            <label className="champ-groupe"><span className="titre-form"><h2>Numéro WhatsApp</h2></span>
              <span className="champ-indicatif"><span>🇹🇬 +228</span><input className="champ" inputMode="tel" value={f.numeroWhatsapp} onChange={(e) => setF({ ...f, numeroWhatsapp: e.target.value, memeNumero: false })} placeholder="90 00 00 00" /></span>
            </label>
          )}
        </>)}
      </div>
      {erreur && <p className="alerte" role="alert">Un numéro togolais a 8 chiffres, par exemple 90 00 00 00.</p>}
      <button type="submit" className="bouton bouton-orange bouton-plein">Enregistrer les contacts</button>
    </form>
  );
}

// ---------------------------------------------------------------- Horaires
const CHOIX_HEURE = CRENEAUX.map((c) => ({ value: c, label: heure(c) }));
export function MesHoraires() {
  const router = useRouter();
  const [f, setF, enregistrer] = useFiche();
  if (!f) return <Chargement />;
  const maj = (i: number, h: Partial<FichePro["horaires"][number]>) => setF({ ...f, horaires: f.horaires.map((x, k) => (k === i ? { ...x, ...h } : x)) });
  const copierLundi = () => setF({ ...f, horaires: f.horaires.map((x, k) => (k > 0 && k < 5 && x.ouvert ? { ...x, de: f.horaires[0].de, a: f.horaires[0].a } : x)) });
  return (
    <form className="page formulaire" onSubmit={(e) => { e.preventDefault(); enregistrer(f); router.push("/espace/pro"); }}>
      <div className="horaires">
        <div className="horaires-tete" aria-hidden="true"><span>Jour</span><span>Ouverture</span><span>Fermeture</span></div>
        {JOURS.map((j, i) => {
          const h = f.horaires[i];
          return (
            <div key={j} className="horaire">
              <label className="case"><input type="checkbox" className="coche" checked={h.ouvert} onChange={(e) => maj(i, { ouvert: e.target.checked })} /><span className="jour-long">{j}</span><span className="jour-court" aria-hidden="true">{j.slice(0, 3)}.</span></label>
              {h.ouvert ? (<>
                <ListeChoix className="champ champ-heure" options={CHOIX_HEURE} valeur={h.de} onChoix={(v) => maj(i, { de: v })} aria-label={`${j}, ouverture`} />
                <ListeChoix className="champ champ-heure" options={CHOIX_HEURE} valeur={h.a} onChoix={(v) => maj(i, { a: v })} aria-label={`${j}, fermeture`} />
              </>) : <span className="ferme">Fermé</span>}
            </div>
          );
        })}
      </div>
      <button type="button" className="lien-simple lien-souligne" onClick={copierLundi}>Copier lundi sur mardi à vendredi</button>
      <button type="submit" className="bouton bouton-orange bouton-plein">Enregistrer les horaires</button>
    </form>
  );
}

// ---------------------------------------------------------------- Localisation
export function MonLieu({ quartiers }: { quartiers: string[] }) {
  const router = useRouter();
  const [f, setF, enregistrer] = useFiche();
  const [etat, setEtat] = useState<"" | "recherche" | ErreurPosition>("");
  if (!f) return <Chargement />;
  async function localiser() {
    setEtat("recherche");
    try { const p = await demanderPosition(); setF({ ...f!, lat: p.lat, lng: p.lng }); setEtat(""); } catch (e) { setEtat(e as ErreurPosition); }
  }
  const carte = f.lat != null ? `https://www.google.com/maps?q=${f.lat},${f.lng}` : f.quartier ? `https://www.google.com/maps/search/${encodeURIComponent(`${f.repere} ${f.quartier}, Lomé`)}` : null;
  return (
    <form className="page formulaire" onSubmit={(e) => { e.preventDefault(); enregistrer(f); router.push("/espace/pro"); }}>
      <TitreSection id="t-place">Les clients peuvent-ils venir sur place ?</TitreSection>
      <div className="radios-ligne" role="radiogroup" aria-labelledby="t-place">
        {([[true, "Oui"], [false, "Non"]] as const).map(([v, t]) => (
          <button key={t} type="button" role="radio" aria-checked={f.surPlace === v} onClick={() => setF({ ...f, surPlace: v })}><span className="radio" aria-hidden="true" />{t}</button>
        ))}
      </div>
      <div className="champ-groupe">
        <TitreSection>Quartier</TitreSection>
        <ListeChoix className="selecteur" valeur={f.quartier} onChoix={(v) => setF({ ...f, quartier: v })} aria-label="Quartier"
          options={[{ value: "", label: "Choisir un quartier" }, ...quartiers.map((q) => ({ value: q, label: q }))]} />
      </div>
      <label className="champ-groupe">
        <span className="titre-form"><h2>Point de repère</h2></span>
        <input className="champ" value={f.repere} maxLength={120} onChange={(e) => setF({ ...f, repere: e.target.value })} placeholder="Ex. près du marché" />
      </label>
      <div className="champ-groupe">
        <TitreSection>Position sur la carte</TitreSection>
        <button type="button" className="bouton bouton-contour-orange bouton-plein" onClick={localiser} disabled={etat === "recherche"}>
          <LocateFixed size={22} aria-hidden="true" />{etat === "recherche" ? "Recherche de votre position…" : f.lat != null ? "Position enregistrée · mettre à jour" : "Utiliser ma position actuelle"}
        </button>
        {etat && etat !== "recherche" && <p className="alerte" role="status">{MESSAGES_POSITION[etat]}</p>}
        {carte && <a href={carte} target="_blank" rel="noopener" className="lien-simple lien-souligne">Voir le lieu sur la carte <ArrowUpRight size={18} aria-hidden="true" /></a>}
      </div>
      <button type="submit" className="bouton bouton-orange bouton-plein">Enregistrer le lieu</button>
    </form>
  );
}

// ---------------------------------------------------------------- Aperçu
export function CarteFiche({ f }: { f: FichePro }) {
  return (
    <div className="carte-fiche">
      <div className="carte-fiche-tete">
        <span className="monogramme" aria-hidden="true">{initiales(f.nom)}</span>
        <span><strong>{f.nom || "Nom de l'activité"}</strong>
          <span className={`pastille-statut ${f.disponible ? "pastille-vert" : "pastille-gris"}`}>{f.disponible ? "Disponible" : "Indisponible"}</span></span>
      </div>
      {f.presentation && <p>{f.presentation}</p>}
    </div>
  );
}

export function ApercuFiche() {
  const [f] = useFiche();
  if (!f) return <Chargement />;
  const ouverts = resumeHoraires(f.horaires);
  return (
    <div className="page formulaire">
      <p className="aide">Voici ce que les clients verront.</p>
      <CarteFiche f={f} />
      <TitreSection>Services proposés</TitreSection>
      {f.services.length ? <ul className="liste-services">{f.services.map((s) => <li key={s}>{ICONES_SERVICE[s]}{libelleService(s)}</li>)}</ul> : <p className="aide">Aucun service choisi.</p>}
      <TitreSection>Quartiers d&apos;intervention</TitreSection>
      <Puces items={f.quartiers} ton="vert" />
      {ouverts && (<><TitreSection>Horaires</TitreSection><p className="aide">{ouverts}</p></>)}
      {f.quartier && (<><TitreSection>Atelier</TitreSection><p className="aide">{[f.quartier, f.repere].filter(Boolean).join(" · ")}{f.surPlace === false && " · pas d'accueil sur place"}</p></>)}
      <Link href="/espace/pro" className="bouton bouton-orange bouton-plein">Modifier ma fiche</Link>
    </div>
  );
}

// ---------------------------------------------------------------- Vérifier et envoyer pour validation
export function VerifierFiche() {
  const [f, , enregistrer] = useFiche();
  const [envoye, setEnvoye] = useState(false);
  if (!f) return <Chargement />;
  const manque = manques(f);
  const lignes = [
    { Icone: Wrench, titre: "Services", texte: f.services.map(libelleService).join(" · ") },
    { Icone: MapPin, titre: "Quartiers", texte: f.quartiers.join(" · ") },
    { Icone: Phone, titre: "Contacts", texte: [f.appel && f.telephone && `Appel +228 ${f.telephone}`, f.whatsapp && numeroWa(f) && `WhatsApp +228 ${numeroWa(f)}`].filter(Boolean).join(" · ") },
  ];
  function envoyer() {
    const lien = `${window.location.origin}/admin/examen?f=${encoderFiche(f!)}`;
    const wa = lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE, `Bonjour ServiLink, je demande la validation de ma fiche « ${f!.nom} ».\nFiche à examiner : ${lien}`);
    ecrireFiche({ ...f!, statut: "envoyee" });
    setEnvoye(true);
    if (wa) window.open(wa, "_blank", "noopener");
  }
  return (
    <div className="page formulaire">
      <div className="carte-recap">
        <h2>{f.nom || "Nom de l'activité"}</h2>
        {lignes.map(({ Icone, titre, texte }) => (
          <p key={titre}><Icone size={24} aria-hidden="true" /><span><strong>{titre}</strong><small>{texte || "À compléter"}</small></span></p>
        ))}
      </div>
      {manque.length > 0
        ? <p className="encart-info encart-orange"><span><strong>Il manque {manque.join(", ")}.</strong>Complétez votre fiche avant de l&apos;envoyer.</span></p>
        : envoye
          ? <p className="encart-info encart-vert"><span><strong>Fiche envoyée</strong>L&apos;équipe ServiLink vous répond sur WhatsApp.</span></p>
          : <p className="encart-info encart-vert"><span><strong>Votre fiche est prête.</strong>Elle sera envoyée à l&apos;équipe ServiLink sur WhatsApp.</span></p>}
      <button type="button" className="bouton bouton-vert bouton-plein" onClick={envoyer} disabled={manque.length > 0}><IconeWhatsApp taille={24} />Envoyer pour validation</button>
      <Link href="/espace/pro" className="lien-simple lien-souligne" onClick={() => enregistrer(f)}>Modifier ma fiche</Link>
    </div>
  );
}

// ---------------------------------------------------------------- Réponse de l'équipe
export function ReponseDemande({ statut, message }: { statut?: string; message?: string }) {
  const [f, setF] = useState<FichePro | null>(null);
  useEffect(() => {
    const g = lireFiche();
    // Le lien de réponse de l'équipe met la fiche à jour sur le téléphone du pro
    if (statut === "correction" || statut === "conforme") {
      const h = { ...g, statut, correction: statut === "correction" ? message?.slice(0, 400) : undefined } as FichePro;
      ecrireFiche(h); setF(h);
    } else setF(g);
  }, [statut, message]);
  if (!f) return <Chargement />;
  if (f.statut !== "correction" && f.statut !== "conforme") return (
    <div className="page formulaire">
      <p className="encart-info"><span><strong>Pas encore de réponse</strong>L&apos;équipe ServiLink vous répond sur WhatsApp après l&apos;examen de votre fiche.</span></p>
      <Link href="/espace/pro" className="bouton bouton-orange bouton-plein">Ma fiche</Link>
    </div>
  );
  const correction = f.statut === "correction";
  return (
    <div className="page formulaire">
      <span className={`pastille-statut ${correction ? "pastille-orange" : "pastille-vert"}`}>{correction ? "Correction demandée" : "Fiche conforme"}</span>
      <div className="carte-recap">
        <h2>{f.nom || FICHE_VIDE.nom}</h2>
        {correction ? <p><span><strong>Modification à apporter</strong><small>{f.correction || "Voir le message de l'équipe."}</small></span></p>
          : <p><span><small>Votre fiche a été validée par l&apos;équipe ServiLink.</small></span></p>}
      </div>
      {correction && <p className="aide">Après la modification, envoyez à nouveau votre fiche pour validation.</p>}
      <Link href="/espace/pro" className="bouton bouton-orange bouton-plein">{correction ? "Modifier ma fiche" : "Voir ma fiche"}</Link>
    </div>
  );
}

// ---------------------------------------------------------------- Mes réalisations
export function MesRealisations() {
  const [f] = useFiche();
  const lien = lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE ?? "+228 90 00 08 37", messageEnvoiRealisations(f?.nom || undefined));
  return (
    <div className="page formulaire">
      <p className="aide">Montrez votre travail dans la Vitrine : une courte vidéo ou une photo, sans rien écrire. ServiLink vérifie avant de publier.</p>
      <Link href="/vitrine/publier" className="bouton vitrine-bouton bouton-plein"><Camera size={24} aria-hidden="true" />Publier une vidéo ou une photo</Link>
      <Link href="/vitrine/mes-publications" className="bouton bouton-contour-vert bouton-plein"><Images size={22} aria-hidden="true" />Mes publications</Link>
      {lien && <a href={lien} target="_blank" rel="noopener" className="lien-simple lien-souligne"><IconeWhatsApp taille={20} />Ou envoyer sur WhatsApp</a>}
    </div>
  );
}
