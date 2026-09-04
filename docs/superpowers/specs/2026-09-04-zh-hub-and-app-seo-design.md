# 허브 중국어 지원 + 앱 SEO/AdSense 정비

목표는 두 가지다. Google AdSense 승인을 받는 것과, 서브도메인 앱 21개를 색인시키는 것.
그리고 그 과정에서 허브에 중국어를 추가해 앱이 이미 말하는 4번째 언어를 가이드가 따라잡는다.

## 진단

글이 있는 곳과 광고가 있는 곳이 어긋나 있다.

| | 허브 try-dabble.com | 앱 21개 서브도메인 |
|---|---|---|
| 본문 | 가이드 24개 × 3언어 | 384~573자 |
| 광고 | 있음 | 있음 (17개는 `<ins>` 단위까지) |
| sitemap | 있음 | 21개 중 2개 |
| 언어 | ko·en·ja | ko·en·ja·**zh** |

AdSense는 `try-dabble.com` 도메인 단위로 심사하고 서브도메인을 자동 포함한다.
따라서 심사 대상에 본문 400자짜리 광고 페이지 17개가 함께 들어간다.
정책 "가치 있는 인벤토리"는 *광고가 놓인 페이지*에 적용되므로 이게 직접적인 거절 위험이다.

그리고 그 광고 단위들은 `data-ad-slot`이 없어 애초에 게재되지 않는다.
17개 앱 홈 화면에 100px짜리 빈 점선 상자만 렌더되고 있다. 수익 0, 위험만 있는 상태.

## 채택하지 않은 것

**`?lang=` → `/ko/` 경로 마이그레이션.** Google은 쿼리 파라미터 로케일을 공식 지원하고,
앱들은 이미 자기참조 canonical + 4언어 hreflang 클러스터가 정상이다. 고칠 게 없다.
게다가 얇은 URL 21개를 84개로 늘려 thin content 문제를 키운다.

**앱을 `try-dabble.com/<slug>` 경로로 통합.** SEO만 보면 이기지만, 앱들이 local-first라
오리진 격리가 실질적 기능이다. 한 오리진이 되면 kinlog의 연락처, memomap의 사진,
orderpad의 배송 주소가 같은 localStorage/IndexedDB를 공유하게 되고, 앱 하나의 XSS가
21개 전부에 닿는다. PWA 스코프와 카메라 권한도 오리진 단위다. 격리를 유지한다.

## 설계

### 0단계 · 허브에 중국어 추가 (try-dabble-main)

`Lang`을 `'ko'|'en'|'ja'|'zh'`로 넓힌다. TypeScript가 zh 키가 빠진 곳을 전부 열거해 주므로
컴파일 에러 목록이 그대로 작업 목록이 된다.

`AppLang`은 존재 이유가 사라진다 — "허브에 중국어 페이지가 없어서" 만든 타입이었다.
`Lang`으로 흡수하고 `detectAppLang`의 `?lang=` 패스스루도 정리한다.

zh OG 이미지는 24개 중 2개(outcheck, slowroll)만 있다. 나머지 22개는 `-en.png`로 폴백하고
별도로 생성한다. 폴백은 임시이며 `resolveOgImage`가 그대로 처리한다.

### 1단계 · 앱에서 광고 제거 (try-dabble-apps)

원래 의도였고 `affc76e`, `e322533`으로 두 번 반영됐으나 `17b936d`이 이유 없는 bare revert로
되돌렸다. 다시 뗀다.

- `index.html` — `adsbygoogle.js` 로더 한 줄 삭제 (19개 앱)
- `src/components/ad-slot.tsx` — 파일 삭제 (17개 앱)
- `src/routes/home.tsx` — `AdSlot` import와 `<AdSlot />` 삭제

`ads.txt`는 21개 전부 유지한다. 워커가 `/ads.txt`·`/app-ads.txt`를 직접 응답하는 구조도 그대로.
도메인 소유 증명이므로 떼면 안 된다.

### 2단계 · 앱 → 허브 링크를 새 경로로

허브가 언어를 경로로 옮기면서 앱 푸터의 링크 42개가 전부 301을 타고 있다.

```
현재                                  변경 후
/privacy?lang=${lang}           →     /${lang}/privacy
/terms?lang=${lang}             →     /${lang}/terms
/guides/slowroll?lang=${lang}   →     /${lang}/guides/slowroll
(없음)                          →     /${lang}/guides/<slug>      가이드 백링크 신규
```

0단계로 허브가 zh를 갖게 되므로 4개 언어 전부 `/${lang}/` 형태로 통일된다.
가이드 백링크는 20개 앱에 새로 넣는다 — 지금은 slowroll만 갖고 있다.
이게 `가이드 → 앱 → 가이드` 순환을 닫아 21개 서브도메인을 한 사이트로 묶는다.

### 3단계 · 색인 경로

앱마다 `public/robots.txt`와 `public/sitemap.xml`을 둔다. sitemap은 index.html의
hreflang 블록과 정확히 같은 클러스터를 선언한다 — loc 5개(`/`, `?lang=` 4개)에
각각 `xhtml:link` alternates.

기존 2개도 고친다. `sudoku`는 zh가 빠졌고 `omok`은 언어 URL이 아예 없다.

허브에 `sitemap-index.xml`을 추가해 허브 sitemap + 앱 21개 sitemap을 한곳에 모은다.
Search Console은 **도메인 속성(DNS TXT)** 하나로 등록하면 서브도메인 21개가 전부 커버되고
제출할 파일은 인덱스 하나뿐이다.

### 4단계 · 승인 후 (이번 범위 아님)

앱 index.html에 가이드 요약본을 심어 400자를 1,500자+로 만들고, 그 앱부터 광고를
`data-ad-slot`까지 붙여 제대로 복원한다.

## 병렬 실행

두 저장소가 독립이고, 저장소 안에서도 파일/폴더 단위로 겹치지 않는다.

```
Track A  try-dabble-main     A0 타입·chrome (선행) → 가이드 24개 / 서비스 / 문서 / sitemap-index
Track B  try-dabble-apps     앱 21개, 각각 1+2+3단계          (Track A와 무관하게 즉시 시작)
```

Track B가 Track A를 기다리지 않는 이유는 링크 규칙을 먼저 확정했기 때문이다 —
zh는 `/zh/`로 간다. 허브 zh 페이지는 나중에 도착해도 링크는 미리 맞다.

## 열린 항목

- zh OG 이미지 22개 미생성. 영문 폴백으로 시작한다.
- 앱마다 `public/privacy.html`·`terms.html`이 있는데 푸터는 허브 privacy로 간다.
  중복이며 어느 쪽이 정본인지 미정. sitemap에는 넣지 않는다.
- 가이드 24개의 중국어는 자체 제품 문서 번역이다. Google의 scaled content abuse 정책은
  무검수 기계번역을 지목하므로, 발행 전 사람이 훑는 편이 안전하다.
