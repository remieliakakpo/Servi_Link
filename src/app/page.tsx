import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, BrickWall, ChevronRight, HardHat, Play, Search, Store, TriangleAlert } from "lucide-react";
import { BarreNav } from "@/components/BarreNav";
import { ChoixZone } from "@/components/ChoixZone";
import { EnTetePhoto } from "@/components/EnTete";
import { ICONES_METIER } from "@/components/IconeMetier";
import { EncartSponso } from "@/components/Sponso";
import { parametres, quartiers, resumeCiment, sponso } from "@/lib/donnees";
import { fcfa } from "@/lib/format";
import { lienWhatsApp } from "@/lib/whatsapp";

export const revalidate = 300;

// Les 8 tuiles de la maquette, dans son ordre
const TUILES = [
  ["macon", "Maçon"], ["ferrailleur", "Ferrailleur"], ["carreleur", "Carreleur"], ["plombier", "Plombier"],
  ["electricien", "Électricien"], ["menuisier", "Menuisier"], ["peintre", "Peintre"], ["quincaillerie", "Quincaillerie"],
] as const;

/** Courbe des 5 dernières semaines (prix le plus bas relevé chaque semaine). */
function Sparkline({ serie }: { serie: number[] }) {
  if (serie.length < 2) return null;
  const l = 130, h = 56, min = Math.min(...serie), max = Math.max(...serie), e = max - min || 1;
  const pts = serie.map((v, i) => [4 + (i * (l - 8)) / (serie.length - 1), h - 6 - ((v - min) / e) * (h - 14)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${l} ${h}`} role="img" aria-label={`Évolution sur ${serie.length} semaines`}>
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={l} y1={h * f} y2={h * f} stroke="#eadbc6" strokeWidth="1" />)}
      <path className="zone" d={`${d} L${pts.at(-1)![0]} ${h} L${pts[0][0]} ${h} Z`} />
      <path className="ligne" d={d} />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" />)}
    </svg>
  );
}

export default async function Accueil() {
  const [p, qs, ciment, s] = await Promise.all([parametres(), quartiers(), resumeCiment(), sponso("accueil")]);
  const demande = lienWhatsApp(String(p.whatsapp_servilink), String(p.message_demande));
  return (
    <>
      <EnTetePhoto question="Que cherchez-vous ?">
        <form action="/annuaire" role="search">
          <div className="recherche-pilule">
            <Search size={22} aria-hidden="true" />
            <label className="sr-only" htmlFor="q">Rechercher</label>
            <input id="q" name="q" className="champ" placeholder="Métier, matériau, quartier" enterKeyHint="search" />
          </div>
          <div className="pilules-entete"><ChoixZone quartiers={qs.map((q) => q.nom)} style="pilule" /></div>
        </form>
      </EnTetePhoto>

      <main className="corps-chevauche">
        <div className="duo">
          <Link href="/annuaire" className="carte-action">
            <HardHat size={40} strokeWidth={1.5} aria-hidden="true" />
            <span><strong>Trouver un professionnel</strong><small>Artisans et fournisseurs</small></span>
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
          <Link href="/calculateur" className="carte-action">
            <BrickWall size={40} strokeWidth={1.5} aria-hidden="true" />
            <span><strong>Préparer mon chantier</strong><small>Quantités et prix des matériaux</small></span>
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>

        <section aria-labelledby="t-metiers" style={{ display: "grid", gap: 8 }}>
          <div className="titre-section">
            <h2 id="t-metiers">Trouver par métier</h2>
            <Link href="/annuaire">Tous <ArrowRight size={20} aria-hidden="true" /></Link>
          </div>
          <ul className="grille-metiers4">
            {TUILES.map(([slug, libelle]) => {
              const Icone = ICONES_METIER[slug];
              return <li key={slug}><Link href={`/annuaire?metiers=${slug}`}><Icone size={30} strokeWidth={1.6} aria-hidden="true" />{libelle}</Link></li>;
            })}
          </ul>
        </section>

        {/* Vitrine : le travail des pros en vidéo */}
        <Link href="/vitrine" className="carte-vitrine">
          <span className="carte-vitrine-icone"><Play size={26} fill="currentColor" aria-hidden="true" /></span>
          <span><strong>Vitrine</strong><small>Le travail des artisans en vidéo, métier par métier</small></span>
          <ChevronRight size={22} aria-hidden="true" />
        </Link>

        {/* Dépannage (écrans du 27/11) : carburant livré, crevaison, mécanique */}
        <Link href="/depannage" className="carte-action carte-panne">
          <TriangleAlert size={36} strokeWidth={1.6} aria-hidden="true" />
          <span><strong>Je suis en panne</strong><small>Carburant, crevaison, mécanique</small></span>
          <ChevronRight size={20} aria-hidden="true" />
        </Link>

        {ciment && (
          <section className="carte-ciment" aria-labelledby="t-ciment">
            <h2 id="t-ciment">Prix du ciment cette semaine</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/ciment.webp" alt="" />
            <div>
              <p>{ciment.variante} · {ciment.unite}</p>
              <p className="gros-prix">{fcfa(ciment.prix)} CFA</p>
              <p><Store size={18} color="var(--orange)" aria-hidden="true" /><strong>{ciment.exemple ? "Prix d'exemple, relevés à venir" : <>{ciment.fournisseur}{ciment.quartier && ` · ${ciment.quartier}`}</>}</strong></p>
              {ciment.ecart != null && ciment.ecart !== 0 && (
                <p className={ciment.ecart < 0 ? "baisse" : "hausse"}>
                  {ciment.ecart < 0 ? <ArrowDown size={16} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
                  <span style={{ color: "var(--texte)" }}>{ciment.ecart > 0 ? "+" : "−"}{fcfa(Math.abs(ciment.ecart))} vs semaine passée</span>
                </p>
              )}
            </div>
            <div className="carte-ciment-bas">
              <Sparkline serie={ciment.serie} />
              <Link href="/prix" className="pilule-tuile">Tous les prix <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          </section>
        )}


        {s && <EncartSponso s={s} />}

        {demande && <a href={demande} target="_blank" rel="noopener" className="lien-demande">Vous ne trouvez pas ? Demander à ServiLink <ArrowRight size={18} aria-hidden="true" /></a>}

        <div className="bandeau-vert">
          <HardHat size={36} strokeWidth={1.5} aria-hidden="true" />
          <p>Trouvez un professionnel, comparez les prix et construisez sereinement.</p>
        </div>
      </main>
      <BarreNav />
    </>
  );
}
