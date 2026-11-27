"use client";
// Vitrine : photos et vidéos courtes du travail des pros, vérifiées par ServiLink avant publication.
// Deux portes d'entrée pour les médias :
//  - le pro publie depuis l'appli (un bouton, la caméra du téléphone) : « à vérifier », fiche à rattacher ;
//  - le pro envoie sur le WhatsApp de ServiLink : l'équipe ajoute les médias dans le back-office.
// Base Supabase branchée : bucket « realisations » + table realisations + vue vitrine_public (migration 0004).
// Mode démo : les médias restent dans le téléphone qui les a ajoutés (IndexedDB). Rien n'est inventé.
import { supabaseNavigateur } from "./supabase/navigateur";
import type { ItemVitrine } from "./types";
import { compresserPhoto, problemeFichier, vignetteVideo } from "./preparerMedia";
import { envoyerReprenable, MORCEAU } from "./envoiReprenable";
import { urlMedia } from "./urlMedia";

export type Etiquette = "avant" | "en_cours" | "termine";
export type StatutRealisation = "a_verifier" | "en_ligne" | "refusee";
/** Pro auquel une réalisation est rattachée (copié pour que le fil se suffise à lui-même). */
export type ProRattache = { id: string; nom: string; metier: string; metier_slug: string | null; type: "Artisan" | "Fournisseur"; lieu: string; reference: string; lat?: number | null; lng?: number | null };
/** Ce que le pro donne quand il publie depuis l'appli, pour que l'équipe retrouve sa fiche. */
export type Envoyeur = { nom: string; telephone: string };

export type Realisation = {
  id: string; pro: ProRattache | null; envoyeur: Envoyeur | null; source: "whatsapp" | "appli";
  type: "photo" | "video"; url: string; etiquette: Etiquette | null; legende: string | null;
  statut: StatutRealisation; motif: string | null; recu_le: string; publie_le: string | null; duree: number | null;
  vignette: string | null;
};

export const ETIQUETTES: { cle: Etiquette; texte: string }[] = [
  { cle: "avant", texte: "Avant" }, { cle: "en_cours", texte: "En cours" }, { cle: "termine", texte: "Terminé" },
];
export const texteEtiquette = (e: Etiquette | null) => ETIQUETTES.find((x) => x.cle === e)?.texte ?? null;

export const MOTIFS_REFUS = [
  "Ce n'est pas son travail", "Hors sujet (pas un chantier ni un produit)", "Image floue ou trop sombre",
  "Vidéo trop longue (5 min au plus)", "Numéro, prix ou publicité dans l'image", "Autre",
];

/** Durée maximale d'une vidéo : 5 minutes (demande de Tammy44, 27/11/2026). */
export const DUREE_MAX = 300;
/** « 5 min », « 1 min 30 », « 45 s » */
export const texteDuree = (s: number) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${String(s % 60).padStart(2, "0")}` : ""}`);

const demo = () => !process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = "realisations";

// ---------------------------------------------------------------- Mode démo : IndexedDB
type Ligne = Omit<Realisation, "url" | "vignette"> & { blob: Blob; vignetteBlob?: Blob | null };
const BASE = "slk-vitrine", MAGASIN = "medias";

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(MAGASIN, { keyPath: "id" });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}
async function magasin<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ouvrir();
  return new Promise((ok, ko) => {
    const req = f(db.transaction(MAGASIN, mode).objectStore(MAGASIN));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => ko(req.error);
  });
}
const urls = new Map<string, string>();
const versRealisation = ({ blob, vignetteBlob, ...l }: Ligne): Realisation => {
  if (!urls.has(l.id)) urls.set(l.id, URL.createObjectURL(blob));
  if (vignetteBlob && !urls.has(`${l.id}-v`)) urls.set(`${l.id}-v`, URL.createObjectURL(vignetteBlob));
  return { ...l, url: urls.get(l.id)!, vignette: urls.get(`${l.id}-v`) ?? null };
};
async function lignesLocales(): Promise<Realisation[]> {
  try { return ((await magasin("readonly", (s) => s.getAll())) as Ligne[]).map(versRealisation).sort((a, b) => b.recu_le.localeCompare(a.recu_le)); }
  catch { return []; }
}

