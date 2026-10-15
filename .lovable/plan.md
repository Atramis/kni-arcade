# Bug_Hunt — fourth and final arcade game

## Experience
- Add **Bug_Hunt** at `/gry/bug-hunt`: a lively pop-up reaction game in the arcade’s dark terminal style, with Polish text and locally rendered symbols.
- Corrupted symbols briefly appear alongside normal symbols on a fixed 4×4 grid. Tap or click the corrupted targets before they disappear; leave healthy symbols alone.
- Make targets distinguishable by shape as well as color: broken/glitched bug symbols versus clean terminal symbols. Include a short visual example on the start screen.
- Keep the other three games, their rules, saved results, and administrator password unchanged. This completes the four-game lineup.

## Proposed rules
- Three-second countdown followed by a **60-second round**.
- Correct hit: **+100 points**. Clicking a healthy symbol: **−50 points**, with the total never below zero. A missed bug scores zero and breaks the current streak.
- Track hits, misses, mistakes, and best streak; rank by total points, with earlier saved results winning ties.
- Increase pace every 15 seconds: target lifetimes of **1,400 / 1,200 / 1,000 / 800 ms**, with no more than three bugs visible at once. Ensure a target remains hittable for its full lifetime and cannot be scored twice.
- Clear hit/miss feedback without flashing effects; respect reduced-motion preferences.
- Provide replay and nickname-based score saving after a completed round. Leaving the tab interrupts the attempt and prevents score submission; leaving the game cleans up timers and listeners.

## Arcade integration
- Add the fourth home-menu card and its Top 5; use two columns on wider screens and one on narrow screens so four cards stay balanced.
- Add an independent offline leaderboard, JSON export, administrator result count, individual reset, and inclusion in “Resetuj wszystkie rankingi”. Retain the confirmation and export-before-delete flow.
- Preserve offline operation: no new service, account, remote fonts, or externally loaded images.

## Technical details
- Follow the existing isolated-game convention: `src/games/bug-hunt/` for engine, hook, UI, and leaderboard; a dedicated TanStack route with unique page/social metadata.
- Use timestamp-based spawning and expiry, with injectable time and randomness for deterministic tests. Keep the grid and hit areas stable as symbols change.
- Store results under `kni-arcade:bug-hunt:scores` using the shared local-score helpers; retain 200 results and display the top 10 inside the game and top 5 at home.
- Update README, the implementation checklist, and project rules/requirements during implementation to reflect the final four-game lineup.

## Verification
- Add concrete tests for scoring, the zero floor, round duration, countdown, difficulty stages, target expiry, duplicate-hit protection, interruption, ranking order, and storage/reset isolation.
- Exercise a real round, save a nonzero score, refresh, confirm home Top 5, replay, export, and test individual/all-game administrator resets.
- Check mouse and touch interaction, narrow-screen fit, navigation among all four games, and operation with external network requests blocked.
- Report laptop-package verification separately from preview/offline-asset checks; do not present one as proof of the other.