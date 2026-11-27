import "server-only";
import { createHash } from "node:crypto";

// Bunny Stream, côté serveur seulement : la clé API ne quitte jamais le serveur (variable BUNNY_STREAM_API_KEY de Vercel).
// Le téléphone reçoit une autorisation signée, valable 2 heures, pour envoyer UNE vidéo directement chez Bunny.
const API = "https://video.bunnycdn.com";
export const bunnyConfigure = () => Boolean(process.env.BUNNY_STREAM_LIBRARY_ID && process.env.BUNNY_STREAM_API_KEY);
const lib = () => process.env.BUNNY_STREAM_LIBRARY_ID!;
const cle = () => process.env.BUNNY_STREAM_API_KEY!;

async function appel(chemin: string, init: RequestInit = {}) {
  const r = await fetch(`${API}/library/${lib()}${chemin}`, {
    ...init, headers: { AccessKey: cle(), accept: "application/json", "content-type": "application/json", ...init.headers }, cache: "no-store",
  });
  if (!r.ok && r.status !== 404) throw new Error(`bunny ${r.status}`);
  return r.status === 404 ? null : r.json().catch(() => ({}));
}

/** Signature TUS de Bunny : sha256(bibliothèque + clé + expiration + vidéo). */
export function autorisation(videoId: string) {
  const expire = Math.floor(Date.now() / 1000) + 2 * 3600;
  const signature = createHash("sha256").update(lib() + cle() + expire + videoId).digest("hex");
  return { videoId, libraryId: lib(), expire, signature };
}

/** Crée une vidéo vide chez Bunny, au nom de l'utilisateur (le titre commence par son identifiant). */
export async function creerVideo(userId: string): Promise<string> {
  const v = await appel("/videos", { method: "POST", body: JSON.stringify({ title: `${userId}:${new Date().toISOString()}` }) });
  if (!v?.guid) throw new Error("bunny creation");
  return v.guid as string;
}

/** Une vidéo peut être reprise seulement par celui qui l'a créée, et seulement tant que son envoi n'est pas fini. */
export async function repriseAutorisee(videoId: string, userId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(videoId)) return false;
  const v = await appel(`/videos/${videoId}`);
  return Boolean(v && String(v.title ?? "").startsWith(`${userId}:`) && (v.status === 0 || v.status === 6 /* envoi en cours ou échoué */));
}

export async function supprimerVideo(videoId: string) {
  if (/^[0-9a-f-]{36}$/i.test(videoId)) await appel(`/videos/${videoId}`, { method: "DELETE" });
}
