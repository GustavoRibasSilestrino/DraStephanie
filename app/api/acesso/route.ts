import { z } from "zod";
import { cookies } from "next/headers";
import { json, fail, errorResponse, readJson } from "@/lib/api";
import { GATE_COOKIE, checkCode, createGateToken, gateActive, gateCookieOptions } from "@/lib/demo-gate";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ code: z.string().min(1).max(60) });

/** Confere o código de acesso da apresentação e libera o navegador. */
export async function POST(req: Request) {
  try {
    if (!gateActive()) return json({ ok: true });
    const rl = rateLimit(`gate:${clientIp(req)}`, 8, 15 * 60_000);
    if (!rl.ok) return fail(429, `Muitas tentativas. Tente de novo em ${Math.ceil(rl.retryAfter / 60)} min.`);

    const { code } = schema.parse(await readJson(req));
    if (!(await checkCode(code))) {
      await new Promise((r) => setTimeout(r, 600));
      return fail(401, "Código incorreto.");
    }
    (await cookies()).set(GATE_COOKIE, await createGateToken(), gateCookieOptions);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
