import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { GATE_COOKIE, gateActive, verifyGateToken } from "@/lib/demo-gate";

/**
 * Portões de entrada (no Next 16 o antigo "middleware" chama-se "proxy"):
 *
 *  1. Trava da apresentação (só em modo demo): sem o código de acesso, tudo redireciona
 *     para /acesso.
 *  2. Painel: /admin e /api/admin exigem a sessão da Dra.
 *
 * As rotas /api/admin/* também checam a sessão por conta própria (defesa em profundidade).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // 1) trava da apresentação
  if (gateActive() && pathname !== "/acesso" && pathname !== "/api/acesso") {
    const ok = await verifyGateToken(req.cookies.get(GATE_COOKIE)?.value);
    if (!ok) {
      if (isApi) {
        return NextResponse.json({ error: "Acesso restrito à apresentação.", code: "gate" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/acesso";
      url.search = pathname === "/" ? "" : `?voltar=${encodeURIComponent(pathname + req.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }

  // 2) painel da clínica
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdmin) return NextResponse.next();

  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  if (isLogin) return NextResponse.next();

  if (await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // tudo, exceto arquivos estáticos do Next e metadados que o navegador pede sozinho
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
