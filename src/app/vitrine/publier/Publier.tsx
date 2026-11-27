"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, CircleCheck, CircleDashed, Construction, ImagePlus, LoaderCircle, RotateCcw, Send, Video } from "lucide-react";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { lireFiche, numeroWa } from "@/lib/fichePro";
import { DUREE_MAX, dureeVideo, texteDuree, ETIQUETTES, messageEnvoiRealisations, publierDepuisAppli, type Envoyeur, type Etiquette } from "@/lib/realisations";
import { lienWhatsApp, NUMERO_CONTACT_TEMPORAIRE } from "@/lib/whatsapp";

const CLE_MOI = "slk-vitrine-moi";
const ICONES: Record<Etiquette, React.ComponentType<{ size?: number; strokeWidth?: number }>> = { avant: CircleDashed, en_cours: Construction, termine: CircleCheck };

function lireMoi(): Envoyeur {
  try {
    const m = JSON.parse(localStorage.getItem(CLE_MOI) ?? "null") as Envoyeur | null;
    if (m?.telephone) return m;
    const f = lireFiche();
    return { nom: f.nom, telephone: numeroWa(f) || f.telephone };
  } catch { return { nom: "", telephone: "" }; }
}

/**
 * Publier depuis le téléphone, sans rien écrire d'obligatoire : filmer (ou photo), dire si c'est
 * avant, pendant ou après (facultatif), envoyer. ServiLink vérifie avant de publier.
 */
