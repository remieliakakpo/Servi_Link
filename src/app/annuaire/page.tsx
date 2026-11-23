import Link from "next/link";
import { ChevronDown, LayoutGrid, List, Map as IconeCarte, Search } from "lucide-react";
import { BarreNav } from "@/components/BarreNav";
import { BoutonContact } from "@/components/BoutonContact";
import { CarteLeaflet } from "@/components/CarteLeaflet";
import { CartePro } from "@/components/CartePro";
import { ChoixZone } from "@/components/ChoixZone";
import { EnTetePhoto, PiluleRetour } from "@/components/EnTete";
import { FiltresTri } from "@/components/FiltresTri";
import { ListeChoix } from "@/components/ListeChoix";
import { EncartSponso } from "@/components/Sponso";
import { lienAnnuaire, lireRecherche, nbFiltres, PAR_PAGE, type ParamsAnnuaire } from "@/lib/annuaire";
import { metiers, parametres, quartiers, rechercher, sponso } from "@/lib/donnees";
import { AUTOUR_DE_MOI } from "@/lib/geo";
import { lienWhatsApp } from "@/lib/whatsapp";

export const metadata = { title: "Annuaire BTP vérifié" };

const ORDRES = { note: "les mieux notés d'abord", experience: "les plus expérimentés d'abord", distance: "les plus proches d'abord" };

export default async function Annuaire({ searchParams }: { searchParams: Promise<ParamsAnnuaire> }) {
  const sp = await searchParams;
  const r = lireRecherche(sp);
  const { vue, autour } = r;
  const [{ pros, total }, liste, qs, p, s] = await Promise.all([
    rechercher(r), metiers(), quartiers(), parametres(), sponso("liste_metier", r.metiers?.length === 1 ? r.metiers[0] : undefined),
  ]);

  const libelles = r.metiers?.map((m) => liste.find((x) => x.slug === m)?.libelle).filter(Boolean);
  const demande = lienWhatsApp(String(p.whatsapp_servilink),
    `${p.message_demande}${libelles?.join(", ") || r.q || "un professionnel"}${r.quartier ? ` à ${r.quartier}` : ""}.`);
  const page = r.page ?? 1;
  const typeActuel = sp.type === "artisan" || sp.type === "fournisseur" ? sp.type : "";

  return (
    <>
      <EnTetePhoto titre="Annuaire">
        <form action="/annuaire" role="search">
          {/* Le reste de la recherche (type, tri, livraison, vue) suit la recherche texte */}
          {(["type", "tri", "livraison", "vue"] as const).map((k) => sp[k] && <input key={k} type="hidden" name={k} value={sp[k]} />)}
          <div className="recherche-pilule">
            <Search size={22} aria-hidden="true" />
            <label className="sr-only" htmlFor="q">Rechercher</label>
            <input id="q" name="q" className="champ" defaultValue={r.q} placeholder="Métier, nom ou quartier" enterKeyHint="search" />
          </div>
          <div className="pilules-entete">
            <span className="pilule-blanche">
              <LayoutGrid size={20} aria-hidden="true" />
              <ListeChoix name="metiers" valeur={sp.metiers ?? ""} envoyer aria-label="Métier" options={[
                { value: "", label: "Tous les métiers" },
                ...((r.metiers?.length ?? 0) > 1 ? [{ value: sp.metiers!, label: `${r.metiers!.length} métiers` }] : []),
                ...liste.map((m) => ({ value: m.slug, label: m.libelle })),
              ]} />
              <ChevronDown size={18} aria-hidden="true" />
            </span>
            <ChoixZone quartiers={qs.map((q) => q.nom)} valeur={autour ? AUTOUR_DE_MOI : r.quartier ?? ""}
              position={autour ? { lat: r.lat, lng: r.lng } : undefined} style="pilule" envoyerAuChoix />
          </div>
          <noscript><button className="bouton bouton-orange" type="submit">Chercher</button></noscript>
        </form>
      </EnTetePhoto>

      <main className="corps-chevauche">
        <div className="haut-collant">
        <nav className="segments" aria-label="Type de professionnel">
          {([["", "Tous"], ["artisan", "Artisans"], ["fournisseur", "Fournisseurs"]] as const).map(([t, l]) => (
            <Link key={t} className="segment" aria-current={typeActuel === t} href={lienAnnuaire(sp, { type: t || undefined })}>{l}</Link>
          ))}
          <FiltresTri sp={sp} nbActifs={nbFiltres(r)} total={total} tri={r.tri ?? "note"} autour={autour}
            metiers={liste} quartiers={qs.map((q) => q.nom)} />
        </nav>

        <div className="compteur">
          <strong>{total} professionnel{total > 1 ? "s" : ""}{vue === "carte" && ` trouvé${total > 1 ? "s" : ""}`}</strong>
          {vue === "liste" && (
            <form action="/annuaire">
              {Object.entries(sp).filter(([k, v]) => v && k !== "tri" && k !== "page").map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <span aria-hidden="true">· </span>
              <ListeChoix name="tri" valeur={r.tri ?? "note"} envoyer aria-label="Ordre" options={[
                { value: "note", label: ORDRES.note }, { value: "experience", label: ORDRES.experience },
                ...(autour ? [{ value: "distance", label: ORDRES.distance }] : []),
              ]} />
            </form>
          )}
          {/* Bascule Liste / Carte : absente des maquettes, ajoutée discrètement (à valider) */}
          {vue === "liste"
            ? <Link className="vue" href={lienAnnuaire(sp, { vue: "carte" })}><IconeCarte size={18} aria-hidden="true" />Carte</Link>
            : <Link className="vue" href={lienAnnuaire(sp, { vue: undefined, pro: undefined })}><List size={18} aria-hidden="true" />Liste</Link>}
        </div>

        </div>

        {vue === "carte" ? (
          <CarteLeaflet pros={pros} moi={autour ? { lat: r.lat!, lng: r.lng! } : null} sp={sp} choisi={sp.pro} />
        ) : (
          <>
            {s && <EncartSponso s={s} />}
            {pros.length > 0 && (
              <ul className="liste" style={{ display: "grid", gap: 12 }}>
                {pros.map((pro) => <CartePro key={pro.id} p={pro} message={String(p.message_contact_pro)} />)}
              </ul>
            )}
            {pros.length === 0 && (
              // État vide provisoire (écran à dessiner) : quartier voisin ou demande à ServiLink (V1-02)
              <div className="bloc" style={{ display: "grid", gap: 8 }}>
                <strong>Aucun professionnel vérifié pour cette recherche.</strong>
                <p style={{ margin: 0 }}>Essayez tout le Grand Lomé ou un quartier voisin, ou demandez-nous : nous cherchons pour vous.</p>
                {demande && <BoutonContact href={demande} type="demande_servilink" className="bouton bouton-vert">Demander à ServiLink</BoutonContact>}
              </div>
            )}
            {total > page * PAR_PAGE && (
              <Link className="voir-plus" scroll={false} href={lienAnnuaire(sp, { page: String(page + 1) })}>
                Voir {Math.min(PAR_PAGE, total - page * PAR_PAGE)} de plus <ChevronDown size={20} aria-hidden="true" />
              </Link>
            )}
          </>
        )}
        <PiluleRetour href="/" label="Retour" />
      </main>
      <BarreNav />
    </>
  );
}
