import { NextResponse, type NextRequest } from "next/server";
import { lireRecherche, type ParamsAnnuaire } from "@/lib/annuaire";
import { rechercher } from "@/lib/donnees";

// Nombre de résultats pour le bouton « Voir N résultats » de la feuille Filtres et tri.
export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams) as ParamsAnnuaire;
  const r = lireRecherche({ ...sp, vue: undefined });
  const { total } = await rechercher({ ...r, page: 1, parPage: 1 });
  return NextResponse.json({ total }, { headers: { "Cache-Control": "public, max-age=60" } });
}
