import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./schema";
import { isUniqueViolation, type Param, type Tx } from "./db";
import {
  fromMinutes,
  isDate,
  isTime,
  nowSP,
  toInstant,
  toMinutes,
  today,
} from "./datetime";
import {
  loadContext,
  slotsForDay,
  unitsFor,
  unitKey,
} from "./availability";
import { getSettings } from "./settings";

export type Status = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
/** Estados em que o paciente ainda "vai comparecer". */
export const ACTIVE_STATUSES: Status[] = ["pending", "confirmed"];

export const STATUS_LABEL: Record<Status, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Faltou",
};

export type BookingErrorCode =
  | "slot_taken"
  | "unavailable"
  | "invalid"
  | "limit"
  | "not_found"
  | "forbidden"
  | "disabled";

export class BookingError extends Error {
  constructor(
    public code: BookingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  icon: string;
  active: boolean;
  sort: number;
}

export interface AppointmentView {
  id: string;
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  status: Status;
  serviceId: string;
  serviceName: string;
  paymentType: "particular" | "convenio";
  insurance: string | null;
  notes: string;
  internalNotes: string;
  source: string;
  cancelReason: string | null;
  createdAt: string;
  patient: { id: string; name: string; phone: string; email: string | null };
}

// ───────────────────────── helpers ─────────────────────────

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Telefone brasileiro → "55" + DDD + número (somente dígitos) ou null. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  d = d.replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (!/^55\d{10,11}$/.test(d)) return null;
  const ddd = Number(d.slice(2, 4));
  if (ddd < 11 || ddd > 99) return null;
  if (d.length === 13 && d[4] !== "9") return null; // celular tem 9 na frente
  return d;
}

export function normName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(name: string): string {
  const small = new Set(["da", "de", "do", "das", "dos", "e"]);
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w, i) =>
      i > 0 && small.has(w.toLowerCase())
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

const SELECT_APPOINTMENT = `
  SELECT a.id, a.code, a.date, a.start_time, a.end_time, a.status, a.service_id,
         a.service_name, a.payment_type, a.insurance, a.notes, a.internal_notes,
         a.source, a.cancel_reason, a.created_at,
         p.id AS patient_id, p.name AS patient_name, p.phone AS patient_phone,
         p.email AS patient_email
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id`;

type AppointmentRow = {
  id: string;
  code: string;
  date: string;
  start_time: string;
  end_time: string;
  status: Status;
  service_id: string;
  service_name: string;
  payment_type: "particular" | "convenio";
  insurance: string | null;
  notes: string;
  internal_notes: string;
  source: string;
  cancel_reason: string | null;
  created_at: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
};

export function toView(r: AppointmentRow): AppointmentView {
  return {
    id: r.id,
    code: r.code,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    status: r.status,
    serviceId: r.service_id,
    serviceName: r.service_name,
    paymentType: r.payment_type,
    insurance: r.insurance,
    notes: r.notes,
    internalNotes: r.internal_notes,
    source: r.source,
    cancelReason: r.cancel_reason,
    createdAt: r.created_at,
    patient: {
      id: r.patient_id,
      name: r.patient_name,
      phone: r.patient_phone,
      email: r.patient_email,
    },
  };
}

/** Versão para o paciente: sem anotações internas da Dra. nem ids. */
export function publicView(v: AppointmentView) {
  return {
    code: v.code,
    date: v.date,
    startTime: v.startTime,
    endTime: v.endTime,
    status: v.status,
    serviceId: v.serviceId,
    serviceName: v.serviceName,
    paymentType: v.paymentType,
    insurance: v.insurance,
    notes: v.notes,
    patientName: v.patient.name,
  };
}

// ───────────────────────── serviços ─────────────────────────

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_min: number;
  icon: string;
  active: number;
  sort: number;
};

const toService = (r: ServiceRow): Service => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  durationMin: r.duration_min,
  icon: r.icon,
  active: !!r.active,
  sort: r.sort,
});

export async function listServices(onlyActive = true): Promise<Service[]> {
  const conn = await db();
  const rows = await conn.query<ServiceRow>(
    `SELECT id, slug, name, description, duration_min, icon, active, sort
       FROM services ${onlyActive ? "WHERE active = 1" : ""} ORDER BY sort, name`,
  );
  return rows.map(toService);
}

export async function getService(idOrSlug: string): Promise<Service | null> {
  const conn = await db();
  const rows = await conn.query<ServiceRow>(
    `SELECT id, slug, name, description, duration_min, icon, active, sort
       FROM services WHERE id = ? OR slug = ?`,
    [idOrSlug, idOrSlug],
  );
  return rows[0] ? toService(rows[0]) : null;
}

