"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Btn, Card, ConfirmDialog, EmptyState, PageHeader, Spinner, Toggle, useToast } from "./ui";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { api } from "@/lib/client-api";
import { useApi } from "@/lib/use-api";
import { brDate, today, weekdayName } from "@/lib/datetime";
import type { Block } from "@/lib/availability";
import type { ClinicSettings, Interval } from "@/lib/settings";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // semana começando na segunda

function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  suffix: string;
}) {
  const id = label.replace(/\W/g, "");
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <TextInput
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className="pr-16"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.85rem] text-muted">{suffix}</span>
      </div>
    </Field>
  );
}

function Settings({ initial, onSaved }: { initial: ClinicSettings; onSaved: (s: ClinicSettings) => void }) {
  const toast = useToast();
  const [s, setS] = useState<ClinicSettings>(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => setS(initial), [initial]);
  const dirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(initial), [s, initial]);

  const set = <K extends keyof ClinicSettings>(k: K, v: ClinicSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  const setDay = (d: number, list: Interval[]) => setS((p) => ({ ...p, schedule: { ...p.schedule, [String(d)]: list } }));

  const save = async () => {
    for (const k of ["minNoticeHours", "maxAdvanceDays", "cancelLimitHours", "maxActivePerPhone"] as const) {
      if (Number.isNaN(s[k])) return toast("Preencha todos os números das regras.", "error");
    }
    for (const d of ORDER) {
      for (const iv of s.schedule[String(d)] ?? []) {
        if (!iv.start || !iv.end || iv.end <= iv.start) {
          return toast(`${weekdayName(d)}: o fim do horário precisa ser depois do início.`, "error");
        }
      }
    }
    setBusy(true);
    const r = await api<{ settings: ClinicSettings }>("/api/admin/settings", { method: "PUT", body: s });
    setBusy(false);
    if (!r.ok) return toast(r.error.message, "error");
    toast("Configurações salvas.");
    onSaved(r.data.settings);
  };

  return (
    <div className="space-y-6">
      <Card title="Agendamento online">
        <div className="space-y-5">
          <Toggle
            checked={s.bookingEnabled}
            onChange={(v) => set("bookingEnabled", v)}
            label="Receber agendamentos pelo site"
            hint="Desligue para pausar (ex.: férias). O site mostra o botão do WhatsApp no lugar."
          />
          <div className="h-px bg-gold-400/20" />
          <Toggle
            checked={s.autoConfirm}
            onChange={(v) => set("autoConfirm", v)}
            label="Confirmar automaticamente"
            hint="Ligado: o horário já nasce confirmado. Desligado: fica “aguardando” até você confirmar."
          />
          <div className="h-px bg-gold-400/20" />
          <Toggle
            checked={s.blockHolidays}
            onChange={(v) => set("blockHolidays", v)}
            label="Bloquear feriados nacionais"
            hint="Inclui Carnaval, Sexta-feira Santa e Corpus Christi. Feriados municipais: use os bloqueios abaixo."
          />
          <div className="h-px bg-gold-400/20" />
          <Field label="Aviso na página de agendamento" optional htmlFor="notice" hint="Ex.: “Estaremos de férias de 10 a 20/01.” Aparece no topo do agendamento.">
            <TextInput id="notice" value={s.notice} maxLength={300} onChange={(e) => set("notice", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Horário de atendimento">
        <p className="mb-4 text-[0.9rem] text-muted">Os pacientes só veem horários dentro destes períodos.</p>
        <ul className="divide-y divide-gold-400/20">
          {ORDER.map((d) => {
            const list = s.schedule[String(d)] ?? [];
            const on = list.length > 0;
            return (
              <li key={d} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex min-w-[10rem] cursor-pointer items-center gap-3">
                    <span className="relative">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => setDay(d, e.target.checked ? [{ start: "08:00", end: "12:00" }, { start: "13:30", end: "17:30" }] : [])}
                        className="peer sr-only"
                        aria-label={`Atende ${weekdayName(d)}`}
                      />
                      <span className="block h-6 w-11 rounded-full bg-navy-900/15 transition-colors peer-checked:bg-gold-500" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                    </span>
                    <span className={`text-[1rem] font-medium capitalize ${on ? "text-navy-900" : "text-navy-900/50"}`}>{weekdayName(d)}</span>
                  </label>
                  {!on && <span className="text-[0.88rem] text-muted">Sem atendimento</span>}
                </div>
                {on && (
                  <div className="mt-3 space-y-2 sm:pl-14">
                    {list.map((iv, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={iv.start}
                          onChange={(e) => setDay(d, list.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                          className="h-11 w-28 rounded-xl border border-navy-900/15 bg-white px-3 text-[0.95rem] outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20"
                          aria-label="Início"
                        />
                        <span className="text-muted">até</span>
                        <input
                          type="time"
                          value={iv.end}
                          onChange={(e) => setDay(d, list.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                          className="h-11 w-28 rounded-xl border border-navy-900/15 bg-white px-3 text-[0.95rem] outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20"
                          aria-label="Fim"
                        />
                        <button
                          type="button"
                          onClick={() => setDay(d, list.filter((_, j) => j !== i))}
                          aria-label="Remover período"
                          className="grid h-10 w-10 place-items-center rounded-full text-navy-900/50 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDay(d, [...list, { start: "14:00", end: "18:00" }])}
                      className="inline-flex items-center gap-1.5 text-[0.88rem] font-medium text-gold-700 underline-offset-4 hover:underline"
                    >
                      <Plus className="h-4 w-4" /> Adicionar período
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Regras de agendamento">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Intervalo entre horários" htmlFor="step" hint="De quanto em quanto tempo os horários são oferecidos.">
            <Select id="step" value={s.slotStepMin} onChange={(e) => set("slotStepMin", Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n} minutos
                </option>
              ))}
            </Select>
          </Field>
          <NumberField label="Antecedência mínima" hint="O paciente não agenda com menos tempo que isso." value={s.minNoticeHours} onChange={(n) => set("minNoticeHours", n)} min={0} max={168} suffix="horas" />
          <NumberField label="Agendar até" hint="Quantos dias à frente a agenda fica aberta." value={s.maxAdvanceDays} onChange={(n) => set("maxAdvanceDays", n)} min={1} max={365} suffix="dias" />
          <NumberField label="Cancelar/remarcar até" hint="Antes da consulta, pelo site. Depois disso, só pelo WhatsApp." value={s.cancelLimitHours} onChange={(n) => set("cancelLimitHours", n)} min={0} max={168} suffix="horas" />
          <NumberField label="Consultas ativas por telefone" hint="Evita agendamentos em excesso por um único número." value={s.maxActivePerPhone} onChange={(n) => set("maxActivePerPhone", n)} min={1} max={20} suffix="no máx." />
        </div>
      </Card>

      {/* barra de salvar */}
      <div className="sticky bottom-20 z-20 flex items-center justify-between gap-3 rounded-2xl border border-gold-400/40 bg-white/95 px-5 py-3 shadow-[0_20px_50px_-20px_rgba(13,19,54,0.5)] backdrop-blur lg:bottom-6">
        <span className="text-[0.9rem] text-muted">{dirty ? "Você tem alterações não salvas." : "Tudo salvo."}</span>
        <div className="flex gap-2">
          {dirty && (
            <Btn variant="ghost" onClick={() => setS(initial)} disabled={busy}>
              Desfazer
            </Btn>
          )}
          <Btn variant="gold" onClick={save} disabled={!dirty || busy} className="px-6">
            {busy ? "Salvando…" : "Salvar alterações"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Blocks() {
  const toast = useToast();
  const { data, loading, reload } = useApi<{ blocks: Block[] }>("/api/admin/blocks");
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [allDay, setAllDay] = useState(true);
  const [tStart, setTStart] = useState("08:00");
  const [tEnd, setTEnd] = useState("12:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Block | null>(null);
  const [error, setError] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (end < start) return setError("A data final deve ser depois da inicial.");
    if (!allDay && tEnd <= tStart) return setError("O horário final deve ser depois do inicial.");
    setBusy(true);
    const r = await api("/api/admin/blocks", {
      body: {
        dateStart: start,
        dateEnd: end,
        timeStart: allDay ? null : tStart,
        timeEnd: allDay ? null : tEnd,
        reason: reason.trim(),
      },
    });
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    toast("Bloqueio criado. Esses horários saíram do site.");
    setReason("");
    reload();
  };

  const remove = async () => {
    if (!del) return;
    setBusy(true);
    const r = await api(`/api/admin/blocks/${del.id}`, { method: "DELETE" });
    setBusy(false);
    setDel(null);
    if (!r.ok) return toast(r.error.message, "error");
    toast("Bloqueio removido.");
    reload();
  };

  return (
    <Card title="Bloqueios de agenda">
      <p className="mb-5 text-[0.9rem] text-muted">
        Férias, cursos, feriados municipais, consultas pessoais… Os horários bloqueados somem do site (consultas já
        marcadas não são afetadas).
      </p>

      <form onSubmit={add} className="rounded-2xl border border-gold-400/25 bg-ivory-100/60 p-4 sm:p-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="De" htmlFor="b-start">
            <TextInput id="b-start" type="date" value={start} onChange={(e) => { setStart(e.target.value); if (end < e.target.value) setEnd(e.target.value); }} />
          </Field>
          <Field label="Até" htmlFor="b-end">
            <TextInput id="b-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Toggle checked={allDay} onChange={setAllDay} label="Dia inteiro" />
        </div>
        {!allDay && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Das" htmlFor="b-ts"><TextInput id="b-ts" type="time" value={tStart} onChange={(e) => setTStart(e.target.value)} /></Field>
            <Field label="Às" htmlFor="b-te"><TextInput id="b-te" type="time" value={tEnd} onChange={(e) => setTEnd(e.target.value)} /></Field>
          </div>
        )}
        <Field label="Motivo" optional className="mt-4" htmlFor="b-reason">
          <TextInput id="b-reason" value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: Férias" />
        </Field>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-[0.88rem] text-rose-700">{error}</p>}
        <div className="mt-5 flex justify-end">
          <Btn variant="navy" type="submit" disabled={busy}>
            <Plus className="h-4 w-4" /> Bloquear período
          </Btn>
        </div>
      </form>

      <h3 className="mb-3 mt-7 text-[0.72rem] uppercase tracking-[0.22em] text-gold-600">Próximos bloqueios</h3>
      {loading && !data ? (
        <Spinner />
      ) : !data?.blocks.length ? (
        <EmptyState title="Nenhum bloqueio" text="A agenda está aberta conforme o horário semanal." />
      ) : (
        <ul className="space-y-2.5">
          {data.blocks.map((b) => (
            <li key={b.id} className="flex items-center gap-3 rounded-2xl border border-gold-400/25 bg-white px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[0.98rem] font-medium text-navy-900">
                  {b.dateStart === b.dateEnd ? brDate(b.dateStart) : `${brDate(b.dateStart)} a ${brDate(b.dateEnd)}`}
                  <span className="ml-2 text-[0.85rem] font-normal text-muted">
                    {b.timeStart ? `${b.timeStart}–${b.timeEnd}` : "dia inteiro"}
                  </span>
                </p>
                {b.reason && <p className="truncate text-[0.86rem] text-muted">{b.reason}</p>}
              </div>
              <button
                type="button"
                onClick={() => setDel(b)}
                aria-label="Remover bloqueio"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-navy-900/50 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!del}
        title="Remover este bloqueio?"
        text="Os horários voltam a ser oferecidos no site."
        confirmLabel="Remover"
        danger
        busy={busy}
        onCancel={() => setDel(null)}
        onConfirm={remove}
      />
    </Card>
  );
}

export default function ScheduleView() {
  const { data, loading, error, reload, setData } = useApi<{ settings: ClinicSettings }>("/api/admin/settings");

  return (
    <>
      <PageHeader title="Horários e regras" subtitle="Defina quando você atende e como o agendamento online funciona." />
      {loading && !data ? (
        <div className="grid place-items-center py-20"><Spinner className="h-7 w-7" /></div>
      ) : error || !data ? (
        <EmptyState title="Não foi possível carregar" text={error ?? ""} action={<Btn variant="navy" onClick={reload}>Tentar de novo</Btn>} />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1.25fr_1fr]">
          <Settings initial={data.settings} onSaved={(s) => setData({ settings: s })} />
          <Blocks />
        </div>
      )}
    </>
  );
}
