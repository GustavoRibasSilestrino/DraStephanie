import { json, errorResponse, requireAdmin } from "@/lib/api";
import { listPatients } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const q = new URL(req.url).searchParams.get("q") ?? undefined;
    return json({ patients: await listPatients(q) });
  } catch (err) {
    return errorResponse(err);
  }
}
