"use client";

import { useMemo } from "react";
import { motion, type Variants } from "motion/react";
import { TOOTH_PATH } from "@/components/ui/Icons";

const STARS = [
  { x: 78, y: 120, s: 1, d: 0 },
  { x: 330, y: 92, s: 0.7, d: 0.8 },
  { x: 352, y: 300, s: 1.1, d: 1.6 },
  { x: 54, y: 330, s: 0.6, d: 2.2 },
  { x: 214, y: 44, s: 0.5, d: 1.2 },
];

const draw = (duration: number, delay: number, extra: Record<string, number> = {}): Variants => ({
  hide: { pathLength: 0, ...Object.fromEntries(Object.keys(extra).map((k) => [k, 0])) },
  show: { pathLength: 1, ...extra, transition: { duration, delay, ease: [0.65, 0, 0.35, 1] } },
});

const fade = (duration: number, delay: number): Variants => ({
  hide: { opacity: 0 },
  show: { opacity: 1, transition: { duration, delay } },
});

/**
 * Dente em traço dourado que se desenha sozinho — ilustração do herói.
 *
 * Não tem estado próprio: todos os elementos herdam os rótulos "hide"/"show" do pai
 * (o container da arte no Hero) e usam `base` como atraso inicial (tempo da abertura).
 */
export default function HeroArt({ base }: { base: number }) {
  const v = useMemo(
    () => ({
      glow: {
        hide: { opacity: 0, scale: 0.7 },
        show: { opacity: 1, scale: 1, transition: { duration: 1.6, delay: base, ease: "easeOut" } },
      } as Variants,
      fill: fade(1.4, base + 1.6),
      outline: draw(2.4, base + 0.1),
      shine: draw(1, base + 2.1, { opacity: 0.85 }),
      canalL: draw(1, base + 2.3),
      canalR: draw(1, base + 2.4),
      smile1: draw(1.6, base + 1.2),
      smile2: draw(1.6, base + 1.5),
      stars: STARS.map(
        (s): Variants => ({
          hide: { opacity: 0, scale: 0 },
          show: {
            opacity: [0, 1, 0.35, 1, 0],
            scale: [0, 1, 0.8, 1.1, 0],
            transition: {
              duration: 4,
              delay: base + 2 + s.d,
              repeat: Infinity,
              repeatDelay: 1.2,
              ease: "easeInOut",
            },
          },
        }),
      ),
    }),
    [base],
  );

  return (
    <svg viewBox="0 0 400 500" className="h-full w-full" fill="none" aria-hidden>
      <defs>
        <linearGradient id="gold-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e9c4" />
          <stop offset="0.5" stopColor="#d7b46f" />
          <stop offset="1" stopColor="#a77f3d" />
        </linearGradient>
        <radialGradient id="tooth-glow" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#e5cd96" stopOpacity="0.26" />
          <stop offset="1" stopColor="#e5cd96" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tooth-fill" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#f6e9c4" stopOpacity="0.16" />
          <stop offset="1" stopColor="#d7b46f" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="200"
        cy="226"
        r="168"
        fill="url(#tooth-glow)"
        variants={v.glow}
        style={{ transformOrigin: "200px 226px" }}
      />

      {/* órbita tracejada que gira devagar */}
      <g style={{ transformOrigin: "200px 226px" }} className="animate-spin-slow">
        <circle cx="200" cy="226" r="150" stroke="#d7b46f" strokeOpacity="0.28" strokeDasharray="2 9" strokeLinecap="round" />
        <circle cx="200" cy="76" r="4" fill="#e5cd96" />
      </g>
      <circle cx="200" cy="226" r="124" stroke="#d7b46f" strokeOpacity="0.14" />

      {/* o dente */}
      <g transform="translate(62 72) scale(4.35)">
        <motion.path d={TOOTH_PATH} fill="url(#tooth-fill)" stroke="none" variants={v.fill} />
        <motion.path
          d={TOOTH_PATH}
          stroke="url(#gold-stroke)"
          strokeWidth={0.55}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={v.outline}
        />
        {/* brilho */}
        <motion.path
          d="M20 16C17 18 15.5 22 16 26"
          stroke="#fff6dc"
          strokeWidth={0.7}
          strokeLinecap="round"
          variants={v.shine}
        />
        <motion.path
          d="M24.5 31C24 36 24.2 40 24.8 44"
          stroke="#d7b46f"
          strokeOpacity={0.5}
          strokeWidth={0.35}
          strokeLinecap="round"
          variants={v.canalL}
        />
        <motion.path
          d="M39.5 31C40 36 39.8 40 39.2 44"
          stroke="#d7b46f"
          strokeOpacity={0.5}
          strokeWidth={0.35}
          strokeLinecap="round"
          variants={v.canalR}
        />
      </g>

      {/* sorriso */}
      <motion.path
        d="M96 408Q200 470 304 408"
        stroke="url(#gold-stroke)"
        strokeWidth={2}
        strokeLinecap="round"
        variants={v.smile1}
      />
      <motion.path
        d="M130 424Q200 462 270 424"
        stroke="#d7b46f"
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeLinecap="round"
        variants={v.smile2}
      />

      {/* brilhos que piscam */}
      {STARS.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) scale(${s.s})`}>
          <motion.g variants={v.stars[i]} style={{ transformOrigin: "0px 0px" }}>
            <path d="M0 -12C1 -4 4 -1 12 0C4 1 1 4 0 12C-1 4 -4 1 -12 0C-4 -1 -1 -4 0 -12Z" fill="#f6e9c4" />
          </motion.g>
        </g>
      ))}
    </svg>
  );
}
