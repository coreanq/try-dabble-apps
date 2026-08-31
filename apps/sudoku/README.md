# 스도쿠 3D (3D Sudoku)

Wooden-board 3D sudoku at [sudoku.try-dabble.com](https://sudoku.try-dabble.com).
Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Router + three.js /
@react-three/fiber / cannon-es, served from Cloudflare Workers Static Assets
with an SPA fallback. Ported from an Expo SDK 57 app; the puzzle rules, board
maths and feedback controllers came across unchanged.

The page around the game is warm parchment with the lit board window sunk into
it — the walnut and the ceramic live inside the WebGL canvas, not around it.

- `src/components/board3d/` — the R3F scene: board, ceramic tiles, drop physics.
- `src/components/game/` — everything outside the canvas: header and timer,
  digit rack, toolbar, the difficulty/help/settings dialogs, and the
  one-button-per-cell board a keyboard and a screen reader walk.
- `src/lib/sudoku/domain/` — grid, solver, generator, difficulty rating, reducer.
  Pure functions, covered by `test/sudoku-domain.test.mjs`.
- `src/lib/feedback/` — pure controllers plus the browser adapters that replaced
  expo-audio and expo-haptics.
- `src/lib/i18n/` — the ko/en/ja dictionaries and the resolve order (`?lang=`,
  then the shared `td_lang` cookie, then the saved choice, then Korean) that
  `src/og-lang.ts` has to agree with or the served HTML and React disagree.
- `src/og-lang.ts` — Worker that localises the FIRST HTML for `?lang=` before
  the assets binding replies (`run_worker_first`), and appends the 의견 widget.
- `public/audio/` — effect sounds as aac (`.m4a`). The three background tracks
  are ~3MB each and load only when the music setting is on, so they stay out of
  the service worker precache.

```
npm run dev      # vite
npm run build    # tsc -b && vite build
npm run preview  # build, then wrangler dev on :8788
npm test         # 154 tests: domain, board maths, i18n, feedback + first-HTML i18n (needs preview up)
npm run og       # regenerate og-image-*.png, the PWA icons (incl. the maskable 512) and favicon.ico
npm run deploy   # build, then wrangler deploy
```

The three OG cards are also the homepage art: `og-image.png` / `-en` / `-ja`
are copied into try-dabble-main as `public/og/sudoku-{ko,en,ja}.png`, so
regenerating them here means copying them across again.
