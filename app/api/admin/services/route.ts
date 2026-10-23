import { json, errorResponse, readJson, requireAdmin } from "@/lib/api";
import { createService, serviceSchema } from "@/lib/admin-data";
import { listServices } from "@/lib/appointments";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return json({ services: await listServices(false) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const service = await createService(serviceSchema.parse(await readJson(req)));
    return json({ service }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
