import { json, fail, errorResponse, requireAdmin } from "@/lib/api";
import { clearDemo, seedDemo } from "@/lib/demo-data";
import { DEMO } from "@/lib/demo";

export const dynamic = "force-dynamic";

/** Recria os dados fictícios de demonstração em torno de hoje. Só existe em modo demo. */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!DEMO) return fail(404, "Disponível apenas em modo demonstração.");
  try {
    return json(await seedDemo());
  } catch (err) {
    return errorResponse(err);
  }
}

/** Remove os dados fictícios (mantém o que foi agendado de verdade). */
export async function DELETE() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!DEMO) return fail(404, "Disponível apenas em modo demonstração.");
  try {
    await clearDemo();
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