// ---------------------------------------------------------------- Base : conversion des lignes
type LigneBase = {
  id: string; professionnel_id: string | null; type: "photo" | "video"; chemin: string; vignette: string | null; etiquette: Etiquette | null; legende: string | null;
  statut: StatutRealisation; motif: string | null; duree: number | null; source: "whatsapp" | "appli"; recu_le: string; publie_le: string | null;
  envoyeur_nom: string | null; envoyeur_tel: string | null;
  pro: { nom: string; metier: string | null; metier_slug: string | null; type: "Artisan" | "Fournisseur"; quartier: string | null } | null;
};
const urlBase = urlMedia;
const depuisBase = (r: LigneBase): Realisation => ({
  id: r.id, source: r.source, type: r.type, url: urlBase(r.chemin), vignette: r.vignette ? urlBase(r.vignette) : null, etiquette: r.etiquette, legende: r.legende,
  statut: r.statut, motif: r.motif, recu_le: r.recu_le, publie_le: r.publie_le, duree: r.duree,
  envoyeur: r.envoyeur_nom || r.envoyeur_tel ? { nom: r.envoyeur_nom ?? "", telephone: r.envoyeur_tel ?? "" } : null,
  pro: r.professionnel_id && r.pro ? {
    id: r.professionnel_id, nom: r.pro.nom, metier: r.pro.metier ?? "", metier_slug: r.pro.metier_slug, type: r.pro.type,
    lieu: r.pro.quartier ?? "Grand Lomé", reference: r.professionnel_id,
  } : null,
});
const SELECTION = "*, pro:professionnels(nom, metier, metier_slug, type, quartier)";

// ---------------------------------------------------------------- Lecture
/** Toutes les réalisations (équipe), les plus récentes d'abord. */
export async function toutesRealisations(): Promise<Realisation[]> {
  if (demo()) return lignesLocales();
  const { data, error } = await supabaseNavigateur()!.from("realisations").select(SELECTION).order("recu_le", { ascending: false });
  if (error) throw error;
  return (data as LigneBase[]).map(depuisBase);
}

/** Fil de la Vitrine en mode démo : ce qui a été publié depuis ce téléphone. En base, le serveur fournit le fil. */
export async function filLocal(): Promise<ItemVitrine[]> {
  if (!demo()) return [];
  return (await lignesLocales()).filter((r) => r.statut === "en_ligne" && r.pro).map((r) => ({
    id: r.id, type: r.type, url: r.url, vignette: r.vignette, etiquette: r.etiquette, legende: r.legende, publie_le: r.publie_le, duree: r.duree,
    pro_id: r.pro!.id, pro_nom: r.pro!.nom, metier: r.pro!.metier, metier_slug: r.pro!.metier_slug, type_pro: r.pro!.type,
    lieu: r.pro!.lieu, reference: r.pro!.reference, lat: r.pro!.lat ?? null, lng: r.pro!.lng ?? null,
  })).sort((a, b) => (b.publie_le ?? "").localeCompare(a.publie_le ?? ""));
}

/** Ce que ce pro a publié depuis l'appli (Mes publications). */
export async function mesEnvois(): Promise<Realisation[]> {
  if (demo()) return (await lignesLocales()).filter((r) => r.source === "appli");
  const sb = supabaseNavigateur()!;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data } = await sb.from("realisations").select(SELECTION).eq("envoye_par", user.id).order("recu_le", { ascending: false });
  return ((data ?? []) as LigneBase[]).map(depuisBase);
}

