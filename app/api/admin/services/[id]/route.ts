import { json, errorResponse, readJson, requireAdmin } from "@/lib/api";
import { deleteService, serviceSchema, updateService } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await updateService(id, serviceSchema.partial().parse(await readJson(req)));
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await deleteService((await params).id);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
