import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./schema";
import type { Param } from "./db";
import { addDays, isDate, isTime, monthRange, toMinutes, today } from "./datetime";
import { loadBlocks, type Block } from "./availability";
import { listAppointments, normName, type AppointmentView, type Service } from "./appointments";

// ───────────────────────── dashboard ─────────────────────────

export interface DashboardData {
  today: string;
  todayAppointments: AppointmentView[];
  upcoming: AppointmentView[];
  pendingCount: number;
  weekCount: number;
  month: {
    key: string;
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    upcoming: number;
    newPatients: number;
    topServices: { name: string; count: number }[];
  };
  patientsTotal: number;
}

export async function getDashboard(): Promise<DashboardData> {
  const conn = await db();
  const t = today();
  const monthKey = t.slice(0, 7);
  const { first, last } = monthRange(monthKey);

  const [todayAppointments, upcoming, pending, week, byStatus, top, patients, newPatients] =
    await Promise.all([
      listAppointments({ from: t, to: t, status: "active" }),
      listAppointments({ from: addDays(t, 1), to: addDays(t, 30), status: "active", limit: 6 }),
      conn.query<{ n: number }>(
        `SELECT CAST(COUNT(*) AS INTEGER) AS n FROM appointments WHERE status = 'pending' AND date >= ?`,
        [t],
      ),
      conn.query<{ n: number }>(
        `SELECT CAST(COUNT(*) AS INTEGER) AS n FROM appointments
          WHERE status IN ('pending','confirmed') AND date >= ? AND date <= ?`,
        [t, addDays(t, 6)],
      ),
      conn.query<{ status: string; n: number }>(
        `SELECT status, CAST(COUNT(*) AS INTEGER) AS n FROM appointments
          WHERE date >= ? AND date <= ? GROUP BY status`,
        [first, last],
      ),
      conn.query<{ service_name: string; n: number }>(
        `SELECT service_name, CAST(COUNT(*) AS INTEGER) AS n FROM appointments
          WHERE date >= ? AND date <= ? AND status <> 'cancelled'
          GROUP BY service_name ORDER BY n DESC LIMIT 5`,
        [first, last],
      ),
      conn.query<{ n: number }>(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM patients`),
      conn.query<{ n: number }>(
        `SELECT CAST(COUNT(*) AS INTEGER) AS n FROM patients WHERE created_at >= ?`,
        [`${first}T00:00:00`],
      ),
    ]);

  const count = (s: string) => Number(byStatus.find((r) => r.status === s)?.n ?? 0);
  return {
    today: t,
    todayAppointments,
    upcoming,
    pendingCount: Number(pending[0]?.n ?? 0),
    weekCount: Number(week[0]?.n ?? 0),
    month: {
      key: monthKey,
      total: byStatus.reduce((acc, r) => acc + Number(r.n), 0),
      completed: count("completed"),
      cancelled: count("cancelled"),
      noShow: count("no_show"),
      upcoming: count("pending") + count("confirmed"),
      newPatients: Number(newPatients[0]?.n ?? 0),
      topServices: top.map((r) => ({ name: r.service_name, count: Number(r.n) })),
    },
    patientsTotal: Number(patients[0]?.n ?? 0),
  };
}

/** Quantidade de consultas (não canceladas) por dia — para a agenda. */
export async function appointmentCountsByDay(
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const conn = await db();
  const rows = await conn.query<{ date: string; n: number }>(
    `SELECT date, CAST(COUNT(*) AS INTEGER) AS n FROM appointments
      WHERE date >= ? AND date <= ? AND status <> 'cancelled' GROUP BY date`,
    [from, to],
  );
  return Object.fromEntries(rows.map((r) => [r.date, Number(r.n)]));
}

// ───────────────────────── pacientes ─────────────────────────

export interface PatientSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  notes: string;
  createdAt: string;
  total: number;
  lastDate: string | null;
  nextDate: string | null;
}

export async function listPatients(q?: string): Promise<PatientSummary[]> {
  const conn = await db();
  const params: Param[] = [today()];
  let where = "";
  if (q?.trim()) {
    const digits = q.replace(/\D/g, "");
    const parts = ["p.name_norm LIKE ?"];
    params.push(`%${normName(q)}%`);
    if (digits.length >= 3) {
      parts.push("p.phone LIKE ?");
      params.push(`%${digits}%`);
    }
    where = `WHERE ${parts.join(" OR ")}`;
  }
  const rows = await conn.query<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    birth_date: string | null;
    notes: string;
    created_at: string;
    total: number;
    last_date: string | null;
    next_date: string | null;
  }>(
    `SELECT p.id, p.name, p.phone, p.email, p.birth_date, p.notes, p.created_at,
            CAST(COUNT(a.id) AS INTEGER) AS total,
            MAX(CASE WHEN a.status IN ('completed') THEN a.date END) AS last_date,
            MIN(CASE WHEN a.date >= ? AND a.status IN ('pending','confirmed') THEN a.date END) AS next_date
       FROM patients p LEFT JOIN appointments a ON a.patient_id = p.id
       ${where}
      GROUP BY p.id
      ORDER BY p.name_norm
      LIMIT 300`,
    params,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    birthDate: r.birth_date,
    notes: r.notes,
    createdAt: r.created_at,
    total: Number(r.total),
    lastDate: r.last_date,
    nextDate: r.next_date,
  }));
}

export const patientPatchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.union([z.literal(""), z.string().trim().email().max(160)]).optional(),
  birthDate: z.union([z.literal(""), z.string().refine(isDate)]).optional(),
  notes: z.string().max(2000).optional(),
});

export async function updatePatient(id: string, patch: z.infer<typeof patientPatchSchema>) {
  const sets: string[] = [];
  const params: Param[] = [];
  if (patch.name !== undefined) {
    sets.push("name = ?", "name_norm = ?");
    params.push(patch.name, normName(patch.name));
  }
  if (patch.email !== undefined) {
    sets.push("email = ?");
    params.push(patch.email || null);
  }
  if (patch.birthDate !== undefined) {
    sets.push("birth_date = ?");
    params.push(patch.birthDate || null);
  }
  if (patch.notes !== undefined) {
    sets.push("notes = ?");
    params.push(patch.notes);
  }
  if (!sets.length) return;
  params.push(id);
  const conn = await db();
  await conn.run(`UPDATE patients SET ${sets.join(", ")} WHERE id = ?`, params);
}

// ───────────────────────── serviços ─────────────────────────

export const serviceSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(300).default(""),
  durationMin: z.number().int().min(15).max(480).multipleOf(15),
  icon: z.string().trim().max(24).default("tooth"),
  active: z.boolean().default(true),
});

export function slugify(s: string): string {
  return (
    normName(s)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "servico"
  );
}

export async function createService(input: z.infer<typeof serviceSchema>): Promise<Service> {
  const conn = await db();
  const base = slugify(input.name);
  let slug = base;
  for (let i = 2; ; i++) {
    const taken = await conn.query(`SELECT 1 AS x FROM services WHERE slug = ?`, [slug]);
    if (!taken.length) break;
    slug = `${base}-${i}`;
  }
  const [{ m }] = await conn.query<{ m: number | null }>(`SELECT MAX(sort) AS m FROM services`);
  const id = randomUUID();
  await conn.run(
    `INSERT INTO services (id, slug, name, description, duration_min, icon, active, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, slug, input.name, input.description, input.durationMin, input.icon, input.active ? 1 : 0, Number(m ?? 0) + 1],
  );
  return {
    id,
    slug,
    name: input.name,
    description: input.description,
    durationMin: input.durationMin,
    icon: input.icon,
    active: input.active,
    sort: Number(m ?? 0) + 1,
  };
}

export async function updateService(id: string, input: Partial<z.infer<typeof serviceSchema>>) {
  const sets: string[] = [];
  const params: Param[] = [];
  const add = (column: string, value: Param) => {
    sets.push(`${column} = ?`);
    params.push(value);
  };
  if (input.name !== undefined) add("name", input.name);
  if (input.description !== undefined) add("description", input.description);
  if (input.durationMin !== undefined) add("duration_min", input.durationMin);
  if (input.icon !== undefined) add("icon", input.icon);
  if (input.active !== undefined) add("active", input.active ? 1 : 0);
  if (!sets.length) return;
  params.push(id);
  const conn = await db();
  await conn.run(`UPDATE services SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteService(id: string) {
  const conn = await db();
  await conn.run(`DELETE FROM services WHERE id = ?`, [id]);
}

// ───────────────────────── bloqueios ─────────────────────────

export const blockSchema = z
  .object({
    dateStart: z.string().refine(isDate),
    dateEnd: z.string().refine(isDate),
    timeStart: z.union([z.string().refine(isTime), z.null()]).optional(),
    timeEnd: z.union([z.string().refine(isTime), z.null()]).optional(),
    reason: z.string().trim().max(120).default(""),
  })
  .refine((b) => b.dateEnd >= b.dateStart, { message: "A data final deve ser depois da inicial" })
  .refine((b) => (b.timeStart == null) === (b.timeEnd == null), {
    message: "Informe início e fim do horário",
  })
  .refine(
    (b) => b.timeStart == null || b.timeEnd == null || toMinutes(b.timeEnd) > toMinutes(b.timeStart),
    { message: "O horário final deve ser depois do inicial" },
  );

export async function listBlocks(): Promise<Block[]> {
  return loadBlocks(today(), addDays(today(), 730));
}

export async function createBlock(input: z.infer<typeof blockSchema>): Promise<Block> {
  const conn = await db();
  const id = randomUUID();
  await conn.run(
    `INSERT INTO blocks (id, date_start, date_end, time_start, time_end, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.dateStart,
      input.dateEnd,
      input.timeStart ?? null,
      input.timeEnd ?? null,
      input.reason,
      new Date().toISOString(),
    ],
  );
  return {
    id,
    dateStart: input.dateStart,
    dateEnd: input.dateEnd,
    timeStart: input.timeStart ?? null,
    timeEnd: input.timeEnd ?? null,
    reason: input.reason,
  };
}

export async function deleteBlock(id: string) {
  const conn = await db();
  await conn.run(`DELETE FROM blocks WHERE id = ?`, [id]);
}
