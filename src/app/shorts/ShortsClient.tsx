"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  FileText,
  MapPin,
  Mic,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { lienWhatsApp } from "@/lib/whatsapp";

type ShortVideo = {
  id: string;
  proId: string;
  reference: string;
  categorie: "macon" | "menuisier" | "carreleur" | "plombier" | "ferrailleur";
  categorieLabel: string;
  nom: string;
  metier: string;
  quartier: string;
  repere: string;
  experience: number;
  note: number;
  nbChantiers: number;
  titreChantier: string;
  description: string;
  prixIndicatif: string;
  dateFilmee: string;
  verificateur: string;
  audioEweFr: string;
  audioTranscription: string;
  likes: number;
  couleurFond: string;
  accent: string;
  badgeChantier: string;
};

const SHORTS_DEMO: ShortVideo[] = [
  {
    id: "short-1",
    proId: "ID-101",
    reference: "SLK-A-0101",
    categorie: "macon",
    categorieLabel: "🧱 Maçonnerie",
    nom: "Koffi Mensah & Équipe",
    metier: "Maçon coffreur",
    quartier: "Agoè",
    repere: "Près du marché d'Agoè Assiyéyé",
    experience: 12,
    note: 4.8,
    nbChantiers: 18,
    titreChantier: "Élévation clôture 1 lot (100m) + chaînage",
    description: "Pose d'agglos de 15 vibrés au cordeau avec poteaux béton armé tous les 4m à Agoè Zongo.",
    prixIndicatif: "2 500 F CFA / m²",
    dateFilmee: "Filmé sur place il y a 2 jours",
    verificateur: "Vérifié par Afi (Équipe ServiLink)",
    audioEweFr: "Miawoezo ! C'est Koffi, maçon à Agoè depuis 12 ans. Voici notre mur de clôture de 100 mètres aligné au cordeau. Appelez-moi sur WhatsApp !",
    audioTranscription: "🎙️ « Miawoezo ! C'est Koffi, maçon à Agoè depuis 12 ans. Voici notre mur de clôture aligné au cordeau... »",
    likes: 148,
    couleurFond: "radial-gradient(circle at 50% 28%, #2f5a28 0%, #152713 65%, #0c130b 100%)",
    accent: "#f47b0a",
    badgeChantier: "Chantier Villa R+1 · Agoè Zongo",
  },
  {
    id: "short-2",
    proId: "ID-108",
    reference: "SLK-A-0108",
    categorie: "menuisier",
    categorieLabel: "🪚 Menuiserie",
    nom: "Atelier Kodjo Bois & Alu",
    metier: "Menuisier ébéniste",
    quartier: "Adidogomé",
    repere: "Carrefour Douane Sagbado",
    experience: 9,
    note: 4.9,
    nbChantiers: 24,
    titreChantier: "Porte principale en bois Iroko massif",
    description: "Séchage naturel 6 mois, rainurage anti-fissure et vernis marin haute protection contre l'humidité.",
    prixIndicatif: "À partir de 65 000 F CFA",
    dateFilmee: "Atelier filmé il y a 4 jours",
    verificateur: "Vérifié par Komi (Équipe ServiLink)",
    audioEweFr: "Bonjour la famille ! Ici Atelier Kodjo à Adidogomé. Nous travaillons le vrai bois Iroko bien sec qui ne travaille pas sous la pluie.",
    audioTranscription: "🎙️ « Ici Atelier Kodjo à Adidogomé. Nous travaillons le vrai bois Iroko bien sec qui ne se fend pas... »",
    likes: 234,
    couleurFond: "radial-gradient(circle at 50% 28%, #7a3e08 0%, #2d1804 65%, #120902 100%)",
    accent: "#f59e0b",
    badgeChantier: "Atelier visité · Adidogomé Douane",
  },
  {
    id: "short-3",
    proId: "ID-115",
    reference: "SLK-A-0115",
    categorie: "carreleur",
    categorieLabel: "✨ Carrelage & Peinture",
    nom: "Ama Finitions & Carrelage",
    metier: "Carreleur - Peintre",
    quartier: "Tokoin",
    repere: "Derrière GTA / Kégué",
    experience: 8,
    note: 4.7,
    nbChantiers: 15,
    titreChantier: "Avant / Après : Salon grès cérame 60×60",
    description: "Pose au niveau laser avec croisillons 2mm, plinthes alignées et peinture acrylique lavable.",
    prixIndicatif: "2 800 F CFA / m²",
    dateFilmee: "Chantier filmé hier",
    verificateur: "Vérifié par Afi (Équipe ServiLink)",
    audioEweFr: "Regardez la finition de ce salon à Tokoin ! Niveau laser, zéro carreau qui sonne creux. Contactez-moi via ServiLink.",
    audioTranscription: "🎙️ « Regardez la finition de ce salon à Tokoin ! Niveau laser, zéro carreau qui sonne creux... »",
    likes: 192,
    couleurFond: "radial-gradient(circle at 50% 28%, #1b4d6b 0%, #0f2636 65%, #07121a 100%)",
    accent: "#38bdf8",
    badgeChantier: "Avant / Après · Salon 45 m² Tokoin",
  },
  {
    id: "short-4",
    proId: "ID-104",
    reference: "SLK-A-0104",
    categorie: "ferrailleur",
    categorieLabel: "🏗️ Ferraillage & Dalle",
    nom: "Mawuli Ferraillage Pro",
    metier: "Ferrailleur BTP",
    quartier: "Sagbado",
    repere: "Axe Lankouvi - Ségbé",
    experience: 14,
    note: 4.9,
    nbChantiers: 31,
    titreChantier: "Ferraillage double nappe dalle HA10 & HA12",
    description: "Ligaturage renforcé des poutres et semelles selon plan ingénieur avant coulage béton.",
    prixIndicatif: "Sur métré · Devis en 2h",
    dateFilmee: "Chantier filmé il y a 5 jours",
    verificateur: "Vérifié par Komi (Équipe ServiLink)",
    audioEweFr: "Une maison solide commence par le fer ! Ici Mawuli à Sagbado, on respecte exactement les écartements en fer HA10 et HA12.",
    audioTranscription: "🎙️ « Une maison solide commence par le fer ! On respecte les écartements HA10 et HA12... »",
    likes: 176,
    couleurFond: "radial-gradient(circle at 50% 28%, #3f3f46 0%, #18181b 65%, #09090b 100%)",
    accent: "#f47b0a",
    badgeChantier: "Dalle R+2 · Sagbado Lankouvi",
  },
];

