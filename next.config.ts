import type { NextConfig } from "next";

// ---- Sécurité : en-têtes envoyés avec chaque page (lancement, 27/11/2026) ----
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_WS = SUPABASE.replace(/^https:/, "wss:");
// Liste blanche des sources : le site, la base Supabase, les fonds de carte OpenStreetMap.
// Les scripts en ligne restent autorisés car Next.js en injecte pour démarrer les pages.
// Vidéos de la Vitrine chez Bunny Stream (adresse de diffusion de la bibliothèque, ex. vz-1234abcd-567.b-cdn.net)
const BUNNY = process.env.NEXT_PUBLIC_BUNNY_CDN ? `https://${process.env.NEXT_PUBLIC_BUNNY_CDN}` : "";
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org ${SUPABASE} ${BUNNY}`,
  `media-src 'self' blob: ${SUPABASE} ${BUNNY}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE} ${SUPABASE_WS} https://video.bunnycdn.com`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // En ligne seulement : en Wi-Fi local (http://192.168…) cette règle casserait les pages
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ").replace(/\s+/g, " ");

const ENTETES_SECURITE = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Caméra : seulement pour filmer depuis le site ; position : pour « près de moi »
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Photos servies par Supabase Storage, redimensionnées par Next (≤ 60 Ko en liste, ≤ 150 Ko en grand)
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: ENTETES_SECURITE },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
      // Back-office : jamais en cache, jamais indexé
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
