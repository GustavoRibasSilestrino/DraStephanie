"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, type Variants } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Butterfly, WhatsAppIcon } from "@/components/ui/Icons";
import { Counter, EASE, SplitWords } from "@/components/ui/Motion";
import HeroArt from "./HeroArt";
import { heroBaseDelay } from "./splash-timing";
import { shortDate } from "@/lib/datetime";
import type { Photos } from "@/lib/photo";
import { site, whatsappLink } from "@/lib/site";

/**
 * Entrada do herói.
 *
 * TODAS as animações partem do mesmo estado ("hide") e rodam sozinhas desde a montagem
 * ("show"), cada uma com o seu atraso — somado a `base`, o tempo da abertura animada
 * (0 quando ela é pulada). Nada depende de uma mudança de estado depois do carregamento,
 * o que deixava o título e a arte presos "escondidos" em alguns carregamentos.
 */

const rise: Variants = {
  hide: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

type Slot = { date: string; time: string } | null;

function NextSlotCard({ variants }: { variants: Variants }) {
  const [slot, setSlot] = useState<Slot | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    fetch("/api/next-slot")
      .then((r) => r.json())
      .then((d) => alive && setSlot(d.slot ?? null))
      .catch(() => alive && setSlot(null));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <motion.div
      variants={variants}
      className="absolute -left-2 bottom-10 z-20 sm:-left-6 xl:-left-14"
    >
      <div className="animate-float-slow">
        <Link
          href="/agendar"
          className="group flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 pr-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-colors hover:bg-white/[0.16]"
        >
          <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-gold-400/15 text-gold-300">
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" />
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <rect x="3.5" y="5" width="17" height="15" rx="3" />
              <path d="M8 3v4M16 3v4M3.5 10h17" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-[0.68rem] uppercase tracking-[0.22em] text-gold-200/80">
              Próximo horário livre
            </span>
            {slot === undefined ? (
              <span className="mt-1.5 block h-5 w-32 animate-pulse rounded bg-white/15" />
            ) : slot ? (
              <span className="mt-0.5 block font-display text-[1.04rem] font-medium text-ivory-50">
                {shortDate(slot.date)} · {slot.time}
              </span>
            ) : (
              <span className="mt-0.5 block font-display text-[0.95rem] font-medium text-ivory-50">
                Agende online
              </span>
            )}
          </span>
        </Link>
      </div>
    </motion.div>
  );
}

