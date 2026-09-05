# 가이드 & 의견 — 위젯을 가이드 페이지로 보내고, 의견 폼은 가이드 페이지에서 받기

작성일: 2026-09-06
관련 저장소: `try-dabble-apps`(이 저장소), `try-dabble-main`(옆 디렉터리)

## 목적

각 웹앱에 떠 있는 공용 위젯 버튼을 "가이드 & 의견"으로 바꾸고, 누르면 try-dabble.com의 해당 앱 가이드 페이지를 연다.
의견(기능 건의/버그 보고) 작성은 가이드 페이지 상단의 "의견 보내기" 버튼으로 받는다.
앱 안에서 의견 패널을 여는 방식은 없앤다.

## 바뀌지 않는 것

- 22개 웹앱 코드. 위젯은 각 앱 worker가 `<script src="https://try-dabble.com/widget/feedback.js" data-app="{slug}" defer>`로 주입하므로 위젯 파일 하나만 바꾼다.
- 앱 footer의 `Guide` 링크(21개 앱, 크롤 경로용). 그대로 둔다.
- 피드백 저장 형식(KV `FEEDBACK`의 `report:`/`list:`/`img:`/`rl:` 키)과 `scripts/dump-feedback.ts`, `docs/feedback-guide.md`.
- 위젯 공개 URL `https://try-dabble.com/widget/feedback.js`와 배포 순서(`npm run build` → `npm test` → `npm run sync-main` → main 배포).

## 1. 위젯 — `packages/feedback/src/feedback.js`

- 버튼 문구 `COPY[lang].btn`:
  - ko `가이드 & 의견`, en `Guide & Feedback`, ja `ガイド & 意見`, zh `指南 & 反馈`
- 클릭 시 `window.open("https://try-dabble.com/{lang}/guides/{slug}", "_blank", "noopener")`.
  - `lang`은 기존 `lang()` 결과(`data-lang` → `?lang=` → `html[lang]` → `ko`).
  - `slug`는 기존 `slug()` 결과(`data-app` → 서브도메인). 비어 있으면 `https://try-dabble.com/{lang}/guides`.
- 새 탭으로 여는 이유: 앱 상태를 잃지 않고, 홈 화면에 설치한 PWA에서 같은 탭 이동은 되돌아오기 어렵다.
- 제거: 패널(`open`/`close`/`send`), 이미지 압축(`compress`), `ENDPOINT`, 패널 관련 CSS와 문구 키(`idea`/`bug`/`title`/`body`/`send`/`sent`/`err`/`close`/`photo`/`drop`/`fileEmpty`/`fileOne`/`fileTwo`).
- 유지: `window.__tdFeedback` 중복 방지, 다크 판정(`pageIsDark`), 버튼 CSS, `mount` 타이밍.
- `packages/feedback/test/copy.test.js`는 남는 키(`btn`)가 4개 언어에 모두 있는지 확인하도록 맞춘다.
- 위젯 헤더의 `SOURCE OF TRUTH` 주석은 유지.

## 2. 가이드 페이지 — `try-dabble-main/src/pages/guides.tsx`

- 위치: 제목·갱신일 아래, 기존 "앱 열기" 버튼과 같은 줄에 "의견 보내기" 버튼을 나란히 둔다(secondary variant).
  service가 없는 가이드에도 버튼은 보인다.
- 문구 `GUIDE_COPY[lang]`에 추가: ko `의견 보내기`, en `Send feedback`, ja `意見を送る`, zh `发送反馈`.
- 클릭 시 shadcn `Dialog`(`src/components/ui/dialog.tsx`)로 폼을 띄운다. 새 컴포넌트 `src/components/feedback-dialog.tsx`.
- 폼 구성(지금 위젯 패널과 동일):
  - 종류 토글: 기능 건의(`idea`) / 버그 보고(`bug`), 기본 `idea`
  - 제목 `maxlength=120`, 내용 `maxlength=2000`
  - 이미지 첨부 최대 2장, 클라이언트에서 긴 변 1280px·JPEG 0.72로 압축해 data URL로 전송
  - 허니팟 `website` 필드
  - 보내기 / 닫기
  - 성공 시 "등록했어요." 표시 후 1.4초 뒤 닫힘, 실패 시 보내기 버튼 문구를 "다시 시도해 주세요."로
- 4개 언어 문구는 지금 위젯의 `COPY`를 그대로 옮긴다.
- 전송: `POST /api/feedback`(같은 origin, 상대 경로) JSON
  `{ slug: guide.slug, kind, title, body, lang, pageUrl: location.href, website, images }`.

## 3. 피드백 API — `try-dabble-main/src/worker/feedback.ts`

현재는 Origin이 `https://{slug}.try-dabble.com`이고 `slug`가 그 서브도메인과 같을 때만 받는다. 다음을 추가한다.

