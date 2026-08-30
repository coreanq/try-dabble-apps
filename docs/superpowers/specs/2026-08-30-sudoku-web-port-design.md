# 스도쿠 3D — Expo 제거 후 try-dabble 웹앱 이식 설계

작성일: 2026-08-30

## 배경

`/Users/charles/1git/sudoku`는 Expo SDK 57 + expo-router + React Three Fiber로 만든
3D 스도쿠다. 별도 저장소에 있고, 웹 산출물은 `expo export`로 뽑는다. 이 앱을
`try-dabble-apps/apps/sudoku`로 옮겨 다른 16개 앱과 같은 형태로 만들고,
[coreanq/try-dabble-main](https://github.com/coreanq/try-dabble-main)에 등록한다.

원본 앱은 이미 `https://sudoku.try-dabble.com`을 전제로 SEO 카피와 FAQ를 써 두었다.
slug·도메인·브랜드명(`스도쿠 3D`)은 그대로 쓴다.

## 목표

- Expo·react-native·expo-router를 완전히 제거하고 Vite + React 19 + TS + Tailwind 4 +
  shadcn/ui + TanStack Router로 전환한다.
- 3D 보드(three.js + `@react-three/fiber` + cannon-es 물리)는 유지한다.
- try-dabble 앱 표준 셸(no-JS shell, `og-lang.ts` Worker, PWA, 의견 위젯)을 갖춘다.
- try-dabble-main의 서비스 목록·가이드에 등록한다.

## 비목표

- 원본 `1git/sudoku` 저장소는 수정하지 않는다. 그대로 남긴다.
- 네이티브(iOS/iPad) 빌드 경로는 이번 범위가 아니다. 원본 저장소에 남는다.
- 다른 `apps/*`와 `packages/feedback`은 건드리지 않는다.
- try-dabble-main `SERVICES` 배열에서 누락된 기존 8개 앱(box-qr, kinlog, lastloved,
  memomap, orderpad, playset, storelog, trashpad) 등록은 별건이다.

## 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| 3D 보드 | 유지 | R3F는 react-dom 웹에서 그대로 동작한다. 앱의 정체성이고, board3d 순수 로직 약 2,000줄이 테스트와 함께 이미 있다. |
| 로케일 | ko / en / ja 3개 | 원본이 3개. zh는 추가하지 않는다. |
| 로케일 전달 | `?lang=` 쿼리 + 공유 `td_lang` 쿠키 | try-dabble 표준. `/ko` 경로 방식은 폐기(아직 배포된 적 없어 리다이렉트 불필요). |
| 테스트 러너 | `node --test test/*.test.mjs` | try-dabble 표준. Node 22가 `.ts`를 직접 import하므로 추가 의존성 0. |
| e2e | 제외 | try-dabble 앱 중 Playwright를 쓰는 앱이 없다. 러너를 늘리지 않는다. |
| 소스 배치 | `components/` + `lib/` + `routes/` | try-dabble 관례. `features/` 계층은 쓰지 않는다. |

## 아키텍처

### 목표 디렉터리

```
apps/sudoku/
  index.html                     no-JS 셸: local-only 배너 + 마스트헤드
  vite.config.ts                 react + tailwind 플러그인, "@" alias
  package.json                   dev/build/preview/test/deploy/og/cf-typegen
  wrangler.jsonc                 sudoku.try-dabble.com, run_worker_first
  components.json                shadcn 설정
  contain-og.js                  og 이미지·PWA 아이콘 생성 (sharp)
  tsconfig.{json,app,node,worker}.json
  public/
    manifest.webmanifest  sw.js  favicon.ico  robots.txt  sitemap.xml  llms.txt
    privacy.html  terms.html
    icons/{icon-192,icon-512,apple-touch-icon}.png
    og-image.png  og-image-{ko,en,ja}.png
    textures/{wood,digits}.png
    audio/*.m4a
  src/
    main.tsx  router.tsx  index.css  og-lang.ts
    routes/{root,home}.tsx
    components/
      masthead.tsx  local-only-banner.tsx  seo-copy.tsx
      ui/{button,card,dialog,slider}.tsx
      game/     game-screen, game-header, game-toolbar, digit-controls,
                accessible-board, game-announcer, difficulty-dialog,
                settings-dialog, help-dialog, puzzle-generation-dialog
      board3d/  board-canvas, board-input, board-scene, board-mesh,
                digit-tile, digit-tray, drop-target-indicator,
                board-error-boundary, board-initialization-gate
    lib/
      utils.ts  metadata.ts  pointer.ts
      i18n/      locales, messages, ko, en, ja, resolve-lang
      sudoku/    domain(grid, solver, puzzle-generator, rating, game-reducer,
                 game-state, random-solution, layout) + data(puzzles*)
      board3d/   board-layout, scene-math, board-input, physics-world,
                 completion-motion, frame-budget, board-cell-role,
                 board-initialization, board-camera, scene-assets,
                 use-physics-effects
      feedback/  audio-feedback-controller, audio-volume, feedback-events,
                 background-music-controller, use-audio-feedback,
                 use-background-music, use-haptic-feedback
      game/      game-view-model, game-safe-area, game-theme
  test/
    first-html-i18n.test.mjs  sudoku-domain.test.mjs  board3d.test.mjs
    i18n.test.mjs  feedback.test.mjs
```

### 코드 이관 분류

**A. 순수 TS — 로직 변경 없이 이동 (약 60%)**

import 경로만 `@/lib/...`로 고친다. 그 외 수정 금지.

- `src/features/sudoku/domain/*` → `src/lib/sudoku/domain/*`
- `src/features/sudoku/data/*` → `src/lib/sudoku/data/*`
- `src/features/board3d/`의 board-layout, scene-math, board-input, physics-world,
  completion-motion, frame-budget, board-cell-role, board-initialization,
  board-camera, scene-assets → `src/lib/board3d/*`
- `src/features/game/`의 game-view-model, game-safe-area, game-theme → `src/lib/game/*`
  (`game-theme.ts`는 three.js 머티리얼이 JS 값을 필요로 하므로 색상 상수의 원본으로
  남는다. DOM 크롬은 `index.css`가 같은 값을 CSS 변수로 선언해 참조한다 — C 참고)
- `src/services/feedback/`의 audio-feedback-controller, audio-volume,
  feedback-events, background-music-controller → `src/lib/feedback/*`
- `src/i18n/{ko,en,ja,messages,i18n}.ts` → `src/lib/i18n/*`
- `src/config/locales.ts` → `src/lib/i18n/locales.ts`
- `src/web/metadata.ts` → `src/lib/metadata.ts`

**B. 순수 R3F — 파일명만 kebab-case로**

react-native 의존이 없다. `@react-three/fiber`를 직접 import하도록 `src/platform/r3f*.ts`
경유만 제거한다.

- BoardScene, BoardMesh, DigitTile, DigitTray, DropTargetIndicator,
  BoardInitializationGate → `src/components/board3d/*`

**C. RN 껍데기 — 다시 쓴다 (20개 파일)**

`View`/`Text`/`Pressable`/`StyleSheet` → `div`/`p`/`button` + Tailwind 클래스.
다이얼로그는 shadcn `dialog`(Radix), 볼륨 슬라이더는 Radix Slider.
색상은 `lib/game/game-theme.ts`가 원본으로 남고(3D 머티리얼이 JS 값을 쓴다),
`src/index.css`가 같은 값을 CSS 변수로 선언한다. DOM 컴포넌트는 CSS 변수를 참조하고
JS로 색을 인라인하지 않는다. 값이 두 곳에 적히므로 `test/i18n.test.mjs`가 아닌
`test/board3d.test.mjs`에서 두 값이 일치하는지 확인한다.

- game: GameScreen(732줄), SettingsDialog(313), DifficultyDialog(183),
  GameHeader, GameToolbar, GameDialog, DigitControls, AccessibleBoard,
  GameAnnouncer, HelpDialog, PuzzleGenerationDialog, GameSafeScrollView
- board3d: BoardCanvas, BoardErrorBoundary, BoardInput

**D. 삭제**

- `app/*` 전부 (expo-router 엔트리, `+html.tsx`, `[locale]/index.tsx`)
- 모든 `*.native.tsx` / `*.native.ts`
- `src/platform/r3f.ts`, `r3f.web.ts`, `r3f.native.ts` (직접 import로 대체)
- `src/platform/pointer.native.ts` (웹 구현 `pointer.web.ts`는 `src/lib/pointer.ts`로 이동)
- `src/web/register-service-worker.web.ts` (`main.tsx`가 등록)
- `app.json`, `eslint.config.js`, `playwright.config.ts`, `vitest.config.ts`,
  `e2e/`, `scripts/`

### 플랫폼 API 치환 3건

| 원본 | 웹 대체 | 영향 파일 |
|---|---|---|
| `AppState` (react-native) | `document.visibilitychange` | `lib/board3d/use-physics-effects.ts` |
| `expo-audio` `createAudioPlayer`/`preload`/`setIsAudioActiveAsync` | `HTMLAudioElement` (`new Audio(src)`, `play()`, `volume`) | `lib/feedback/use-audio-feedback.ts`, `use-background-music.ts` |
| `expo-haptics` | `navigator.vibrate()` (미지원 시 no-op) | `lib/feedback/use-haptic-feedback.ts` |

세 경우 모두 로직은 이미 순수 컨트롤러(`audio-feedback-controller`,
`background-music-controller`, `feedback-events`) 뒤에 있다. 훅 파일의 어댑터 부분만
교체하고 컨트롤러는 손대지 않는다.

에셋 참조도 바뀐다. `require('../../assets/audio/*.wav')` → `/audio/*.m4a` 문자열 경로.
텍스처도 `/textures/wood.png`, `/textures/digits.png`로.

## i18n / SEO / Worker

`src/lib/i18n/resolve-lang.ts`는 다른 try-dabble 앱과 동일한 순서로 언어를 정한다:
`?lang=` 쿼리 → `td_lang` 쿠키 → 기본 `ko`. 선택 시 `td_lang`을 도메인 공유 쿠키로 쓴다.

`src/og-lang.ts`는 `run_worker_first`로 assets 바인딩보다 먼저 돌면서 첫 HTML을 재작성한다.
크롤러는 JS를 실행하지 않으므로 `?lang=en`이 한국어 HTML을 받으면 안 된다.

재작성 대상:
- `<html lang>`, `<title>`
- `meta[name=description]`, `og:title`, `og:description`, `og:url`, `og:image`,
  `og:locale`, `twitter:title`, `twitter:description`, `twitter:image`
- `meta[name=application-name]`, `meta[name=apple-mobile-web-app-title]`
- `link[rel=canonical]`
- `#local-only` (로컬 전용 안내), `h1#brand-title` (앱 이름)

카피는 `src/lib/metadata.ts`로 옮긴 원본 `web/metadata.ts`의 ko/en/ja 문구를 쓴다.

마지막에 모든 응답의 `<body>` 끝에 공유 의견 위젯을 append한다:

```html
<script src="https://try-dabble.com/widget/feedback.js" data-app="sudoku" defer></script>
```

AEO: 원본 `localizedFaq`를 `src/components/seo-copy.tsx`가 홈 하단 FAQ 섹션과
`schema.org/FAQPage` JSON-LD로 렌더한다.

`wrangler.jsonc`는 playset 것과 같은 형태로, `name: "sudoku"`,
`main: "src/og-lang.ts"`, `assets.directory: "./dist"`,
`not_found_handling: "single-page-application"`, `run_worker_first: true`,
routes에 `sudoku.try-dabble.com` custom domain.

## 에셋 전략

현재 오디오가 10MB다. 웹 PWA에 그대로 얹지 않는다.

| 에셋 | 현재 | 처리 |
|---|---|---|
| 효과음 10개 `.wav` | 1.8MB | ffmpeg로 `.m4a` 변환 (예상 ~200KB). 키 이름 유지. |
| 배경음악 3곡 `.m4a` | 8.8MB | `public/audio/`에 두되 SW precache 제외. 설정에서 배경음악을 켤 때만 fetch. |
| 텍스처 2개 `.png` | 149KB | `public/textures/`로 그대로. |

`public/sw.js`는 playset 것을 베낀다. 셸은 network-first(배포 즉시 반영, `?lang=`
재작성이 낡은 캐시로 덮이지 않음), 나머지는 런타임 stale-while-revalidate.
precache 목록에는 오디오·텍스처를 넣지 않는다.

OG 이미지와 PWA 아이콘은 `contain-og.js`로 생성한다. 다른 앱과 마찬가지로 원본
아트워크 없이 sharp가 SVG를 직접 그린다 — 스도쿠 카드는 원목 보드에 세라믹 숫자
타일이 놓인 그림으로, 로케일별 문구를 얹어 `og-image-{ko,en,ja}.png`(1200×630)와
`icons/{icon-192,icon-512,apple-touch-icon}.png`, `favicon.ico`를 낸다.

## 테스트

원본 vitest 31개 중 순수 로직 28개를 `test/*.test.mjs`로 이관한다. Node 22가 `.ts`를
직접 import하므로 소스 수정 없이 assert만 `node:assert/strict`로 바꾼다.

| 파일 | 담는 것 |
|---|---|
| `test/sudoku-domain.test.mjs` | grid, solver, puzzle-generator, rating, game-reducer, random-solution, puzzles, puzzles-6x6 |
| `test/board3d.test.mjs` | board-layout, scene-math, board-input, physics-world, completion-motion, frame-budget, board-cell-role, board-initialization, scene-assets, pointer |
| `test/i18n.test.mjs` | i18n 메시지 키 일치, locales, metadata |
| `test/feedback.test.mjs` | audio-feedback-controller, audio-volume, feedback-events, background-music-controller |
| `test/first-html-i18n.test.mjs` | try-dabble 표준. `wrangler dev` 띄운 상태에서 `?lang=` 별 첫 HTML 검증 |

React 렌더링이 필요한 3개(`BoardErrorBoundary.test.tsx`,
`use-audio-feedback.test.tsx`, `use-background-music.test.tsx`)는 훅 바깥의 컨트롤러
로직 테스트로 낮춘다. 컨트롤러가 이미 순수 함수라 커버리지 손실이 거의 없다.

`game-view-model.test.ts`, `game-safe-area.test.ts`는 순수 로직이므로
`sudoku-domain.test.mjs`에 포함한다.

## try-dabble-main 등록

jump-map이 등록된 것과 같은 4곳을 고친다.

1. `worker/src/services/sudoku.ts` — 신규. `WebService` 객체:
   `slug: 'sudoku'`, `name`/`description` ko·en·ja, `url: 'https://sudoku.try-dabble.com'`,
   `ogImage` 로케일별, `category: 'GameApplication'`
2. `worker/src/services/index.ts` — import 추가 + `SERVICES` 배열에 추가
3. `worker/src/content/guides/sudoku.ts` — 신규 가이드, `guides/index.ts`에 등록
4. `worker/src/content/{about,support}.ts` — 라인업 언급 추가

## 완료 기준

1. `npm run build` 통과. `tsc -b` 에러 0.
   `grep -rn "react-native\|expo-" src/` 결과 0건.
2. `npm test` 통과.
3. `npm run preview` 후 `?lang=en`, `?lang=ja`로 받은 첫 HTML에서
   `<title>`·description·canonical·`og:image`가 로케일별로 다름을 확인.
4. 브라우저에서 난이도 선택 → 3D 보드 렌더 → 타일 드래그 배치 → 퍼즐 완성까지 실제 플레이.
5. 오프라인 전환 후 새로고침 시 셸이 뜸.
6. 초기 전송량 확인 (three 포함 예상 ~700KB gzip).
7. try-dabble-main에서 `npx tsc --noEmit` 통과, 홈페이지에 스도쿠 카드가 뜸.
