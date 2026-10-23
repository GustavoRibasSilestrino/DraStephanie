import { json, fail, errorResponse, requireAdmin } from "@/lib/api";
import { appointmentCountsByDay } from "@/lib/admin-data";
import { isDate } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sp = new URL(req.url).searchParams;
    const from = sp.get("from");
    const to = sp.get("to");
    if (!from || !to || !isDate(from) || !isDate(to)) return fail(400, "Período inválido.");
    return json({ counts: await appointmentCountsByDay(from, to) });
  } catch (err) {
    return errorResponse(err);
  }
}
