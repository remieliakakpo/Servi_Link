/** Logo WhatsApp (bulle et combiné), dessiné au trait comme sur les maquettes. */
export function IconeWhatsApp({ taille = 24 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3.5 20.5l1.2-4.3A8.5 8.5 0 1 1 8 19.4l-4.5 1.1z" strokeLinejoin="round" />
      <path d="M9 8.2c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c-.1.1-.1.3 0 .5.6 1 1.4 1.8 2.4 2.4.2.1.4.1.5 0l.6-.6c.2-.2.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.2.7-.5.8-.6.4-1.6.6-2.9 0-1.6-.7-3-2.1-3.7-3.6-.6-1.3-.4-2.3-.0-2.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}
