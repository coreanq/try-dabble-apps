# @try-dabble/feedback

Source of truth for the shared feedback widget — the floating "의견 / Feedback"
button that every try-dabble app injects. Shared infrastructure, not an app: it
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
- Submissions POST to `https://try-dabble.com/api/feedback`, which lives in
  try-dabble-main (`worker/src/feedback.ts`) and is **not** part of this package.

The widget guards on `window.__tdFeedback`, so a double injection is harmless.

## Layout

```
src/copy.js      UI strings; its keys define the supported languages
src/styles.js    all .td-fb-* CSS, injected once into <head>
src/context.js   language / slug / dark-mode detection off the host page
src/image.js     client-side downscale to a JPEG data URL
src/widget.js    entry: state, panel, submit, mount
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
