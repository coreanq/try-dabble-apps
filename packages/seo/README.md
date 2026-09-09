# @try-dabble/seo

Shared SEO constants for try-dabble subdomain apps.

## Naver Search Advisor

Every `*.try-dabble.com` app (and the hub) must ship:

```html
<meta name="naver-site-verification" content="cb50b4906a09539a5c0ede24022028167b4f7751" />
```

Source of truth: [`naver.ts`](./naver.ts).

- Put the tag in the app’s root `index.html` `<head>` (Vite ships it into `dist/`).
- Also inject via the Worker `HTMLRewriter` on `<head>` in `src/og-lang.ts` (same pass as the feedback widget), so first HTML stays correct even if a shell is regenerated without the static tag.
- Apps without a Worker (e.g. seatview today) rely on the static `index.html` only.

Do not invent a second verification content string per app.
