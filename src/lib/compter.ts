"use client";

// Compte un clic (WhatsApp, Appeler, Envoyer ma liste…) sans aucune donnée personnelle (V1-06).
// fetch keepalive : la requête part même si la page change (ouverture de WhatsApp).
export function compter(type: string, cible = "") {
  rpcPublique("compter", { p_type: type, p_cible: cible }, true).catch(() => {});
}

/** Appel direct d'une fonction publique Supabase, sans charger supabase-js (≈ 50 Ko de moins côté public). */
export async function rpcPublique<T = unknown>(fonction: string, args: object, keepalive = false): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) throw new Error("Supabase non configuré");
  const res = await fetch(`${url}/rest/v1/rpc/${fonction}`, {
    method: "POST",
    keepalive,
    headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${fonction} : ${res.status}`);
  return res.json() as Promise<T>;
}
