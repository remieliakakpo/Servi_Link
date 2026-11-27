"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CircleCheck, CircleDashed, Construction, ImagePlus, Search, Smartphone, Trash2, TriangleAlert, Undo2, X } from "lucide-react";
import { Vignette } from "@/components/fiche/Realisations";
import { TitreSection } from "@/components/depannage/Elements";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { ListeChoix } from "@/components/ListeChoix";
import { dateLongue, partagerWhatsApp } from "@/lib/depannage";
import { lienWhatsApp } from "@/lib/whatsapp";
import {
  ajouterRealisation, DUREE_MAX, dureeVideo, texteDuree, ETIQUETTES, modifierRealisation, MOTIFS_REFUS, supprimerRealisation,
  texteEtiquette, toutesRealisations, type Etiquette, type ProRattache, type Realisation, type StatutRealisation,
} from "@/lib/realisations";

export type ProChoix = ProRattache;
type Onglet = "ajouter" | StatutRealisation;

const ICONE_ETIQUETTE: Record<Etiquette, React.ComponentType<{ size?: number }>> = { avant: CircleDashed, en_cours: Construction, termine: CircleCheck };
const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Modération des réalisations (A22 et A23 réunis, première version) : l'équipe rattache à une fiche
 * les photos et vidéos reçues sur le WhatsApp de ServiLink, les vérifie, puis les publie ou les refuse.
 */
