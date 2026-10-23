/**
 * Login do painel: senha única (ADMIN_PASSWORD) e cookie de sessão assinado
 * com HMAC. Usa Web Crypto, então roda igual no `proxy` e nas rotas.
 *
 * Só ADMIN_PASSWORD é obrigatória; AUTH_SECRET é opcional (se ausente, a
 * assinatura deriva da própria senha — trocar a senha derruba as sessões).
 */

export const SESSION_COOKIE = "clinic_admin";
const SESSION_DAYS = 14;

export function authConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

function secret(): string {
  return process.env.AUTH_SECRET || `clinic-session|${process.env.ADMIN_PASSWORD ?? ""}`;
}

async function hmac(payload: string, key = secret()): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparação em tempo constante. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(attempt: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // compara HMACs (mesmo tamanho) em vez dos textos
  const [a, b] = await Promise.all([hmac(attempt, "pw"), hmac(expected, "pw")]);
  return safeEqual(a, b);
}

export async function createSessionToken(): Promise<string> {
  const expires = String(Date.now() + SESSION_DAYS * 86_400_000);
  return `${expires}.${await hmac(expires)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !authConfigured()) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig) return false;
  if (!safeEqual(sig, await hmac(expires))) return false;
  return Number(expires) > Date.now();
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 86_400,
};
