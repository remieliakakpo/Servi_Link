"use client";
import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type ItemPrix = { nom: string; variante: string | null; prix: number; unite: string };

export function BoutonStatutPrix({ items }: { items: ItemPrix[] }) {
  const [etat, setEtat] = useState<"" | "pret">("");

  async function partagerStatut() {
    const dateStr = new Date().toLocaleDateString("fr-FR");
    const lignes = items.slice(0, 4).map((i) => `• ${i.nom} (${i.variante ?? i.unite}) : dès ${i.prix.toLocaleString("fr-FR")} F CFA`);
    const texte = [
      `📊 BAROMÈTRE DES PRIX BTP — GRAND LOMÉ (${dateStr})`,
      ...lignes,
      `✅ Prix relevés en magasin par ServiLink Togo.`,
    ].join("\n");

    try {
      if (typeof document !== "undefined" && navigator.share) {
        const canvas = document.createElement("canvas");
        canvas.width = 720;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Fond dégradé Vert ServiLink
          const grad = ctx.createLinearGradient(0, 0, 720, 720);
          grad.addColorStop(0, "#1d2b3a");
          grad.addColorStop(1, "#2f5a28");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 720, 720);

          // En-tête
          ctx.fillStyle = "#f47b0a";
          ctx.fillRect(48, 48, 220, 38);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText("SERVILINK TOGO", 64, 74);

          ctx.font = "bold 38px sans-serif";
          ctx.fillText("Prix des matériaux à Lomé", 48, 140);
          ctx.font = "22px sans-serif";
          ctx.fillStyle = "#e3f0d8";
          ctx.fillText(`Relevé officiel du ${dateStr} · Grand Lomé`, 48, 178);

          // Cartes des prix
          items.slice(0, 4).forEach((it, idx) => {
            const y = 215 + idx * 105;
            ctx.fillStyle = "rgba(255, 248, 238, 0.14)";
            ctx.fillRect(48, y, 624, 88);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 26px sans-serif";
            ctx.fillText(`${it.nom} ${it.variante ?? ""}`, 70, y + 38);
            ctx.fillStyle = "#fde3c3";
            ctx.font = "20px sans-serif";
            ctx.fillText(`Unité : ${it.unite}`, 70, y + 68);

            ctx.fillStyle = "#f47b0a";
            ctx.font = "bold 30px sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(`${it.prix.toLocaleString("fr-FR")} F CFA`, 648, y + 54);
            ctx.textAlign = "left";
          });

          ctx.fillStyle = "#fde3c3";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText("Comparez les quincailleries vérifiées sur servilink-red.vercel.app", 48, 678);

          const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
          if (blob) {
            const file = new File([blob], "barometre-prix-servilink.png", { type: "image/png" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: "Prix des matériaux Lomé", text: texte });
              return;
            }
          }
        }
        await navigator.share({ title: "Prix des matériaux Lomé", text: texte });
        return;
      }
    } catch {
      /* repli sur WhatsApp */
    }
    setEtat("pret");
    setTimeout(() => setEtat(""), 2500);
    window.location.href = `https://wa.me/?text=${encodeURIComponent(texte)}`;
  }

  return (
    <div className="carte-statut-wa">
      <div>
        <span className="badge-statut-wa">MÉTÉO DES MATÉRIAUX</span>
        <strong>Partager les prix du jour en Statut WhatsApp</strong>
        <p>Génère une affiche propre avec les prix de la semaine à Lomé pour informer vos contacts.</p>
      </div>
      <button type="button" onClick={partagerStatut} className="bouton bouton-orange">
        {etat === "pret" ? <Check size={20} /> : <Share2 size={20} />}
        <span>{etat === "pret" ? "Prêt !" : "Mettre en Statut"}</span>
      </button>
    </div>
  );
}
