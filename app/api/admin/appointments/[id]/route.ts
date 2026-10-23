import { z } from "zod";
import { after } from "next/server";
import { json, errorResponse, readJson, requireAdmin } from "@/lib/api";
import {
  BookingError,
  cancelAppointment,
  getAppointmentById,
  rescheduleAppointment,
  setStatus,
  updateAppointmentNotes,
} from "@/lib/appointments";
import { isDate, isTime } from "@/lib/datetime";
import { notifyAppointment } from "@/lib/notify";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  cancelReason: z.string().trim().max(200).optional(),
  date: z.string().refine(isDate).optional(),
  time: z.string().refine(isTime).optional(),
  internalNotes: z.string().max(2000).optional(),
  paymentType: z.enum(["particular", "convenio"]).optional(),
  insurance: z.string().trim().max(60).nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const a = await getAppointmentById((await params).id);
    if (!a) throw new BookingError("not_found", "Agendamento não encontrado.");
    return json({ appointment: a });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = patchSchema.parse(await readJson(req));
    let current = await getAppointmentById(id);
    if (!current) throw new BookingError("not_found", "Agendamento não encontrado.");

    if ((body.date && !body.time) || (!body.date && body.time)) {
      throw new BookingError("invalid", "Informe data e horário para remarcar.");
    }
    if (body.date && body.time) {
      current = await rescheduleAppointment(id, body.date, body.time, { by: "admin" });
      after(() => notifyAppointment("rescheduled", current!));
    }
    if (body.status === "cancelled" && current.status !== "cancelled") {
      current = await cancelAppointment(id, body.cancelReason ?? "", "admin");
      after(() => notifyAppointment("cancelled", current!));
    } else if (body.status) {
      current = await setStatus(id, body.status);
    }
    if (body.internalNotes !== undefined || body.paymentType) {
      current = await updateAppointmentNotes(id, {
        internalNotes: body.internalNotes,
        paymentType: body.paymentType,
        insurance: body.insurance,
      });
    }
    return json({ appointment: current });
  } catch (err) {
    return errorResponse(err);
  }
}
