import Link from "next/link";
import { ArrowRight, House } from "lucide-react";
import { urlPhoto, type Sponso } from "@/lib/donnees";

/** Encart « Sponsorisé » (V1-08) : toujours étiqueté, jamais mêlé aux résultats vérifiés. */
export function EncartSponso({ s }: { s: Sponso }) {
  const externe = /^https?:\/\//.test(s.lien);
  return (
    <Link href={s.lien} className="sponso" {...(externe ? { target: "_blank", rel: "noopener sponsored" } : {})}>
      <span className="sponso-etiquette">SPONSORISÉ</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {s.image ? <img src={urlPhoto(s.image)} alt="" loading="lazy" /> : <span />}
      <House size={34} strokeWidth={1.8} color="var(--orange)" aria-hidden="true" />
      <span><strong>{s.titre}</strong>{s.texte && <small>{s.texte}</small>}</span>
      <span className="decouvrir">Découvrir <ArrowRight size={18} aria-hidden="true" /></span>
    </Link>
  );
}
