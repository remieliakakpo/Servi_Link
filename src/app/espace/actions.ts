"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { modeDemo } from "@/lib/donnees";
import { telephone as formatTel } from "@/lib/format";
import { COOKIE_DEMO, COOKIE_DEMO_FAVORIS, compteConnecte, idsFavoris } from "@/lib/session";
import { supabaseServeur } from "@/lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const suiteSure = (s: unknown) => (typeof s === "string" && s.startsWith("/") && !s.startsWith("//") ? s : "/espace");

/** Étape 1 : envoyer un code à 6 chiffres par e-mail ou par SMS (Supabase Auth, sans mot de passe). */
export async function envoyerCode(_: unknown, form: FormData): Promise<{ erreur?: string }> {
  const canal = form.get("canal") === "sms" ? "sms" : "email";
  const brut = String(form.get("destination") ?? "").trim();
  const destination = canal === "email" ? brut.toLowerCase() : formatTel(brut);
  if (!destination) return { erreur: "Saisissez votre adresse ou votre numéro." };
  if (canal === "email" && !EMAIL.test(destination)) return { erreur: "Adresse e-mail invalide." };
  if (canal === "sms" && !/^\+228 \d{2} \d{2} \d{2} \d{2}$/.test(destination)) return { erreur: "Numéro togolais à 8 chiffres attendu (ex. 90 12 34 56)." };

  if (!modeDemo) {
    const sb = await supabaseServeur();
    const { error } = canal === "email"
      ? await sb.auth.signInWithOtp({ email: destination!, options: { shouldCreateUser: true } })
      : await sb.auth.signInWithOtp({ phone: destination!.replace(/\s/g, ""), options: { shouldCreateUser: true } });
    if (error) return { erreur: error.status === 429 ? "Trop de demandes. Réessayez dans une minute." : "Le code n'a pas pu être envoyé. Réessayez." };
  }
  const u = new URLSearchParams({ canal, d: destination!, suite: suiteSure(form.get("suite")) });
  redirect(`/espace/verification?${u}`);
}

/** Étape 2 : vérifier le code reçu. */
export async function verifierCode(_: unknown, form: FormData): Promise<{ erreur?: string }> {
  const canal = form.get("canal") === "sms" ? "sms" : "email";
  const destination = String(form.get("destination") ?? "");
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { erreur: "Le code a 6 chiffres." };

  if (modeDemo) {
    if (code !== "123456") return { erreur: "Code incorrect. En mode démo, le code est 123456." };
    (await cookies()).set(COOKIE_DEMO, destination, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  } else {
    const sb = await supabaseServeur();
    const { error } = canal === "email"
      ? await sb.auth.verifyOtp({ email: destination, token: code, type: "email" })
      : await sb.auth.verifyOtp({ phone: destination.replace(/\s/g, ""), token: code, type: "sms" });
    if (error) return { erreur: "Code incorrect ou expiré." };
    await sb.from("clients").upsert({ telephone: canal === "sms" ? destination : null }, { onConflict: "user_id", ignoreDuplicates: true });
  }
  redirect(suiteSure(form.get("suite")));
}

export async function deconnecter() {
  if (modeDemo) (await cookies()).delete(COOKIE_DEMO);
  else await (await supabaseServeur()).auth.signOut();
  redirect("/");
}

/** Ajouter ou retirer une fiche des favoris (connexion demandée si besoin). */
export async function basculerFavori(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!/^ID-\d{3,}$/.test(id)) return;
  if (!(await compteConnecte())) redirect(`/espace?suite=${encodeURIComponent(`/pro/${id}`)}`);
  const deja = (await idsFavoris()).includes(id);
  if (modeDemo) {
    const liste = (await idsFavoris()).filter((x) => x !== id);
    (await cookies()).set(COOKIE_DEMO_FAVORIS, (deja ? liste : [...liste, id]).join(","), { httpOnly: true, sameSite: "lax", path: "/" });
  } else {
    const sb = await supabaseServeur();
    if (deja) await sb.from("favoris").delete().eq("professionnel_id", id);
    else await sb.from("favoris").insert({ professionnel_id: id });
  }
  revalidatePath(`/pro/${id}`);
  revalidatePath("/espace");
}
