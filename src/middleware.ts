import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protège /admin : sans session, on renvoie vers /admin/connexion.
// Les droits fins (rôle) sont contrôlés par la base (RLS), pas ici.
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) return res; // mode démo

  const supabase = createServerClient(url, cle, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (liste) => {
        liste.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        liste.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && !req.nextUrl.pathname.startsWith("/admin/connexion")) {
    return NextResponse.redirect(new URL("/admin/connexion", req.url));
  }
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
