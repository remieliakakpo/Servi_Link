// Préparation des médias sur le téléphone, avant l'envoi : contrôle, photo allégée, image de couverture des vidéos.
// Tout se fait dans le navigateur : rien ne part tant que le pro n'a pas appuyé sur « Envoyer ».

/** 200 Mo par fichier, comme le bucket « realisations ». */
export const TAILLE_MAX = 200 * 1024 * 1024;
const TYPES = /^(image\/(jpeg|png|webp|heic|heif)|video\/(mp4|quicktime|webm|3gpp))$/;

const PAR_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif",
  mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm", "3gp": "video/3gpp",
};
/** Certaines galeries Android donnent un fichier sans type : on le déduit de l'extension. */
export function typeDeduit(f: File): File {
  const t = PAR_EXTENSION[(f.name.split(".").pop() ?? "").toLowerCase()];
  if (t && (!f.type || f.type === "application/octet-stream" || (f.type === "video/x-m4v" && t === "video/mp4"))) return new File([f], f.name, { type: t, lastModified: f.lastModified });
  return f;
}

/** Message simple si le fichier ne peut pas être envoyé, sinon null. */
export function problemeFichier(f: { type: string; size: number }): string | null {
  if (!TYPES.test(f.type)) return f.type.startsWith("image/") || f.type.startsWith("video/")
    ? "Ce format n'est pas pris. Filmez ou photographiez directement avec l'appareil."
    : "Choisissez une photo ou une vidéo.";
  if (f.size > TAILLE_MAX) return "Ce fichier est trop lourd (200 Mo au plus). Filmez moins longtemps.";
  if (f.size === 0) return "Ce fichier est vide.";
  return null;
}

function charger(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
}
function enJpeg(c: HTMLCanvasElement, qualite: number): Promise<Blob | null> {
  return new Promise((ok) => c.toBlob(ok, "image/jpeg", qualite));
}
/** Taille réduite pour que le plus grand côté fasse au plus `max` pixels. */
export function reduire(l: number, h: number, max: number): [number, number] {
  const k = Math.min(1, max / Math.max(l, h));
  return [Math.round(l * k), Math.round(h * k)];
}

/**
 * Photo allégée : 1600 px au plus, en JPEG. Une photo de téléphone passe de 3 à 6 Mo à environ 300 Ko,
 * ce qui s'envoie vite en 4G. Si le navigateur ne sait pas la lire (HEIC sur Android par exemple), on garde l'original.
 */
export async function compresserPhoto(f: File, max = 1600): Promise<File> {
  if (!f.type.startsWith("image/") || f.size < 350 * 1024) return f;
  const url = URL.createObjectURL(f);
  try {
    const img = await charger(url);
    const [l, h] = reduire(img.naturalWidth, img.naturalHeight, max);
    const c = document.createElement("canvas");
    c.width = l; c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, l, h);
    const b = await enJpeg(c, 0.82);
    if (!b || b.size >= f.size) return f;
    return new File([b], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg", lastModified: f.lastModified });
  } catch { return f; } finally { URL.revokeObjectURL(url); }
}

/** Image de couverture d'une vidéo (vers la première seconde), 540 px au plus. null si le navigateur n'y arrive pas. */
export function vignetteVideo(f: File, max = 540): Promise<Blob | null> {
  if (!f.type.startsWith("video/")) return Promise.resolve(null);
  return new Promise((ok) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(f);
    let fini = false;
    const finir = (b: Blob | null) => { if (fini) return; fini = true; clearTimeout(t); URL.revokeObjectURL(url); v.removeAttribute("src"); v.load(); ok(b); };
    const t = setTimeout(() => finir(null), 8000);
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); };
    v.onseeked = async () => {
      try {
        const [l, h] = reduire(v.videoWidth, v.videoHeight, max);
        if (!l || !h) return finir(null);
        const c = document.createElement("canvas");
        c.width = l; c.height = h;
        c.getContext("2d")!.drawImage(v, 0, 0, l, h);
        finir(await enJpeg(c, 0.75));
      } catch { finir(null); }
    };
    v.onerror = () => finir(null);
    v.src = url;
  });
}
