import { z } from "zod";
import { after } from "next/server";
import { json, fail, errorResponse, readJson } from "@/lib/api";
import {
  BookingError,
  getAppointmentByCode,
  patientCanModify,
  publicView,
  rescheduleAppointment,
} from "@/lib/appointments";
import { isDate, isTime } from "@/lib/datetime";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notifyAppointment } from "@/lib/notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().min(4).max(20),
  phone: z.string().min(8).max(25),
  date: z.string().refine(isDate, "Data inválida"),
  time: z.string().refine(isTime, "Horário inválido"),
});

export async function POST(req: Request) {
  try {
    if (!rateLimit(`resched:${clientIp(req)}`, 15, 15 * 60_000).ok) {
      return fail(429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
    }
    const { code, phone, date, time } = schema.parse(await readJson(req));
    const found = await getAppointmentByCode(code, phone);
    if (!found) throw new BookingError("not_found", "Não encontramos um agendamento com esse código e WhatsApp.");
    const moved = await rescheduleAppointment(found.id, date, time, { by: "patient" });
    after(() => notifyAppointment("rescheduled", moved));
    return json({ appointment: publicView(moved), canModify: await patientCanModify(moved) });
  } catch (err) {
    return errorResponse(err);
  }
}
