// Uruchamia zbudowaną aplikację KNI Arcade pod stałym adresem http://localhost:8080 (bez internetu).
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const PORT = 8080;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, ".output", "server", "index.mjs");
if (!existsSync(entry)) {
  console.error("Brak zbudowanej aplikacji. Najpierw uruchom: npm run build");
  process.exit(1);
}

// Sprawdź, czy port jest wolny, zanim wystartuje serwer.
await new Promise((resolve) => {
  const probe = createServer();
  probe.once("error", (err) => {
    if (err.code === "EADDRINUSE" || err.code === "EACCES") {
      console.error(`Port ${PORT} jest zajęty — KNI Arcade musi działać pod http://localhost:${PORT}.`);
      console.error("Zamknij program, który go używa (np. poprzednie okno z npm run start:local), i spróbuj ponownie.");
      console.error("Jak znaleźć ten program: zobacz README, sekcja „Port 8080 jest zajęty”.");
      process.exit(1);
    }
    resolve();
  });
  probe.once("listening", () => probe.close(() => resolve()));
  probe.listen(PORT, "127.0.0.1");
});

process.env.PORT = String(PORT);
process.env.HOST = "localhost";
process.env.NITRO_PORT = String(PORT);
process.env.NITRO_HOST = "localhost";
console.log(`KNI Arcade: http://localhost:${PORT}  (Ctrl+C, aby zatrzymać)`);
await import(pathToFileURL(entry).href);
