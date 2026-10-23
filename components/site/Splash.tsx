"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BUTTERFLY_PATHS } from "@/components/ui/Icons";
import { site } from "@/lib/site";

declare global {
  interface Window {
    __splashDone?: boolean;
  }
}

/**
 * Abertura elegante: a borboleta da marca se desenha em dourado e a cortina
 * sobe. Aparece uma vez por sessão e só na página inicial.
 */
export default function Splash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const skip =
      document.documentElement.getAttribute("data-splash") === "skip" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skip) {
      window.__splashDone = true;
      window.dispatchEvent(new Event("splash-done"));
      setVisible(false);
      return;
    }
    try {
      sessionStorage.setItem("splash-seen", "1");
    } catch {
      /* navegação privada: tudo bem, só aparece de novo */
    }
    document.body.style.overflow = "hidden";
    // o herói começa a animar quando a cortina começa a subir
    const t1 = setTimeout(() => {
      window.__splashDone = true;
      window.dispatchEvent(new Event("splash-done"));
    }, 2050);
    const t2 = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 2150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="splash"
          key="splash"
          aria-hidden
          className="pattern-geo fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy-950"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(215,180,111,0.16),transparent_60%)]" />
          <svg viewBox="0 0 40 40" className="relative h-28 w-28 text-gold-400" fill="none">
            {BUTTERFLY_PATHS.map((d, i) => (
              <motion.path
                key={d}
                d={d}
                stroke="currentColor"
                strokeWidth={0.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, delay: 0.15 + i * 0.14, ease: "easeInOut" }}
              />
            ))}
          </svg>
          <motion.div
            className="relative mt-7 text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="font-display text-[1.22rem] font-medium uppercase tracking-[0.28em] text-ivory-50">
              {site.name.replace(" de ", " ")}
            </div>
            <motion.div
              className="mx-auto mt-3 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="mt-3 text-[0.68rem] uppercase tracking-[0.5em] text-gold-300">
              {site.brandLine}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * true quando a abertura terminou (ou não precisa acontecer).
 *
 * Quando a abertura é pulada (visita repetida), a virada para true é adiada por
 * um instante, para o herói não começar a animar no mesmo tick da hidratação.
 */
export function useSplashDone(): boolean {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const skip =
      window.__splashDone ||
      document.documentElement.getAttribute("data-splash") === "skip" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skip) {
      const t = setTimeout(() => setDone(true), 120);
      return () => clearTimeout(t);
    }
    const on = () => setDone(true);
    window.addEventListener("splash-done", on);
    return () => window.removeEventListener("splash-done", on);
  }, []);
  return done;
}
