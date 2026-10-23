"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Phone, Mail, StickyNote, CalendarClock, Check, X, RotateCcw, UserX, CheckCheck } from "lucide-react";
import Calendar, { TimeSlots } from "@/components/booking/Calendar";
import { Btn, ConfirmDialog, Drawer, useToast } from "./ui";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import StatusBadge from "@/components/ui/StatusBadge";
import { api } from "@/lib/client-api";
import { addDays, brDate, longDate, monthOf, shortDate, today } from "@/lib/datetime";
import { formatPhone, maskPhone } from "@/lib/format";
import { clinicToPatientLink } from "@/lib/whatsapp";
import type { AppointmentView } from "@/lib/appointments";

type Service = { id: string; name: string; durationMin: number; active: boolean };

// ───────────────────────── cartão de consulta ─────────────────────────

export function AppointmentCard({
  a,
  onClick,
  showDate,
}: {
  a: AppointmentView;
  onClick: () => void;
  showDate?: boolean;
}) {
  const inactive = a.status === "cancelled" || a.status === "no_show";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-stretch gap-4 rounded-2xl border bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/60 hover:shadow-[0_18px_40px_-26px_rgba(13,19,54,0.45)] ${
        inactive ? "border-navy-900/10 opacity-70" : "border-gold-400/25"
      }`}
    >
      <div className="w-[4.25rem] shrink-0 text-center">
        {showDate && <div className="text-[0.7rem] font-medium uppercase tracking-wide text-gold-700">{shortDate(a.date)}</div>}
        <div className="font-display text-[1.35rem] font-medium leading-none text-navy-900">{a.startTime}</div>
        <div className="mt-1 text-[0.75rem] text-muted">{a.endTime}</div>
      </div>
      <div className="w-px shrink-0 bg-gradient-to-b from-gold-400/60 to-gold-400/10" />
      <div className="min-w-0 flex-1">
        <div className={`truncate text-[1.02rem] font-medium text-navy-900 ${inactive ? "line-through decoration-navy-900/30" : ""}`}>
          {a.patient.name}
        </div>
        <div className="truncate text-[0.88rem] text-muted">{a.serviceName}</div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={a.status} />
          {a.paymentType === "convenio" && (
            <span className="rounded-full bg-navy-900/5 px-2.5 py-1 text-[0.72rem] text-navy-900/70">
              {a.insurance ?? "Convênio"}
            </span>
          )}
          {a.source === "demo" && (
            <span className="rounded-full bg-gold-400/15 px-2.5 py-1 text-[0.72rem] text-gold-700">exemplo</span>
          )}
          {a.source === "admin" && (
            <span className="rounded-full bg-navy-900/5 px-2.5 py-1 text-[0.72rem] text-navy-900/60">lançada</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ───────────────────────── gaveta de detalhes ─────────────────────────

export function AppointmentDrawer({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: AppointmentView | null;
  onClose: () => void;
  onChanged: (a: AppointmentView) => void;
}) {
  const toast = useToast();
  const [a, setA] = useState<AppointmentView | null>(appointment);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [notes, setNotes] = useState("");

  // reschedule
  const [month, setMonth] = useState(monthOf(today()));
  const [avail, setAvail] = useState<Record<string, number> | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [times, setTimes] = useState<string[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [mDate, setMDate] = useState("");
  const [mTime, setMTime] = useState("");

  useEffect(() => {
    if (!appointment) return; // mantém o conteúdo anterior enquanto a gaveta fecha
    setA(appointment);
    setNotes(appointment.internalNotes ?? "");
    setMode("view");
    setDate(null);
    setTime(null);
    setManual(false);
    setMonth(monthOf(appointment.date >= today() ? appointment.date : today()));
  }, [appointment]);

  useEffect(() => {
    if (mode !== "reschedule" || !a) return;
    const ctrl = new AbortController();
    setAvail(null);
    api<{ days: Record<string, number> }>(`/api/availability?serviceId=${a.serviceId}&month=${month}`, {
      signal: ctrl.signal,
    }).then((r) => !ctrl.signal.aborted && setAvail(r.ok ? r.data.days : {}));
    return () => ctrl.abort();
  }, [mode, month, a]);

  useEffect(() => {
    if (mode !== "reschedule" || !a || !date) return;
    const ctrl = new AbortController();
    setTimes(null);
    setTime(null);
    api<{ times: string[] }>(`/api/availability?serviceId=${a.serviceId}&date=${date}`, { signal: ctrl.signal }).then(
      (r) => !ctrl.signal.aborted && setTimes(r.ok ? r.data.times : []),
    );
    return () => ctrl.abort();
  }, [mode, date, a]);

  const patch = async (body: Record<string, unknown>, okMsg: string) => {
    if (!a) return false;
    setBusy(true);
    const r = await api<{ appointment: AppointmentView }>(`/api/admin/appointments/${a.id}`, {
      method: "PATCH",
      body,
    });
    setBusy(false);
    if (!r.ok) {
      toast(r.error.message, "error");
      return false;
    }
    setA(r.data.appointment);
    onChanged(r.data.appointment);
    toast(okMsg);
    return true;
  };

  const doReschedule = async (d: string | null, t: string | null) => {
    if (!d || !t) return;
    if (await patch({ date: d, time: t }, "Consulta remarcada.")) setMode("view");
  };

  if (!a) return null;

  const active = a.status === "pending" || a.status === "confirmed";
  const wa = (kind: "confirm" | "reminder" | "free") =>
    clinicToPatientLink(
      a.patient.phone,
      { code: a.code, date: a.date, startTime: a.startTime, serviceName: a.serviceName, patientName: a.patient.name },
      kind,
    );

  return (
    <>
      <Drawer open={!!appointment} onClose={onClose} title={a.patient.name} wide={mode === "reschedule"}>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={a.status} />
            <span className="rounded-full bg-navy-900 px-3 py-1 font-display text-[0.95rem] tracking-[0.2em] text-gold-300">
              {a.code}
            </span>
          </div>

          <div className="rounded-2xl border border-gold-400/25 bg-white p-5">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-600">Consulta</p>
            <p className="mt-1 text-[1.1rem] font-medium text-navy-900">{a.serviceName}</p>
            <p className="mt-1 text-[1rem] text-navy-900 first-letter:uppercase">
              {longDate(a.date, true)} · {a.startTime} às {a.endTime}
            </p>
            <p className="mt-2 text-[0.9rem] text-muted">
              {a.paymentType === "convenio" ? `Convênio${a.insurance ? ` — ${a.insurance}` : ""}` : "Particular"}
            </p>
            {a.notes && (
              <p className="mt-3 rounded-xl bg-ivory-100 px-4 py-3 text-[0.92rem] text-navy-900/85">
                <span className="mb-0.5 block text-[0.7rem] uppercase tracking-[0.18em] text-gold-600">Recado do paciente</span>
                {a.notes}
              </p>
            )}
            {a.cancelReason && (
              <p className="mt-3 text-[0.88rem] text-rose-700">Cancelamento: {a.cancelReason}</p>
            )}
          </div>

          {mode === "view" ? (
            <>
              {/* ações de status */}
              <div className="flex flex-wrap gap-2">
                {a.status === "pending" && (
                  <Btn variant="gold" disabled={busy} onClick={() => patch({ status: "confirmed" }, "Consulta confirmada.")}>
                    <Check className="h-4 w-4" /> Confirmar
                  </Btn>
                )}
                {a.status === "confirmed" && (
                  <Btn variant="navy" disabled={busy} onClick={() => patch({ status: "completed" }, "Marcada como concluída.")}>
                    <CheckCheck className="h-4 w-4" /> Concluir
                  </Btn>
                )}
                {a.status === "confirmed" && (
                  <Btn disabled={busy} onClick={() => patch({ status: "no_show" }, "Marcada como falta.")}>
                    <UserX className="h-4 w-4" /> Faltou
                  </Btn>
                )}
                {(a.status === "completed" || a.status === "no_show") && (
                  <Btn disabled={busy} onClick={() => patch({ status: "confirmed" }, "Reaberta como confirmada.")}>
                    <RotateCcw className="h-4 w-4" /> Reabrir
                  </Btn>
                )}
                {a.status === "cancelled" && (
                  <Btn variant="gold" disabled={busy} onClick={() => patch({ status: "confirmed" }, "Consulta reativada.")}>
                    <RotateCcw className="h-4 w-4" /> Reativar
                  </Btn>
                )}
                {active && (
                  <Btn disabled={busy} onClick={() => setMode("reschedule")}>
                    <CalendarClock className="h-4 w-4" /> Remarcar
                  </Btn>
                )}
                {active && (
                  <Btn variant="danger" disabled={busy} onClick={() => setCancelOpen(true)}>
                    <X className="h-4 w-4" /> Cancelar
                  </Btn>
                )}
              </div>

              {/* contato */}
              <div className="rounded-2xl border border-gold-400/25 bg-white p-5">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-600">Paciente</p>
                <ul className="mt-3 space-y-2.5 text-[0.95rem] text-navy-900">
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gold-600" /> {formatPhone(a.patient.phone)}
                  </li>
                  {a.patient.email && (
                    <li className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gold-600" />
                      <a href={`mailto:${a.patient.email}`} className="underline-offset-4 hover:underline">
                        {a.patient.email}
                      </a>
                    </li>
                  )}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {active && (
                    <a
                      href={wa(a.status === "pending" ? "confirm" : "reminder")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25d366] px-4 text-[0.9rem] font-medium text-white transition-all hover:brightness-95 active:scale-[0.97]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {a.status === "pending" ? "Confirmar no WhatsApp" : "Lembrete no WhatsApp"}
                    </a>
                  )}
                  <a
                    href={wa("free")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-navy-900/15 px-4 text-[0.9rem] font-medium text-navy-900 transition-colors hover:border-gold-500 hover:bg-gold-400/10"
                  >
                    <MessageCircle className="h-4 w-4 text-[#25d366]" /> Abrir conversa
                  </a>
                  <Link
                    href={`/admin/pacientes?q=${encodeURIComponent(a.patient.name)}`}
                    className="inline-flex h-10 items-center rounded-full px-4 text-[0.9rem] font-medium text-gold-700 underline-offset-4 hover:underline"
                  >
                    Ver histórico
                  </Link>
                </div>
              </div>

              {/* anotações */}
              <div className="rounded-2xl border border-gold-400/25 bg-white p-5">
                <p className="mb-3 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.22em] text-gold-600">
                  <StickyNote className="h-4 w-4" /> Anotações internas (só a clínica vê)
                </p>
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={2000}
                  placeholder="Ex.: alergia, observações do atendimento, retorno em 15 dias…"
                  className="min-h-28"
                />
                <div className="mt-3 flex justify-end">
                  <Btn
                    variant="navy"
                    disabled={busy || notes === a.internalNotes}
                    onClick={() => patch({ internalNotes: notes }, "Anotação salva.")}
                  >
                    Salvar anotação
                  </Btn>
                </div>
              </div>

              <p className="text-[0.8rem] text-muted">
                Origem: {a.source === "site" ? "agendamento pelo site" : a.source === "demo" ? "dado de exemplo" : "lançada pela clínica"} · criada em{" "}
                {brDate(a.createdAt.slice(0, 10))}
              </p>
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-[1.3rem] font-medium text-navy-900">Escolha o novo horário</h3>
                <p className="text-[0.9rem] text-muted">Horários livres de acordo com a sua agenda e bloqueios.</p>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <Calendar
                  id="adm-resched"
                  month={month}
                  onMonthChange={setMonth}
                  availability={avail}
                  selected={date}
                  onSelect={setDate}
                  minMonth={monthOf(today())}
                  maxMonth={monthOf(addDays(today(), 365))}
                />
                <div>
                  {date ? (
                    <>
                      <p className="mb-4 font-display text-[1.2rem] font-medium text-navy-900 first-letter:uppercase">
                        {longDate(date)}
                      </p>
                      <TimeSlots times={times} selected={time} onSelect={setTime} />
                    </>
                  ) : (
                    <p className="grid min-h-[8rem] place-items-center rounded-2xl border border-dashed border-gold-400/40 text-center text-[0.92rem] text-muted">
                      Escolha um dia no calendário.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-gold-400/50 p-4">
                <button
                  type="button"
                  onClick={() => setManual((m) => !m)}
                  className="text-[0.92rem] font-medium text-gold-700 underline-offset-4 hover:underline"
                >
                  {manual ? "Fechar" : "Encaixe: definir data e hora manualmente"}
                </button>
                {manual && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <Field label="Data" htmlFor="m-d">
                      <TextInput id="m-d" type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
                    </Field>
                    <Field label="Hora" htmlFor="m-t">
                      <TextInput id="m-t" type="time" value={mTime} onChange={(e) => setMTime(e.target.value)} />
                    </Field>
                    <Btn variant="navy" className="h-[3.25rem]" disabled={busy || !mDate || !mTime} onClick={() => doReschedule(mDate, mTime)}>
                      Aplicar
                    </Btn>
                  </div>
                )}
                {manual && <p className="mt-2 text-[0.8rem] text-muted">O encaixe ignora a grade e os bloqueios, mas nunca sobrepõe outra consulta.</p>}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Btn variant="ghost" onClick={() => setMode("view")} disabled={busy}>
                  ← Voltar
                </Btn>
                <Btn variant="gold" disabled={busy || !date || !time} onClick={() => doReschedule(date, time)}>
                  Confirmar novo horário
                </Btn>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar esta consulta?"
        text="O horário será liberado na agenda. Você pode reativar depois, se o horário ainda estiver livre."
        confirmLabel="Cancelar consulta"
        danger
        busy={busy}
        onCancel={() => setCancelOpen(false)}
        onConfirm={async () => {
          const ok = await patch({ status: "cancelled", cancelReason: cancelReason }, "Consulta cancelada.");
          if (ok) {
            setCancelOpen(false);
            setCancelReason("");
          }
        }}
      >
        <Field label="Motivo" optional className="mt-4" htmlFor="c-reason">
          <TextInput id="c-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ex.: paciente avisou imprevisto" />
        </Field>
      </ConfirmDialog>
    </>
  );
}

// ───────────────────────── nova consulta (lançamento manual) ─────────────────────────

export function NewAppointmentDrawer({
  open,
  defaultDate,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onCreated: (a: AppointmentView) => void;
}) {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [times, setTimes] = useState<string[] | null>(null);
  const [time, setTime] = useState("");
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState<"particular" | "convenio">("particular");
  const [insurance, setInsurance] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDate(defaultDate);
    setTime("");
    setCustom(false);
    setError("");
    api<{ services: Service[] }>("/api/admin/services").then((r) => {
      if (r.ok) {
        const act = r.data.services.filter((s) => s.active);
        setServices(act);
        setServiceId((cur) => cur || act[0]?.id || "");
      }
    });
  }, [open, defaultDate]);

  useEffect(() => {
    if (!open || !serviceId || !date) return;
    const ctrl = new AbortController();
    setTimes(null);
    api<{ times: string[] }>(`/api/availability?serviceId=${serviceId}&date=${date}`, { signal: ctrl.signal }).then((r) => {
      if (ctrl.signal.aborted) return;
      setTimes(r.ok ? r.data.times : []);
    });
    return () => ctrl.abort();
  }, [open, serviceId, date]);

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setInsurance("");
    setPayment("particular");
    setTime("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone || !serviceId || !date || !time) {
      setError("Preencha nome, WhatsApp, serviço, data e horário.");
      return;
    }
    setBusy(true);
    const r = await api<{ appointment: AppointmentView }>("/api/admin/appointments", {
      body: {
        serviceId,
        date,
        time,
        name: name.trim(),
        phone,
        email: email.trim(),
        paymentType: payment,
        insurance: payment === "convenio" ? insurance.trim() : undefined,
        notes: notes.trim(),
        force: true,
        status: "confirmed",
      },
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    toast("Consulta lançada na agenda.");
    onCreated(r.data.appointment);
    reset();
    onClose();
  };

  const svc = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  return (
    <Drawer open={open} onClose={onClose} title="Nova consulta">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <p className="text-[0.92rem] text-muted">
          Para pacientes que marcaram por WhatsApp, telefone ou presencialmente.
        </p>
        <Field label="Nome completo" htmlFor="n-name">
          <TextInput id="n-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp" htmlFor="n-phone">
            <TextInput id="n-phone" type="tel" inputMode="tel" value={phone} placeholder="(15) 99999-9999" onChange={(e) => setPhone(maskPhone(e.target.value))} />
          </Field>
          <Field label="E-mail" optional htmlFor="n-email">
            <TextInput id="n-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <Field label="Serviço" htmlFor="n-svc">
          <Select id="n-svc" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMin} min)
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data" htmlFor="n-date">
            <TextInput id="n-date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
          </Field>
          <Field label="Horário" htmlFor="n-time">
            {custom ? (
              <TextInput id="n-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            ) : (
              <Select
                id="n-time"
                value={time}
                onChange={(e) => {
                  if (e.target.value === "__custom") {
                    setCustom(true);
                    setTime("");
                  } else setTime(e.target.value);
                }}
              >
                <option value="">{times === null ? "Carregando…" : times.length ? "Escolha…" : "Sem horários livres"}</option>
                {(times ?? []).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__custom">Outro horário (encaixe)…</option>
              </Select>
            )}
          </Field>
        </div>
        {custom && (
          <button type="button" className="text-[0.85rem] text-gold-700 underline underline-offset-4" onClick={() => { setCustom(false); setTime(""); }}>
            ← Voltar à lista de horários livres
          </button>
        )}
        {svc && time && (
          <p className="text-[0.85rem] text-muted">
            Duração de {svc.durationMin} min — termina às{" "}
            {(() => {
              const [h, m] = time.split(":").map(Number);
              const t = h * 60 + m + svc.durationMin;
              return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
            })()}
            .
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {(["particular", "convenio"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPayment(v)}
              aria-pressed={payment === v}
              className={`h-12 rounded-xl border text-[0.95rem] font-medium transition-all ${
                payment === v ? "border-gold-500 bg-gold-400/15 text-navy-950" : "border-navy-900/15 text-navy-900/70 hover:border-gold-500/60"
              }`}
            >
              {v === "particular" ? "Particular" : "Convênio"}
            </button>
          ))}
        </div>
        {payment === "convenio" && (
          <Field label="Convênio" htmlFor="n-ins">
            <TextInput id="n-ins" value={insurance} onChange={(e) => setInsurance(e.target.value)} placeholder="Ex.: Odontoprev" />
          </Field>
        )}
        <Field label="Observações" optional htmlFor="n-notes">
          <TextArea id="n-notes" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} className="min-h-20" />
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-[0.9rem] text-rose-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-gold-400/20 pt-5">
          <Btn variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Btn>
          <Btn variant="gold" type="submit" disabled={busy} className="px-6">
            {busy ? "Salvando…" : "Lançar consulta"}
          </Btn>
        </div>
      </form>
    </Drawer>
  );
}
