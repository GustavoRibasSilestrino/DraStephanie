import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { BookingError } from "./appointments";
import { DbNotConfiguredError } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

const STATUS: Record<BookingError["code"], number> = {
  slot_taken: 409,
  unavailable: 409,
  invalid: 400,
  limit: 429,
  not_found: 404,
  forbidden: 403,
  disabled: 503,
};

export function json(data: unknown, init?: number | ResponseInit) {
  const res = NextResponse.json(data, typeof init === "number" ? { status: init } : init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return json({ error: message, ...extra }, status);
}

/** Converte qualquer erro em uma resposta JSON amigável. */
export function errorResponse(err: unknown) {
  if (err instanceof BookingError) {
    return fail(STATUS[err.code], err.message, { code: err.code });
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path?.join(".") || undefined;
    return fail(400, issue?.message ?? "Dados inválidos", { code: "invalid", field });
  }
  if (err instanceof DbNotConfiguredError) {
    return fail(503, "O agendamento online está em configuração. Fale com a gente pelo WhatsApp.", {
      code: "db_not_configured",
    });
  }
  console.error("[api]", err);
  return fail(500, "Algo deu errado do nosso lado. Tente novamente em instantes.");
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new BookingError("invalid", "Requisição inválida.");
  }
}

/** Rotas do painel: exige o cookie de sessão (além do proxy, por segurança). */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) return fail(401, "Sessão expirada. Entre novamente.");
  return null;
}
