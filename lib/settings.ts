import { z } from "zod";
import { db } from "./schema";
import { isTime, toMinutes } from "./datetime";

export type Interval = { start: string; end: string };

export interface ClinicSettings {
  /** Horários por dia da semana (0 = domingo … 6 = sábado). */
  schedule: Record<string, Interval[]>;
  /** De quantos em quantos minutos os horários são oferecidos. */
  slotStepMin: number;
  /** Antecedência mínima para agendar online, em horas. */
  minNoticeHours: number;
  /** Até quantos dias à frente o paciente pode agendar. */
  maxAdvanceDays: number;
  /** true = agendamento já nasce confirmado; false = a Dra. confirma. */
  autoConfirm: boolean;
  /** O paciente pode remarcar/cancelar online até X horas antes. */
  cancelLimitHours: number;
  /** Bloqueia automaticamente os feriados nacionais. */
  blockHolidays: boolean;
  /** Máximo de consultas futuras ativas por telefone. */
  maxActivePerPhone: number;
  /** Chave geral: desliga o agendamento online. */
  bookingEnabled: boolean;
  /** Aviso exibido na página de agendamento (ex.: "Férias de 10 a 20/jan"). */
  notice: string;
}

export const DEFAULT_SETTINGS: ClinicSettings = {
  schedule: {
    "0": [],
    "1": [
      { start: "08:00", end: "12:00" },
      { start: "13:30", end: "17:30" },
    ],
    "2": [
      { start: "08:00", end: "12:00" },
      { start: "13:30", end: "17:30" },
    ],
    "3": [
      { start: "08:00", end: "12:00" },
      { start: "13:30", end: "17:30" },
    ],
    "4": [
      { start: "08:00", end: "12:00" },
      { start: "13:30", end: "17:30" },
    ],
    "5": [
      { start: "08:00", end: "12:00" },
      { start: "13:30", end: "17:30" },
    ],
    "6": [],
  },
  slotStepMin: 30,
  minNoticeHours: 3,
  maxAdvanceDays: 60,
  autoConfirm: true,
  cancelLimitHours: 12,
  blockHolidays: true,
  maxActivePerPhone: 3,
  bookingEnabled: true,
  notice: "",
};

const timeStr = z.string().refine(isTime, "Horário inválido");

const intervalSchema = z
  .object({ start: timeStr, end: timeStr })
  .refine((i) => toMinutes(i.end) > toMinutes(i.start), "O fim deve ser depois do início");

export const settingsSchema = z.object({
  schedule: z
    .record(z.string().regex(/^[0-6]$/), z.array(intervalSchema).max(6))
    .refine((s) => Object.keys(s).length === 7, "Informe os 7 dias da semana"),
  slotStepMin: z.number().int().min(10).max(120),
  minNoticeHours: z.number().int().min(0).max(168),
  maxAdvanceDays: z.number().int().min(1).max(365),
  autoConfirm: z.boolean(),
  cancelLimitHours: z.number().int().min(0).max(168),
  blockHolidays: z.boolean(),
  maxActivePerPhone: z.number().int().min(1).max(20),
  bookingEnabled: z.boolean(),
  notice: z.string().max(300),
});

/** Garante que os intervalos de cada dia estejam ordenados e sem sobreposição. */
export function normalizeSchedule(
  schedule: Record<string, Interval[]>,
): Record<string, Interval[]> {
  const out: Record<string, Interval[]> = {};
  for (let d = 0; d < 7; d++) {
    const list = [...(schedule[String(d)] ?? [])].sort(
      (a, b) => toMinutes(a.start) - toMinutes(b.start),
    );
    const merged: Interval[] = [];
    for (const it of list) {
      const last = merged[merged.length - 1];
      if (last && toMinutes(it.start) <= toMinutes(last.end)) {
        if (toMinutes(it.end) > toMinutes(last.end)) last.end = it.end;
      } else {
        merged.push({ ...it });
      }
    }
    out[String(d)] = merged;
  }
  return out;
}

export async function getSettings(): Promise<ClinicSettings> {
  const conn = await db();
  const rows = await conn.query<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'clinic'`,
  );
  if (!rows.length) return DEFAULT_SETTINGS;
  try {
    const saved = JSON.parse(rows[0].value) as Partial<ClinicSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      schedule: { ...DEFAULT_SETTINGS.schedule, ...(saved.schedule ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: ClinicSettings): Promise<ClinicSettings> {
  const clean: ClinicSettings = { ...next, schedule: normalizeSchedule(next.schedule) };
  const conn = await db();
  await conn.run(
    `INSERT INTO settings (key, value) VALUES ('clinic', ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    [JSON.stringify(clean)],
  );
  return clean;
}
