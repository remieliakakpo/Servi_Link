import { NextResponse, type NextRequest } from "next/server";
import { autorisation, bunnyConfigure, creerVideo, repriseAutorisee } from "@/lib/bunny";
import { supabaseConfigure, supabaseServeur } from "@/lib/supabase/server";

// Autorise un utilisateur connecté à envoyer une vidéo chez Bunny Stream (ou à reprendre la sienne).
export async function POST(req: NextRequest) {
  if (!bunnyConfigure() || !supabaseConfigure) return NextResponse.json({ erreur: "indisponible" }, { status: 503 });
  if (req.headers.get("origin") && new URL(req.headers.get("origin")!).host !== req.nextUrl.host) return NextResponse.json({ erreur: "origine" }, { status: 403 });
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erreur: "connexion" }, { status: 401 });
  // Même limite que la base : 20 envois par jour pour un compte hors équipe
  const [{ data: envois }, { data: role }] = await Promise.all([sb.rpc("envois_du_jour", { uid: user.id }), sb.rpc("mon_role")]);
  if (!role && (envois ?? 0) >= 20) return NextResponse.json({ erreur: "limite" }, { status: 429 });
  const corps = await req.json().catch(() => ({})) as { videoId?: unknown };
  try {
    const reprise = typeof corps.videoId === "string" && await repriseAutorisee(corps.videoId, user.id);
    const videoId = reprise ? (corps.videoId as string) : await creerVideo(user.id);
    return NextResponse.json(autorisation(videoId), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ erreur: "service" }, { status: 502 });
  }
}
