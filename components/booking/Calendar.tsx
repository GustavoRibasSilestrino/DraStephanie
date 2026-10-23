"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { addMonths, monthRange, monthTitle, today, weekday } from "@/lib/datetime";

const WD = ["D", "S", "T", "Q", "Q", "S", "S"];

export interface CalendarProps {
  month: string;
  onMonthChange: (m: string) => void;
  /** dia → nº de horários livres; null = carregando */
  availability: Record<string, number> | null;
  selected: string | null;
  onSelect: (date: string) => void;
  minMonth?: string;
  maxMonth?: string;
  /** identifica a "pílula" para não conflitar quando há dois calendários */
  id?: string;
}

export default function Calendar({
  month,
  onMonthChange,
  availability,
  selected,
  onSelect,
  minMonth,
  maxMonth,
  id = "cal",
}: CalendarProps) {
  const [dir, setDir] = useState(1);
  const todayStr = today();
  const { first, last } = monthRange(month);
  const lead = weekday(first);
  const days = Number(last.slice(8));

  const canPrev = !minMonth || month > minMonth;
  const canNext = !maxMonth || month < maxMonth;

  const go = (n: number) => {
    setDir(n);
    onMonthChange(addMonths(month, n));
  };

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={!canPrev}
          aria-label="Mês anterior"
          className="grid h-11 w-11 place-items-center rounded-full border border-navy-900/15 text-navy-900 transition-all hover:border-gold-500 hover:bg-gold-400/10 disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <div className="relative h-8 w-52 overflow-hidden text-center">
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.h3
              key={month}
              custom={dir}
              initial={{ y: dir * 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -dir * 22, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 font-display text-[1.15rem] font-medium first-letter:uppercase leading-8 text-navy-900"
            >
              {monthTitle(month)}
            </motion.h3>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={!canNext}
          aria-label="Próximo mês"
          className="grid h-11 w-11 place-items-center rounded-full border border-navy-900/15 text-navy-900 transition-all hover:border-gold-500 hover:bg-gold-400/10 disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[0.72rem] font-medium uppercase tracking-[0.18em] text-gold-600" aria-hidden>
        {WD.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <LayoutGroup id={id}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={month}
            initial={{ opacity: 0, x: dir * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -dir * 28 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 gap-1"
            role="grid"
            aria-label={monthTitle(month)}
          >
            {Array.from({ length: lead }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1;
              const date = `${month}-${String(d).padStart(2, "0")}`;
              const count = availability?.[date] ?? 0;
              const loading = availability === null;
              const past = date < todayStr;
              const enabled = !loading && !past && count > 0;
              const isSel = selected === date;
              const isToday = date === todayStr;
              return (
                <button
                  key={date}
                  type="button"
                  role="gridcell"
                  disabled={!enabled}
                  aria-selected={isSel}
                  aria-label={`${d} de ${monthTitle(month)}${enabled ? `, ${count} horários livres` : ", indisponível"}`}
                  onClick={() => onSelect(date)}
                  className={`group relative grid aspect-square place-items-center rounded-full text-[1rem] transition-colors duration-300 ${
                    enabled
                      ? isSel
                        ? "font-semibold text-navy-950"
                        : "font-medium text-navy-900 hover:bg-gold-400/15"
                      : "cursor-default text-navy-900/25"
                  } ${loading ? "animate-pulse" : ""}`}
                >
                  {isSel && (
                    <motion.span
                      layoutId="day-pill"
                      className="absolute inset-0.5 rounded-full bg-[linear-gradient(135deg,#ecd8a4,#d2ab62_55%,#b48a45)] shadow-[0_8px_22px_-8px_rgba(195,154,85,0.9)]"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  {isToday && !isSel && (
                    <span className="absolute inset-1 rounded-full border border-gold-500/60" aria-hidden />
                  )}
                  <span className="relative">{d}</span>
                  {enabled && !isSel && (
                    <span
                      aria-hidden
                      className="absolute bottom-1.5 h-1 w-1 rounded-full bg-gold-500 transition-transform duration-300 group-hover:scale-150"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>

      <div className="mt-4 flex items-center gap-5 text-[0.78rem] text-muted">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> com horários livres
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-gold-500/60" /> hoje
        </span>
      </div>
    </div>
  );
}

export function TimeSlots({
  times,
  selected,
  onSelect,
}: {
  times: string[] | null;
  selected: string | null;
  onSelect: (t: string) => void;
}) {
  if (times === null) {
    return (
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-navy-900/5" />
        ))}
      </div>
    );
  }
  if (!times.length) {
    return (
      <p className="rounded-2xl bg-ivory-100 px-5 py-6 text-center text-[0.98rem] text-muted">
        Não há horários livres neste dia. Escolha outra data no calendário.
      </p>
    );
  }
  const groups = [
    { label: "Manhã", items: times.filter((t) => t < "12:00") },
    { label: "Tarde", items: times.filter((t) => t >= "12:00") },
  ].filter((g) => g.items.length);

  let n = 0;
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.24em] text-gold-600">{g.label}</p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {g.items.map((t) => {
              const active = t === selected;
              const i = n++;
              return (
                <motion.button
                  key={t}
                  type="button"
                  onClick={() => onSelect(t)}
                  aria-pressed={active}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-12 rounded-xl border text-[1rem] font-medium tabular-nums transition-all duration-300 ${
                    active
                      ? "border-transparent bg-[linear-gradient(135deg,#ecd8a4,#d2ab62_55%,#b48a45)] text-navy-950 shadow-[0_10px_26px_-10px_rgba(195,154,85,0.9)]"
                      : "border-navy-900/15 bg-white text-navy-900 hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-400/10"
                  }`}
                >
                  {t}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
