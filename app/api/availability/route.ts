import { json, fail, errorResponse } from "@/lib/api";
import { availableSlots, monthAvailability } from "@/lib/availability";
import { getService } from "@/lib/appointments";
import { isDate, isMonth } from "@/lib/datetime";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 *  GET /api/availability?serviceId=…&month=2026-10  → { days: { "2026-10-14": 5, … } }
 *  GET /api/availability?serviceId=…&date=2026-10-14 → { times: ["08:00", "08:30", …] }
 */
export async function GET(req: Request) {
  try {
    if (!rateLimit(`avail:${clientIp(req)}`, 120, 60_000).ok) {
      return fail(429, "Muitas consultas seguidas. Aguarde um instante.");
    }
    const url = new URL(req.url);
    const serviceId = url.searchParams.get("serviceId") ?? "";
    const service = await getService(serviceId);
    if (!service || !service.active) return fail(404, "Serviço não encontrado.");

    const month = url.searchParams.get("month");
    const date = url.searchParams.get("date");

    if (month) {
      if (!isMonth(month)) return fail(400, "Mês inválido.");
      return json({ days: await monthAvailability(month, service.durationMin) });
    }
    if (date) {
      if (!isDate(date)) return fail(400, "Data inválida.");
      return json({ times: await availableSlots(date, service.durationMin) });
    }
    return fail(400, "Informe date ou month.");
  } catch (err) {
    return errorResponse(err);
  }
}