// ───────────────────────── validação de entrada ─────────────────────────

const fullName = z
  .string()
  .trim()
  .min(3, "Informe seu nome completo")
  .max(120)
  .refine((n) => n.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome");

export const createSchema = z.object({
  serviceId: z.string().min(1).max(64),
  date: z.string().refine(isDate, "Data inválida"),
  time: z.string().refine(isTime, "Horário inválido"),
  name: fullName,
  phone: z.string().min(8, "Informe um WhatsApp válido").max(25),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido").max(160)]).optional(),
  paymentType: z.enum(["particular", "convenio"]),
  insurance: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(500).optional(),
  consent: z.literal(true, { error: "É necessário aceitar a política de privacidade" }),
  /** honeypot: humanos não preenchem */
  website: z.string().max(0).optional(),
});

export type CreateInput = z.infer<typeof createSchema>;

// ───────────────────────── leitura ─────────────────────────

export async function getAppointmentById(id: string): Promise<AppointmentView | null> {
  const conn = await db();
  const rows = await conn.query<AppointmentRow>(`${SELECT_APPOINTMENT} WHERE a.id = ?`, [id]);
  return rows[0] ? toView(rows[0]) : null;
}

/** O paciente só enxerga a consulta com o código E o telefone usado no agendamento. */
export async function getAppointmentByCode(
  code: string,
  phone: string,
): Promise<AppointmentView | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const conn = await db();
  const rows = await conn.query<AppointmentRow>(
    `${SELECT_APPOINTMENT} WHERE a.code = ? AND p.phone = ?`,
    [normalizeCode(code), normalized],
  );
  return rows[0] ? toView(rows[0]) : null;
}

export interface ListFilter {
  from?: string;
  to?: string;
  status?: Status | "active";
  q?: string;
  patientId?: string;
  limit?: number;
  order?: "asc" | "desc";
}

export async function listAppointments(f: ListFilter): Promise<AppointmentView[]> {
  const where: string[] = [];
  const params: Param[] = [];
  if (f.from) {
    where.push("a.date >= ?");
    params.push(f.from);
  }
  if (f.to) {
    where.push("a.date <= ?");
    params.push(f.to);
  }
  if (f.status === "active") where.push("a.status IN ('pending','confirmed')");
  else if (f.status) {
    where.push("a.status = ?");
    params.push(f.status);
  }
  if (f.patientId) {
    where.push("a.patient_id = ?");
    params.push(f.patientId);
  }
  if (f.q) {
    const q = normName(f.q);
    const digits = f.q.replace(/\D/g, "");
    const parts = ["p.name_norm LIKE ?", "LOWER(a.code) LIKE ?"];
    params.push(`%${q}%`, `%${f.q.toLowerCase().trim()}%`);
    if (digits.length >= 3) {
      parts.push("p.phone LIKE ?");
      params.push(`%${digits}%`);
    }
    where.push(`(${parts.join(" OR ")})`);
  }
  const dir = f.order === "desc" ? "DESC" : "ASC";
  const limit = Math.min(Math.max(f.limit ?? 500, 1), 1000);
  const conn = await db();
  const rows = await conn.query<AppointmentRow>(
    `${SELECT_APPOINTMENT}
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY a.date ${dir}, a.start_time ${dir}
      LIMIT ${limit}`,
    params,
  );
  return rows.map(toView);
}

// ───────────────────────── escrita ─────────────────────────

async function upsertPatient(
  tx: Tx,
  p: { name: string; phone: string; email?: string | null },
): Promise<string> {
  const key = `${p.phone}|${normName(p.name)}`;
  const found = await tx.query<{ id: string }>(`SELECT id FROM patients WHERE key = ?`, [key]);
  if (found.length) {
    if (p.email) await tx.run(`UPDATE patients SET email = ? WHERE id = ?`, [p.email, found[0].id]);
    return found[0].id;
  }
  const id = randomUUID();
  await tx.run(
    `INSERT INTO patients (id, key, name, name_norm, phone, email, birth_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, '', ?)`,
    [id, key, titleCase(p.name), normName(p.name), p.phone, p.email || null, new Date().toISOString()],
  );
  return id;
}

async function reserve(tx: Tx, date: string, units: string[], appointmentId: string) {
  for (const slot of units) {
    try {
      await tx.run(
        `INSERT INTO appointment_slots (date, slot, appointment_id) VALUES (?, ?, ?)`,
        [date, slot, appointmentId],
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new BookingError("slot_taken", "Esse horário acabou de ser reservado. Escolha outro.");
      }
      throw err;
    }
  }
}

