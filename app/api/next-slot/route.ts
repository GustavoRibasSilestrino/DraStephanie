import { json } from "@/lib/api";
import { nextFreeSlot } from "@/lib/availability";
import { listServices } from "@/lib/appointments";

export const dynamic = "force-dynamic";

/** Próximo horário livre (usado no destaque da página inicial). */
export async function GET() {
  try {
    const services = await listServices(true);
    const base = services.find((s) => s.slug === "avaliacao") ?? services[0];
    if (!base) return json({ slot: null });
    return json({ slot: await nextFreeSlot(base.durationMin), serviceId: base.id });
  } catch {
    // O destaque é opcional: se o banco não responder, a página segue sem ele.
    return json({ slot: null });
  }
}
