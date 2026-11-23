import { numeroInternational } from "./format";

/** Remplace {nom}, {id}, {code}… dans un message réglé dans le back-office. */
export function remplir(modele: string, valeurs: Record<string, string | number>): string {
  return modele.replace(/\{(\w+)\}/g, (_, k: string) => (k in valeurs ? String(valeurs[k]) : `{${k}}`));
}

/** Lien wa.me avec message pré-rempli (D3 : pas d'API payante en V1). */
export function lienWhatsApp(numero: string | null | undefined, message: string): string | null {
  const n = numeroInternational(numero);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function lienAppel(numero: string | null | undefined): string | null {
  const n = numeroInternational(numero);
  return n ? `tel:+${n}` : null;
}

/**
 * TEMPORAIRE (demande de Tammy44, 23/11/2026) : tous les boutons de contact (WhatsApp, Appeler)
 * mènent à ce numéro de ServiLink, qui met en relation, tant que les pros ne sont pas vérifiés.
 * Mettre null pour revenir aux numéros des pros.
 */
export const NUMERO_CONTACT_TEMPORAIRE: string | null = "+228 90 00 08 37";

/** Message WhatsApp quand le contact passe par ServiLink plutôt que par le pro. */
export const messageViaServiLink = (nom: string, ref: string) =>
  `Bonjour ServiLink, je souhaite contacter ${nom} (fiche ${ref}) que j'ai vu sur l'appli.`;
