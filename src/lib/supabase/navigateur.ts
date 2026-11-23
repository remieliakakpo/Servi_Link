"use client";
import { createBrowserClient } from "@supabase/ssr";

export function supabaseNavigateur() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && cle ? createBrowserClient(url, cle) : null;
}
