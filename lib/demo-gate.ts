/**
 * Trava de acesso da apresentação (modo demonstração).
 *
 * Enquanto o site é só uma PROPOSTA, quem abre o endereço precisa digitar um código
 * (DEMO_ACCESS_CODE). O código certo libera o navegador por algumas horas, por meio
 * de um cookie assinado. Trocar o código na Vercel (e refazer o deploy) revoga todos
 * os acessos de uma vez. Sem DEMO_ACCESS_CODE, ou com NEXT_PUBLIC_DEMO_MODE=false,
 * a trava fica desligada.
 *
 * Usa Web Crypto, então roda igual no `proxy` e nas rotas.
 */

export const GATE_COOKIE = "demo_access";
export const GATE_HOURS = 12;

export function gateActive(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE !== "false" && !!process.env.DEMO_ACCESS_CODE;
}

async function hmac(payload: string, key: string): Promise<string> {
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

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** A assinatura depende do código: trocar o código invalida os cookies já emitidos. */
const secret = () => `demo-gate|${process.env.DEMO_ACCESS_CODE ?? ""}`;

export async function checkCode(attempt: string): Promise<boolean> {
  const expected = process.env.DEMO_ACCESS_CODE;
  if (!expected) return false;
  const norm = (s: string) => s.trim().toUpperCase();
  const [a, b] = await Promise.all([hmac(norm(attempt), "code"), hmac(norm(expected), "code")]);
  return safeEqual(a, b);
}

export async function createGateToken(): Promise<string> {
  const expires = String(Date.now() + GATE_HOURS * 3_600_000);
  return `${expires}.${await hmac(expires, secret())}`;
}

export async function verifyGateToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig) return false;
  if (!safeEqual(sig, await hmac(expires, secret()))) return false;
  return Number(expires) > Date.now();
}

export const gateCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: GATE_HOURS * 3600,
};

/** Só aceita caminhos internos como destino do redirecionamento. */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
