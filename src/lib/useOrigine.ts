"use client";
import { useEffect, useState } from "react";

/** Adresse du site, connue seulement dans le navigateur : vide au rendu serveur, puis remplie (pas d'écart d'hydratation). */
export function useOrigine(): string {
  const [o, setO] = useState("");
  useEffect(() => setO(window.location.origin), []);
  return o;
}
