# try-dabble-apps

CSR/PWA apps on `*.try-dabble.com`. One isolated folder per app. Do not import
across apps. Shared code lives in `packages/` instead.

Homepage cards and guides live in [coreanq/try-dabble-main](https://github.com/coreanq/try-dabble-main).

## Layout

```
apps/<slug>/          one product app, isolated
  wrangler.jsonc
  package.json
  public/
packages/feedback/    shared feedback widget (not an app)
packages/seo/         shared Naver verification meta (not an app)
```

Product apps stay isolated from each other — do not import across `apps/`.
`packages/` is the exception: it holds shared code.
[`packages/feedback`](packages/feedback) is the source of truth for the widget
served at `https://try-dabble.com/widget/feedback.js`.
[`packages/seo`](packages/seo) holds the shared Naver Search Advisor verification
meta (`naver-site-verification`) every `*.try-dabble.com` app must ship.

Apps load that widget as a CDN script, never as a bundled import, so one deploy
of [coreanq/try-dabble-main](https://github.com/coreanq/try-dabble-main)
updates every slug:

```html
<script src="https://try-dabble.com/widget/feedback.js" data-app="SLUG" defer></script>
```

## Deploy one app

Node 22+, wrangler 3+. From that folder only:

```
cd apps/<slug>
npx wrangler deploy
```

Apps with a build step (Vite, Next) must build first — use `npm run deploy` in
those folders, which builds and then deploys.

## Apps

- [cost-per-use](https://cost-per-use.try-dabble.com/)
- [gift-stash](https://gift-stash.try-dabble.com/)
- [place-inbox](https://place-inbox.try-dabble.com/)
- [photo-spec](https://photo-spec.try-dabble.com/)
- [later-inbox](https://later-inbox.try-dabble.com/)
- [leftover-box](https://leftover-box.try-dabble.com/) — 반찬함 leftover eat-by tracker; Vite + React + TS + Tailwind/shadcn + TanStack Router, `npm run deploy`
- [box-qr](https://box-qr.try-dabble.com/) — 상자QR moving-box QR + photo inventory
- [omok](https://omok.try-dabble.com/) — Next static export; `next build` then wrangler from `out/`
- [jump-map](https://jump-map.try-dabble.com/) — Block Jumper CSR/PWA
- [sudoku](https://sudoku.try-dabble.com/) — 스도쿠 3D wooden-board sudoku; three.js + R3F, ported off Expo
- [seatview](https://seatview.try-dabble.com/) — 좌석 시야 3D 미리보기 (concert seat-view previewer + venue digitising tool at /admin/); Vite + TS + three.js, `npm run deploy`
- [timerpad](https://timerpad.try-dabble.com/) — HIIT + Pomodoro + stopwatch; Vite + React + TS, `npm run deploy`
- [scrubpad](https://scrubpad.try-dabble.com/) — local PII scrubber with stable placeholders, review list and restore map; Vite + React + TS, `npm run deploy`
- [subpad](https://subpad.try-dabble.com/) — local subscription tracker with renewals, per-currency totals, templates, payment history and .ics export; Vite + React + TS, `npm run deploy`
- [hourpad](https://hourpad.try-dabble.com/) — local work-hours tracker with check-in, breaks, weekly target and an overtime bank that rolls into next week; Vite + React + TS, `npm run deploy`
- [recpad](https://recpad.try-dabble.com/) — local practice mic recorder with waveform selection, trim/cut/undo, on-device noise clean, gain/normalize, WAV + MP3 export and drafts on this device; Vite + React + TS, `npm run deploy`
- [paypad](https://paypad.try-dabble.com/) — local irregular-income envelope budget with named plans, % or fixed envelopes across five categories, auto-recompute on income, monthly + annual views, per-currency totals and JSON backup; Vite + React + TS, `npm run deploy`
