<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Each game lives in `src/games/<slug>/` (engine, hook, UI, leaderboard) and is mounted by `src/routes/gry/<slug>.tsx`; keeps games isolated and portable.
- Shared KNI chrome (header, back button, footer) is `src/components/kni/ArcadeShell.tsx`; one place for unified branding.
- Scores are stored only in localStorage via `src/lib/local-scores.ts`, one key per game; the app must run fully offline at a booth.
- No CDN assets: fonts come from @fontsource packages imported in `src/styles.css`; offline requirement.
- `vite.config.ts` pins nitro `node-server` for local builds (`npm run start:local` serves `.output` on :8080); Lovable's build env overrides the preset for publishing.
