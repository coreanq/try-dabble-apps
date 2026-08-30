# 스도쿠 3D 웹앱 이식 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expo SDK 57로 만든 3D 스도쿠를 `try-dabble-apps/apps/sudoku`로 옮겨, 3D 보드는 그대로 두고 껍데기만 다른 try-dabble 앱과 같은 형태로 바꾼 뒤 try-dabble-main에 등록한다.

**Architecture:** 원본 소스의 약 60%(도메인·수학·i18n·피드백 컨트롤러)는 react-native 의존이 없어 import 경로만 고쳐 옮긴다. `@react-three/fiber`는 react-dom에서 그대로 돌아가므로 R3F 컴포넌트도 파일명만 바꿔 옮긴다. 다시 쓰는 것은 `View`/`Text`/`StyleSheet`로 짜인 UI 껍데기 20개 파일과, `expo-audio`·`expo-haptics`·`AppState`에 붙어 있던 어댑터 3개뿐이다.

**Tech Stack:** Vite 8, React 19, TypeScript 6, Tailwind 4, shadcn/ui(Radix), TanStack Router, three.js + @react-three/fiber + cannon-es, Cloudflare Workers Static Assets, `node --test`

**Spec:** `docs/superpowers/specs/2026-08-30-sudoku-web-port-design.md`

## Global Constraints

- Node 22 이상, wrangler 4 이상.
- 경로 상수: 원본 `SRC=/Users/charles/1git/sudoku` (**읽기 전용 — 절대 수정 금지**), 대상 `APP=/Users/charles/1git/try-dabble-apps/apps/sudoku`.
- `apps/` 사이 교차 import 금지. 이 앱은 `packages/`도 쓰지 않는다.
- TypeScript는 `strict`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`. enum과 파라미터 프로퍼티 금지, 타입 전용 import는 반드시 `import type`.
- 로케일은 `ko`/`en`/`ja` 3개. zh를 추가하지 않는다.
- 도메인 `https://sudoku.try-dabble.com`, slug `sudoku`.
- 브랜드명: ko `스도쿠 3D`, en `3D Sudoku`, ja `3D数独`.
- 로컬 전용 안내 문구(다른 앱과 한 글자도 다르면 안 됨):
  - ko `이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.`
  - en `Your data stays on this device. Nothing is sent to our servers.`
  - ja `データはこの端末にだけ保存されます。サーバーには送りません。`
- 의견 위젯은 CDN 스크립트로만 붙인다. 번들 import 금지:
  `<script src="https://try-dabble.com/widget/feedback.js" data-app="sudoku" defer></script>`
- 커밋 메시지는 이 저장소 관례를 따른다: `sudoku: <영문 한 줄 요약.>` (예: `playset: Pick the games, press play once.`)
- 모든 명령은 `apps/sudoku`에서 실행한다.

## File Structure

| 경로 | 책임 |
|---|---|
| `index.html` | no-JS 셸. `#local-only`, `h1#brand-title`, `#brand-sub`를 담아 Worker가 재작성할 자리를 만든다 |
| `src/og-lang.ts` | assets 바인딩보다 먼저 도는 Worker. 첫 HTML을 `?lang=`으로 재작성하고 의견 위젯을 append |
| `src/main.tsx` | 라우터 마운트 + 서비스워커 등록 |
| `src/router.tsx` | TanStack Router 트리 |
| `src/routes/root.tsx` | `<Outlet />`만 |
| `src/routes/home.tsx` | `?lang=` 파싱 → 언어 결정 → `GameScreen` 렌더 |
| `src/index.css` | Tailwind 4 `@theme` 토큰. `lib/game/game-theme.ts`의 색과 값이 일치해야 한다 |
| `src/lib/types.ts` | `Digit`, `CellValue`, `Grid`, `CellIndex`, `NormalizedPointer` 등 공용 타입 |
| `src/lib/i18n/` | 로케일 목록, ko/en/ja 메시지 시트, `t`/`localizedFaq`, `detectLang`/`rememberLang` |
| `src/lib/sudoku/domain/` | 그리드·솔버·생성기·난이도 평가·리듀서. 순수 함수만 |
| `src/lib/sudoku/data/` | 생성된 퍼즐 테이블 |
| `src/lib/board3d/` | 보드 배치·씬 수학·입력 해석·물리 세계·완성 모션·프레임 예산. R3F 훅 외 DOM 의존 없음 |
| `src/lib/game/` | 뷰모델(키보드 명령, 접근성 라벨, 피드백 효과 매핑), 세이프에어리어, 테마 상수 |
| `src/lib/feedback/` | 오디오·햅틱 컨트롤러(순수)와 웹 어댑터 훅 |
| `src/lib/pointer.ts` | PointerEvent → `NormalizedPointer` 정규화 |
| `src/components/board3d/` | R3F 씬 컴포넌트와 캔버스 래퍼 |
| `src/components/game/` | 헤더·툴바·숫자패드·다이얼로그·접근성 보드·조립 화면 |
| `src/components/ui/` | shadcn button/card/dialog/slider |
| `src/components/{masthead,local-only-banner,seo-copy}.tsx` | try-dabble 공통 셸 조각 |
| `test/*.test.mjs` | `node --test`. 순수 로직 + 첫 HTML i18n |
| `public/` | manifest, sw.js, 아이콘, OG 이미지, 정적 문서, 텍스처, 오디오 |
| `contain-og.js` | sharp가 SVG를 그려 OG 이미지·아이콘 생성 |
| `wrangler.jsonc` | `sudoku.try-dabble.com`, `run_worker_first` |

---

### Task 1: 앱 스캐폴드와 빌드 파이프라인

빈 셸이 빌드되는 상태를 먼저 만든다. 이후 모든 태스크가 이 위에 얹힌다.

**Files:**
- Create: `apps/sudoku/package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.worker.json`, `components.json`, `.gitignore`, `wrangler.jsonc`, `index.html`
- Create: `apps/sudoku/src/main.tsx`, `src/router.tsx`, `src/routes/root.tsx`, `src/routes/home.tsx`, `src/index.css`, `src/lib/utils.ts`
- Create: `apps/sudoku/src/components/ui/{button,card,dialog}.tsx`, `src/components/{masthead,local-only-banner}.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `@/` → `./src` alias, `npm run build`가 `dist/`를 만드는 파이프라인, `Masthead`·`LocalOnlyBanner` 컴포넌트

- [ ] **Step 1: 폴더를 만들고 omok에서 설정 파일을 그대로 가져온다**

omok은 같은 게임 앱이고 설정이 표준형이다. 파일 내용은 손대지 않는다.

```bash
cd /Users/charles/1git/try-dabble-apps
mkdir -p apps/sudoku/src/{routes,lib,components/ui}
cd apps/sudoku
for f in tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.worker.json components.json .gitignore vite.config.ts; do
  cp ../omok/$f .
done
cp ../omok/src/lib/utils.ts src/lib/utils.ts
cp ../omok/src/components/ui/button.tsx src/components/ui/button.tsx
cp ../omok/src/components/ui/card.tsx src/components/ui/card.tsx
cp ../omok/src/components/ui/dialog.tsx src/components/ui/dialog.tsx
cp ../omok/src/routes/root.tsx src/routes/root.tsx
```

- [ ] **Step 2: package.json을 쓴다**

playset의 의존성에 three 3종을 더한 것이다. `@react-three/fiber` 9.x는 React 19 + react-dom을 요구하므로 버전을 낮추지 말 것.

```json
{
  "name": "sudoku",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "npm run build && wrangler dev",
    "test": "node --test test/*.test.mjs",
    "deploy": "npm run build && wrangler deploy",
    "og": "node contain-og.js",
    "cf-typegen": "wrangler types"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.3",
    "@react-three/fiber": "^9.7.0",
    "@tanstack/react-router": "^1.135.2",
    "cannon-es": "^0.20.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.545.0",
    "radix-ui": "^1.6.7",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "shadcn": "^4.19.0",
    "tailwind-merge": "^3.3.1",
    "three": "^0.185.1"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^5.20260826.1",
    "@tailwindcss/vite": "^4.1.14",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@types/three": "^0.185.4",
    "@vitejs/plugin-react": "^6.0.4",
    "sharp": "^0.34.5",
    "tailwindcss": "^4.1.14",
    "tw-animate-css": "^1.4.0",
    "typescript": "~6.0.2",
    "vite": "^8.2.0",
    "wrangler": "^4.127.0"
  }
}
```

- [ ] **Step 3: wrangler.jsonc를 쓴다**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "sudoku",
  "compatibility_date": "2026-08-27",
  "main": "src/og-lang.ts",
  "assets": {
    // Vite build output. run_worker_first lets src/og-lang.ts rewrite the very
    // first HTML for ?lang= before the assets binding replies.
    "directory": "./dist",
    "not_found_handling": "single-page-application",
    "binding": "ASSETS",
    "run_worker_first": true
  },
  "routes": [
    {
      "pattern": "sudoku.try-dabble.com",
      "custom_domain": true
    }
  ],
  "observability": {
    "enabled": true
  }
}
```

- [ ] **Step 4: src/index.css를 쓴다**

색 값은 원본 `src/features/game/game-theme.ts`와 같아야 한다. Task 4에서 두 값이 일치하는지 테스트로 고정한다.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

/*
  스도쿠 3D — a wooden puzzle board on a dark desk.
  The page is near-black walnut; the board is oiled hardwood under a warm
  lamp, and the digits are glazed ceramic tiles that clink into place. The
  accent is a lacquer vermilion, used only for conflicts and the timer.
  Deliberately NOT the washi paper of omok, the pixel night of jump-map, or
  the cream toy tray of playset. shadcn is the kit, not the look.
  Every value here mirrors src/lib/game/game-theme.ts, which the 3D materials
  read from; test/board3d.test.mjs asserts the two never drift apart.
*/

@theme {
  --color-canvas: #18120f;
  --color-charcoal: #2a211c;
  --color-cream: #f7f0e2;
  --color-cream-muted: #e4dac8;
  --color-ink: #34251e;
  --color-ink-muted: #756257;
  --color-vermilion: #a7342d;
  --color-walnut: #5b321f;
  --color-walnut-dark: #2d1a12;
  --color-walnut-light: #8a5535;
  --font-display: Georgia, "Noto Serif", serif;
}

body {
  background: var(--color-canvas);
  color: var(--color-cream);
}
```

- [ ] **Step 5: index.html을 쓴다**

`#local-only`, `h1#brand-title`, `#brand-sub`가 Worker의 재작성 대상이다. id를 바꾸면 Task 9의 테스트가 깨진다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>스도쿠 3D</title>
  <meta name="description" content="따뜻한 원목 보드와 세라믹 숫자 타일로 즐기는 3D 스도쿠입니다. 다섯 단계 난이도, 메모, 실행 취소, 정답 확인을 지원하며 손가락·마우스·Apple Pencil로 플레이할 수 있습니다." />
  <meta name="theme-color" content="#18120f" />
  <meta name="application-name" content="스도쿠 3D" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="스도쿠 3D" />
  <link rel="canonical" href="https://sudoku.try-dabble.com/" />
  <link rel="alternate" hreflang="ko" href="https://sudoku.try-dabble.com/?lang=ko" />
  <link rel="alternate" hreflang="en" href="https://sudoku.try-dabble.com/?lang=en" />
  <link rel="alternate" hreflang="ja" href="https://sudoku.try-dabble.com/?lang=ja" />
  <link rel="alternate" hreflang="x-default" href="https://sudoku.try-dabble.com/" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Sudoku 3D" />
  <meta property="og:url" content="https://sudoku.try-dabble.com/" />
  <meta property="og:title" content="스도쿠 3D" />
  <meta property="og:description" content="따뜻한 원목 보드와 세라믹 숫자 타일로 즐기는 3D 스도쿠입니다. 다섯 단계 난이도, 메모, 실행 취소, 정답 확인을 지원하며 손가락·마우스·Apple Pencil로 플레이할 수 있습니다." />
  <meta property="og:image" content="https://sudoku.try-dabble.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:locale:alternate" content="en_US" />
  <meta property="og:locale:alternate" content="ja_JP" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="스도쿠 3D" />
  <meta name="twitter:description" content="원목 보드에 세라믹 숫자 타일을 올리는 3D 스도쿠. 다섯 단계 난이도, 메모, 실행 취소." />
  <meta name="twitter:image" content="https://sudoku.try-dabble.com/og-image.png" />

  <link rel="icon" href="https://sudoku.try-dabble.com/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="192x192" href="https://sudoku.try-dabble.com/icons/icon-192.png" />
  <link rel="apple-touch-icon" href="https://sudoku.try-dabble.com/icons/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.webmanifest" />
