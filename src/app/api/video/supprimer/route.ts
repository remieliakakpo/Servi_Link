import { NextResponse, type NextRequest } from "next/server";
import { bunnyConfigure, supprimerVideo } from "@/lib/bunny";
import { supabaseConfigure, supabaseServeur } from "@/lib/supabase/server";

// Supprime une vidéo chez Bunny : administrateur seulement (comme la suppression d'une réalisation en base).
export async function POST(req: NextRequest) {
  if (!bunnyConfigure() || !supabaseConfigure) return NextResponse.json({ erreur: "indisponible" }, { status: 503 });
  if (req.headers.get("origin") && new URL(req.headers.get("origin")!).host !== req.nextUrl.host) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  const sb = await supabaseServeur();
  const { data: role } = await sb.rpc("mon_role");
  if (role !== "admin") return NextResponse.json({ erreur: "reserve_admin" }, { status: 403 });
  const { videoId } = await req.json().catch(() => ({})) as { videoId?: string };
  try { await supprimerVideo(String(videoId ?? "")); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ erreur: "service" }, { status: 502 }); }
}
