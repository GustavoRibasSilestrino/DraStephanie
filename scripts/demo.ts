/**
 * Recria (ou remove) os dados FICTÍCIOS de demonstração no banco configurado.
 *
 *   npm run db:demo            → recria em torno de hoje
 *   npm run db:demo -- --clear → remove os dados de exemplo
 *
 * Usa DATABASE_URL / TURSO_DATABASE_URL se existirem (ex.: banco de produção);
 * senão, o SQLite local em ./data/clinic.db.
 */
import { clearDemo, seedDemo } from "../lib/demo-data";

async function main() {
  if (process.argv.includes("--clear")) {
    await clearDemo();
    console.log("Dados de exemplo removidos.");
    return;
  }
  const r = await seedDemo();
  console.log(`Dados de exemplo criados: ${r.appointments} consultas, ${r.patients} pacientes.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
