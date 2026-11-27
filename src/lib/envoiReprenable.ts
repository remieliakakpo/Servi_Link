// Envoi « qui reprend » des grosses vidéos (protocole TUS de Supabase Storage).
// Le fichier part en morceaux de 6 Mo. Si la 4G coupe, l'envoi reprend là où il s'était arrêté, sans tout renvoyer,
// même si le pro ferme la page et rechoisit la même vidéo plus tard (l'adresse de l'envoi est gardée sur le téléphone).

export const MORCEAU = 6 * 1024 * 1024; // taille imposée par Supabase

export type Requete = { methode: "POST" | "PATCH" | "HEAD" | "DELETE"; url: string; entetes: Record<string, string>; corps?: Blob };
export type Reponse = { statut: number; entete: (nom: string) => string | null };
/** Envoie une requête et signale les octets déjà partis (pour la barre de progression). */
export type Transport = (r: Requete, progres?: (octets: number) => void) => Promise<Reponse>;

const transportXhr: Transport = (r, progres) => new Promise((ok, ko) => {
  const x = new XMLHttpRequest();
  x.open(r.methode, r.url);
  for (const [k, v] of Object.entries(r.entetes)) x.setRequestHeader(k, v);
  if (progres) x.upload.onprogress = (e) => progres(e.loaded);
  x.onload = () => ok({ statut: x.status, entete: (n) => x.getResponseHeader(n) });
  x.onerror = () => ko(new Error("reseau"));
  x.ontimeout = () => ko(new Error("reseau"));
  x.send(r.corps ?? null);
});

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
const attendre = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
const cleLocale = (f: File, chemin: string) => `slk-tus:${chemin.split("/").slice(0, 2).join("/")}:${f.name}:${f.size}:${f.lastModified}`;

function lire(cle: string): { url: string; chemin: string } | null {
  try { return JSON.parse(localStorage.getItem(cle) ?? "null"); } catch { return null; }
}
function ecrire(cle: string, v: { url: string; chemin: string } | null) {
  try { if (v) localStorage.setItem(cle, JSON.stringify(v)); else localStorage.removeItem(cle); } catch { /* stockage indisponible */ }
}

export type OptionsEnvoi = {
  base: string; // URL du projet Supabase
  jeton: string; // jeton de session de l'utilisateur
  cleAnon: string;
  bucket: string;
  chemin: string; // chemin voulu dans le bucket (gardé si un envoi précédent de ce fichier est repris)
  /** Autre destination TUS (Bunny Stream) : adresse d'envoi, en-têtes d'autorisation et métadonnées propres au service. */
  cible?: { url: string; entetes: Record<string, string>; metadonnees: Record<string, string> };
  fichier: File;
  progres?: (part: number) => void; // 0 à 1
  transport?: Transport;
  essais?: number;
  pause?: (essai: number) => number; // ms avant de réessayer
};

/** Envoie le fichier et rend le chemin où il a été rangé. */
export async function envoyerReprenable(o: OptionsEnvoi): Promise<string> {
  const t = o.transport ?? transportXhr;
  const essais = o.essais ?? 6;
  const pause = o.pause ?? ((n) => Math.min(30000, 1000 * 2 ** n));
  const commun: Record<string, string> = o.cible
    ? { ...o.cible.entetes, "tus-resumable": "1.0.0" }
    : { authorization: `Bearer ${o.jeton}`, apikey: o.cleAnon, "tus-resumable": "1.0.0" };
  const cle = cleLocale(o.fichier, o.chemin);
  const taille = o.fichier.size;
  let reprise = lire(cle);
  let chemin = reprise?.chemin ?? o.chemin;
  let url = reprise?.url ?? null;
  let decalage = 0;
  let rate = 0;

  while (true) {
    try {
      if (url) {
        const h = await t({ methode: "HEAD", url, entetes: commun });
        if (h.statut >= 200 && h.statut < 300) decalage = Number(h.entete("upload-offset") ?? 0);
        else { url = null; reprise = null; chemin = o.chemin; ecrire(cle, null); } // envoi expiré : on recommence
      }
      if (!url) {
        const meta = o.cible?.metadonnees ?? { bucketName: o.bucket, objectName: chemin, contentType: o.fichier.type, cacheControl: "31536000" };
        const c = await t({
          methode: "POST", url: o.cible?.url ?? `${o.base}/storage/v1/upload/resumable`,
          entetes: {
            ...commun, "upload-length": String(taille), ...(o.cible ? {} : { "x-upsert": "false" }),
            "upload-metadata": Object.entries(meta).map(([k, v]) => `${k} ${b64(v)}`).join(","),
          },
        });
        if (c.statut === 409) { ecrire(cle, null); return chemin; } // déjà entièrement envoyé
        if (c.statut === 401 || c.statut === 403) throw Object.assign(new Error("connexion"), { definitif: true });
        if (c.statut === 413) throw Object.assign(new Error("trop_lourd"), { definitif: true });
        const lieu = c.entete("location");
        if (c.statut !== 201 || !lieu) throw new Error(`creation ${c.statut}`);
        url = new URL(lieu, o.cible?.url ?? o.base).toString();
        decalage = 0;
        ecrire(cle, { url, chemin });
      }
      while (decalage < taille) {
        const fin = Math.min(taille, decalage + MORCEAU);
        const depart = decalage;
        const r = await t(
          { methode: "PATCH", url, entetes: { ...commun, "upload-offset": String(depart), "content-type": "application/offset+octet-stream" }, corps: o.fichier.slice(depart, fin) },
          (n) => o.progres?.((depart + n) / taille),
        );
        if (r.statut === 401 || r.statut === 403) throw Object.assign(new Error("connexion"), { definitif: true });
        if (r.statut < 200 || r.statut >= 300) throw new Error(`morceau ${r.statut}`);
        decalage = Number(r.entete("upload-offset") ?? fin);
        rate = 0; // un morceau est passé : on repart avec tous les essais
        o.progres?.(decalage / taille);
      }
      ecrire(cle, null);
      return chemin;
    } catch (e) {
      if ((e as { definitif?: boolean }).definitif || ++rate > essais) throw e;
      await attendre(pause(rate));
    }
  }
}
