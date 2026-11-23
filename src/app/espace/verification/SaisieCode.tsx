"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { envoyerCode, verifierCode } from "../actions";

/** 6 cases : saisie chiffre par chiffre, collage du code entier, remplissage auto du SMS (one-time-code). */
export function SaisieCode({ canal, destination, suite }: { canal: "email" | "sms"; destination: string; suite: string }) {
  const [chiffres, setChiffres] = useState<string[]>(Array(6).fill(""));
  const [etat, action, enCours] = useActionState(verifierCode, {});
  const [renvoi, actionRenvoi] = useActionState(envoyerCode, {});
  const [attente, setAttente] = useState(30);
  const cases = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (attente <= 0) return;
    const t = setTimeout(() => setAttente(attente - 1), 1000);
    return () => clearTimeout(t);
  }, [attente]);

  function saisir(i: number, valeur: string) {
    const v = valeur.replace(/\D/g, "");
    if (v.length > 1) { // collage ou remplissage automatique
      const tout = v.slice(0, 6).split("");
      setChiffres([...tout, ...Array(6 - tout.length).fill("")]);
      cases.current[Math.min(tout.length, 5)]?.focus();
      return;
    }
    const n = [...chiffres]; n[i] = v; setChiffres(n);
    if (v && i < 5) cases.current[i + 1]?.focus();
  }

  return (
    <>
      <form action={action} style={{ display: "grid", gap: 20 }}>
        <input type="hidden" name="canal" value={canal} />
        <input type="hidden" name="destination" value={destination} />
        <input type="hidden" name="suite" value={suite} />
        <input type="hidden" name="code" value={chiffres.join("")} />
        <div className="code" role="group" aria-label="Code à 6 chiffres">
          {chiffres.map((c, i) => (
            <input key={i} ref={(el) => { cases.current[i] = el; }} value={c} inputMode="numeric" maxLength={i === 0 ? 6 : 1}
              autoComplete={i === 0 ? "one-time-code" : "off"} autoFocus={i === 0} aria-label={`Chiffre ${i + 1}`}
              onChange={(e) => saisir(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !c && i > 0) cases.current[i - 1]?.focus(); }} />
          ))}
        </div>
        {(etat.erreur || renvoi.erreur) && <p className="alerte" role="alert">{etat.erreur ?? renvoi.erreur}</p>}
        <button className="bouton bouton-orange bouton-plein" type="submit" disabled={enCours || chiffres.join("").length < 6}>
          {enCours ? "Vérification…" : "Vérifier le code"}
        </button>
      </form>
      <form action={(f) => { setAttente(30); actionRenvoi(f); }} style={{ display: "grid" }}>
        <input type="hidden" name="canal" value={canal} />
        <input type="hidden" name="destination" value={destination} />
        <input type="hidden" name="suite" value={suite} />
        <button type="submit" className="lien-simple" disabled={attente > 0}>
          {attente > 0 ? `Renvoyer le code dans ${attente} s` : "Renvoyer le code"}
        </button>
      </form>
    </>
  );
}
