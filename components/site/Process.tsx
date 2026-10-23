"use client";

import { useRef } from "react";
import { motion, useScroll } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealItem } from "@/components/ui/Motion";
import { Em, SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  {
    n: "01",
    title: "Agende em minutos",
    text: "Escolha o atendimento, o dia e o horário que cabem na sua rotina — direto aqui no site, a qualquer hora.",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M3.5 10h17M8 14h3" />
      </>
    ),
  },
  {
    n: "02",
    title: "Receba a confirmação",
    text: "Você recebe um código do agendamento e pode adicionar a consulta à sua agenda. Remarcar ou cancelar é simples.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.3 12.2 2.5 2.5 4.9-5" />
      </>
    ),
  },
  {
    n: "03",
    title: "Avaliação e plano",
    text: "Na consulta, a Dra. escuta a sua história, examina com atenção e explica as opções de tratamento com clareza.",
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
  },
  {
    n: "04",
    title: "Cuidado que acompanha",
    text: "Tratamento planejado para você, com acompanhamento e orientações para manter o resultado por muito tempo.",
    icon: (
      <path d="M12 20.5s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.6-7.5 10-7.5 10Z" />
    ),
  },
];

export default function Process() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });

  return (
    <section id="atendimento" className="relative bg-ivory-50 py-24 sm:py-32 lg:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Como é o atendimento"
          title={
            <>
              Simples para agendar, <Em>cuidadoso</Em> para tratar
            </>
          }
          subtitle="Atendimento somente com hora marcada: você é recebido com calma, no seu tempo, sem espera."
        />

        <div className="relative mt-20">
          {/* linha que conecta as etapas (desktop) */}
          <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-gold-400/25 lg:block" />
          <motion.div
            aria-hidden
            style={{ scaleX: scrollYProgress }}
            className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px origin-left bg-gradient-to-r from-gold-400 to-gold-600 lg:block"
          />
          {/* linha vertical (mobile) */}
          <div aria-hidden className="absolute bottom-10 left-10 top-10 w-px bg-gold-400/25 lg:hidden" />
          <motion.div
            aria-hidden
            style={{ scaleY: scrollYProgress }}
            className="absolute bottom-10 left-10 top-10 w-px origin-top bg-gradient-to-b from-gold-400 to-gold-600 lg:hidden"
          />

          <div>
            <ol ref={ref} className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.n}>
                  <RevealItem index={i}>
                    <div className="flex gap-6 lg:block lg:text-center">
                      <span className="relative z-10 grid h-20 w-20 shrink-0 place-items-center rounded-full border border-gold-500/50 bg-ivory-50 text-navy-900 shadow-[0_14px_40px_-18px_rgba(13,19,54,0.5)] lg:mx-auto">
                        <span className="absolute inset-2 rounded-full bg-navy-900" />
                        <svg viewBox="0 0 24 24" className="relative h-8 w-8 text-gold-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          {s.icon}
                        </svg>
                        <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-gold-400 text-[0.7rem] font-semibold text-navy-950">
                          {s.n}
                        </span>
                      </span>
                      <div className="pt-1 lg:pt-6">
                        <h3 className="font-display text-[1.22rem] font-medium leading-[1.18] text-navy-900">{s.title}</h3>
                        <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">{s.text}</p>
                      </div>
                    </div>
                  </RevealItem>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <Reveal className="mt-16 text-center" delay={0.1}>
          <Button href="/agendar" size="lg">
            Escolher meu horário
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
