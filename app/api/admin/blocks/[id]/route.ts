import { json, errorResponse, requireAdmin } from "@/lib/api";
import { deleteBlock } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await deleteBlock((await params).id);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
