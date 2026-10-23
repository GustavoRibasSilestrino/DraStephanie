import { json, errorResponse, readJson, requireAdmin } from "@/lib/api";
import { getSettings, saveSettings, settingsSchema } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return json({ settings: await getSettings() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const next = settingsSchema.parse(await readJson(req));
    return json({ settings: await saveSettings(next) });
  } catch (err) {
    return errorResponse(err);
  }
}
