"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Butterfly } from "@/components/ui/Icons";
import { Counter, Reveal, RevealGroup, RevealItem } from "@/components/ui/Motion";
import { Em, SectionHeading } from "@/components/ui/SectionHeading";
import type { Photos } from "@/lib/photo";
import { formation, site } from "@/lib/site";

const PILLARS = [
  {
    title: "Escuta antes do tratamento",
    text: "Cada plano nasce da sua história, das suas queixas e das suas expectativas.",
    icon: (
      <path d="M12 3a6 6 0 0 0-6 6c0 2.2 1 3.6 2 4.8.8 1 1 1.6 1 2.7V18h6v-1.5c0-1.1.2-1.7 1-2.7 1-1.2 2-2.6 2-4.8a6 6 0 0 0-6-6ZM10 21h4" />
    ),
  },
  {
    title: "Diagnóstico preciso",
    text: "Avaliação completa para indicar apenas o que você realmente precisa.",
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5M8.5 11.2l1.7 1.7 3.2-3.4" />
      </>
    ),
  },
  {
    title: "Explicação com clareza",
    text: "Você entende cada etapa, as opções e os cuidados antes de começar.",
    icon: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
        <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20M9 8h6M9 12h4" />
      </>
    ),
  },
  {
    title: "Hora marcada, sem correria",
    text: "Atendimento individual: o tempo certo para cuidar bem de você.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.2 2" />
      </>
    ),
  },
];

/** Selo giratório com o CRO, no canto do retrato. */
function Seal() {
  return (
    <div className="relative grid h-28 w-28 place-items-center sm:h-32 sm:w-32">
      <svg viewBox="0 0 120 120" className="absolute inset-0 animate-spin-slow" aria-hidden>
        <defs>
          <path id="seal-circle" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
        </defs>
        <text className="fill-gold-300" fontSize="10.5" letterSpacing="4.2" fontFamily="var(--font-poppins)">
          <textPath href="#seal-circle">CIRURGIÃ-DENTISTA • CRO-SP 117.006 •</textPath>
        </text>
      </svg>
      <div className="grid h-[4.4rem] w-[4.4rem] place-items-center rounded-full bg-navy-900 ring-1 ring-gold-400/50 sm:h-[4.9rem] sm:w-[4.9rem]">
        <Butterfly className="h-9 w-9 text-gold-300 sm:h-10 sm:w-10" />
      </div>
    </div>
  );
}

