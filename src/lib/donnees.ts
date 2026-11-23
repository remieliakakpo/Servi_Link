import "server-only";
import { cache } from "react";
import { COEFFS_V1, type Coefficients } from "./calculateur";
import { DEMO_FICHES, DEMO_METIERS, DEMO_PRIX, DEMO_QUARTIERS, DEMO_SERIE_CIMENT, DEMO_SPONSO, demoListe } from "./demo";
import { distanceKm } from "./geo";
import { supabaseConfigure, supabaseServeur } from "./supabase/server";
import type { Avis, Fiche, Metier, Photo, PrixMateriau, ProListe, Quartier, Recherche, Tarif } from "./types";

// Accès aux données publiques. Tout passe par les vues filtrées et rechercher_annuaire() :
// le code de l'appli publique ne lit jamais une table directement.

export const modeDemo = !supabaseConfigure;

export const metiers = cache(async (): Promise<Metier[]> => {
  if (modeDemo) return DEMO_METIERS;
  const sb = await supabaseServeur();
  const { data, error } = await sb.from("metiers_public").select("slug, libelle, type").eq("domaine", "BTP").order("ordre");
  if (error) throw error;
  return data;
});

export const quartiers = cache(async (): Promise<Quartier[]> => {
  if (modeDemo) return DEMO_QUARTIERS;
  const sb = await supabaseServeur();
  const { data, error } = await sb.from("quartiers_public").select("nom, zone, lat, lng");
  if (error) throw error;
  return data;
});

export async function rechercher(r: Recherche): Promise<{ pros: ProListe[]; total: number }> {
  if (modeDemo) {
    const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const mots = norm(r.q ?? "").split(/\s+/).filter(Boolean);
    let pros = demoListe().filter((p) =>
      (!r.type || p.type === r.type) && (!r.metiers?.length || r.metiers.includes(p.metier_slug ?? "")) &&
      (!r.livraison || p.livraison === "Oui") &&
      (!r.quartier || norm(p.quartier ?? "") === norm(r.quartier)) &&
      mots.every((m) => norm(`${p.nom} ${p.metier} ${p.quartier ?? ""} ${p.adresse ?? ""}`).includes(m.replace(/s$/, ""))));
    if (r.lat != null && r.lng != null) {
      const moi = { lat: r.lat, lng: r.lng };
      pros = pros.map((p) => ({ ...p, distance_km: p.latitude != null ? distanceKm(moi, { lat: p.latitude, lng: p.longitude! }) : null }));
    }
    pros.sort((a, b) => r.tri === "distance" ? (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9)
      : r.tri === "experience" ? (b.annees_experience ?? -1) - (a.annees_experience ?? -1)
      : (b.note_moyenne ?? b.note_google ?? 0) - (a.note_moyenne ?? a.note_google ?? 0) || (b.avis_google ?? 0) - (a.avis_google ?? 0));
    const parPage = r.parPage ?? 20, page = r.page ?? 1;
    return { pros: pros.slice(0, page * parPage), total: pros.length };
  }
  const sb = await supabaseServeur();
  const { data, error } = await sb.rpc("rechercher_annuaire", {
    q: r.q ?? null, p_type: r.type ?? null, p_metiers: r.metiers?.length ? r.metiers : null, p_quartier: r.quartier ?? null,
    // « Voir 20 de plus » : on renvoie les pages 1 à N d'un coup (la liste s'allonge, pas de pagination)
    p_tri: r.tri ?? "note", p_lat: r.lat ?? null, p_lng: r.lng ?? null, p_page: 1,
    p_par_page: Math.min(500, (r.page ?? 1) * (r.parPage ?? 20)),
    p_livraison: r.livraison ?? false,
  });
  if (error) throw error;
  // Base réelle : seules les fiches vérifiées sont publiques
  const lignes = ((data ?? []) as (ProListe & { total: number })[]).map((l) => ({ ...l, verifie: true, note_google: null, avis_google: null, adresse: null }));
  return { pros: lignes, total: lignes[0]?.total ?? 0 };
}

export const fiche = cache(async (id: string): Promise<Fiche | null> => {
  if (modeDemo) {
    const f = DEMO_FICHES.find((x) => x.id === id);
    const l = demoListe().find((x) => x.id === id);
    return f && l ? { ...f, ...l, prix: DEMO_PRIX.filter((x) => x.professionnel_id === id) } : null;
  }
  const sb = await supabaseServeur();
  const [pro, tarifs, photos, avis, prix] = await Promise.all([
    sb.from("annuaire_public").select("*").eq("id", id).maybeSingle(),
    sb.from("tarifs_public").select("service, unite, prix_min, prix_max, frais_deplacement, date_releve, ancien").eq("professionnel_id", id).order("service"),
    sb.from("photos_public").select("chemin, legende, principale").eq("professionnel_id", id).order("principale", { ascending: false }).order("ordre"),
    sb.from("avis_public").select("id, prenom_client, created_at, commentaire, note").eq("professionnel_id", id).order("created_at", { ascending: false }).limit(30),
    sb.from("prix_materiaux_public").select("*").eq("professionnel_id", id).order("ordre"),
  ]);
  if (pro.error) throw pro.error;
  if (!pro.data) return null;
  const p = pro.data as Fiche;
  // Sans GPS, on situe la fiche au centre de son quartier (lien « Voir sur la carte »)
  const q = p.latitude == null ? (await quartiers()).find((x) => x.nom === p.quartier) : undefined;
  const t = (tarifs.data ?? []) as Tarif[];
  return {
    ...p, verifie: true, note_google: null, avis_google: null, adresse: null, distance_km: null, position_approx: p.latitude == null,
    latitude: p.latitude ?? q?.lat ?? null, longitude: p.longitude ?? q?.lng ?? null,
    prix_depart: t.reduce<number | null>((m, x) => (x.prix_min != null && (m == null || x.prix_min < m) ? x.prix_min : m), null),
    nb_produits: prix.data?.length ?? 0,
    tarifs: t, photos: (photos.data ?? []) as Photo[], avis: (avis.data ?? []) as Avis[], prix: (prix.data ?? []) as PrixMateriau[],
  };
});

