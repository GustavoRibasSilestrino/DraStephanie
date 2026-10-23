"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Aparece suavemente (subindo) quando entra na tela. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  x = 0,
  scale = 1,
  duration = 0.9,
  amount = 0.2,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  scale?: number;
  duration?: number;
  amount?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container de uma lista de cartões. Cada <RevealItem> se revela sozinho
 * quando ELE entra na tela (robusto em listas altas no celular) e o atraso
 * entre vizinhos de uma mesma fileira cria o efeito de cascata.
 */
export function RevealGroup({
  children,
  stagger = 0.12,
  className,
}: {
  children: ReactNode;
  stagger?: number;
  className?: string;
  /** mantido por compatibilidade */
  amount?: number;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ index?: number; stagger?: number }>, {
              index: i,
              stagger,
            })
          : child,
      )}
    </div>
  );
}

export function RevealItem({
  children,
  className,
  index = 0,
  stagger = 0.12,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.85, ease: EASE, delay: (index % 3) * stagger }}
    >
      {children}
    </motion.div>
  );
}

export interface WordPart {
  text: string;
  className?: string;
}

/** Título que sobe palavra por palavra, com máscara (efeito de revista). */
export function SplitWords({
  parts,
  delay = 0,
  stagger = 0.07,
  className,
  inView = false,
  play = true,
}: {
  parts: WordPart[];
  delay?: number;
  stagger?: number;
  className?: string;
  /** anima ao entrar na tela (em vez de ao montar) */
  inView?: boolean;
  /** false = segura a animação (ex.: enquanto a abertura do site roda) */
  play?: boolean;
}) {
  let i = 0;
  const trigger = inView
    ? { whileInView: { y: "0%" }, viewport: { once: true, amount: 0.6 } }
    : { animate: { y: play ? "0%" : "115%" } };
  return (
    <span className={className}>
      {parts.map((part, pi) =>
        part.text.split(" ").map((word, wi) => {
          if (!word) return null;
          const idx = i++;
          return (
            <span
              key={`${pi}-${wi}`}
              className="inline-block overflow-hidden pb-[0.14em] align-bottom"
              style={{ marginBottom: "-0.14em" }}
            >
              <motion.span
                className={`inline-block ${part.className ?? ""}`}
                initial={{ y: "115%" }}
                {...trigger}
                transition={{ duration: 1, delay: delay + idx * stagger, ease: EASE }}
              >
                {word}&nbsp;
              </motion.span>
            </span>
          );
        }),
      )}
    </span>
  );
}

/** Número que "conta" até o valor quando aparece na tela. */
export function Counter({
  to,
  prefix = "",
  suffix = "",
  duration = 2.2,
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => Math.round(v));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, { duration, ease: EASE });
    return () => controls.stop();
  }, [inView, to, duration, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
