/** Cliente de API para os componentes do navegador. */

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  status: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export async function api<T = unknown>(
  url: string,
  init?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init?.signal,
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401 && typeof window !== "undefined") {
      const p = window.location.pathname;
      // fora de um componente não há useRouter: um redirecionamento completo é intencional
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (p.startsWith("/admin") && !p.startsWith("/admin/login")) window.location.href = "/admin/login";
    }
    if (!res.ok) {
      return {
        ok: false,
        error: {
          message: json?.error ?? "Não foi possível concluir. Tente novamente.",
          code: json?.code,
          field: json?.field,
          status: res.status,
        },
      };
    }
    return { ok: true, data: json as T };
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      return { ok: false, error: { message: "cancelado", code: "aborted", status: 0 } };
    }
    return {
      ok: false,
      error: { message: "Sem conexão com o servidor. Verifique sua internet e tente de novo.", code: "network", status: 0 },
    };
  }
}
