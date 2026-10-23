"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Calendar, { TimeSlots } from "./Calendar";
import Stepper from "./Stepper";
import Success, { type Booked } from "./Success";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ServiceIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { api } from "@/lib/client-api";
import { addDays, longDate, monthOf, today } from "@/lib/datetime";
import { formatDuration, maskPhone } from "@/lib/format";
import { insurers, site, whatsappLink } from "@/lib/site";

interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  icon: string;
}
interface Cfg {
  enabled: boolean;
  notice: string;
  maxAdvanceDays: number;
  autoConfirm: boolean;
  cancelLimitHours: number;
}

const STEPS = ["Atendimento", "Data e hora", "Seus dados", "Confirmação"];

const slide = {
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -36 },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
};

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  paymentType: "particular" as "particular" | "convenio",
  insurance: "",
  insuranceOther: "",
  notes: "",
  consent: false,
  website: "",
};
type Form = typeof emptyForm;
type Errors = Partial<Record<keyof Form | "form", string>>;

function validate(f: Form): Errors {
  const e: Errors = {};
  const words = f.name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2 || f.name.trim().length < 5) e.name = "Informe nome e sobrenome";
  const digits = f.phone.replace(/\D/g, "");
  if (!/^\d{10,11}$/.test(digits) || (digits.length === 11 && digits[2] !== "9")) {
    e.phone = "Informe um WhatsApp válido com DDD";
  }
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "E-mail inválido";
  if (f.paymentType === "convenio") {
    if (!f.insurance) e.insurance = "Escolha o convênio";
    else if (f.insurance === "Outro" && !f.insuranceOther.trim()) e.insurance = "Informe o nome do convênio";
  }
  if (!f.consent) e.consent = "É necessário aceitar a política de privacidade";
  return e;
}

