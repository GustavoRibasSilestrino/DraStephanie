"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Butterfly } from "@/components/ui/Icons";
import { TextInput } from "@/components/ui/Field";
import { api } from "@/lib/client-api";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return setError("Digite a senha.");
    setBusy(true);
    setError("");
    const r = await api("/api/admin/login", { body: { password } });
    if (!r.ok) {
      setBusy(false);
      setError(r.error.message);
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

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
          <h1 className="mt-5 font-display text-[1.7rem] font-normal uppercase tracking-[0.14em]">Dra. Stephanie</h1>
          <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.4em] text-gold-300">Painel da clínica</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-gold-300/30 bg-white p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] sm:p-9"
        >
          <h2 className="font-display text-[1.5rem] font-normal text-navy-900">Entrar</h2>
          <p className="mt-1 text-[0.92rem] text-muted">Acesso restrito à Dra. e à equipe.</p>

          <label htmlFor="pw" className="mb-2 mt-6 block text-[0.9rem] font-medium text-navy-900">
            Senha
          </label>
          <div className="relative">
            <TextInput
              id="pw"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              autoFocus
              value={password}
              invalid={!!error}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-navy-900/60 hover:bg-navy-900/5"
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-[0.88rem] text-rose-700">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="mt-7 w-full" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[0.88rem] text-ivory-200/60">
          <Link href="/" className="underline-offset-4 hover:text-gold-300 hover:underline">
            ← Voltar ao site
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