// ---------------------------------------------------------------- Écriture
const nouvelId = () => `R${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

/** Durée d'une vidéo en secondes (lue par le navigateur), null pour une photo ou si illisible. */
export function dureeVideo(fichier: File): Promise<number | null> {
  if (!fichier.type.startsWith("video/")) return Promise.resolve(null);
  return new Promise((ok) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(fichier);
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); ok(Number.isFinite(v.duration) ? Math.round(v.duration) : null); };
    v.onerror = () => { URL.revokeObjectURL(url); ok(null); };
    v.src = url;
  });
}

type Nouvelle = { fichier: File; pro: ProRattache | null; envoyeur: Envoyeur | null; etiquette: Etiquette | null; legende?: string; statut: StatutRealisation; source: "whatsapp" | "appli" };
/** Où en est l'envoi : préparation (photo allégée, couverture), puis part envoyée de 0 à 1. */
export type Avancement = (etape: "preparation" | "envoi", part: number) => void;

async function creer(n: Nouvelle, avancement?: Avancement): Promise<void> {
  const probleme = problemeFichier(n.fichier);
  if (probleme) throw new Error(probleme);
  avancement?.("preparation", 0);
  const fichier = await compresserPhoto(n.fichier);
  const video = fichier.type.startsWith("video/");
  const [duree, couverture] = await Promise.all([dureeVideo(fichier), video ? vignetteVideo(fichier) : Promise.resolve(null)]);
  const maintenant = new Date().toISOString();
  const meta = {
    id: nouvelId(), pro: n.pro, envoyeur: n.envoyeur, source: n.source,
    type: video ? "video" as const : "photo" as const,
    etiquette: n.etiquette, legende: n.legende?.trim().slice(0, 120) || null, statut: n.statut, motif: null,
    recu_le: maintenant, publie_le: n.statut === "en_ligne" ? maintenant : null, duree,
  };
  if (demo()) {
    avancement?.("envoi", 1);
    await magasin("readwrite", (s) => s.put({ ...meta, blob: fichier, vignetteBlob: couverture }));
    return;
  }
  const sb = supabaseNavigateur()!;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error("connexion");
  const ext = (fichier.name.split(".").pop() ?? (video ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || (video ? "mp4" : "jpg");
  const dossier = n.pro?.id ?? `envois/${session.user.id}`;
  let chemin = `${dossier}/${meta.id}.${ext}`;
  avancement?.("envoi", 0);
  let vignetteBunny: string | null = null;
  if (video && process.env.NEXT_PUBLIC_BUNNY_CDN) {
    // Vidéo : directement chez Bunny Stream, qui la compresse en plusieurs qualités (le serveur signe l'envoi)
    const cleReprise = `slk-bunny:${fichier.name}:${fichier.size}:${fichier.lastModified}`;
    let precedente: string | null = null;
    try { precedente = localStorage.getItem(cleReprise); } catch { /* stockage indisponible */ }
    const r = await fetch("/api/video/autoriser", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ videoId: precedente }) });
    if (r.status === 401) throw new Error("connexion");
    if (r.status === 429) throw new Error("limite");
    if (!r.ok) throw new Error("service");
    const a = await r.json() as { videoId: string; libraryId: string; expire: number; signature: string };
    try { localStorage.setItem(cleReprise, a.videoId); } catch { /* stockage indisponible */ }
    chemin = await envoyerReprenable({
      base: "", cleAnon: "", jeton: "", bucket: "", chemin: `bunny/${a.videoId}`, fichier, progres: (p) => avancement?.("envoi", p),
      cible: {
        url: "https://video.bunnycdn.com/tusupload",
        entetes: { AuthorizationSignature: a.signature, AuthorizationExpire: String(a.expire), VideoId: a.videoId, LibraryId: a.libraryId },
        metadonnees: { filetype: fichier.type, title: a.videoId },
      },
    });
    try { localStorage.removeItem(cleReprise); } catch { /* stockage indisponible */ }
    vignetteBunny = `${chemin}/thumbnail.jpg`; // Bunny fabrique l'image de couverture
  } else if (fichier.size > MORCEAU) {
    // Grosse vidéo : envoi en morceaux, qui reprend tout seul si la connexion coupe
    chemin = await envoyerReprenable({
      base: process.env.NEXT_PUBLIC_SUPABASE_URL!, cleAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, jeton: session.access_token,
      bucket: BUCKET, chemin, fichier, progres: (p) => avancement?.("envoi", p),
    });
  } else {
    const up = await sb.storage.from(BUCKET).upload(chemin, fichier, { contentType: fichier.type, cacheControl: "31536000" });
    if (up.error) throw up.error;
  }
  avancement?.("envoi", 1);
  let vignette: string | null = vignetteBunny;
  if (couverture && !vignetteBunny) {
    const v = `${dossier}/${chemin.split("/").pop()!.replace(/\.\w+$/, "")}-v.jpg`;
    const r = await sb.storage.from(BUCKET).upload(v, couverture, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (!r.error) vignette = v; // sans couverture, la vidéo s'affiche quand même
  }
  const { error } = await sb.from("realisations").insert({
    id: chemin.split("/").pop()!.replace(/\.\w+$/, ""), professionnel_id: n.pro?.id ?? null, type: meta.type, chemin, vignette,
    etiquette: meta.etiquette, legende: meta.legende,
    statut: meta.statut, duree: meta.duree, source: meta.source, publie_le: meta.publie_le,
    envoyeur_nom: n.envoyeur?.nom.slice(0, 80) || null, envoyeur_tel: n.envoyeur?.telephone.slice(0, 20) || null,
  });
  if (error) throw new Error(error.message.includes("limite_envois") ? "limite" : error.message);
}

/** Équipe : médias reçus sur WhatsApp, rattachés à une fiche. */
export const ajouterRealisation = (n: Omit<Nouvelle, "source" | "envoyeur">) => creer({ ...n, envoyeur: null, source: "whatsapp" });

/** Pro : publication depuis l'appli, toujours « à vérifier » ; l'équipe retrouve sa fiche grâce à son numéro. */
export const publierDepuisAppli = (fichier: File, etiquette: Etiquette | null, envoyeur: Envoyeur, avancement?: Avancement) =>
  creer({ fichier, etiquette, envoyeur, pro: null, statut: "a_verifier", source: "appli" }, avancement);

export async function modifierRealisation(id: string, maj: { statut?: StatutRealisation; motif?: string | null; pro?: ProRattache }): Promise<void> {
  const patch = { ...maj, ...(maj.statut === "en_ligne" ? { publie_le: new Date().toISOString(), motif: null } : {}) };
  if (demo()) {
    const l = (await magasin("readonly", (s) => s.get(id))) as Ligne | undefined;
    if (l) await magasin("readwrite", (s) => s.put({ ...l, ...patch }));
    return;
  }
  const { pro, ...reste } = patch;
  const { error } = await supabaseNavigateur()!.from("realisations").update({ ...reste, ...(pro ? { professionnel_id: pro.id } : {}) }).eq("id", id);
  if (error) throw error;
}

export async function supprimerRealisation(r: Realisation): Promise<void> {
  if (demo()) { await magasin("readwrite", (s) => s.delete(r.id)); urls.delete(r.id); urls.delete(`${r.id}-v`); return; }
  const sb = supabaseNavigateur()!;
  const { data } = await sb.from("realisations").delete().eq("id", r.id).select("chemin, vignette").maybeSingle();
  if (data?.chemin?.startsWith("bunny/")) {
    await fetch("/api/video/supprimer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ videoId: data.chemin.slice(6) }) }).catch(() => {});
  } else if (data?.chemin) await sb.storage.from(BUCKET).remove([data.chemin, ...(data.vignette ? [data.vignette] : [])]);
}

/** Message WhatsApp prérempli pour qu'un pro envoie ses médias à ServiLink. */
export const messageEnvoiRealisations = (nom?: string, reference?: string) =>
  `Bonjour ServiLink, voici des photos et vidéos de mon travail${nom ? ` pour ma fiche ${nom}${reference ? ` (réf. ${reference})` : ""}` : ""}. `;