/** Trois fiches du même métier, pour une fiche retirée ou expirée. */
export async function memeMetier(metier: string | null, sauf: string): Promise<ProListe[]> {
  if (!metier) return [];
  return (await rechercher({ metiers: [metier], parPage: 4 })).pros.filter((p) => p.id !== sauf).slice(0, 3);
}

export async function prixMateriaux(): Promise<PrixMateriau[]> {
  if (modeDemo) return DEMO_PRIX;
  const sb = await supabaseServeur();
  const { data, error } = await sb.from("prix_materiaux_public").select("*").order("ordre").order("prix");
  if (error) throw error;
  return data as PrixMateriau[];
}

export const parametres = cache(async (): Promise<Record<string, unknown>> => {
  const defauts = {
    whatsapp_servilink: "+228 90 00 08 37",
    message_contact_pro: "Bonjour {nom}, je vous contacte via ServiLink (fiche {id}). ",
    message_demande: "Bonjour ServiLink, je cherche ",
    message_liste: "Bonjour, voici ma liste de matériaux calculée sur ServiLink (code {code}) :",
    prix_jours_ancien: 14,
    prix_jours_masque: 30,
  };
  if (modeDemo) return defauts;
  const sb = await supabaseServeur();
  const { data } = await sb.from("parametres_public").select("cle, valeur");
  return { ...defauts, ...Object.fromEntries((data ?? []).map((p) => [p.cle, p.valeur])) };
});

export async function calculateurActif(): Promise<{ version: number; coefficients: Coefficients }> {
  if (modeDemo) return { version: 1, coefficients: COEFFS_V1 };
  const sb = await supabaseServeur();
  const { data } = await sb.from("calculateur_actif").select("version, coefficients").maybeSingle();
  return data ?? { version: 1, coefficients: COEFFS_V1 };
}

export { urlPhoto } from "./photos";

export type Sponso = { id: number; annonceur: string; titre: string; texte: string | null; image: string | null; lien: string };

/** Au plus un encart « Sponsorisé » actif pour un emplacement (V1-08). */
export async function sponso(emplacement: "accueil" | "liste_metier" | "prix", metier?: string): Promise<Sponso | null> {
  if (modeDemo) return DEMO_SPONSO;
  const sb = await supabaseServeur();
  let req = sb.from("sponsorises_actifs").select("id, annonceur, titre, texte, image, lien").eq("emplacement", emplacement);
  if (emplacement === "liste_metier" && metier) req = req.eq("metier_slug", metier);
  const { data } = await req.limit(1);
  return (data?.[0] as Sponso) ?? null;
}

export type ResumeCiment = { prix: number; fournisseur: string; quartier: string | null; variante: string; unite: string; ecart: number | null; serie: number[]; exemple: boolean };

/** Carte « Prix du ciment cette semaine » : le moins cher, l'écart avec la semaine passée, 5 semaines. */
export async function resumeCiment(): Promise<ResumeCiment | null> {
  const prix = (await prixMateriaux()).filter((p) => p.slug === "ciment-cpj45-50kg").sort((a, b) => a.prix - b.prix);
  if (!prix.length) return null;
  let serie: number[];
  if (modeDemo) serie = DEMO_SERIE_CIMENT;
  else {
    const sb = await supabaseServeur();
    const { data } = await sb.from("prix_moyens_semaine").select("semaine, prix_min").eq("slug", "ciment-cpj45-50kg").order("semaine");
    serie = (data ?? []).map((l) => l.prix_min as number).slice(-5);
  }
  const p = prix[0];
  return {
    prix: p.prix, fournisseur: p.fournisseur, quartier: p.quartier, variante: p.variante ?? "", unite: p.unite_achat, exemple: !!p.exemple,
    ecart: serie.length >= 2 ? serie.at(-1)! - serie.at(-2)! : null, serie,
  };
}

/** Prix moyen de cette semaine et de la précédente, par matériau (V1-04). */
export async function moyennesSemaine(): Promise<Map<number, { actuel: number | null; precedent: number | null }>> {
  const res = new Map<number, { actuel: number | null; precedent: number | null }>();
  if (modeDemo) return res.set(1, { actuel: 5175, precedent: 5000 });
  const sb = await supabaseServeur();
  const { data } = await sb.from("prix_moyens_semaine").select("materiau_id, semaine, prix_moyen").order("semaine", { ascending: false });
  const lundi = new Date();
  lundi.setUTCDate(lundi.getUTCDate() - ((lundi.getUTCDay() + 6) % 7));
  const cette = lundi.toISOString().slice(0, 10);
  lundi.setUTCDate(lundi.getUTCDate() - 7);
  const avant = lundi.toISOString().slice(0, 10);
  for (const l of data ?? []) {
    const e = res.get(l.materiau_id) ?? { actuel: null, precedent: null };
    if (l.semaine === cette) e.actuel = l.prix_moyen;
    if (l.semaine === avant) e.precedent = l.prix_moyen;
    res.set(l.materiau_id, e);
  }
  return res;
}
