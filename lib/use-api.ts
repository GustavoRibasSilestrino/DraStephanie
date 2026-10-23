"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./client-api";

/** GET com estado de carregamento e recarga manual (painel). */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!url);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!url) return;
    const mine = ++seq.current;
    setLoading(true);
    const r = await api<T>(url);
    if (mine !== seq.current) return; // resposta de uma chamada antiga
    if (r.ok) {
      setData(r.data);
      setError(null);
    } else {
      setError(r.error.message);
    }
    setLoading(false);
  }, [url]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
