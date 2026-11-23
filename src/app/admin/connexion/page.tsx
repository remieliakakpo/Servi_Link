import { redirect } from "next/navigation";
import { supabaseServeur } from "@/lib/supabase/server";
import { EnTete } from "@/components/EnTete";

export const metadata = { title: "Connexion équipe", robots: { index: false } };

// Connexion de l'équipe par e-mail et mot de passe (comptes créés par l'administrateur dans Supabase).
// La double authentification des administrateurs (TOTP Supabase) est prévue au module Équipe.
async function connecter(form: FormData) {
  "use server";
  const sb = await supabaseServeur();
  const { error } = await sb.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("mdp")) });
  redirect(error ? "/admin/connexion?erreur=1" : "/admin");
}

export default async function Connexion({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <>
    <EnTete titre="Connexion de l’équipe" retour={{ href: "/" }} />
    <main className="corps"><div className="page" style={{ width: "100%" }}>
      {erreur && <p className="alerte">E-mail ou mot de passe incorrect.</p>}
      <form action={connecter} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>E-mail<input className="champ" name="email" type="email" autoComplete="username" required /></label>
        <label style={{ display: "grid", gap: 6 }}>Mot de passe<input className="champ" name="mdp" type="password" autoComplete="current-password" required /></label>
        <button className="bouton bouton-orange" type="submit">Se connecter</button>
      </form>
    </div></main>
    </>
  );
}
