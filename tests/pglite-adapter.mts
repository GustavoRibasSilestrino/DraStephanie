/**
 * Adaptador de teste: roda a mesma suíte contra um Postgres real (PGlite, em
 * WebAssembly) para garantir que o SQL é portável entre SQLite e Postgres.
 */
import { PGlite } from "@electric-sql/pglite";
import { toPg, type Db, type Param } from "../lib/db";

type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; affectedRows?: number }> };

const wrap = (t: Queryable) => ({
  async query<T>(sql: string, params: Param[] = []) {
    const r = await t.query(toPg(sql), params);
    return r.rows as T[];
  },
  async run(sql: string, params: Param[] = []) {
    const r = await t.query(toPg(sql), params);
    return { changes: r.affectedRows ?? 0 };
  },
});

export async function createPgliteDb(): Promise<Db> {
  const pg = new PGlite();
  await pg.waitReady;
  return {
    dialect: "postgres",
    ...wrap(pg as unknown as Queryable),
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx as unknown as Queryable))),
  };
}
