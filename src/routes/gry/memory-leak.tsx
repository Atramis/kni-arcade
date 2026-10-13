import { createFileRoute } from "@tanstack/react-router";
import { MemoryLeakGame } from "@/games/memory-leak/MemoryLeakGame";

export const Route = createFileRoute("/gry/memory-leak")({
  head: () => ({
    meta: [
      { title: "Memory Leak — Ile RAM-u masz w głowie? | KNI_Arcade" },
      { name: "description", content: "Gra pamięciowa KNI: zapamiętaj wzór, odtwórz go. 60 sekund, 3 życia, 10 poziomów." },
      { property: "og:title", content: "Memory Leak — KNI_Arcade" },
      { property: "og:description", content: "Ile RAM-u masz w głowie? 60 sekund, 3 życia, 10 poziomów." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemoryLeakGame,
});
