import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { modeDemo } from "@/lib/donnees";
import { supabaseServeur } from "@/lib/supabase/server";
import { EnTete, PiluleRetour } from "@/components/EnTete";

export const metadata = { title: "Équipe", robots: { index: false } };
export const dynamic = "force-dynamic";

const ROLES = [
  ["verificateur", "Vérificateur", "vérifie les fiches et les photos et vidéos"],
  ["enqueteur", "Enquêteur", "relève les prix chez les fournisseurs"],
  ["conseiller", "Conseiller", "répond aux demandes et aux plaintes"],
  ["admin", "Administrateur", "tout, y compris l'équipe"],
] as const;
const ERREURS: Record<string, string> = {
  compte_introuvable: "Aucun compte avec cette adresse. Demandez d'abord à la personne de créer son compte dans « Mon espace » avec cette adresse e-mail.",
  nom_invalide: "Indiquez le nom de la personne (2 à 80 caractères).",
  pas_soi_meme: "Vous ne pouvez pas vous retirer vous-même.",
  reserve_admin: "Réservé aux administrateurs.",
};

type Membre = { user_id: string; nom: string; email: string | null; role: string; actif: boolean };

async function ajouter(form: FormData) {
  "use server";
  const sb = await supabaseServeur();
  const role = ROLES.find(([r]) => r === form.get("role"))?.[0] ?? "verificateur";
  const { error } = await sb.rpc("ajouter_membre", { p_email: String(form.get("email") ?? "").slice(0, 200), p_nom: String(form.get("nom") ?? "").slice(0, 80), p_role: role });
  revalidatePath("/admin/equipe");
  redirect(error ? `/admin/equipe?erreur=${encodeURIComponent(Object.keys(ERREURS).find((k) => error.message.includes(k)) ?? "inconnue")}` : "/admin/equipe?ok=1");
}
async function retirer(form: FormData) {
  "use server";
  const sb = await supabaseServeur();
  const { error } = await sb.rpc("retirer_membre", { p_user: String(form.get("id")) });
  revalidatePath("/admin/equipe");
  redirect(error ? `/admin/equipe?erreur=${Object.keys(ERREURS).find((k) => error.message.includes(k)) ?? "inconnue"}` : "/admin/equipe");
}

export default async function Equipe({ searchParams }: { searchParams: Promise<{ erreur?: string; ok?: string }> }) {
  const { erreur, ok } = await searchParams;
  if (modeDemo) return (
    <><EnTete titre="Équipe" retour={{ href: "/admin" }} /><main className="corps"><div className="page">
      <p className="alerte">La gestion de l&apos;équipe fonctionne une fois la base de données branchée.</p>
      <PiluleRetour href="/admin" label="Back-office" />
    </div></main></>
  );
  const sb = await supabaseServeur();
  const { data: role } = await sb.rpc("mon_role");
  if (role !== "admin") redirect("/admin");
  const { data } = await sb.rpc("liste_equipe");
  const membres = (data ?? []) as Membre[];
  return (
    <>
      <EnTete titre="Équipe" retour={{ href: "/admin" }} />
      <main className="corps"><div className="page" style={{ display: "grid", gap: 16 }}>
        {erreur && <p className="alerte" role="alert">{ERREURS[erreur] ?? "L'opération n'a pas marché. Réessayez."}</p>}
        {ok && <p className="info" role="status">Collaborateur ajouté. Il voit le back-office à sa prochaine connexion.</p>}
        <section className="carte" style={{ display: "grid", gap: 10, padding: 16 }}>
          <h2 className="titre-liste">Ajouter un collaborateur</h2>
          <ol className="muet" style={{ margin: 0, paddingLeft: 18 }}>
            <li>La personne ouvre ServiLink, va dans <strong>Mon espace</strong> et se connecte avec son e-mail personnel (elle reçoit un code).</li>
            <li>Vous saisissez ici la même adresse et choisissez son rôle.</li>
          </ol>
          <form action={ajouter} style={{ display: "grid", gap: 10 }}>
            <input className="champ" name="email" type="email" required maxLength={200} placeholder="Adresse e-mail de la personne" aria-label="Adresse e-mail" />
            <input className="champ" name="nom" required minLength={2} maxLength={80} placeholder="Nom et prénom" aria-label="Nom et prénom" />
            <select className="champ" name="role" aria-label="Rôle" defaultValue="verificateur">
              {ROLES.map(([r, l, d]) => <option key={r} value={r}>{l} : {d}</option>)}
            </select>
            <button className="bouton bouton-orange" type="submit">Ajouter à l&apos;équipe</button>
          </form>
        </section>
        <section style={{ display: "grid", gap: 8 }}>
          <h2 className="titre-liste">{membres.filter((m) => m.actif).length} membre{membres.filter((m) => m.actif).length > 1 ? "s" : ""}</h2>
          <ul className="liste">
            {membres.map((m) => (
              <li key={m.user_id} className="carte" style={{ display: "flex", alignItems: "center", gap: 10, opacity: m.actif ? 1 : 0.55 }}>
                <span className="carte-texte" style={{ flex: 1 }}>
                  <strong>{m.nom}</strong>
                  <p className="muet">{m.email} · {ROLES.find(([r]) => r === m.role)?.[1] ?? m.role}{m.actif ? "" : " · retiré"}</p>
                </span>
                {m.actif && (
                  <form action={retirer}><input type="hidden" name="id" value={m.user_id} /><button className="mini-bouton" type="submit">Retirer</button></form>
                )}
              </li>
            ))}
          </ul>
        </section>
        <p><Link href="/admin">Retour au back-office</Link></p>
      </div></main>
    </>
  );
}