- `isAllowedOrigin`: `https://try-dabble.com`(서브도메인 없음)도 허용.
- 본문 `slug` 검증: Origin이 `https://try-dabble.com`이면 `originSlug`가 없으므로 본문 `slug`를 그대로 쓰되, 기존 조건(`findService(slug) || findGuide(slug) || slug === 'try-dabble'`)은 그대로 적용.
- `pageMatchesSlug`: Origin이 `https://try-dabble.com`일 때는 `pageUrl`의 host가 `try-dabble.com`이고 path가 `/{lang}/guides/{slug}`(lang은 `ko|en|ja|zh`)인지 검사. 서브도메인 Origin일 때의 기존 검사는 그대로.
- 저장 레코드는 변경 없음. `origin` 필드에 `https://try-dabble.com`이 들어가는 것만 달라진다.
- 테스트: 기존 워커 테스트 파일에 (a) `try-dabble.com` Origin + 올바른 가이드 pageUrl → 200, (b) `try-dabble.com` Origin + 다른 slug의 pageUrl → 400 `url`, (c) `try-dabble.com` Origin + 존재하지 않는 slug → 400 `app` 케이스 추가.

## 4. "가이드에 feedback 섹션 없음" 규칙 삭제

이 규칙은 예전에 가이드 페이지가 REST API로 제보 목록(`posts`)을 받아 표시하던 방식을 없애면서 생긴 것이다. 이제 제출 폼을 가이드에 두므로 규칙 자체를 지운다. 제보 목록 표시는 여전히 하지 않는다(그건 규칙이 아니라 그냥 기능이 없는 것).

- `try-dabble-main/src/content/guides/*.ts` 상단의 `// New guides must not include a feedback section or posts.` 주석 삭제(22개 파일).
- `try-dabble-main/src/content/guides/types.ts`: `posts?: GuidePost[]` 필드와 deprecated 주석, 아무 데서도 안 쓰는 `GuidePost`/`FeedbackKind` 타입 삭제. 삭제 전 `grep`으로 사용처 없음을 확인한다.
- `try-dabble-main/docs/feedback-widget.md`: 마지막 줄 "Guide pages have no feedback section or posts…" 삭제. 위젯 설명("앱에서 열리는 패널")을 새 동작(가이드로 이동, 폼은 가이드 페이지)으로 고친다.
- `try-dabble-main/CLAUDE.md`에 같은 규칙이 있으면 함께 삭제.

## 5. mixshelf 가이드·서비스 추가 — `try-dabble-main`

mixshelf는 서비스 등록도 가이드도 없다. 둘 다 추가한다.

- `src/content/services/mixshelf.ts`: 다른 서비스 파일과 같은 형식.
  - `url: https://mixshelf.try-dabble.com`, `appLangs: ['ko','en','ja','zh']`, `category`는 다른 기록형 도구(storelog 등)와 같은 값.
  - `ogImage`: `https://try-dabble.com/og/mixshelf-{ko|en|ja|zh}.png`.
  - `src/content/services/index.ts` 목록에 추가.
- OG 이미지: `apps/mixshelf/public/og-image.png`, `og-image-en.png`, `og-image-ja.png`, `og-image-zh.png`를 `try-dabble-main/public/og/mixshelf-{lang}.png`로 복사.
- `src/content/guides/mixshelf.ts`: 다른 가이드와 같은 구조(`title`/`description`/`keywords`/`sections`, 4개 언어).
  - 섹션: "이 앱이 하는 일", "쓰는 법", FAQ(`faq: true`).
  - 내용은 `apps/mixshelf/src/lib/i18n.ts`의 문구와 `README`/라우트 코드에서 실제 기능만 뽑아 쓴다(여러 유형의 항목을 한 선반에, 커스텀 태그, 필터, JSON 내보내기, 로그인 없음, 로컬 저장).
  - `src/content/guides/index.ts` 목록에 추가.
- 등록 후 `/ko/guides/mixshelf` 등 4개 언어 경로가 렌더되고 sitemap에 포함되는지 확인.

## 검증

1. `packages/feedback`: `npm run build && npm test` 통과.
2. `try-dabble-main`: 타입체크·워커 테스트·빌드 통과.
3. 로컬 e2e: 앱(예: sudoku) 열기 → "가이드 & 의견" 클릭 → 새 탭에 `/ko/guides/sudoku` → "의견 보내기" → 제출 → 워커 로그/KV(`--remote` 아님, 로컬)에서 레코드 확인.
4. `/ko/guides/mixshelf` 렌더 확인.

## 범위 밖

- 앱 footer `Guide` 링크 변경.
- 가이드 페이지에 제보 목록 표시.
- AdSense 배치 변경.
