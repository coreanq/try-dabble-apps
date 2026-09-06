# @try-dabble/feedback

Source of truth for the shared feedback widget — the floating "가이드 & 의견 / Guide & Feedback"
button that every try-dabble app injects. It opens the app's guide page on try-dabble.com in a new tab; the feedback form lives on that page, not in the widget. Shared infrastructure, not an app: it
is the one thing under `packages/`, and apps consume it over HTTP, never by import.

Built to a single self-contained IIFE and served from the try-dabble-main worker
at <https://try-dabble.com/widget/feedback.js>.

## Public contract

Apps inject one tag (each app's `src/og-lang.ts` appends it via HTMLRewriter):

```html
<script src="https://try-dabble.com/widget/feedback.js" data-app="SLUG" defer></script>
```

- `data-app` — required-ish. Falls back to the `<slug>.try-dabble.com` hostname.
- `data-lang` — optional. Otherwise `?lang=`, then `<html lang>`, then `ko`.
- Dark mode is read off the host page (`data-theme="dark"`, a `dark` class, or
  background luminance), so no app config is needed.
- Clicking the button opens `https://try-dabble.com/{lang}/guides/{slug}` in a new tab. The feedback form and `POST /api/feedback` live in try-dabble-main and are **not** part of this package.

The widget guards on `window.__tdFeedback`, so a double injection is harmless.

## Layout

```
src/feedback.js   single self-contained IIFE: copy, styles, host-page detection, mount
```

## Change the widget

```
npm install
npm run build          # -> dist/feedback.js (esbuild, IIFE, es5, not minified)
npm run sync-main      # copies it into ../../../try-dabble-main/public/widget/
```

`npm run release` does both. If try-dabble-main is not a sibling checkout, pass
its path (`npm run publish:main -- /path/to/try-dabble-main`) or set
`TRY_DABBLE_MAIN`.

Then, in try-dabble-main, commit the asset and deploy the worker:

```
npm run deploy
```

Vite copies `public/` into `dist/client`, which the worker serves as Workers
Static Assets, so the file ships as-is — `public/widget/feedback.js` is a build
output. Edit it here, never there.

Guide pages on try-dabble.com deliberately do **not** load the widget.
