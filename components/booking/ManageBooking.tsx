"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Calendar, { TimeSlots } from "./Calendar";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { Butterfly, WhatsAppIcon } from "@/components/ui/Icons";
import StatusBadge from "@/components/ui/StatusBadge";
import { api } from "@/lib/client-api";
import { googleCalendarUrl } from "@/lib/calendar-links";
import { addDays, longDate, monthOf, today } from "@/lib/datetime";
import { formatPhone, maskPhone } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

interface Appt {
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceId: string;
  serviceName: string;
  paymentType: string;
  insurance: string | null;
  notes: string;
  patientName: string;
}

type Mode = "view" | "reschedule" | "cancel";

export default function ManageBooking({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState((initialCode ?? "").toUpperCase());
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appt, setAppt] = useState<Appt | null>(null);
  const [canModify, setCanModify] = useState(false);
  const [demo, setDemo] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const [flash, setFlash] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  // remarcar
  const [month, setMonth] = useState(monthOf(today()));
  const [avail, setAvail] = useState<Record<string, number> | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [times, setTimes] = useState<string[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // cancelar
  const [reason, setReason] = useState("");

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (code.trim().length < 4) return setError("Informe o código do agendamento.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Informe o WhatsApp usado no agendamento.");
    setLoading(true);
    const r = await api<{ appointment: Appt; canModify: boolean; demo: boolean }>("/api/appointments/lookup", {
      body: { code, phone },
    });
    setLoading(false);
    if (!r.ok) return setError(r.error.message);
    setAppt(r.data.appointment);
    setCanModify(r.data.canModify);
    setDemo(r.data.demo);
    setMode("view");
  };

  // ao encontrar a consulta, leva o resultado para a tela (evita "pulo" no celular)
  const foundCode = appt?.code;
  useEffect(() => {
    if (!foundCode) return;
    const t = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 450);
    return () => clearTimeout(t);
  }, [foundCode]);

  // disponibilidade ao remarcar
  const maxMonth = useMemo(() => monthOf(addDays(today(), 90)), []);
  useEffect(() => {
    if (mode !== "reschedule" || !appt) return;
    const ctrl = new AbortController();
    setAvail(null);
    api<{ days: Record<string, number> }>(`/api/availability?serviceId=${appt.serviceId}&month=${month}`, {
      signal: ctrl.signal,
    }).then((r) => {
      if (!ctrl.signal.aborted) setAvail(r.ok ? r.data.days : {});
    });
    return () => ctrl.abort();
  }, [mode, month, appt]);

  useEffect(() => {
    if (mode !== "reschedule" || !appt || !date) return;
    const ctrl = new AbortController();
    setTimes(null);
    setTime(null);
    api<{ times: string[] }>(`/api/availability?serviceId=${appt.serviceId}&date=${date}`, { signal: ctrl.signal }).then(
      (r) => {
        if (!ctrl.signal.aborted) setTimes(r.ok ? r.data.times : []);
      },
    );
    return () => ctrl.abort();
  }, [mode, date, appt]);

  const confirmReschedule = async () => {
    if (!appt || !date || !time) return;
    setBusy(true);
    setError("");
    const r = await api<{ appointment: Appt; canModify: boolean }>("/api/appointments/reschedule", {
      body: { code: appt.code, phone, date, time },
    });
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setAppt(r.data.appointment);
    setCanModify(r.data.canModify);
    setMode("view");
    setDate(null);
    setTime(null);
    setFlash("Pronto! Sua consulta foi remarcada.");
  };

  const confirmCancel = async () => {
    if (!appt) return;
    setBusy(true);
    setError("");
    const r = await api<{ appointment: Appt }>("/api/appointments/cancel", {
      body: { code: appt.code, phone, reason },
    });
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setAppt(r.data.appointment);
    setCanModify(false);
    setMode("view");
    setFlash("Consulta cancelada. O horário foi liberado.");
  };

  const active = appt && (appt.status === "pending" || appt.status === "confirmed");

  return (
    <div className="mx-auto max-w-3xl">
      <AnimatePresence mode="wait" initial={false}>
        {!appt ? (
          <motion.form
            key="form"
            onSubmit={lookup}
            noValidate
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2rem] border border-gold-400/30 bg-white p-7 shadow-[0_40px_90px_-50px_rgba(13,19,54,0.45)] sm:p-10"
          >
            <h2 className="font-display text-[1.44rem] font-medium text-navy-900">Encontre sua consulta</h2>
            <p className="mt-1 text-muted">
              Use o código que você recebeu ao agendar e o WhatsApp informado na ocasião.
            </p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field label="Código do agendamento" htmlFor="m-code">
                <TextInput
                  id="m-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                  placeholder="Ex.: K7M2QX"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="font-display text-[0.95rem] font-medium tracking-[0.3em]"
                />
              </Field>
              <Field label="WhatsApp" htmlFor="m-phone">
                <TextInput
                  id="m-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(15) 99999-9999"
                />
              </Field>
            </div>
            {error && (
              <p role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-[0.92rem] text-rose-700">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-7 w-full sm:w-auto" disabled={loading}>
              {loading ? "Buscando…" : "Buscar agendamento"}
            </Button>
          </motion.form>
        ) : (
          <motion.div
            key="appt"
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-gold-400/30 bg-white shadow-[0_40px_90px_-50px_rgba(13,19,54,0.45)]"
          >
            <div className="pattern-geo relative bg-navy-900 px-7 py-7 text-ivory-50 sm:px-10">
              <Butterfly className="absolute right-6 top-6 h-10 w-10 text-gold-400/40" />
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold-300">Agendamento</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="font-display text-[1.73rem] font-normal tracking-[0.28em] text-gold-gradient">{appt.code}</span>
                <StatusBadge status={appt.status} />
              </div>
            </div>

            <div className="p-7 sm:p-10">
              <AnimatePresence>
                {flash && (
                  <motion.p
                    key="flash"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden rounded-2xl bg-emerald-50 px-5 py-3 text-[0.95rem] text-emerald-800"
                  >
                    {flash}
                  </motion.p>
                )}
              </AnimatePresence>
              {demo && (
                <p className="mb-6 rounded-2xl border border-gold-400/40 bg-gold-400/10 px-5 py-3 text-[0.9rem] text-navy-900">
                  <strong className="font-medium">Demonstração:</strong> este é um agendamento de teste.
                </p>
              )}

              <dl className="grid gap-6 sm:grid-cols-2">
                {[
                  ["Atendimento", appt.serviceName],
                  ["Paciente", appt.patientName],
                  ["Data", longDate(appt.date, true)],
                  ["Horário", `${appt.startTime} às ${appt.endTime}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[0.72rem] uppercase tracking-[0.22em] text-gold-600">{k}</dt>
                    <dd className="mt-1 text-[1.1rem] font-medium text-navy-900 first-letter:uppercase">{v}</dd>
                  </div>
                ))}
              </dl>

              {error && (
                <p role="alert" className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-[0.92rem] text-rose-700">
                  {error}
                </p>
              )}

              <AnimatePresence mode="wait" initial={false}>
                {mode === "view" && (
                  <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
                    {active ? (
                      <>
                        {canModify ? (
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Button onClick={() => { setMode("reschedule"); setError(""); setFlash(""); }}>
                              Remarcar consulta
                            </Button>
                            <Button variant="danger" onClick={() => { setMode("cancel"); setError(""); setFlash(""); }}>
                              Cancelar consulta
                            </Button>
                          </div>
                        ) : (
                          <p className="rounded-2xl bg-ivory-100 px-5 py-4 text-[0.95rem] text-muted">
                            O prazo para remarcar ou cancelar pelo site já passou. Para qualquer mudança, fale com a gente
                            pelo WhatsApp.
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[0.92rem]">
                          <a href={googleCalendarUrl(appt)} target="_blank" rel="noopener noreferrer" className="text-gold-700 underline underline-offset-4">
                            Adicionar ao Google Agenda
                          </a>
                          <a
                            href={whatsappLink(`Olá! Sobre o meu agendamento ${appt.code} (${longDate(appt.date)} às ${appt.startTime}):`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-gold-700 underline underline-offset-4"
                          >
                            <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl bg-ivory-100 px-5 py-5">
                        <p className="text-[0.95rem] text-muted">
                          {appt.status === "cancelled"
                            ? "Esta consulta foi cancelada. Quer marcar um novo horário?"
                            : "Esta consulta já foi encerrada."}
                        </p>
                        <Button href={`/agendar?servico=${appt.serviceId}`} className="mt-4">
                          Agendar novamente
                        </Button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAppt(null);
                        setFlash("");
                        setError("");
                      }}
                      className="mt-8 text-[0.88rem] text-muted underline underline-offset-4 hover:text-navy-900"
                    >
                      ← Buscar outro agendamento
                    </button>
                  </motion.div>
                )}

                {mode === "reschedule" && (
                  <motion.div key="r" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 border-t border-gold-400/20 pt-8">
                    <h3 className="font-display text-[1.22rem] font-medium text-navy-900">Escolha o novo horário</h3>
                    <div className="mt-6 grid gap-9 md:grid-cols-2 md:gap-10">
                      <Calendar
                        id="resched"
                        month={month}
                        onMonthChange={setMonth}
                        availability={avail}
                        selected={date}
                        onSelect={setDate}
                        minMonth={monthOf(today())}
                        maxMonth={maxMonth}
                      />
                      <div>
                        {date ? (
                          <>
                            <p className="mb-5 font-display text-[1.01rem] font-medium leading-[1.18] text-navy-900 first-letter:uppercase">
                              {longDate(date)}
                            </p>
                            <TimeSlots times={times} selected={time} onSelect={setTime} />
                          </>
                        ) : (
                          <p className="grid h-full min-h-[10rem] place-items-center rounded-3xl border border-dashed border-gold-400/40 bg-ivory-100/50 p-6 text-center text-muted">
                            Escolha um dia no calendário.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-8 flex items-center justify-between gap-3">
                      <Button variant="ghost" onClick={() => { setMode("view"); setError(""); }} disabled={busy}>
                        ← Voltar
                      </Button>
                      <Button onClick={confirmReschedule} disabled={!date || !time || busy}>
                        {busy ? "Remarcando…" : "Confirmar novo horário"}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {mode === "cancel" && (
                  <motion.div key="c" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 border-t border-gold-400/20 pt-8">
                    <h3 className="font-display text-[1.22rem] font-medium text-navy-900">Cancelar esta consulta?</h3>
                    <p className="mt-2 text-muted">
                      O horário será liberado para outra pessoa. Se preferir, você pode remarcar em vez de cancelar.
                    </p>
                    <Field label="Motivo" optional className="mt-5" htmlFor="m-reason">
                      <TextArea
                        id="m-reason"
                        maxLength={200}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Conte rapidamente, se quiser"
                        className="min-h-24"
                      />
                    </Field>
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                      <Button variant="ghost" onClick={() => { setMode("view"); setError(""); }} disabled={busy}>
                        Manter consulta
                      </Button>
                      <Button variant="danger" onClick={confirmCancel} disabled={busy}>
                        {busy ? "Cancelando…" : "Sim, cancelar consulta"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-[0.88rem] text-muted">
        Não achou seu código? Fale com a gente: <a href={whatsappLink()} className="text-gold-700 underline underline-offset-4">{site.phoneDisplay}</a>
        {appt && <span className="sr-only"> — {formatPhone(phone)}</span>}
      </p>
    </div>
  );
}
