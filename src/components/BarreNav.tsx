"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Coins, House, Search } from "lucide-react";

const ONGLETS = [
  { href: "/", label: "Accueil", Icone: House },
  { href: "/annuaire", label: "Annuaire", Icone: Search },
  { href: "/prix", label: "Prix", Icone: Coins },
  { href: "/calculateur", label: "Estimation", Icone: Calculator },
];

export function BarreNav() {
  const chemin = usePathname();
  return (
    <nav className="barre-nav" aria-label="Navigation principale">
      {ONGLETS.map(({ href, label, Icone }) => {
        const actif = href === "/" ? chemin === "/" : chemin.startsWith(href);
        return (
          <Link key={href} href={href} className={actif ? "onglet actif" : "onglet"} aria-current={actif ? "page" : undefined}>
            <Icone size={30} strokeWidth={1.8} aria-hidden="true" />{label}
          </Link>
        );
      })}
    </nav>
  );
}
