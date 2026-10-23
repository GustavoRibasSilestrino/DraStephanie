import { json, errorResponse, requireAdmin } from "@/lib/api";
import { getDashboard } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return json(await getDashboard());
  } catch (err) {
    return errorResponse(err);
  }
}
