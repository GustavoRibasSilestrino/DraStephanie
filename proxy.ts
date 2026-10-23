import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Portão do painel. No Next 16 o antigo "middleware" chama-se "proxy".
 * As rotas /api/admin/* também checam a sessão por conta própria
 * (defesa em profundidade) — aqui só barramos cedo e redirecionamos páginas.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  if (isLogin) return NextResponse.next();

  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
