import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BrickWall,
  Cylinder,
  MapPin,
  Mountain,
  Package,
  Ruler,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { BarreNav } from "@/components/BarreNav";
import { BoutonStatutPrix } from "@/components/BoutonStatutPrix";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { ListeChoix } from "@/components/ListeChoix";
import { moyennesSemaine, prixMateriaux } from "@/lib/donnees";
import { dateCourte, fcfa } from "@/lib/format";
import { parUnite } from "@/lib/prix";

export const metadata = { title: "Prix des matériaux à Lomé" };
export const revalidate = 600;

const ICONES: Record<string, LucideIcon> = {
  Ciment: Package,
  "Fer à béton": Ruler,
  Agglos: BrickWall,
  Sable: Mountain,
  Gravier: Mountain,
  "Fil à ligaturer": Cylinder,
};

// Espace insécable normale : l'espace fine de Intl n'existe pas dans toutes les polices Android
const fcfaPastille = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n).replace(/\u202f/g, "\u00a0") + "\u00a0F\u00a0CFA";

export default async function Prix({ searchParams }: { searchParams: Promise<{ m?: string; v?: string }> }) {
  const sp = await searchParams;
  const [prix, moyennes] = await Promise.all([prixMateriaux(), moyennesSemaine()]);
  const noms = [...new Set(prix.map((p) => p.nom))];
  const nom = noms.includes(sp.m ?? "") ? sp.m! : noms[0];
  const variantes = [...new Map(prix.filter((p) => p.nom === nom).map((p) => [p.slug, p])).values()];
  const variante = variantes.find((v) => v.slug === sp.v) ?? variantes[0];
  const lignes = prix.filter((p) => p.slug === variante?.slug).sort((a, b) => a.prix - b.prix);

  const prixMin = lignes[0]?.prix ?? null;
  const prixMoyen = lignes.length ? Math.round(lignes.reduce((a, b) => a + b.prix, 0) / lignes.length) : null;
  const hist = variante ? moyennes.get(variante.materiau_id) : undefined;
  const ecartSemaine =
    hist?.actuel != null && hist?.precedent != null ? hist.actuel - hist.precedent : null;

  // Liste synthétique pour la carte Statut WhatsApp
  const resumeStatut = noms
    .map((n) => {
      const p = prix.filter((x) => x.nom === n).sort((a, b) => a.prix - b.prix)[0];
      return p ? { nom: p.nom, variante: p.variante, prix: p.prix, unite: p.unite_achat } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <>
      <EnTete titre="Prix des matériaux" retour={{ href: "/", label: "Accueil" }} sousTitre="Relevés hebdomadaires chez les fournisseurs de Lomé." />
      <main className="corps corps-avec-nav">
        <div className="page" style={{ display: "grid", gap: 14, width: "100%" }}>
          {noms.length === 0 ? (
            <p className="alerte">Aucun prix relevé ces 30 derniers jours.</p>
          ) : (
            <>
              {/* 1-Tap Visual Material Tiles : plus besoin d'ouvrir un menu déroulant caché pour changer de matériau */}
              <section aria-labelledby="t-choix-mat">
                <p id="t-choix-mat" className="champ-titre" style={{ marginBottom: 8 }}>
                  Choisissez un matériau (1 touche)
                </p>
                <div className="tuiles-materiaux">
                  {noms.map((n) => {
                    const Icone = ICONES[n] ?? Package;
                    const actif = n === nom;
                    return (
                      <Link
                        key={n}
                        href={`/prix?m=${encodeURIComponent(n)}`}
                        className={actif ? "tuile-mat active" : "tuile-mat"}
                        aria-current={actif ? "true" : undefined}
                      >
                        <Icone size={24} strokeWidth={1.7} aria-hidden="true" />
                        <span>{n}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {variantes.length > 1 && (
                <form action="/prix" style={{ display: "grid", gap: 8 }}>
                  <input type="hidden" name="m" value={nom} />
                  <p className="champ-titre">Variante et unité</p>
                  <ListeChoix
                    key={nom}
                    name="v"
                    valeur={variante?.slug}
                    envoyer
                    className="selecteur"
                    aria-label="Variante et unité"
                    options={variantes.map((v) => ({ value: v.slug, label: `${v.variante} · ${v.unite_achat}` }))}
                  />
                </form>
              )}
            </>
          )}

          {variante && (
            <>
              {/* Bloc de synthèse de la semaine (E08 du PDF Screens_a_realiser) */}
              {prixMin != null && (
                <section className="bloc prix-synthese-hebdo" aria-label="Synthèse de la semaine">
                  <div className="prix-synthese-grille">
                    <div>
                      <small className="muet">Prix le plus bas</small>
                      <strong className="prix-synthese-min">{fcfa(prixMin)} CFA</strong>
                      <small>{parUnite(variante.unite_achat)}</small>
                    </div>
                    <div>
                      <small className="muet">Prix moyen à Lomé</small>
                      <strong>{prixMoyen ? `${fcfa(prixMoyen)} CFA` : "—"}</strong>
                      {ecartSemaine != null && ecartSemaine !== 0 ? (
                        <small className={ecartSemaine < 0 ? "baisse" : "hausse"} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {ecartSemaine < 0 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                          {ecartSemaine > 0 ? "+" : "−"}
                          {fcfa(Math.abs(ecartSemaine))} vs sem. passée
                        </small>
                      ) : (
                        <small className="muet">Relevé du {dateCourte(lignes[0].date_releve)}</small>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <div style={{ marginTop: 4 }}>
                <h2 style={{ fontSize: "1.45rem" }}>
                  {lignes.length} fournisseur{lignes.length > 1 ? "s" : ""} pour {variante.nom} {variante.variante}
                </h2>
                <p className="muet" style={{ margin: "2px 0 0", fontSize: ".9rem" }}>
                  Prix en magasin · hors livraison
                </p>
                {lignes.some((l) => l.exemple) && (
                  <p className="info" style={{ marginTop: 8 }}>
                    Prix d&apos;exemple : les relevés chez les fournisseurs n&apos;ont pas encore commencé.
                  </p>
                )}
              </div>

              <ul className="liste">
                {lignes.map((l, idx) => (
                  <li key={l.professionnel_id} className="carte prix-carte">
                    <span className="tuile tuile-sombre">
                      <Store size={32} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <span className="carte-texte">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                        <strong>{l.fournisseur}</strong>
                        {idx === 0 && <span className="pastille-moins-cher">Le moins cher</span>}
                      </div>
                      <p style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <MapPin size={16} aria-hidden="true" style={{ flex: "none" }} />
                        {l.quartier ?? "Lomé"}
                        {l.livraison === "Oui" && (
                          <span className="muet" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 6 }}>
                            · <Truck size={15} aria-hidden="true" /> Livre
                          </span>
                        )}
                      </p>
                      <p className="releve">
                        Relevé le {dateCourte(l.date_releve)}
                        {l.ancien && <span className="ancien"> · ancien</span>}
                      </p>
                    </span>
                    <span className="separateur" />
                    <span className="prix-bloc">
                      <span className="prix-pastille">{fcfaPastille(l.prix)}</span>
                      <span>{parUnite(l.unite_achat)}</span>
                      {!l.exemple && (
                        <Link href={`/pro/${l.professionnel_id}`} className="lien-orange">
                          Voir le fournisseur ›
                        </Link>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Fonctionnalité virale : Affiche Statut WhatsApp "Météo des matériaux" */}
              <BoutonStatutPrix items={resumeStatut} />
            </>
          )}
        </div>
        <PiluleRetour href="/" label="Retour à l’accueil" />
      </main>
      <BarreNav />
    </>
  );
}
