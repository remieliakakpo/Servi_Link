import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ServiLink, construire au Togo en confiance",
    short_name: "ServiLink",
    description: "Artisans et fournisseurs du BTP vérifiés, prix des matériaux et calculateur.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#1D1E19",
    theme_color: "#1D1E19",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
