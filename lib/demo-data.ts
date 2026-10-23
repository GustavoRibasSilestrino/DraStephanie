import { randomUUID } from "node:crypto";
import { db } from "./schema";
import type { Tx } from "./db";
import { unitsFor } from "./availability";
import { addDays, fromMinutes, nowSP, toMinutes, weekday } from "./datetime";
import { holidayName } from "./holidays";
import { newCode, normName, listServices } from "./appointments";
import { getSettings } from "./settings";

/**
 * Dados FICTÍCIOS para demonstrar o painel. Pacientes com nomes inventados e
 * telefones no padrão (15) 90000-00xx; consultas marcadas com source = 'demo'
 * (o painel as identifica). Regenerar apaga os anteriores e recria em torno
 * de "hoje", então a agenda sempre parece viva.
 */

const PATIENTS = [
  "Marina Alves Costa",
  "Rafael Mendes Silva",
  "Juliana Ferreira",
  "Carlos Eduardo Lima",
  "Beatriz Souza Oliveira",
  "Thiago Martins",
  "Camila Rocha",
  "Fernando Dias",
  "Larissa Nogueira",
  "Paulo Henrique Barros",
  "Aline Cardoso",
  "Rodrigo Teixeira",
  "Patrícia Gomes",
  "Gabriel Pereira",
  "Renata Azevedo",
  "Lucas Ribeiro",
  "Mariana Campos",
  "Eduardo Santana",
];

const PHONE_PREFIX = "55159000000";
const phoneOf = (i: number) => `${PHONE_PREFIX}${String(i + 1).padStart(2, "0")}`;

const NOTES = [
  "Relata sensibilidade ao frio no dente 36.",
  "Prefere horários no início da manhã.",
  "Fez radiografia periapical — enviar laudo.",
  "Retorno em 15 dias para controle.",
  "Alergia a dipirona — evitar prescrição.",
  "Interesse em clareamento após o canal.",
  "",
  "",
  "",
];

/** Gerador pseudoaleatório determinístico (a demo é sempre parecida). */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function clearDemo(tx?: Tx) {
  const run = async (t: Tx) => {
    await t.run(
      `DELETE FROM appointment_slots WHERE appointment_id IN
         (SELECT id FROM appointments WHERE source = 'demo')`,
    );
    await t.run(`DELETE FROM appointments WHERE source = 'demo'`);
    await t.run(
      `DELETE FROM patients WHERE phone LIKE ?
         AND id NOT IN (SELECT patient_id FROM appointments)`,
      [`${PHONE_PREFIX}%`],
    );
  };
  if (tx) return run(tx);
  const conn = await db();
  return conn.transaction(run);
}

export async function seedDemo(): Promise<{ appointments: number; patients: number }> {
  const [conn, services, settings] = await Promise.all([db(), listServices(true), getSettings()]);
  if (!services.length) return { appointments: 0, patients: 0 };

  const rng = mulberry32(20260901);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)];
  const weighted = [
    ...services.filter((s) => s.slug === "avaliacao"),
    ...services.filter((s) => s.slug === "avaliacao"),
    ...services.filter((s) => s.slug === "canal"),
    ...services.filter((s) => s.slug === "canal"),
    ...services.filter((s) => s.slug === "protese"),
    ...services.filter((s) => s.slug === "implante"),
    ...services.filter((s) => s.slug === "clareamento"),
    ...services.filter((s) => s.slug === "limpeza"),
    ...services.filter((s) => s.slug === "retorno"),
    ...services.filter((s) => s.slug === "retorno"),
    ...services.filter((s) => s.slug === "urgencia"),
    ...services.filter((s) => s.slug === "alinhadores"),
  ];
  const pool = weighted.length ? weighted : services;

  const now = nowSP();
  let appointments = 0;

  await conn.transaction(async (tx) => {
    await clearDemo(tx);

    const patientIds: string[] = [];
    const createdAt = new Date().toISOString();
    for (let i = 0; i < PATIENTS.length; i++) {
      const id = randomUUID();
      patientIds.push(id);
      await tx.run(
        `INSERT INTO patients (id, key, name, name_norm, phone, email, birth_date, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
        [
          id,
          `${phoneOf(i)}|${normName(PATIENTS[i])}`,
          PATIENTS[i],
          normName(PATIENTS[i]),
          phoneOf(i),
          i % 3 === 0 ? `${normName(PATIENTS[i]).split(" ")[0]}@exemplo.com` : null,
          pick(NOTES),
          createdAt,
        ],
      );
    }

    for (let offset = -21; offset <= 21; offset++) {
      const date = addDays(now.date, offset);
      const intervals = settings.schedule[String(weekday(date))] ?? [];
      if (!intervals.length || (settings.blockHolidays && holidayName(date))) continue;

      const isPast = offset < 0;
      const isToday = offset === 0;
      const target = isPast
        ? 2 + Math.floor(rng() * 3)
        : isToday
          ? 4
          : Math.max(1, 4 - Math.floor(offset / 6) + Math.floor(rng() * 2));

      const taken = new Set<string>();
      for (let n = 0; n < target; n++) {
        const service = pick(pool);
        const candidates: number[] = [];
        for (const iv of intervals) {
          for (
            let t = toMinutes(iv.start);
            t + service.durationMin <= toMinutes(iv.end);
            t += settings.slotStepMin
          ) {
            const free = unitsFor(fromMinutes(t), service.durationMin).every((u) => !taken.has(u));
            if (free) candidates.push(t);
          }
        }
        if (!candidates.length) continue;
        const start = pick(candidates);
        const units = unitsFor(fromMinutes(start), service.durationMin);
        units.forEach((u) => taken.add(u));

        const roll = rng();
        let status: string;
        if (isPast) status = roll < 0.86 ? "completed" : roll < 0.93 ? "no_show" : "cancelled";
        else if (isToday)
          status =
            start + service.durationMin <= now.minutes
              ? "completed"
              : roll < 0.8
                ? "confirmed"
                : "pending";
        else status = roll < 0.78 ? "confirmed" : roll < 0.92 ? "pending" : "cancelled";

        const id = randomUUID();
        const idx = Math.floor(rng() * PATIENTS.length);
        const convenio = rng() < 0.25;
        const stamp = new Date().toISOString();
        await tx.run(
          `INSERT INTO appointments
             (id, code, patient_id, service_id, service_name, date, start_time, end_time, status,
              payment_type, insurance, notes, internal_notes, source, cancel_reason, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 'demo', ?, ?, ?)`,
          [
            id,
            newCode(),
            patientIds[idx],
            service.id,
            service.name,
            date,
            fromMinutes(start),
            fromMinutes(start + service.durationMin),
            status,
            convenio ? "convenio" : "particular",
            convenio ? pick(["Amil Dental", "Bradesco Dental", "Odontoprev", "Interodonto"]) : null,
            isPast && status === "completed" ? pick(NOTES) : "",
            status === "cancelled" ? "Paciente: imprevisto" : null,
            stamp,
            stamp,
          ],
        );
        if (status !== "cancelled") {
          for (const slot of units) {
            await tx.run(
              `INSERT INTO appointment_slots (date, slot, appointment_id) VALUES (?, ?, ?)`,
              [date, slot, id],
            );
          }
        }
        appointments++;
      }
    }
  });

  return { appointments, patients: PATIENTS.length };
}

