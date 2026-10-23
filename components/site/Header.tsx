"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Butterfly, WhatsAppIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { site, whatsappLink } from "@/lib/site";

const NAV = [
  { id: "sobre", label: "Sobre" },
  { id: "especialidades", label: "Especialidades" },
  { id: "atendimento", label: "Atendimento" },
  { id: "duvidas", label: "Dúvidas" },
  { id: "contato", label: "Contato" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // destaca no menu a seção que está na tela
  useEffect(() => {
    if (!isHome) return;
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  // sobre o herói escuro (início da home) o texto é claro; depois, escuro
  const light = isHome && !scrolled && !open;
  const href = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500"
        style={{ scaleX: progress }}
      />
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          light
            ? "bg-transparent"
            : "border-b border-gold-400/20 bg-ivory-50/85 shadow-[0_8px_30px_-18px_rgba(13,19,54,0.35)] backdrop-blur-xl"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 transition-all duration-500 sm:px-8 ${
            scrolled ? "h-[68px]" : "h-20"
          }`}
        >
          <Link href="/" className="group flex items-center gap-3" aria-label={`${site.name} — início`}>
            <Butterfly
              className={`h-9 w-9 transition-transform duration-700 group-hover:rotate-[8deg] group-hover:scale-110 ${
                light ? "text-gold-300" : "text-gold-600"
              }`}
            />
            <span className="flex flex-col leading-none">
              <span
                className={`font-display text-[0.98rem] font-medium uppercase tracking-[0.14em] transition-colors sm:text-[1.08rem] ${
                  light ? "text-ivory-50" : "text-navy-900"
                }`}
              >
                Dra. Stephanie Oliveira
              </span>
              <span
                className={`mt-1.5 text-[0.58rem] uppercase tracking-[0.36em] ${
                  light ? "text-gold-300" : "text-gold-600"
                }`}
              >
                {site.brandLine}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={href(n.id)}
                className={`group relative py-2 text-[0.95rem] tracking-wide transition-colors ${
                  light
                    ? "text-ivory-100/90 hover:text-gold-200"
                    : "text-navy-900/80 hover:text-gold-700"
                }`}
              >
                {n.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px origin-left bg-gold-500 transition-transform duration-500 ${
                    active === n.id && isHome ? "w-full scale-x-100" : "w-full scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/meu-agendamento"
              className={`hidden text-[0.9rem] underline-offset-4 transition-colors hover:underline xl:inline ${
                light ? "text-ivory-100/80" : "text-navy-900/70"
              }`}
            >
              Meu agendamento
            </Link>
            <span className="hidden sm:block">
              <Button href="/agendar" size="sm">
                Agendar consulta
              </Button>
            </span>
            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`relative z-[80] grid h-11 w-11 place-items-center rounded-full border transition-colors lg:hidden ${
                open || light
                  ? "border-gold-300/50 text-ivory-50"
                  : "border-navy-900/15 text-navy-900"
              }`}
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={`absolute left-0 h-px w-5 bg-current transition-all duration-300 ${
                    open ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-px w-5 bg-current transition-all duration-300 ${
                    open ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 h-px w-5 bg-current transition-all duration-300 ${
                    open ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            className="pattern-geo fixed inset-0 z-[60] flex flex-col bg-navy-950 px-8 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 40px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="flex flex-1 flex-col justify-center gap-2" aria-label="Menu móvel">
              {NAV.map((n, i) => (
                <motion.a
                  key={n.id}
                  href={href(n.id)}
                  onClick={() => setOpen(false)}
                  className="font-display text-[1.87rem] font-normal leading-[1.18] text-ivory-50 transition-colors hover:text-gold-300"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {n.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mt-6 flex flex-col gap-3"
              >
                <Button href="/agendar" size="lg" className="w-full" onClick={() => setOpen(false)}>
                  Agendar consulta
                </Button>
                <Button
                  href="/meu-agendamento"
                  variant="outline-light"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Meu agendamento
                </Button>
                <a
                  href={whatsappLink("Olá! Vim pelo site e gostaria de falar com a Dra. Stephanie 😊")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 text-gold-200"
                >
                  <WhatsAppIcon className="h-5 w-5" /> {site.phoneDisplay}
                </a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
