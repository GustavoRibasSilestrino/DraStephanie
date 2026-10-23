import { json, errorResponse, readJson, requireAdmin } from "@/lib/api";
import { patientPatchSchema, updatePatient } from "@/lib/admin-data";
import { listAppointments } from "@/lib/appointments";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const appointments = await listAppointments({ patientId: id, order: "desc", limit: 200 });
    return json({ appointments });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await updatePatient(id, patientPatchSchema.parse(await readJson(req)));
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
