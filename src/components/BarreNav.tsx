"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Clapperboard, Coins, House, Search } from "lucide-react";

const ONGLETS = [
  { href: "/", label: "Accueil", Icone: House },
  { href: "/annuaire", label: "Annuaire", Icone: Search },
  { href: "/vitrine", label: "Vitrine", Icone: Clapperboard },
  { href: "/prix", label: "Prix", Icone: Coins },
  { href: "/calculateur", label: "Estimation", Icone: Calculator },
];

/** Barre du bas : 5 onglets, la Vitrine au centre. `sombre` : sur le fil vidéo. */
export function BarreNav({ sombre = false }: { sombre?: boolean }) {
  const chemin = usePathname();
  return (
    <nav className={sombre ? "barre-nav barre-nav-sombre" : "barre-nav"} aria-label="Navigation principale">
      {ONGLETS.map(({ href, label, Icone }) => {
        const actif = href === "/" ? chemin === "/" : chemin.startsWith(href);
        return (
          <Link key={href} href={href} className={`onglet${actif ? " actif" : ""}${href === "/vitrine" ? " onglet-vitrine" : ""}`} aria-current={actif ? "page" : undefined}>
            <Icone size={30} strokeWidth={1.8} aria-hidden="true" />{label}
          </Link>
        );
      })}
    </nav>
  );
}
