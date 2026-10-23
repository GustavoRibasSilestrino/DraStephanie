/**
 * Camada de banco com dois drivers atrás da mesma interface:
 *
 *  - Postgres (Neon, Supabase, Vercel Postgres…) quando DATABASE_URL começa
 *    com "postgres" — é o caminho de produção na Vercel.
 *  - SQLite via libSQL no resto dos casos: arquivo local `data/clinic.db`
 *    (zero configuração em desenvolvimento) ou Turso, se TURSO_DATABASE_URL
 *    estiver definida.
 *
 * Todo o SQL do projeto usa o subconjunto comum aos dois (placeholders `?`,
 * booleanos como 0/1, datas como texto), então não há ORM nem código duplicado.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient, type Client, type InValue } from "@libsql/client";
import { Pool } from "pg";

export type Row = Record<string, unknown>;
export type Param = string | number | null;

export interface Tx {
  query<T = Row>(sql: string, params?: Param[]): Promise<T[]>;
  run(sql: string, params?: Param[]): Promise<{ changes: number }>;
}

export interface Db extends Tx {
  readonly dialect: "sqlite" | "postgres";
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}

export class DbNotConfiguredError extends Error {
  constructor() {
    super(
      "Banco de dados não configurado. Defina DATABASE_URL (Postgres) ou TURSO_DATABASE_URL.",
    );
    this.name = "DbNotConfiguredError";
  }
}

/** Converte placeholders `?` em `$1, $2…` para o Postgres. */
export function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ───────────────────────── Postgres ─────────────────────────

function createPg(connectionString: string): Db {
  const pool = new Pool({
    connectionString,
    // Em serverless cada instância precisa de poucas conexões.
    max: process.env.VERCEL ? 3 : 8,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", () => {
    /* conexão ociosa derrubada pelo servidor: o pool reabre sozinho */
  });

  const exec = (target: { query: Pool["query"] }) => ({
    async query<T = Row>(sql: string, params: Param[] = []) {
      const res = await target.query(toPg(sql), params);
      return res.rows as T[];
    },
    async run(sql: string, params: Param[] = []) {
      const res = await target.query(toPg(sql), params);
      return { changes: res.rowCount ?? 0 };
    },
  });

  return {
    dialect: "postgres",
    ...exec(pool),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn(exec(client as unknown as { query: Pool["query"] }));
        await client.query("COMMIT");
        return result;
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch {
          /* a conexão pode já ter caído */
        }
        throw err;
      } finally {
        client.release();
      }
    },
  };
}

// ───────────────────────── SQLite / libSQL ─────────────────────────

function createLibsql(url: string, authToken?: string): Db {
  if (url.startsWith("file:")) {
    const file = url.slice("file:".length);
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const client: Client = createClient({ url, authToken });

  // Arquivo local: o libSQL abre uma conexão nova para cada transação e duas
  // escritas simultâneas dão SQLITE_BUSY. Como é um único processo (dev/testes),
  // basta enfileirar as operações. Turso (remoto) cuida disso no servidor.
  const serialize = url.startsWith("file:");
  let chain: Promise<unknown> = Promise.resolve();
  const locked = <T>(fn: () => Promise<T>): Promise<T> => {
    if (!serialize) return fn();
    const next = chain.then(fn, fn);
    chain = next.catch(() => undefined);
    return next;
  };

  const toRows = <T>(rs: {
    columns: string[];
    rows: ArrayLike<unknown>[];
  }): T[] =>
    rs.rows.map((r) =>
      Object.fromEntries(rs.columns.map((c, i) => [c, r[i] ?? null])),
    ) as T[];

  const exec = (target: Pick<Client, "execute">, lock: boolean) => ({
    async query<T = Row>(sql: string, params: Param[] = []) {
      const go = async () => toRows<T>(await target.execute({ sql, args: params as InValue[] }));
      return lock ? locked(go) : go();
    },
    async run(sql: string, params: Param[] = []) {
      const go = async () => {
        const rs = await target.execute({ sql, args: params as InValue[] });
        return { changes: rs.rowsAffected };
      };
      return lock ? locked(go) : go();
    },
  });

  return {
    dialect: "sqlite",
    ...exec(client, true),
    transaction: (fn) =>
      locked(async () => {
        const tx = await client.transaction("write");
        try {
          // dentro da transação não enfileira de novo (já estamos na vez)
          const result = await fn(exec(tx, false));
          await tx.commit();
          return result;
        } catch (err) {
          try {
            await tx.rollback();
          } catch {
            /* já encerrada */
          }
          throw err;
        } finally {
          tx.close();
        }
      }),
  };
}

// ───────────────────────── Seleção do driver ─────────────────────────

const g = globalThis as unknown as { __clinicDb?: Db };

function create(): Db {
  const pg = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (pg && /^postgres(ql)?:\/\//.test(pg)) return createPg(pg);

  const turso = process.env.TURSO_DATABASE_URL;
  if (turso) return createLibsql(turso, process.env.TURSO_AUTH_TOKEN);

  // Na Vercel o disco é efêmero: um arquivo local perderia os agendamentos.
  if (process.env.VERCEL) throw new DbNotConfiguredError();

  return createLibsql(`file:${process.env.SQLITE_PATH ?? "./data/clinic.db"}`);
}

/** Cliente único por processo (sobrevive ao hot reload em dev). */
export function getDb(): Db {
  g.__clinicDb ??= create();
  return g.__clinicDb;
}

export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; message?: string; cause?: { code?: string } };
  if (e?.code === "23505") return true; // Postgres
  const code = e?.code ?? e?.cause?.code ?? "";
  if (typeof code === "string" && code.startsWith("SQLITE_CONSTRAINT")) return true;
  return /UNIQUE constraint failed|PRIMARY KEY|duplicate key/i.test(e?.message ?? "");
}
