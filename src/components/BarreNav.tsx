"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Coins, House, Play, Search } from "lucide-react";

const ONGLETS = [
  { href: "/", label: "Accueil", Icone: House },
  { href: "/shorts", label: "En Action", Icone: Play },
  { href: "/annuaire", label: "Annuaire", Icone: Search },
  { href: "/prix", label: "Prix", Icone: Coins },
  { href: "/calculateur", label: "Estimation", Icone: Calculator },
];

export function BarreNav() {
  const chemin = usePathname();
  return (
    <nav className="barre-nav barre-nav-5" aria-label="Navigation principale">
      {ONGLETS.map(({ href, label, Icone }) => {
        const actif = href === "/" ? chemin === "/" : chemin.startsWith(href);
        return (
          <Link key={href} href={href} className={actif ? "onglet actif" : "onglet"} aria-current={actif ? "page" : undefined}>
            <Icone size={26} strokeWidth={1.9} aria-hidden="true" />{label}
          </Link>
        );
      })}
    </nav>
  );
}
