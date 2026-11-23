import type { Metadata, Viewport } from "next";
// Polices auto-hébergées : le navigateur ne télécharge que le sous-ensemble latin (unicode-range)
import "@fontsource-variable/inter/index.css";
import "@fontsource-variable/plus-jakarta-sans/index.css";
import { EnregistrerSW } from "@/components/EnregistrerSW";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "ServiLink · Construire au Togo en confiance", template: "%s · ServiLink" },
  description: "Artisans et fournisseurs du BTP vérifiés à Lomé, prix des matériaux datés et calculateur de matériaux.",
  applicationName: "ServiLink",
  appleWebApp: { capable: true, title: "ServiLink", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#24291F", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <EnregistrerSW />
      </body>
    </html>
  );
}