export interface CreateOptions {
  source: "site" | "admin";
  /** Admin: ignora grade de horários, antecedência e bloqueios (encaixes). */
  force?: boolean;
  status?: Status;
}

export async function createAppointment(
  input: CreateInput,
  opts: CreateOptions,
): Promise<AppointmentView> {
  const service = await getService(input.serviceId);
  if (!service || !service.active) throw new BookingError("invalid", "Serviço indisponível.");

  const phone = normalizePhone(input.phone);
  if (!phone) throw new BookingError("invalid", "Informe um WhatsApp válido com DDD.");

  const settings = await getSettings();
  const end = toMinutes(input.time) + service.durationMin;
  if (end > 24 * 60) throw new BookingError("invalid", "Horário inválido.");

  if (!opts.force) {
    if (!settings.bookingEnabled) {
      throw new BookingError("disabled", "O agendamento online está temporariamente pausado.");
    }
    const ctx = await loadContext(input.date, input.date);
    if (!slotsForDay(input.date, service.durationMin, ctx).includes(input.time)) {
      throw new BookingError("unavailable", "Esse horário não está mais disponível. Escolha outro.");
    }
  } else if (input.date < today() && opts.source === "site") {
    throw new BookingError("invalid", "Data no passado.");
  }

  const status: Status =
    opts.status ?? (opts.source === "admin" || settings.autoConfirm ? "confirmed" : "pending");
  const units = unitsFor(input.time, service.durationMin);

  const attempt = async (): Promise<string> => {
    const conn = await db();
    return conn.transaction(async (tx) => {
      if (!opts.force) {
        const [{ n }] = await tx.query<{ n: number }>(
          `SELECT CAST(COUNT(*) AS INTEGER) AS n
             FROM appointments a JOIN patients p ON p.id = a.patient_id
            WHERE p.phone = ? AND a.status IN ('pending','confirmed') AND a.date >= ?`,
          [phone, today()],
        );
        if (Number(n) >= settings.maxActivePerPhone) {
          throw new BookingError(
            "limit",
            "Você já tem consultas agendadas. Para marcar outra, fale com a gente pelo WhatsApp.",
          );
        }
      }
      const patientId = await upsertPatient(tx, {
        name: input.name,
        phone,
        email: input.email || null,
      });
      const id = randomUUID();
      const now = new Date().toISOString();
      await reserve(tx, input.date, units, id);
      await tx.run(
        `INSERT INTO appointments
           (id, code, patient_id, service_id, service_name, date, start_time, end_time, status,
            payment_type, insurance, notes, internal_notes, source, cancel_reason, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, NULL, ?, ?)`,
        [
          id,
          newCode(),
          patientId,
          service.id,
          service.name,
          input.date,
          input.time,
          fromMinutes(end),
          status,
          input.paymentType,
          input.paymentType === "convenio" ? input.insurance || null : null,
          input.notes ?? "",
          opts.source,
          now,
          now,
        ],
      );
      return id;
    });
  };

  let id: string;
  try {
    id = await attempt();
  } catch (err) {
    // Colisão rara (mesmo paciente novo em duas abas, ou código repetido): uma nova tentativa resolve.
    if (!(err instanceof BookingError) && isUniqueViolation(err)) id = await attempt();
    else throw err;
  }
  const created = await getAppointmentById(id);
  if (!created) throw new Error("Falha ao gravar o agendamento.");
  return created;
}

/** O paciente pode mexer na consulta até `cancelLimitHours` antes. */
export async function patientCanModify(v: AppointmentView): Promise<boolean> {
  if (!ACTIVE_STATUSES.includes(v.status)) return false;
  const { cancelLimitHours } = await getSettings();
  const now = nowSP();
  const nowInstant = toInstant(now.date, fromMinutes(now.minutes));
  const hoursLeft = (toInstant(v.date, v.startTime).getTime() - nowInstant.getTime()) / 3_600_000;
  return hoursLeft >= cancelLimitHours;
}

export async function cancelAppointment(
  id: string,
  reason: string,
  by: "patient" | "admin",
): Promise<AppointmentView> {
  const current = await getAppointmentById(id);
  if (!current) throw new BookingError("not_found", "Agendamento não encontrado.");
  if (!ACTIVE_STATUSES.includes(current.status)) {
    throw new BookingError("forbidden", "Este agendamento não pode mais ser cancelado.");
  }
  if (by === "patient" && !(await patientCanModify(current))) {
    throw new BookingError(
      "forbidden",
      "O prazo para cancelar online já passou. Fale com a gente pelo WhatsApp.",
    );
  }
  const conn = await db();
  await conn.transaction(async (tx) => {
    await tx.run(`DELETE FROM appointment_slots WHERE appointment_id = ?`, [id]);
    await tx.run(
      `UPDATE appointments SET status = 'cancelled', cancel_reason = ?, updated_at = ? WHERE id = ?`,
      [
        `${by === "patient" ? "Paciente" : "Clínica"}${reason ? `: ${reason}` : ""}`.slice(0, 300),
        new Date().toISOString(),
        id,
      ],
    );
  });
  return (await getAppointmentById(id))!;
}

