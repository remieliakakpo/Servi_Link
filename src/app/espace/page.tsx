import Link from "next/link";
import { Bookmark, Briefcase, ChevronRight, Fuel, MessageSquareMore, User } from "lucide-react";
import { EnTete, PiluleRetour } from "@/components/EnTete";
import { modeDemo, parametres } from "@/lib/donnees";
import { compteConnecte, idsFavoris } from "@/lib/session";
import { supabaseServeur } from "@/lib/supabase/server";
import { lienWhatsApp } from "@/lib/whatsapp";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata = { title: "Mon espace", robots: { index: false } };
export const dynamic = "force-dynamic";

// L'envoi de codes par SMS demande un fournisseur SMS branché à Supabase (payant) : à ouvrir par réglage
const SMS_DISPONIBLE = process.env.NEXT_PUBLIC_SMS_ACTIF === "1";

export default async function Espace({ searchParams }: { searchParams: Promise<{ suite?: string; canal?: string }> }) {
  const { suite, canal } = await searchParams;
  const compte = await compteConnecte();

  if (!compte) {
    const p = await parametres();
    const devenirPro = lienWhatsApp(String(p.whatsapp_servilink), "Bonjour ServiLink, je suis artisan ou fournisseur et je souhaite être vérifié et référencé.");
    return (
      <>
        <EnTete titre="Mon espace" retour={{ href: "/" }} sousTitre="Retrouvez vos demandes et vos favoris." />
        <main className="corps">
          <div className="page" style={{ display: "grid", gap: 16, width: "100%" }}>
            {/* Comme dans les applis mobiles : un seul champ, le compte est créé à la première connexion */}
            <div>
              <h2 className="titre-ecran">Bienvenue</h2>
              <p className="muet" style={{ margin: "6px 0 0" }}>Entrez votre numéro ou votre e-mail. Vous recevrez un code pour continuer.</p>
            </div>
            <FormulaireConnexion suite={suite && /^\/(?![\/\\])[^\s\\]{0,200}$/.test(suite) ? suite : "/espace"} canalInitial={canal === "email" ? "email" : canal === "sms" || SMS_DISPONIBLE ? "sms" : "email"} smsDisponible={SMS_DISPONIBLE || modeDemo} />
            <hr style={{ border: 0, borderTop: "1.5px solid var(--liseré)", width: "100%", margin: "8px 0" }} />
            <Link href="/espace/pro" className="carte carte-forte">
              <Briefcase size={40} color="var(--orange)" strokeWidth={1.6} aria-hidden="true" style={{ flex: "none" }} />
              <span className="separateur" />
              <span className="carte-texte"><strong>Devenir professionnel</strong><p>Dépannage, livraison de carburant, atelier</p></span>
              <ChevronRight className="chevron" size={28} aria-hidden="true" />
            </Link>
            <Link href="/livraisons" className="carte">
              <Fuel size={36} color="var(--orange)" strokeWidth={1.6} aria-hidden="true" style={{ flex: "none" }} />
              <span className="carte-texte"><strong>Mes livraisons</strong><p>Carburant demandé depuis ce téléphone</p></span>
              <ChevronRight className="chevron" size={24} aria-hidden="true" />
            </Link>
            {devenirPro && <a href={devenirPro} className="lien-simple lien-souligne" target="_blank" rel="noopener">Artisan ou fournisseur BTP ? Écrivez-nous</a>}
            <Link href="/" className="lien-simple">Continuer sans compte</Link>
          </div>
          <PiluleRetour href="/" label="Retour" />
        </main>
      </>
    );
  }

  const favoris = await idsFavoris();
  let demandes = 0;
  if (!modeDemo) {
    const { count } = await (await supabaseServeur()).from("mes_demandes").select("id", { count: "exact", head: true });
    demandes = count ?? 0;
  }
  const s = (n: number) => (n > 1 ? "s" : "");

  return (
    <>
      <EnTete titre="Mon espace personnel" />
      <main className="corps">
        <div className="page" style={{ display: "grid", gap: 16, width: "100%" }}>
          <Link href="/espace/demandes" className="carte">
            <MessageSquareMore size={44} strokeWidth={1.6} aria-hidden="true" style={{ flex: "none" }} />
            <span className="carte-texte"><strong>Mes demandes</strong>
              <p>{demandes ? `${demandes} demande${s(demandes)}` : "Aucune demande pour le moment."}</p></span>
          </Link>
          <Link href="/livraisons" className="carte">
            <Fuel size={44} strokeWidth={1.6} aria-hidden="true" style={{ flex: "none" }} />
            <span className="carte-texte"><strong>Mes livraisons</strong><p>Carburant demandé depuis ce téléphone</p></span>
          </Link>
          <Link href="/espace/pro" className="carte">
            <Briefcase size={44} strokeWidth={1.6} aria-hidden="true" style={{ flex: "none" }} />
            <span className="carte-texte"><strong>Ma fiche professionnelle</strong><p>Dépannage, livraison de carburant, atelier</p></span>
          </Link>
          <Link href="/espace/favoris" className="carte">
            <Bookmark size={44} strokeWidth={1.6} aria-hidden="true" style={{ flex: "none" }} />
            <span className="carte-texte"><strong>Mes favoris</strong>
              <p>{favoris.length ? `${favoris.length} professionnel${s(favoris.length)} enregistré${s(favoris.length)}` : "Aucun professionnel enregistré."}</p></span>
          </Link>
          <Link href="/annuaire" className="bouton bouton-orange bouton-plein" style={{ color: "var(--texte)" }}>Trouver un professionnel</Link>
          <hr style={{ border: 0, borderTop: "1.5px solid var(--liseré)", width: "100%", margin: "8px 0" }} />
          <Link href="/espace/profil" className="carte" style={{ border: 0, padding: "8px 4px" }}>
            <User size={44} strokeWidth={1.6} aria-hidden="true" style={{ flex: "none" }} />
            <span className="carte-texte"><strong>Mon profil</strong><p>Coordonnées du compte</p></span>
            <ChevronRight className="chevron" size={28} aria-hidden="true" />
          </Link>
        </div>
        <PiluleRetour href="/" label="Retour à l’accueil" />
      </main>
    </>
  );
}