const CATEGORIES = [
  { slug: "tous", label: "🔥 Tous les chantiers" },
  { slug: "macon", label: "🧱 Maçonnerie" },
  { slug: "menuisier", label: "🪚 Menuiserie" },
  { slug: "carreleur", label: "✨ Carrelage & Peinture" },
  { slug: "ferrailleur", label: "🏗️ Ferraillage" },
] as const;

export function ShortsClient({ numeroServiLink }: { numeroServiLink: string }) {
  const [filtre, setFiltre] = useState<string>("tous");
  const [index, setIndex] = useState(0);
  const [audioActif, setAudioActif] = useState(false);
  const [likesLocaux, setLikesLocaux] = useState<Record<string, boolean>>({});
  const [modalePostOuverte, setModalePostOuverte] = useState(false);

  const liste = filtre === "tous" ? SHORTS_DEMO : SHORTS_DEMO.filter((s) => s.categorie === filtre);
  const courant = liste[index % liste.length] ?? SHORTS_DEMO[0];

  function changerCategorie(cat: string) {
    setFiltre(cat);
    setIndex(0);
    arreterVoix();
  }

  function suivant() {
    arreterVoix();
    setIndex((i) => (i + 1) % liste.length);
  }

  function precedent() {
    arreterVoix();
    setIndex((i) => (i - 1 + liste.length) % liste.length);
  }

  function arreterVoix() {
    setAudioActif(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function basculerVoix() {
    if (audioActif) {
      arreterVoix();
      return;
    }
    setAudioActif(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(courant.audioEweFr);
      u.lang = "fr-FR";
      u.rate = 0.98;
      u.onend = () => setAudioActif(false);
      window.speechSynthesis.speak(u);
    }
  }

  function aimer(id: string) {
    setLikesLocaux((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const lienContactPro = lienWhatsApp(
    numeroServiLink,
    `Bonjour ServiLink, j'ai vu la vidéo de chantier de ${courant.nom} (réf. ${courant.reference} - ${courant.titreChantier}) dans l'onglet En Action et je souhaite le contacter.`
  );

  const lienPosterVideoArtisan = lienWhatsApp(
    numeroServiLink,
    "Bonjour ServiLink, je suis artisan et je vous envoie ici la vidéo de 15 secondes de mon chantier + ma note vocale de présentation pour l'onglet En Action :"
  );

  const estAime = !!likesLocaux[courant.id];

  return (
    <div className="shorts-ecran">
      {/* Barre supérieure : Titre + Bouton "Artisan : Poster par WhatsApp" + Filtres métiers */}
      <header className="shorts-entete">
        <div className="shorts-barre-haut">
          <div className="shorts-marque">
            <Link href="/" className="shorts-logo">
              Servi<span>Link</span>
            </Link>
            <span className="shorts-badge-live">
              <Sparkles size={13} aria-hidden="true" /> Chantiers Live
            </span>
          </div>
          <button
            type="button"
            className="shorts-btn-poster"
            onClick={() => setModalePostOuverte(true)}
          >
            <Plus size={16} aria-hidden="true" /> Artisan : Poster ma vidéo
          </button>
        </div>

        <div className="shorts-filtres" role="tablist" aria-label="Filtrer par métier">
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={filtre === c.slug}
              className={filtre === c.slug ? "shorts-puce active" : "shorts-puce"}
              onClick={() => changerCategorie(c.slug)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      {/* Scène visuelle plein écran vertical (format Reels / TikTok mais < 300 Ko) */}
      <main className="shorts-scene" style={{ background: courant.couleurFond }}>
        {/* Badge de vérification terrain en haut à droite */}
        <div className="shorts-filigrane">
          <span className="shorts-point-vert" aria-hidden="true" />
          <span>📸 {courant.dateFilmee} · {courant.verificateur}</span>
        </div>

        {/* Illustration animée du chantier en cours (Aperçu ultra-léger 2G/3G) */}
        <div className="shorts-visuel-centre" onClick={basculerVoix}>
          <div className="shorts-cadre-video">
            <span className="shorts-etiquette-chantier">{courant.badgeChantier}</span>
            <div className="shorts-illustration-metier">
              <div className="shorts-cercle-play">
                {audioActif ? <Volume2 size={36} /> : <Play size={36} fill="currentColor" />}
              </div>
              <strong>{courant.titreChantier}</strong>
              <small>
                {audioActif
                  ? "🔊 Note vocale de l'artisan en cours de lecture..."
                  : "Touchez pour écouter l'artisan présenter ce chantier (Voix FR / Éwé)"}
              </small>
            </div>
            {/* Barre d'onde sonore animée */}
            <div className={audioActif ? "shorts-ondes actif" : "shorts-ondes"} aria-hidden="true">
              <span /><span /><span /><span /><span /><span /><span /><span />
            </div>
          </div>
        </div>

        {/* Colonne d'actions flottante à droite (style TikTok adapté aux artisans BTP) */}
        <aside className="shorts-actions-droite" aria-label="Actions rapides">
          <button
            type="button"
            className={audioActif ? "shorts-action-rond actif" : "shorts-action-rond"}
            onClick={basculerVoix}
            aria-pressed={audioActif}
          >
            {audioActif ? <Volume2 size={22} /> : <VolumeX size={22} />}
            <span>{audioActif ? "Stop voix" : "Écouter"}</span>
          </button>

          <button
            type="button"
            className={estAime ? "shorts-action-rond actif" : "shorts-action-rond"}
            onClick={() => aimer(courant.id)}
            aria-pressed={estAime}
          >
            <ThumbsUp size={22} fill={estAime ? "currentColor" : "none"} />
            <span>{courant.likes + (estAime ? 1 : 0)}</span>
          </button>

          {liste.length > 1 && (
            <>
              <button
                type="button"
                className="shorts-action-rond"
                onClick={precedent}
                aria-label="Chantier précédent"
              >
                <ArrowUp size={22} />
                <span>Préc.</span>
              </button>
              <button
                type="button"
                className="shorts-action-rond suivant"
                onClick={suivant}
                aria-label="Swiper au chantier suivant"
              >
                <ArrowDown size={22} />
                <span>Swiper</span>
              </button>
            </>
          )}
        </aside>

        {/* Bandeau de transcription de la note vocale de l'artisan */}
        {audioActif && (
          <div className="shorts-bulle-vocale" role="status">
            <Mic size={18} aria-hidden="true" />
            <span>{courant.audioTranscription}</span>
          </div>
        )}

        {/* Carte d'information de l'artisan en bas (reliée directement à sa fiche et à WhatsApp) */}
        <section className="shorts-carte-bas" aria-label={`Présentation de ${courant.nom}`}>
          <div className="shorts-carte-entete">
            <div>
              <div className="shorts-nom-ligne">
                <h1>{courant.nom}</h1>
                <span className="shorts-badge-verifie">
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Vérifié
                </span>
              </div>
              <p className="shorts-meta">
                <span>{courant.metier}</span> · <span><MapPin size={13} aria-hidden="true" /> {courant.quartier} ({courant.repere})</span>
              </p>
            </div>
            <div className="shorts-note">
              <Star size={15} className="etoile" aria-hidden="true" />
              <strong>{String(courant.note).replace(".", ",")}</strong>
              <small>({courant.nbChantiers} chantiers vus)</small>
            </div>
          </div>

          <p className="shorts-description">{courant.description}</p>

          <div className="shorts-pied-carte">
            <div className="shorts-tarif">
              <small>Tarif constaté</small>
              <strong>{courant.prixIndicatif}</strong>
            </div>
            <div className="shorts-boutons">
              <Link href={`/pro/${courant.proId}`} className="shorts-btn-fiche">
                <FileText size={17} aria-hidden="true" /> Voir sa fiche
              </Link>
              {lienContactPro && (
                <a href={lienContactPro} target="_blank" rel="noopener" className="shorts-btn-wa">
                  <IconeWhatsApp taille={18} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modale explicative : Comment un artisan (même non scolarisé) publie sa vidéo sans effort */}
      {modalePostOuverte && (
        <>
          <div className="voile" onClick={() => setModalePostOuverte(false)} aria-hidden="true" />
          <div className="shorts-modale" role="dialog" aria-modal="true" aria-labelledby="t-poster-wa">
            <div className="shorts-modale-tete">
              <span className="shorts-modale-surtitre">
                <ShieldCheck size={16} aria-hidden="true" /> Zéro écriture · Zéro arnaque
              </span>
              <button
                type="button"
                onClick={() => setModalePostOuverte(false)}
                aria-label="Fermer"
                className="shorts-modale-fermer"
              >
                <X size={22} />
              </button>
            </div>
            <h2 id="t-poster-wa">Vous êtes artisan ou fournisseur ?</h2>
            <p className="muet" style={{ margin: "4px 0 12px", fontSize: ".92rem" }}>
              Pas besoin de savoir écrire ni de remplir un long formulaire pour montrer votre talent :
            </p>
            <ol className="shorts-etapes-wa">
              <li>
                <strong>1. Filmez votre travail (15 secondes)</strong>
                <span>Sur votre chantier ou dans votre atelier avec votre téléphone.</span>
              </li>
              <li>
                <strong>2. Envoyez la vidéo + un vocal sur WhatsApp</strong>
                <span>Expliquez ce que vous avez fait par note vocale (en Éwé, Mina ou Français).</span>
              </li>
              <li>
                <strong>3. ServiLink vérifie et publie pour vous !</strong>
                <span>Notre équipe compresse la vidéo (pour qu&apos;elle s&apos;ouvre vite en 3G) et l&apos;attache à votre fiche vérifiée.</span>
              </li>
            </ol>
            {lienPosterVideoArtisan && (
              <a
                href={lienPosterVideoArtisan}
                target="_blank"
                rel="noopener"
                className="bouton bouton-whatsapp bouton-plein"
                style={{ minHeight: 50, fontSize: "1.02rem" }}
              >
                <IconeWhatsApp taille={22} /> Envoyer ma vidéo sur WhatsApp
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
