/**
 * Datas como texto: "YYYY-MM-DD" e horas como "HH:MM", sempre no horário de
 * Brasília. Nunca guardamos instantes UTC para a agenda — a clínica pensa em
 * "terça às 14:30", e isso não pode mudar com o fuso do servidor.
 */

export const TZ = "America/Sao_Paulo";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isDate(v: unknown): v is string {
  if (typeof v !== "string" || !DATE_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

export function isTime(v: unknown): v is string {
  return typeof v === "string" && TIME_RE.test(v);
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Hoje e agora em Brasília (independente do fuso do servidor). */
export function nowSP(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function today(): string {
  return nowSP().date;
}

function utc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(dt: Date): string {
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function addDays(date: string, n: number): string {
  const dt = utc(date);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmt(dt);
}

/** 0 = domingo … 6 = sábado */
export function weekday(date: string): number {
  return utc(date).getUTCDay();
}

export function diffDays(a: string, b: string): number {
  return Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function isMonth(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

export function monthRange(month: string): { first: string; last: string } {
  const [y, m] = month.split("-").map(Number);
  const first = `${month}-01`;
  const last = fmt(new Date(Date.UTC(y, m, 0)));
  return { first, last };
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Instante UTC correspondente a "data + hora" em Brasília (UTC-3, sem horário de verão). */
export function toInstant(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
}

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];
const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const weekdayName = (n: number) => WEEKDAYS[n];
export const weekdayShort = (n: number) => WEEKDAYS_SHORT[n];
export const monthName = (n: number) => MONTHS[n];

/** "terça-feira, 14 de outubro" */
export function longDate(date: string, withYear = false): string {
  const [y, m, d] = date.split("-").map(Number);
  const base = `${WEEKDAYS[weekday(date)]}, ${d} de ${MONTHS[m - 1]}`;
  return withYear ? `${base} de ${y}` : base;
}

/** "ter, 14/10" */
export function shortDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${WEEKDAYS_SHORT[weekday(date)]}, ${d}/${m}`;
}

/** "14/10/2026" */
export function brDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** "outubro de 2026" */
export function monthTitle(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} de ${y}`;
}
