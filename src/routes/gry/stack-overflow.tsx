import { createFileRoute } from "@tanstack/react-router";
import { StackOverflowGame } from "@/games/stack-overflow/StackOverflowGame";

export const Route = createFileRoute("/gry/stack-overflow")({
  head: () => ({ meta: [
    { title: "Stack_Overflow — Zwolnij pamięć | KNI_Arcade" },
    { name: "description", content: "Układaj bloki danych i czyść wiersze. Dwie minuty, siedem kształtów i lokalny ranking KNI_Arcade." },
    { property: "og:title", content: "Stack_Overflow — KNI_Arcade" },
    { property: "og:description", content: "Zwolnij pamięć. Uniknij awarii. Dwuminutowa gra zręcznościowa KNI." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: StackOverflowGame,
});