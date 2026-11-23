import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Photos servies par Supabase Storage, redimensionnées par Next (≤ 60 Ko en liste, ≤ 150 Ko en grand)
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
