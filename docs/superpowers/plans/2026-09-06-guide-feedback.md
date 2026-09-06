# 가이드 & 의견 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 22개 웹앱의 공용 위젯 버튼을 "가이드 & 의견"으로 바꿔 try-dabble.com 가이드 페이지로 보내고, 의견 폼은 가이드 페이지 상단 버튼(Dialog)에서 받는다. mixshelf 가이드도 추가한다.

**Architecture:** 위젯(`packages/feedback/src/feedback.js`, 이 저장소)은 링크 버튼만 남긴다. 가이드 페이지(`try-dabble-main/src/pages/guides.tsx`)에 React `FeedbackDialog`를 붙이고 같은 origin의 `POST /api/feedback`으로 보낸다. 워커(`try-dabble-main/src/worker/feedback.ts`)는 `https://try-dabble.com` Origin을 추가로 받고 pageUrl이 `/{lang}/guides/{slug}`인지 검사한다.

**Tech Stack:** 위젯은 의존성 없는 브라우저 IIFE + `node test/copy.test.js`. try-dabble-main은 Vite + React 19 + TS + Tailwind + shadcn/ui(radix-ui) + TanStack Router, 테스트는 `node --test test/*.test.tsx`(tsx 로더), 배포는 Cloudflare Workers(wrangler).

**두 저장소:** 이 저장소 `/Users/charles/1git/try-dabble-apps`(Task 1)와 옆의 `/Users/charles/1git/try-dabble-main`(Task 2~5). 커밋은 각 저장소에서 따로 한다. try-dabble-main은 현재 브랜치 상태를 `git status`로 먼저 확인하고, 더러우면 멈추고 사용자에게 알린다.

## Global Constraints