</head>
<body>
  <!--
    Everything inside #root is the no-JS shell. The Worker (src/og-lang.ts)
    rewrites #local-only, h1#brand-title and #brand-sub here before a single
    script runs, so crawlers — which never execute JS — get the requested
    ?lang= in the FIRST HTML. React mounts over this subtree with the
    identical masthead, then adds the board.
  -->
  <div id="root">
    <div class="sd-shell">
      <p class="sd-notice" id="local-only" role="note">이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.</p>
      <header class="sd-masthead">
        <h1 id="brand-title">스도쿠 3D</h1>
        <p id="brand-sub">원목 보드와 세라믹 타일</p>
      </header>
    </div>
  </div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 6: 셸 컴포넌트 두 개를 쓴다**

`src/components/local-only-banner.tsx`:

```tsx
/** The same sentence the Worker puts in the first HTML, re-rendered by React. */
export function LocalOnlyBanner({ text }: { readonly text: string }) {
  return (
    <p className="sd-notice text-center text-xs text-cream-muted" id="local-only" role="note">
      {text}
    </p>
  );
}
```

`src/components/masthead.tsx`:

```tsx
export function Masthead({ title, sub }: { readonly title: string; readonly sub: string }) {
  return (
    <header className="sd-masthead flex flex-col items-center gap-1 py-3">
      <h1 className="font-display text-2xl text-cream" id="brand-title">
        {title}
      </h1>
      <p className="text-xs text-cream-muted" id="brand-sub">
        {sub}
      </p>
    </header>
  );
}
```

- [ ] **Step 7: 라우터와 엔트리를 쓴다**

`src/router.tsx`:

```tsx
import { createRouter } from "@tanstack/react-router";

import { homeRoute } from "@/routes/home";
import { rootRoute } from "@/routes/root";

const routeTree = rootRoute.addChildren([homeRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  // Static assets (privacy.html, terms.html, og images) are served by the
  // assets binding; anything else the SPA fallback hands us belongs at home.
  defaultNotFoundComponent: () => {
    if (typeof window !== "undefined") window.location.replace("/");
    return null;
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import "./index.css";
import { router } from "@/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
```

`src/routes/home.tsx` — 이 태스크에서는 마스트헤드만 띄우는 자리표시자다. Task 8에서 게임을 붙인다.

```tsx
import { createRoute } from "@tanstack/react-router";

import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { rootRoute } from "@/routes/root";

function Home() {
  return (
    <div className="sd-shell mx-auto flex min-h-dvh max-w-3xl flex-col">
      <LocalOnlyBanner text="이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다." />
      <Masthead sub="원목 보드와 세라믹 타일" title="스도쿠 3D" />
    </div>
  );
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});
```

- [ ] **Step 8: og-lang.ts 자리표시자를 쓴다**

`tsconfig.worker.json`이 이 파일을 요구하므로 지금 최소 형태로 둔다. Task 9에서 완성한다.

```ts
type Env = { ASSETS: Fetcher };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
```

- [ ] **Step 9: 설치하고 빌드한다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
npm install
npm run build
```

Expected: `tsc -b` 에러 0, `dist/index.html`과 `dist/assets/*.js` 생성.

- [ ] **Step 10: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Stand up the Vite shell the other apps already share."
```

---

### Task 2: i18n 시트와 언어 결정

**Files:**
- Create: `src/lib/i18n/{locales.ts,messages.ts,ko.ts,en.ts,ja.ts,index.ts,resolve-lang.ts}`
- Create: `src/lib/metadata.ts`
- Test: `test/i18n.test.mjs`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Locale = 'ko' | 'en' | 'ja'`, `SUPPORTED_LOCALES`, `isLocale(value: string): value is Locale`, `defaultLocale(): Locale` — `@/lib/i18n/locales`
  - `t(locale: Locale, key: MessageKey): string`, `messages`, `localizedFaq(locale)` → `{ question, answer }[]`, `type MessageKey` — `@/lib/i18n`
  - `detectLang(searchLang?: string | null): Locale`, `rememberLang(locale: Locale): void`, `HTML_LANG`, `OG_LOCALE`, `OG_IMAGE`, `LANG_KEY = 'sudoku_lang'` — `@/lib/i18n/resolve-lang`
  - `localeMetadata(locale: Locale): LocaleMetadata` — `@/lib/metadata`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`test/i18n.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { SUPPORTED_LOCALES, defaultLocale, isLocale } from "../src/lib/i18n/locales.ts";
import { localizedFaq, messages, t } from "../src/lib/i18n/index.ts";
import { HTML_LANG, LANG_KEY, OG_IMAGE, OG_LOCALE } from "../src/lib/i18n/resolve-lang.ts";

test("supports exactly ko, en and ja", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["ko", "en", "ja"]);
  assert.equal(isLocale("ja"), true);
  assert.equal(isLocale("zh"), false);
  assert.equal(defaultLocale(), "ko");
});

test("every locale carries every key the Korean sheet defines", () => {
  const keys = Object.keys(messages.ko);
  for (const locale of SUPPORTED_LOCALES) {
    const sheet = messages[locale];
    for (const key of keys) {
      assert.equal(typeof sheet[key], "string", `${locale}.${key} is missing`);
      assert.notEqual(sheet[key].trim(), "", `${locale}.${key} is blank`);
    }
    assert.deepEqual(Object.keys(sheet).sort(), keys.slice().sort(), `${locale} has extra keys`);
  }
});

test("t reads the requested locale", () => {
  assert.equal(t("ko", "appTitle"), "스도쿠 3D");
  assert.equal(t("en", "appTitle"), "3D Sudoku");
  assert.equal(t("ja", "appTitle"), "3D数独");
});

test("localizedFaq returns three question-answer pairs per locale", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const faq = localizedFaq(locale);
    assert.equal(faq.length, 3);
    for (const entry of faq) {
      assert.ok(entry.question.length > 0);
      assert.ok(entry.answer.length > 0);
    }
  }
});

test("the language tables cover every locale and never point zh at anything", () => {
  assert.equal(LANG_KEY, "sudoku_lang");
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(typeof HTML_LANG[locale], "string");
    assert.match(OG_LOCALE[locale], /^[a-z]{2}_[A-Z]{2}$/);
    assert.match(OG_IMAGE[locale], /^https:\/\/sudoku\.try-dabble\.com\/og-image/);
  }
  assert.equal(OG_IMAGE.ko, "https://sudoku.try-dabble.com/og-image.png");
  assert.equal(OG_IMAGE.en, "https://sudoku.try-dabble.com/og-image-en.png");
  assert.equal(OG_IMAGE.ja, "https://sudoku.try-dabble.com/og-image-ja.png");
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku && npm test
```

Expected: FAIL — `Cannot find module '../src/lib/i18n/locales.ts'`

- [ ] **Step 3: 원본 i18n 파일을 옮긴다**

```bash
SRC=/Users/charles/1git/sudoku
APP=/Users/charles/1git/try-dabble-apps/apps/sudoku
mkdir -p $APP/src/lib/i18n
cp $SRC/src/config/locales.ts        $APP/src/lib/i18n/locales.ts
cp $SRC/src/i18n/ko.ts               $APP/src/lib/i18n/ko.ts
cp $SRC/src/i18n/en.ts               $APP/src/lib/i18n/en.ts
cp $SRC/src/i18n/ja.ts               $APP/src/lib/i18n/ja.ts
cp $SRC/src/i18n/messages.ts         $APP/src/lib/i18n/messages.ts
cp $SRC/src/i18n/i18n.ts             $APP/src/lib/i18n/index.ts
cp $SRC/src/web/metadata.ts          $APP/src/lib/metadata.ts
cp $SRC/src/types/index.ts           $APP/src/lib/types.ts
```

- [ ] **Step 4: import 경로를 고친다**

원본 alias `@/src/...`를 이 앱의 `@/lib/...`로 바꾼다.

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku/src/lib
sed -i '' "s#@/src/config/locales#@/lib/i18n/locales#g" i18n/index.ts metadata.ts
sed -i '' "s#@/src/i18n/i18n#@/lib/i18n#g" metadata.ts
sed -i '' "s#@/src/types#@/lib/types#g" i18n/*.ts metadata.ts
```

`src/lib/i18n/index.ts`가 `./en`, `./ja`, `./ko`, `./messages`를 상대 경로로 부르는 것은 그대로 둔다 — 같은 디렉터리에 있다.

- [ ] **Step 5: resolve-lang.ts를 쓴다**

omok `src/lib/i18n.ts`의 결정 순서와 같다. Worker는 쿼리와 쿠키만 볼 수 있으므로 그 둘이 localStorage보다 앞서야 첫 HTML과 마운트된 앱이 어긋나지 않는다.

```ts
import { isLocale, type Locale } from "./locales";

/** This app's own memory of the pick. The Worker never reads it. */
export const LANG_KEY = "sudoku_lang";

export const HTML_LANG: Record<Locale, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
};

export const OG_LOCALE: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
};

export const OG_IMAGE: Record<Locale, string> = {
  ko: "https://sudoku.try-dabble.com/og-image.png",
  en: "https://sudoku.try-dabble.com/og-image-en.png",
  ja: "https://sudoku.try-dabble.com/og-image-ja.png",
};

function readCookieLang(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)td_lang=(ko|en|ja)(?:;|$)/);
  return m && isLocale(m[1]) ? m[1] : null;
}

function readStoredLang(): Locale | null {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved !== null && isLocale(saved) ? saved : null;
  } catch {
    return null;
  }
}

/**
 * ?lang= wins — the language picker navigates there, so an in-page pick beats
 * everything below — then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language, then this app's own
 * sudoku_lang, and Korean last. The Worker only ever sees the query and the
 * cookie, so those two must outrank localStorage or the served HTML and the
 * mounted app would disagree.
 */
export function detectLang(searchLang?: string | null): Locale {
  if (typeof searchLang === "string" && isLocale(searchLang)) {
    rememberLang(searchLang);
    return searchLang;
  }
  const cookie = readCookieLang();
  if (cookie) {
    rememberLang(cookie);
    return cookie;
  }
  return readStoredLang() ?? "ko";
}

