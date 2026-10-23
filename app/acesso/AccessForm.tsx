"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Butterfly } from "@/components/ui/Icons";
import { TextInput } from "@/components/ui/Field";
import { api } from "@/lib/client-api";

export default function AccessForm({ next, initialCode }: { next: string; initialCode?: string }) {
  const [code, setCode] = useState(initialCode ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const enter = async (value: string) => {
    if (!value.trim()) return setError("Digite o código de acesso.");
    setBusy(true);
    setError("");
    const r = await api("/api/acesso", { body: { code: value } });
    if (!r.ok) {
      setBusy(false);
      setError(r.error.message);
      return;
    }
    // navegação completa: o servidor precisa enxergar o cookie recém-criado
    window.location.assign(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    enter(code);
  };

  // Link mágico (/acesso?codigo=...): entra sozinho, sem digitar
  const auto = useRef(false);
  useEffect(() => {
    if (initialCode && !auto.current) {
      auto.current = true;
      enter(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="pattern-geo relative grid min-h-dvh place-items-center overflow-hidden bg-navy-950 px-4 py-10">
      <div aria-hidden className="absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[120px]" />
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center text-ivory-50">
          <Butterfly className="mx-auto h-14 w-14 text-gold-400" />
          <h1 className="mt-5 text-[1.5rem] font-normal uppercase tracking-[0.14em]">Apresentação privada</h1>
          <p className="mt-2 text-[0.64rem] uppercase tracking-[0.4em] text-gold-300">Proposta por DEV RIBAS</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-gold-300/30 bg-white p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] sm:p-9"
        >
          <h2 className="text-[1.35rem] font-normal text-navy-900">Digite o código de acesso</h2>
          <p className="mt-1 text-[0.92rem] text-muted">
            Este site é um protótipo em demonstração e só pode ser visto com o código informado na apresentação.
          </p>

          <label htmlFor="code" className="mb-2 mt-6 block text-[0.9rem] font-medium text-navy-900">
            Código
          </label>
          <TextInput
            id="code"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={code}
            invalid={!!error}
            onChange={(e) => setCode(e.target.value)}
            className="text-center text-[1.15rem] font-medium uppercase tracking-[0.25em]"
          />
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-[0.88rem] text-rose-700">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="mt-7 w-full" disabled={busy}>
            {busy ? "Verificando…" : "Entrar"}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
