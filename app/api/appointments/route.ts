import { after } from "next/server";
import { json, fail, errorResponse, readJson } from "@/lib/api";
import { createAppointment, createSchema, publicView } from "@/lib/appointments";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notifyAppointment } from "@/lib/notify";
import { DEMO } from "@/lib/demo";

export const dynamic = "force-dynamic";

/** Cria um agendamento feito pelo paciente no site. */
export async function POST(req: Request) {
  try {
    if (!rateLimit(`book:${clientIp(req)}`, 8, 10 * 60_000).ok) {
      return fail(429, "Muitas tentativas seguidas. Tente novamente em alguns minutos ou fale pelo WhatsApp.");
    }
    const body = await readJson(req);
    const parsed = createSchema.parse(body);

    // Honeypot: bots preenchem o campo escondido. Respondemos "ok" sem gravar nada.
    if (parsed.website) return json({ ok: true }, 201);

    const created = await createAppointment(parsed, { source: "site" });
    after(() => notifyAppointment("created", created));
    return json({ appointment: publicView(created), demo: DEMO }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
