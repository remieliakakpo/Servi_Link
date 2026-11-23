"use client";
import { compter } from "@/lib/compter";

type Props = { href: string; type: "whatsapp" | "appel" | "demande_servilink"; cible?: string; className: string; children: React.ReactNode };

/** Lien WhatsApp / Appeler qui marche sans JavaScript, et compte le clic quand JS est là. */
export function BoutonContact({ href, type, cible = "", className, children }: Props) {
  return (
    <a href={href} className={className} onClick={() => compter(type, cible)}
       {...(href.startsWith("https://") ? { target: "_blank", rel: "noopener" } : {})}>
      {children}
    </a>
  );
}
