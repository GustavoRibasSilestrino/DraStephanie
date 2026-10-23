"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Butterfly, WhatsAppIcon } from "@/components/ui/Icons";
import { googleCalendarUrl, icsFile } from "@/lib/calendar-links";
import { longDate } from "@/lib/datetime";
import { formatPhone } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import { messageToClinic } from "@/lib/whatsapp";

export interface Booked {
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string;
  paymentType: string;
  insurance: string | null;
  patientName: string;
}

function Confetti() {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const angle = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = 90 + ((i * 37) % 70);
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 20,
          r: (i * 53) % 360,
          size: 5 + (i % 4) * 2,
          round: i % 3 === 0,
          color: ["#e5cd96", "#d7b46f", "#c39a55", "#f6e9c4", "#1f2860"][i % 5],
          delay: (i % 6) * 0.03,
        };
      }),
    [],
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-12 z-0">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 2.2,
            borderRadius: p.round ? 999 : 2,
            background: p.color,
          }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 90], opacity: [0, 1, 1, 0], rotate: p.r, scale: 1 }}
          transition={{ duration: 1.9, delay: 0.35 + p.delay, ease: "easeOut", times: [0, 0.35, 0.75, 1] }}
        />
      ))}
    </div>
  );
}

export default function Success({
  booked,
  phone,
  demo,
  onNew,
}: {
  booked: Booked;
  phone: string;
  demo: boolean;
  onNew: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const pending = booked.status === "pending";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(booked.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem permissão de área de transferência */
    }
  };

  const downloadIcs = () => {
    const blob = new Blob([icsFile(booked)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consulta-dra-stephanie-${booked.date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="relative overflow-hidden text-center">
      <Confetti />
      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
          className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-navy-900 shadow-[0_0_0_8px_rgba(195,154,85,0.18)]"
        >
          <svg viewBox="0 0 52 52" className="h-14 w-14" fill="none" stroke="#e5cd96" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <motion.circle
              cx="26"
              cy="26"
              r="22"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            />
            <motion.path
              d="m16 27 7 7 14-15"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
            />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-8 font-display text-[1.87rem] font-normal leading-[1.18] text-navy-900 sm:text-[2.3rem]"
        >
          {pending ? "Solicitação enviada!" : "Consulta agendada!"}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.7 }}
          className="mx-auto mt-3 max-w-lg text-[1.05rem] text-muted"
        >
          {pending
            ? `Recebemos o seu pedido, ${booked.patientName.split(" ")[0]}. A Dra. Stephanie vai confirmar o horário pelo WhatsApp.`
            : `Tudo certo, ${booked.patientName.split(" ")[0]}! O seu horário está reservado. Estamos te esperando.`}
        </motion.p>

        {demo && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mx-auto mt-5 max-w-lg rounded-2xl border border-gold-400/40 bg-gold-400/10 px-4 py-3 text-[0.9rem] text-navy-900"
          >
            <strong className="font-medium">Ambiente de demonstração:</strong> este agendamento é de teste — nenhuma
            consulta real foi marcada.
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-9 max-w-xl overflow-hidden rounded-3xl border border-gold-400/40 bg-white text-left shadow-[0_40px_80px_-40px_rgba(13,19,54,0.45)]"
        >
          <div className="pattern-geo relative bg-navy-900 px-6 py-5 text-center text-ivory-50">
            <Butterfly className="absolute left-5 top-1/2 hidden h-7 w-7 -translate-y-1/2 text-gold-400/70 sm:block" />
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold-300">Código do agendamento</p>
            <button
              type="button"
              onClick={copy}
              aria-label="Copiar código"
              className="group mt-1 inline-flex items-center gap-3"
            >
              <span className="font-display text-[1.73rem] font-normal tracking-[0.3em] text-gold-gradient sm:text-[2.02rem]">
                {booked.code}
              </span>
              <span className="rounded-full border border-gold-400/40 px-2.5 py-1 text-[0.7rem] uppercase tracking-widest text-gold-200 transition-colors group-hover:bg-gold-400/15">
                {copied ? "Copiado!" : "Copiar"}
              </span>
            </button>
          </div>
          <dl className="divide-y divide-gold-400/20 px-6 text-[1rem]">
            {[
              ["Atendimento", booked.serviceName],
              ["Data", longDate(booked.date, true)],
              ["Horário", `${booked.startTime} às ${booked.endTime}`],
              ["Paciente", booked.patientName],
              ["WhatsApp", formatPhone(phone)],
              ["Pagamento", booked.paymentType === "convenio" ? `Convênio${booked.insurance ? ` — ${booked.insurance}` : ""}` : "Particular"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <dt className="text-[0.85rem] text-muted sm:text-[1rem]">{k}</dt>
                <dd className="font-medium text-navy-900 [overflow-wrap:anywhere] sm:text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="no-print mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2"
        >
          <Button href={googleCalendarUrl(booked)} variant="navy" className="w-full">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="5" width="17" height="15" rx="3" />
              <path d="M8 3v4M16 3v4M3.5 10h17" />
            </svg>
            Google Agenda
          </Button>
          <Button variant="outline" onClick={downloadIcs} className="w-full">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />
            </svg>
            Baixar (.ics)
          </Button>
          <Button
            href={whatsappLink(messageToClinic(booked))}
            variant="outline"
            className="w-full"
          >
            <WhatsAppIcon className="h-5 w-5 text-[#25d366]" />
            Avisar no WhatsApp
          </Button>
          <Button href={`/meu-agendamento?codigo=${booked.code}`} variant="outline" className="w-full">
            Gerenciar agendamento
          </Button>
        </motion.div>

        <div className="no-print mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.92rem] text-muted">
          <button type="button" onClick={() => window.print()} className="underline-offset-4 hover:text-navy-900 hover:underline">
            Imprimir comprovante
          </button>
          <button type="button" onClick={onNew} className="underline-offset-4 hover:text-navy-900 hover:underline">
            Fazer outro agendamento
          </button>
        </div>

        <p className="mx-auto mt-8 max-w-md text-[0.88rem] leading-relaxed text-muted">
          Guarde o código: com ele e o seu WhatsApp você pode remarcar ou cancelar em “Meu agendamento”. Em caso de
          imprevisto, fale com a gente em {site.phoneDisplay}.
        </p>
      </div>
    </div>
  );
}
