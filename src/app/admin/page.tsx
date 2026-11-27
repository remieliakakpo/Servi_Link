import Link from "next/link";
import { redirect } from "next/navigation";
import { modeDemo } from "@/lib/donnees";
import { supabaseServeur } from "@/lib/supabase/server";
import { EnTete } from "@/components/EnTete";

export const metadata = { title: "Back-office", robots: { index: false } };
export const dynamic = "force-dynamic";

// Squelette du back-office (V1-07). Les modules arrivent un par un, dans l'ordre du plan technique.
const MODULES = [
  ["Professionnels et statuts", "admin, vérificateur"],
  ["Relevés de prix", "admin, enquêteur"],
  ["Demandes, avis, plaintes, ventes", "admin, conseiller"],
  ["Calculateur (formules versionnées)", "admin"],
  ["Tableau de bord", "toute l'équipe"],
];

export default async function Admin() {
  if (modeDemo) return (
    <><EnTete titre="Back-office" retour={{ href: "/" }} /><main className="corps"><div className="page" style={{ display: "grid", gap: 12, width: "100%" }}>
      <p className="alerte">Base de données pas encore branchée : seuls les outils ci-dessous fonctionnent pour l'instant.</p>
      <OutilsSansBase />
    </div></main></>
  );
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/connexion");
  const { data: role } = await sb.rpc("mon_role");
  if (!role) return (
    <><EnTete titre="Back-office" retour={{ href: "/" }} /><main className="corps"><div className="page" style={{ display: "grid", gap: 12, width: "100%" }}>
      <p className="info">Vous êtes connecté avec <strong>{user.email ?? user.phone}</strong>, mais ce compte ne fait pas encore partie de l&apos;équipe.</p>
      <p>Donnez cette adresse à l&apos;administrateur de ServiLink : il vous ajoute depuis la page Équipe, puis rouvrez cette page.</p>
      <p><Link href="/">Retour à l&apos;appli</Link></p>
    </div></main></>
  );
  return (
    <>
    <EnTete titre="Back-office" retour={{ href: "/" }} />
    <main className="corps"><div className="page" style={{ display: "grid", gap: 12, width: "100%" }}>
      <p className="muet">Connecté : {user.email ?? user.phone} · rôle : <strong>{role ?? "aucun (demandez à un administrateur)"}</strong></p>
      <OutilsSansBase />
      {role === "admin" && (
        <ul className="liste"><li className="carte"><Link href="/admin/equipe" className="carte-texte" style={{ textDecoration: "none" }}>
          <strong>Équipe</strong><p className="muet">Ajouter un collaborateur avec son e-mail, choisir son rôle, retirer un accès</p>
        </Link></li></ul>
      )}
      <ul className="liste">
        {MODULES.map(([m, qui]) => <li key={m} className="carte"><span className="carte-texte"><strong>{m}</strong><p className="muet">{qui} · à venir</p></span></li>)}
      </ul>
      <p><Link href="/">Retour à l&apos;appli</Link></p>
    </div></main>
    </>
  );
}

/** Modules déjà utilisables, avec ou sans base. */
function OutilsSansBase() {
  return (
    <ul className="liste">
      <li className="carte"><Link href="/admin/realisations" className="carte-texte" style={{ textDecoration: "none" }}>
        <strong>Réalisations des pros</strong><p className="muet">Photos et vidéos reçues sur WhatsApp : rattacher, vérifier, publier</p>
      </Link></li>
    </ul>
  );
}
