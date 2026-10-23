"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ServiceIcon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Motion";
import { Em, SectionHeading } from "@/components/ui/SectionHeading";

const OPTIONS = [
  {
    id: "dor",
    label: "Estou com dor",
    service: "urgencia",
    icon: "alert",
    title: "Atendimento de urgência",
    text: "Dor, sensibilidade intensa, inchaço ou dente quebrado merecem atenção rápida. Reserve o primeiro horário livre e descreva o que está sentindo — a Dra. avalia e indica o tratamento.",
  },
  {
    id: "canal",
    label: "Preciso de canal",
    service: "canal",
    icon: "root",
    title: "Tratamento de canal (endodontia)",
    text: "Especialidade da Dra. Stephanie: eliminar a infecção e preservar o seu dente natural, com técnica precisa e conforto durante o procedimento.",
  },
  {
    id: "faltam",
    label: "Faltam dentes",
    service: "implante",
    icon: "implant",
    title: "Implante ou prótese",
    text: "Na avaliação, a Dra. analisa o seu caso e explica as opções para repor dentes — implantes, próteses fixas ou removíveis — com prazos e cuidados de cada uma.",
  },
  {
    id: "claro",
    label: "Quero dentes mais claros",
    service: "clareamento",
    icon: "sparkle",
    title: "Clareamento dental",
    text: "Primeiro avaliamos se o clareamento é indicado para você e como fazê-lo respeitando a saúde dos dentes e da gengiva, com acompanhamento profissional.",
  },
  {
    id: "alinhar",
    label: "Quero alinhar os dentes",
    service: "alinhadores",
    icon: "aligner",
    title: "Alinhadores ortodônticos",
    text: "Planejamento individual para alinhar os dentes de forma discreta, com alinhadores transparentes e removíveis e acompanhamento periódico.",
  },
  {
    id: "revisao",
    label: "Quero fazer uma revisão",
    service: "avaliacao",
    icon: "search",
    title: "Avaliação completa",
    text: "O melhor ponto de partida: um check-up da saúde bucal, com diagnóstico, orientações de prevenção e, se necessário, um plano de tratamento.",
  },
] as const;

export default function Guide() {
  const [sel, setSel] = useState<(typeof OPTIONS)[number]["id"]>("revisao");
  const current = OPTIONS.find((o) => o.id === sel)!;

  return (
    <section className="relative overflow-hidden bg-ivory-100 py-24 sm:py-32">
      <div aria-hidden className="pattern-dots absolute -left-16 bottom-0 h-72 w-72 opacity-60" />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Por onde começar"
          title={
            <>
              Como posso <Em>ajudar você</Em> hoje?
            </>
          }
          subtitle="Escolha o que mais combina com o seu momento e veja o caminho mais indicado."
        />

        <LayoutGroup>
          <Reveal delay={0.1} className="mt-12 flex flex-wrap justify-center gap-3">
            {OPTIONS.map((o) => {
              const active = o.id === sel;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSel(o.id)}
                  aria-pressed={active}
                  className={`relative rounded-full px-5 py-3 text-[0.98rem] transition-colors duration-300 ${
                    active ? "text-navy-950" : "border border-navy-900/15 bg-white/70 text-navy-900/80 hover:border-gold-500"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="guide-pill"
                      className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#ecd8a4,#d2ab62_50%,#b48a45)] shadow-[0_10px_28px_-10px_rgba(195,154,85,0.8)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{o.label}</span>
                </button>
              );
            })}
          </Reveal>
        </LayoutGroup>

        <Reveal delay={0.15} className="mt-10">
          <div className="relative overflow-hidden rounded-[2rem] border border-gold-400/30 bg-white p-7 shadow-[0_40px_80px_-40px_rgba(13,19,54,0.4)] sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10"
              >
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-navy-900 text-gold-300 sm:h-24 sm:w-24">
                  <ServiceIcon name={current.icon} className="h-11 w-11 sm:h-12 sm:w-12" />
                </span>
                <div className="flex-1">
                  <p className="text-[0.72rem] uppercase tracking-[0.26em] text-gold-600">Caminho sugerido</p>
                  <h3 className="mt-1 font-display text-[1.44rem] font-medium leading-[1.18] text-navy-900 sm:text-[1.66rem]">
                    {current.title}
                  </h3>
                  <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">{current.text}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                    <Button href={`/agendar?servico=${current.service}`}>Agendar este atendimento</Button>
                    <span className="text-[0.85rem] text-muted">
                      É um ponto de partida: o diagnóstico é feito na consulta.
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