export function Publier() {
  const [media, setMedia] = useState<{ f: File; url: string; duree: number | null } | null>(null);
  const [etiquette, setEtiquette] = useState<Etiquette | null>(null);
  const [moi, setMoi] = useState<Envoyeur>({ nom: "", telephone: "" });
  const [editer, setEditer] = useState(false);
  const [etat, setEtat] = useState<"" | "envoi" | "fini" | "connexion" | "erreur">("");
  useEffect(() => { const m = lireMoi(); setMoi(m); setEditer(!m.telephone); }, []);

  async function choisir(liste: FileList | null) {
    const f = liste?.[0];
    if (!f || !/^(image|video)\//.test(f.type)) return;
    if (media) URL.revokeObjectURL(media.url);
    setMedia({ f, url: URL.createObjectURL(f), duree: await dureeVideo(f) });
    setEtat("");
  }
  function recommencer() { if (media) URL.revokeObjectURL(media.url); setMedia(null); setEtiquette(null); setEtat(""); }

  const chiffres = moi.telephone.replace(/\D/g, "");
  const numeroOk = chiffres.length === 8 || (chiffres.length === 11 && chiffres.startsWith("228"));
  async function envoyer() {
    if (!media || !numeroOk) { setEditer(true); return; }
    setEtat("envoi");
    try {
      const envoyeur = { nom: moi.nom.trim(), telephone: chiffres.length === 8 ? `+228 ${chiffres.replace(/(\d{2})(?=\d)/g, "$1 ")}` : `+${chiffres}` };
      try { localStorage.setItem(CLE_MOI, JSON.stringify(envoyeur)); } catch { /* stockage indisponible */ }
      await publierDepuisAppli(media.f, etiquette, envoyeur);
      setEtat("fini");
    } catch (e) {
      setEtat(e instanceof Error && e.message === "connexion" ? "connexion" : "erreur");
    }
  }

  const wa = lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE ?? "+228 90 00 08 37", messageEnvoiRealisations(moi.nom || undefined));

  if (etat === "fini") return (
    <div className="publier publier-fini" role="status">
      <span className="publier-ok"><CircleCheck size={64} strokeWidth={1.6} aria-hidden="true" /></span>
      <h2 className="titre-degrade">C&apos;est envoyé !</h2>
      <p>ServiLink regarde votre {media?.f.type.startsWith("video/") ? "vidéo" : "photo"}, puis la publie dans la Vitrine. Vous verrez la réponse dans « Mes publications ».</p>
      <button type="button" className="bouton vitrine-bouton bouton-plein" onClick={recommencer}><Camera size={22} aria-hidden="true" />Publier une autre</button>
      <Link href="/vitrine/mes-publications" className="bouton vitrine-bouton-clair bouton-plein">Mes publications</Link>
    </div>
  );

  if (!media) return (
    <div className="publier">
      <p className="publier-intro">Montrez votre travail aux clients. Une vidéo courte suffit.</p>
      <div className="publier-grand-choix">
        <label className="tuile-capture tuile-video">
          <input type="file" accept="video/*" capture="environment" className="sr-only" onChange={(e) => choisir(e.target.files)} />
          <Video size={44} strokeWidth={1.8} aria-hidden="true" /><strong>Filmer</strong><small>{texteDuree(DUREE_MAX)} au plus</small>
        </label>
        <label className="tuile-capture tuile-photo">
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => choisir(e.target.files)} />
          <Camera size={44} strokeWidth={1.8} aria-hidden="true" /><strong>Photo</strong><small>Prendre une photo</small>
        </label>
      </div>
      <label className="tuile-galerie">
        <input type="file" accept="image/*,video/*" className="sr-only" onChange={(e) => choisir(e.target.files)} />
        <ImagePlus size={24} aria-hidden="true" />Choisir dans mes photos et vidéos
      </label>
      <ul className="publier-regles" aria-label="Ce qui est publié">
        <li><CircleCheck size={18} aria-hidden="true" />Votre travail à vous</li>
        <li><CircleCheck size={18} aria-hidden="true" />À la lumière du jour</li>
        <li><CircleCheck size={18} aria-hidden="true" />Sans numéro écrit dans l&apos;image</li>
      </ul>
      <div className="publier-liens">
        <Link href="/vitrine/mes-publications" className="lien-souligne">Mes publications</Link>
        {wa && <a href={wa} target="_blank" rel="noopener" className="lien-wa-vert"><IconeWhatsApp taille={20} />Ou envoyer sur WhatsApp</a>}
      </div>
    </div>
  );

  const video = media.f.type.startsWith("video/");
  return (
    <div className="publier">
      <figure className="publier-apercu">
        {video
          ? <video src={media.url} controls playsInline muted autoPlay loop />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={media.url} alt="Votre photo" />}
        <button type="button" className="publier-refaire" onClick={recommencer}><RotateCcw size={18} aria-hidden="true" />Refaire</button>
      </figure>
      {media.duree != null && media.duree > DUREE_MAX && (
        <p className="encart-info">Votre vidéo dure {texteDuree(media.duree)}. Coupez-la à {texteDuree(DUREE_MAX)} au plus avant de l&apos;envoyer.</p>
      )}

      <div className="publier-bloc" role="radiogroup" aria-label="C'est le travail">
        <p className="publier-question">C&apos;est le travail… <small>(facultatif)</small></p>
        <div className="etiquettes">
          {ETIQUETTES.map(({ cle, texte }) => {
            const Icone = ICONES[cle];
            return (
              <button key={cle} type="button" role="radio" aria-checked={etiquette === cle} className="etiquette-choix" onClick={() => setEtiquette(etiquette === cle ? null : cle)}>
                <Icone size={28} strokeWidth={1.9} />{texte}
              </button>
            );
          })}
        </div>
      </div>

      {editer ? (
        <div className="publier-bloc">
          <p className="publier-question">Pour que ServiLink vous reconnaisse</p>
          <input className="champ" value={moi.nom} maxLength={80} onChange={(e) => setMoi({ ...moi, nom: e.target.value })} placeholder="Votre nom ou votre atelier" aria-label="Votre nom ou votre atelier" />
          <label className="champ champ-icone champ-tel">
            <span className="indicatif">+228</span>
            <input value={moi.telephone.replace(/^\+?228\s?/, "")} inputMode="tel" maxLength={14} onChange={(e) => setMoi({ ...moi, telephone: e.target.value })}
              placeholder="Numéro WhatsApp" aria-label="Votre numéro WhatsApp" />
          </label>
          {!numeroOk && moi.telephone && <small className="aide">8 chiffres, par exemple 90 00 00 00</small>}
        </div>
      ) : (
        <p className="publier-moi"><span><strong>{moi.nom || "Vous"}</strong>{moi.telephone}</span><button type="button" className="lien-souligne" onClick={() => setEditer(true)}>Modifier</button></p>
      )}

      {etat === "connexion" && <p className="encart-info encart-orange" role="alert"><span><strong>Connectez-vous d&apos;abord</strong><Link href="/espace" className="lien-orange">Ouvrir mon espace</Link></span></p>}
      {etat === "erreur" && <p className="encart-info encart-orange" role="alert"><span><strong>L&apos;envoi n&apos;a pas marché.</strong>Vérifiez la connexion internet et réessayez.</span></p>}
      <button type="button" className="bouton vitrine-bouton bouton-plein publier-envoyer" disabled={etat === "envoi" || (media.duree != null && media.duree > DUREE_MAX)} onClick={envoyer}>
        {etat === "envoi" ? <><LoaderCircle size={24} className="tourne" aria-hidden="true" />Envoi…</> : <><Send size={22} aria-hidden="true" />Envoyer</>}
      </button>
    </div>
  );
}
