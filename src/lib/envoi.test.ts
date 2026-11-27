import { describe, expect, it } from "vitest";
import { envoyerReprenable, MORCEAU, type Requete, type Transport } from "./envoiReprenable";
import { problemeFichier, reduire } from "./preparerMedia";

const memoire = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => memoire.get(k) ?? null, setItem: (k: string, v: string) => void memoire.set(k, v), removeItem: (k: string) => void memoire.delete(k),
};

/** Faux serveur TUS : garde les octets reçus, et peut couper la connexion sur certains morceaux. */
function serveur(coupures: number[] = []) {
  let recu = 0; let patchs = 0; const journal: string[] = [];
  const t: Transport = async (r: Requete) => {
    journal.push(r.methode);
    const rep = (statut: number, h: Record<string, string> = {}) => ({ statut, entete: (n: string) => h[n.toLowerCase()] ?? null });
    if (r.methode === "POST") return rep(201, { location: "/storage/v1/upload/resumable/abc" });
    if (r.methode === "HEAD") return rep(200, { "upload-offset": String(recu) });
    patchs++;
    if (coupures.includes(patchs)) throw new Error("reseau");
    expect(Number(r.entetes["upload-offset"])).toBe(recu);
    recu += r.corps!.size;
    return rep(204, { "upload-offset": String(recu) });
  };
  return { t, journal, recu: () => recu };
}
const fichier = (o: number) => new File([new Uint8Array(o)], "chantier.mp4", { type: "video/mp4", lastModified: 1 });
const base = { base: "https://x.supabase.co", jeton: "j", cleAnon: "a", bucket: "realisations", chemin: "envois/u/R1.mp4", pause: () => 0 };

describe("envoi qui reprend", () => {
  it("envoie en morceaux de 6 Mo et suit la progression", async () => {
    const s = serveur(); const parts: number[] = [];
    const chemin = await envoyerReprenable({ ...base, fichier: fichier(MORCEAU * 2 + 10), transport: s.t, progres: (p) => parts.push(p) });
    expect(chemin).toBe("envois/u/R1.mp4");
    expect(s.recu()).toBe(MORCEAU * 2 + 10);
    expect(s.journal).toEqual(["POST", "PATCH", "PATCH", "PATCH"]);
    expect(parts.at(-1)).toBe(1);
  });
  it("reprend après une coupure sans renvoyer ce qui est déjà parti", async () => {
    memoire.clear();
    const s = serveur([2]);
    await envoyerReprenable({ ...base, fichier: fichier(MORCEAU * 3), transport: s.t });
    expect(s.recu()).toBe(MORCEAU * 3);
    expect(s.journal).toEqual(["POST", "PATCH", "PATCH", "HEAD", "PATCH", "PATCH"]);
    expect(memoire.size).toBe(0); // rien ne reste sur le téléphone une fois fini
  });
  it("abandonne après trop de coupures, et garde de quoi reprendre", async () => {
    memoire.clear();
    const s = serveur([1, 2, 3]);
    await expect(envoyerReprenable({ ...base, fichier: fichier(MORCEAU + 1), transport: s.t, essais: 2 })).rejects.toThrow("reseau");
    expect(memoire.size).toBe(1);
  });
});

describe("envoi vers Bunny Stream", () => {
  it("utilise l'adresse, la signature et les métadonnées de Bunny", async () => {
    memoire.clear();
    const vues: Requete[] = [];
    const t: Transport = async (r) => {
      vues.push(r);
      const rep = (statut: number, h: Record<string, string> = {}) => ({ statut, entete: (n: string) => h[n.toLowerCase()] ?? null });
      if (r.methode === "POST") return rep(201, { location: "https://video.bunnycdn.com/tusupload/xyz" });
      return rep(204, { "upload-offset": String(r.corps!.size) });
    };
    const chemin = await envoyerReprenable({ ...base, chemin: "bunny/v1", fichier: fichier(1000), transport: t,
      cible: { url: "https://video.bunnycdn.com/tusupload", entetes: { AuthorizationSignature: "sig", VideoId: "v1" }, metadonnees: { filetype: "video/mp4", title: "v1" } } });
    expect(chemin).toBe("bunny/v1");
    expect(vues[0].url).toBe("https://video.bunnycdn.com/tusupload");
    expect(vues[0].entetes.AuthorizationSignature).toBe("sig");
    expect(vues[0].entetes.authorization).toBeUndefined(); // le jeton Supabase ne part jamais chez Bunny
    expect(vues[0].entetes["upload-metadata"]).toBe(`filetype ${btoa("video/mp4")},title ${btoa("v1")}`);
    expect(vues[1].url).toBe("https://video.bunnycdn.com/tusupload/xyz");
  });
});

describe("préparation des médias", () => {
  it("refuse les fichiers non pris ou trop lourds", () => {
    expect(problemeFichier({ type: "video/mp4", size: 1000 })).toBeNull();
    expect(problemeFichier({ type: "application/pdf", size: 1000 })).toMatch(/photo ou une vidéo/);
    expect(problemeFichier({ type: "video/x-msvideo", size: 1000 })).toMatch(/format/);
    expect(problemeFichier({ type: "video/mp4", size: 300 * 1024 * 1024 })).toMatch(/trop lourd/);
  });
  it("réduit les photos à 1600 px de côté au plus", () => {
    expect(reduire(4000, 3000, 1600)).toEqual([1600, 1200]);
    expect(reduire(800, 600, 1600)).toEqual([800, 600]);
  });
});
