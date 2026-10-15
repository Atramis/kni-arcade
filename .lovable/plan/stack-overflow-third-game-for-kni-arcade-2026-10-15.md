# Stack_Overflow — third game for KNI_Arcade

## Concept
Add a falling-block arcade game themed around an overloaded computer’s memory. Incoming data fills a memory stack; completing horizontal rows frees space; overflowing the board ends the run.

Keep the existing dark terminal aesthetic, cyan/lime highlights, square cells, local fonts, Polish interface, and shared KNI navigation. Memory Leak and Packet Router retain their rules and saved results.

## Proposed gameplay
- A 10-column × 20-row board with seven familiar four-cell block shapes, a next-piece preview, and a landing-position outline.
- Two-minute score challenge, ending earlier if a new piece cannot enter the board.
- Left/right arrows move, up rotates clockwise, down accelerates descent, and Space drops immediately. Add accessible on-screen controls for touch play.
- Award 100 / 300 / 500 / 800 points for clearing 1 / 2 / 3 / 4 rows at once; no movement or drop points. Increase falling speed after every 5 cleared rows, with a minimum interval to keep play manageable.
- Show score, remaining time, and cleared rows. Include countdown, game-over result, nickname entry, save confirmation, and replay.
- Leaving the game or hiding the tab ends the attempt; interrupted attempts cannot be submitted. Stop timers and remove keyboard listeners on exit.

## Arcade integration
- Add a third game card with its own Top 5 on the selection screen, keeping all three cards comfortably readable across screen sizes.
- Give the game its own address: `/gry/stack-overflow`, with the existing back button and KNI frame.
- Add an independent local leaderboard: score descending, earlier saved result first on ties; show points as the primary unit.
- Include JSON export and administrator result counts, individual reset, and confirmation. Change “reset both rankings” to “reset all rankings,” covering all three games while preserving individual resets and the administrator password.
- Preserve existing storage keys. New results use `kni-arcade:stack-overflow:scores`.
- All game logic and assets remain local; no accounts, server, internet, or remote fonts are required.

## Technical approach
- Keep the new game isolated under `src/games/stack-overflow/`, mounted by `src/routes/gry/stack-overflow.tsx`, following the project’s existing structure.
- Select a maintained, license-compatible, browser-safe falling-block engine and bundle it locally. Verify rotation, collision, row clearing, and offline compatibility before integration; do not introduce a runtime CDN dependency.
- Reuse shared buttons, KNI frame, score storage helpers, export, and password-protected reset flow.
- Add game-specific page metadata; update home descriptions and README for the third game without changing local startup commands.

## Verification
- Add tests for the proposed scoring values, two-minute limit, speed progression, overflow, ranking ties, isolated storage, and all-game administrator reset.
- Play a real run: move, rotate, drop, clear a row, finish, save, replay, return home, and confirm the result survives refresh.
- Check keyboard and touch layouts, navigation cleanup, JSON export, individual/all-ranking resets, and preservation of existing scores/password.
- Run the existing test suite and verify local assets do not request external resources. If the sandbox prevents checking the packaged laptop version on port 8080, report that limitation explicitly.