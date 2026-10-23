import { json, errorResponse } from "@/lib/api";
import { listServices } from "@/lib/appointments";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [services, settings] = await Promise.all([listServices(true), getSettings()]);
    return json({
      services: services.map(({ id, slug, name, description, durationMin, icon }) => ({
        id,
        slug,
        name,
        description,
        durationMin,
        icon,
      })),
      booking: {
        enabled: settings.bookingEnabled,
        notice: settings.notice,
        maxAdvanceDays: settings.maxAdvanceDays,
        minNoticeHours: settings.minNoticeHours,
        cancelLimitHours: settings.cancelLimitHours,
        autoConfirm: settings.autoConfirm,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
