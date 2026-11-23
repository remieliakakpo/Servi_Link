/** Adresse d'une photo : bucket Supabase « photos », ou fichier local (/demo/…) en mode démo. */
export const urlPhoto = (chemin: string) => chemin.startsWith("/") ? chemin
  : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${chemin}`;
