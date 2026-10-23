import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clinic-test-"));
process.env.SQLITE_PATH = path.join(tmp, "test.db");
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.TURSO_DATABASE_URL;

// TEST_DB=pglite roda a suíte inteira contra um Postgres (WebAssembly) em vez de SQLite.
if (process.env.TEST_DB === "pglite") {
  const { createPgliteDb } = await import("./pglite-adapter.mts");
  (globalThis as unknown as { __clinicDb: unknown }).__clinicDb = await createPgliteDb();
}

const dt = await import("../lib/datetime");
const holidays = await import("../lib/holidays");
const avail = await import("../lib/availability");
const settingsLib = await import("../lib/settings");
const appts = await import("../lib/appointments");
const admin = await import("../lib/admin-data");
const schema = await import("../lib/schema");

/** N-ésima segunda-feira útil (≥ hoje + 8 dias) que não seja feriado. */
function futureMonday(skip = 0): string {
  let d = dt.addDays(dt.today(), 8);
  let found = 0;
  for (let i = 0; i < 200; i++, d = dt.addDays(d, 1)) {
    if (dt.weekday(d) === 1 && !holidays.holidayName(d)) {
      if (found++ === skip) return d;
    }
  }
  throw new Error("sem segunda-feira útil");
}

const base = (over: Record<string, unknown> = {}) => ({
  serviceId: "avaliacao", // 60 min
  date: futureMonday(),
  time: "09:00",
  name: "Maria da Silva",
  phone: "(15) 99111-2222",
  paymentType: "particular" as const,
  consent: true as const,
  ...over,
});

before(async () => {
  await schema.ensureSchema();
});
after(() => {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* o Windows pode manter o arquivo aberto até o processo terminar */
  }
});

test("driver correto em uso", async () => {
  const { getDb } = await import("../lib/db");
  assert.equal(getDb().dialect, process.env.TEST_DB === "pglite" ? "postgres" : "sqlite");
});

