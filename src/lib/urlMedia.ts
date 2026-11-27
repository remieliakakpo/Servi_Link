// Adresse publique d'un média de la Vitrine à partir de son chemin en base.
// « bunny/<id> » : vidéo chez Bunny Stream (version MP4 480p, légère en 4G) ; sinon : fichier du stockage Supabase.
const CDN = process.env.NEXT_PUBLIC_BUNNY_CDN;
export function urlMedia(chemin: string): string {
  const b = /^bunny\/([0-9a-f-]{36})(\/thumbnail\.jpg)?$/i.exec(chemin);
  if (b && CDN) return `https://${CDN}/${b[1]}/${b[2] ? "thumbnail.jpg" : "play_480p.mp4"}`;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/realisations/${chemin}`;
}
