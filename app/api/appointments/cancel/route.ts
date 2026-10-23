import { z } from "zod";
import { after } from "next/server";
import { json, fail, errorResponse, readJson } from "@/lib/api";
import { BookingError, cancelAppointment, getAppointmentByCode, publicView } from "@/lib/appointments";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notifyAppointment } from "@/lib/notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().min(4).max(20),
  phone: z.string().min(8).max(25),
  reason: z.string().trim().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    if (!rateLimit(`cancel:${clientIp(req)}`, 15, 15 * 60_000).ok) {
      return fail(429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
    }
    const { code, phone, reason } = schema.parse(await readJson(req));
    const found = await getAppointmentByCode(code, phone);
    if (!found) throw new BookingError("not_found", "Não encontramos um agendamento com esse código e WhatsApp.");
    const cancelled = await cancelAppointment(found.id, reason ?? "", "patient");
    after(() => notifyAppointment("cancelled", cancelled));
    return json({ appointment: publicView(cancelled) });
  } catch (err) {
    return errorResponse(err);
  }
}