export function Moderation({ pros, proDepart }: { pros: ProChoix[]; proDepart?: string }) {
  const [onglet, setOnglet] = useState<Onglet>("ajouter");
  const [liste, setListe] = useState<Realisation[] | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; pro: ProChoix } | null>(null);
  const recharger = useCallback(() => toutesRealisations().then(setListe).catch(() => setListe([])), []);
  useEffect(() => { recharger(); }, [recharger]);

  const parStatut = (s: StatutRealisation) => (liste ?? []).filter((r) => r.statut === s);
  const ONGLETS: [Onglet, string, number | null][] = [
    ["ajouter", "Ajouter", null], ["a_verifier", "À vérifier", parStatut("a_verifier").length],
    ["en_ligne", "En ligne", parStatut("en_ligne").length], ["refusee", "Refusées", parStatut("refusee").length],
  ];

  return (
    <div className="page formulaire">
      <div className="onglets-filtre onglets-4" role="tablist" aria-label="Réalisations">
        {ONGLETS.map(([o, t, n]) => (
          <button key={o} type="button" role="tab" aria-selected={onglet === o} onClick={() => { setOnglet(o); setAnnonce(null); }}>
            {t}{n ? <span className="compte-onglet">{n}</span> : null}
          </button>
        ))}
      </div>

      {annonce && (
        <div className="encart-info encart-vert" role="status">
          <CircleCheck size={22} aria-hidden="true" />
          <span><strong>{annonce.texte}</strong>
            <span className="liens-annonce">
              <Link href={`/pro/${annonce.pro.id}#realisations`} className="lien-orange">Voir la fiche</Link>
              <a href={partagerWhatsApp(`Bonjour, vos photos et vidéos sont maintenant sur votre fiche ServiLink (${annonce.pro.nom}, réf. ${annonce.pro.reference}). Merci !`)}
                target="_blank" rel="noopener" className="lien-orange">Prévenir le pro sur WhatsApp</a>
            </span>
          </span>
        </div>
      )}

      {onglet === "ajouter" && (
        <Ajout pros={pros} proDepart={proDepart} fini={(texte, pro, statut) => { setAnnonce(statut === "en_ligne" ? { texte, pro } : null); recharger(); if (statut !== "en_ligne") setOnglet("a_verifier"); }} />
      )}
      {onglet !== "ajouter" && liste != null && (
        <File statut={onglet} items={parStatut(onglet)} pros={pros} maj={recharger} publie={(texte, pro) => { setAnnonce({ texte, pro }); recharger(); }} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Reçu par WhatsApp : ajout
type Fichier = { f: File; url: string; duree: number | null };

function Ajout({ pros, proDepart, fini }: { pros: ProChoix[]; proDepart?: string; fini: (texte: string, pro: ProChoix, s: StatutRealisation) => void }) {
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [pro, setPro] = useState<ProChoix | null>(pros.find((p) => p.id === proDepart) ?? null);
  const [etiquette, setEtiquette] = useState<Etiquette | null>(null);
  const [legende, setLegende] = useState("");
  const [etat, setEtat] = useState<"" | "envoi" | string>("");

  async function choisir(liste: FileList | null) {
    const nouveaux = await Promise.all([...(liste ?? [])].filter((f) => /^(image|video)\//.test(f.type))
      .map(async (f) => ({ f, url: URL.createObjectURL(f), duree: await dureeVideo(f) })));
    setFichiers((x) => [...x, ...nouveaux]);
  }
  const retirer = (k: number) => setFichiers((x) => { URL.revokeObjectURL(x[k].url); return x.filter((_, i) => i !== k); });

  async function envoyer(statut: StatutRealisation) {
    if (!pro || !fichiers.length) return;
    setEtat("envoi");
    try {
      for (const x of fichiers) await ajouterRealisation({ fichier: x.f, pro, etiquette, legende, statut });
      const n = fichiers.length;
      fichiers.forEach((x) => URL.revokeObjectURL(x.url));
      setFichiers([]); setLegende(""); setEtiquette(null); setEtat("");
      fini(`${n} ${n > 1 ? "médias publiés" : "média publié"} sur la fiche ${pro.nom}`, pro, statut);
    } catch {
      setEtat("L'envoi a échoué. Vérifiez la connexion (et, base branchée, que vous êtes connecté au back-office).");
    }
  }

  const longues = fichiers.filter((x) => x.duree != null && x.duree > DUREE_MAX).length;
  return (
    <>
      <p className="aide">Enregistrez dans le téléphone les photos et vidéos reçues sur le WhatsApp de ServiLink, puis ajoutez-les ici.</p>

      <div className="champ-groupe">
        <TitreSection>Photos et vidéos reçues</TitreSection>
        {fichiers.length > 0 && (
          <ul className="grille-realisations">
            {fichiers.map((x, k) => (
              <li key={x.url}>
                <Vignette m={{ id: x.url, type: x.f.type.startsWith("video/") ? "video" : "photo", url: x.url, etiquette, legende: null, publie_le: null, duree: x.duree }} />
                <button type="button" className="retirer-media" onClick={() => retirer(k)} aria-label={`Retirer ${x.f.name}`}><X size={16} aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        )}
        <label className="zone-depot">
          <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => { choisir(e.target.files); e.target.value = ""; }} />
          <ImagePlus size={28} aria-hidden="true" />
          <span><strong>{fichiers.length ? "Ajouter d'autres médias" : "Choisir dans le téléphone"}</strong><small>Photos ou vidéos de {texteDuree(DUREE_MAX)} au plus</small></span>
        </label>
        {longues > 0 && <p className="encart-info"><TriangleAlert size={20} aria-hidden="true" /><span>{longues > 1 ? `${longues} vidéos dépassent` : "Une vidéo dépasse"} {texteDuree(DUREE_MAX)}. Mieux vaut demander au pro une version plus courte.</span></p>}
      </div>

      <div className="champ-groupe">
        <TitreSection>Fiche du professionnel</TitreSection>
        <ChoixPro pros={pros} choisi={pro} onChoix={setPro} />
      </div>

      <div className="champ-groupe">
        <TitreSection id="t-etiquette">Étiquette <small className="facultatif">(facultatif)</small></TitreSection>
        <div className="etiquettes" role="radiogroup" aria-labelledby="t-etiquette">
          {ETIQUETTES.map(({ cle, texte }) => {
            const Icone = ICONE_ETIQUETTE[cle];
            return (
              <button key={cle} type="button" role="radio" aria-checked={etiquette === cle} className="etiquette-choix" onClick={() => setEtiquette(etiquette === cle ? null : cle)}>
                <Icone size={24} />{texte}
              </button>
            );
          })}
        </div>
      </div>

      <label className="champ-groupe">
        <TitreSection>Légende <small className="facultatif">(facultatif)</small></TitreSection>
        <input className="champ" value={legende} maxLength={120} onChange={(e) => setLegende(e.target.value)} placeholder="Ce que montre la vidéo, en quelques mots" />
      </label>

      {etat && etat !== "envoi" && <p className="encart-info encart-orange" role="alert"><span>{etat}</span></p>}
      <button type="button" className="bouton bouton-orange bouton-plein" disabled={!pro || !fichiers.length || etat === "envoi"} onClick={() => envoyer("en_ligne")}>
        {etat === "envoi" ? "Envoi…" : "Publier sur la fiche"}
      </button>
      <button type="button" className="bouton bouton-contour bouton-plein" disabled={!pro || !fichiers.length || etat === "envoi"} onClick={() => envoyer("a_verifier")}>
        Garder à vérifier
      </button>
      {(!pro || !fichiers.length) && <p className="aide centre">{!fichiers.length ? "Choisissez au moins une photo ou une vidéo." : "Choisissez la fiche du professionnel."}</p>}
    </>
  );
}

/** Recherche d'une fiche parmi les pros de l'annuaire (nom, métier, quartier ou référence). */
function ChoixPro({ pros, choisi, onChoix, depart = "" }: { pros: ProChoix[]; choisi: ProChoix | null; onChoix: (p: ProChoix | null) => void; depart?: string }) {
  const [q, setQ] = useState(depart);
  const trouves = useMemo(() => {
    const mots = sansAccents(q).split(/\s+/).filter(Boolean);
    if (!mots.length) return [];
    return pros.filter((p) => mots.every((m) => sansAccents(`${p.nom} ${p.metier} ${p.lieu} ${p.reference}`).includes(m))).slice(0, 6);
  }, [q, pros]);

  if (choisi) return (
    <div className="pro-choisi">
      <span><strong>{choisi.nom}</strong><small>{choisi.metier} · {choisi.lieu} · réf. {choisi.reference}</small></span>
      <button type="button" className="lien-souligne" onClick={() => { onChoix(null); setQ(""); }}>Changer</button>
    </div>
  );
  return (
    <div className="recherche-pro">
      <label className="champ champ-icone">
        <Search size={20} aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, métier, quartier ou réf." aria-label="Rechercher la fiche du professionnel" />
      </label>
      {q && (
        <ul className="resultats-pro" role="listbox" aria-label="Fiches trouvées">
          {trouves.map((p) => (
            <li key={p.id}><button type="button" role="option" aria-selected={false} onClick={() => onChoix(p)}>
              <strong>{p.nom}</strong><small>{p.metier} · {p.lieu} · {p.reference}</small>
            </button></li>
          ))}
          {!trouves.length && <li className="muet aucun">Aucune fiche trouvée.</li>}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- À vérifier, en ligne, refusées
function File({ statut, items, pros, maj, publie }: { statut: StatutRealisation; items: Realisation[]; pros: ProChoix[]; maj: () => void; publie: (t: string, p: ProChoix) => void }) {
  const vide = { a_verifier: "Rien à vérifier.", en_ligne: "Aucune réalisation en ligne pour l'instant.", refusee: "Aucune réalisation refusée." }[statut];
  if (!items.length) return <div className="encart-info"><span><strong>{vide}</strong>{statut === "a_verifier" && "Les publications faites depuis l'appli arrivent ici. Les médias reçus sur WhatsApp s'ajoutent dans l'onglet « Ajouter »."}</span></div>;
  return <ul className="file-moderation">{items.map((r) => <CarteModeration key={r.id} r={r} pros={pros} maj={maj} publie={publie} />)}</ul>;
}

function CarteModeration({ r, pros, maj, publie }: { r: Realisation; pros: ProChoix[]; maj: () => void; publie: (t: string, p: ProChoix) => void }) {
  const [mode, setMode] = useState<"" | "refus" | "fiche">("");
  const [motif, setMotif] = useState(MOTIFS_REFUS[0]);
  const pro = r.pro ? pros.find((p) => p.id === r.pro!.id) ?? r.pro : null;
  const nom = pro?.nom ?? r.envoyeur?.nom ?? "Fiche à choisir";
  const ecrireEnvoyeur = r.envoyeur?.telephone ? lienWhatsApp(r.envoyeur.telephone, "Bonjour, ici ServiLink. Nous avons bien reçu votre vidéo publiée depuis l'appli. ") : null;
  const action = async (f: () => Promise<void>) => { await f(); setMode(""); maj(); };

  return (
    <li className="carte-moderation">
      <div className="carte-moderation-haut">
        {r.type === "video"
          ? <video src={r.url} controls playsInline preload="metadata" />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={r.url} alt={r.legende ?? `Réalisation pour ${nom}`} />}
      </div>
      <div className="carte-moderation-corps">
        {r.source === "appli" && <p className="pastille-statut pastille-orange source-appli"><Smartphone size={14} aria-hidden="true" />Publié depuis l&apos;appli</p>}
        {r.envoyeur && (
          <p className="envoyeur"><span>Envoyé par <strong>{r.envoyeur.nom || "un pro"}</strong></span>
            <span>{r.envoyeur.telephone}{ecrireEnvoyeur && <a href={ecrireEnvoyeur} target="_blank" rel="noopener" className="lien-wa"><IconeWhatsApp taille={16} />Écrire</a>}</span></p>
        )}
        <p className="carte-moderation-pro"><strong>{pro ? pro.nom : "Aucune fiche rattachée"}</strong><small>{pro && `Réf. ${pro.reference}`}{r.etiquette && ` · ${texteEtiquette(r.etiquette)}`}{r.duree != null && ` · ${r.duree} s`}</small></p>
        {r.legende && <p>{r.legende}</p>}
        <p className="muet petit">{r.statut === "en_ligne" && r.publie_le ? `Publié le ${dateLongue(r.publie_le)}` : `Reçu le ${dateLongue(r.recu_le)}`}</p>
        {r.statut === "refusee" && r.motif && <p className="pastille-statut pastille-gris">Motif : {r.motif}</p>}
        {r.duree != null && r.duree > DUREE_MAX && r.statut === "a_verifier" && <p className="encart-info"><TriangleAlert size={18} aria-hidden="true" /><span>Vidéo de plus de {texteDuree(DUREE_MAX)}</span></p>}

        {mode === "refus" && (
          <div className="champ-groupe">
            <TitreSection>Motif du refus</TitreSection>
            <ListeChoix className="champ selecteur" options={MOTIFS_REFUS.map((m) => ({ value: m, label: m }))} valeur={motif} onChoix={setMotif} aria-label="Motif du refus" />
            <button type="button" className="bouton bouton-orange" onClick={() => action(() => modifierRealisation(r.id, { statut: "refusee", motif }))}>Confirmer le refus</button>
            <button type="button" className="lien-simple" onClick={() => setMode("")}>Annuler</button>
          </div>
        )}
        {(mode === "fiche" || (!pro && !mode && r.statut === "a_verifier")) && (
          <div className="champ-groupe">
            <TitreSection>{pro ? "Rattacher à une autre fiche" : "Rattacher à la fiche du pro"}</TitreSection>
            <ChoixPro pros={pros} choisi={null} depart={pro ? "" : r.envoyeur?.nom ?? ""} onChoix={(p) => p && action(() => modifierRealisation(r.id, { pro: p }))} />
            {mode === "fiche" && <button type="button" className="lien-simple" onClick={() => setMode("")}>Annuler</button>}
          </div>
        )}

        {!mode && (
          <div className="actions-moderation">
            {r.statut !== "en_ligne" && pro && (
              <button type="button" className="bouton bouton-vert" onClick={async () => { await modifierRealisation(r.id, { statut: "en_ligne" }); publie(`Publié sur la fiche ${pro.nom}`, pro); }}>
                <Check size={20} aria-hidden="true" />Publier
              </button>
            )}
            {r.statut === "a_verifier" && <button type="button" className="bouton bouton-contour" onClick={() => setMode("refus")}><X size={20} aria-hidden="true" />Refuser</button>}
            {r.statut === "en_ligne" && <>
              <Link href={`/pro/${pro?.id}#realisations`} className="bouton bouton-contour-vert">Voir la fiche</Link>
              <button type="button" className="bouton bouton-contour" onClick={() => action(() => modifierRealisation(r.id, { statut: "a_verifier" }))}><Undo2 size={20} aria-hidden="true" />Retirer</button>
            </>}
            {r.statut !== "en_ligne" && pro && <button type="button" className="lien-simple lien-souligne" onClick={() => setMode("fiche")}>Changer de fiche</button>}
            {r.statut === "refusee" && <>
              <a className="lien-simple lien-souligne lien-wa" target="_blank" rel="noopener"
                href={r.envoyeur?.telephone ? lienWhatsApp(r.envoyeur.telephone, `Bonjour, merci pour votre envoi. Nous ne pouvons pas publier ce média sur ServiLink : ${r.motif ?? "voir avec l'équipe"}. Vous pouvez en publier un autre.`) ?? "#" : partagerWhatsApp(`Bonjour, merci pour votre envoi. Nous ne pouvons pas publier ce média sur votre fiche ServiLink (${nom}) : ${r.motif ?? "voir avec l'équipe"}. Vous pouvez nous en envoyer un autre.`)}>
                <IconeWhatsApp taille={18} />Prévenir le pro
              </a>
              <button type="button" className="lien-simple lien-rouge" onClick={() => confirm("Supprimer définitivement ce média ?") && action(() => supprimerRealisation(r))}>
                <Trash2 size={18} aria-hidden="true" />Supprimer
              </button>
            </>}
          </div>
        )}
      </div>
    </li>
  );
}
