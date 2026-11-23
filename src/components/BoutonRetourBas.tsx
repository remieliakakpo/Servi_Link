"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Pilule « ← Retour » en bas de page, comme le bouton retour d'une appli. */
export function BoutonRetourBas({ href, label = "Retour" }: { href: string; label?: string }) {
  const router = useRouter();
  return (
    <Link href={href} className="pilule-retour" onClick={(e) => {
      // Si on vient d'un écran de l'appli, on y retourne (avec sa position de défilement)
      if (document.referrer.startsWith(location.origin) && history.length > 1) { e.preventDefault(); router.back(); }
    }}>
      <ArrowLeft size={22} aria-hidden="true" />{label}
    </Link>
  );
}
