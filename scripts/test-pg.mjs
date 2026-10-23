// Roda a suíte de testes contra um Postgres em WebAssembly (PGlite).
// Existe como script porque `VAR=valor comando` não funciona no cmd do Windows.
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["tsx", "--test", "tests/booking.test.mts"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, TEST_DB: "pglite" },
});
process.exit(r.status ?? 1);
