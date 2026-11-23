"use client";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, LocateFixed } from "lucide-react";
import type * as Leaflet from "leaflet";
import { CartePro } from "@/components/CartePro";
import { lienAnnuaire, type ParamsAnnuaire } from "@/lib/annuaire";
import { AUTOUR_DE_MOI } from "@/lib/geo";
import { demanderPosition, MESSAGES_POSITION, type ErreurPosition } from "@/lib/position";
import type { ProListe } from "@/lib/types";

type Props = { pros: ProListe[]; moi: { lat: number; lng: number } | null; sp: ParamsAnnuaire; choisi?: string };

const LOME: [number, number] = [6.155, 1.23];

// Épingle orange avec le casque blanc (maquette « Annuaire carte »)
const epingle = (actif: boolean) => `
<svg width="${actif ? 46 : 38}" height="${actif ? 56 : 46}" viewBox="0 0 38 46" aria-hidden="true">
  <path d="M19 45C19 45 3 28 3 17a16 16 0 0 1 32 0c0 11-16 28-16 28z" fill="${actif ? "#2f5a28" : "#f47b0a"}" stroke="#fff" stroke-width="2"/>
  <circle cx="19" cy="17" r="10" fill="#fff"/>
  <path d="M12 20h14M13.5 20a5.5 5.5 0 0 1 11 0M17.5 14.6v-1.4h3v1.4" fill="none" stroke="${actif ? "#2f5a28" : "#f47b0a"}" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** Vue Carte de l'annuaire : épingles des pros, groupes « +N », « Vous êtes ici », mini-fiche en bas. */
export function CarteLeaflet({ pros, moi, sp, choisi }: Props) {
  const router = useRouter();
  const boite = useRef<HTMLDivElement>(null);
  const placés = pros.filter((p) => p.latitude != null && p.longitude != null);
  const [selection, setSelection] = useState<string | undefined>(choisi ?? placés[0]?.id);
  const [etat, setEtat] = useState<"" | "recherche" | ErreurPosition>("");
  const marqueurs = useRef(new Map<string, Leaflet.Marker>());

  async function localiser() {
    setEtat("recherche");
    try {
      const p = await demanderPosition();
      setEtat("");
      router.push(lienAnnuaire(sp, { zone: AUTOUR_DE_MOI, lat: String(p.lat), lng: String(p.lng), vue: "carte", pro: undefined }));
    } catch (e) { setEtat(e as ErreurPosition); }
  }

  useEffect(() => {
    let carte: Leaflet.Map | undefined;
    let annule = false;
    (async () => {
      const L = (await import("leaflet")).default;
      (window as unknown as { L: typeof L }).L = L; // leaflet.markercluster s'accroche à window.L
      await import("leaflet.markercluster");
      if (annule || !boite.current) return;
      carte = L.map(boite.current, { zoomControl: false, attributionControl: true }).setView(LOME, 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(carte);

      // Bouton « me localiser » au-dessus du + / −, comme sur la maquette
      const Localiser = L.Control.extend({
        onAdd: () => {
          const b = L.DomUtil.create("button", "bouton-carte");
          b.type = "button"; b.title = "Me localiser"; b.setAttribute("aria-label", "Me localiser");
          b.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
          L.DomEvent.on(b, "click", (e) => { L.DomEvent.stop(e); localiser(); });
          return b;
        },
      });
      new Localiser({ position: "topright" }).addTo(carte);
      L.control.zoom({ position: "topright", zoomInTitle: "Zoomer", zoomOutTitle: "Dézoomer" }).addTo(carte);

      const groupe = L.markerClusterGroup({
        showCoverageOnHover: false, maxClusterRadius: 50,
        iconCreateFunction: (c) => L.divIcon({ html: `<span class="groupe">+${c.getChildCount()}</span>`, className: "", iconSize: [52, 52] }),
      });
      for (const p of placés) {
        const m = L.marker([p.latitude!, p.longitude!], {
          icon: L.divIcon({ html: epingle(false), className: "epingle", iconSize: [38, 46], iconAnchor: [19, 45] }),
          title: p.nom, alt: `${p.nom}, ${p.metier}`, keyboard: true,
        }).on("click", () => setSelection(p.id));
        marqueurs.current.set(p.id, m);
        groupe.addLayer(m);
      }
      carte.addLayer(groupe);

      if (moi) {
        L.marker([moi.lat, moi.lng], { icon: L.divIcon({ html: '<span class="vous-ici"></span>', className: "", iconSize: [22, 22] }), interactive: false })
          .bindTooltip("Vous êtes ici", { permanent: true, direction: "top", offset: [0, -14], className: "bulle-ici" }).addTo(carte);
      }
      const cible = placés.find((p) => p.id === choisi);
      if (cible) carte.setView([cible.latitude!, cible.longitude!], 15);
      else if (moi) carte.setView([moi.lat, moi.lng], 14);
      else if (placés.length) carte.fitBounds(L.latLngBounds(placés.map((p) => [p.latitude!, p.longitude!])).pad(0.2), { maxZoom: 15 });
    })();
    return () => { annule = true; carte?.remove(); marqueurs.current.clear(); };
    // La carte se reconstruit quand la recherche change (nouvelle page serveur)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pros, moi?.lat, moi?.lng, choisi]);

  // L'épingle choisie passe en vert
  useEffect(() => {
    import("leaflet").then(({ default: L }) => {
      marqueurs.current.forEach((m, id) => {
        const a = id === selection;
        m.setIcon(L.divIcon({ html: epingle(a), className: "epingle", iconSize: a ? [46, 56] : [38, 46], iconAnchor: a ? [23, 55] : [19, 45] }));
        m.setZIndexOffset(a ? 1000 : 0);
      });
    });
  }, [selection, pros]);

  const pro = placés.find((p) => p.id === selection);
  return (
    <>
      <div ref={boite} className="carte-leaflet" role="region" aria-label="Carte des professionnels" />
      {placés.length < pros.length && <p className="info">{pros.length - placés.length} professionnel(s) sans position ne sont pas sur la carte.</p>}
      {pro && (
        <CartePro p={pro} as="div" bas={
          <div className="carte-pro-boutons" style={{ justifyContent: "center" }}>
            <Link href={`/pro/${pro.id}`} className="mini-fiche-bouton"><FileText size={22} aria-hidden="true" />Voir la fiche</Link>
          </div>
        } />
      )}
      <button type="button" className="me-localiser" onClick={localiser} disabled={etat === "recherche"}>
        <LocateFixed size={24} aria-hidden="true" />{etat === "recherche" ? "Recherche de votre position…" : "Me localiser"}
      </button>
      {etat && etat !== "recherche" && <p className="alerte" role="status">{MESSAGES_POSITION[etat]}</p>}
    </>
  );
}