export function rememberLang(locale: Locale): void {
  try {
    localStorage.setItem(LANG_KEY, locale);
    document.cookie = `td_lang=${locale}; path=/; domain=.try-dabble.com; max-age=31536000; samesite=lax`;
  } catch {
    /* private mode — the language just won't stick */
  }
}
```

- [ ] **Step 6: metadata.ts의 경로 방식을 쿼리 방식으로 고친다**

원본의 `alternates`가 `/ko`·`/en`·`/ja` 경로를 가리킨다. `?lang=`으로 바꾼다.

```ts
const alternates = {
  ko: `${SITE_ORIGIN}/?lang=ko`,
  en: `${SITE_ORIGIN}/?lang=en`,
  ja: `${SITE_ORIGIN}/?lang=ja`,
  'x-default': SITE_ORIGIN,
} as const;
```

원본 `metadataCopy`의 ko/en/ja 문구는 그대로 둔다. `ogAlternateLocales`도 그대로다.

- [ ] **Step 7: 테스트가 통과하는지 확인한다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku && npm test && npm run build
```

Expected: 5개 테스트 PASS, 빌드 성공.

`t("en", "appTitle")`이 `3D Sudoku`가 아니면 원본 `en.ts`의 `appTitle` 값을 확인하고, 테스트가 아니라 시트를 Global Constraints의 브랜드명에 맞춘다.

- [ ] **Step 8: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Move the three message sheets and pick the language the try-dabble way."
```

---

### Task 3: 스도쿠 도메인 이관

퍼즐의 규칙·솔버·생성기·난이도 평가·리듀서. 전부 순수 함수라 로직은 한 줄도 바뀌지 않는다.

**Files:**
- Create: `src/lib/sudoku/domain/{grid,solver,puzzle-generator,rating,game-reducer,game-state,random-solution,layout}.ts`
- Create: `src/lib/sudoku/data/{puzzle-definition,puzzles.generated,puzzles-6x6}.ts`
- Test: `test/sudoku-domain.test.mjs`

**Interfaces:**
- Consumes: `@/lib/types`(Task 2에서 생성)
- Produces:
  - `gameReducer(state: GameState, action: GameAction): GameState`, `createGame(puzzle: PuzzleDefinition): GameState`, `isComplete(state: GameState): boolean` — `@/lib/sudoku/domain/game-reducer`
  - `generatePuzzle(...)` — `@/lib/sudoku/domain/puzzle-generator`
  - `type Difficulty` — `@/lib/sudoku/domain/rating`
  - `type BoardSize = 6 | 9`, `layoutForSize(size)`, `SIX_BY_SIX`, `NINE_BY_NINE` — `@/lib/sudoku/domain/layout`
  - `PUZZLES: readonly PuzzleDefinition[]`, `type PuzzleDefinition` — `@/lib/sudoku/data/puzzles.generated`

- [ ] **Step 1: 원본 파일을 옮기고 경로를 고친다**

```bash
SRC=/Users/charles/1git/sudoku
APP=/Users/charles/1git/try-dabble-apps/apps/sudoku
mkdir -p $APP/src/lib/sudoku/{domain,data}
for f in grid solver puzzle-generator rating game-reducer game-state random-solution layout; do
  cp $SRC/src/features/sudoku/domain/$f.ts $APP/src/lib/sudoku/domain/$f.ts
done
for f in puzzle-definition puzzles.generated puzzles-6x6; do
  cp $SRC/src/features/sudoku/data/$f.ts $APP/src/lib/sudoku/data/$f.ts
done
cd $APP/src/lib/sudoku
sed -i '' "s#@/src/types#@/lib/types#g" domain/*.ts data/*.ts
grep -rn "@/src/" . && echo "남은 원본 alias가 있다 — 위 목록을 손으로 고칠 것" || echo "alias 정리 완료"
```

- [ ] **Step 2: 원본 vitest 테스트를 node:test로 옮겨 쓴다**

옮길 원본 테스트 파일(전부 `$SRC/src/features/sudoku/` 아래):
`domain/grid.test.ts`, `domain/solver.test.ts`, `domain/puzzle-generator.test.ts`,
`domain/rating.test.ts`, `domain/game-reducer.test.ts`, `domain/random-solution.test.ts`,
`data/puzzles.test.ts`, `data/puzzles-6x6.test.ts`

변환 규칙 — 기계적으로 적용한다:

| vitest | node:test |
|---|---|
| `import { describe, expect, it } from 'vitest'` | `import assert from "node:assert/strict"; import test from "node:test";` |
| `describe('X', () => { it('y', ...) })` | `test("X — y", ...)` (describe를 없애고 이름을 합친다) |
| `expect(a).toBe(b)` | `assert.equal(a, b)` |
| `expect(a).toEqual(b)` | `assert.deepEqual(a, b)` |
| `expect(a).toBeNull()` | `assert.equal(a, null)` |
| `expect(a).toBeTruthy()` / `toBeFalsy()` | `assert.ok(a)` / `assert.ok(!a)` |
| `expect(a).toHaveLength(n)` | `assert.equal(a.length, n)` |
| `expect(() => f()).toThrow()` | `assert.throws(() => f())` |
| `expect(a).toBeGreaterThan(b)` | `assert.ok(a > b)` |
| `import ... from './grid'` | `import ... from "../src/lib/sudoku/domain/grid.ts"` (확장자 필수) |

원본이 `$SRC/src/test/seeded-random.ts`를 쓰면 그 파일도 `$APP/src/lib/sudoku/domain/seeded-random.ts`로 함께 옮기고 import 경로를 맞춘다.

한 예 — `domain/grid.test.ts`의 첫 케이스가 이렇게 바뀐다:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { parseGrid } from "../src/lib/sudoku/domain/grid.ts";
import { PUZZLES } from "../src/lib/sudoku/data/puzzles.generated.ts";

test("grid — parses an 81-character puzzle string", () => {
  const grid = parseGrid(PUZZLES[0].puzzle);
  assert.equal(grid.length, 81);
  assert.equal(grid[0], 3);
});
```

여덟 파일 모두 `test/sudoku-domain.test.mjs` 하나에 넣는다. 각 케이스 이름 앞에 원본 파일명을 붙여 어디서 왔는지 남긴다(`grid — ...`, `solver — ...`).

- [ ] **Step 3: 테스트를 돌린다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku && npm test
```

Expected: PASS. 실패하면 변환 실수이지 로직 문제가 아니다 — 원본 vitest 테스트와 나란히 놓고 단언을 비교한다.

- [ ] **Step 4: 빌드로 타입을 확인한다**

```bash
npm run build
```

Expected: `tsc -b` 에러 0.

`erasableSyntaxOnly` 때문에 enum이 있으면 여기서 걸린다. 그럴 경우 `as const` 객체 + union 타입으로 바꾼다.

- [ ] **Step 5: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Move the puzzle rules over untouched, tests and all."
```

---

### Task 4: board3d와 game의 순수 로직 이관

보드 배치, 씬 수학, 입력 해석, 물리 세계, 완성 모션, 프레임 예산, 뷰모델. R3F 훅(`useFrame`/`useThree`) 외에는 DOM도 RN도 쓰지 않는다.

**Files:**
- Create: `src/lib/board3d/{board-layout,scene-math,board-input,physics-world,completion-motion,frame-budget,board-cell-role,board-initialization,board-camera,scene-assets,use-physics-effects}.ts`
- Create: `src/lib/game/{game-view-model,game-safe-area,game-theme}.ts`
- Create: `src/lib/pointer.ts`
- Test: `test/board3d.test.mjs`

**Interfaces:**
- Consumes: `@/lib/types`, `@/lib/sudoku/domain/*`, `@/lib/i18n`
- Produces:
  - `MIN_INTERACTIVE_CANVAS_SIZE`, `MAX_INTERACTIVE_CANVAS_SIZE`, `calculateBoardViewport(width, height): BoardViewportLayout`, `nearestBoardScrollOffset(...)`, `nextBoardScrollOffset(...)`, `projectedCellHorizontalBounds(...)`, `type BoardScrollDirection` — `@/lib/board3d/board-layout`
  - `createPhysicsWorld()`, `type BeginDropOptions`, `type PhysicsSnapshot` — `@/lib/board3d/physics-world`
  - `usePhysicsEffects(onCollision?): PhysicsEffects` — `@/lib/board3d/use-physics-effects`
  - `SCENE_ASSET_SOURCES`, `clearSceneAssetCache(clear?)` — `@/lib/board3d/scene-assets`
  - `actionForDigit`, `createSessionGame`, `cellAccessibilityLabel`, `feedbackEffectsForTransition`, `moveSelectedCell`, `boardCommandForKey`, `nextGameAnnouncement`, `gameAnnouncementPresentation`, `INITIAL_GAME_ANNOUNCEMENT`, `type BoardKeyboardCommand`, `type GameAnnouncement` — `@/lib/game/game-view-model`
  - `gameColors`, `displayFont`, `hitSlop`, `ceramicShadow`, `woodGradient` — `@/lib/game/game-theme`
  - `webSafeAreaPadding(minimum): WebSafeAreaPadding` — `@/lib/game/game-safe-area`
  - `normalizeWebPointer(...)` — `@/lib/pointer`

- [ ] **Step 1: 파일을 옮기고 경로를 고친다**

```bash
SRC=/Users/charles/1git/sudoku
APP=/Users/charles/1git/try-dabble-apps/apps/sudoku
mkdir -p $APP/src/lib/{board3d,game}
for f in board-layout scene-math board-input physics-world completion-motion \
         frame-budget board-cell-role board-initialization board-camera \
         scene-assets use-physics-effects; do
  cp $SRC/src/features/board3d/$f.ts $APP/src/lib/board3d/$f.ts
done
for f in game-view-model game-safe-area game-theme; do
  cp $SRC/src/features/game/$f.ts $APP/src/lib/game/$f.ts
done
cp $SRC/src/platform/pointer.web.ts $APP/src/lib/pointer.ts

cd $APP/src/lib
sed -i '' "s#@/src/platform/r3f#@react-three/fiber#g" board3d/*.ts
sed -i '' "s#@/src/types#@/lib/types#g" board3d/*.ts game/*.ts pointer.ts
sed -i '' "s#@/src/config/locales#@/lib/i18n/locales#g" game/*.ts
sed -i '' "s#@/src/i18n/i18n#@/lib/i18n#g" game/*.ts
sed -i '' "s#from '../sudoku/domain/#from '@/lib/sudoku/domain/#g" game/*.ts board3d/*.ts
grep -rn "@/src/\|react-native\|expo-" board3d game pointer.ts && echo "남은 참조를 손으로 고칠 것" || echo "정리 완료"
```

- [ ] **Step 2: scene-assets.ts의 에셋 참조를 public 경로로 바꾼다**

번들러가 png를 import하던 것을 정적 경로 문자열로 바꾼다. 텍스처는 Task 6에서 `public/textures/`에 놓는다.

```ts
import { TextureLoader } from "three";

import { useLoader } from "@react-three/fiber";

export const SCENE_ASSET_SOURCES = {
  digitAtlas: "/textures/digits.png",
  wood: "/textures/wood.png",
} as const;

type CacheClear = (loader: typeof TextureLoader, input: string) => void;

export function clearSceneAssetCache(clear: CacheClear = useLoader.clear): void {
  clear(TextureLoader, SCENE_ASSET_SOURCES.digitAtlas);
  clear(TextureLoader, SCENE_ASSET_SOURCES.wood);
}
```

- [ ] **Step 3: use-physics-effects.ts에서 AppState를 걷어낸다**

원본은 RN `AppState`와 `document.visibilitychange`를 둘 다 본다. 웹에는 후자만 있다. `import { AppState } from 'react-native'` 줄과 `appActive` 변수, `appStateSubscription`을 지우고 일시정지 판단을 `documentVisible` 하나로 줄인다:

```ts
  useEffect(() => {
    const updatePauseState = (): void => {
      if (document.visibilityState !== "visible") {
        physics.pause();
        return;
      }
      physics.resume();
      if (physics.snapshots().some((entry) => !entry.settled)) {
        invalidate();
      }
    };

    document.addEventListener("visibilitychange", updatePauseState);
    updatePauseState();

    return () => {
      document.removeEventListener("visibilitychange", updatePauseState);
      physics.dispose();
    };
  }, [invalidate, physics]);
```

`beginDrop`, `cancel`, `useFrame` 블록과 반환값은 손대지 않는다.

- [ ] **Step 4: game-safe-area.ts에서 네이티브 전용 함수를 지운다**

`nativeSafeAreaPadding`과 `NativeSafeAreaPadding` 타입을 지운다. 웹에서 쓰지 않고, `noUnusedLocals`가 아니라 죽은 코드라 지운다. `SafeAreaInsetsValue`, `WebSafeAreaPadding`, `webSafeAreaPadding`은 남긴다.

- [ ] **Step 5: 원본 테스트를 옮겨 쓴다**

옮길 원본 테스트: `$SRC/src/features/board3d/`의 `board-layout.test.ts`, `scene-math.test.ts`, `board-input.test.ts`, `physics-world.test.ts`, `completion-motion.test.ts`, `frame-budget.test.ts`, `board-cell-role.test.ts`, `board-initialization.test.ts`, `scene-assets.test.ts`; `$SRC/src/features/game/`의 `game-view-model.test.ts`, `game-safe-area.test.ts`; `$SRC/src/platform/pointer.test.ts`.

Task 3 Step 2의 변환 규칙을 그대로 쓴다. import는 `../src/lib/board3d/<name>.ts` 형태다.

`scene-assets.test.ts`는 원본이 번들러가 만든 모듈 경로를 기대할 수 있다. Step 2에서 값을 `/textures/*.png`로 바꿨으므로 단언도 그 값으로 맞춘다.

`game-safe-area.test.ts`에서 `nativeSafeAreaPadding` 케이스는 Step 4에서 지운 함수라 함께 뺀다.

- [ ] **Step 6: 테마 값이 CSS와 어긋나지 않게 고정하는 테스트를 더한다**

같은 파일 끝에 붙인다.

```js
import { readFileSync } from "node:fs";

import { gameColors } from "../src/lib/game/game-theme.ts";

test("game-theme colours and the CSS tokens in index.css are the same values", () => {
  const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
  const expected = {
    "--color-canvas": gameColors.canvas,
    "--color-charcoal": gameColors.charcoal,
    "--color-cream": gameColors.cream,
    "--color-cream-muted": gameColors.creamMuted,
    "--color-ink": gameColors.ink,
    "--color-ink-muted": gameColors.inkMuted,
    "--color-vermilion": gameColors.vermilion,
    "--color-walnut": gameColors.walnut,
    "--color-walnut-dark": gameColors.walnutDark,
    "--color-walnut-light": gameColors.walnutLight,
  };
  for (const [token, value] of Object.entries(expected)) {
    assert.match(
      css,
      new RegExp(`${token}:\\s*${value};`),
      `${token} in index.css must be ${value}`,
    );
  }
});
```

- [ ] **Step 7: 테스트와 빌드를 돌린다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku && npm test && npm run build
```

Expected: 전부 PASS, 빌드 성공.

- [ ] **Step 8: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Bring the board maths across and let the DOM decide when physics pauses."
```

---

### Task 5: 오디오 에셋 변환과 피드백 어댑터 웹 이식

컨트롤러(`audio-feedback-controller`, `background-music-controller`, `feedback-events`, `audio-volume`)는 순수 함수라 그대로 옮긴다. 바뀌는 것은 그 아래 어댑터 훅 세 개뿐이다.

**Files:**
- Create: `src/lib/feedback/{audio-feedback-controller,audio-volume,background-music-controller,feedback-events}.ts` (이관)
- Create: `src/lib/feedback/{use-audio-feedback,use-background-music,use-haptic-feedback}.ts` (새로 씀)
- Create: `public/audio/*.m4a`
- Test: `test/feedback.test.mjs`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `useAudioFeedback(enabled: boolean, volume?: number): PlayAudioFeedback` — `(effect: GameEffect, relativeImpactVelocity?: number) => void`
  - `useBackgroundMusic(enabled: boolean, volume?: number): StartBackgroundMusic` — `() => void`
  - `useHapticFeedback(enabled: boolean): PlayHapticFeedback` — `(effect: GameEffect) => void`
  - `type GameEffect`, `type FeedbackSound`, `feedbackFor`, `createFeedbackGate`, `isAudibleCollision` — `@/lib/feedback/feedback-events`

- [ ] **Step 1: 효과음을 m4a로 변환하고 배경음악을 복사한다**

wav 1.8MB가 200KB 남짓으로 줄어든다. 원본은 건드리지 않고 출력만 새 폴더에 쓴다.

```bash
SRC=/Users/charles/1git/sudoku
APP=/Users/charles/1git/try-dabble-apps/apps/sudoku
mkdir -p $APP/public/audio
for f in collision complete erase invalid new-game note pick place redo undo; do
  ffmpeg -y -loglevel error -i $SRC/assets/audio/$f.wav -c:a aac -b:a 96k $APP/public/audio/$f.m4a
done
cp $SRC/assets/audio/music-0{1,2,3}.m4a $APP/public/audio/
du -sh $APP/public/audio && ls -la $APP/public/audio
```

Expected: 효과음 10개가 각각 수십 KB, 음악 3곡은 원본 크기 그대로.

- [ ] **Step 2: 순수 컨트롤러를 옮긴다**

```bash
SRC=/Users/charles/1git/sudoku
APP=/Users/charles/1git/try-dabble-apps/apps/sudoku
mkdir -p $APP/src/lib/feedback
for f in audio-feedback-controller audio-volume background-music-controller feedback-events; do
  cp $SRC/src/services/feedback/$f.ts $APP/src/lib/feedback/$f.ts
done
grep -rn "react-native\|expo-" $APP/src/lib/feedback && echo "예상 밖 의존성" || echo "순수 확인"
```

- [ ] **Step 3: 컨트롤러 테스트를 옮겨 쓴다**

원본: `$SRC/src/services/feedback/`의 `audio-feedback-controller.test.ts`, `audio-volume.test.ts`, `background-music-controller.test.ts`, `feedback-events.test.ts`. Task 3 Step 2의 변환 규칙을 쓴다.

`vi.fn()`을 쓰는 곳은 이렇게 바꾼다:

```js
function spy(impl = () => {}) {
  const calls = [];
  const fn = (...args) => {
    calls.push(args);
    return impl(...args);
  };
  fn.calls = calls;
  return fn;
}
```

`expect(mock).toHaveBeenCalledTimes(n)` → `assert.equal(fn.calls.length, n)`,
`expect(mock).toHaveBeenCalledWith(a)` → `assert.deepEqual(fn.calls.at(-1), [a])`.

원본 `use-audio-feedback.test.tsx`와 `use-background-music.test.tsx`는 React 렌더링이 필요하므로 옮기지 않는다. 두 파일이 검증하던 동작(마운트 시 preload, 비활성 시 pause, 볼륨 반영, enabled 토글)은 컨트롤러 테스트가 이미 덮는다.

- [ ] **Step 4: use-audio-feedback.ts를 웹으로 다시 쓴다**

`expo-audio`의 `createAudioPlayer`/`preload`/`setIsAudioActiveAsync`가 `HTMLAudioElement`로 바뀐다. 웹에는 오디오 세션 개념이 없으므로 `setAudioSessionActive`는 사라지고, `AppState` 대신 `document.visibilitychange`가 활성 여부를 준다.

```ts
import { useCallback, useEffect, useState } from "react";

import { createAudioFeedbackController } from "./audio-feedback-controller";
import { applyVolumePercentage } from "./audio-volume";
import {
  createFeedbackGate,
  feedbackFor,
  isAudibleCollision,
  type FeedbackSound,
  type GameEffect,
} from "./feedback-events";

/**
 * Served from public/audio. The wavs the native app shipped are aac here —
 * a tenth of the bytes, and every browser that runs WebGL plays aac.
 */
