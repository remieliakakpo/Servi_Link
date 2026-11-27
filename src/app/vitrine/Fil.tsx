"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Hand, LayoutGrid, Phone, Play, Plus, Share2, Store, Volume2, VolumeX } from "lucide-react";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { ICONES_METIER } from "@/components/IconeMetier";
import { filLocal, texteEtiquette } from "@/lib/realisations";
import type { ItemVitrine, Metier } from "@/lib/types";
import { lienAppel, lienWhatsApp, messageViaServiLink, NUMERO_CONTACT_TEMPORAIRE } from "@/lib/whatsapp";

type Groupe = { pro: ItemVitrine; medias: ItemVitrine[] };
const CLE_ASTUCE = "slk-vitrine-astuce-vue";

/** Les publications regroupées par pro : on glisse vers le haut pour changer de pro, sur le côté pour ses autres vidéos. */
function grouper(items: ItemVitrine[]): Groupe[] {
  const parPro = new Map<string, ItemVitrine[]>();
  for (const it of items) parPro.set(it.pro_id, [...(parPro.get(it.pro_id) ?? []), it]);
  return [...parPro.values()].map((medias) => ({ pro: medias[0], medias }));
}

function IconeCategorie({ slug, type, taille = 18 }: { slug: string | null; type: string; taille?: number }) {
  const Icone = type === "Fournisseur" ? Store : (slug && ICONES_METIER[slug]) || LayoutGrid;
  return <Icone size={taille} strokeWidth={2} aria-hidden="true" />;
}

/**
 * Fil Vitrine plein écran, façon Reels : une page par pro, ses vidéos et photos côte à côte.
 * Les vidéos démarrent seules (sans le son) quand elles sont à l'écran ; un appui met en pause.
 */
export function Fil({ serveur, metiers, metierDepart, proDepart, indexDepart }: {
  serveur: ItemVitrine[]; metiers: Metier[]; metierDepart?: string; proDepart?: string; indexDepart?: number;
}) {
  const [items, setItems] = useState<ItemVitrine[] | null>(null);
  const [metier, setMetier] = useState(metierDepart ?? "");
  const [son, setSon] = useState(false);
  const [astuce, setAstuce] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const [actif, setActif] = useState(0);

  useEffect(() => { filLocal().then((l) => setItems([...l, ...serveur])).catch(() => setItems(serveur)); }, [serveur]);
  useEffect(() => { try { setAstuce(!localStorage.getItem(CLE_ASTUCE)); } catch { /* stockage indisponible */ } }, []);
  const fermerAstuce = () => { setAstuce(false); try { localStorage.setItem(CLE_ASTUCE, "1"); } catch { /* idem */ } };

  const groupes = useMemo(() => {
    const g = grouper((items ?? []).filter((i) => !metier || i.metier_slug === metier));
    // Arrivée depuis une fiche : ce pro en premier
    const k = proDepart ? g.findIndex((x) => x.pro.pro_id === proDepart) : -1;
    return k > 0 ? [g[k], ...g.slice(0, k), ...g.slice(k + 1)] : g;
  }, [items, metier, proDepart]);

  // Catégories : celles qui ont des publications d'abord
  const categories = useMemo(() => {
    const avec = new Set((items ?? []).map((i) => i.metier_slug));
    return [...metiers].sort((a, b) => Number(avec.has(b.slug)) - Number(avec.has(a.slug)));
  }, [metiers, items]);

  function choisirMetier(slug: string) {
    setMetier(slug);
    fil.current?.scrollTo({ top: 0 });
    const u = new URL(location.href);
    if (slug) u.searchParams.set("metier", slug); else u.searchParams.delete("metier");
    u.searchParams.delete("pro"); u.searchParams.delete("i");
    history.replaceState(null, "", u);
  }

  // Page à l'écran : seules elle et ses voisines chargent leurs vidéos (économie de données en 4G)
  useEffect(() => {
    const racine = fil.current;
    if (!racine) return;
    const obs = new IntersectionObserver((entrees) => entrees.forEach((e) => {
      if (e.isIntersecting) setActif(Number((e.target as HTMLElement).dataset.k));
    }), { root: racine, threshold: 0.6 });
    racine.querySelectorAll<HTMLElement>(".vitrine-page[data-k]").forEach((p) => obs.observe(p));
    return () => obs.disconnect();
  }, [groupes]);

  // Lecture automatique : seule la vidéo bien visible joue
  useEffect(() => {
    const racine = fil.current;
    if (!racine) return;
    const obs = new IntersectionObserver((entrees) => entrees.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting && e.intersectionRatio >= 0.6) { v.play().catch(() => {}); } else { v.pause(); }
    }), { threshold: [0, 0.6, 1] });
    racine.querySelectorAll("video").forEach((v) => obs.observe(v));
    return () => obs.disconnect();
  }, [groupes]);
  useEffect(() => { fil.current?.querySelectorAll("video").forEach((v) => { v.muted = !son; }); }, [son, groupes]);

  const nomMetier = metiers.find((m) => m.slug === metier)?.libelle;
  return (
    <div className="vitrine">
      <header className="vitrine-haut">
        <div className="vitrine-titre">
          <h1>Vitrine</h1>
          <Link href="/vitrine/publier" className="vitrine-publier"><Plus size={20} strokeWidth={2.6} aria-hidden="true" />Publier</Link>
        </div>
        <nav className="vitrine-categories" aria-label="Métiers">
          <button type="button" aria-pressed={!metier} onClick={() => choisirMetier("")}><LayoutGrid size={18} aria-hidden="true" />Tous</button>
          {categories.map((m) => (
            <button key={m.slug} type="button" aria-pressed={metier === m.slug} onClick={() => choisirMetier(m.slug)}>
              <IconeCategorie slug={m.slug} type={m.type} />{m.libelle}
            </button>
          ))}
        </nav>
      </header>

      <div className="vitrine-fil" ref={fil}>
        {items == null && <div className="vitrine-page vitrine-chargement" />}
        {items != null && groupes.length === 0 && <PageVide metier={metier} nom={nomMetier} />}
        {groupes.map((g, k) => (
          <PagePro key={g.pro.pro_id} k={k} charger={Math.abs(k - actif) <= 1} enCours={k === actif} g={g} son={son} basculerSon={() => setSon((x) => !x)}
            depart={k === 0 && g.pro.pro_id === proDepart ? indexDepart ?? 0 : 0} />
        ))}
        {groupes.length > 0 && <PageFin metier={metier} nom={nomMetier} />}
      </div>

      {astuce && groupes.length > 0 && (
        <button type="button" className="vitrine-astuce" onClick={fermerAstuce} aria-label="Compris, fermer l'astuce">
          <span className="astuce-geste haut"><Hand size={40} aria-hidden="true" /><strong>Glissez vers le haut</strong><small>Professionnel suivant</small></span>
          <span className="astuce-geste cote"><Hand size={40} aria-hidden="true" /><strong>Glissez sur le côté</strong><small>Ses autres réalisations</small></span>
          <span className="astuce-ok">Compris</span>
        </button>
      )}
    </div>
  );
}

