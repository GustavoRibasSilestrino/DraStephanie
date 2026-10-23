import { db } from "./schema";
import {
  addDays,
  diffDays,
  eachDay,
  fromMinutes,
  monthRange,
  nowSP,
  toMinutes,
  weekday,
} from "./datetime";
import { holidayName } from "./holidays";
import { getSettings, type ClinicSettings } from "./settings";

/** Granularidade da ocupação: cada consulta ocupa N blocos de 15 min. */
export const UNIT = 15;

export interface Block {
  id: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string | null;
  timeEnd: string | null;
  reason: string;
}

export interface DayContext {
  settings: ClinicSettings;
  /** Blocos ocupados: "YYYY-MM-DD|HH:MM" */
  occupied: Set<string>;
  blocks: Block[];
  now: { date: string; minutes: number };
}

export const unitKey = (date: string, minutes: number) => `${date}|${fromMinutes(minutes)}`;

/** Blocos de 15 min que uma consulta ocupa ("HH:MM" de início de cada bloco). */
export function unitsFor(startTime: string, durationMin: number): string[] {
  const start = toMinutes(startTime);
  const n = Math.ceil(durationMin / UNIT);
  return Array.from({ length: n }, (_, i) => fromMinutes(start + i * UNIT));
}

function blockedByRule(date: string, start: number, end: number, blocks: Block[]): boolean {
  for (const b of blocks) {
    if (date < b.dateStart || date > b.dateEnd) continue;
    if (!b.timeStart || !b.timeEnd) return true; // dia inteiro
    if (start < toMinutes(b.timeEnd) && end > toMinutes(b.timeStart)) return true;
  }
  return false;
}

/**
 * Horários livres de um dia para um serviço com a duração informada.
 * Função pura: recebe tudo de que precisa em `ctx` (fácil de testar).
 */
export function slotsForDay(date: string, durationMin: number, ctx: DayContext): string[] {
  const { settings, occupied, blocks, now } = ctx;

  if (!settings.bookingEnabled) return [];
  if (date < now.date) return [];
  if (diffDays(now.date, date) > settings.maxAdvanceDays) return [];
  if (settings.blockHolidays && holidayName(date)) return [];

  const intervals = settings.schedule[String(weekday(date))] ?? [];
  const step = settings.slotStepMin;
  const minNotice = settings.minNoticeHours * 60;
  const out: string[] = [];

  for (const iv of intervals) {
    const ivStart = toMinutes(iv.start);
    const ivEnd = toMinutes(iv.end);
    for (let t = ivStart; t + durationMin <= ivEnd; t += step) {
      // antecedência mínima, contada em minutos corridos a partir de agora
      const ahead = diffDays(now.date, date) * 1440 + t - now.minutes;
      if (ahead < minNotice) continue;
      if (blockedByRule(date, t, t + durationMin, blocks)) continue;

      let free = true;
      for (let u = t; u < t + durationMin; u += UNIT) {
        if (occupied.has(unitKey(date, u))) {
          free = false;
          break;
        }
      }
      if (free) out.push(fromMinutes(t));
    }
  }
  return out;
}

export async function loadBlocks(from: string, to: string): Promise<Block[]> {
  const conn = await db();
  const rows = await conn.query<{
    id: string;
    date_start: string;
    date_end: string;
    time_start: string | null;
    time_end: string | null;
    reason: string;
  }>(
    `SELECT id, date_start, date_end, time_start, time_end, reason
       FROM blocks WHERE date_end >= ? AND date_start <= ? ORDER BY date_start`,
    [from, to],
  );
  return rows.map((r) => ({
    id: r.id,
    dateStart: r.date_start,
    dateEnd: r.date_end,
    timeStart: r.time_start,
    timeEnd: r.time_end,
    reason: r.reason,
  }));
}

export async function loadOccupied(from: string, to: string): Promise<Set<string>> {
  const conn = await db();
  const rows = await conn.query<{ date: string; slot: string }>(
    `SELECT date, slot FROM appointment_slots WHERE date >= ? AND date <= ?`,
    [from, to],
  );
  return new Set(rows.map((r) => `${r.date}|${r.slot}`));
}

export async function loadContext(from: string, to: string): Promise<DayContext> {
  const [settings, occupied, blocks] = await Promise.all([
    getSettings(),
    loadOccupied(from, to),
    loadBlocks(from, to),
  ]);
  return { settings, occupied, blocks, now: nowSP() };
}

export async function availableSlots(date: string, durationMin: number): Promise<string[]> {
  const ctx = await loadContext(date, date);
  return slotsForDay(date, durationMin, ctx);
}

/** Quantidade de horários livres por dia do mês (para pintar o calendário). */
export async function monthAvailability(
  month: string,
  durationMin: number,
): Promise<Record<string, number>> {
  const { first, last } = monthRange(month);
  const ctx = await loadContext(first, last);
  const out: Record<string, number> = {};
  for (const d of eachDay(first, last)) {
    out[d] = slotsForDay(d, durationMin, ctx).length;
  }
  return out;
}

/** Primeiro horário livre a partir de hoje (para o destaque da página inicial). */
export async function nextFreeSlot(
  durationMin: number,
): Promise<{ date: string; time: string } | null> {
  const now = nowSP();
  const to = addDays(now.date, 45);
  const ctx = await loadContext(now.date, to);
  for (const d of eachDay(now.date, to)) {
    const slots = slotsForDay(d, durationMin, ctx);
    if (slots.length) return { date: d, time: slots[0] };
  }
  return null;
}
