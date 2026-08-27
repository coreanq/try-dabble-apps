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
```

Product apps stay isolated from each other — do not import across `apps/`.
`packages/` is the exception: it holds shared code, and
[`packages/feedback`](packages/feedback) is the source of truth for the widget
served at `https://try-dabble.com/widget/feedback.js`.

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