export default function BookingWizard({ initialService }: { initialService?: string }) {
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [cfg, setCfg] = useState<Cfg | null>(null);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [month, setMonth] = useState(monthOf(today()));
  const [avail, setAvail] = useState<Record<string, number> | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [times, setTimes] = useState<string[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string>("");
  const [done, setDone] = useState<{ booked: Booked; demo: boolean; phone: string } | null>(null);

  const topRef = useRef<HTMLDivElement>(null);
  const autoAdvanced = useRef(false);

  const service = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);
  const maxMonth = useMemo(
    () => monthOf(addDays(today(), cfg?.maxAdvanceDays ?? 60)),
    [cfg],
  );

  const scrollTop = useCallback(() => {
    requestAnimationFrame(() => {
      const el = topRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  }, []);

  // 1) serviços e regras
  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await api<{ services: Service[]; booking: Cfg }>("/api/services");
      if (!alive) return;
      if (!r.ok) {
        setLoadError(r.error.message);
        setLoad("error");
        return;
      }
      setServices(r.data.services);
      setCfg(r.data.booking);
      setLoad("ready");
      const pre = r.data.services.find((s) => s.slug === initialService || s.id === initialService);
      if (pre) {
        setServiceId(pre.id);
        setStep(1);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialService]);

  // 2) disponibilidade do mês
  useEffect(() => {
    if (!serviceId) return;
    const ctrl = new AbortController();
    setAvail(null);
    api<{ days: Record<string, number> }>(`/api/availability?serviceId=${serviceId}&month=${month}`, {
      signal: ctrl.signal,
    }).then((r) => {
      if (ctrl.signal.aborted) return;
      if (!r.ok) {
        if (r.error.code !== "aborted") setBanner(r.error.message);
        setAvail({});
        return;
      }
      setAvail(r.data.days);
      // mês sem vagas (ex.: fim de mês) → pula para o próximo, uma única vez
      const any = Object.entries(r.data.days).some(([d, n]) => n > 0 && d >= today());
      if (!any && !autoAdvanced.current && month < maxMonth) {
        autoAdvanced.current = true;
        const [y, m] = month.split("-").map(Number);
        const next = new Date(Date.UTC(y, m, 1));
        setMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
      }
    });
    return () => ctrl.abort();
  }, [serviceId, month, maxMonth]);

  // 3) horários do dia
  const loadTimes = useCallback(
    async (d: string, sid: string, signal?: AbortSignal) => {
      setTimes(null);
      const r = await api<{ times: string[] }>(`/api/availability?serviceId=${sid}&date=${d}`, { signal });
      if (signal?.aborted) return;
      setTimes(r.ok ? r.data.times : []);
      if (!r.ok && r.error.code !== "aborted") setBanner(r.error.message);
    },
    [],
  );

  useEffect(() => {
    if (!serviceId || !date) return;
    const ctrl = new AbortController();
    loadTimes(date, serviceId, ctrl.signal);
    return () => ctrl.abort();
  }, [serviceId, date, loadTimes]);

  const firstFree = useMemo(() => {
    if (!avail) return null;
    return (
      Object.keys(avail)
        .sort()
        .find((d) => avail[d] > 0 && d >= today()) ?? null
    );
  }, [avail]);

  const pickService = (s: Service) => {
    if (serviceId !== s.id) {
      setServiceId(s.id);
      setDate(null);
      setTime(null);
      setTimes(null);
      setMonth(monthOf(today()));
      autoAdvanced.current = false;
    }
    setBanner("");
    setTimeout(() => {
      setStep(1);
      scrollTop();
    }, 220);
  };

  const pickDate = (d: string) => {
    setDate(d);
    setTime(null);
    setBanner("");
  };

  const goto = (n: number) => {
    setStep(n);
    scrollTop();
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (touched) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const next2 = () => {
    setTouched(true);
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    goto(3);
  };

  const submit = async () => {
    if (!service || !date || !time) return;
    const e = validate(form);
    if (Object.keys(e).length) {
      setErrors(e);
      goto(2);
      return;
    }
    setSubmitting(true);
    setBanner("");
    const insurance =
      form.paymentType === "convenio" ? (form.insurance === "Outro" ? form.insuranceOther.trim() : form.insurance) : undefined;
    const r = await api<{ appointment: Booked; demo: boolean }>("/api/appointments", {
      body: {
        serviceId: service.id,
        date,
        time,
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim(),
        paymentType: form.paymentType,
        insurance,
        notes: form.notes.trim(),
        consent: form.consent,
        website: form.website,
      },
    });
    setSubmitting(false);

    if (r.ok) {
      setDone({ booked: r.data.appointment, demo: r.data.demo, phone: form.phone });
      scrollTop();
      return;
    }
    const { code, message, field } = r.error;
    if (code === "slot_taken" || code === "unavailable") {
      setBanner(message);
      setTime(null);
      goto(1);
      if (date) loadTimes(date, service.id);
      return;
    }
    if (field && field in emptyForm) {
      setErrors({ [field]: message } as Errors);
      goto(2);
      return;
    }
    setBanner(message);
  };

  const reset = () => {
    setDone(null);
    setStep(0);
    setServiceId(null);
    setDate(null);
    setTime(null);
    setTimes(null);
    setForm(emptyForm);
    setErrors({});
    setTouched(false);
    setBanner("");
    scrollTop();
  };

  // ───────── estados de carregamento / erro / pausado ─────────
  if (load === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-navy-900/5" />
        ))}
      </div>
    );
  }

  if (load === "error" || (cfg && !cfg.enabled)) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-gold-400/30 bg-white p-8 text-center shadow-[0_30px_70px_-40px_rgba(13,19,54,0.4)] sm:p-10">
        <h2 className="font-display text-[1.44rem] font-medium text-navy-900">
          {load === "error" ? "Agendamento online indisponível" : "Agendamento online pausado"}
        </h2>
        <p className="mt-3 text-muted">
          {load === "error"
            ? loadError || "Não conseguimos carregar a agenda agora."
            : cfg?.notice || "No momento não estamos recebendo agendamentos pelo site."}{" "}
          Você pode falar diretamente com a gente pelo WhatsApp.
        </p>
        <Button href={whatsappLink("Olá! Gostaria de agendar uma consulta 😊")} className="mt-7">
          <WhatsAppIcon className="h-5 w-5" /> Chamar no WhatsApp
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div ref={topRef} className="mx-auto max-w-3xl rounded-[2rem] border border-gold-400/30 bg-ivory-50 p-6 shadow-[0_50px_100px_-50px_rgba(13,19,54,0.5)] sm:p-12">
        <Success booked={done.booked} phone={done.phone} demo={done.demo} onNew={reset} />
      </div>
    );
  }

  const canContinueDate = !!date && !!time;

  return (
    <div ref={topRef} className="mx-auto max-w-6xl">
      <Stepper steps={STEPS} current={step} />

      {cfg?.notice && (
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gold-400/40 bg-gold-400/10 px-5 py-3.5 text-center text-[0.95rem] text-navy-900">
          {cfg.notice}
        </div>
      )}

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 overflow-hidden rounded-[2rem] border border-gold-400/30 bg-white p-5 shadow-[0_40px_90px_-50px_rgba(13,19,54,0.45)] sm:p-9">
          <AnimatePresence>
            {banner && (
              <motion.div
                key="banner"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-[0.95rem] text-rose-700">
                  {banner}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {step === 0 && (
              <motion.div key="s0" {...slide}>
                <h2 className="font-display text-[1.44rem] font-medium text-navy-900 sm:text-[1.66rem]">
                  Qual atendimento você precisa?
                </h2>
                <p className="mt-1 text-muted">Escolha uma opção. Se estiver em dúvida, comece pela avaliação.</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {services.map((s, i) => {
                    const active = s.id === serviceId;
                    return (
                      <motion.button
                        key={s.id}
                        type="button"
                        onClick={() => pickService(s)}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        whileTap={{ scale: 0.985 }}
                        aria-pressed={active}
                        className={`group relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-300 sm:p-5 ${
                          active
                            ? "border-gold-500 bg-gold-400/10 shadow-[0_18px_40px_-22px_rgba(195,154,85,0.9)]"
                            : "border-navy-900/10 bg-white hover:-translate-y-0.5 hover:border-gold-500/60 hover:shadow-[0_20px_40px_-26px_rgba(13,19,54,0.4)]"
                        }`}
                      >
                        <span
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${
                            active ? "bg-gold-500 text-navy-950" : "bg-navy-900 text-gold-300"
                          }`}
                        >
                          <ServiceIcon name={s.icon} className="h-7 w-7" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[1.02rem] font-medium leading-snug text-navy-900">{s.name}</span>
                          <span className="mt-1 line-clamp-2 block text-[0.88rem] leading-snug text-muted">
                            {s.description}
                          </span>
                          <span className="mt-2 inline-block rounded-full bg-navy-900/5 px-2.5 py-0.5 text-[0.74rem] text-navy-900/70">
                            {formatDuration(s.durationMin)}
                          </span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 1 && service && (
              <motion.div key="s1" {...slide}>
                <h2 className="font-display text-[1.44rem] font-medium text-navy-900 sm:text-[1.66rem]">
                  Quando fica bom para você?
                </h2>
                <p className="mt-1 text-muted">
                  {service.name} · {formatDuration(service.durationMin)}
                </p>

                <div className="mt-7 grid gap-9 md:grid-cols-[1fr_1fr] md:gap-10">
                  <div>
                    <Calendar
                      month={month}
                      onMonthChange={setMonth}
                      availability={avail}
                      selected={date}
                      onSelect={pickDate}
                      minMonth={monthOf(today())}
                      maxMonth={maxMonth}
                    />
                    {firstFree && !date && (
                      <button
                        type="button"
                        onClick={() => {
                          setMonth(monthOf(firstFree));
                          pickDate(firstFree);
                        }}
                        className="mt-5 w-full rounded-xl border border-dashed border-gold-500/60 px-4 py-3 text-[0.92rem] text-navy-900 transition-colors hover:bg-gold-400/10"
                      >
                        Ver o primeiro dia livre: <strong className="font-medium">{longDate(firstFree)}</strong>
                      </button>
                    )}
                  </div>

                  <div className="min-h-[18rem]">
                    <AnimatePresence mode="wait" initial={false}>
                      {!date ? (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="grid h-full min-h-[18rem] place-items-center rounded-3xl border border-dashed border-gold-400/40 bg-ivory-100/50 p-8 text-center"
                        >
                          <div>
                            <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-gold-500" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3.5" y="5" width="17" height="15" rx="3" />
                              <path d="M8 3v4M16 3v4M3.5 10h17" />
                            </svg>
                            <p className="mt-4 font-display text-[1.08rem] italic text-navy-900">Escolha um dia no calendário</p>
                            <p className="mt-1 text-[0.9rem] text-muted">Os horários livres aparecem aqui.</p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={date}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="mb-5 font-display text-[1.08rem] font-medium first-letter:uppercase leading-[1.18] text-navy-900">
                            {longDate(date)}
                          </p>
                          <TimeSlots times={times} selected={time} onSelect={setTime} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-9 flex items-center justify-between gap-3 border-t border-gold-400/20 pt-6">
                  <Button variant="ghost" onClick={() => goto(0)}>
                    ← Voltar
                  </Button>
                  <Button disabled={!canContinueDate} onClick={() => goto(2)}>
                    Continuar
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" {...slide}>
                <h2 className="font-display text-[1.44rem] font-medium text-navy-900 sm:text-[1.66rem]">Quase lá! Seus dados</h2>
                <p className="mt-1 text-muted">Usamos o seu WhatsApp apenas para falar sobre a consulta.</p>

                <form
                  className="mt-7 grid gap-5 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    next2();
                  }}
                  noValidate
                >
                  <Field label="Nome completo" error={errors.name} className="sm:col-span-2" htmlFor="f-name">
                    <TextInput
                      id="f-name"
                      autoComplete="name"
                      placeholder="Como está no seu documento"
                      value={form.name}
                      invalid={!!errors.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </Field>
                  <Field label="WhatsApp" error={errors.phone} htmlFor="f-phone" hint="Com DDD">
                    <TextInput
                      id="f-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="(15) 99999-9999"
                      value={form.phone}
                      invalid={!!errors.phone}
                      onChange={(e) => set("phone", maskPhone(e.target.value))}
                    />
                  </Field>
                  <Field label="E-mail" optional error={errors.email} htmlFor="f-email">
                    <TextInput
                      id="f-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      value={form.email}
                      invalid={!!errors.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <span className="mb-2 block text-[0.9rem] font-medium text-navy-900">Como será o atendimento?</span>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Forma de atendimento">
                      {(
                        [
                          ["particular", "Particular"],
                          ["convenio", "Convênio"],
                        ] as const
                      ).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={form.paymentType === v}
                          onClick={() => set("paymentType", v)}
                          className={`h-13 rounded-xl border text-[1rem] font-medium transition-all duration-300 ${
                            form.paymentType === v
                              ? "border-gold-500 bg-gold-400/15 text-navy-950 shadow-[0_10px_26px_-14px_rgba(195,154,85,0.9)]"
                              : "border-navy-900/15 text-navy-900/80 hover:border-gold-500/60"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {form.paymentType === "convenio" && (
                      <motion.div
                        key="ins"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid gap-5 overflow-hidden sm:col-span-2 sm:grid-cols-2"
                      >
                        <Field label="Convênio" error={errors.insurance} htmlFor="f-ins" className="pt-1">
                          <Select
                            id="f-ins"
                            value={form.insurance}
                            invalid={!!errors.insurance}
                            onChange={(e) => set("insurance", e.target.value)}
                          >
                            <option value="">Selecione…</option>
                            {insurers.map((i) => (
                              <option key={i} value={i}>
                                {i}
                              </option>
                            ))}
                            <option value="Outro">Outro</option>
                          </Select>
                        </Field>
                        {form.insurance === "Outro" && (
                          <Field label="Qual convênio?" htmlFor="f-ins2" className="pt-1">
                            <TextInput
                              id="f-ins2"
                              value={form.insuranceOther}
                              onChange={(e) => set("insuranceOther", e.target.value)}
                            />
                          </Field>
                        )}
                        <p className="text-[0.82rem] text-muted sm:col-span-2">
                          A cobertura é confirmada pela clínica antes da consulta.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Field label="Observações" optional className="sm:col-span-2" htmlFor="f-notes" hint="Conte rapidamente o motivo da consulta, se quiser.">
                    <TextArea
                      id="f-notes"
                      maxLength={500}
                      placeholder="Ex.: dor no dente do fundo há 3 dias"
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </Field>

                  {/* honeypot: invisível para pessoas */}
                  <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
                    <label>
                      Não preencha
                      <input
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.website}
                        onChange={(e) => set("website", e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 text-[0.92rem] leading-snug text-navy-900/85">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(e) => set("consent", e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#c39a55]"
                      />
                      <span>
                        Li e concordo com a{" "}
                        <Link href="/privacidade" target="_blank" className="font-medium underline underline-offset-4 hover:text-gold-700">
                          política de privacidade
                        </Link>{" "}
                        e autorizo o uso dos meus dados para o agendamento e contato sobre a consulta.
                      </span>
                    </label>
                    {errors.consent && (
                      <p role="alert" className="mt-1.5 text-[0.85rem] text-rose-600">
                        {errors.consent}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 border-t border-gold-400/20 pt-6 sm:col-span-2">
                    <Button variant="ghost" onClick={() => goto(1)}>
                      ← Voltar
                    </Button>
                    <Button type="submit">Revisar</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && service && date && time && (
              <motion.div key="s3" {...slide}>
                <h2 className="font-display text-[1.44rem] font-medium text-navy-900 sm:text-[1.66rem]">Confira e confirme</h2>
                <p className="mt-1 text-muted">Está tudo certo? Você ainda pode editar qualquer informação.</p>

                <div className="mt-7 divide-y divide-gold-400/20 overflow-hidden rounded-3xl border border-gold-400/30">
                  {[
                    {
                      label: "Atendimento",
                      value: service.name,
                      sub: formatDuration(service.durationMin),
                      step: 0,
                    },
                    {
                      label: "Data e horário",
                      value: `${longDate(date, true)}`,
                      sub: `às ${time}`,
                      step: 1,
                    },
                    {
                      label: "Paciente",
                      value: form.name.trim(),
                      sub: `${form.phone}${form.email.trim() ? ` · ${form.email.trim()}` : ""}`,
                      step: 2,
                    },
                    {
                      label: "Atendimento",
                      value:
                        form.paymentType === "convenio"
                          ? `Convênio — ${form.insurance === "Outro" ? form.insuranceOther : form.insurance}`
                          : "Particular",
                      sub: form.notes.trim() || undefined,
                      step: 2,
                    },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 bg-ivory-50/60 px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="text-[0.72rem] uppercase tracking-[0.22em] text-gold-600">{row.label}</p>
                        <p className="mt-1 text-[1.05rem] font-medium first-letter:uppercase text-navy-900 [overflow-wrap:anywhere]">
                          {row.value}
                        </p>
                        {row.sub && <p className="text-[0.92rem] text-muted [overflow-wrap:anywhere]">{row.sub}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => goto(row.step)}
                        className="shrink-0 text-[0.85rem] text-gold-700 underline underline-offset-4 hover:text-gold-600"
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-[0.88rem] leading-relaxed text-muted">
                  {cfg && cfg.cancelLimitHours > 0
                    ? `Você poderá remarcar ou cancelar pelo site até ${cfg.cancelLimitHours} horas antes da consulta.`
                    : "Você poderá remarcar ou cancelar pelo site."}{" "}
                  {cfg && !cfg.autoConfirm && "A Dra. confirmará o seu horário pelo WhatsApp."}
                </p>

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-gold-400/20 pt-6">
                  <Button variant="ghost" onClick={() => goto(2)} disabled={submitting}>
                    ← Voltar
                  </Button>
                  <Button size="lg" onClick={submit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-950/30 border-t-navy-950" />
                        Agendando…
                      </>
                    ) : (
                      "Confirmar agendamento"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* resumo lateral */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 overflow-hidden rounded-[2rem] bg-navy-900 p-7 text-ivory-50 shadow-[0_40px_80px_-40px_rgba(13,19,54,0.7)]">
            <div aria-hidden className="pattern-geo absolute inset-0 opacity-70" />
            <div className="relative">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold-300">Seu agendamento</p>
              <h3 className="mt-2 font-display text-[1.22rem] font-medium leading-[1.18]">{site.name}</h3>
              <p className="text-[0.88rem] text-ivory-200/70">
                Cirurgiã-dentista · {site.city}–{site.state}
              </p>
              <div className="my-6 h-px bg-gradient-to-r from-gold-400/60 to-transparent" />
              <dl className="space-y-5 text-[0.98rem]">
                <div>
                  <dt className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-300/80">Atendimento</dt>
                  <dd className="mt-1">{service ? service.name : <span className="text-ivory-200/40">Escolha uma opção</span>}</dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-300/80">Data</dt>
                  <dd className="mt-1 first-letter:uppercase">
                    {date ? longDate(date) : <span className="text-ivory-200/40 normal-case">A definir</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-300/80">Horário</dt>
                  <dd className="mt-1">{time ? time : <span className="text-ivory-200/40">A definir</span>}</dd>
                </div>
              </dl>
              <div className="my-6 h-px bg-gradient-to-r from-gold-400/60 to-transparent" />
              <p className="text-[0.84rem] leading-relaxed text-ivory-200/65">
                Atendimento somente com hora marcada. Prefere falar com a gente?
              </p>
              <a
                href={whatsappLink("Olá! Gostaria de agendar uma consulta 😊")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-[0.95rem] text-gold-200 hover:text-gold-300"
              >
                <WhatsAppIcon className="h-5 w-5" /> {site.phoneDisplay}
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* resumo compacto no celular */}
      {step > 0 && service && (
        <div className="mt-6 rounded-2xl bg-navy-900 px-5 py-4 text-[0.92rem] text-ivory-50 lg:hidden">
          <span className="text-gold-300">{service.name}</span>
          {date && (
            <span className="text-ivory-200/80">
              {" "}
              · <span className="first-letter:uppercase">{longDate(date)}</span>
              {time ? ` às ${time}` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
