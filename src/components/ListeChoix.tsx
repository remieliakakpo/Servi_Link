"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export type Choix = { value: string; label: string; groupe?: string };

type Props = {
  options: Choix[];
  /** Valeur de départ (non contrôlé) ou valeur imposée (contrôlé, avec onChoix). */
  valeur?: string;
  /** Nom du champ envoyé avec le formulaire qui contient la liste. */
  name?: string;
  /** Relance le formulaire dès qu'on choisit (recherche de l'annuaire, page Prix). */
  envoyer?: boolean;
  onChoix?: (v: string, form: HTMLFormElement | null) => void;
  "aria-label": string;
  className?: string;
  id?: string;
};

/**
 * Liste déroulante maison : remplace le <select> natif, dont la liste sortait de l'écran
 * (police et largeur imposées par le navigateur). Le panneau reste dans l'écran du téléphone,
 * avec la police de l'appli, et s'ouvre vers le haut s'il n'y a pas la place en dessous.
 */
export function ListeChoix({ options, valeur = "", name, envoyer, onChoix, className = "", id, ...aria }: Props) {
  const [v, setV] = useState(valeur);
  const [ouvert, setOuvert] = useState(false);
  const [place, setPlace] = useState<React.CSSProperties>({});
  const bouton = useRef<HTMLButtonElement>(null);
  const champ = useRef<HTMLInputElement>(null);
  const panneau = useRef<HTMLDivElement>(null);
  useEffect(() => setV(valeur), [valeur]);

  const actuel = options.find((o) => o.value === v) ?? options[0];

  // Position du panneau : sous le bouton, dans l'écran (16 px de marge), vers le haut si besoin
  useLayoutEffect(() => {
    if (!ouvert || !bouton.current) return;
    const r = bouton.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const largeur = Math.min(Math.max(r.width, 220), vw - 32);
    const left = Math.min(Math.max(r.left, 16), vw - 16 - largeur);
    const dessous = vh - r.bottom - 16, dessus = r.top - 16;
    const versLeHaut = dessous < 220 && dessus > dessous;
    setPlace({
      left, width: largeur,
      ...(versLeHaut ? { bottom: vh - r.top + 6, maxHeight: Math.min(dessus, 360) } : { top: r.bottom + 6, maxHeight: Math.min(dessous, 360) }),
    });
    panneau.current?.querySelector<HTMLButtonElement>("[aria-selected=true]")?.scrollIntoView({ block: "nearest" });
  }, [ouvert]);

  // Fermeture : clic à côté, Échap, défilement de la page
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: PointerEvent) => {
      if (!panneau.current?.contains(e.target as Node) && !bouton.current?.contains(e.target as Node)) setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => { if (e.key === "Escape") { setOuvert(false); bouton.current?.focus(); } };
    const defile = (e: Event) => { if (!panneau.current?.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener("pointerdown", dehors);
    document.addEventListener("keydown", touche);
    window.addEventListener("scroll", defile, true);
    return () => {
      document.removeEventListener("pointerdown", dehors);
      document.removeEventListener("keydown", touche);
      window.removeEventListener("scroll", defile, true);
    };
  }, [ouvert]);

  function choisir(o: Choix) {
    setV(o.value); setOuvert(false); bouton.current?.focus();
    if (champ.current) champ.current.value = o.value;
    const form = champ.current?.form ?? bouton.current?.closest("form") ?? null;
    onChoix?.(o.value, form);
    if (envoyer) setTimeout(() => form?.requestSubmit());
  }

  function clavier(e: React.KeyboardEvent<HTMLDivElement>) {
    const boutons = [...(panneau.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? [])];
    const i = boutons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") { e.preventDefault(); boutons[Math.min(i + 1, boutons.length - 1)]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); boutons[Math.max(i - 1, 0)]?.focus(); }
  }

  let groupe: string | undefined;
  return (
    <>
      <button ref={bouton} id={id} type="button" className={`liste-choix ${className}`} aria-haspopup="listbox" aria-expanded={ouvert}
        aria-label={aria["aria-label"]} onClick={() => setOuvert((x) => !x)}>
        <span>{actuel?.label}</span>
      </button>
      {name && <input ref={champ} type="hidden" name={name} value={v} />}
      {!name && <input ref={champ} type="hidden" disabled value={v} />}
      {ouvert && createPortal(
        <div ref={panneau} className="liste-choix-panneau" role="listbox" aria-label={aria["aria-label"]} style={place} onKeyDown={clavier}>
          {options.map((o) => {
            const titre = o.groupe && o.groupe !== groupe ? o.groupe : null;
            groupe = o.groupe;
            return (
              <div key={o.value} role="presentation">
                {titre && <p className="liste-choix-groupe">{titre}</p>}
                <button type="button" role="option" aria-selected={o.value === v} className={o.groupe ? "en-groupe" : undefined}
                  onClick={() => choisir(o)} autoFocus={o.value === v}>
                  <span>{o.label}</span>{o.value === v && <Check size={18} aria-hidden="true" />}
                </button>
              </div>
            );
          })}
        </div>, document.body,
      )}
    </>
  );
}
