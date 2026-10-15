# KNI_Arcade

Repozytorium GitHub: `kni-dni-otwarte-arcade`.

Trzy gry Koła Naukowego Informatyki w jednej aplikacji:

| Gra | Adres | Ranking |
| --- | --- | --- |
| Memory Leak | `/gry/memory-leak` | poziom (malejąco) → błędy (rosnąco) → czas w s (rosnąco) |
| Packet Router | `/gry/packet-router` | punkty (malejąco), przy remisie wcześniejszy wynik wyżej |
| Stack_Overflow | `/gry/stack-overflow` | punkty (malejąco), przy remisie wcześniejszy wynik wyżej |

Stos: TanStack Start (React 19, Vite 7, Tailwind CSS 4), serwer Nitro w wersji Node.

## Tryb „Stoisko / offline”

- Cała rozgrywka działa bez internetu i bez Lovable Cloud — brak backendu i bazy danych.
- Wyniki zapisują się w `localStorage` przeglądarki, osobno dla każdej gry
  (`kni-arcade:memory-leak:scores`, `kni-arcade:packet-router:scores`, `kni-arcade:stack-overflow:scores`).
  Klucze zachowują prefiks `kni-arcade:`, żeby istniejące wyniki i hasło
  administratora przetrwały zmianę nazwy projektu. Zostają po odświeżeniu oraz zamknięciu i ponownym otwarciu przeglądarki
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
- Plik `.npmrc` (w repozytorium) jest wymagany — bez niego `npm install` kończy się błędem
  `Cannot read properties of null (reading 'edgesOut')`. Jeśli pobierasz projekt jako ZIP, upewnij się, że ten ukryty plik też jest skopiowany.
  Gdy wciąż występuje błąd: `npm install --legacy-peer-deps`.

## Instalacja i uruchomienie

### Windows (PowerShell lub Wiersz polecenia)

```powershell
cd ścieżka\do\kni-dni-otwarte-arcade
npm install
npm run build
npm run start:local
```

### macOS (Terminal)

```bash
cd ~/sciezka/do/kni-dni-otwarte-arcade
npm install
npm run build
npm run start:local
```

Następnie otwórz **http://localhost:8080** (najlepiej w trybie pełnoekranowym — przycisk „Pełny ekran”).
Zatrzymanie serwera: `Ctrl+C`. Port 8080 musi być wolny.

### Port 8080 jest zajęty

Jeśli `npm run start:local` wypisze „Port 8080 jest zajęty”, aplikacja nie wystartuje (adres jest stały, bo ranking jest przypisany do `localhost:8080`). Zwykle to wcześniej uruchomione okno z serwerem — zamknij je (`Ctrl+C`) i uruchom polecenie ponownie. Jeśli to nie ono, znajdź i zakończ proces:

- **Windows (PowerShell):** `netstat -ano | findstr :8080`, potem `taskkill /PID <numer> /F`
- **macOS (Terminal):** `lsof -i :8080`, potem `kill <PID>`


Na stoisku wystarczy po restarcie laptopa ponownie wykonać `npm run start:local` (bez ponownego budowania).

## Menu administratora (reset rankingów)

W stopce ekranu wyboru gier jest przycisk **„Administrator”** z kłódką.

- Przy pierwszym otwarciu ustaw hasło (min. 8 znaków, dwa razy). Zrób to **przed** udostępnieniem laptopa odwiedzającym. Domyślnego hasła nie ma.
- Po odblokowaniu widać liczbę wyników każdej gry i przyciski resetu (jednej gry lub wszystkich trzech) oraz zmiany hasła. Przed usunięciem można zrobić eksport JSON.
- Zamknięcie okna, odświeżenie strony lub przejście do gry ponownie blokuje panel.
- Reset usuwa tylko wybrany ranking; hasło i rankingi pozostałych gier zostają.

**Uwaga:** to tylko lokalna blokada na stoisko. Hasło jest zapisane w przeglądarce jako weryfikator PBKDF2 (nie jawnym tekstem), ale osoba z dostępem do narzędzi deweloperskich przeglądarki może zmienić lub usunąć dane w localStorage. To nie jest pełne zabezpieczenie danych przed właścicielem urządzenia. Jeśli zapomnisz hasła: w narzędziach deweloperskich usuń klucz `kni-arcade:admin:verifier`.

## Pozostałe polecenia

### Stack_Overflow

Plansza 10×20, siedem kształtów, podgląd następnego bloku i miejsca lądowania. Runda trwa 120 sekund lub do przepełnienia stosu. Pełne wiersze dają 100/300/500/800 punktów za 1/2/3/4 wiersze jednocześnie; ruch i zrzut nie dają punktów. Co 5 wierszy bloki spadają szybciej. Strzałki lewo/prawo przesuwają, góra obraca, dół przyspiesza, spacja zrzuca. Dostępne są też przyciski ekranowe. Ukrycie karty przerywa rundę bez możliwości zapisu; wyjście usuwa zegary i nasłuchiwanie klawiatury. Gra i jej biblioteka są dołączone lokalnie.

- `npm run dev` — tryb deweloperski
- `npm test` — testy zasad gier i rankingów