const AUDIO_SOURCES: Readonly<Record<FeedbackSound, string>> = {
  collision: "/audio/collision.m4a",
  complete: "/audio/complete.m4a",
  erase: "/audio/erase.m4a",
  invalid: "/audio/invalid.m4a",
  newGame: "/audio/new-game.m4a",
  note: "/audio/note.m4a",
  pick: "/audio/pick.m4a",
  place: "/audio/place.m4a",
  redo: "/audio/redo.m4a",
  undo: "/audio/undo.m4a",
};

export type PlayAudioFeedback = (
  effect: GameEffect,
  relativeImpactVelocity?: number,
) => void;

type Players = Readonly<Record<FeedbackSound, HTMLAudioElement>>;

function createPlayers(): Players | null {
  if (typeof Audio === "undefined") {
    return null;
  }
  const sounds = Object.keys(AUDIO_SOURCES) as FeedbackSound[];
  const entries = sounds.map((sound) => {
    const element = new Audio();
    element.preload = "auto";
    return [sound, element] as const;
  });
  return Object.fromEntries(entries) as Players;
}

function createAudioFeedbackRuntime() {
  let players: Players | null = null;
  const gate = createFeedbackGate(80);
  const controller = createAudioFeedbackController({
    pauseAll(): void {
      Object.values(players ?? {}).forEach((element) => element.pause());
    },
    play(sound): void {
      // A play() before the first gesture rejects; that is a feedback no-op.
      void players?.[sound].play().catch(() => undefined);
    },
    preload(): Promise<void> {
      const elements = Object.values(players ?? {});
      if (elements.length === 0) {
        return Promise.resolve();
      }
      elements.forEach((element) => element.load());
      return Promise.resolve();
    },
    prepare(): void {
      if (!players) {
        return;
      }
      (Object.keys(AUDIO_SOURCES) as FeedbackSound[]).forEach((sound) => {
        const element = players![sound];
        if (element.getAttribute("src") !== AUDIO_SOURCES[sound]) {
          element.src = AUDIO_SOURCES[sound];
        }
      });
    },
    seek(sound): Promise<void> {
      const element = players?.[sound];
      if (!element) {
        return Promise.resolve();
      }
      element.pause();
      try {
        element.currentTime = 0;
      } catch {
        // Seeking before metadata lands is a no-op, not a failure.
      }
      return Promise.resolve();
    },
  });

  return Object.freeze({
    attachPlayers(next: Players | null): void {
      players = next;
    },
    controller,
    gate,
    setVolume(volume: number): void {
      applyVolumePercentage(Object.values(players ?? {}), volume);
    },
  });
}

export function useAudioFeedback(enabled: boolean, volume = 100): PlayAudioFeedback {
  const [runtime] = useState(createAudioFeedbackRuntime);
  const { controller, gate } = runtime;

  useEffect(() => {
    const players = createPlayers();
    runtime.attachPlayers(players);

    controller.mount();
    const syncActive = (): void => {
      controller.setActive(document.visibilityState === "visible");
    };
    syncActive();
    document.addEventListener("visibilitychange", syncActive);

    return () => {
      document.removeEventListener("visibilitychange", syncActive);
      controller.dispose();
      runtime.attachPlayers(null);
      Object.values(players ?? {}).forEach((element) => {
        element.pause();
        element.removeAttribute("src");
      });
    };
  }, [controller, runtime]);

  useEffect(() => {
    runtime.setVolume(volume);
  }, [runtime, volume]);

  useEffect(() => {
    controller.setEnabled(enabled);
    if (!enabled) {
      gate.reset();
    }
  }, [controller, enabled, gate]);

  return useCallback((effect, relativeImpactVelocity) => {
    if (
      !enabled
      || (relativeImpactVelocity !== undefined && !isAudibleCollision(relativeImpactVelocity))
    ) {
      return;
    }

    const { sound } = feedbackFor(effect);
    if (!gate.allow(sound, Date.now())) {
      return;
    }

    void controller.request(sound);
  }, [controller, enabled, gate]);
}
```

- [ ] **Step 5: use-background-music.ts를 웹으로 다시 쓴다**

8.8MB가 첫 로드에 걸리면 안 된다. `preload = "none"`으로 두고 `load(track)`이 불릴 때만 src를 준다 — 컨트롤러는 배경음악이 켜졌을 때만 그것을 부른다.

```ts
import { useCallback, useEffect, useState } from "react";

