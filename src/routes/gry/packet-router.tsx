import { createFileRoute } from "@tanstack/react-router";
import { PacketRouterGame } from "@/games/packet-router/PacketRouterGame";

export const Route = createFileRoute("/gry/packet-router")({
  head: () => ({
    meta: [
      { title: "Packet Router — Sieciowy Kurier | KNI_Arcade" },
      { name: "description", content: "Obróć kafelki i dostarcz pakiet do celu! 2 minuty, +10 sekund za każdą zagadkę." },
      { property: "og:title", content: "Packet Router — KNI_Arcade" },
      { property: "og:description", content: "Obróć kafelki i dostarcz pakiet do celu!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PacketRouterGame,
});
