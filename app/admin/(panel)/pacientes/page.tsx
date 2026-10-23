import PatientsView from "@/components/admin/PatientsView";

export const metadata = { title: "Pacientes" };

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <PatientsView initialQuery={q ?? ""} />;
}
