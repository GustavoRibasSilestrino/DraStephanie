"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, Clock4, Copy, Plus, Sparkles, Users, Hourglass } from "lucide-react";
import { AppointmentCard, AppointmentDrawer, NewAppointmentDrawer } from "./Appointments";
import { Btn, Card, ConfirmDialog, EmptyState, PageHeader, Spinner, useToast } from "./ui";
import { Counter, Reveal } from "@/components/ui/Motion";
import { api } from "@/lib/client-api";
import { useApi } from "@/lib/use-api";
import { DEMO } from "@/lib/demo";
import { monthTitle, today } from "@/lib/datetime";
import type { DashboardData } from "@/lib/admin-data";
import type { AppointmentView } from "@/lib/appointments";

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()),
  );
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Kpi({
  label,
  value,
  icon,
  tone = "navy",
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "navy" | "gold";
  href?: string;
}) {
  const body = (
    <div
      className={`group relative h-full overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
        tone === "gold"
          ? "border-gold-400/40 bg-[linear-gradient(135deg,#fbf1d6,#f3deae)] hover:shadow-[0_24px_50px_-28px_rgba(195,154,85,0.9)]"
          : "border-gold-400/25 bg-white hover:shadow-[0_24px_50px_-30px_rgba(13,19,54,0.45)]"
      }`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone === "gold" ? "bg-navy-900 text-gold-300" : "bg-navy-900 text-gold-300"}`}>
        {icon}
      </span>
      <div className="mt-4 font-display text-[2.4rem] font-normal leading-none text-navy-900">
        <Counter to={value} duration={1.4} />
      </div>
      <div className="mt-1.5 text-[0.88rem] text-navy-900/70">{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function Dashboard() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<DashboardData>("/api/admin/dashboard");
  const [open, setOpen] = useState<AppointmentView | null>(null);
  const [creating, setCreating] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const resetDemo = async () => {
    setDemoBusy(true);
    const r = await api<{ appointments: number; patients: number }>("/api/admin/demo", { method: "POST", body: {} });
    setDemoBusy(false);
    if (!r.ok) return toast(r.error.message, "error");
    toast(`Dados de exemplo recriados: ${r.data.appointments} consultas, ${r.data.patients} pacientes.`);
    reload();
  };
  const clearDemo = async () => {
    setDemoBusy(true);
    const r = await api("/api/admin/demo", { method: "DELETE" });
    setDemoBusy(false);
    setConfirmClear(false);
    if (!r.ok) return toast(r.error.message, "error");
    toast("Dados de exemplo removidos.");
    reload();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/agendar`);
      toast("Link de agendamento copiado.");
    } catch {
      toast("Não foi possível copiar.", "error");
    }
  };

  if (loading && !data) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <EmptyState
        title="Não foi possível carregar o painel"
        text={error ?? "Tente novamente."}
        action={<Btn variant="navy" onClick={reload}>Tentar de novo</Btn>}
      />
    );
  }

  const m = data.month;
  const maxTop = Math.max(1, ...m.topServices.map((s) => s.count));
  const onChanged = (a: AppointmentView) => {
    setOpen(a);
    reload();
  };

  return (
    <>
      <PageHeader
        title={`${greeting()}, Dra. Stephanie`}
        subtitle={
          data.todayAppointments.length
            ? `Você tem ${data.todayAppointments.length} ${data.todayAppointments.length === 1 ? "consulta" : "consultas"} hoje.`
            : "Nenhuma consulta marcada para hoje."
        }
        actions={
          <>
            <Btn variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" /> Link de agendamento
            </Btn>
            <Btn variant="gold" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Nova consulta
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Consultas hoje" value={data.todayAppointments.length} icon={<CalendarDays className="h-5 w-5" />} tone="gold" href="/admin/agenda" />
        <Kpi label="Próximos 7 dias" value={data.weekCount} icon={<Clock4 className="h-5 w-5" />} href="/admin/agenda" />
        <Kpi label="Aguardando confirmação" value={data.pendingCount} icon={<Hourglass className="h-5 w-5" />} href="/admin/agenda" />
        <Kpi label="Pacientes cadastrados" value={data.patientsTotal} icon={<Users className="h-5 w-5" />} href="/admin/pacientes" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card
            title="Agenda de hoje"
            action={
              <Link href="/admin/agenda" className="text-[0.88rem] font-medium text-gold-700 underline-offset-4 hover:underline">
                Ver agenda →
              </Link>
            }
          >
            {data.todayAppointments.length ? (
              <div className="space-y-3">
                {data.todayAppointments.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <AppointmentCard a={a} onClick={() => setOpen(a)} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState title="Dia livre" text="Nenhuma consulta para hoje. Aproveite!" />
            )}
          </Card>

          <Card title="Próximas consultas">
            {data.upcoming.length ? (
              <div className="space-y-3">
                {data.upcoming.map((a) => (
                  <AppointmentCard key={a.id} a={a} showDate onClick={() => setOpen(a)} />
                ))}
              </div>
            ) : (
              <EmptyState title="Nada agendado" text="Quando os pacientes agendarem pelo site, aparecem aqui." />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={<span className="first-letter:uppercase">Resumo de {monthTitle(m.key)}</span>}>
            <dl className="grid grid-cols-2 gap-4">
              {[
                ["Consultas no mês", m.total],
                ["Concluídas", m.completed],
                ["A realizar", m.upcoming],
                ["Canceladas", m.cancelled],
                ["Faltas", m.noShow],
                ["Novos pacientes", m.newPatients],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-2xl bg-ivory-100/70 px-4 py-3">
                  <dd className="font-display text-[1.7rem] font-normal leading-none text-navy-900">{v as number}</dd>
                  <dt className="mt-1 text-[0.78rem] text-muted">{k}</dt>
                </div>
              ))}
            </dl>
            <h3 className="mb-3 mt-6 text-[0.72rem] uppercase tracking-[0.22em] text-gold-600">Atendimentos mais procurados</h3>
            {m.topServices.length ? (
              <ul className="space-y-3.5">
                {m.topServices.map((s) => (
                  <li key={s.name}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.9rem]">
                      <span className="truncate text-navy-900">{s.name}</span>
                      <span className="font-medium text-navy-900">{s.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-navy-900/8">
                      <motion.div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#d2ab62,#b48a45)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.count / maxTop) * 100}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.9rem] text-muted">Ainda sem dados neste mês.</p>
            )}
          </Card>

          {DEMO && (
            <Reveal>
              <Card className="border-gold-400/50 bg-[linear-gradient(135deg,#fffaf0,#faf0d8)]" title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-gold-600" /> Modo demonstração</span>}>
                <p className="text-[0.9rem] leading-relaxed text-navy-900/80">
                  Este painel está com <strong className="font-medium">dados de exemplo</strong> (pacientes e consultas fictícios)
                  para mostrar como é o dia a dia. Antes de cada apresentação, restaure os dados para que a agenda fique
                  sempre em torno de hoje.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Btn variant="navy" onClick={resetDemo} disabled={demoBusy}>
                    {demoBusy ? "Aguarde…" : "Restaurar dados de exemplo"}
                  </Btn>
                  <Btn variant="outline" onClick={() => setConfirmClear(true)} disabled={demoBusy}>
                    Remover exemplos
                  </Btn>
                </div>
              </Card>
            </Reveal>
          )}
        </div>
      </div>

      <AppointmentDrawer appointment={open} onClose={() => setOpen(null)} onChanged={onChanged} />
      <NewAppointmentDrawer
        open={creating}
        defaultDate={today()}
        onClose={() => setCreating(false)}
        onCreated={() => reload()}
      />
      <ConfirmDialog
        open={confirmClear}
        title="Remover os dados de exemplo?"
        text="Apaga apenas as consultas e pacientes fictícios. Agendamentos reais (feitos de verdade) são mantidos."
        confirmLabel="Remover"
        danger
        busy={demoBusy}
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearDemo}
      />
    </>
  );
}