import { applyVolumePercentage } from "./audio-volume";
import {
  createBackgroundMusicController,
  type MusicTrackIndex,
} from "./background-music-controller";

/**
 * Three tracks, about 3MB each. preload="none" plus a src assigned only when
 * the controller asks for a track means a player who never turns music on
 * never downloads them. They are deliberately outside the service worker
 * precache for the same reason.
 */
const MUSIC_SOURCES = [
  "/audio/music-01.m4a",
  "/audio/music-02.m4a",
  "/audio/music-03.m4a",
] as const;

export type StartBackgroundMusic = () => void;

function createBackgroundMusicRuntime() {
  let player: HTMLAudioElement | null = null;
  const controller = createBackgroundMusicController({
    load(track: MusicTrackIndex): void {
      if (!player) {
        throw new Error("Background music player is unavailable");
      }
      player.src = MUSIC_SOURCES[track];
      player.load();
    },
    pause(): void {
      player?.pause();
    },
    play(): void {
      void player?.play().catch(() => undefined);
    },
    random: Math.random,
    subscribeToFinish(listener): () => void {
      const element = player;
      if (!element) {
        return () => {};
      }
      element.addEventListener("ended", listener);
      return () => element.removeEventListener("ended", listener);
    },
  });

  return Object.freeze({
    attach(next: HTMLAudioElement | null): void {
      player = next;
    },
    controller,
    setVolume(volume: number): void {
      if (player) {
        applyVolumePercentage([player], volume);
      }
    },
  });
}

export function useBackgroundMusic(enabled: boolean, volume = 18): StartBackgroundMusic {
  const [runtime] = useState(createBackgroundMusicRuntime);
  const { controller } = runtime;

  useEffect(() => {
    let player: HTMLAudioElement | null = null;
    if (typeof Audio !== "undefined") {
      player = new Audio();
      player.loop = false;
      player.preload = "none";
      runtime.attach(player);
    }

    controller.mount();
    const syncActive = (): void => {
      controller.setActive(document.visibilityState === "visible");
    };
    syncActive();
    document.addEventListener("visibilitychange", syncActive);

    return () => {
      document.removeEventListener("visibilitychange", syncActive);
      controller.dispose();
      runtime.attach(null);
      player?.pause();
      player?.removeAttribute("src");
    };
  }, [controller, runtime]);

  useEffect(() => {
    runtime.setVolume(volume);
  }, [runtime, volume]);

  useEffect(() => {
    controller.setEnabled(enabled);
  }, [controller, enabled]);

  return useCallback(() => controller.startNext(), [controller]);
}
```

- [ ] **Step 6: use-haptic-feedback.ts를 웹으로 다시 쓴다**

`navigator.vibrate`는 데스크톱 사파리·크롬과 iOS에 없다. 없으면 조용히 아무것도 하지 않는다 — 소리와 화면 피드백이 대체 수단으로 남는다.

```ts
import { useCallback } from "react";

import { feedbackFor, type GameEffect } from "./feedback-events";

export type PlayHapticFeedback = (effect: GameEffect) => void;

/** Vibration API patterns standing in for the four native haptic styles. */
const PATTERNS = {
  selection: [10],
  light: [15],
  error: [30, 40, 30],
  success: [12, 40, 18],
} as const;

export function useHapticFeedback(enabled: boolean): PlayHapticFeedback {
  return useCallback((effect: GameEffect) => {
    if (!enabled || typeof navigator === "undefined" || !navigator.vibrate) {
      return;
    }
    const { haptic } = feedbackFor(effect);
    if (haptic === null) {
      return;
    }
    try {
      navigator.vibrate(PATTERNS[haptic]);
    } catch {
      // Unsupported vibration is a feedback no-op.
    }
  }, [enabled]);
}
```

- [ ] **Step 7: 테스트와 빌드를 돌린다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku && npm test && npm run build
```

Expected: 컨트롤러 테스트 PASS, 빌드 성공.

- [ ] **Step 8: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Swap expo-audio and haptics for what the browser already has."
```

---

### Task 6: 3D 보드 컴포넌트 이식

R3F 컴포넌트 대부분은 react-native를 쓰지 않아 파일명만 바뀐다. 다시 쓰는 것은 `View` 래퍼였던 `BoardCanvas.web.tsx`와 `Pressable/Text`로 된 `BoardErrorBoundary.tsx` 둘뿐이다.

**Files:**
- Create: `src/components/board3d/{board-scene,board-mesh,digit-tile,digit-tray,drop-target-indicator,board-initialization-gate,board-input}.tsx` (이관)
- Create: `src/components/board3d/{board-canvas,board-error-boundary}.tsx` (새로 씀)
- Create: `public/textures/{wood,digits}.png`

**Interfaces:**
- Consumes: `@/lib/board3d/*`, `@/lib/game/game-theme`, `@/lib/pointer`, `@/lib/types`
- Produces: `BoardCanvas(props: BoardCanvasProps)` — `@/components/board3d/board-canvas`. `BoardCanvasProps`는 `@/components/board3d/board-scene`에서 re-export한다(원본과 동일)

- [ ] **Step 1: 텍스처와 컴포넌트를 옮긴다**

```bash
SRC=/Users/charles/1git/sudoku
APP=/Users/charles/1git/try-dabble-apps/apps/sudoku
mkdir -p $APP/public/textures $APP/src/components/board3d
cp $SRC/assets/textures/wood.png   $APP/public/textures/wood.png
cp $SRC/assets/textures/digits.png $APP/public/textures/digits.png

cp $SRC/src/features/board3d/BoardScene.tsx              $APP/src/components/board3d/board-scene.tsx
cp $SRC/src/features/board3d/BoardMesh.tsx               $APP/src/components/board3d/board-mesh.tsx
cp $SRC/src/features/board3d/DigitTile.tsx               $APP/src/components/board3d/digit-tile.tsx
cp $SRC/src/features/board3d/DigitTray.tsx               $APP/src/components/board3d/digit-tray.tsx
cp $SRC/src/features/board3d/DropTargetIndicator.tsx     $APP/src/components/board3d/drop-target-indicator.tsx
cp $SRC/src/features/board3d/BoardInitializationGate.tsx $APP/src/components/board3d/board-initialization-gate.tsx
cp $SRC/src/features/board3d/BoardInput.web.tsx          $APP/src/components/board3d/board-input.tsx
```

- [ ] **Step 2: import 경로를 고친다**

원본은 형제 파일을 PascalCase 상대 경로로 부른다. 옮긴 이름에 맞춘다.

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku/src/components/board3d
sed -i '' \
  -e "s#@/src/platform/r3f#@react-three/fiber#g" \
  -e "s#@/src/platform/pointer#@/lib/pointer#g" \
  -e "s#@/src/types#@/lib/types#g" \
  -e "s#from './BoardScene'#from './board-scene'#g" \
  -e "s#from './BoardMesh'#from './board-mesh'#g" \
  -e "s#from './DigitTile'#from './digit-tile'#g" \
  -e "s#from './DigitTray'#from './digit-tray'#g" \
  -e "s#from './DropTargetIndicator'#from './drop-target-indicator'#g" \
  -e "s#from './BoardInitializationGate'#from './board-initialization-gate'#g" \
  -e "s#from './BoardErrorBoundary'#from './board-error-boundary'#g" \
  -e "s#from './BoardInput.web'#from './board-input'#g" \
  -e "s#from './board-layout'#from '@/lib/board3d/board-layout'#g" \
  -e "s#from './board-camera'#from '@/lib/board3d/board-camera'#g" \
  -e "s#from './board-cell-role'#from '@/lib/board3d/board-cell-role'#g" \
  -e "s#from './board-initialization'#from '@/lib/board3d/board-initialization'#g" \
  -e "s#from './board-input'#from '@/lib/board3d/board-input'#g" \
  -e "s#from './completion-motion'#from '@/lib/board3d/completion-motion'#g" \
  -e "s#from './frame-budget'#from '@/lib/board3d/frame-budget'#g" \
  -e "s#from './physics-world'#from '@/lib/board3d/physics-world'#g" \
  -e "s#from './scene-assets'#from '@/lib/board3d/scene-assets'#g" \
  -e "s#from './scene-math'#from '@/lib/board3d/scene-math'#g" \
  -e "s#from './use-physics-effects'#from '@/lib/board3d/use-physics-effects'#g" \
  -e "s#from '../game/game-theme'#from '@/lib/game/game-theme'#g" \
  -e "s#from '../sudoku/domain/#from '@/lib/sudoku/domain/#g" \
  *.tsx
```

주의: `board-input.tsx`는 자기 자신을 `@/lib/board3d/board-input`으로 바꾸면 안 된다. 위 sed의 `from './board-input'` 규칙이 이 파일에는 적용되지 않는지 확인하고, 잘못 바뀌었으면 되돌린다 — 컴포넌트가 쓰는 것은 `@/lib/board3d/board-input`의 순수 해석 함수이므로 대개 맞지만, 순환 참조가 생기면 직접 확인할 것.

```bash
grep -n "board-input" board-input.tsx
```

- [ ] **Step 3: board-error-boundary.tsx를 다시 쓴다**

원본 `BoardErrorBoundary.tsx`의 클래스 컴포넌트 로직(에러 상태, `canvasKey` 증가, `onRetry`)은 그대로 두고, 렌더 부분의 `View`/`Text`/`Pressable`만 DOM으로 바꾼다. 원본을 열어 상태 필드와 `getDerivedStateFromError`, `componentDidCatch`, render prop 시그니처를 그대로 옮겨오고, 폴백 UI만 이렇게 만든다:

```tsx
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-cream-muted">{this.props.errorMessage}</p>
        <button
          className="rounded-md border border-walnut-light bg-walnut px-4 py-2 text-sm text-cream"
          onClick={this.handleRetry}
          type="button"
        >
          {this.props.retryLabel}
        </button>
      </div>
    );
```

`children`이 `({ canvasKey, reportInitializationError }) => ReactNode` 형태의 render prop이라는 계약은 `board-canvas.tsx`가 그대로 쓰므로 바꾸지 않는다.

- [ ] **Step 4: board-canvas.tsx를 쓴다**

원본 `BoardCanvas.web.tsx`에서 `View` + `StyleSheet`를 div + Tailwind로 바꾼 것이다. 나머지는 같다.

```tsx
import { WebGLRenderer } from "three";

import { BoardErrorBoundary } from "./board-error-boundary";
import { BoardInput } from "./board-input";
import { BoardInitializationGate } from "./board-initialization-gate";
import type { BoardCanvasProps } from "./board-scene";
import { preflightWebGLRenderer } from "@/lib/board3d/board-initialization";
import { MIN_INTERACTIVE_CANVAS_SIZE } from "@/lib/board3d/board-layout";
import { clearSceneAssetCache } from "@/lib/board3d/scene-assets";

export type { BoardCanvasProps } from "./board-scene";

function preflightWebGL(): void {
  if (typeof document === "undefined") {
    return;
  }

  preflightWebGLRenderer(
    () => document.createElement("canvas"),
    (canvas) => new WebGLRenderer({ alpha: true, antialias: true, canvas }),
  );
}

export function BoardCanvas(props: BoardCanvasProps) {
  const { errorMessage, retryLabel } = props;

  return (
    <div
      className="flex-1 overflow-hidden"
      style={{
        minHeight: MIN_INTERACTIVE_CANVAS_SIZE,
        minWidth: MIN_INTERACTIVE_CANVAS_SIZE,
      }}
    >
      <BoardErrorBoundary
        errorMessage={errorMessage}
        onRetry={clearSceneAssetCache}
        retryLabel={retryLabel}
      >
        {({ canvasKey, reportInitializationError }) => (
          <BoardInitializationGate
            initialize={preflightWebGL}
            key={canvasKey}
            onFailure={reportInitializationError}
          >
            <BoardInput {...props} />
          </BoardInitializationGate>
        )}
      </BoardErrorBoundary>
    </div>
  );
}
```

- [ ] **Step 5: BoardErrorBoundary 테스트를 로직 테스트로 낮춘다**

원본 `$SRC/src/features/board3d/BoardErrorBoundary.test.tsx`는 React 렌더링이 필요해 옮기지 않는다. 이 파일이 지키던 계약 — 자식이 던지면 폴백을 보이고, 재시도하면 `onRetry`가 불리며 `canvasKey`가 하나 올라간다 — 중 키 증가만 순수 함수로 떼어 `test/board3d.test.mjs`에 붙인다.

`node --test`는 `.ts`만 타입을 벗겨낸다 — JSX가 든 `.tsx`는 import할 수 없으므로 키 계산을 `src/lib/board3d/canvas-key.ts`로 뺀다:

```ts
/** A new key remounts the Canvas; the boundary bumps it on every retry. */
export function nextCanvasKey(current: number): number {
  return current + 1;
}
```

`board-error-boundary.tsx`의 재시도 핸들러가 이 함수를 쓰게 하고, 테스트를 더한다:

```js
import { nextCanvasKey } from "../src/lib/board3d/canvas-key.ts";

