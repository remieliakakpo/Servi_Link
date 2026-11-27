import Link from "next/link";
import { Check, ChevronRight, Info, MapPin, MessageSquareMore, Star, Store, Tag, Truck } from "lucide-react";
import { dateCourte, decimal, fcfa } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";
import { mediasFiche } from "@/lib/medias";
import { BlocRealisations } from "./Realisations";
import type { Fiche } from "@/lib/types";
import { Carrousel } from "@/components/Carrousel";
import { AvisCarte, BandeNonVerifiee, BarreFiche, BasDeFiche, DuoContact, NoteGoogle } from "./Commun";
import { verifications } from "./FicheArtisan";

type Props = { f: Fiche; message: string; favori: boolean; numeroServiLink: string; tousAvis: boolean };

export function FicheFournisseur({ f, message, favori, numeroServiLink, tousAvis }: Props) {
  const banniere = f.photos.find((p) => p.principale)?.chemin ?? f.photo_principale;
  const verifs = verifications(f);
  const premier = f.prix[0];
  const livraison = f.livraison === "Oui"
    ? ["Oui", f.zone_livraison && `Zones : ${f.zone_livraison}`, f.livraison_frais_min != null && `Frais : à partir de ${fcfa(f.livraison_frais_min)}`,
       f.livraison_delai && `Délai : ${f.livraison_delai}`].filter(Boolean).join(" · ")
    : f.livraison === "Non" ? "Pas de livraison" : null;

  return (
    <>
      <BarreFiche f={f} />
      {/* Pas de photo du magasin (fiche non encore visitée) : pas de bannière vide */}
      {banniere && (
        <div className="banniere-fournisseur">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlPhoto(banniere)} alt={`Magasin ${f.nom}`} />
        </div>
      )}
      <div style={{ position: "relative" }}>
      <header className={`tete-fournisseur${banniere ? "" : " sans-banniere"}`}>
        <Store size={52} strokeWidth={1.6} color="var(--orange)" aria-hidden="true" />
        <div>
          <h1>{f.nom}</h1>
          <p className="ligne-icone"><Store size={18} aria-hidden="true" />Fournisseur</p>
          <p className="ligne-icone"><MapPin size={18} aria-hidden="true" />{f.quartier ? `${f.quartier}, Lomé` : f.adresse ?? "Grand Lomé"}</p>
        </div>
      </header>
      {f.note_moyenne != null && (
        <p className="note-fournisseur"><Star size={22} className="etoile" aria-hidden="true" /><strong>{decimal(f.note_moyenne)} / 5</strong><small className="muet">({f.nb_avis} avis)</small></p>
      )}
      {f.note_moyenne == null && <p className="note-fournisseur"><NoteGoogle f={f} taille={22} /></p>}
      </div>

      <main className="fiche-corps">
        {f.verifie
          ? <span className="pilule-verifie" title={`Vérifié le ${dateCourte(f.date_verification)}`}><Check size={20} strokeWidth={3} aria-hidden="true" />Vérifié par ServiLink</span>
          : <BandeNonVerifiee f={f} />}
        <DuoContact f={f} message={message} />

        {verifs.length > 0 && <details className="verif-repliee">
          <summary>
            <span className="rond-vert"><Check size={24} strokeWidth={3} aria-hidden="true" /></span>
            <span><strong>Ce que nous avons vérifié</strong><small>{verifs.filter((v) => !/clients|Charte/.test(v)).join(" · ")}</small></span>
            <ChevronRight size={22} aria-hidden="true" />
          </summary>
          <ul className="coches">
            {verifs.map((v) => <li key={v}><Check size={20} aria-hidden="true" />{v}</li>)}
            <li><Check size={20} aria-hidden="true" />Vérifié le {dateCourte(f.date_verification)}</li>
          </ul>
        </details>}

        {f.prix.length > 0 && (
          <section className="bloc" aria-labelledby="t-prix">
            <div className="bloc-tete">
              <h2 id="t-prix"><Tag size={22} fill="var(--bleu-nuit)" color="var(--carte)" aria-hidden="true" />Prix relevés</h2>
              {premier && <Link href={`/prix?m=${encodeURIComponent(premier.nom)}&v=${encodeURIComponent(premier.slug)}`}>Comparer <ChevronRight size={20} aria-hidden="true" /></Link>}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="tableau-prix">
                <thead><tr><th>Produit</th><th>Variante</th><th className="cellule-prix">Prix</th><th>Date</th></tr></thead>
                <tbody>
                  {f.prix.map((x) => (
                    <tr key={x.materiau_id}>
                      <td>{x.nom}{x.variante && ` ${x.variante}`}</td>
                      <td>{(x.unite_achat.charAt(0).toUpperCase() + x.unite_achat.slice(1)).replace(" de ", " ")}</td>
                      <td className="cellule-prix">{x.le_moins_cher && <span className="pastille-moins-cher">Le moins cher</span>}<b>{fcfa(x.prix)}</b></td>
                      <td>{dateCourte(x.date_releve)}{x.ancien && <><br /><span className="pastille-ancien" style={{ fontSize: ".75rem", padding: "1px 8px" }}>Ancien</span></>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {livraison && (
          <section className="bloc" aria-labelledby="t-livraison">
            <h2 id="t-livraison"><Truck size={24} fill="var(--bleu-nuit)" aria-hidden="true" />Livraison</h2>
            <p style={{ margin: "6px 0 0", fontSize: ".95rem" }}>{livraison}</p>
          </section>
        )}

        {(f.horaires || f.point_repere || f.moyens_paiement || f.adresse) && (
          <section className="bloc" aria-labelledby="t-infos">
            <h2 id="t-infos"><Info size={24} fill="var(--bleu-nuit)" color="var(--carte)" aria-hidden="true" />Infos pratiques</h2>
            <p style={{ margin: "6px 0 0", fontSize: ".95rem" }}>
              {f.adresse && <><b>Adresse :</b> {f.adresse}<br /></>}
              {f.horaires && <><b>Horaires :</b> {f.horaires}</>}{f.point_repere && <> · <b>Point de repère :</b> {f.point_repere}</>}
              {f.moyens_paiement && <><br />Moyens de paiement : {f.moyens_paiement}</>}
            </p>
          </section>
        )}

        <BlocRealisations pro={f} serveur={mediasFiche(f)} />

        {f.avis.length > 0 && (
          <section className="bloc" id="avis" aria-labelledby="t-avis">
            <div className="bloc-tete">
              <h2 id="t-avis"><MessageSquareMore size={24} fill="var(--bleu-nuit)" color="var(--carte)" aria-hidden="true" />Ce qu&apos;en disent les clients</h2>
              {!tousAvis && <Link href="?avis=tous#avis">Voir les {f.nb_avis} avis <ChevronRight size={20} aria-hidden="true" /></Link>}
            </div>
            <Carrousel className="avis-ligne">{(tousAvis ? f.avis : f.avis.slice(0, 6)).map((a) => <AvisCarte key={a.id} a={a} />)}</Carrousel>
          </section>
        )}

        <BasDeFiche f={f} favori={favori} numeroServiLink={numeroServiLink} />
      </main>
    </>
  );
}