function PagePro({ k, charger, enCours, g, son, basculerSon, depart }: { k: number; charger: boolean; enCours: boolean; g: Groupe; son: boolean; basculerSon: () => void; depart: number }) {
  const [i, setI] = useState(0);
  const [pause, setPause] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const p = g.pro;
  const m = g.medias[Math.min(i, g.medias.length - 1)];

  useEffect(() => {
    if (depart > 0 && rail.current) rail.current.scrollTo({ left: Math.min(depart, g.medias.length - 1) * rail.current.clientWidth, behavior: "instant" as ScrollBehavior });
  }, [depart, g.medias.length]);

  const defile = useCallback(() => {
    const r = rail.current; if (!r) return;
    const k = Math.round(r.scrollLeft / r.clientWidth);
    setI((x) => (x === k ? x : k)); setPause(false);
  }, []);

  function appui(e: React.MouseEvent<HTMLElement>) {
    const v = e.currentTarget.querySelector("video");
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPause(false); } else { v.pause(); setPause(true); }
  }

  const wa = lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE ?? "", messageViaServiLink(p.pro_nom, p.reference));
  const tel = lienAppel(NUMERO_CONTACT_TEMPORAIRE);
  async function partager() {
    const url = `${location.origin}/vitrine?pro=${encodeURIComponent(p.pro_id)}`;
    const texte = `${p.pro_nom}, ${p.metier.toLowerCase()} à ${p.lieu}, sur ServiLink`;
    try { if (navigator.share) { await navigator.share({ title: p.pro_nom, text: texte, url }); return; } } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texte} : ${url}`)}`, "_blank", "noopener");
  }

  return (
    <section className="vitrine-page" data-k={k} aria-label={`${p.pro_nom}, ${p.metier}`}>
      <div className="vitrine-rail" ref={rail} onScroll={defile}>
        {g.medias.map((x, n) => (
          <figure key={x.id} className="vitrine-media" onClick={appui}>
            {x.type === "video"
              // Vidéos jusqu'à 5 min : rien n'est téléchargé loin de l'écran, l'en-tête seulement pour les voisines,
              // et le flux complet uniquement pour la vidéo regardée (lecture progressive, pas de téléchargement entier)
              ? <video src={charger ? x.url : undefined} loop playsInline muted={!son} preload={enCours && n === i ? "auto" : charger ? "metadata" : "none"} onTimeUpdate={(e) => {
                  const v = e.currentTarget; v.parentElement?.style.setProperty("--avance", String(v.duration ? v.currentTime / v.duration : 0));
                }} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={x.url} alt={x.legende ?? `Réalisation de ${p.pro_nom}`} loading="lazy" />}
            {x.type === "video" && <span className="vitrine-avance" aria-hidden="true" />}
            {x.type === "video" && x.duree != null && x.duree >= 60 && <span className="vitrine-duree">{Math.floor(x.duree / 60)}:{String(x.duree % 60).padStart(2, "0")}</span>}
          </figure>
        ))}
      </div>
      {pause && m.type === "video" && <span className="vitrine-pause" aria-hidden="true"><Play size={44} fill="currentColor" /></span>}

      {g.medias.length > 1 && (
        <div className="vitrine-points" aria-label={`${i + 1} sur ${g.medias.length}`}>
          {g.medias.map((x, k) => <span key={x.id} className={k === i ? "actif" : undefined} />)}
        </div>
      )}

      <div className="vitrine-actions">
        <Link href={`/pro/${p.pro_id}`} className="vitrine-action vitrine-avatar" aria-label={`Voir la fiche de ${p.pro_nom}`}>
          <span><IconeCategorie slug={p.metier_slug} type={p.type_pro} taille={26} /></span>Fiche
        </Link>
        {wa && <a href={wa} target="_blank" rel="noopener" className="vitrine-action vitrine-wa"><span><IconeWhatsApp taille={28} /></span>WhatsApp</a>}
        {tel && <a href={tel} className="vitrine-action"><span><Phone size={24} fill="currentColor" aria-hidden="true" /></span>Appeler</a>}
        <button type="button" className="vitrine-action" onClick={partager}><span><Share2 size={24} aria-hidden="true" /></span>Partager</button>
        {g.medias.some((x) => x.type === "video") && (
          <button type="button" className="vitrine-action" onClick={basculerSon} aria-pressed={son}>
            <span>{son ? <Volume2 size={24} aria-hidden="true" /> : <VolumeX size={24} aria-hidden="true" />}</span>{son ? "Son" : "Muet"}
          </button>
        )}
      </div>

      <Link href={`/pro/${p.pro_id}`} className="vitrine-infos">
        <strong>{p.pro_nom}</strong>
        <span>{p.metier} · {p.lieu}</span>
        {(m.etiquette || m.legende) && <p>{m.etiquette && <em>{texteEtiquette(m.etiquette)}</em>}{m.legende}</p>}
      </Link>
    </section>
  );
}