test("datas: dia da semana, soma de dias e fuso", () => {
  assert.equal(dt.weekday("2026-10-23"), 5); // sexta
  assert.equal(dt.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(dt.addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(dt.fromMinutes(dt.toMinutes("13:30") + 90), "15:00");
  // 23:30 em Brasília de 31/12 = 02:30 UTC de 01/01 → ainda é 31/12 aqui
  assert.equal(dt.nowSP(new Date("2027-01-01T02:30:00Z")).date, "2026-12-31");
});

test("feriados nacionais e móveis", () => {
  assert.equal(holidays.holidayName("2026-12-25"), "Natal");
  assert.equal(holidays.holidayName("2026-04-03"), "Sexta-feira Santa");
  assert.equal(holidays.holidayName("2026-02-17"), "Carnaval");
  assert.equal(holidays.holidayName("2026-06-04"), "Corpus Christi");
  assert.equal(holidays.holidayName("2026-03-10"), null);
});

test("telefone: normalização e rejeição", () => {
  assert.equal(appts.normalizePhone("(15) 99287-4141"), "5515992874141");
  assert.equal(appts.normalizePhone("+55 15 99287-4141"), "5515992874141");
  assert.equal(appts.normalizePhone("1532221111"), "551532221111"); // fixo
  assert.equal(appts.normalizePhone("123"), null);
  assert.equal(appts.normalizePhone("15 88287-4141"), null); // celular sem 9
});

test("grade: horários respeitam intervalos, duração, antecedência e bloqueios", () => {
  const settings = settingsLib.DEFAULT_SETTINGS;
  const monday = futureMonday();
  const ctx = {
    settings,
    occupied: new Set<string>(),
    blocks: [],
    now: { date: dt.addDays(monday, -10), minutes: 600 },
  };
  const slots = avail.slotsForDay(monday, 60, ctx);
  assert.deepEqual(slots.slice(0, 3), ["08:00", "08:30", "09:00"]);
  assert.ok(slots.includes("11:00")); // 11:00–12:00 cabe
  assert.ok(!slots.includes("11:30")); // estouraria o almoço
  assert.ok(slots.includes("13:30"));
  assert.ok(slots.includes("16:30"));
  assert.ok(!slots.includes("17:00")); // 17:00–18:00 passa do fim

  // fim de semana: nada
  assert.deepEqual(avail.slotsForDay(dt.addDays(monday, 5), 60, ctx), []);

  // antecedência mínima (3h): às 10:00 do próprio dia, só libera a partir de 13:30
  const sameDay = { ...ctx, now: { date: monday, minutes: 600 } };
  assert.equal(avail.slotsForDay(monday, 30, sameDay)[0], "13:30");

  // bloqueio parcial 09:00–10:00
  const blocked = {
    ...ctx,
    blocks: [
      { id: "b", dateStart: monday, dateEnd: monday, timeStart: "09:00", timeEnd: "10:00", reason: "" },
    ],
  };
  const bs = avail.slotsForDay(monday, 60, blocked);
  assert.ok(!bs.includes("08:30") && !bs.includes("09:00") && !bs.includes("09:30"));
  assert.ok(bs.includes("08:00")); // 08:00–09:00 só encosta no bloqueio
  assert.ok(bs.includes("10:00"));
});

test("agendar: grava, ocupa o horário e some das opções", async () => {
  const date = futureMonday();
  const a = await appts.createAppointment(base(), { source: "site" });
  assert.equal(a.status, "confirmed");
  assert.equal(a.startTime, "09:00");
  assert.equal(a.endTime, "10:00");
  assert.match(a.code, /^[A-Z2-9]{6}$/);
  const times = await avail.availableSlots(date, 60);
  assert.ok(!times.includes("08:30") && !times.includes("09:00") && !times.includes("09:30"));
  assert.ok(times.includes("08:00") && times.includes("10:00"));
});

test("anti-conflito: mesmo horário e horários sobrepostos são recusados", async () => {
  await assert.rejects(
    appts.createAppointment(base({ name: "Outra Pessoa", phone: "15 99333-4444" }), { source: "site" }),
    (e: unknown) => e instanceof appts.BookingError && (e.code === "unavailable" || e.code === "slot_taken"),
  );
  // sobreposição parcial via admin (ignora a grade): o banco ainda precisa recusar
  await assert.rejects(
    appts.createAppointment(base({ time: "09:30", name: "Outra Pessoa", phone: "15 99333-4444" }), {
      source: "admin",
      force: true,
    }),
    (e: unknown) => e instanceof appts.BookingError && e.code === "slot_taken",
  );
});

test("concorrência: 6 pessoas disputando o mesmo horário → só 1 consegue", async () => {
  const date = futureMonday(1);
  const results = await Promise.allSettled(
    Array.from({ length: 6 }, (_, i) =>
      appts.createAppointment(
        base({ date, time: "14:00", name: `Paciente Numero${i}`, phone: `1599900000${i}` }),
        { source: "site", force: true },
      ),
    ),
  );
  const ok = results.filter((r) => r.status === "fulfilled");
  assert.equal(ok.length, 1, `esperava 1 sucesso, houve ${ok.length}`);
  const times = await avail.availableSlots(date, 60);
  assert.ok(!times.includes("14:00"));
});

test("remarcar move sem se bloquear; cancelar libera; reativar reserva de novo", async () => {
  const date = futureMonday(2);
  const a = await appts.createAppointment(
    base({ date, time: "10:00", phone: "15 99555-0001", name: "Ana Paula Reis" }),
    { source: "site" },
  );
  // remarcar 30 min para frente sobrepõe o próprio horário e deve funcionar
  const moved = await appts.rescheduleAppointment(a.id, date, "10:30", { by: "patient" });
  assert.equal(moved.startTime, "10:30");
  assert.equal(moved.endTime, "11:30");
  let times = await avail.availableSlots(date, 60);
  assert.ok(times.includes("08:00") && !times.includes("10:30") && !times.includes("11:00"));

  const cancelled = await appts.cancelAppointment(a.id, "imprevisto", "patient");
  assert.equal(cancelled.status, "cancelled");
  times = await avail.availableSlots(date, 60);
  assert.ok(times.includes("10:30") && times.includes("10:00"));

  const back = await appts.setStatus(a.id, "confirmed");
  assert.equal(back.status, "confirmed");
  times = await avail.availableSlots(date, 60);
  assert.ok(!times.includes("10:30"));
});

test("remarcar para horário ocupado falha e mantém o original", async () => {
  const date = futureMonday(3);
  const a = await appts.createAppointment(
    base({ date, time: "08:00", phone: "15 99777-0001", name: "Bruno Lima Souza" }),
    { source: "site" },
  );
  await appts.createAppointment(
    base({ date, time: "15:00", phone: "15 99777-0002", name: "Carla Dias Mota" }),
    { source: "site" },
  );
  await assert.rejects(
    appts.rescheduleAppointment(a.id, date, "15:00", { by: "patient" }),
    (e: unknown) => e instanceof appts.BookingError,
  );
  const still = await appts.getAppointmentById(a.id);
  assert.equal(still?.startTime, "08:00");
  assert.ok(!(await avail.availableSlots(date, 60)).includes("08:00")); // continua reservado
});

test("consulta pelo código exige o telefone correto", async () => {
  const date = futureMonday(4);
  const a = await appts.createAppointment(
    base({ date, phone: "15 99888-0001", name: "Diego Alves Prado" }),
    { source: "site" },
  );
  assert.ok(await appts.getAppointmentByCode(a.code, "(15) 99888-0001"));
  assert.ok(await appts.getAppointmentByCode(a.code.toLowerCase(), "15998880001"));
  assert.equal(await appts.getAppointmentByCode(a.code, "15 99888-0002"), null);
  assert.equal(await appts.getAppointmentByCode("ZZZZZZ", "15 99888-0001"), null);
});

test("limite de consultas ativas por telefone", async () => {
  const phone = "15 99000-1111";
  const date = futureMonday(5);
  for (let i = 0; i < 3; i++) {
    await appts.createAppointment(
      base({ date, time: `${String(8 + i).padStart(2, "0")}:00`, phone, name: "Eva Limite Teste" }),
      { source: "site" },
    );
  }
  await assert.rejects(
    appts.createAppointment(base({ date, time: "11:00", phone, name: "Eva Limite Teste" }), {
      source: "site",
    }),
    (e: unknown) => e instanceof appts.BookingError && e.code === "limit",
  );
});

test("painel: dashboard, pacientes e bloqueio de dia inteiro", async () => {
  const dash = await admin.getDashboard();
  assert.ok(dash.patientsTotal >= 5);
  const pats = await admin.listPatients("maria");
  assert.ok(pats.some((p) => p.name.toLowerCase() === "maria da silva"));

  const date = futureMonday(6);
  assert.ok((await avail.availableSlots(date, 60)).length > 0);
  const block = await admin.createBlock({
    dateStart: date,
    dateEnd: date,
    timeStart: null,
    timeEnd: null,
    reason: "Curso",
  });
  assert.deepEqual(await avail.availableSlots(date, 60), []);
  await admin.deleteBlock(block.id);
  assert.ok((await avail.availableSlots(date, 60)).length > 0);
});