function Portrait({ photos }: { photos: Photos }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
      <Reveal scale={0.96} y={40} duration={1.1}>
        <div className="relative aspect-[4/5]">
          <div aria-hidden className="absolute inset-0 -translate-x-4 translate-y-4 rounded-t-[999px] rounded-b-[32px] border border-gold-500/40 sm:-translate-x-6 sm:translate-y-6" />
          <div className="relative h-full overflow-hidden rounded-t-[999px] rounded-b-[32px] bg-gradient-to-b from-navy-700 via-navy-800 to-navy-950 shadow-[0_40px_80px_-30px_rgba(13,19,54,0.6)]">
            {photos.portrait ? (
              <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-8">
                <Image
                  src={photos.portrait}
                  alt={`${site.name}, cirurgiã-dentista`}
                  fill
                  sizes="(min-width: 1024px) 480px, 90vw"
                  className="object-cover object-top"
                />
              </motion.div>
            ) : photos.avatar ? (
              <>
                <div aria-hidden className="pattern-geo absolute inset-0" />
                <div aria-hidden className="absolute left-1/2 top-[44%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/15 blur-[70px]" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="relative mx-auto h-[11rem] w-[11rem] sm:h-[12.5rem] sm:w-[12.5rem]">
                      <span aria-hidden className="absolute -inset-3 animate-spin-slow rounded-full border border-dashed border-gold-300/50" />
                      <span aria-hidden className="absolute -inset-6 rounded-full border border-gold-400/20" />
                      <span className="relative block h-full w-full overflow-hidden rounded-full border-[3px] border-gold-300 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
                        <Image src={photos.avatar} alt={`${site.name}, cirurgiã-dentista`} fill sizes="200px" className="object-cover" />
                      </span>
                    </div>
                    <div className="mt-9 font-display text-[1.35rem] font-normal text-ivory-50 sm:text-[1.5rem]">{site.name}</div>
                    <div className="mt-1.5 text-[0.66rem] uppercase tracking-[0.32em] text-gold-300">Cirurgiã-dentista · {site.cro}</div>
                    <Butterfly className="mx-auto mt-5 h-7 w-7 text-gold-400/80" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div aria-hidden className="pattern-geo absolute inset-0" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <Butterfly className="mx-auto h-14 w-14 text-gold-400" />
                    <div className="mt-4 font-display text-[4.68rem] font-normal leading-none text-gold-gradient sm:text-[5.76rem]">
                      SO
                    </div>
                    <div className="mt-2 text-[0.66rem] uppercase tracking-[0.5em] text-gold-200/80">
                      Stephanie Oliveira
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="absolute -bottom-8 -right-3 z-10 sm:-right-8">
            <Seal />
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });

  const items = [
    ...formation.map((f) => ({ year: f.year, title: f.title, place: f.place })),
    { year: "Hoje", title: "Atendimento em Sorocaba – SP", place: "Mais de 10 anos de experiência clínica" },
  ];

  return (
    <div ref={ref} className="relative mt-24 sm:mt-28">
      <Reveal>
        <h3 className="mb-12 text-center font-display text-[1.44rem] font-normal italic text-navy-900 sm:text-[1.73rem]">
          Formação e trajetória
        </h3>
      </Reveal>

      {/* linha que se desenha ao rolar */}
      <div className="absolute bottom-0 left-[1.15rem] top-24 hidden w-px bg-gold-400/20 sm:block md:left-1/2 md:-translate-x-1/2" aria-hidden />
      <motion.div
        aria-hidden
        style={{ scaleY: scrollYProgress }}
        className="absolute bottom-0 left-[1.15rem] top-24 hidden w-px origin-top bg-gradient-to-b from-gold-400 to-gold-600 sm:block md:left-1/2 md:-translate-x-1/2"
      />

      <ol className="relative space-y-8 sm:space-y-12">
        {items.map((it, i) => {
          const right = i % 2 === 1;
          return (
            <li key={it.year} className="relative sm:pl-14 md:pl-0">
              <motion.span
                aria-hidden
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="absolute left-0 top-6 z-10 hidden h-[2.3rem] w-[2.3rem] place-items-center rounded-full border border-gold-500 bg-ivory-50 sm:grid md:left-1/2 md:-translate-x-1/2"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-gold-500" />
              </motion.span>
              <div className={`md:grid md:grid-cols-2 md:gap-24`}>
                <Reveal
                  x={right ? 40 : -40}
                  y={0}
                  className={right ? "md:col-start-2" : "md:col-start-1 md:text-right"}
                >
                  <div className="rounded-3xl border border-gold-400/25 bg-white p-6 shadow-[0_20px_50px_-28px_rgba(13,19,54,0.35)] sm:p-7">
                    <div className="font-display text-[1.87rem] font-normal leading-none text-gold-gradient-dark">
                      {it.year}
                    </div>
                    <div className="mt-3 text-[1.08rem] font-medium text-navy-900">{it.title}</div>
                    <div className="mt-1 text-[0.95rem] text-muted">{it.place}</div>
                  </div>
                </Reveal>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function About({ photos }: { photos: Photos }) {
  return (
    <section id="sobre" className="relative overflow-hidden bg-ivory-50 py-24 sm:py-32 lg:py-36">
      <div aria-hidden className="pattern-dots absolute -right-20 top-10 h-72 w-72 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
          <Portrait photos={photos} />

          <div className="mt-6 lg:mt-0">
            <SectionHeading
              align="left"
              eyebrow="Quem sou eu"
              title={
                <>
                  Prazer, <Em>Dra. Stephanie</Em>.
                </>
              }
            />
            <div className="mt-8 space-y-5 text-[1.08rem] leading-[1.8] text-muted">
              <Reveal delay={0.1}>
                <p>
                  Sou cirurgiã-dentista formada pela UNIP, em Sorocaba, e há mais de dez anos realizo o sonho de
                  infância de <strong className="font-medium text-navy-900">cuidar de sorrisos</strong>. Me
                  especializei em <strong className="font-medium text-navy-900">Endodontia</strong> e em{" "}
                  <strong className="font-medium text-navy-900">Prótese Dentária</strong> — duas áreas que se
                  encontram quando o objetivo é preservar o seu dente natural ou devolver função e estética quando
                  ele já não pode ser mantido.
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <p>
                  Sou reconhecida pela atenção e pelo cuidado com cada paciente: é o que chamo de odontologia
                  humanizada. Para mim, um bom tratamento começa ouvindo — entender a sua história, explicar cada
                  etapa com clareza e planejar juntos o melhor caminho.
                </p>
              </Reveal>
              <Reveal delay={0.22}>
                <p className="font-display text-[1.22rem] italic leading-snug text-navy-900 sm:text-[1.37rem]">
                  “Sou apaixonada pela conexão com os meus pacientes.”
                </p>
              </Reveal>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-t border-gold-400/25 pt-8">
              <div>
                <div className="font-display text-[2.16rem] font-normal leading-none text-gold-gradient-dark">
                  <Counter to={10} prefix="+" />
                </div>
                <div className="mt-1 text-sm text-muted">anos de experiência</div>
              </div>
              <div>
                <div className="font-display text-[2.16rem] font-normal leading-none text-gold-gradient-dark">
                  <Counter to={2} />
                </div>
                <div className="mt-1 text-sm text-muted">especializações</div>
              </div>
              <div>
                <div className="font-display text-[2.16rem] font-normal leading-none text-gold-gradient-dark">
                  <Counter to={6} />
                </div>
                <div className="mt-1 text-sm text-muted">áreas de atuação</div>
              </div>
            </div>
          </div>
        </div>

        <RevealGroup className="mt-24 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {PILLARS.map((p) => (
            <RevealItem key={p.title}>
              <div className="group h-full rounded-3xl border border-gold-400/25 bg-ivory-100/60 p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/60 hover:bg-white hover:shadow-[0_28px_60px_-30px_rgba(13,19,54,0.4)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-900 text-gold-300 transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {p.icon}
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-[1.01rem] font-medium leading-[1.18] text-navy-900">{p.title}</h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">{p.text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Timeline />
      </div>
    </section>
  );
}

