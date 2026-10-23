"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import { ServiceIcon } from "@/components/ui/Icons";
import { RevealGroup, RevealItem } from "@/components/ui/Motion";
import { Em, SectionHeading } from "@/components/ui/SectionHeading";
import { specialties } from "@/lib/site";

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={`spotlight ${className}`}>
      {children}
    </div>
  );
}

export default function Specialties() {
  return (
    <section
      id="especialidades"
      className="relative overflow-hidden bg-navy-900 py-24 text-ivory-50 sm:py-32 lg:py-36"
    >
      <div aria-hidden className="pattern-geo absolute inset-0 opacity-80" />
      <div aria-hidden className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      <div aria-hidden className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-gold-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          tone="dark"
          eyebrow="Especialidades"
          title={
            <>
              Cuidado completo para <Em tone="dark">cada sorriso</Em>
            </>
          }
          subtitle="Do tratamento de canal à reabilitação com próteses e implantes, tudo com planejamento individual e atenção em cada detalhe."
        />

        <RevealGroup className="mt-16 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3" stagger={0.1}>
          {specialties.map((s) => (
            <RevealItem key={s.slug} className="h-full">
              <SpotlightCard className="group h-full rounded-[1.75rem] border border-white/10 bg-white/[0.04] transition-all duration-500 hover:-translate-y-2 hover:border-gold-400/50 hover:bg-white/[0.07] hover:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
                <div className="relative flex h-full flex-col p-7 sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="grid h-16 w-16 place-items-center rounded-2xl border border-gold-400/30 bg-gold-400/10 text-gold-300 transition-all duration-500 group-hover:rotate-[-5deg] group-hover:scale-110 group-hover:bg-gold-400/20">
                      <ServiceIcon name={s.icon} className="h-9 w-9" />
                    </span>
                    <span className="font-display text-[0.95rem] italic text-gold-400/70">
                      {String(specialties.indexOf(s) + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-6 text-[0.72rem] uppercase tracking-[0.26em] text-gold-300/80">{s.subtitle}</p>
                  <h3 className="mt-2 font-display text-[1.44rem] font-medium leading-[1.18] text-ivory-50">{s.title}</h3>
                  <p className="mt-4 text-[0.98rem] leading-relaxed text-ivory-200/70">{s.text}</p>
                  <ul className="mt-5 space-y-2 text-[0.95rem] text-ivory-100/85">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-3">
                        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m4 10.5 4 4 8-9" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/agendar?servico=${s.service}`}
                    className="mt-auto inline-flex items-center gap-2 pt-7 text-[0.95rem] font-medium text-gold-300 transition-colors hover:text-gold-200"
                  >
                    <span className="relative">
                      Agendar avaliação
                      <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold-300 transition-transform duration-500 group-hover:scale-x-100" />
                    </span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
