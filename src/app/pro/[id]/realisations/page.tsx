import { redirect } from "next/navigation";

/** Ancienne adresse du lecteur : les réalisations s'ouvrent maintenant dans la Vitrine, sur ce pro. */
export default async function Realisations({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ i?: string }> }) {
  const [{ id }, { i }] = await Promise.all([params, searchParams]);
  redirect(`/vitrine?pro=${encodeURIComponent(id)}${i ? `&i=${Number(i) || 0}` : ""}`);
}