function PageVide({ metier, nom }: { metier: string; nom?: string }) {
  return (
    <section className="vitrine-page vitrine-vide">
      <div>
        <span className="vitrine-vide-icone"><Play size={34} fill="currentColor" aria-hidden="true" /></span>
        <h2>{nom ? `Pas encore de vidéos : ${nom.toLowerCase()}` : "Pas encore de vidéos"}</h2>
        <p>Les professionnels montrent bientôt leur travail ici, après vérification par ServiLink.</p>
        <Link href="/vitrine/publier" className="bouton vitrine-bouton"><Plus size={22} aria-hidden="true" />Je suis professionnel : publier</Link>
        <Link href={metier ? `/annuaire?metiers=${metier}` : "/annuaire"} className="bouton vitrine-bouton-clair">
          {nom ? `Voir dans l'annuaire` : "Ouvrir l'annuaire"}
        </Link>
      </div>
    </section>
  );
}

function PageFin({ metier, nom }: { metier: string; nom?: string }) {
  return (
    <section className="vitrine-page vitrine-vide">
      <div>
        <h2>Vous avez tout vu</h2>
        <p>{nom ? `D'autres professionnels (${nom.toLowerCase()}) sont dans l'annuaire.` : "D'autres professionnels sont dans l'annuaire."}</p>
        <Link href={metier ? `/annuaire?metiers=${metier}` : "/annuaire"} className="bouton vitrine-bouton">Voir l&apos;annuaire</Link>
        <Link href="/vitrine/publier" className="bouton vitrine-bouton-clair"><Plus size={22} aria-hidden="true" />Publier mon travail</Link>
      </div>
    </section>
  );
}
