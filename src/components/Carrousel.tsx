"use client";
import { Children, useEffect, useRef, useState } from "react";

/**
 * Carrousel horizontal (avis clients) : défile tout seul toutes les 4 s, s'arrête dès qu'on
 * le touche, et ne bouge pas si le téléphone demande moins d'animations. Les points suivent.
 */
export function Carrousel({ children, className, points = true }: { children: React.ReactNode; className: string; points?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const [actif, setActif] = useState(0);
  const [pause, setPause] = useState(false);
  const n = Children.count(children);

  useEffect(() => {
    const ul = ref.current;
    if (!ul || pause || n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const largeur = (ul.firstElementChild as HTMLElement | null)?.offsetWidth ?? ul.clientWidth;
      const fin = ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 4;
      ul.scrollTo({ left: fin ? 0 : ul.scrollLeft + largeur + 8, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(t);
  }, [pause, n]);

  function suivre() {
    const ul = ref.current;
    if (!ul) return;
    const largeur = (ul.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1;
    setActif(Math.min(n - 1, Math.round(ul.scrollLeft / (largeur + 8))));
  }

  return (
    <>
      <ul ref={ref} className={className} style={{ listStyle: "none", padding: 0 }} onScroll={suivre}
        onPointerDown={() => setPause(true)} onFocus={() => setPause(true)}>
        {children}
      </ul>
      {points && n > 1 && (
        <div className="points" aria-hidden="true">
          {Array.from({ length: n }, (_, i) => <span key={i} className={i === actif ? "actif" : undefined} />)}
        </div>
      )}
    </>
  );
}
