import { createFileRoute } from "@tanstack/react-router";
import { BugHuntGame } from "@/games/bug-hunt/BugHuntGame";

export const Route = createFileRoute("/gry/bug-hunt")({
  head: () => ({ meta: [
    { title: "Bug_Hunt — Namierz błąd | KNI_Arcade" },
    { name: "description", content: "Namierzaj pojawiające się błędy i oszczędzaj zdrowe symbole. 60 sekund polowania, lokalny ranking KNI_Arcade." },
    { property: "og:title", content: "Bug_Hunt — KNI_Arcade" },
    { property: "og:description", content: "Namierz błąd. Ocal system. Gra refleksowa Koła Naukowego Informatyki." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: BugHuntGame,
});