test("board-error-boundary — each retry asks for a fresh canvas", () => {
  assert.equal(nextCanvasKey(0), 1);
  assert.equal(nextCanvasKey(7), 8);
});
```

폴백이 실제로 보이는지는 Task 8 Step 4의 수동 확인에서 WebGL을 끄고 검증한다.

- [ ] **Step 6: 남은 react-native 참조가 없는지 확인한다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
grep -rn "react-native\|expo-\|@/src/" src/components/board3d src/lib && echo "남은 참조 있음" || echo "깨끗함"
npm run build
```

Expected: grep 0건, 빌드 성공, `npm test`도 통과.

- [ ] **Step 7: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Move the wooden board and its tiles onto react-dom."
```

---

### Task 7: 게임 UI 리프 컴포넌트

`GameScreen`이 조립할 조각들을 먼저 만든다. 전부 `View`/`Text`/`Pressable`/`StyleSheet`로 짜여 있어 다시 쓴다.

**Files:**
- Create: `src/components/game/{game-header,game-toolbar,digit-controls,accessible-board,game-announcer}.tsx`
- Create: `src/components/game/{game-dialog,difficulty-dialog,settings-dialog,help-dialog,puzzle-generation-dialog}.tsx`
- Create: `src/components/ui/slider.tsx`
- Create: `src/lib/use-window-size.ts`

**Interfaces:**
- Consumes: `@/lib/i18n`(`t`), `@/lib/sudoku/domain/*`, `@/lib/game/game-view-model`, `@/lib/game/game-theme`, `@/components/ui/*`
- Produces (`GameScreen`이 이 시그니처로 부른다 — 원본 prop 이름을 그대로 유지한다):
  - `GameHeader`, `GameToolbar`, `DigitControls`, `AccessibleBoard`, `GameAnnouncer`
  - `GameDialog` — 나머지 네 다이얼로그의 껍데기
  - `DifficultyDialog`, `SettingsDialog`, `HelpDialog`, `PuzzleGenerationDialog`
  - `type GameSettings` — `@/components/game/settings-dialog` (원본과 동일한 필드)
  - `useWindowSize(): { width: number; height: number }` — `@/lib/use-window-size`

- [ ] **Step 1: slider를 추가하고 useWindowSize를 쓴다**

`SettingsDialog`의 볼륨 슬라이더가 RN `@react-native-community/slider`였다. Radix로 바꾼다.

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
npx shadcn@latest add slider
```

`src/lib/use-window-size.ts` — RN `useWindowDimensions` 대체:

```ts
import { useEffect, useState } from "react";

/** Stands in for react-native's useWindowDimensions. */
export function useWindowSize(): { readonly width: number; readonly height: number } {
  const [size, setSize] = useState(() => ({
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    const onResize = (): void => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}
```

- [ ] **Step 2: 각 컴포넌트를 원본에서 옮겨 다시 쓴다**

원본 파일과 대응은 이렇다. **prop 이름과 타입은 한 글자도 바꾸지 않는다** — Task 8이 원본 `GameScreen`의 호출부를 그대로 쓴다.

| 원본 (`$SRC/src/features/game/`) | 대상 | 다시 쓸 부분 |
|---|---|---|
| `GameHeader.tsx` (136줄) | `game-header.tsx` | `View`→`div`, `Text`→`span`/`p`. 타이머·난이도 배지 배치는 flex로 |
| `GameToolbar.tsx` (121줄) | `game-toolbar.tsx` | `Pressable`→`button`. `hitSlop` prop은 CSS `padding`으로 흡수 |
| `DigitControls.tsx` (103줄) | `digit-controls.tsx` | 숫자 버튼 그리드. `Pressable`→`button`, `StyleSheet`→`grid grid-cols-*` |
| `AccessibleBoard.tsx` (116줄) | `accessible-board.tsx` | 스크린리더용 격자. `accessibilityLabel`→`aria-label`, `accessibilityRole="button"`→`<button>` |
| `GameAnnouncer.tsx` | `game-announcer.tsx` | RN `AccessibilityInfo.announceForAccessibility` → `<div aria-live="polite" role="status">` 에 텍스트를 넣는다 |
| `GameDialog.tsx` (138줄) | `game-dialog.tsx` | RN `Modal` → shadcn `Dialog`/`DialogContent`. `open`/`onClose` 계약 유지 |
| `DifficultyDialog.tsx` (183줄) | `difficulty-dialog.tsx` | `GameDialog` 위에 난이도 5개 + 보드 크기 6/9 선택 |
| `SettingsDialog.tsx` (313줄) | `settings-dialog.tsx` | 토글 8개 + 볼륨 슬라이더 2개. RN `Switch`→ `<input type="checkbox" role="switch">`, RN Slider→ Radix `Slider` |
| `HelpDialog.tsx` (95줄) | `help-dialog.tsx` | 도움말 + FAQ 본문 |
| `PuzzleGenerationDialog.tsx` | `puzzle-generation-dialog.tsx` | 생성 진행/오류 표시 |

RN → DOM 치환 규칙:

| react-native | DOM |
|---|---|
| `<View style={s.x}>` | `<div className="...">` |
| `<Text style={s.x}>` | `<span>` 또는 `<p>` |
| `<Pressable onPress={f}>` | `<button type="button" onClick={f}>` |
| `<ScrollView>` | `<div className="overflow-y-auto">` |
| `<Modal>` | shadcn `Dialog` |
| `accessibilityLabel` | `aria-label` |
| `accessibilityRole="button"` | `<button>` 요소 자체 |
| `accessibilityState={{ selected }}` | `aria-selected` / `aria-pressed` |
| `accessibilityHint` | `aria-describedby` + 숨김 텍스트 |
| `StyleSheet.create({...})` | Tailwind 클래스. 3D 좌표와 얽힌 픽셀 값만 `style={{}}`로 남긴다 |
| `hitSlop={6}` | 버튼 `padding`을 6px 늘린다 |
| `useWindowDimensions()` | `useWindowSize()` |

색은 `gameColors`를 JS로 인라인하지 않고 `text-cream`, `bg-walnut` 같은 Tailwind 토큰을 쓴다(Task 1에서 `@theme`에 선언했다).

- [ ] **Step 3: 빌드로 확인한다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
grep -rn "react-native\|expo-" src/components && echo "남은 참조 있음" || echo "깨끗함"
npm run build
```

Expected: grep 0건, `tsc -b` 에러 0.

이 단계에서는 아직 화면에 뜨지 않는다 — `home.tsx`가 자리표시자이기 때문이다. Task 8에서 붙인다.

- [ ] **Step 4: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Redraw the toolbar, keypad and dialogs in Tailwind and Radix."
```

---

### Task 8: GameScreen 조립과 home 라우트 — 실제로 플레이되는 상태

**Files:**
- Create: `src/components/game/game-screen.tsx`
- Modify: `src/routes/home.tsx` (Task 1의 자리표시자를 대체)

**Interfaces:**
- Consumes: Task 7의 모든 컴포넌트, `@/components/board3d/board-canvas`, `@/lib/feedback/*`, `@/lib/game/game-view-model`, `@/lib/sudoku/*`, `@/lib/i18n`
- Produces: `GameScreen({ locale }: { readonly locale: Locale })`

- [ ] **Step 1: game-screen.tsx를 옮겨 쓴다**

원본 `$SRC/src/features/game/GameScreen.tsx`는 732줄이고 세 부분이다:

- 1–345행: import, 상수, 리듀서 래퍼, 상태·이펙트·콜백 — **로직은 그대로 옮긴다**
- 346–547행: JSX — Task 7의 치환 규칙으로 다시 쓴다
- 548–732행: `StyleSheet.create` — 삭제하고 Tailwind 클래스로 흡수한다

로직 부분에서 바뀌는 것은 다음 넷뿐이다:

```ts
// 1. expo-router 대신 TanStack Router
- import { useRouter } from 'expo-router';
+ import { useNavigate } from "@tanstack/react-router";
  ...
- const router = useRouter();
+ const navigate = useNavigate();

// 2. RN 훅 대신 웹 훅
- import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
+ import { useWindowSize } from "@/lib/use-window-size";
  ...
- const { width, height } = useWindowDimensions();
+ const { width, height } = useWindowSize();

// 3. import 경로
- import { BoardCanvas } from '../board3d/BoardCanvas';
+ import { BoardCanvas } from "@/components/board3d/board-canvas";
- import { t } from '@/src/i18n/i18n';
+ import { t } from "@/lib/i18n";
  (나머지 @/src/... → @/lib/..., ./Xxx → @/components/game/xxx)

// 4. GameSafeScrollView는 웹에서 필요 없다
- import { GameSafeScrollView } from './GameSafeScrollView';
+ (제거. 바깥 div에 className="overflow-y-auto" 와
   style={webSafeAreaPadding(12)} 를 준다 — @/lib/game/game-safe-area)
```

`useSyncExternalStore(subscribeToHydration, ...)`로 하이드레이션을 다루던 부분은 CSR 단일 렌더라 그대로 두어도 무해하다. 지우지 않는다.

키보드 입력(`boardCommandForKey`)은 원본이 웹에서도 쓰던 경로다. `document`에 `keydown`을 거는 형태 그대로 옮긴다.

- [ ] **Step 2: home.tsx를 완성한다**

```tsx
import { useEffect, useMemo } from "react";
import { createRoute } from "@tanstack/react-router";

import { GameScreen } from "@/components/game/game-screen";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { t } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { HTML_LANG, detectLang } from "@/lib/i18n/resolve-lang";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Locale;
}

function Home() {
  const { lang } = homeRoute.useSearch();
  const locale = useMemo(() => detectLang(lang), [lang]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  return (
    <div className="sd-shell mx-auto flex min-h-dvh max-w-3xl flex-col">
      <LocalOnlyBanner text={t(locale, "localOnly")} />
      <Masthead sub={t(locale, "brandSub")} title={t(locale, "appTitle")} />
      <GameScreen locale={locale} />
    </div>
  );
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch =>
    typeof search.lang === "string" && isLocale(search.lang) ? { lang: search.lang } : {},
});
```

`localOnly`와 `brandSub` 키가 원본 메시지 시트에 없다. `src/lib/i18n/{ko,en,ja}.ts` 세 곳에 더한다 — 값은 Global Constraints의 문구를 그대로 쓴다:

```ts
// ko.ts
  localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  brandSub: '원목 보드와 세라믹 타일',
// en.ts
  localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  brandSub: 'A wooden board, ceramic tiles',
// ja.ts
  localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  brandSub: '木製ボードとセラミックタイル',
```

Task 2의 "every locale carries every key" 테스트가 세 시트의 키가 어긋나면 바로 잡아준다.

- [ ] **Step 3: 테스트와 빌드를 돌린다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku && npm test && npm run build
```

Expected: 전부 PASS.

- [ ] **Step 4: 브라우저에서 실제로 플레이해 확인한다**

```bash
npm run dev
```

`http://localhost:5173/` 에서 다음을 순서대로 확인한다. 하나라도 안 되면 다음 단계로 넘어가지 않는다.

1. 난이도 다이얼로그가 뜨고 5단계 + 보드 크기 6/9가 보인다
2. 시작하면 원목 보드가 3D로 렌더된다 (WebGL 오류 없음)
3. 숫자 타일을 빈칸으로 드래그해 놓을 수 있다
4. 칸을 클릭한 뒤 숫자 버튼을 눌러도 놓인다
5. 방향키 이동, `1`–`9` 입력, `Backspace` 삭제, `M` 메모, `Ctrl/Cmd+Z` 실행취소가 동작한다
6. 잘못된 숫자를 놓으면 충돌 표시가 뜬다
7. 설정에서 효과음을 켜면 소리가 나고, 배경음악을 켜야만 음악 파일이 네트워크 탭에 나타난다
8. 퍼즐을 완성하면 완료 다이얼로그가 뜬다
9. `?lang=en`, `?lang=ja`로 UI 문구가 바뀐다

- [ ] **Step 5: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Wire the board, the keypad and the dialogs into a game you can finish."
```

---

### Task 9: SEO·PWA 셸과 og-lang Worker

**Files:**
- Modify: `src/og-lang.ts` (Task 1의 자리표시자를 대체)
- Create: `public/{manifest.webmanifest,sw.js,robots.txt,sitemap.xml,llms.txt,privacy.html,terms.html}`
- Create: `src/components/seo-copy.tsx`
- Modify: `src/routes/home.tsx` (FAQ 섹션 추가)
- Test: `test/first-html-i18n.test.mjs`

**Interfaces:**
- Consumes: `@/lib/i18n`(`localizedFaq`), `@/lib/metadata`
- Produces: 3개 로케일로 재작성되는 첫 HTML, 의견 위젯이 붙은 응답

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`test/first-html-i18n.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.SUDOKU_URL || "http://127.0.0.1:8788";

const CASES = [
  {
    lang: "en",
    htmlLang: "en",
    title: "3D Sudoku",
    sub: "A wooden board, ceramic tiles",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    ogLocale: "en_US",
    ogImage: "https://sudoku.try-dabble.com/og-image-en.png",
  },
  {
    lang: "ja",
    htmlLang: "ja",
    title: "3D数独",
    sub: "木製ボードとセラミックタイル",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    ogLocale: "ja_JP",
    ogImage: "https://sudoku.try-dabble.com/og-image-ja.png",
  },
  {
    lang: "ko",
    htmlLang: "ko",
    title: "스도쿠 3D",
    sub: "원목 보드와 세라믹 타일",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    ogLocale: "ko_KR",
    ogImage: "https://sudoku.try-dabble.com/og-image.png",
  },
];

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

for (const c of CASES) {
  test(`first HTML ?lang=${c.lang} already has lang, title, banner, h1 and og image (no JS)`, async () => {
    const res = await fetch(`${BASE}/?lang=${c.lang}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const first = stripScripts(html);

    assert.match(html, new RegExp(`<html lang="${c.htmlLang}"`));
    assert.match(html, new RegExp(`<title>${esc(c.title)}</title>`));
    assert.match(first, new RegExp(`id="local-only"[^>]*>${esc(c.localOnly)}</p>`));
    assert.match(first, new RegExp(`<h1 id="brand-title">${esc(c.title)}</h1>`));
    assert.match(first, new RegExp(`id="brand-sub">${esc(c.sub)}</p>`));
    assert.match(html, new RegExp(`<meta name="application-name" content="${esc(c.title)}"`));
    assert.match(
      html,
      new RegExp(`<meta name="apple-mobile-web-app-title" content="${esc(c.title)}"`),
    );
    assert.match(html, new RegExp(`property="og:title" content="${esc(c.title)}"`));
    assert.match(html, new RegExp(`property="og:locale" content="${esc(c.ogLocale)}"`));
    assert.match(html, new RegExp(`property="og:image" content="${esc(c.ogImage)}"`));
    assert.match(html, new RegExp(`name="twitter:image" content="${esc(c.ogImage)}"`));
    assert.match(
      html,
      new RegExp(`rel="canonical" href="https://sudoku\\.try-dabble\\.com/\\?lang=${c.lang}"`),
    );
  });
}

test("the feedback widget is appended for every language", async () => {
  const res = await fetch(`${BASE}/?lang=en`);
  const html = await res.text();
  assert.match(html, /https:\/\/try-dabble\.com\/widget\/feedback\.js/);
  assert.match(html, /data-app="sudoku"/);
});

test("ja never points at the Korean card", async () => {
  const res = await fetch(`${BASE}/?lang=ja`);
  const html = await res.text();
  assert.doesNotMatch(html, /content="https:\/\/sudoku\.try-dabble\.com\/og-image\.png"/);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
npm run preview &
# wrangler dev 가 :8788 에 뜰 때까지 기다린 뒤
npm test
```

Expected: FAIL — 아직 재작성이 없으니 `?lang=en`이 한국어 HTML을 준다.

- [ ] **Step 3: og-lang.ts를 쓴다**

playset의 구조 그대로, 로케일 3개에 스도쿠 카피를 넣는다. `COPY`의 `title`/`description`/`locale`/`image`는 `src/lib/metadata.ts`의 값과 같아야 한다 — Worker와 앱이 서로 다른 문장을 말하면 안 된다.

```ts
/**
 * Runs ahead of the assets binding on every request (run_worker_first) so the
 * FIRST HTML already carries the requested language. Crawlers do not run JS:
 * ?lang=en must not hand them the Korean default.
 *
 * Order: ?lang= wins, then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language. src/lib/i18n/resolve-lang.ts
 * resolves the mounted app the same way, so the served HTML and React never
 * disagree.
 */
type Lang = 'ko' | 'en' | 'ja';

const COPY: Record<
  Lang,
  {
    title: string;
    description: string;
    locale: string;
    image: string;
    localOnly: string;
    sub: string;
  }
> = {
  ko: {
    title: '스도쿠 3D',
    description:
      '따뜻한 원목 보드와 세라믹 숫자 타일로 즐기는 3D 스도쿠입니다. 다섯 단계 난이도, 메모, 실행 취소, 정답 확인을 지원하며 손가락·마우스·Apple Pencil로 플레이할 수 있습니다.',
    locale: 'ko_KR',
    image: 'https://sudoku.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    sub: '원목 보드와 세라믹 타일',
  },
  en: {
    title: '3D Sudoku',
    description:
      'Play tactile 3D Sudoku on a warm wooden board with ceramic tiles, five rated difficulty levels, notes, undo, answer checking, and Pencil or finger controls.',
    locale: 'en_US',
    image: 'https://sudoku.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    sub: 'A wooden board, ceramic tiles',
  },
  ja: {
    title: '3D数独',
    description:
      '温かな木製ボードとセラミックの数字タイルで楽しむ3D数独です。5段階の難易度、メモ、取り消し、答え合わせに対応し、指・マウス・Apple Pencilのどれでも遊べます。',
    locale: 'ja_JP',
    image: 'https://sudoku.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    sub: '木製ボードとセラミックタイル',
  },
};

const SLUG = 'sudoku';
const ORIGIN = 'https://sudoku.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja']);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

function pickLang(request: Request, url: URL): Lang | null {
  const q = url.searchParams.get('lang');
  if (q && LANGS.has(q)) return q as Lang;
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)td_lang=(ko|en|ja)(?:;|$)/);
  if (m && LANGS.has(m[1])) return m[1] as Lang;
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const asset = await env.ASSETS.fetch(request);
    const ct = asset.headers.get('content-type') || '';
    if (!ct.includes('text/html') || !isHome(url.pathname)) return asset;

    const lang = pickLang(request, url);
    let html: Response = asset;

    if (lang) {
      const copy = COPY[lang];
      const shareUrl = `${ORIGIN}/?lang=${lang}`;
      html = new HTMLRewriter()
        .on('html', { element(el) { el.setAttribute('lang', lang); } })
        .on('title', { element(el) { el.setInnerContent(copy.title); } })
        .on('#local-only', { element(el) { el.setInnerContent(copy.localOnly); } })
        .on('h1#brand-title', { element(el) { el.setInnerContent(copy.title); } })
        .on('#brand-sub', { element(el) { el.setInnerContent(copy.sub); } })
        .on('meta', {
          element(el) {
            const key = el.getAttribute('property') || el.getAttribute('name') || '';
            if (key === 'description' || key === 'og:description' || key === 'twitter:description') {
              el.setAttribute('content', copy.description);
            } else if (key === 'og:title' || key === 'twitter:title') {
              el.setAttribute('content', copy.title);
            } else if (key === 'application-name' || key === 'apple-mobile-web-app-title') {
              el.setAttribute('content', copy.title);
            } else if (key === 'og:url') {
              el.setAttribute('content', shareUrl);
            } else if (key === 'og:image' || key === 'twitter:image') {
              el.setAttribute('content', copy.image);
            } else if (key === 'og:locale') {
              el.setAttribute('content', copy.locale);
            }
          },
        })
        .on('link', {
          element(el) {
            if ((el.getAttribute('rel') || '').toLowerCase() === 'canonical') {
              el.setAttribute('href', shareUrl);
            }
          },
        })
        .transform(asset);
    }

    // Shared try-dabble feedback widget, appended server-side so it is present
    // no matter what the client bundle does to the shell.
    return new HTMLRewriter()
      .on('body', {
        element(el) {
          el.append(
            `<script src="https://try-dabble.com/widget/feedback.js" data-app="${SLUG}" defer></script>`,
            { html: true },
          );
        },
      })
      .transform(html);
  },
};
```

- [ ] **Step 4: PWA 파일을 쓴다**

`public/manifest.webmanifest`:

```json
{
  "name": "스도쿠 3D",
  "short_name": "스도쿠 3D",
  "description": "따뜻한 원목 보드와 세라믹 숫자 타일로 즐기는 3D 스도쿠입니다. 다섯 단계 난이도, 메모, 실행 취소, 정답 확인을 지원합니다.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#18120f",
  "theme_color": "#18120f",
  "lang": "ko",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

`public/sw.js`는 playset 것을 베끼되 캐시 이름과 precache 목록만 바꾼다. **오디오와 텍스처는 precache에 넣지 않는다** — 8.8MB 음악을 설치 시점에 받아버리면 Task 5에서 지연 로드로 만든 이유가 사라진다.

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
sed -e 's/playset-v1/sudoku-v1/' ../playset/public/sw.js > public/sw.js
```

그다음 `public/sw.js`의 `ASSETS` 배열을 이것으로 바꾼다:

```js
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/og-image.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/privacy.html",
  "/terms.html",
  "/llms.txt"
];
```

`robots.txt`, `sitemap.xml`, `llms.txt`, `privacy.html`, `terms.html`은 playset 것을 복사한 뒤 슬러그·도메인·앱 이름·설명을 스도쿠로 바꾼다.

```bash
for f in robots.txt sitemap.xml llms.txt privacy.html terms.html; do
  sed -e 's#playset\.try-dabble\.com#sudoku.try-dabble.com#g' \
      -e 's#놀이세트#스도쿠 3D#g' \
      -e 's#Playset#3D Sudoku#g' \
      ../playset/public/$f > public/$f
