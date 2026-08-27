Omok / 오목 (omok.try-dabble.com). Vite + React + TypeScript + Tailwind +
shadcn/ui + TanStack Router, deployed as a Cloudflare Worker with Static
Assets (SPA fallback).

    npm run dev       # vite
    npm run build     # tsc -b && vite build  ->  dist/
    npm run preview   # build, then wrangler dev on :8788
    npm test          # engine unit tests; first-html i18n tests need preview running
    npm run og        # regenerate the 1200x630 og-image PNGs
    npm run deploy    # build && wrangler deploy

`src/og-lang.ts` is the Worker. It runs before the assets binding
(`run_worker_first`) so the FIRST HTML already carries `?lang=` — html lang,
title, `#local-only`, `h1#brand-title` and the og/twitter tags — for crawlers
that never run JS, and it appends the 의견 feedback widget.

The engine (`src/lib/gomoku.ts`) is the pre-Vite AI, unchanged: pattern-based
threat detection, a nine-step move priority list, and depth-3 minimax with
alpha-beta for hard.
