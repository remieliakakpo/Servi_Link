// Types des vues publiques (supabase/migrations/0001_init.sql, section 12).
// À remplacer par les types générés (`supabase gen types typescript`) une fois le projet Supabase créé.

export type TypePro = "Artisan" | "Fournisseur";
export type OuiNon = "Oui" | "Non" | "En attente";

export type Metier = { slug: string; libelle: string; type: TypePro };

export type ProListe = {
  id: string; reference: string; nom: string; type: TypePro; metier: string; metier_slug: string | null;
  quartier: string | null; quartiers_intervention: string[];
  whatsapp: string | null; telephone: string | null;
  description: string | null; annees_experience: number | null; date_verification: string;
  nb_chantiers_vus: number | null; nb_clients_appeles: number | null;
  identite_verifiee: boolean; carte_ou_rccm_verifie: boolean; atelier_visite: boolean;
  qualite_travail: number | null; respect_delais: number | null; note_avis_clients: number | null;
  clarte_prix: number | null; reactivite: number | null; note_moyenne: number | null;
  livraison: OuiNon | null; zone_livraison: string | null;
  photo_principale: string | null; distance_km: number | null;
  service_domicile: OuiNon | null;
  nb_avis: number; prix_depart: number | null; nb_produits: number;
  /** Position GPS, ou centre du quartier si la fiche n'a pas de GPS (position_approx). */
  latitude: number | null; longitude: number | null; position_approx: boolean;
  /** false : pro relevé (Google Maps) mais pas encore vérifié sur le terrain par ServiLink. */
  verifie: boolean;
  /** Note et nombre d'avis Google, pour les pros pas encore vérifiés. */
  note_google: number | null; avis_google: number | null;
  /** Adresse telle que relevée (repère, rue), quand on la connaît. */
  adresse: string | null;
  /** Fiche lue automatiquement sur les vidéos Google Maps, pas encore contrôlée à l'œil. */
  a_confirmer?: boolean;
};

export type Quartier = { nom: string; zone: string; lat: number; lng: number };

export type Tarif = {
  service: string; unite: string | null; prix_min: number | null; prix_max: number | null;
  frais_deplacement: number | null; date_releve: string; ancien: boolean;
};

export type Photo = { chemin: string; legende: string | null; principale?: boolean };

export type Avis = { id: number; prenom_client: string | null; created_at: string; commentaire: string | null; note: number | null };

export type Fiche = ProListe & {
  charte_signee: boolean; horaires: string | null; point_repere: string | null; langues: string | null;
  disponibilite: string | null; moyens_paiement: string | null;
  livraison_frais_min: number | null; livraison_delai: string | null;
  tarifs: Tarif[]; photos: Photo[]; avis: Avis[]; prix: PrixMateriau[];
};

export type PrixMateriau = {
  materiau_id: number; slug: string; nom: string; variante: string | null; unite_achat: string;
  professionnel_id: string; fournisseur: string; quartier: string | null; whatsapp: string | null;
  prix: number; livraison: OuiNon | null; date_releve: string; ancien: boolean; le_moins_cher: boolean;
  /** Prix d'exemple du mode démo (aucun relevé réel encore) : pas de fournisseur nommé. */
  exemple?: boolean;
};

export type Recherche = {
  q?: string; type?: TypePro; metiers?: string[]; quartier?: string; livraison?: boolean;
  tri?: "note" | "experience" | "distance"; lat?: number; lng?: number; page?: number; parPage?: number;
};
