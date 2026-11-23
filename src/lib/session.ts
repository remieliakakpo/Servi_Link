import "server-only";
import { cookies } from "next/headers";
import { modeDemo } from "./donnees";
import { supabaseServeur } from "./supabase/server";

// Compte public (« Mon espace »). En mode démo, un cookie tient lieu de session et de favoris.
export const COOKIE_DEMO = "slk-demo-compte";
export const COOKIE_DEMO_FAVORIS = "slk-demo-favoris";

export type Compte = { id: string; email: string | null; telephone: string | null };

export async function compteConnecte(): Promise<Compte | null> {
  if (modeDemo) {
    const c = (await cookies()).get(COOKIE_DEMO)?.value;
    return c ? { id: "demo", email: c.includes("@") ? c : null, telephone: c.includes("@") ? null : c } : null;
  }
  const sb = await supabaseServeur();
  const { data } = await sb.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null, telephone: data.user.phone || null } : null;
}

export async function idsFavoris(): Promise<string[]> {
  if (modeDemo) return ((await cookies()).get(COOKIE_DEMO_FAVORIS)?.value ?? "").split(",").filter(Boolean);
  const sb = await supabaseServeur();
  const { data } = await sb.from("favoris").select("professionnel_id");
  return (data ?? []).map((f) => f.professionnel_id);
}