done
```

복사한 다섯 파일을 하나씩 열어 남아 있는 놀이세트 특유의 설명(게임 여섯 가지, 3게임 제한 등)을 스도쿠 내용으로 고친다. `sitemap.xml`은 `?lang=` 세 개만 남긴다(zh 제거).

- [ ] **Step 5: seo-copy.tsx로 FAQ와 JSON-LD를 붙인다**

```tsx
import { localizedFaq } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";

/**
 * The FAQ answer engines quote. Rendered as real text AND as FAQPage JSON-LD,
 * because ChatGPT and AI Overviews read the markup, not the canvas.
 */
export function SeoCopy({ locale, heading }: { readonly locale: Locale; readonly heading: string }) {
  const faq = localizedFaq(locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8 text-cream-muted">
      <h2 className="font-display text-lg text-cream">{heading}</h2>
      <dl className="mt-4 space-y-4">
        {faq.map((entry) => (
          <div key={entry.question}>
            <dt className="text-sm font-semibold text-cream">{entry.question}</dt>
            <dd className="mt-1 text-sm">{entry.answer}</dd>
          </div>
        ))}
      </dl>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </section>
  );
}
```

`src/routes/home.tsx`의 `<GameScreen />` 아래에 붙인다:

```tsx
      <SeoCopy heading={t(locale, "faq")} locale={locale} />
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
npm run preview &
npm test
```

Expected: 첫 HTML 테스트 3건 + 위젯 + ja 카드 = 전부 PASS.

- [ ] **Step 7: 오프라인 동작을 확인한다**

브라우저에서 `http://127.0.0.1:8788/` 을 연 뒤 DevTools → Network → Offline 체크 → 새로고침. 셸이 뜨면 통과.

