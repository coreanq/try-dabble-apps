# Block Jumper (블록점퍼)

Pixel side-scroll platformer at [jump-map.try-dabble.com](https://jump-map.try-dabble.com).
Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Router, served from
Cloudflare Workers Static Assets with an SPA fallback.

- `src/routes/home.tsx` — the cabinet: banner, marquee, canvas, touch pad.
- `public/assets/index-DCoPmObG.js` — the playable engine, kept byte-for-byte
  from the pre-Vite build. It grabs `#game-canvas`, binds `[data-key]`, reads
  the language off `<html>`/`jm_lang`, and saves to `blockJumper:records`, so
  those four names are a contract the shell must keep.
- `src/lib/hud-i18n.ts` — the HUD/menu/shop translation, applied at the
  `fillText` seam because the engine paints its text into the canvas.
- `src/og-lang.ts` — Worker that localises the FIRST HTML for `?lang=` before
  the assets binding replies (`run_worker_first`), and appends the 의견 widget.

```
npm run dev      # vite
npm run build    # tsc -b && vite build
npm run preview  # build, then wrangler dev on :8788
npm test         # engine boot smoke test + first-HTML i18n (needs preview up)
npm run og       # regenerate og-image-*.png and the PWA icons
npm run deploy   # build, then wrangler deploy
```
