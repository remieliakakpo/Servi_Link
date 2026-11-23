import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const supabaseConfigure = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Client côté serveur, avec la session de l'équipe si elle est connectée (cookies). */
export async function supabaseServeur() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (liste) => {
        try {
          liste.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le middleware rafraîchit la session.
        }
      },
    },
  });
}
