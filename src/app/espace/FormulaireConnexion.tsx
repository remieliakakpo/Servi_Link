"use client";
import { useActionState, useState } from "react";
import { envoyerCode } from "./actions";

export function FormulaireConnexion({ suite, canalInitial = "email", smsDisponible }: { suite: string; canalInitial?: "email" | "sms"; smsDisponible: boolean }) {
  const [canal, setCanal] = useState<"email" | "sms">(canalInitial);
  const [etat, action, enCours] = useActionState(envoyerCode, {});
  return (
    <form action={action} style={{ display: "grid", gap: 14 }}>
      <input type="hidden" name="canal" value={canal} />
      <input type="hidden" name="suite" value={suite} />
      <div className="bascule bascule-sombre" role="group" aria-label="Recevoir le code par">
        <button type="button" aria-pressed={canal === "sms"} onClick={() => setCanal("sms")}>Téléphone</button>
        <button type="button" aria-pressed={canal === "email"} onClick={() => setCanal("email")}>E-mail</button>
      </div>
      {canal === "email" ? (
        <label style={{ display: "grid", gap: 8, font: "800 1.1rem var(--police-titre)" }}>Adresse e-mail
          <input key="email" name="destination" type="email" className="champ" placeholder="nom@exemple.com" autoComplete="email" inputMode="email" required />
        </label>
      ) : (
        <label style={{ display: "grid", gap: 8, font: "800 1.1rem var(--police-titre)" }}>Numéro de téléphone
          <span className="champ-indicatif">
            <span aria-hidden="true">🇹🇬 +228</span>
            <input key="tel" name="destination" type="tel" className="champ" placeholder="90 12 34 56" autoComplete="tel-national" inputMode="tel" required aria-label="Numéro de téléphone, sans le +228" />
          </span>
        </label>
      )}
      <p className="muet" style={{ margin: "-6px 0 0" }}>
        {canal === "email" ? "Un code vous sera envoyé par e-mail." : smsDisponible ? "Un code vous sera envoyé par SMS." : "L'envoi par SMS n'est pas encore ouvert : utilisez l'e-mail."}
      </p>
      {etat.erreur && <p className="alerte" role="alert">{etat.erreur}</p>}
      <button className="bouton bouton-orange bouton-plein" type="submit" disabled={enCours || (canal === "sms" && !smsDisponible)}>
        {enCours ? "Envoi du code…" : "Continuer"}
      </button>
    </form>
  );
}
