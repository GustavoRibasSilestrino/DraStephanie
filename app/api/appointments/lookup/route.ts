import { z } from "zod";
import { json, fail, errorResponse, readJson } from "@/lib/api";
import { getAppointmentByCode, patientCanModify, publicView } from "@/lib/appointments";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { DEMO } from "@/lib/demo";

export const dynamic = "force-dynamic";

const schema = z.object({ code: z.string().min(4).max(20), phone: z.string().min(8).max(25) });

/** Consulta de agendamento: exige o código E o WhatsApp usado no agendamento. */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`lookup:${ip}`, 15, 15 * 60_000).ok) {
      return fail(429, "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
    }
    const { code, phone } = schema.parse(await readJson(req));
    const found = await getAppointmentByCode(code, phone);
    // Mesma resposta para "código errado" e "telefone errado": não revela qual acertou.
    if (!found) return fail(404, "Não encontramos um agendamento com esse código e WhatsApp.");
    return json({
      appointment: publicView(found),
      canModify: await patientCanModify(found),
      demo: DEMO,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
