import { z } from "zod";
import { cookies } from "next/headers";
import { json, fail, errorResponse, readJson } from "@/lib/api";
import {
  SESSION_COOKIE,
  authConfigured,
  checkPassword,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  try {
    if (!authConfigured()) {
      return fail(503, "Painel não configurado: defina a variável ADMIN_PASSWORD.");
    }
    const rl = rateLimit(`login:${clientIp(req)}`, 6, 15 * 60_000);
    if (!rl.ok) {
      return fail(429, `Muitas tentativas. Tente novamente em ${Math.ceil(rl.retryAfter / 60)} min.`);
    }
    const { password } = schema.parse(await readJson(req));
    if (!(await checkPassword(password))) {
      await new Promise((r) => setTimeout(r, 600)); // desacelera tentativas de adivinhar
      return fail(401, "Senha incorreta.");
    }
    (await cookies()).set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
