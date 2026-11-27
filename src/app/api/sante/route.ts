import { NextResponse } from "next/server";
import { supabaseConfigure, supabaseServeur } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Page de santé pour la surveillance (UptimeRobot, Better Stack…) : 200 si le site et la base répondent,
 * 503 sinon. Ne renvoie aucune donnée, seulement l'état.
 */
export async function GET() {
  const debut = Date.now();
  let base: "ok" | "erreur" | "non_branchee" = "non_branchee";
  if (supabaseConfigure) {
    try {
      const sb = await supabaseServeur();
      const { error } = await sb.from("metiers_public").select("slug").limit(1);
      base = error ? "erreur" : "ok";
    } catch { base = "erreur"; }
  }
  const ok = base !== "erreur";
  return NextResponse.json({ ok, base, ms: Date.now() - debut }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
