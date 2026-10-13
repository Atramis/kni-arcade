// Uruchamia zbudowaną aplikację KNI Arcade pod stałym adresem http://localhost:8080 (bez internetu).
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, ".output", "server", "index.mjs");
if (!existsSync(entry)) {
  console.error("Brak zbudowanej aplikacji. Najpierw uruchom: npm run build");
  process.exit(1);
}
process.env.PORT = "8080";
process.env.HOST = "localhost";
process.env.NITRO_PORT = "8080";
process.env.NITRO_HOST = "localhost";
console.log("KNI Arcade: http://localhost:8080  (Ctrl+C, aby zatrzymać)");
await import(pathToFileURL(entry).href);
