import Link from "next/link";

// Virgule orange du logo, relevée sur le logo d'origine (236 × 80 px) : départ sous le « S » en pointe
// arrondie, plein épais à gauche, montée, puis queue effilée qui redescend sous le « k ».
const VIRGULE = "M0 12 C 3 8, 20 5, 50 3 C 90 0.5, 135 1, 160 3 C 175 4.5, 184 6.5, 188 8.5 C 180 6.5, 168 5, 150 4.5 C 120 4.5, 90 6.5, 60 11 C 40 14.5, 22 18.5, 8 18 C 2 17.5, -0.5 15, 0 12 Z";

export function Virgule({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-1 0 190 19" preserveAspectRatio="none" aria-hidden="true">
      <path d={VIRGULE} fill="currentColor" />
    </svg>
  );
}

/** Trait orange sous les titres : la même virgule que le logo. */
export function Trait() {
  return <Virgule className="trait" />;
}

/** Logo ServiLink, toujours avec la virgule orange dessous (charte). */
export function Logo({ grand = false, tabIndex }: { grand?: boolean; tabIndex?: number }) {
  return (
    <Link href="/" className={`logo logo-swoosh${grand ? " logo-grand" : ""}`} aria-label="ServiLink, accueil" tabIndex={tabIndex}>
      <span>Servi<span>Link</span></span>
      <Virgule />
    </Link>
  );
}

