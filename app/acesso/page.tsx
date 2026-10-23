import type { Metadata } from "next";
import AccessForm from "./AccessForm";
import { safeNext } from "@/lib/demo-gate";

export const metadata: Metadata = {
  title: "Acesso restrito",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ voltar?: string; codigo?: string }> }) {
  const { voltar, codigo } = await searchParams;
  return <AccessForm next={safeNext(voltar)} initialCode={codigo?.slice(0, 60)} />;
}
