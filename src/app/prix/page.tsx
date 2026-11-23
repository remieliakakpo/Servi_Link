import Link from "next/link";
import { BrickWall, Cylinder, Layers, MapPin, Mountain, Package, Ruler, Store, type LucideIcon } from "lucide-react";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { ListeChoix } from "@/components/ListeChoix";
import { prixMateriaux } from "@/lib/donnees";
import { dateCourte } from "@/lib/format";
import { parUnite } from "@/lib/prix";

export const metadata = { title: "Prix des matériaux à Lomé" };
export const revalidate = 600;

const ICONES: Record<string, LucideIcon> = { Ciment: Package, "Fer à béton": Ruler, Agglos: BrickWall, Sable: Mountain, Gravier: Mountain, "Fil à ligaturer": Cylinder };

// Espace insécable normale : l'espace fine de Intl n'existe pas dans toutes les polices Android
const fcfaPastille = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/\u202f/g, "\u00a0") + "\u00a0F\u00a0CFA";

export default async function Prix({ searchParams }: { searchParams: Promise<{ m?: string; v?: string }> }) {
  const sp = await searchParams;
  const prix = await prixMateriaux();
  const noms = [...new Set(prix.map((p) => p.nom))];
  const nom = noms.includes(sp.m ?? "") ? sp.m! : noms[0];
  const variantes = [...new Map(prix.filter((p) => p.nom === nom).map((p) => [p.slug, p])).values()];
  const variante = variantes.find((v) => v.slug === sp.v) ?? variantes[0];
  const lignes = prix.filter((p) => p.slug === variante?.slug).sort((a, b) => a.prix - b.prix);
  const IconeM = ICONES[nom] ?? Package;

  return (
    <>
      <EnTete titre="Prix des matériaux" retour={{ href: "/", label: "Accueil" }} />
      <main className="corps">
        <div className="page" style={{ display: "grid", gap: 14, width: "100%" }}>
          {noms.length === 0 ? (
            <p className="alerte">Aucun prix relevé ces 30 derniers jours.</p>
          ) : (
            <form action="/prix" style={{ display: "grid", gap: 14 }}>
              <p className="champ-titre">Matériau</p>
              <div className="selecteur-tuile">
                <span className="tuile tuile-sombre"><IconeM size={36} strokeWidth={1.6} aria-hidden="true" /></span>
                <ListeChoix name="m" valeur={nom} envoyer className="selecteur" aria-label="Matériau" options={noms.map((n) => ({ value: n, label: n }))} />
              </div>
              <p className="champ-titre">Variante et unité</p>
              <div className="selecteur-tuile">
                <span className="tuile tuile-sombre"><Layers size={36} strokeWidth={1.6} aria-hidden="true" /></span>
                {/* La variante dépend du matériau : on la vide si le matériau change */}
                <ListeChoix key={nom} name="v" valeur={variante?.slug} envoyer className="selecteur" aria-label="Variante et unité"
                  options={variantes.map((v) => ({ value: v.slug, label: `${v.variante} · ${v.unite_achat}` }))} />
              </div>
              <noscript><button className="bouton bouton-orange bouton-plein" type="submit">Voir les prix</button></noscript>
            </form>
          )}

          {variante && (
            <>
              <div style={{ marginTop: 8 }}>
                <h2 style={{ fontSize: "1.6rem" }}>{lignes.length} fournisseur{lignes.length > 1 ? "s" : ""}</h2>
                <p className="muet" style={{ margin: "4px 0 0" }}>Prix en magasin · hors livraison</p>
                {lignes.some((l) => l.exemple) && <p className="info" style={{ marginTop: 8 }}>Prix d&apos;exemple : les relevés chez les fournisseurs n&apos;ont pas encore commencé.</p>}
              </div>
              <ul className="liste">
                {lignes.map((l) => (
                  <li key={l.professionnel_id} className="carte prix-carte">
                    <span className="tuile tuile-sombre"><Store size={36} strokeWidth={1.6} aria-hidden="true" /></span>
                    <span className="carte-texte">
                      <strong>{l.fournisseur}</strong>
                      <p style={{ display: "flex", gap: 6, alignItems: "center" }}><MapPin size={18} aria-hidden="true" style={{ flex: "none" }} />{l.quartier ?? "Lomé"}</p>
                      <p className="releve">Relevé le {dateCourte(l.date_releve)}{l.ancien && <span className="ancien"> · ancien</span>}</p>
                    </span>
                    <span className="separateur" />
                    <span className="prix-bloc">
                      <span className="prix-pastille">{fcfaPastille(l.prix)}</span>
                      <span>{parUnite(l.unite_achat)}</span>
                      {!l.exemple && <Link href={`/pro/${l.professionnel_id}`} className="lien-orange">Voir le fournisseur ›</Link>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <PiluleRetour href="/" label="Retour à l’accueil" />
      </main>
    </>
  );
}