- [ ] **Step 8: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Localise the first HTML and make the shell work offline."
```

---

### Task 10: OG 이미지와 아이콘

**Files:**
- Create: `contain-og.js`
- Create: `public/og-image.png`, `og-image-en.png`, `og-image-ja.png`, `favicon.ico`, `icons/{icon-192,icon-512,apple-touch-icon}.png`

**Interfaces:**
- Consumes: 없음 (sharp가 SVG를 직접 그린다)
- Produces: `npm run og`가 위 파일들을 생성

- [ ] **Step 1: playset의 contain-og.js를 뼈대로 삼는다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
cp ../playset/contain-og.js contain-og.js
```

- [ ] **Step 2: 그림과 카피를 스도쿠로 바꾼다**

`contain-og.js`에서 고칠 것:

1. 상단 주석 — 이 카드가 무엇을 그리는지. 스도쿠 카드는 **어두운 책상 위 원목 스도쿠 보드를 비스듬히 놓고, 3×3 박스 격자에 세라믹 숫자 타일 몇 개가 놓여 있고, 한 타일이 빈칸 위로 막 내려앉는 그림**이다. omok의 washi 종이, jump-map의 픽셀 밤하늘, playset의 크림색 장난감 트레이와 겹치지 않게 한다.
2. 색 상수 — `src/lib/game/game-theme.ts`의 값으로 바꾼다: 바탕 `#18120f`, 보드 `#5b321f`~`#8a5535`, 타일 `#f7f0e2`, 글자 `#34251e`, 강조 `#a7342d`.
3. `CJK` 맵과 언어 목록에서 `zh`를 뺀다. `const LANGS = ["ko", "en", "ja"]`.
4. 로케일별 문구 — `title`은 Global Constraints의 브랜드명, 부제는 ko `원목 보드와 세라믹 타일` / en `A wooden board, ceramic tiles` / ja `木製ボードとセラミックタイル`.
5. 출력 파일명 — `og-image.png`(ko), `og-image-en.png`, `og-image-ja.png`. `og-image-zh.png`를 만들지 않는다.

- [ ] **Step 3: 생성하고 눈으로 확인한다**

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
npm run og
ls -la public/og-image*.png public/icons public/favicon.ico
```

세 OG 이미지를 열어 확인한다: 1200×630인가, 글자가 잘리지 않는가, 세 언어 모두 레이아웃이 무너지지 않는가.

- [ ] **Step 4: 커밋**

```bash
cd /Users/charles/1git/try-dabble-apps
git add apps/sudoku
git commit -m "sudoku: Draw the share card — a tile coming down on the wooden board."
```

---

### Task 11: try-dabble-main 등록과 README

**Files:**
- Create: `/Users/charles/1git/try-dabble-main/worker/src/services/sudoku.ts`
- Modify: `/Users/charles/1git/try-dabble-main/worker/src/services/index.ts`
- Create: `/Users/charles/1git/try-dabble-main/worker/src/content/guides/sudoku.ts`
- Modify: `/Users/charles/1git/try-dabble-main/worker/src/content/guides/index.ts`
- Modify: `/Users/charles/1git/try-dabble-main/worker/src/content/about.ts`, `support.ts`
- Create: `apps/sudoku/README.md`
- Modify: `/Users/charles/1git/try-dabble-apps/README.md`

**Interfaces:**
- Consumes: `WebService` 타입 (`worker/src/types.ts`)
- Produces: 홈페이지 라인업의 스도쿠 카드와 가이드 페이지

- [ ] **Step 1: 앱 README를 쓴다**

jump-map README와 같은 형식으로 `apps/sudoku/README.md`:

```markdown
# 스도쿠 3D (3D Sudoku)

Wooden-board 3D sudoku at [sudoku.try-dabble.com](https://sudoku.try-dabble.com).
Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Router + three.js /
@react-three/fiber / cannon-es, served from Cloudflare Workers Static Assets
with an SPA fallback. Ported from an Expo SDK 57 app; the puzzle rules, board
maths and feedback controllers came across unchanged.

- `src/components/board3d/` — the R3F scene: board, ceramic tiles, drop physics.
- `src/lib/sudoku/domain/` — grid, solver, generator, difficulty rating, reducer.
  Pure functions, covered by `test/sudoku-domain.test.mjs`.
- `src/lib/feedback/` — pure controllers plus the browser adapters that replaced
  expo-audio and expo-haptics.
- `src/og-lang.ts` — Worker that localises the FIRST HTML for `?lang=` before
  the assets binding replies (`run_worker_first`), and appends the 의견 widget.
- `public/audio/` — effect sounds as aac. The three background tracks are ~3MB
  each and load only when the setting is turned on, so they stay out of the
  service worker precache.

```
npm run dev      # vite
npm run build    # tsc -b && vite build
npm run preview  # build, then wrangler dev on :8788
npm test         # domain, board maths, i18n, feedback + first-HTML i18n (needs preview up)
npm run og       # regenerate og-image-*.png and the PWA icons
npm run deploy   # build, then wrangler deploy
```
```

- [ ] **Step 2: 루트 README의 앱 목록에 한 줄 더한다**

`/Users/charles/1git/try-dabble-apps/README.md`의 `## Apps` 목록 끝에:

```markdown
- [sudoku](https://sudoku.try-dabble.com/) — 스도쿠 3D wooden-board sudoku; three.js + R3F, ported off Expo
```

- [ ] **Step 3: try-dabble-main에 서비스를 등록한다**

`worker/src/services/sudoku.ts`:

```ts
import type { WebService } from '../types';

export const sudoku: WebService = {
  slug: 'sudoku',
  name: {
    ko: '스도쿠 3D',
    en: '3D Sudoku',
    ja: '3D数独',
  },
  description: {
    ko: '원목 보드에 세라믹 숫자 타일을 올려 푸는 3D 스도쿠 — 다섯 단계 난이도, 메모, 실행 취소, 정답 확인',
    en: 'Tactile 3D sudoku on a wooden board with ceramic number tiles — five difficulty levels, notes, undo, answer checking',
    ja: '木製ボードにセラミックの数字タイルを置いて解く3D数独 — 5段階の難易度、メモ、取り消し、答え合わせ',
  },
  url: 'https://sudoku.try-dabble.com',
  ogImage: {
    ko: 'https://sudoku.try-dabble.com/og-image.png',
    en: 'https://sudoku.try-dabble.com/og-image-en.png',
    ja: 'https://sudoku.try-dabble.com/og-image-ja.png',
  },
  category: 'GameApplication',
};
```

`worker/src/services/index.ts`에 import와 배열 항목을 더한다:

```ts
import { sudoku } from './sudoku';
...
export const SERVICES: WebService[] = [soulcro, delivermgmt, stockInfo, omok, jumpMap, costPerUse, giftStash, placeInbox, photoSpec, laterInbox, leftoverBox, sudoku];
```

- [ ] **Step 4: 가이드와 소개 문구를 더한다**

`worker/src/content/guides/jump-map.ts`를 열어 같은 구조로 `guides/sudoku.ts`를 쓴다. 내용은 ko/en/ja 3개 로케일로, 앱 소개 + 조작법(드래그·클릭·키보드) + 난이도 다섯 단계 + 오프라인 동작을 담는다.

`guides/index.ts`에 등록하고, `content/about.ts`와 `content/support.ts`에서 jump-map이 언급된 자리를 찾아 스도쿠를 같은 형식으로 더한다.

- [ ] **Step 5: try-dabble-main 타입을 확인한다**

```bash
cd /Users/charles/1git/try-dabble-main/worker
npx tsc --noEmit
```

Expected: 에러 0.

- [ ] **Step 6: 양쪽을 커밋한다**

```bash
cd /Users/charles/1git/try-dabble-apps
git add README.md apps/sudoku/README.md
git commit -m "sudoku: Add the app to the lineup and write down how to run it."

cd /Users/charles/1git/try-dabble-main
git add worker/src
git commit -m "sudoku: List 3D Sudoku in the services and guides."
```

- [ ] **Step 7: 최종 확인**

`apps/sudoku`에서:

```bash
cd /Users/charles/1git/try-dabble-apps/apps/sudoku
grep -rn "react-native\|expo-\|@/src/" src/ ; echo "위가 비어 있어야 한다"
npm run build && npm run preview &
npm test
```

그다음 브라우저에서 Task 8 Step 4의 아홉 항목을 다시 한 번 훑고, Network 탭에서 첫 로드 전송량을 확인한다(three 포함 700KB gzip 안팎이면 정상).

배포는 사용자가 확인한 뒤에 한다. `npm run deploy`를 임의로 실행하지 않는다.