export default function Hero({ photos }: { photos: Photos }) {
  // atraso inicial (tempo da abertura); calculado uma vez, na montagem
  const [base] = useState(heroBaseDelay);

  const v = useMemo(
    () => ({
      text: {
        hide: {},
        show: { transition: { staggerChildren: 0.12, delayChildren: base + 0.05 } },
      } as Variants,
      art: { hide: {}, show: {} } as Variants,
      arch: {
        hide: { opacity: 0, scale: 0.92, y: 40 },
        show: { opacity: 1, scale: 1, y: 0, transition: { duration: 1.3, delay: base + 0.2, ease: EASE } },
      } as Variants,
      slot: {
        hide: { opacity: 0, y: 30, scale: 0.94 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, delay: base + 1.5, ease: EASE } },
      } as Variants,
      bubble: {
        hide: { opacity: 0, scale: 0.6, rotate: -8 },
        show: {
          opacity: 1,
          scale: 1,
          rotate: 0,
          transition: { type: "spring", stiffness: 140, damping: 16, delay: base + 1.2 },
        },
      } as Variants,
      badge: {
        hide: { opacity: 0, y: -24, scale: 0.94 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, delay: base + 1.8, ease: EASE } },
      } as Variants,
    }),
    [base],
  );

  // Rede de segurança: se alguma animação de entrada ainda estiver pendente alguns
  // segundos depois (ex.: navegador que não gera quadros de animação), conclui à força
  // para o herói nunca ficar "em branco".
  useEffect(() => {
    const t = setTimeout(
      () => {
        for (const a of document.getAnimations()) {
          try {
            const timing = a.effect?.getTiming();
            if (
              a.timeline === document.timeline &&
              a.playState === "running" &&
              timing &&
              Number.isFinite(Number(timing.iterations))
            ) {
              a.finish();
            }
          } catch {
            /* animação infinita ou já encerrada */
          }
        }
      },
      (base + 3.5) * 1000,
    );
    return () => clearTimeout(t);
  }, [base]);

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yArt = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const yPattern = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.1]);

  return (
    <section
      ref={ref}
      id="inicio"
      className="relative -mt-20 flex min-h-[100svh] items-center overflow-hidden bg-[radial-gradient(ellipse_at_72%_18%,#2a3374_0%,#0d1336_52%,#080c26_100%)] pb-28 pt-32 text-ivory-50 sm:pb-36 sm:pt-36"
    >
      <motion.div aria-hidden style={{ y: yPattern }} className="pattern-geo absolute inset-x-0 -top-20 bottom-0 opacity-90" />
      <div aria-hidden className="absolute -left-40 top-1/3 h-[34rem] w-[34rem] animate-float-slow rounded-full bg-gold-500/10 blur-[110px]" />
      <div aria-hidden className="absolute -right-32 -top-24 h-[30rem] w-[30rem] animate-float rounded-full bg-navy-500/30 blur-[110px]" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8">
        {/* texto */}
        <motion.div style={{ y: yText, opacity: fade }}>
          <motion.div variants={v.text} initial="hide" animate="show">
            <motion.div
              variants={rise}
              className="mb-7 inline-flex items-center gap-3 rounded-full border border-gold-400/30 bg-white/[0.04] py-2 pl-3 pr-4 text-[0.64rem] uppercase tracking-[0.14em] text-gold-200 backdrop-blur sm:pr-5 sm:text-[0.72rem] sm:tracking-[0.26em]"
            >
              <Butterfly className="h-4 w-4 text-gold-300" />
              Cirurgiã-dentista · {site.city} — {site.state}
            </motion.div>

            <h1 className="font-display text-[2.41rem] font-normal leading-[1.12] tracking-[-0.03em] text-balance sm:text-[3.38rem] lg:text-[4.1rem]">
              <SplitWords
                parts={[
                  { text: "Odontologia que" },
                  { text: "valoriza", className: "" },
                  { text: "pessoas.", className: "italic text-gold-gradient" },
                ]}
              />
            </h1>

            <motion.p
              variants={rise}
              className="mt-8 max-w-xl text-[1.12rem] leading-relaxed text-ivory-200/85 sm:text-[1.2rem]"
            >
              Cuidado humanizado em <strong className="font-medium text-gold-200">endodontia</strong>,{" "}
              <strong className="font-medium text-gold-200">prótese</strong> e{" "}
              <strong className="font-medium text-gold-200">implantes</strong>. Do diagnóstico ao resultado,
              você em boas mãos.
            </motion.p>

            <motion.div variants={rise} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button href="/agendar" size="lg">
                Agendar minha consulta
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Button>
              <Button
                href={whatsappLink("Olá! Vim pelo site e gostaria de falar com a Dra. Stephanie 😊")}
                variant="outline-light"
                size="lg"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Falar no WhatsApp
              </Button>
            </motion.div>

            <motion.dl
              variants={rise}
              className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-8"
            >
              <div>
                <dt className="sr-only">Experiência</dt>
                <dd className="font-display text-[1.87rem] font-normal leading-none text-gold-gradient">
                  <Counter to={10} prefix="+" delay={base + 1} />
                </dd>
                <p className="mt-2 text-[0.82rem] leading-snug text-ivory-200/70">anos de experiência</p>
              </div>
              <div>
                <dt className="sr-only">Especializações</dt>
                <dd className="font-display text-[1.87rem] font-normal leading-none text-gold-gradient">
                  <Counter to={2} delay={base + 1} />
                </dd>
                <p className="mt-2 text-[0.82rem] leading-snug text-ivory-200/70">
                  especializações: endodontia e prótese
                </p>
              </div>
              <div>
                <dt className="sr-only">Atendimento</dt>
                <dd className="font-display text-[1.87rem] font-normal leading-none text-gold-gradient">
                  1:1
                </dd>
                <p className="mt-2 text-[0.82rem] leading-snug text-ivory-200/70">
                  atendimento individual, com hora marcada
                </p>
              </div>
            </motion.dl>
          </motion.div>
        </motion.div>

        {/* arte */}
        <motion.div style={{ y: yArt }} className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
          <motion.div variants={v.art} initial="hide" animate="show">
            <motion.div variants={v.arch} className="relative mx-auto aspect-[4/5] w-full max-w-[440px]">
              {/* moldura deslocada */}
              <div aria-hidden className="absolute inset-0 translate-x-5 translate-y-5 rounded-t-[999px] rounded-b-[36px] border border-gold-400/35" />
              <div aria-hidden className="absolute -inset-5 animate-spin-slow rounded-full border border-dashed border-gold-400/20" />

              <div className="relative h-full w-full overflow-hidden rounded-t-[999px] rounded-b-[36px] border border-gold-300/30 bg-gradient-to-b from-navy-700 via-navy-800 to-navy-900 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.85)]">
                {photos.portrait ? (
                  <>
                    <Image
                      src={photos.portrait}
                      alt={`${site.name}, cirurgiã-dentista em ${site.city}`}
                      fill
                      priority
                      sizes="(min-width: 1024px) 440px, 90vw"
                      className="object-cover object-top"
                    />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
                  </>
                ) : (
                  <>
                    <div aria-hidden className="pattern-geo absolute inset-0 opacity-70" />
                    <HeroArt base={base} />
                  </>
                )}
              </div>

              {/* cartões flutuantes */}
              <NextSlotCard variants={v.slot} />
              {photos.avatar && !photos.portrait ? (
                <motion.div
                  variants={v.bubble}
                  className="absolute -right-3 top-4 z-20 sm:-right-5 sm:top-8 xl:-right-12"
                >
                  <div className="animate-float">
                    <div className="relative">
                      {/* anel dourado que gira */}
                      <span aria-hidden className="absolute -inset-2 animate-spin-slow rounded-full border border-dashed border-gold-300/60" />
                      <span className="relative block h-[7rem] w-[7rem] overflow-hidden rounded-full border-[3px] border-gold-300 shadow-[0_24px_50px_-14px_rgba(0,0,0,0.8)] sm:h-[9.25rem] sm:w-[9.25rem]">
                        <Image
                          src={photos.avatar}
                          alt={`${site.name}, cirurgiã-dentista`}
                          fill
                          priority
                          sizes="150px"
                          className="object-cover"
                        />
                      </span>
                      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold-300/40 bg-navy-900/90 px-3.5 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-gold-200 shadow-lg backdrop-blur sm:text-[0.66rem]">
                        Dra. Stephanie
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : !photos.portrait ? (
                <motion.div
                  variants={v.badge}
                  className="absolute -right-2 top-14 z-20 sm:-right-4 xl:-right-12"
                >
                  <div className="animate-float">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                      <Butterfly className="h-8 w-8 text-gold-300" />
                      <span className="leading-tight">
                        <span className="block text-[0.66rem] uppercase tracking-[0.22em] text-gold-200/80">
                          Especialista em
                        </span>
                        <span className="block font-display text-[0.95rem] font-medium text-ivory-50">
                          Endodontia & Prótese
                        </span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* indicador de rolagem */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: base + 2.4, duration: 1 }}
        className="absolute bottom-24 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.64rem] uppercase tracking-[0.36em] text-gold-200/70 2xl:flex"
      >
        Role
        <span className="relative h-10 w-px overflow-hidden bg-gold-300/25">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-gold-300"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>

      {/* arco que "vaza" para a próxima seção */}
      <svg
        aria-hidden
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        className="absolute bottom-[-1px] left-0 h-[56px] w-full sm:h-[96px]"
      >
        <path d="M0 110V52C240 6 480 -8 720 -8s480 14 720 60v58Z" fill="#fefbf5" />
      </svg>
    </section>
  );
}