- 위젯 공개 URL `https://try-dabble.com/widget/feedback.js`와 `<script ... data-app="{slug}" defer>` 주입 방식은 바꾸지 않는다. 22개 앱 코드는 손대지 않는다.
- 위젯 버튼 문구: ko `가이드 & 의견`, en `Guide & Feedback`, ja `ガイド & 意見`, zh `指南 & 反馈`.
- 가이드 페이지 버튼 문구: ko `의견 보내기`, en `Send feedback`, ja `意見を送る`, zh `发送反馈`.
- 폼 문구 4개 언어는 기존 위젯 `COPY`(idea/bug/title/body/send/sent/err/close/photo/drop/fileEmpty/fileOne/fileTwo)를 그대로 옮긴다.
- KV 저장 형식(`report:`/`list:`/`img:`/`rl:`)과 `UserReport` 타입은 바꾸지 않는다.
- 가이드 본문에 `localStorage`/`IndexedDB`/`local storage`라는 단어를 쓰지 않는다(기존 테스트가 금지).
- 앱 footer의 `Guide` 링크, 제보 목록 표시, AdSense 배치는 범위 밖.
- 커밋 메시지 끝에 붙인다:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_016pNsi8hXbRW56sRGTn5K3f
  ```

---

## File Structure

**try-dabble-apps (이 저장소)**
- Modify `packages/feedback/src/feedback.js` — 버튼만 남기고 클릭 시 가이드 새 탭 열기.
- Modify `packages/feedback/test/copy.test.js` — 남는 키 `btn`만 검사.
- Modify `packages/feedback/README.md` — 동작 설명을 새 동작으로.

**try-dabble-main**
- Modify `src/worker/feedback.ts` — main origin 허용 + 가이드 pageUrl 검사.
- Create `test/feedback.test.tsx` — 워커 단위 테스트(인메모리 KV).
- Create `src/components/feedback-dialog.tsx` — 폼 Dialog(문구, 이미지 압축, 전송 포함, 이 파일 하나).
- Modify `src/content/site.ts` — `GUIDE_COPY`에 `feedback` 키.
- Modify `src/pages/guides.tsx` — 상단 버튼 + Dialog.
- Modify `test/site.test.tsx` — 가이드 HTML에 `의견`이 없어야 한다는 단언 제거.
- Modify `src/content/guides/types.ts`, `src/content/guides/index.ts`, `src/content/guides/*.ts`(14개), `docs/feedback-widget.md` — 규칙 삭제.
- Create `src/content/services/mixshelf.ts`, `src/content/guides/mixshelf.ts`, `public/og/mixshelf-{ko,en,ja,zh}.png`; Modify `src/content/services/index.ts`, `src/content/guides/index.ts`.

---

### Task 1: 위젯을 가이드 링크 버튼으로 (try-dabble-apps)

**Files:**
- Modify: `packages/feedback/src/feedback.js`
- Modify: `packages/feedback/test/copy.test.js`
- Modify: `packages/feedback/README.md`

**Interfaces:**
- Produces: 버튼 클릭 → `window.open("https://try-dabble.com/{lang}/guides/{slug}", "_blank", "noopener")`. slug가 비면 `https://try-dabble.com/{lang}/guides`.

- [ ] **Step 1: 테스트를 새 키 집합으로 고친다**

`packages/feedback/test/copy.test.js`의 `KEYS`를 다음으로 바꾼다.

```js
const KEYS = ["btn"];
```

- [ ] **Step 2: 테스트가 아직 통과하는지 확인(회귀 기준)**

Run: `cd /Users/charles/1git/try-dabble-apps/packages/feedback && npm test`
Expected: `ok - 4 languages x 1 keys`

- [ ] **Step 3: 위젯 소스를 통째로 교체한다**

`packages/feedback/src/feedback.js` 전체를 다음으로 바꾼다.

```js
// SOURCE OF TRUTH: coreanq/try-dabble-apps -> packages/feedback/src/feedback.js
(function () {
  if (window.__tdFeedback) return;
  window.__tdFeedback = true;
  var SITE = "https://try-dabble.com";
  var COPY = {
    ko: { btn: "가이드 & 의견" },
    en: { btn: "Guide & Feedback" },
    ja: { btn: "ガイド & 意見" },
    zh: { btn: "指南 & 反馈" }
  };
  function lang() {
    var s = document.currentScript;
    var q = "";
    try { q = new URLSearchParams(location.search).get("lang") || ""; } catch (e) {}
    var a = (s && s.getAttribute("data-lang")) || q || document.documentElement.lang || "";
    a = String(a).slice(0, 2).toLowerCase();
    return COPY[a] ? a : "ko";
  }
  function slug() {
    var s = document.currentScript;
    var from = s && s.getAttribute("data-app");
    if (from) return from;
    var h = location.hostname;
    var m = h.match(/^([a-z0-9-]+)\.try-dabble\.com$/i);
    return m ? m[1] : "";
  }
  function pageIsDark() {
    try {
      if (document.documentElement.getAttribute("data-theme") === "dark") return true;
      if (document.documentElement.classList.contains("dark")) return true;
      if (document.body && document.body.classList.contains("dark")) return true;
      var bg = getComputedStyle(document.body || document.documentElement).backgroundColor;
      var m = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        var y = (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255;
        return y < 0.45;
      }
    } catch (e) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  var L = lang();
  var t = COPY[L];
  var app = slug();
  var href = SITE + "/" + L + "/guides" + (app ? "/" + app : "");
  var css = document.createElement("style");
  css.textContent = [
    ".td-fb-root{-webkit-text-size-adjust:100%;text-size-adjust:100%}",
    ".td-fb-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;border:2px solid #111;border-radius:999px;padding:10px 14px;font:700 13px/1.2 system-ui,sans-serif;color:#111;background:#ffcc33;box-shadow:0 0 0 2px #fff,0 8px 22px rgba(0,0,0,.35);cursor:pointer;touch-action:manipulation}",
    ".td-fb-root.td-dark .td-fb-btn{border-color:#ffcc33;box-shadow:0 0 0 2px #111,0 8px 22px rgba(0,0,0,.55)}"
  ].join("");
  document.head.appendChild(css);
  var root = document.createElement("div");
  root.className = "td-fb-root" + (pageIsDark() ? " td-dark" : "");
  var btn = document.createElement("button");
  btn.className = "td-fb-btn";
  btn.type = "button";
  btn.textContent = t.btn;
  btn.addEventListener("click", function () {
    window.open(href, "_blank", "noopener");
  });
  function mount() {
    root.appendChild(btn);
    document.body.appendChild(root);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
```

- [ ] **Step 4: 빌드·테스트**

Run: `cd /Users/charles/1git/try-dabble-apps/packages/feedback && npm run build && npm test`
Expected: `ok - 4 languages x 1 keys`. `dist/feedback.js`가 `src/feedback.js`와 같은지 `diff -q src/feedback.js dist/feedback.js`로 확인(출력 없음).

- [ ] **Step 5: README 갱신**

`packages/feedback/README.md`에서 다음 두 곳을 바꾼다.

첫 문단의 `the floating "의견 / Feedback" button that every try-dabble app injects` → `the floating "가이드 & 의견 / Guide & Feedback" button that every try-dabble app injects. It opens the app's guide page on try-dabble.com in a new tab; the feedback form lives on that page, not in the widget.`

Public contract 목록의 `- Submissions POST to ... is **not** part of this package.` 줄을 다음으로 바꾼다.
`- Clicking the button opens \`https://try-dabble.com/{lang}/guides/{slug}\` in a new tab. The feedback form and \`POST /api/feedback\` live in try-dabble-main and are **not** part of this package.`

`## Layout` 섹션(존재하지 않는 `src/copy.js` 등 5줄을 나열)은 `src/feedback.js   single self-contained IIFE: copy, styles, host-page detection, mount` 한 줄로 바꾼다.

- [ ] **Step 6: sync-main은 하지 않고 커밋**

`npm run sync-main`은 Task 5까지 끝난 뒤 Task 6에서 한 번에 한다(main 쪽 폼이 없는 상태로 위젯만 먼저 배포되면 의견을 낼 곳이 없다).

```bash
cd /Users/charles/1git/try-dabble-apps
git add packages/feedback
git commit -m "feedback: Turn the widget into a Guide & Feedback link to the app's guide page."
```

---

### Task 2: 워커가 try-dabble.com Origin의 가이드 제출을 받는다 (try-dabble-main)

**Files:**
- Modify: `src/worker/feedback.ts:44-54` (`isAllowedOrigin`), `:78-87` (`pageMatchesSlug`), `:137-151` (slug/pageUrl 검사)
- Create: `test/feedback.test.tsx`

**Interfaces:**
- Consumes: `acceptFeedback(request: Request, env: { FEEDBACK: KVNamespace }): Promise<Response>` (기존).
- Produces: Origin `https://try-dabble.com` + body `{slug, kind, title, body, pageUrl: "https://try-dabble.com/{ko|en|ja|zh}/guides/{slug}"}` → 200 `{ok:true,id}`. pageUrl의 slug가 다르면 400 `{error:'url'}`. 모르는 slug면 400 `{error:'app'}`.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/feedback.test.tsx`를 만든다.

```tsx
import assert from 'node:assert/strict';
import test from 'node:test';

import { acceptFeedback } from '../src/worker/feedback';

function fakeKv() {
  const store = new Map<string, string>();
  return {
    store,
    kv: {
      get: async (key: string, type?: string) => {
        const v = store.get(key);
        if (v === undefined) return null;
        return type === 'json' ? JSON.parse(v) : v;
      },
      put: async (key: string, value: string) => { store.set(key, value); },
      list: async () => ({ keys: [] }),
    },
  };
}

function post(origin: string, body: unknown): Request {
  return new Request('https://try-dabble.com/api/feedback', {
    method: 'POST',
    headers: {
      Origin: origin,
      Host: 'try-dabble.com',
      'CF-Ray': 'test',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

const base = { kind: 'idea', title: '제목입니다', body: '내용입니다 네 글자 넘게' };

test('a guide page on try-dabble.com can file feedback for its own slug', async () => {
  const { kv, store } = fakeKv();
  const res = await acceptFeedback(
    post('https://try-dabble.com', { ...base, slug: 'sudoku', pageUrl: 'https://try-dabble.com/ko/guides/sudoku' }),
    { FEEDBACK: kv as never },
  );
  assert.equal(res.status, 200);
  const json = (await res.json()) as { ok: boolean; id: string };
  assert.equal(json.ok, true);
  const report = JSON.parse(store.get(`report:${json.id}`) ?? 'null');
  assert.equal(report.slug, 'sudoku');
  assert.deepEqual(JSON.parse(store.get('list:sudoku') ?? '[]'), [json.id]);
});

test('every site language prefix is accepted in the guide pageUrl', async () => {
  for (const lang of ['ko', 'en', 'ja', 'zh']) {
    const { kv } = fakeKv();
    const res = await acceptFeedback(
      post('https://try-dabble.com', { ...base, slug: 'omok', pageUrl: `https://try-dabble.com/${lang}/guides/omok` }),
      { FEEDBACK: kv as never },
    );
    assert.equal(res.status, 200, lang);
  }
});

test('a guide pageUrl for a different slug is rejected', async () => {
  const { kv } = fakeKv();
  const res = await acceptFeedback(
    post('https://try-dabble.com', { ...base, slug: 'sudoku', pageUrl: 'https://try-dabble.com/ko/guides/omok' }),
    { FEEDBACK: kv as never },
  );
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'url' });
});

test('a non-guide page on try-dabble.com is rejected', async () => {
  const { kv } = fakeKv();
  const res = await acceptFeedback(
    post('https://try-dabble.com', { ...base, slug: 'sudoku', pageUrl: 'https://try-dabble.com/ko/about' }),
    { FEEDBACK: kv as never },
  );
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'url' });
});

test('an unknown slug from try-dabble.com is rejected', async () => {
  const { kv } = fakeKv();
  const res = await acceptFeedback(
    post('https://try-dabble.com', { ...base, slug: 'nope', pageUrl: 'https://try-dabble.com/ko/guides/nope' }),
    { FEEDBACK: kv as never },
  );
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'app' });
});

test('app subdomains still work exactly as before', async () => {
  const { kv } = fakeKv();
  const res = await acceptFeedback(
    post('https://sudoku.try-dabble.com', { ...base, slug: 'sudoku', pageUrl: 'https://sudoku.try-dabble.com/?lang=ko' }),
    { FEEDBACK: kv as never },
  );
  assert.equal(res.status, 200);
  const cross = await acceptFeedback(
    post('https://sudoku.try-dabble.com', { ...base, slug: 'omok', pageUrl: 'https://omok.try-dabble.com/' }),
    { FEEDBACK: kv as never },
  );
  assert.equal(cross.status, 400);
  assert.deepEqual(await cross.json(), { error: 'app' });
});

test('www and other hosts are still refused', async () => {
  const { kv } = fakeKv();
  const res = await acceptFeedback(
    post('https://evil.example', { ...base, slug: 'sudoku' }),
    { FEEDBACK: kv as never },
  );
  assert.equal(res.status, 403);
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd /Users/charles/1git/try-dabble-main && TSX_TSCONFIG_PATH=./tsconfig.test.json node --import tsx --test test/feedback.test.tsx`
Expected: 처음 5개 테스트 FAIL(403 `origin`), 마지막 2개 PASS.

- [ ] **Step 3: 워커 구현**

`src/worker/feedback.ts`에서 다음을 바꾼다.

(a) `isLocalHost` 위에 상수와 helper 추가:

```ts
const MAIN_HOST = 'try-dabble.com';

function isMainHost(host: string): boolean {
  return host.toLowerCase() === MAIN_HOST;
}
```

(b) `isAllowedOrigin`의 마지막 return을 바꾼다:

```ts
    return isMainHost(u.hostname) || /^[a-z0-9-]+\.try-dabble\.com$/.test(u.hostname);
```

(c) `pageMatchesSlug`를 교체한다:

```ts
const GUIDE_PATH = /^\/(ko|en|ja|zh)\/guides\/([a-z0-9-]+)\/?$/;

function pageMatchesSlug(page: string, slug: string, localOrigin: boolean, mainOrigin: boolean): boolean {
  try {
    const u = new URL(page);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (isLocalHost(u.hostname)) return localOrigin;
    if (mainOrigin) {
      if (!isMainHost(u.hostname)) return false;
      const m = u.pathname.match(GUIDE_PATH);
      return !!m && m[2] === slug;
    }
    return u.hostname.toLowerCase() === `${slug}.try-dabble.com`;
  } catch {
    return false;
  }
}
```

(d) `acceptFeedback` 안의 slug/pageUrl 검사 블록(`const localOrigin = ...`부터 `if (pageUrl && !pageMatchesSlug(...))` 블록까지)을 교체한다:

```ts
  const originHost = new URL(origin).hostname;
  const localOrigin = isLocalHost(originHost);
  const mainOrigin = isMainHost(originHost);
  const originSlug = slugFromHost(originHost);
  let slug = typeof data.slug === 'string' ? data.slug.trim().toLowerCase() : '';
  if (!slug && originSlug) slug = originSlug;
  if (!localOrigin && !mainOrigin) {
    if (!originSlug || slug !== originSlug) return json(400, { error: 'app' }, origin);
  }
  if (!slug || (slug !== 'try-dabble' && !findService(slug) && !findGuide(slug))) {
    return json(400, { error: 'app' }, origin);
  }

  const pageUrl = typeof data.pageUrl === 'string' ? data.pageUrl.trim().slice(0, 400) : '';
  if (mainOrigin && !pageUrl) return json(400, { error: 'url' }, origin);
  if (pageUrl && !pageMatchesSlug(pageUrl, slug, localOrigin, mainOrigin)) {
    return json(400, { error: 'url' }, origin);
  }
```

main origin에서는 pageUrl이 필수다(가이드 페이지에서만 받는다는 뜻). 서브도메인 쪽은 기존처럼 pageUrl이 없어도 된다.

- [ ] **Step 4: 통과 확인 + 전체 테스트**

Run: `cd /Users/charles/1git/try-dabble-main && npm test`
Expected: 새 파일 7개 테스트 전부 PASS, 기존 site/zh 테스트도 PASS.

- [ ] **Step 5: 커밋**

```bash
cd /Users/charles/1git/try-dabble-main
git add src/worker/feedback.ts test/feedback.test.tsx
git commit -m "feedback: Accept submissions from guide pages on try-dabble.com."
```

---

### Task 3: 가이드 페이지 상단 "의견 보내기" 버튼 + Dialog 폼 (try-dabble-main)

**Files:**
- Create: `src/components/feedback-dialog.tsx`
- Modify: `src/content/site.ts:249-258` (`GUIDE_COPY` 타입) 및 ko/en/ja/zh 블록
- Modify: `src/pages/guides.tsx:101-157` (`GuidePage`)
- Modify: `test/site.test.tsx:113-120`

**Interfaces:**
- Consumes: Task 2의 API. `POST /api/feedback` JSON `{ slug, kind, title, body, lang, pageUrl, website, images }`.
- Produces: `export function FeedbackDialog({ slug, lang, label }: { slug: string; lang: Lang; label: string }): JSX.Element` — 버튼과 Dialog를 함께 렌더한다.

- [ ] **Step 1: 실패하는 테스트로 바꾼다**

`test/site.test.tsx`의 `'guide copy never names a storage API and carries no feedback widget'` 테스트를 다음으로 교체한다.

```tsx
test('guide copy never names a storage API, never loads the app widget, and shows the feedback button', () => {
  for (const lang of LANGS) {
    for (const guide of GUIDES) {
      const html = body({ kind: 'guide', slug: guide.slug }, lang);
      assert.doesNotMatch(html, /indexeddb|localstorage|local storage/i, `${guide.slug} (${lang})`);
      assert.doesNotMatch(html, /widget\/feedback\.js/, `${guide.slug} (${lang})`);
      assert.ok(html.includes(`data-feedback="open"`), `${guide.slug} (${lang}) feedback button`);
    }
  }
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd /Users/charles/1git/try-dabble-main && npm test`
Expected: 그 테스트만 FAIL(`feedback button`).

- [ ] **Step 3: `GUIDE_COPY`에 `feedback` 추가**

`src/content/site.ts`의 `GUIDE_COPY` 타입에 `feedback: string;`을 `faq: string;` 다음에 추가하고, 각 언어 블록의 `faq:` 줄 다음에 추가한다.

```ts
    feedback: '의견 보내기',     // ko
    feedback: 'Send feedback',   // en
    feedback: '意見を送る',       // ja
    feedback: '发送反馈',         // zh
```

- [ ] **Step 4: `FeedbackDialog` 컴포넌트 작성**

`src/components/feedback-dialog.tsx`:

```tsx
import { useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { Lang } from '../content/types';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type Kind = 'idea' | 'bug';

const COPY: Record<Lang, {
  idea: string; bug: string; title: string; body: string; send: string; sent: string;
  err: string; close: string; photo: string; drop: string; fileEmpty: string; fileOne: string; fileTwo: string;
}> = {
  ko: { idea: '기능 건의', bug: '버그 보고', title: '제목', body: '내용', send: '보내기', sent: '등록했어요.', err: '다시 시도해 주세요.', close: '닫기', photo: '이미지 첨부', drop: '최대 2장', fileEmpty: '선택된 파일 없음', fileOne: '1개 선택됨', fileTwo: '2개 선택됨' },
  en: { idea: 'Feature idea', bug: 'Bug report', title: 'Title', body: 'Details', send: 'Send', sent: 'Saved.', err: 'Please try again.', close: 'Close', photo: 'Attach images', drop: 'Up to 2', fileEmpty: 'No file selected', fileOne: '1 selected', fileTwo: '2 selected' },
  ja: { idea: '機能の提案', bug: 'バグ報告', title: 'タイトル', body: '内容', send: '送る', sent: '登録しました。', err: 'もう一度試してください。', close: '閉じる', photo: '画像を添付', drop: '最大2枚', fileEmpty: 'ファイル未選択', fileOne: '1件選択', fileTwo: '2件選択' },
  zh: { idea: '功能建议', bug: '问题反馈', title: '标题', body: '内容', send: '发送', sent: '已登记。', err: '请再试一次。', close: '关闭', photo: '添加图片', drop: '最多 2 张', fileEmpty: '未选择文件', fileOne: '已选 1 个', fileTwo: '已选 2 个' },
};

/** Downscale to a 1280px JPEG data URL, the same budget the old widget used. */
function compress(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      const max = 1280;
      if (w > max || h > max) {
        const s = Math.min(max / w, max / h);
        w = Math.round(w * s);
        h = Math.round(h * s);
      }
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

export function FeedbackDialog({ slug, lang, label }: { slug: string; lang: Lang; label: string }) {
  const t = COPY[lang];
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('idea');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);

  function reset() {
    setKind('idea');
    setTitle('');
    setBody('');
    setImages([]);
    setState('idle');
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function onFiles(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, 2);
    const rows = await Promise.all(files.map(compress));
    setImages(rows.filter((x): x is string => !!x).slice(0, 2));
  }

  async function send() {
    setState('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          kind,
          title: title.trim(),
          body: body.trim(),
          lang,
          pageUrl: location.href,
          website: hpRef.current?.value ?? '',
          images,
        }),
      });
      if (!res.ok) throw new Error('fail');
      setState('sent');
      setTimeout(() => onOpenChange(false), 1400);
    } catch {
      setState('error');
    }
  }

  const fileStatus = images.length === 0 ? t.fileEmpty : images.length === 1 ? t.fileOne : t.fileTwo;
  const kindButton = (k: Kind, text: string) => (
    <Button
      type="button"
      size="sm"
      variant={kind === k ? 'default' : 'outline'}
      className="flex-1"
      onClick={() => setKind(k)}
    >
      {text}
    </Button>
  );

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="gap-1.5"
        data-feedback="open"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="size-4" aria-hidden />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription className="sr-only">{label}</DialogDescription>
          </DialogHeader>

          {state === 'sent' ? (
            <p className="py-6 text-center text-[15px] text-foreground">{t.sent}</p>
          ) : (
            <form
              className="grid gap-3"
              onSubmit={(e) => { e.preventDefault(); void send(); }}
            >
              <div className="flex gap-2">
                {kindButton('idea', t.idea)}
                {kindButton('bug', t.bug)}
              </div>
              <label className="grid gap-1 text-xs text-muted-foreground">
                {t.title}
                <input
                  name="title"
                  maxLength={120}
                  required
                  minLength={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                {t.body}
                <textarea
                  name="body"
                  maxLength={2000}
                  required
                  minLength={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-28 resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  tabIndex={-1}
                  aria-hidden
                  className="sr-only"
                  onChange={(e) => void onFiles(e.target.files)}
                />
                <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  {t.photo} ({t.drop})
                </Button>
                <span className="text-xs text-muted-foreground">{fileStatus}</span>
              </div>
              {images.length > 0 && (
                <div className="flex gap-2">
                  {images.map((src, i) => (
                    <img key={i} src={src} alt="" className="size-16 rounded-md border border-border object-cover" />
                  ))}
                </div>
              )}
              <input ref={hpRef} name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" />
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t.close}
                </Button>
                <Button type="submit" disabled={state === 'sending'}>
                  {state === 'error' ? t.err : t.send}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 5: `GuidePage`에 버튼 배치**

`src/pages/guides.tsx`:

import에 추가:
```tsx
import { FeedbackDialog } from '../components/feedback-dialog';
```

`GuidePage`의 `{service && (<> ... </>)}` 블록을 다음으로 교체한다. 버튼 줄은 service 유무와 상관없이 항상 렌더되고, "앱 열기"는 service가 있을 때만 그 줄 안에 들어간다.

```tsx
      {service && (
        // The card art is the page's first answer to "what is this?" — object-contain
        // so the whole 1200x630 frame stays readable at any column width.
        <img
          src={resolveOgImage(service.ogImage, lang)}
          alt={resolveName(service.name, lang)}
          width={1200}
          height={630}
          className="mt-6 aspect-[1200/630] w-full rounded-lg border border-border bg-secondary/40 object-contain"
        />
      )}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {service && (
          <a
            href={serviceUrl(service, lang, DEFAULT_LANG)}
            className={buttonVariants({ size: 'default', className: 'gap-1.5' })}
          >
            {t.openApp}
            <span className="text-primary-foreground/70">{hostOf(service.url)}</span>
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        )}
        <FeedbackDialog slug={guide.slug} lang={lang} label={t.feedback} />
      </div>
```

- [ ] **Step 6: 테스트·타입체크·빌드**

Run: `cd /Users/charles/1git/try-dabble-main && npm test && npm run build`
Expected: 전부 PASS, 빌드 성공. `tsc -b`가 `noUnusedLocals`를 켜고 있으니 안 쓰는 import가 없어야 한다.

- [ ] **Step 7: 브라우저에서 눈으로 확인**

Run: `cd /Users/charles/1git/try-dabble-main && npm run preview` (wrangler dev, 보통 `http://localhost:8787`)
`http://localhost:8787/ko/guides/sudoku`를 열어: 제목 아래 "앱 열기" 옆에 "의견 보내기" 버튼이 보이는지, 누르면 Dialog가 열리는지, 제목 2자·내용 4자 이상 넣고 보내면 "등록했어요."가 뜨는지 확인. 로컬 origin은 `isLocalDev`로 허용되므로 로컬 KV에 저장된다. 확인 후 서버를 끈다.

- [ ] **Step 8: 커밋**

```bash
cd /Users/charles/1git/try-dabble-main
git add src/components/feedback-dialog.tsx src/content/site.ts src/pages/guides.tsx test/site.test.tsx
git commit -m "guides: Put a Send feedback button and form at the top of every guide page."
```

---

### Task 4: "가이드에 feedback 섹션 없음" 규칙 삭제 (try-dabble-main)

**Files:**
- Modify: `src/content/guides/types.ts`
- Modify: `src/content/guides/index.ts:33`
- Modify: `src/content/guides/*.ts` — `// New guides must not include a feedback section or posts.` 줄이 있는 14개 파일
- Modify: `docs/feedback-widget.md`

- [ ] **Step 1: 사용처 없음 확인**

Run: `cd /Users/charles/1git/try-dabble-main && grep -rn "GuidePost\|FeedbackKind\|\.posts\b" src test | grep -v "content/guides/types.ts\|content/guides/index.ts\|worker/feedback.ts"`
Expected: 출력 없음. (`worker/feedback.ts`의 `FeedbackKind`는 별개의 자체 타입이라 그대로 둔다.)

- [ ] **Step 2: 타입 정리**

`src/content/guides/types.ts`를 다음으로 교체한다.

```ts
import type { I18n } from '../types';

export type GuideSection = {
  heading: I18n;
  paragraphs?: I18n[];
  bullets?: I18n[];
  /** When set, rendered as FAQ and included in FAQPage JSON-LD. */
  faq?: boolean;
};

export type Guide = {
  slug: string;
  updatedAt: string;
  title: I18n;
  description: I18n;
  keywords: I18n;
  sections: GuideSection[];
};
```

`src/content/guides/index.ts`의 마지막 줄을 다음으로 바꾼다.

```ts
export type { Guide, GuideSection } from './types';
```

- [ ] **Step 3: 가이드 파일 주석 삭제**

Run:
```bash
cd /Users/charles/1git/try-dabble-main
grep -l "New guides must not include a feedback section or posts" src/content/guides/*.ts \
  | xargs sed -i '' '/^\/\/ New guides must not include a feedback section or posts\.$/{N;/\n$/d;}'
grep -rn "must not include a feedback" src docs | wc -l
```
Expected: 마지막 출력 `1`(docs/feedback-widget.md만 남음). `git diff --stat`으로 14개 파일이 각각 2줄(주석 + 빈 줄) 삭제됐는지 확인한다.

- [ ] **Step 4: 문서 갱신**

`docs/feedback-widget.md`:

첫 문단 `공용 기능 건의 / 버그 보고 위젯. 앱마다 복사하지 않는다.` → `공용 "가이드 & 의견" 버튼. 누르면 앱의 가이드 페이지(\`/{lang}/guides/{slug}\`)를 새 탭으로 열고, 의견 폼은 가이드 페이지 상단 "의견 보내기" 버튼(\`src/components/feedback-dialog.tsx\`)에 있다. 앱마다 복사하지 않는다.`

`## 등록` 목록을 다음으로 교체한다.

```md
- `POST https://try-dabble.com/api/feedback` — `{ slug, kind: "bug"|"idea", title, body, lang?, pageUrl?, images? }`
- Origin이 `https://try-dabble.com`이면 `pageUrl`이 `https://try-dabble.com/{ko|en|ja|zh}/guides/{slug}`여야 받는다(가이드 페이지의 폼). Origin이 `https://{slug}.try-dabble.com`이면 이전과 같이 slug가 서브도메인과 같아야 받는다.
- KV `FEEDBACK`에 저장된다. 읽는 법은 [feedback-guide.md](feedback-guide.md).
```

- [ ] **Step 5: 테스트·빌드·커밋**

Run: `cd /Users/charles/1git/try-dabble-main && npm test && npm run build`
Expected: PASS.

```bash
git add src/content/guides docs/feedback-widget.md
git commit -m "guides: Drop the no-feedback-section rule now that the form lives on guide pages."
```

---

### Task 5: mixshelf 서비스·OG·가이드 추가 (try-dabble-main)

**Files:**
- Create: `public/og/mixshelf-ko.png`, `mixshelf-en.png`, `mixshelf-ja.png`, `mixshelf-zh.png`
- Create: `src/content/services/mixshelf.ts`
- Create: `src/content/guides/mixshelf.ts`
- Modify: `src/content/services/index.ts`, `src/content/guides/index.ts`

**Interfaces:**
- Produces: `SERVICES`에 `mixshelf`(slug `mixshelf`), `GUIDES`에 `mixshelfGuide`. 기존 테스트가 홈 카드·가이드 라우트·sitemap을 자동으로 검사한다.

- [ ] **Step 1: 실패하는 테스트 확인(기존 테스트가 곧 실패 기준)**

서비스만 먼저 등록하면 `'every guide and service resolves'` 테스트가 `guide for mixshelf`로 실패한다. 그래서 Step 2~3을 한 번에 하고 Step 5에서 PASS를 본다. 별도 테스트는 추가하지 않는다.

- [ ] **Step 2: OG 이미지 복사**

```bash
cd /Users/charles/1git/try-dabble-main
for l in ko en ja zh; do cp ../try-dabble-apps/apps/mixshelf/public/og-image-$l.png public/og/mixshelf-$l.png; done
file public/og/mixshelf-*.png
```
Expected: 4개 모두 `PNG image data, 1200 x 630`.

- [ ] **Step 3: 서비스 등록**

`src/content/services/mixshelf.ts`:

```ts
import type { WebService } from '../types';

export const mixshelf: WebService = {
  slug: 'mixshelf',
  name: {
    ko: '믹선반',
    en: 'Mixshelf',
    ja: 'ミックス棚',
    zh: '混合书架',
  },
  description: {
    ko: '책·게임·영화·TV를 한 선반에 모아 두고 내가 만든 태그로 골라 보는 개인 도서관 — 로그인도 유형별 한도도 없이 이 기기에만, JSON 백업 (로컬·PWA)',
    en: 'Books, games, movies and TV on one shelf, filtered by tags you make up — no login, no per-type cap, this device only, JSON backup (local PWA)',
    ja: '本・ゲーム・映画・TVを一つの棚にまとめ、自分で作ったタグで選ぶ個人ライブラリ — ログインも種類別の上限もなくこの端末だけに、JSONバックアップ（ローカル・PWA）',
    zh: '把书、游戏、电影、剧集放在同一个架子上，用自己定的标签筛选 — 无需登录，没有分类上限，只在这台设备，JSON 备份（本地 PWA）',
  },
  url: 'https://mixshelf.try-dabble.com',
  ogImage: {
    ko: 'https://try-dabble.com/og/mixshelf-ko.png',
    en: 'https://try-dabble.com/og/mixshelf-en.png',
    ja: 'https://try-dabble.com/og/mixshelf-ja.png',
    zh: 'https://try-dabble.com/og/mixshelf-zh.png',
  },
  category: 'EntertainmentApplication',
};
```

`src/content/services/index.ts`: `import { outcheck } from './outcheck';` 다음에 `import { mixshelf } from './mixshelf';`를 넣고, `SERVICES` 배열 끝(`outcheck` 뒤)에 `mixshelf`를 추가한다.

- [ ] **Step 4: 가이드 작성**

`src/content/guides/mixshelf.ts`:

```ts
import type { Guide } from './types';

export const mixshelfGuide: Guide = {
  slug: 'mixshelf',
  updatedAt: '2026-09-06',
  title: {
    ko: '믹선반 가이드 — 책·게임·영화·TV를 한 선반에, 태그는 내 마음대로',
    en: 'Mixshelf guide — books, games, movies and TV on one shelf, tagged your way',
    ja: 'ミックス棚ガイド — 本・ゲーム・映画・TVを一つの棚に、タグは自分流で',
    zh: '混合书架指南 — 书、游戏、电影、剧集放在一个架子上，标签自己定',
  },
  description: {
    ko: '책·게임·영화·TV 제목을 직접 적고, Author: Stephen King 같은 태그를 마음대로 붙여 유형과 태그로 골라 보는 개인 선반입니다. 바코드도 카탈로그 계정도 없고, 로그인·구독·유형별 무료 한도 없이 이 기기에만 저장되며 JSON으로 내보내기와 가져오기가 됩니다.',
    en: 'A personal shelf where you type the title of a book, game, movie or TV show yourself, attach any tags you like — Author: Stephen King, say — and filter by type and tag. No barcode, no catalogue account, no login, no subscription, no per-type free cap; it stays on this device and exports and imports as JSON.',
    ja: '本・ゲーム・映画・TVのタイトルを自分で書き、Author: Stephen King のようなタグを好きに付けて、種類とタグで選ぶ個人の棚です。バーコードもカタログのアカウントもなく、ログイン・サブスク・種類別の無料上限もなしにこの端末だけに保存され、JSONで書き出しと読み込みができます。',
    zh: '一个个人书架：自己输入书、游戏、电影或剧集的标题，随意加上像 Author: Stephen King 这样的标签，再按类型和标签筛选。没有条码，没有目录账号，不用登录、不用订阅、没有分类免费上限；只存在这台设备上，可以导出和导入 JSON。',
  },
  keywords: {
    ko: '믹선반,개인 도서관 앱,책 게임 영화 한 선반,커스텀 태그,태그 필터,유형 필터,수동 제목 입력,바코드 없는 도서관,로그인 없는 컬렉션 앱,유형별 한도 없음,JSON 내보내기,JSON 가져오기,읽음 상태,위시리스트,설치되는 웹앱,PWA',
    en: 'mixshelf, personal library app, books games movies one shelf, custom tags, tag filter, type filter, manual title entry, no barcode library, no login collection app, no per-type cap, json export, json import, read status, wishlist, installable web app, local PWA',
    ja: 'ミックス棚,個人ライブラリアプリ,本 ゲーム 映画 一つの棚,カスタムタグ,タグで絞り込み,種類で絞り込み,タイトル手入力,バーコードなしの蔵書管理,ログイン不要のコレクションアプリ,種類別上限なし,JSON書き出し,JSON読み込み,読了ステータス,ウィッシュリスト,インストールできるウェブアプリ,PWA',
    zh: '混合书架,个人图书馆应用,书 游戏 电影 一个架子,自定义标签,标签筛选,类型筛选,手动输入标题,无条码藏书管理,免登录收藏应用,无分类上限,JSON导出,JSON导入,已读状态,愿望清单,可安装的网页应用,PWA',
  },
  sections: [
    {
      heading: { ko: '이 앱이 하는 일', en: 'What this app does', ja: 'このアプリでできること', zh: '这个应用做什么' },
      paragraphs: [
        {
          ko: '믹선반은 책, 게임, 영화, TV를 유형별로 다른 앱에 나눠 두지 않고 한 선반에 올려 두는 개인 도서관입니다. 작품 하나는 제목, 유형(책·게임·영화·TV), 태그 여러 개, 짧은 메모, 상태(안 읽음·읽는 중·읽음·플레이 중·완료·위시·없음)로 이루어집니다. 제목은 직접 적습니다. 바코드 스캔도, 외부 카탈로그 검색도, 표지 이미지 내려받기도 없습니다.',
          en: 'Mixshelf is a personal library that keeps books, games, movies and TV on one shelf instead of in a different app per type. An item is a title, a type (book, game, movie, TV), any number of tags, a short note and a status (unread, reading, read, playing, finished, wishlist, or none). You type the title yourself. There is no barcode scan, no external catalogue search, and no cover download.',
          ja: 'ミックス棚は、本・ゲーム・映画・TVを種類ごとに別のアプリへ分けず、一つの棚に置いておく個人ライブラリです。作品一つは、タイトル、種類（本・ゲーム・映画・TV）、いくつでも付けられるタグ、短いメモ、ステータス（未読・読書中・読了・プレイ中・完了・ウィッシュ・なし）でできています。タイトルは自分で書きます。バーコードのスキャンも、外部カタログの検索も、表紙画像のダウンロードもありません。',
          zh: '混合书架是一个把书、游戏、电影、剧集放在同一个架子上的个人图书馆，而不是按类型分散在不同应用里。一个条目由标题、类型（书、游戏、电影、剧集）、任意数量的标签、一条短备注和一个状态（未读、在读、已读、在玩、已完成、愿望、无）组成。标题由你自己输入。没有条码扫描，没有外部目录搜索，也不会下载封面。',
        },
        {
          ko: '태그가 이 앱의 정리 방식입니다. 미리 정해진 장르 목록이 없고, Author: Stephen King, 2024, 재탕, 아이와 같이 처럼 원하는 문구를 태그로 붙입니다. 한 작품에 여러 태그를 달 수 있고, 같은 태그는 대소문자를 구분하지 않고 하나로 칩니다. 선반은 유형과 태그로 걸러 보고, 제목으로 검색합니다.',
          en: 'Tags are how this app organises things. There is no preset genre list; you attach whatever phrase you want — Author: Stephen King, 2024, rewatch, with the kids. An item can carry several tags, and the same tag in different capitalisation counts as one. You narrow the shelf by type and by tag, and search by title.',
          ja: 'タグがこのアプリの整理の仕方です。あらかじめ決まったジャンル一覧はなく、Author: Stephen King、2024、再見、子どもと のように好きな語句をタグにします。一つの作品に複数のタグを付けられ、大文字小文字が違うだけの同じタグは一つとして扱います。棚は種類とタグで絞り込み、タイトルで検索します。',
          zh: '标签就是这个应用的整理方式。没有预设的类型列表，想加什么就加什么 — Author: Stephen King、2024、重看、和孩子一起。一个条目可以有多个标签，只是大小写不同的同一个标签算作一个。架子按类型和标签筛选，按标题搜索。',
        },
      ],
    },
    {
      heading: { ko: '쓰는 법', en: 'How to use it', ja: '使い方', zh: '怎么用' },
      bullets: [
        {
          ko: '"작품 추가"를 누르고 제목을 적습니다. 제목만 있으면 저장됩니다. 유형은 책·게임·영화·TV 중 하나를 고르고, 태그는 적고 엔터(또는 "태그 추가")로 하나씩 붙입니다. 메모와 상태는 선택입니다.',
          en: 'Press “Add item” and type the title. A title alone is enough to save. Pick one of book, game, movie or TV, and add tags one at a time with Enter (or “Add tag”). Note and status are optional.',
          ja: '「作品を追加」を押してタイトルを書きます。タイトルだけで保存できます。種類は本・ゲーム・映画・TVから一つ選び、タグは書いてEnter（または「タグを追加」）で一つずつ付けます。メモとステータスは任意です。',
          zh: '点“添加作品”，输入标题。只有标题也能保存。类型在书、游戏、电影、剧集里选一个，标签输入后按回车（或“添加标签”）一个一个加。备注和状态可填可不填。',
        },
        {
          ko: '선반 위쪽의 유형 칩과 태그 칩을 눌러 걸러 봅니다. 여러 개를 동시에 켤 수 있고, "필터 지우기"로 한 번에 풉니다. 제목 검색은 필터와 함께 적용됩니다.',
          en: 'Tap the type chips and tag chips above the shelf to narrow it. Several can be on at once, and “Clear filters” resets them together. Title search applies on top of the filters.',
          ja: '棚の上にある種類のチップとタグのチップを押して絞り込みます。複数を同時にオンにでき、「フィルターを消す」で一度に外せます。タイトル検索はフィルターと合わせて効きます。',
          zh: '点架子上方的类型标签和自定义标签来筛选。可以同时打开多个，“清除筛选”一次全部取消。标题搜索会叠加在筛选之上。',
        },
        {
          ko: '작품 카드의 "고치기"로 제목·유형·태그·메모·상태를 바꾸고, "삭제"는 한 번 더 확인한 뒤 지웁니다. 삭제는 되돌릴 수 없으니 JSON 백업이 있으면 거기서 다시 가져옵니다.',
          en: '“Edit” on a card changes the title, type, tags, note and status; “Delete” asks once more before removing. Deleting cannot be undone, so restore from a JSON backup if you have one.',
          ja: 'カードの「直す」でタイトル・種類・タグ・メモ・ステータスを変え、「削除」はもう一度確認してから消します。削除は元に戻せないので、JSONバックアップがあればそこから読み込み直します。',
          zh: '卡片上的“修改”可以改标题、类型、标签、备注和状态；“删除”会再确认一次才删。删除无法撤销，有 JSON 备份的话就从备份重新导入。',
        },
        {
          ko: '"백업"에서 선반 전체를 JSON 파일로 내보내고, 같은 파일을 가져올 수 있습니다. 가져오기는 지금 선반을 파일 내용으로 통째로 바꾸므로, 먼저 지금 선반을 내보내 두고 진행합니다.',
          en: '“Backup” exports the whole shelf as a JSON file and imports one back. Import replaces the current shelf with the file’s contents, so export the current shelf first.',
          ja: '「バックアップ」で棚全体をJSONファイルに書き出し、同じファイルを読み込めます。読み込みは今の棚をファイルの内容にまるごと置き換えるので、先に今の棚を書き出してから進めます。',
          zh: '在“备份”里可以把整个架子导出成 JSON 文件，也能把文件导回来。导入会用文件内容整个替换当前架子，所以先把现在的架子导出一份再操作。',
        },
      ],
    },
    {
      heading: { ko: '없는 것들', en: 'What is not here', ja: 'ないもの', zh: '这里没有的东西' },
      paragraphs: [
        {
          ko: '계정, 로그인, 구독, 유형별 무료 한도가 없습니다. 바코드 스캔, 외부 데이터베이스 검색, 표지·평점·줄거리 자동 채우기가 없습니다. 기기 간 동기화, 공유 링크, 친구 기능이 없습니다. 있는 것은 제목·유형·태그·메모·상태와 JSON 파일뿐입니다.',
          en: 'No account, login, subscription or per-type free cap. No barcode scan, no external database lookup, no automatic cover, rating or synopsis. No sync between devices, no share link, no friends. What there is: title, type, tags, note, status, and a JSON file.',
          ja: 'アカウント、ログイン、サブスク、種類別の無料上限はありません。バーコードのスキャン、外部データベースの検索、表紙・評価・あらすじの自動入力もありません。端末間の同期、共有リンク、フレンド機能もありません。あるのはタイトル・種類・タグ・メモ・ステータスとJSONファイルだけです。',
          zh: '没有账号、登录、订阅，也没有分类免费上限。没有条码扫描，没有外部数据库查询，不会自动填封面、评分或简介。没有多设备同步，没有分享链接，没有好友功能。有的只是标题、类型、标签、备注、状态，和一个 JSON 文件。',
        },
      ],
    },
    {
      heading: { ko: '자주 묻는 질문', en: 'FAQ', ja: 'よくある質問', zh: '常见问题' },
      paragraphs: [
        {
          ko: '자동 채우기, 가입과 한도, 태그 정리, 저장 위치에 대한 질문이 반복해서 나옵니다. 범위는 아래와 같습니다.',
          en: 'The repeating questions are about auto-fill, signing up and limits, tag housekeeping, and where things are kept. Below is the actual scope.',
          ja: '自動入力、登録と上限、タグの整理、保存先についての質問が繰り返されます。範囲は以下です。',
          zh: '反复出现的问题是自动填充、注册与上限、标签整理，以及存在哪里。下面是它实际的范围。',
        },
      ],
    },
    {
      faq: true,
      heading: {
        ko: '바코드를 찍거나 제목을 검색하면 정보가 자동으로 채워지나요?',
        en: 'Does scanning a barcode or searching a title fill things in automatically?',
        ja: 'バーコードを読んだりタイトルを検索すると情報が自動で入りますか？',
        zh: '扫条码或搜索标题会自动填好信息吗？',
      },
      paragraphs: [
        {
          ko: '아니요. 제목은 직접 적고, 표지·저자·출시일·평점 같은 것은 어디에서도 가져오지 않습니다. 저자를 남기고 싶으면 Author: Stephen King 같은 태그로 붙이는 방식입니다. 그 대신 외부 서비스에 무엇을 갖고 있는지 알려 주는 일도 없습니다.',
          en: 'No. You type the title, and nothing — cover, author, release date, rating — is fetched from anywhere. To keep an author, attach a tag like Author: Stephen King. The flip side is that no outside service ever learns what you own.',
          ja: 'いいえ。タイトルは自分で書き、表紙・著者・発売日・評価などはどこからも取ってきません。著者を残したいなら Author: Stephen King のようなタグで付けます。その代わり、外部サービスに何を持っているか知られることもありません。',
          zh: '不会。标题要自己输入，封面、作者、发行日期、评分之类的都不会从任何地方抓取。想记住作者，就加一个像 Author: Stephen King 这样的标签。反过来，也没有任何外部服务会知道你收藏了什么。',
        },
      ],
    },
    {
      faq: true,
      heading: {
        ko: '가입하거나 결제해야 하나요? 몇 개까지 넣을 수 있나요?',
        en: 'Do I need an account, and how many items can I keep?',
        ja: '登録や支払いは必要ですか？何件まで入れられますか？',
        zh: '需要注册或付费吗？最多能放多少条？',
      },
      paragraphs: [
        {
          ko: '계정도 로그인도 결제도 없고, 건수 제한도 없습니다. 컬렉션 앱 중에는 책은 무료지만 게임이나 영화는 유료판에서 풀어 주거나, 유형마다 무료 개수를 따로 두는 것들이 있습니다. 여기는 네 유형이 처음부터 같은 선반이라 그런 단계가 없습니다.',
          en: 'No account, no login, no payment, and no item limit. Some collection apps keep books free but unlock games or movies in a paid tier, or set a separate free count per type. Here all four types sit on the same shelf from the start, so that step does not exist.',
          ja: 'アカウントもログインも支払いもなく、件数の制限もありません。コレクションアプリには、本は無料でもゲームや映画は有料版で開くものや、種類ごとに無料の件数を分けるものがあります。ここは四つの種類が最初から同じ棚なので、その段階がありません。',
          zh: '没有账号，不用登录，不用付费，也没有条数上限。有些收藏应用书是免费的，但游戏或电影要付费版才开放，或者每个类型各设一个免费数量。这里四种类型从一开始就在同一个架子上，所以没有这一层。',
        },
      ],
    },
    {
      faq: true,
      heading: {
        ko: '태그를 잘못 적었으면 어떻게 하나요?',
        en: 'What if I misspell a tag?',
        ja: 'タグを打ち間違えたらどうしますか？',
        zh: '标签打错了怎么办？',
      },
      paragraphs: [
        {
          ko: '그 작품을 "고치기"로 열어 태그를 지우고 다시 붙입니다. 태그 이름을 한곳에서 바꿔 모든 작품에 반영하는 기능은 없습니다. 아무 작품에도 붙어 있지 않은 태그는 필터 칩에서 저절로 사라집니다. 대소문자만 다른 태그는 같은 태그로 칩니다.',
          en: 'Open that item with “Edit”, remove the tag and add it again. There is no rename-everywhere for tags. A tag that no item carries any more simply disappears from the filter chips. Tags that differ only in capitalisation count as the same tag.',
          ja: 'その作品を「直す」で開き、タグを消して付け直します。タグ名を一か所で変えて全作品に反映する機能はありません。どの作品にも付いていないタグはフィルターのチップから自然に消えます。大文字小文字だけ違うタグは同じタグとして扱います。',
          zh: '用“修改”打开那个条目，删掉标签再加一遍。没有一处改名、全部生效的功能。没有任何条目使用的标签会自动从筛选标签里消失。只是大小写不同的标签算作同一个。',
        },
      ],
    },
    {
      faq: true,
      heading: {
        ko: '적어 둔 내용이 서버로 올라가나요? 다른 기기로 옮길 수 있나요?',
        en: 'Is anything uploaded, and can I move it to another device?',
        ja: '書いた内容はサーバーに上がりますか？別の端末へ移せますか？',
        zh: '记下的内容会上传吗？能搬到别的设备吗？',
      },
      paragraphs: [
        {
          ko: '올라가지 않습니다. 선반은 이 기기의 이 브라우저에만 남습니다. 계정 동기화도 클라우드 백업도 없습니다. 옮기려면 "백업"에서 JSON으로 내보내 다른 기기에서 가져오면 되고, 그 파일도 이 화면에서 만들어져 곧바로 다운로드로 넘어갑니다. 대신 브라우저의 사이트 데이터를 지우면 선반도 함께 지워지니, 잃으면 안 되는 선반은 내보내 두세요. Google AdSense 광고가 붙을 수 있습니다.',
          en: 'Nothing is uploaded. The shelf stays in this browser on this device. There is no account sync and no cloud backup. To move it, export JSON from “Backup” and import it on the other device; that file is built in this page and handed straight to your download. The trade-off is that clearing the browser’s site data clears the shelf too, so export any shelf you cannot lose. Google AdSense ads may appear.',
          ja: '上がりません。棚はこの端末のこのブラウザにだけ残ります。アカウント同期もクラウドバックアップもありません。移すには「バックアップ」でJSONを書き出し、別の端末で読み込みます。そのファイルもこの画面で作られてそのままダウンロードへ渡されます。その代わりブラウザのサイトデータを消すと棚も消えるので、失えない棚は書き出しておいてください。Google AdSense広告が出ることがあります。',
          zh: '不会上传。架子只留在这台设备的这个浏览器里。没有账号同步，也没有云端备份。要搬走，就在“备份”里导出 JSON，到另一台设备导入；这个文件是在这个页面里生成、直接交给浏览器下载的。代价是清掉浏览器的站点数据，架子也会一起消失，所以丢不起的架子请先导出一份。页面上可能出现 Google AdSense 广告。',
        },
      ],
    },
  ],
};
```

`src/content/guides/index.ts`: `import { outcheckGuide } from './outcheck';` 다음에 `import { mixshelfGuide } from './mixshelf';`를 넣고, `GUIDES` 배열 끝(`outcheckGuide` 뒤)에 `mixshelfGuide`를 추가한다.

- [ ] **Step 5: 테스트·빌드**

Run: `cd /Users/charles/1git/try-dabble-main && npm test && npm run build`
Expected: PASS(홈 카드 `href="/ko/guides/mixshelf"`, 가이드 라우트, sitemap 포함이 기존 테스트로 검증됨).

- [ ] **Step 6: 렌더 확인**

Run: `cd /Users/charles/1git/try-dabble-main && npm run preview`
`http://localhost:8787/ko/guides/mixshelf`, `/en/guides/mixshelf`를 열어 카드 이미지·"앱 열기"·"의견 보내기"·본문·FAQ가 보이는지 확인. `http://localhost:8787/sitemap.xml`에 `guides/mixshelf`가 4개 언어로 있는지 확인. 서버를 끈다.

- [ ] **Step 7: 커밋**

```bash
cd /Users/charles/1git/try-dabble-main
git add public/og/mixshelf-*.png src/content/services/mixshelf.ts src/content/services/index.ts src/content/guides/mixshelf.ts src/content/guides/index.ts
git commit -m "mixshelf: Register the service and add its guide in ko/en/ja/zh."
```

---

### Task 6: 위젯 동기화, 앱→가이드 E2E, 배포 준비

**Files:**
- Modify: `try-dabble-main/public/widget/feedback.js` (sync-main 결과물)

- [ ] **Step 1: 위젯을 main으로 복사**

```bash
cd /Users/charles/1git/try-dabble-apps/packages/feedback && npm run build && npm run sync-main
cd /Users/charles/1git/try-dabble-main && diff -q public/widget/feedback.js ../try-dabble-apps/packages/feedback/dist/feedback.js && echo SAME
```
Expected: `SAME`.

- [ ] **Step 2: 앱 → 가이드 E2E (로컬)**

터미널 1: `cd /Users/charles/1git/try-dabble-main && npm run preview` (`http://localhost:8787`)
터미널 2: `cd /Users/charles/1git/try-dabble-apps/apps/sudoku && npm run dev`

sudoku 로컬 페이지의 우하단 버튼이 "가이드 & 의견"으로 보이는지 확인한다. 로컬 dev는 worker 주입이 없어 위젯이 안 뜰 수 있다. 그 경우 브라우저 콘솔에서 다음을 실행해 main의 위젯을 직접 붙여 확인한다.

```js
var s=document.createElement('script');s.src='http://localhost:8787/widget/feedback.js';s.setAttribute('data-app','sudoku');document.body.appendChild(s);
```

버튼 클릭 → 새 탭에 `https://try-dabble.com/ko/guides/sudoku`가 열리는지 확인(위젯의 `SITE`는 프로덕션 고정이라 프로덕션 가이드가 열린다. 배포 전이므로 그 페이지에 아직 "의견 보내기"는 없다. URL만 확인하면 된다). 두 서버를 끈다.

- [ ] **Step 3: 커밋**

```bash
cd /Users/charles/1git/try-dabble-main
git add public/widget/feedback.js
git commit -m "feedback: Sync the Guide & Feedback widget from try-dabble-apps."
```

- [ ] **Step 4: 배포는 사용자 확인 후**

배포 순서는 main 먼저(폼과 API가 먼저 있어야 함), 앱은 배포 불필요(위젯은 CDN).

```bash
cd /Users/charles/1git/try-dabble-main && npm run deploy
```

프로덕션 확인: `https://try-dabble.com/ko/guides/sudoku`에 "의견 보내기"가 보이고 제출이 200을 돌려주는지, `https://sudoku.try-dabble.com`의 우하단 버튼이 "가이드 & 의견"인지, `https://try-dabble.com/ko/guides/mixshelf`가 열리는지.
저장 확인: `cd /Users/charles/1git/try-dabble-main && npx tsx scripts/dump-feedback.ts --app sudoku`에 방금 낸 레코드가 `origin: "https://try-dabble.com"`으로 있는지.

**배포와 push는 사용자에게 먼저 묻는다.** 두 저장소의 `git push`도 마찬가지.
