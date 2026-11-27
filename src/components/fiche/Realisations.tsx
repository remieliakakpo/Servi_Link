"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, ChevronRight, Images, Play } from "lucide-react";
import { filLocal, texteEtiquette } from "@/lib/realisations";
import type { RealisationPublique } from "@/lib/types";

/** Ce que la fiche montre d'une réalisation (base, ancienne photo de chantier ou média du téléphone en démo). */
export type Media = RealisationPublique;

/** Réalisations publiées pour la fiche : celles du serveur, puis (démo) celles publiées depuis ce téléphone. */
export function useRealisations(proId: string, serveur: Media[]): Media[] | null {
  const [locales, setLocales] = useState<Media[] | null>(null);
  useEffect(() => { filLocal().then((l) => setLocales(l.filter((x) => x.pro_id === proId))).catch(() => setLocales([])); }, [proId]);
  return locales == null ? null : [...locales, ...serveur];
}

const duree = (s: number | null) => (s == null ? null : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

/** Vignette : photo, ou première image de la vidéo avec le bouton lecture et la durée. */
export function Vignette({ m, className = "" }: { m: Media; className?: string }) {
  return (
    <span className={`vignette-media ${className}`}>
      {m.type === "video"
        ? <video src={`${m.url}#t=0.1`} preload="metadata" muted playsInline aria-hidden="true" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={m.url} alt="" loading="lazy" />}
      {m.etiquette && <span className="etiquette-media">{texteEtiquette(m.etiquette)}</span>}
      {m.type === "video" && <span className="lecture-media"><Play size={14} fill="currentColor" aria-hidden="true" />{duree(m.duree)}</span>}
    </span>
  );
}

type Pro = { id: string; nom: string; reference: string };

/** Bloc « Réalisations » des fiches (remplace « Chantiers de référence ») : 6 vignettes, qui ouvrent la Vitrine sur ce pro. */
export function BlocRealisations({ pro, serveur }: { pro: Pro; serveur: Media[] }) {
  const tout = useRealisations(pro.id, serveur);
  if (tout == null) return null;
  return (
    <section className="bloc" id="realisations" aria-labelledby="t-realisations">
      <div className="bloc-tete">
        <h2 id="t-realisations"><Images size={24} aria-hidden="true" />Réalisations</h2>
        {tout.length > 6 && <Link href={`/vitrine?pro=${pro.id}`}>Tout voir ({tout.length}) <ChevronRight size={20} aria-hidden="true" /></Link>}
      </div>
      {tout.length > 0 ? (
        <ul className="grille-realisations">
          {tout.slice(0, 6).map((m, i) => (
            <li key={m.id}>
              <Link href={`/vitrine?pro=${pro.id}&i=${i}`} aria-label={`${m.type === "video" ? "Vidéo" : "Photo"} ${i + 1} sur ${tout.length}${m.legende ? ` : ${m.legende}` : ""}`}>
                <Vignette m={m} />
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="muet realisations-vide">Pas encore de photos ni de vidéos publiées.</p>}
      <Link href="/vitrine/publier" className="encart-pro-media">
        <span className="encart-pro-media-icone"><Camera size={22} aria-hidden="true" /></span>
        <span><strong>Vous êtes ce professionnel ?</strong>Filmez votre travail et publiez-le en un geste. ServiLink vérifie puis l&apos;affiche ici.</span>
        <ChevronRight size={20} aria-hidden="true" />
      </Link>
    </section>
  );
}
