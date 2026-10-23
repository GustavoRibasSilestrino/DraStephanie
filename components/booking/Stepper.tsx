"use client";

import { motion } from "motion/react";

export default function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0;
  return (
    <nav aria-label="Etapas do agendamento" className="relative mx-auto max-w-3xl">
      <div className="absolute left-[12.5%] right-[12.5%] top-[1.15rem] h-px bg-gold-400/25 sm:top-5" aria-hidden />
      <motion.div
        aria-hidden
        className="absolute left-[12.5%] top-[1.15rem] h-px origin-left bg-gradient-to-r from-gold-400 to-gold-600 sm:top-5"
        initial={false}
        animate={{ width: `${(pct / 100) * 75}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-col items-center text-center" aria-current={active ? "step" : undefined}>
              <motion.span
                initial={false}
                animate={{ scale: active ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className={`relative grid h-[2.3rem] w-[2.3rem] place-items-center rounded-full border text-[0.9rem] font-semibold transition-colors duration-500 sm:h-10 sm:w-10 ${
                  done
                    ? "border-gold-500 bg-gold-500 text-navy-950"
                    : active
                      ? "border-gold-500 bg-navy-900 text-gold-300 shadow-[0_0_0_5px_rgba(195,154,85,0.18)]"
                      : "border-gold-400/40 bg-ivory-50 text-navy-900/40"
                }`}
              >
                {done ? (
                  <motion.svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="m4 10.5 4 4 8-9"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  </motion.svg>
                ) : (
                  i + 1
                )}
              </motion.span>
              <span
                className={`mt-2.5 max-w-[5.5rem] text-[0.7rem] leading-tight tracking-wide transition-colors duration-500 sm:max-w-none sm:text-[0.82rem] ${
                  active ? "font-medium text-navy-900" : done ? "text-navy-900/80" : "text-navy-900/45"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
