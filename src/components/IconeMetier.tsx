import { AppWindow, BrickWall, Car, DraftingCompass, Droplet, Grid2x2, Hammer, HardHat, House, Layers, PaintRoller, Ruler, Sofa, Store, Trees, Wrench, Zap, type LucideIcon } from "lucide-react";

// Icône par métier (slug de la table metiers). Les fournisseurs ont une boutique.
export const ICONES_METIER: Record<string, LucideIcon> = {
  macon: HardHat, ferrailleur: Ruler, coffreur: Hammer, electricien: Zap, plombier: Droplet,
  carreleur: Grid2x2, menuisier: Hammer, peintre: PaintRoller, soudeur: Wrench, quincaillerie: Store,
  "carreaux-sanitaires": Grid2x2, bois: Hammer, briques: BrickWall,
  toiture: House, decoration: Sofa, staffeur: Layers, amenagement: Trees, vitrier: AppWindow, architecte: DraftingCompass,
  mecanicien: Car, materiaux: BrickWall,
};

export function IconeMetier({ slug, type, taille = 34 }: { slug: string | null; type: "Artisan" | "Fournisseur"; taille?: number }) {
  const Icone = type === "Fournisseur" ? Store : (slug && ICONES_METIER[slug]) || HardHat;
  return <Icone size={taille} strokeWidth={1.8} aria-hidden="true" className="icone-metier" />;
}
