import Link from "next/link";
import { CalendarDays, ChevronRight, CircleCheck, House, Info, MapPin, MessageSquareMore, ShieldCheck, Star, Truck, Wrench } from "lucide-react";
import { IconeMetier } from "@/components/IconeMetier";
import { dateCourte, decimal, fcfa, fourchette } from "@/lib/format";
import { urlPhoto } from "@/lib/photos";
import { mediasFiche } from "@/lib/medias";
import { BlocRealisations } from "./Realisations";
import type { Fiche } from "@/lib/types";
import { BoutonPartager } from "./BoutonPartager";
import { Carrousel } from "@/components/Carrousel";
import { AvisCarte, BandeNonVerifiee, BarreFiche, BasDeFiche, DuoContact, NoteGoogle } from "./Commun";

type Props = { f: Fiche; message: string; favori: boolean; numeroServiLink: string; tousAvis: boolean };

/** Ce que ServiLink a vérifié sur place (cases du formulaire de vérification). */
export function verifications(f: Fiche): string[] {
  return [
    f.identite_verifiee && "Identité",
    f.atelier_visite && "Atelier visité",
    f.nb_chantiers_vus ? `${f.nb_chantiers_vus} chantier${f.nb_chantiers_vus > 1 ? "s" : ""} vu${f.nb_chantiers_vus > 1 ? "s" : ""}` : null,
    f.nb_clients_appeles ? `${f.nb_clients_appeles} ancien${f.nb_clients_appeles > 1 ? "s" : ""} client${f.nb_clients_appeles > 1 ? "s" : ""} appelé${f.nb_clients_appeles > 1 ? "s" : ""}` : null,
    f.charte_signee && "Charte signée",
  ].filter((x): x is string => !!x);
}

// Les 5 critères notés par ServiLink en appelant d'anciens clients (grille de notation du fichier Excel)
const CRITERES = [
  ["qualite_travail", "Qualité du travail"], ["respect_delais", "Respect des délais"], ["clarte_prix", "Clarté du prix"],
  ["reactivite", "Réactivité"], ["note_avis_clients", "Avis des clients"],
] as const;

