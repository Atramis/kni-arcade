# KNI Arcade

Dwie gry Koła Naukowego Informatyki w jednej aplikacji:

| Gra | Adres | Ranking |
| --- | --- | --- |
| Memory Leak | `/gry/memory-leak` | poziom (malejąco) → błędy (rosnąco) → czas w s (rosnąco) |
| Packet Router | `/gry/packet-router` | punkty (malejąco), przy remisie wcześniejszy wynik wyżej |

Stos: TanStack Start (React 19, Vite 7, Tailwind CSS 4), serwer Nitro w wersji Node.

## Tryb „Stoisko / offline”

- Cała rozgrywka działa bez internetu i bez Lovable Cloud — brak backendu i bazy danych.
- Wyniki zapisują się w `localStorage` przeglądarki, osobno dla każdej gry
  (`kni-arcade:memory-leak:scores`, `kni-arcade:packet-router:scores`).
  Zostają po odświeżeniu oraz zamknięciu i ponownym otwarciu przeglądarki
  (o ile nie używasz trybu prywatnego i nie czyścisz danych witryn).
- Rankingi są oznaczone jako „Ranking tego laptopa”.
- Przycisk **Eksport JSON** przy rankingu pobiera kopię zapasową wyników.
- Fonty (Space Grotesk, JetBrains Mono) i wszystkie biblioteki są dołączone do builda — nic nie jest pobierane z CDN.
  Gry nie używają plików graficznych ani dźwięków.

Wyniki są przypisane do adresu `http://localhost:8080` — uruchamiaj grę zawsze pod tym adresem i w tej samej przeglądarce.

## Wymagania

- Node.js **20.19+** (zalecane 22 LTS) z npm — https://nodejs.org
- Internet potrzebny tylko raz: do `npm install`. Budowanie i gra działają offline.
- Zmienne środowiskowe: **żadne nie są wymagane**.

## Instalacja i uruchomienie

### Windows (PowerShell lub Wiersz polecenia)

```powershell
cd ścieżka\do\kni-arcade
npm install
npm run build
npm run start:local
```

### macOS (Terminal)

```bash
cd ~/sciezka/do/kni-arcade
npm install
npm run build
npm run start:local
```

Następnie otwórz **http://localhost:8080** (najlepiej w trybie pełnoekranowym — przycisk „Pełny ekran”).
Zatrzymanie serwera: `Ctrl+C`. Port 8080 musi być wolny.

Na stoisku wystarczy po restarcie laptopa ponownie wykonać `npm run start:local` (bez ponownego budowania).

## Pozostałe polecenia

- `npm run dev` — tryb deweloperski
- `npm test` — testy zasad gier i rankingów
