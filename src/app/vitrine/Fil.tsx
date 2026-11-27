"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Flag, Hand, LayoutGrid, LocateFixed, MapPin, Phone, Play, Plus, Search, Share2, Store, Volume2, VolumeX } from "lucide-react";
import { IconeWhatsApp } from "@/components/IconeWhatsApp";
import { ICONES_METIER } from "@/components/IconeMetier";
import { filLocal, texteEtiquette } from "@/lib/realisations";
import { distanceKm } from "@/lib/geo";
import { demanderPosition, positionMemorisee, type Position } from "@/lib/position";
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
  const [onglet, setOnglet] = useState<"pour-toi" | "metiers">(metierDepart ? "metiers" : "pour-toi");
  const [metier, setMetier] = useState(metierDepart ?? "");
  const [pos, setPos] = useState<Position | null>(null);
  const [etatPos, setEtatPos] = useState<"" | "recherche" | "refusee">("");
  const [son, setSon] = useState(false);
  const [astuce, setAstuce] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const [actif, setActif] = useState(0);

  useEffect(() => { filLocal().then((l) => setItems([...l, ...serveur])).catch(() => setItems(serveur)); }, [serveur]);
  useEffect(() => { try { setAstuce(!localStorage.getItem(CLE_ASTUCE)); } catch { /* stockage indisponible */ } }, []);
  // Position déjà donnée dans l'appli (annuaire, dépannage) : « Pour toi » montre tout de suite les pros proches
  useEffect(() => { setPos(positionMemorisee()); }, []);
  async function presDeMoi() {
    if (pos) return;
    setEtatPos("recherche");
    try { setPos(await demanderPosition()); setEtatPos(""); } catch { setEtatPos("refusee"); }
  }
  // Nouvel ordre « les plus proches d'abord » : on repart du premier pro
  useEffect(() => { if (pos) fil.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, [pos]);
  const distance = useCallback((it: ItemVitrine) => (pos && it.lat != null && it.lng != null ? distanceKm(pos, { lat: it.lat, lng: it.lng }) : null), [pos]);
  const fermerAstuce = () => { setAstuce(false); try { localStorage.setItem(CLE_ASTUCE, "1"); } catch { /* idem */ } };

  const groupes = useMemo(() => {
    const filtre = onglet === "metiers" && metier ? metier : "";
    let g = grouper((items ?? []).filter((i) => !filtre || i.metier_slug === filtre));
    // Pour toi : les pros les plus proches d'abord quand on connaît la position, sinon les publications récentes
    if (pos) g = [...g].sort((a, b) => (distance(a.pro) ?? 999) - (distance(b.pro) ?? 999));
    // Arrivée depuis une fiche : ce pro en premier
    const k = proDepart ? g.findIndex((x) => x.pro.pro_id === proDepart) : -1;
    return k > 0 ? [g[k], ...g.slice(0, k), ...g.slice(k + 1)] : g;
  }, [items, metier, onglet, proDepart, pos, distance]);

  // Catégories : celles qui ont des publications d'abord
  const categories = useMemo(() => {
    const avec = new Set((items ?? []).map((i) => i.metier_slug));
    return [...metiers].sort((a, b) => Number(avec.has(b.slug)) - Number(avec.has(a.slug)));
  }, [metiers, items]);

  function choisirOnglet(o: "pour-toi" | "metiers") {
    setOnglet(o);
    fil.current?.scrollTo({ top: 0 });
    if (o === "pour-toi") choisirMetier("");
  }
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

  const nomMetier = onglet === "metiers" ? metiers.find((m) => m.slug === metier)?.libelle : undefined;
  return (
    <div className="vitrine">
      {/* En-tête fixe, comme TikTok : il reste en haut pendant tout le défilement */}
      <header className="vitrine-haut">
        <h1 className="sr-only">Vitrine</h1>
        <div className="vitrine-titre">
          <Link href="/annuaire" className="vitrine-icone-haut" aria-label="Chercher dans l'annuaire"><Search size={24} aria-hidden="true" /></Link>
          <div className="vitrine-onglets" role="tablist" aria-label="Vitrine">
            <button type="button" role="tab" aria-selected={onglet === "pour-toi"} onClick={() => choisirOnglet("pour-toi")}>Pour toi</button>
            <button type="button" role="tab" aria-selected={onglet === "metiers"} onClick={() => choisirOnglet("metiers")}>Métiers</button>
          </div>
          <Link href="/vitrine/publier" className="vitrine-icone-haut vitrine-plus" aria-label="Je suis professionnel : publier une vidéo"><Plus size={24} strokeWidth={2.6} aria-hidden="true" /></Link>
        </div>
        {onglet === "pour-toi" ? (
          <div className="vitrine-sous-barre">
            <button type="button" className={`vitrine-pres${pos ? " actif" : ""}`} onClick={presDeMoi} aria-pressed={!!pos}>
              {pos ? <MapPin size={16} aria-hidden="true" /> : <LocateFixed size={16} aria-hidden="true" />}
              {pos ? "Les plus proches de vous d'abord" : etatPos === "recherche" ? "Recherche de votre position…" : etatPos === "refusee" ? "Position refusée : les plus récentes" : "Voir d'abord les pros près de moi"}
            </button>
          </div>
        ) : (
        <nav className="vitrine-categories" aria-label="Métiers">
          <button type="button" aria-pressed={!metier} onClick={() => choisirMetier("")}><LayoutGrid size={18} aria-hidden="true" />Tous</button>
          {categories.map((m) => (
            <button key={m.slug} type="button" aria-pressed={metier === m.slug} onClick={() => choisirMetier(m.slug)}>
              <IconeCategorie slug={m.slug} type={m.type} />{m.libelle}
            </button>
          ))}
        </nav>
        )}
      </header>

      <div className="vitrine-fil" ref={fil}>
        {items == null && <div className="vitrine-page vitrine-chargement" />}
        {items != null && groupes.length === 0 && <PageVide metier={metier} nom={nomMetier} />}
        {groupes.map((g, k) => (
          <PagePro key={g.pro.pro_id} k={k} km={distance(g.pro)} charger={Math.abs(k - actif) <= 1} enCours={k === actif} g={g} son={son} basculerSon={() => setSon((x) => !x)}
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

function PagePro({ k, km, charger, enCours, g, son, basculerSon, depart }: { k: number; km: number | null; charger: boolean; enCours: boolean; g: Groupe; son: boolean; basculerSon: () => void; depart: number }) {
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
  const signaler = lienWhatsApp(NUMERO_CONTACT_TEMPORAIRE ?? "",
    `Bonjour ServiLink, je signale une publication de la Vitrine : ${p.pro_nom} (réf. ${p.reference}), média ${m.id}. Raison : `);
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
              ? <video src={charger ? x.url : undefined} poster={x.vignette ?? undefined} loop playsInline muted={!son} preload={enCours && n === i ? "auto" : charger ? "metadata" : "none"} onTimeUpdate={(e) => {
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
        {signaler && <a href={signaler} target="_blank" rel="noopener" className="vitrine-action vitrine-signaler" aria-label="Signaler cette publication à ServiLink"><span><Flag size={18} aria-hidden="true" /></span>Signaler</a>}
      </div>

      <Link href={`/pro/${p.pro_id}`} className="vitrine-infos">
        <strong>{p.pro_nom}</strong>
        <span>{p.metier} · {p.lieu}{km != null && (km < 1 ? " · à moins d'1 km" : ` · à ${String(km).replace(".", ",")} km`)}</span>
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
        <p>Les professionnels montrent leur travail ici, après vérification par ServiLink.</p>
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
