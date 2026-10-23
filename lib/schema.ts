import { getDb } from "./db";

/**
 * Tabelas — escritas no subconjunto de SQL comum ao SQLite e ao Postgres.
 *
 * `appointment_slots` é o coração do anti-duplo-agendamento: cada consulta
 * ocupa uma linha por bloco de 15 minutos, e a chave primária (date, slot)
 * impede que duas consultas ocupem o mesmo bloco, mesmo com dois pacientes
 * clicando no mesmo segundo.
 */
const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS settings (
     key   TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS services (
     id           TEXT PRIMARY KEY,
     slug         TEXT NOT NULL UNIQUE,
     name         TEXT NOT NULL,
     description  TEXT NOT NULL DEFAULT '',
     duration_min INTEGER NOT NULL,
     icon         TEXT NOT NULL DEFAULT 'tooth',
     active       INTEGER NOT NULL DEFAULT 1,
     sort         INTEGER NOT NULL DEFAULT 0
   )`,

  `CREATE TABLE IF NOT EXISTS blocks (
     id         TEXT PRIMARY KEY,
     date_start TEXT NOT NULL,
     date_end   TEXT NOT NULL,
     time_start TEXT,
     time_end   TEXT,
     reason     TEXT NOT NULL DEFAULT '',
     created_at TEXT NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS patients (
     id         TEXT PRIMARY KEY,
     key        TEXT NOT NULL UNIQUE,
     name       TEXT NOT NULL,
     name_norm  TEXT NOT NULL,
     phone      TEXT NOT NULL,
     email      TEXT,
     birth_date TEXT,
     notes      TEXT NOT NULL DEFAULT '',
     created_at TEXT NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS appointments (
     id             TEXT PRIMARY KEY,
     code           TEXT NOT NULL UNIQUE,
     patient_id     TEXT NOT NULL REFERENCES patients(id),
     service_id     TEXT NOT NULL,
     service_name   TEXT NOT NULL,
     date           TEXT NOT NULL,
     start_time     TEXT NOT NULL,
     end_time       TEXT NOT NULL,
     status         TEXT NOT NULL,
     payment_type   TEXT NOT NULL DEFAULT 'particular',
     insurance      TEXT,
     notes          TEXT NOT NULL DEFAULT '',
     internal_notes TEXT NOT NULL DEFAULT '',
     source         TEXT NOT NULL DEFAULT 'site',
     cancel_reason  TEXT,
     created_at     TEXT NOT NULL,
     updated_at     TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date, start_time)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)`,
  `CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone)`,

  `CREATE TABLE IF NOT EXISTS appointment_slots (
     date           TEXT NOT NULL,
     slot           TEXT NOT NULL,
     appointment_id TEXT NOT NULL,
     PRIMARY KEY (date, slot)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_slots_appointment ON appointment_slots(appointment_id)`,
];

const SEED_SERVICES = [
  {
    slug: "avaliacao",
    name: "Avaliação / primeira consulta",
    description:
      "Avaliação completa da sua saúde bucal, diagnóstico e plano de tratamento. O melhor ponto de partida.",
    duration_min: 60,
    icon: "search",
  },
  {
    slug: "urgencia",
    name: "Urgência / dor de dente",
    description:
      "Atendimento para dor, inchaço, dente fraturado ou outro desconforto que não pode esperar.",
    duration_min: 30,
    icon: "alert",
  },
  {
    slug: "canal",
    name: "Tratamento de canal (endodontia)",
    description:
      "Sessão de tratamento endodôntico para eliminar a infecção e preservar o seu dente.",
    duration_min: 90,
    icon: "root",
  },
  {
    slug: "protese",
    name: "Prótese dentária",
    description:
      "Consulta e etapas de reabilitação com coroas, facetas, pontes e próteses removíveis.",
    duration_min: 60,
    icon: "crown",
  },
  {
    slug: "implante",
    name: "Implante dentário",
    description:
      "Avaliação, planejamento e acompanhamento para reposição de dentes com implantes.",
    duration_min: 60,
    icon: "implant",
  },
  {
    slug: "clareamento",
    name: "Clareamento dental",
    description:
      "Avaliação e sessão de clareamento com acompanhamento profissional.",
    duration_min: 60,
    icon: "sparkle",
  },
  {
    slug: "alinhadores",
    name: "Alinhadores ortodônticos",
    description:
      "Avaliação, planejamento digital e acompanhamento do tratamento com alinhadores.",
    duration_min: 60,
    icon: "aligner",
  },
  {
    slug: "limpeza",
    name: "Limpeza e revisão",
    description: "Profilaxia, controle de placa e revisão periódica da saúde bucal.",
    duration_min: 60,
    icon: "shield",
  },
  {
    slug: "retorno",
    name: "Retorno / continuidade de tratamento",
    description:
      "Para pacientes em tratamento que precisam de uma nova sessão ou de um ajuste.",
    duration_min: 30,
    icon: "return",
  },
];

let ready: Promise<void> | null = null;

async function migrate(): Promise<void> {
  const db = getDb();
  for (const statement of DDL) await db.run(statement);

  // Dados iniciais: só na primeira execução (se a Dra. apagar um serviço padrão,
  // ele não volta a cada reinício).
  const claimed = await db.run(
    `INSERT INTO settings (key, value) VALUES ('seeded', '1') ON CONFLICT (key) DO NOTHING`,
  );
  if (claimed.changes > 0) {
    let sort = 0;
    for (const s of SEED_SERVICES) {
      await db.run(
        `INSERT INTO services (id, slug, name, description, duration_min, icon, active, sort)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?) ON CONFLICT (slug) DO NOTHING`,
        [s.slug, s.slug, s.name, s.description, s.duration_min, s.icon, sort++],
      );
    }
  }
}

/** Cria as tabelas (idempotente). Chamado antes de qualquer consulta. */
export function ensureSchema(): Promise<void> {
  ready ??= (async () => {
    try {
      await migrate();
    } catch {
      // Duas instâncias frias criando as tabelas ao mesmo tempo podem colidir no
      // Postgres; uma segunda tentativa resolve (o DDL é idempotente).
      await new Promise((r) => setTimeout(r, 400));
      await migrate();
    }
  })().catch((err) => {
    ready = null; // permite nova tentativa na próxima requisição
    throw err;
  });
  return ready;
}

/** Atalho: banco pronto para uso. */
export async function db() {
  await ensureSchema();
  return getDb();
}
