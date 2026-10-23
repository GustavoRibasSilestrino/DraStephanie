import { z } from "zod";
import { json, errorResponse, readJson, requireAdmin } from "@/lib/api";
import {
  ACTIVE_STATUSES,
  createAppointment,
  createSchema,
  listAppointments,
  type Status,
} from "@/lib/appointments";
import { isDate } from "@/lib/datetime";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const sp = new URL(req.url).searchParams;
    const from = sp.get("from");
    const to = sp.get("to");
    const status = sp.get("status");
    const appointments = await listAppointments({
      from: from && isDate(from) ? from : undefined,
      to: to && isDate(to) ? to : undefined,
      status:
        status === "active" || (STATUSES as readonly string[]).includes(status ?? "")
          ? (status as Status | "active")
          : undefined,
      q: sp.get("q") ?? undefined,
      patientId: sp.get("patientId") ?? undefined,
      order: sp.get("order") === "desc" ? "desc" : "asc",
      limit: Number(sp.get("limit")) || undefined,
    });
    return json({ appointments });
  } catch (err) {
    return errorResponse(err);
  }
}

// A Dra. pode lançar consultas fora da grade (encaixes) e sem aceite de privacidade.
const manualSchema = createSchema
  .omit({ consent: true, website: true })
  .extend({ status: z.enum(STATUSES).optional(), force: z.boolean().optional() });

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = manualSchema.parse(await readJson(req));
    const { status, force, ...input } = body;
    const created = await createAppointment(
      { ...input, consent: true },
      {
        source: "admin",
        force: force ?? true,
        status: status && ACTIVE_STATUSES.concat(["completed"]).includes(status) ? status : "confirmed",
      },
    );
    return json({ appointment: created }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