export function FicheArtisan({ f, message, favori, numeroServiLink, tousAvis }: Props) {
  const hero = f.photos.find((p) => p.principale)?.chemin ?? f.photo_principale;
  const verifs = verifications(f);
  const stats = [
    f.annees_experience != null && `${f.annees_experience} ans d'expérience`,
    f.nb_chantiers_vus && `${f.nb_chantiers_vus} chantiers vus`,
  ].filter(Boolean).join(" · ");
  const zones = f.quartiers_intervention.length ? f.quartiers_intervention.join(", ") : f.quartier;
  const avis = tousAvis ? f.avis : f.avis.slice(0, 3);
  const deplacement = f.tarifs.find((t) => t.frais_deplacement != null)?.frais_deplacement;

  return (
    <>
      <BarreFiche f={f} />
      <header className="hero-artisan">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hero && <img src={urlPhoto(hero)} alt={`${f.nom} au travail`} />}
        <IconeMetier slug={f.metier_slug} type={f.type} taille={52} />
        <div>
          <h1>{f.nom}</h1>
          <p className="ligne-icone"><span style={{ color: "var(--orange)", display: "flex" }}><IconeMetier slug={f.metier_slug} type={f.type} taille={20} /></span>{f.metier}</p>
          <p className="ligne-icone"><MapPin size={20} aria-hidden="true" />{f.quartier ? `${f.quartier}, Lomé` : f.adresse ?? "Grand Lomé"}</p>
        </div>
        <div className="bandeau-hero">
          {f.verifie ? (
            <span className="ligne-icone" style={{ margin: 0 }}>
              <Star size={16} className="etoile" aria-hidden="true" />{stats}{f.note_moyenne != null && <> · {decimal(f.note_moyenne)} <Star size={16} className="etoile" aria-hidden="true" /></>}
            </span>
          ) : <NoteGoogle f={f} />}
          <BoutonPartager titre={f.nom} texte={`${f.nom}, ${f.metier.toLowerCase()}${f.verifie ? " vérifié par ServiLink" : ` à ${f.quartier ?? "Lomé"}`}`} />
        </div>
      </header>

      <main className="fiche-corps">
        <DuoContact f={f} message={message} />
        {f.verifie ? (
          <Link href="#verifie" className="bande-verifie">
            <ShieldCheck size={24} fill="currentColor" color="var(--vert)" aria-hidden="true" />Vérifié par ServiLink le {dateCourte(f.date_verification)}<ChevronRight size={20} aria-hidden="true" />
          </Link>
        ) : <BandeNonVerifiee f={f} />}

        {f.tarifs.length > 0 && (
          <section className="bloc" aria-labelledby="t-services">
            <div className="bloc-tete">
              <h2 id="t-services"><Wrench size={24} aria-hidden="true" />Services proposés</h2>
              {f.tarifs.some((t) => t.ancien) && <span className="pastille-ancien" title="Prix relevé il y a plus de 14 jours">Ancien</span>}
            </div>
            {f.tarifs.map((t) => (
              <p key={t.service} className="service-prix">
                {t.service} : <b>{fourchette(t.prix_min, t.prix_max)}</b>{t.unite && ` / ${t.unite}`}
                <small className="muet"> · relevé le {dateCourte(t.date_releve)}</small>
              </p>
            ))}
            <div className="service-details">
              {deplacement !== undefined && <span><Truck size={18} aria-hidden="true" />Déplacement : {deplacement === 0 ? "Oui" : `Oui, ${fcfa(deplacement)}`}</span>}
              {f.disponibilite && <span><CalendarDays size={18} aria-hidden="true" />Disponible : {f.disponibilite}</span>}
            </div>
          </section>
        )}

        {(verifs.length > 0 || f.note_moyenne != null) && <div className="deux-blocs">
          {verifs.length > 0 && <section className="bloc" id="verifie" aria-labelledby="t-verifie">
            <h2 id="t-verifie">Ce que nous avons vérifié</h2>
            <ul className="coches">{verifs.map((v) => <li key={v}><CircleCheck size={20} aria-hidden="true" />{v}</li>)}</ul>
          </section>}
          {f.note_moyenne != null && (
            <section className="bloc" aria-labelledby="t-notes">
              <h2 id="t-notes">Notes des clients appelés</h2>
              <div className="barres">
                {CRITERES.map(([cle, libelle]) => f[cle] != null && (
                  <FragmentBarre key={cle} libelle={libelle} valeur={f[cle]!} />
                ))}
              </div>
              <p className="moyenne">Moyenne : {decimal(f.note_moyenne)} <Star size={14} className="etoile" aria-hidden="true" /> / 5</p>
            </section>
          )}
        </div>}

        <BlocRealisations pro={f} serveur={mediasFiche(f)} />

        {f.avis.length > 0 && (
          <section className="bloc" id="avis" aria-labelledby="t-avis">
            <div className="bloc-tete">
              <h2 id="t-avis"><MessageSquareMore size={24} aria-hidden="true" />Ce qu&apos;en disent les clients</h2>
              {!tousAvis && f.nb_avis > 3 && <Link href="?avis=tous#avis">Voir les {f.nb_avis} avis <ChevronRight size={20} aria-hidden="true" /></Link>}
            </div>
            <Carrousel className="avis-ligne">{avis.map((a) => <AvisCarte key={a.id} a={a} />)}</Carrousel>
          </section>
        )}

        <section className="bloc en-bref" aria-labelledby="t-bref">
          <div>
            <h2 id="t-bref"><Info size={24} fill="var(--bleu-nuit)" color="var(--carte)" aria-hidden="true" />En bref</h2>
            <p>
              {[zones && `Zones d'intervention : ${zones}`, f.adresse && `Adresse : ${f.adresse}`, f.horaires && `Horaires : ${f.horaires}`].filter(Boolean).join(" | ") || "Pas d'autres informations pour l'instant."}
              {f.langues && <><br />Langues : {f.langues}</>}
            </p>
          </div>
          {f.service_domicile === "Oui" && <span className="domicile"><House size={30} aria-hidden="true" />Intervention à domicile</span>}
        </section>

        <BasDeFiche f={f} favori={favori} numeroServiLink={numeroServiLink} />
      </main>
    </>
  );
}

function FragmentBarre({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <>
      <span>{libelle}</span>
      <span className="barre" role="img" aria-label={`${decimal(valeur)} sur 5`}><span style={{ width: `${(valeur / 5) * 100}%` }} /></span>
      <span>{decimal(valeur)}</span>
    </>
  );
}