export async function rescheduleAppointment(
  id: string,
  date: string,
  time: string,
  opts: { by: "patient" | "admin" },
): Promise<AppointmentView> {
  if (!isDate(date) || !isTime(time)) throw new BookingError("invalid", "Data ou horário inválido.");
  const current = await getAppointmentById(id);
  if (!current) throw new BookingError("not_found", "Agendamento não encontrado.");
  if (!ACTIVE_STATUSES.includes(current.status)) {
    throw new BookingError("forbidden", "Este agendamento não pode mais ser remarcado.");
  }
  const service = await getService(current.serviceId);
  const duration =
    service?.durationMin ?? toMinutes(current.endTime) - toMinutes(current.startTime);
  if (toMinutes(time) + duration > 24 * 60) throw new BookingError("invalid", "Horário inválido.");

  if (opts.by === "patient") {
    if (!(await patientCanModify(current))) {
      throw new BookingError(
        "forbidden",
        "O prazo para remarcar online já passou. Fale com a gente pelo WhatsApp.",
      );
    }
    const ctx = await loadContext(date, date);
    // os horários da própria consulta voltam a ficar livres para ela mesma
    for (const u of unitsFor(current.startTime, duration)) ctx.occupied.delete(unitKey(current.date, toMinutes(u)));
    if (!slotsForDay(date, duration, ctx).includes(time)) {
      throw new BookingError("unavailable", "Esse horário não está disponível. Escolha outro.");
    }
  }

  const units = unitsFor(time, duration);
  const conn = await db();
  await conn.transaction(async (tx) => {
    await tx.run(`DELETE FROM appointment_slots WHERE appointment_id = ?`, [id]);
    await reserve(tx, date, units, id);
    await tx.run(
      `UPDATE appointments SET date = ?, start_time = ?, end_time = ?, updated_at = ? WHERE id = ?`,
      [date, time, fromMinutes(toMinutes(time) + duration), new Date().toISOString(), id],
    );
  });
  return (await getAppointmentById(id))!;
}

/** Troca de status pela Dra. Cancelar libera o horário; reativar tenta reservá-lo de novo. */
export async function setStatus(id: string, status: Status): Promise<AppointmentView> {
  const current = await getAppointmentById(id);
  if (!current) throw new BookingError("not_found", "Agendamento não encontrado.");
  if (current.status === status) return current;

  const conn = await db();
  await conn.transaction(async (tx) => {
    const wasCancelled = current.status === "cancelled";
    if (status === "cancelled") {
      await tx.run(`DELETE FROM appointment_slots WHERE appointment_id = ?`, [id]);
    } else if (wasCancelled) {
      await reserve(
        tx,
        current.date,
        unitsFor(current.startTime, toMinutes(current.endTime) - toMinutes(current.startTime)),
        id,
      );
    }
    await tx.run(
      `UPDATE appointments SET status = ?, cancel_reason = ?, updated_at = ? WHERE id = ?`,
      [status, status === "cancelled" ? "Clínica" : null, new Date().toISOString(), id],
    );
  });
  return (await getAppointmentById(id))!;
}

export async function updateAppointmentNotes(
  id: string,
  patch: { internalNotes?: string; paymentType?: "particular" | "convenio"; insurance?: string | null },
): Promise<AppointmentView> {
  const sets: string[] = [];
  const params: Param[] = [];
  if (patch.internalNotes !== undefined) {
    sets.push("internal_notes = ?");
    params.push(patch.internalNotes.slice(0, 2000));
  }
  if (patch.paymentType) {
    sets.push("payment_type = ?");
    params.push(patch.paymentType);
    sets.push("insurance = ?");
    params.push(patch.paymentType === "convenio" ? (patch.insurance ?? null) : null);
  }
  if (!sets.length) {
    const cur = await getAppointmentById(id);
    if (!cur) throw new BookingError("not_found", "Agendamento não encontrado.");
    return cur;
  }
  sets.push("updated_at = ?");
  params.push(new Date().toISOString(), id);
  const conn = await db();
  const res = await conn.run(`UPDATE appointments SET ${sets.join(", ")} WHERE id = ?`, params);
  if (!res.changes) throw new BookingError("not_found", "Agendamento não encontrado.");
  return (await getAppointmentById(id))!;
}
