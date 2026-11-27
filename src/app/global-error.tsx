"use client";

/** Dernier filet : erreur dans la mise en page elle-même. Page autonome, sans dépendance. */
export default function ErreurGlobale({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fbf2e4", color: "#1d2b3a", display: "grid", placeItems: "center", minHeight: "100dvh", padding: 24, textAlign: "center" }}>
        <div style={{ maxWidth: 360 }}>
          <p style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Servi<span style={{ color: "#f47b0a" }}>Link</span></p>
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Un souci est survenu</h1>
          <p style={{ margin: "0 0 20px" }}>Vérifiez votre connexion internet, puis réessayez.</p>
          <button type="button" onClick={reset} style={{ minHeight: 52, padding: "0 28px", border: 0, borderRadius: 999, background: "#f47b0a", color: "#fff", fontSize: 17, fontWeight: 700 }}>Réessayer</button>
          {error.digest && <p style={{ fontSize: 13, opacity: .7 }}>Code : {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
