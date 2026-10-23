"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppointmentCard, AppointmentDrawer, NewAppointmentDrawer } from "./Appointments";
import { Btn, Card, EmptyState, PageHeader, Spinner } from "./ui";
import { useApi } from "@/lib/use-api";
import {
  addDays,
  addMonths,
  fromMinutes,
  longDate,
  monthOf,
  monthRange,
  monthTitle,
  toMinutes,
  today,
  weekday,
} from "@/lib/datetime";
import { holidayName } from "@/lib/holidays";
import type { AppointmentView } from "@/lib/appointments";
import type { Block } from "@/lib/availability";
import type { ClinicSettings } from "@/lib/settings";

const WD = ["D", "S", "T", "Q", "Q", "S", "S"];

function MonthGrid({
  month,
  selected,
  counts,
  onSelect,
  onMonth,
}: {
  month: string;
  selected: string;
  counts: Record<string, number>;
  onSelect: (d: string) => void;
  onMonth: (m: string) => void;
}) {
  const { first, last } = monthRange(month);
  const lead = weekday(first);
  const days = Number(last.slice(8));
  const t = today();
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" onClick={() => onMonth(addMonths(month, -1))} className="grid h-10 w-10 place-items-center rounded-full border border-navy-900/15 hover:border-gold-500 hover:bg-gold-400/10">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-display text-[1.15rem] font-medium text-navy-900 first-letter:uppercase">{monthTitle(month)}</h3>
        <button type="button" aria-label="Próximo mês" onClick={() => onMonth(addMonths(month, 1))} className="grid h-10 w-10 place-items-center rounded-full border border-navy-900/15 hover:border-gold-500 hover:bg-gold-400/10">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gold-600" aria-hidden>
        {WD.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = `${month}-${String(i + 1).padStart(2, "0")}`;
          const n = counts[d] ?? 0;
          const sel = d === selected;
          const isToday = d === t;
          const off = weekday(d) === 0 || weekday(d) === 6;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelect(d)}
              aria-pressed={sel}
              className={`relative flex h-[3.1rem] flex-col items-center justify-center gap-0.5 rounded-xl text-[0.92rem] leading-none transition-all duration-200 ${
                sel
                  ? "bg-navy-900 font-semibold text-ivory-50 shadow-[0_10px_24px_-10px_rgba(13,19,54,0.8)]"
                  : isToday
                    ? "border border-gold-500 font-semibold text-navy-900 hover:bg-gold-400/15"
                    : off
                      ? "text-navy-900/40 hover:bg-navy-900/5"
                      : "text-navy-900 hover:bg-gold-400/15"
              }`}
            >
              <span>{i + 1}</span>
              <span
                className={`h-[0.95rem] min-w-[0.95rem] rounded-full px-1 text-[0.62rem] font-semibold leading-[0.95rem] ${
                  n > 0 ? (sel ? "bg-gold-400 text-navy-950" : "bg-gold-400/25 text-gold-700") : "opacity-0"
                }`}
              >
                {n > 0 ? n : "·"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Row =
  | { kind: "appt"; a: AppointmentView; start: number }
  | { kind: "free"; from: string; to: string; start: number };

export default function AgendaView() {
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(monthOf(today()));
  const [open, setOpen] = useState<AppointmentView | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCal, setShowCal] = useState(false);

  const { first, last } = monthRange(month);
  const counts = useApi<{ counts: Record<string, number> }>(`/api/admin/counts?from=${first}&to=${last}`);
  const day = useApi<{ appointments: AppointmentView[] }>(`/api/admin/appointments?from=${date}&to=${date}`);
  const settings = useApi<{ settings: ClinicSettings }>("/api/admin/settings");
  const blocks = useApi<{ blocks: Block[] }>("/api/admin/blocks");

  const goto = (d: string) => {
    setDate(d);
    setMonth(monthOf(d));
  };

  const refresh = () => {
    day.reload();
    counts.reload();
  };

  // avisos do dia + horário de expediente
  const info = useMemo(() => {
    const out: { kind: "holiday" | "block" | "closed"; text: string }[] = [];
    const s = settings.data?.settings;
    const intervals = s?.schedule[String(weekday(date))] ?? [];
    const h = holidayName(date);
    if (h) out.push({ kind: "holiday", text: `Feriado: ${h}${s?.blockHolidays ? " — o site não oferece horários" : ""}` });
    for (const b of blocks.data?.blocks ?? []) {
      if (date >= b.dateStart && date <= b.dateEnd) {
        out.push({
          kind: "block",
          text: `Bloqueado${b.timeStart ? ` (${b.timeStart}–${b.timeEnd})` : ""}${b.reason ? `: ${b.reason}` : ""}`,
        });
      }
    }
    if (s && !intervals.length) out.push({ kind: "closed", text: "Dia sem atendimento na grade semanal" });
    return { notes: out, intervals };
  }, [date, settings.data, blocks.data]);

  // lista do dia com os intervalos livres entre as consultas
  const rows = useMemo<Row[]>(() => {
    const appts = (day.data?.appointments ?? []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
    const list: Row[] = appts.map((a) => ({ kind: "appt", a, start: toMinutes(a.startTime) }));
    const busy = appts
      .filter((a) => a.status !== "cancelled")
      .map((a) => [toMinutes(a.startTime), toMinutes(a.endTime)] as const);
    for (const [s, e] of info.intervals.map((i) => [toMinutes(i.start), toMinutes(i.end)] as const)) {
      let cursor = s;
      for (const [bs, be] of busy.filter(([x, y]) => y > s && x < e).sort((a, b) => a[0] - b[0])) {
        if (bs - cursor >= 30) list.push({ kind: "free", from: fromMinutes(cursor), to: fromMinutes(bs), start: cursor });
        cursor = Math.max(cursor, be);
      }
      if (e - cursor >= 30) list.push({ kind: "free", from: fromMinutes(cursor), to: fromMinutes(e), start: cursor });
    }
    return list.sort((a, b) => a.start - b.start);
  }, [day.data, info.intervals]);

  const isToday = date === today();
  const activeCount = (day.data?.appointments ?? []).filter((a) => a.status !== "cancelled").length;

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={
          <span className="first-letter:uppercase">
            {longDate(date, true)}
            {day.data ? ` · ${activeCount} ${activeCount === 1 ? "consulta" : "consultas"}` : ""}
          </span>
        }
        actions={
          <Btn variant="gold" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nova consulta
          </Btn>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[21rem_1fr]">
        {/* calendário */}
        <div className="lg:sticky lg:top-6">
          <div className="mb-3 flex items-center gap-2 lg:hidden">
            <button type="button" onClick={() => goto(addDays(date, -1))} aria-label="Dia anterior" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-navy-900/15 bg-white text-navy-900 transition-colors hover:border-gold-500 hover:bg-gold-400/10">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
            <Btn variant={isToday ? "gold" : "outline"} onClick={() => goto(today())} className="flex-1">
              Hoje
            </Btn>
            <Btn variant="outline" onClick={() => setShowCal((s) => !s)} className="flex-1">
              <CalendarDays className="h-4 w-4" /> {showCal ? "Ocultar mês" : "Ver mês"}
            </Btn>
            <button type="button" onClick={() => goto(addDays(date, 1))} aria-label="Próximo dia" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-navy-900/15 bg-white text-navy-900 transition-colors hover:border-gold-500 hover:bg-gold-400/10">
                      <ChevronRight className="h-5 w-5" />
                    </button>
          </div>
          <div className={`${showCal ? "block" : "hidden"} lg:block`}>
                <Card>
                  <MonthGrid month={month} selected={date} counts={counts.data?.counts ?? {}} onSelect={(d) => { goto(d); setShowCal(false); }} onMonth={setMonth} />
                  <div className="mt-4 hidden items-center justify-between gap-2 lg:flex">
                    <button type="button" onClick={() => goto(addDays(date, -1))} aria-label="Dia anterior" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-navy-900/15 bg-white text-navy-900 transition-colors hover:border-gold-500 hover:bg-gold-400/10">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <Btn variant={isToday ? "gold" : "outline"} onClick={() => goto(today())} className="flex-1">
                      Hoje
                    </Btn>
                    <button type="button" onClick={() => goto(addDays(date, 1))} aria-label="Próximo dia" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-navy-900/15 bg-white text-navy-900 transition-colors hover:border-gold-500 hover:bg-gold-400/10">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </Card>
          </div>
        </div>

        {/* dia */}
        <div className="min-w-0">
          {info.notes.length > 0 && (
            <div className="mb-4 space-y-2">
              {info.notes.map((n, i) => (
                <p
                  key={i}
                  className={`rounded-2xl px-4 py-3 text-[0.9rem] ${
                    n.kind === "closed" ? "bg-navy-900/5 text-navy-900/70" : "border border-gold-400/50 bg-gold-400/10 text-navy-900"
                  }`}
                >
                  {n.text}
                </p>
              ))}
            </div>
          )}

          {day.loading && !day.data ? (
            <div className="grid place-items-center py-20">
              <Spinner className="h-7 w-7" />
            </div>
          ) : day.error ? (
            <EmptyState title="Não foi possível carregar o dia" text={day.error} action={<Btn variant="navy" onClick={day.reload}>Tentar de novo</Btn>} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="Nenhuma consulta neste dia"
              text="Use “Nova consulta” para lançar um agendamento feito por telefone ou WhatsApp."
              action={<Btn variant="gold" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova consulta</Btn>}
            />
          ) : (
            <motion.div key={date} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-3">
              {rows.map((r) =>
                r.kind === "appt" ? (
                  <AppointmentCard key={r.a.id} a={r.a} onClick={() => setOpen(r.a)} />
                ) : (
                  <div
                    key={`free-${r.from}`}
                    className="flex items-center gap-4 rounded-2xl border border-dashed border-gold-400/40 px-4 py-3 text-[0.9rem] text-muted"
                  >
                    <span className="w-[4.25rem] text-center font-medium text-gold-700">{r.from}</span>
                    <span>
                      Livre até {r.to} <span className="text-muted/70">· {toMinutes(r.to) - toMinutes(r.from)} min</span>
                    </span>
                  </div>
                ),
              )}
            </motion.div>
          )}
        </div>
      </div>

      <AppointmentDrawer
        appointment={open}
        onClose={() => setOpen(null)}
        onChanged={(a) => {
          setOpen(a);
          refresh();
        }}
      />
      <NewAppointmentDrawer open={creating} defaultDate={date} onClose={() => setCreating(false)} onCreated={refresh} />
    </>
  );
}
