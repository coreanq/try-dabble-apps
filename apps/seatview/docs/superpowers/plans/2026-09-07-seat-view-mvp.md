# 좌석 시야 3D 미리보기 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공연장 JSON 하나로 "공연장 목록 → 2D 좌석도 → 좌석 클릭 → 3D 시야"가 동작하는 정적 웹앱과, 좌석배치도 이미지에서 그 JSON을 만드는 관리자 도구를 완성한다.

**Architecture:** three.js에 의존하지 않는 순수 함수 모듈(`src/core`)이 구역 파라미터에서 좌석 좌표·카메라를 계산하고, `src/three`가 그 결과를 메시로 만들며, `src/viewer`와 `src/admin`이 같은 모듈을 조합해 각각 사용자 화면과 디지타이징 도구를 구성한다. 서버 없음. 공연장 데이터는 `public/venues/<id>/venue.json` 정적 파일.

**Tech Stack:** Vite 7, TypeScript 5.9, three.js 0.185, zod 4 (스키마 검증), Vitest 4. UI 프레임워크 없음.

**Spec:** `docs/superpowers/specs/2026-09-07-seat-view-design.md`

---

## 좌표계 (모든 태스크 공통)

- 단위 미터. 원점 = 무대 중앙 바닥. **Y 위**, 무대가 바라보는 방향 **+Z** (관중석은 +Z 쪽).
- 2D 평면 좌표 `[x, z]`. 2D 좌석도 화면에서는 X가 오른쪽, Z가 아래쪽(무대가 위, 관중석이 아래).
- arc 각도는 도(degree). **0도 = +Z 방향**, 양수 = +X 쪽으로 회전. 위치 = center + r·(sin a, cos a).
- 좌석 id 문자열 = `${sectionId}|${row}|${seat}`.
- 그리드 구역(arc, polygon)의 r번째 열(0부터)은 앞변에서 `(r + 0.5) * rowDepth` 뒤, 높이 `baseHeight + r * riser`.

## 파일 구조

```
seatview/
├── package.json, tsconfig.json, vite.config.ts, .gitignore
├── index.html                      # 뷰어 진입
├── admin/index.html                # 관리자 도구 진입 (/admin/)
├── public/venues/index.json        # 공연장 목록 [{id, name}]
├── public/venues/sample-arena/venue.json
└── src/
    ├── core/                       # three.js 의존 없음, 전부 단위 테스트 대상
    │   ├── venue-schema.ts         # zod 스키마, Venue 타입, validateVenue()
    │   ├── seat-engine.ts          # generateSeats(), allSeats(), findSeat(), seatCount()
    │   ├── section-outline.ts      # sectionOutline() 구역 윤곽 다각형
    │   ├── seat-camera.ts          # cameraForSeat(), neighborSeat(), distanceToStage()
    │   ├── seat-search.ts          # parseSeatQuery("A구역 12열 7번")
    │   └── seatmap-math.ts         # 2D 좌표 변환, 줌, 히트테스트
    ├── three/
    │   ├── venue-mesh.ts           # buildVenueGroup(venue, seats) → THREE.Group
    │   ├── look-controls.ts        # 1인칭 둘러보기(드래그 yaw/pitch)
    │   ├── seat-view.ts            # SeatView: 렌더러, 카메라 이동 애니메이션, FOV
    │   └── shell-loader.ts         # loadShell(url) GLTFLoader 래퍼
    ├── ui/
    │   └── seatmap-2d.ts           # SeatMap2D: 캔버스 좌석도, 팬/줌/클릭
    ├── viewer/
    │   ├── main.ts                 # 해시 라우팅 부트스트랩
    │   ├── router.ts               # parseRoute(), buildVenueHash()
    │   ├── assets.ts               # assetUrl() BASE_URL 처리
    │   ├── dom.ts                  # esc() HTML 이스케이프
    │   ├── venue-list.ts           # 공연장 목록 페이지
    │   ├── venue-page.ts           # 좌석도 + 3D 시야 페이지
    │   └── style.css
    └── admin/
        ├── main.ts                 # 모드 전환, 패널 조립
        ├── admin-state.ts          # 상태, localStorage, px↔m 변환
        ├── image-canvas.ts         # 배경 이미지 + 오버레이 캔버스
        ├── section-form.ts         # 구역 입력 폼
        ├── preview.ts              # 3D 미리보기(SeatView 재사용)
        ├── export.ts               # JSON 직렬화/다운로드
        └── style.css
```

테스트 파일은 소스 옆에 `*.test.ts`로 둔다 (예: `src/core/seat-engine.test.ts`).

---

### Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `index.html`, `admin/index.html`, `src/viewer/main.ts`, `src/admin/main.ts`, `src/viewer/style.css`, `src/admin/style.css`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "seatview",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "three": "^0.185.1",
    "zod": "^4.5.4"
  },
  "devDependencies": {
    "@types/three": "^0.185.4",
    "typescript": "^5.9.3",
    "vite": "^7.3.6",
    "vitest": "^4.1.11"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 3: vite.config.ts 작성**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin/index.html',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: .gitignore, HTML 진입점, 빈 main.ts 작성**

`.gitignore`:
```
node_modules
dist
```

`index.html`:
```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SeatView</title>
    <link rel="stylesheet" href="/src/viewer/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/viewer/main.ts"></script>
  </body>
</html>
```

`admin/index.html`:
```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SeatView Admin</title>
    <link rel="stylesheet" href="/src/admin/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/admin/main.ts"></script>
  </body>
</html>
```

`src/viewer/main.ts`:
```ts
document.getElementById('app')!.textContent = 'SeatView viewer'
```

`src/admin/main.ts`:
```ts
document.getElementById('app')!.textContent = 'SeatView admin'
```

`src/viewer/style.css`, `src/admin/style.css`: 각각 한 줄
```css
body { margin: 0; font-family: system-ui, sans-serif; }
```

- [ ] **Step 5: 설치 및 검증**

Run: `npm install`
Expected: `added N packages` 출력, 오류 없음

Run: `npm run typecheck`
Expected: 출력 없이 종료 코드 0

Run: `npx vitest run --passWithNoTests`
Expected: `No test files found` 후 종료 코드 0

Run: `npm run build`
Expected: `dist/index.html`, `dist/admin/index.html` 생성. `✓ built in` 메시지

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: Vite + TypeScript + three.js 프로젝트 스캐폴드"
```

---

### Task 2: venue-schema (JSON 스키마·검증)

**Files:**
- Create: `src/core/venue-schema.ts`
- Test: `src/core/venue-schema.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/venue-schema.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateVenue } from './venue-schema'

const stage = { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] }

const arcSection = {
  id: 'A',
  shape: { type: 'arc', center: [0, 0], radiusStart: 25, angleStart: -30, angleEnd: 30 },
  rows: 3,
  rowDepth: 0.9,
  riser: 0.35,
  baseHeight: 0,
  seatsPerRow: 10,
}

function venue(overrides: Record<string, unknown> = {}) {
  return { id: 'test-venue', name: '테스트', units: 'm', stage, sections: [arcSection], ...overrides }
}

describe('validateVenue', () => {
  it('유효한 최소 공연장을 통과시키고 기본값을 채운다', () => {
    const r = validateVenue(venue())
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.venue.obstacles).toEqual([])
    const s = r.venue.sections[0]
    if (!('rows' in s)) throw new Error('grid section expected')
    expect(s.rowLabels).toBe('numeric')
    expect(s.seatNumbering).toBe('left-to-right')
  })

  it('stage가 없으면 실패한다', () => {
    const r = validateVenue(venue({ stage: undefined }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.some((e) => e.startsWith('stage'))).toBe(true)
  })

  it('seatsPerRow 배열 길이가 rows와 다르면 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, seatsPerRow: [10, 10] }] }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('seatsPerRow')
  })

  it('rowLabels 배열 길이가 rows와 다르면 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, rowLabels: ['A'] }] }))
    expect(r.ok).toBe(false)
  })

  it('arc의 angleEnd가 angleStart 이하이면 실패한다', () => {
    const bad = { ...arcSection, shape: { ...arcSection.shape, angleEnd: -30 } }
    const r = validateVenue(venue({ sections: [bad] }))
    expect(r.ok).toBe(false)
  })

  it('구역 id가 중복되면 실패한다', () => {
    const r = validateVenue(venue({ sections: [arcSection, { ...arcSection }] }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('중복')
  })

  it('polygon 구역은 점 3개 이상이어야 한다', () => {
    const poly = { ...arcSection, id: 'P', shape: { type: 'polygon', points: [[0, 10], [5, 10]] } }
    const r = validateVenue(venue({ sections: [poly] }))
    expect(r.ok).toBe(false)
  })

  it('explicit 구역은 seats 배열로 통과한다', () => {
    const ex = { id: 'BOX', shape: { type: 'explicit' }, seats: [{ row: '1', seat: 1, position: [1, 2, 3] }] }
    const r = validateVenue(venue({ sections: [ex] }))
    expect(r.ok).toBe(true)
  })

  it('지원하지 않는 shape type은 실패한다', () => {
    const r = validateVenue(venue({ sections: [{ ...arcSection, shape: { type: 'circle' } }] }))
    expect(r.ok).toBe(false)
  })

  it('obstacles를 검증한다', () => {
    const ok = validateVenue(venue({ obstacles: [{ type: 'pillar', position: [0, 0, 5], radius: 0.4, height: 10 }] }))
    expect(ok.ok).toBe(true)
    const bad = validateVenue(venue({ obstacles: [{ type: 'pillar', position: [0, 0, 5] }] }))
    expect(bad.ok).toBe(false)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/venue-schema.test.ts`
Expected: FAIL, `Failed to resolve import "./venue-schema"`

- [ ] **Step 3: 구현**

`src/core/venue-schema.ts`:
```ts
import { z } from 'zod'

const vec2 = z.tuple([z.number(), z.number()])
const vec3 = z.tuple([z.number(), z.number(), z.number()])

const gridFields = {
  id: z.string().min(1),
  label: z.string().optional(),
  rows: z.number().int().positive(),
  rowDepth: z.number().positive(),
  riser: z.number().min(0),
  baseHeight: z.number(),
  seatsPerRow: z.union([z.number().int().positive(), z.array(z.number().int().positive()).min(1)]),
  rowLabels: z.union([z.literal('numeric'), z.array(z.string().min(1))]).default('numeric'),
  seatNumbering: z.enum(['left-to-right', 'right-to-left']).default('left-to-right'),
}

export const arcShapeSchema = z.object({
  type: z.literal('arc'),
  center: vec2,
  radiusStart: z.number().positive(),
  angleStart: z.number(),
  angleEnd: z.number(),
})

export const polygonShapeSchema = z.object({
  type: z.literal('polygon'),
  points: z.array(vec2).min(3),
})

function checkGrid(
  section: { rows: number; seatsPerRow: number | number[]; rowLabels: 'numeric' | string[] },
  ctx: z.RefinementCtx,
) {
  if (Array.isArray(section.seatsPerRow) && section.seatsPerRow.length !== section.rows) {
    ctx.addIssue({
      code: 'custom',
      path: ['seatsPerRow'],
      message: `seatsPerRow 배열 길이(${section.seatsPerRow.length})가 rows(${section.rows})와 다릅니다`,
    })
  }
  if (Array.isArray(section.rowLabels) && section.rowLabels.length !== section.rows) {
    ctx.addIssue({
      code: 'custom',
      path: ['rowLabels'],
      message: `rowLabels 배열 길이(${section.rowLabels.length})가 rows(${section.rows})와 다릅니다`,
    })
  }
}

export const arcSectionSchema = z
  .object({ ...gridFields, shape: arcShapeSchema })
  .superRefine((s, ctx) => {
    checkGrid(s, ctx)
    if (s.shape.angleEnd <= s.shape.angleStart) {
      ctx.addIssue({ code: 'custom', path: ['shape', 'angleEnd'], message: 'angleEnd는 angleStart보다 커야 합니다' })
    }
  })

export const polygonSectionSchema = z
  .object({ ...gridFields, shape: polygonShapeSchema })
  .superRefine(checkGrid)

export const explicitSectionSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  shape: z.object({ type: z.literal('explicit') }),
  seats: z
    .array(z.object({ row: z.string().min(1), seat: z.number().int().positive(), position: vec3 }))
    .min(1),
})

export const sectionSchema = z.union([arcSectionSchema, polygonSectionSchema, explicitSectionSchema])

export const obstacleSchema = z.union([
  z.object({ type: z.literal('pillar'), position: vec3, radius: z.number().positive(), height: z.number().positive() }),
  z.object({ type: z.literal('railing'), from: vec3, to: vec3, height: z.number().positive() }),
])

export const stageSchema = z.object({ center: vec3, size: vec3, facing: vec3 })

export const venueSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, '소문자, 숫자, 하이픈만 허용'),
    name: z.string().min(1),
    units: z.literal('m'),
    stage: stageSchema,
    sections: z.array(sectionSchema).min(1),
    obstacles: z.array(obstacleSchema).default([]),
    shell: z.object({ glb: z.string().min(1) }).optional(),
  })
  .superRefine((v, ctx) => {
    const seen = new Set<string>()
    v.sections.forEach((s, i) => {
      if (seen.has(s.id)) {
        ctx.addIssue({ code: 'custom', path: ['sections', i, 'id'], message: `구역 id 중복: ${s.id}` })
      }
      seen.add(s.id)
    })
  })

export type Venue = z.infer<typeof venueSchema>
export type Stage = z.infer<typeof stageSchema>
export type Section = z.infer<typeof sectionSchema>
export type ArcSection = z.infer<typeof arcSectionSchema>
export type PolygonSection = z.infer<typeof polygonSectionSchema>
export type ExplicitSection = z.infer<typeof explicitSectionSchema>
export type GridSection = ArcSection | PolygonSection
export type ArcShape = z.infer<typeof arcShapeSchema>
export type PolygonShape = z.infer<typeof polygonShapeSchema>
export type Obstacle = z.infer<typeof obstacleSchema>

export type ValidationResult = { ok: true; venue: Venue } | { ok: false; errors: string[] }

type Issue = z.ZodError['issues'][number]

function joinPath(prefix: PropertyKey[], p: PropertyKey[]): PropertyKey[] {
  const alreadyPrefixed = prefix.length <= p.length && prefix.every((seg, k) => p[k] === seg)
  return alreadyPrefixed ? p : [...prefix, ...p]
}

/** zod 4는 union 실패를 invalid_union 하나로 묶고 세부 오류를 errors에 넣는다. 사람이 읽을 수 있게 펼친다. */
function flattenIssues(issues: Issue[], prefix: PropertyKey[] = []): string[] {
  return issues.flatMap((i) => {
    const path = joinPath(prefix, i.path)
    const label = path.length ? path.map(String).join('.') : '(root)'
    if (i.code === 'invalid_union' && 'errors' in i) {
      const nested = (i.errors as Issue[][]).flatMap((e) => flattenIssues(e, path))
      if (nested.length) return nested
    }
    return [`${label}: ${i.message}`]
  })
}

export function validateVenue(input: unknown): ValidationResult {
  const r = venueSchema.safeParse(input)
  if (r.success) return { ok: true, venue: r.data }
  return { ok: false, errors: flattenIssues(r.error.issues) }
}

export function isGridSection(s: Section): s is GridSection {
  return 'rows' in s
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/venue-schema.test.ts`
Expected: 10 passed

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/core/venue-schema.ts src/core/venue-schema.test.ts
git commit -m "feat(core): venue JSON zod 스키마와 validateVenue"
```

---
### Task 3: seat-engine — arc 구역 좌석 생성

**Files:**
- Create: `src/core/seat-engine.ts`
- Test: `src/core/seat-engine.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/seat-engine.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { generateSeats } from './seat-engine'
import type { ArcSection, Stage } from './venue-schema'

const stage: Stage = { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] }

const arc: ArcSection = {
  id: 'A',
  shape: { type: 'arc', center: [0, 0], radiusStart: 10, angleStart: -90, angleEnd: 90 },
  rows: 2,
  rowDepth: 1,
  riser: 0.5,
  baseHeight: 2,
  seatsPerRow: 4,
  rowLabels: 'numeric',
  seatNumbering: 'left-to-right',
}

describe('generateSeats: arc', () => {
  it('rows × seatsPerRow 개의 좌석을 만든다', () => {
    expect(generateSeats(arc, stage)).toHaveLength(8)
  })

  it('첫 열 첫 좌석은 각도 등분 위치(반열 오프셋)에 놓인다', () => {
    const s = generateSeats(arc, stage)[0]
    // 4석이면 각도 간격 45도, 첫 좌석 = -90 + 22.5 = -67.5도. 반경 = 10 + 0.5
    const a = (-67.5 * Math.PI) / 180
    expect(s.position[0]).toBeCloseTo(10.5 * Math.sin(a), 5)
    expect(s.position[2]).toBeCloseTo(10.5 * Math.cos(a), 5)
    expect(s.position[1]).toBeCloseTo(2, 5)
  })

  it('둘째 열은 반경이 rowDepth만큼 커지고 높이가 riser만큼 오른다', () => {
    const seats = generateSeats(arc, stage)
    const second = seats.find((s) => s.rowIndex === 1 && s.seatIndex === 0)!
    const r = Math.hypot(second.position[0], second.position[2])
    expect(r).toBeCloseTo(11.5, 5)
    expect(second.position[1]).toBeCloseTo(2.5, 5)
  })

  it('id, row, seat 번호를 채운다', () => {
    const seats = generateSeats(arc, stage)
    expect(seats[0]).toMatchObject({ id: 'A|1|1', sectionId: 'A', row: '1', seat: 1, rowIndex: 0, seatIndex: 0 })
    expect(seats[7]).toMatchObject({ id: 'A|2|4', row: '2', seat: 4, rowIndex: 1, seatIndex: 3 })
  })

  it('right-to-left면 첫 좌석 번호가 가장 크다', () => {
    const seats = generateSeats({ ...arc, seatNumbering: 'right-to-left' }, stage)
    expect(seats[0].seat).toBe(4)
    expect(seats[3].seat).toBe(1)
  })

  it('rowLabels 배열을 쓴다', () => {
    const seats = generateSeats({ ...arc, rowLabels: ['A', 'B'] }, stage)
    expect(seats[0].row).toBe('A')
    expect(seats[4].row).toBe('B')
    expect(seats[4].id).toBe('A|B|1')
  })

  it('seatsPerRow 배열이면 열마다 좌석 수가 다르다', () => {
    const seats = generateSeats({ ...arc, seatsPerRow: [3, 5] }, stage)
    expect(seats).toHaveLength(8)
    expect(seats.filter((s) => s.rowIndex === 1)).toHaveLength(5)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/seat-engine.test.ts`
Expected: FAIL, `Failed to resolve import "./seat-engine"`

- [ ] **Step 3: 구현**

`src/core/seat-engine.ts`:
```ts
import type { ArcShape, GridSection, Section, Stage } from './venue-schema'

export type Vec3 = [number, number, number]

export interface Seat {
  id: string
  sectionId: string
  row: string
  seat: number
  rowIndex: number
  seatIndex: number
  position: Vec3
}

/** (rowIndex, seatIndex, seatsInThisRow) → 좌석 바닥 위치 */
type Placer = (rowIndex: number, seatIndex: number, seatCount: number) => Vec3

export function seatId(sectionId: string, row: string, seat: number): string {
  return `${sectionId}|${row}|${seat}`
}

function rowLabel(section: GridSection, r: number): string {
  return section.rowLabels === 'numeric' ? String(r + 1) : section.rowLabels[r]
}

function seatsInRow(section: GridSection, r: number): number {
  return typeof section.seatsPerRow === 'number' ? section.seatsPerRow : section.seatsPerRow[r]
}

function seatNumber(section: GridSection, s: number, n: number): number {
  return section.seatNumbering === 'left-to-right' ? s + 1 : n - s
}

function arcPlacer(section: GridSection, shape: ArcShape): Placer {
  const [cx, cz] = shape.center
  const span = shape.angleEnd - shape.angleStart
  return (r, s, n) => {
    const radius = shape.radiusStart + (r + 0.5) * section.rowDepth
    const angleDeg = shape.angleStart + ((s + 0.5) / n) * span
    const a = (angleDeg * Math.PI) / 180
    return [cx + radius * Math.sin(a), section.baseHeight + r * section.riser, cz + radius * Math.cos(a)]
  }
}

function gridSeats(section: GridSection, place: Placer): Seat[] {
  const out: Seat[] = []
  for (let r = 0; r < section.rows; r++) {
    const n = seatsInRow(section, r)
    const row = rowLabel(section, r)
    for (let s = 0; s < n; s++) {
      const seat = seatNumber(section, s, n)
      out.push({
        id: seatId(section.id, row, seat),
        sectionId: section.id,
        row,
        seat,
        rowIndex: r,
        seatIndex: s,
        position: place(r, s, n),
      })
    }
  }
  return out
}

export function generateSeats(section: Section, stage: Stage): Seat[] {
  void stage
  if ('seats' in section) throw new Error('explicit 구역은 Task 5에서 구현')
  const shape = section.shape
  if (shape.type === 'arc') return gridSeats(section, arcPlacer(section, shape))
  throw new Error('polygon 구역은 Task 4에서 구현')
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/seat-engine.test.ts`
Expected: 7 passed

- [ ] **Step 5: 커밋**

```bash
git add src/core/seat-engine.ts src/core/seat-engine.test.ts
git commit -m "feat(core): arc 구역 좌석 생성"
```

---

### Task 4: seat-engine — polygon 구역

**Files:**
- Modify: `src/core/seat-engine.ts`
- Test: `src/core/seat-engine.test.ts`

- [ ] **Step 1: 테스트 추가**

`src/core/seat-engine.test.ts` 하단에 추가:
```ts
import type { PolygonSection } from './venue-schema'

const poly: PolygonSection = {
  id: 'P',
  shape: { type: 'polygon', points: [[-2, 10], [2, 10], [2, 14], [-2, 14]] },
  rows: 2,
  rowDepth: 1,
  riser: 0.4,
  baseHeight: 3,
  seatsPerRow: 2,
  rowLabels: 'numeric',
  seatNumbering: 'left-to-right',
}

describe('generateSeats: polygon', () => {
  it('앞변(p0→p1)을 등분하고 무대 반대 방향으로 열을 민다', () => {
    const seats = generateSeats(poly, stage)
    expect(seats).toHaveLength(4)
    // 앞변 길이 4, 2석 → x = -2 + 1, -2 + 3. 첫 열 z = 10 + 0.5
    expect(seats[0].position).toEqual([-1, 3, 10.5])
    expect(seats[1].position).toEqual([1, 3, 10.5])
    // 둘째 열 z = 10 + 1.5, y = 3 + 0.4
    expect(seats[2].position[2]).toBeCloseTo(11.5, 5)
    expect(seats[2].position[1]).toBeCloseTo(3.4, 5)
  })

  it('앞변 방향이 반대로 주어져도 열은 항상 무대에서 멀어지는 쪽으로 민다', () => {
    const reversed: PolygonSection = {
      ...poly,
      shape: { type: 'polygon', points: [[2, 10], [-2, 10], [-2, 14], [2, 14]] },
    }
    const seats = generateSeats(reversed, stage)
    expect(seats[0].position[2]).toBeCloseTo(10.5, 5)
    expect(seats[2].position[2]).toBeCloseTo(11.5, 5)
    // p0가 오른쪽(x=2)이므로 첫 좌석 x는 +1
    expect(seats[0].position[0]).toBeCloseTo(1, 5)
  })

  it('무대 옆에 있는 구역(앞변이 Z축과 평행)도 무대 반대쪽으로 민다', () => {
    const side: PolygonSection = {
      ...poly,
      shape: { type: 'polygon', points: [[-20, -2], [-20, 2], [-24, 2], [-24, -2]] },
    }
    const seats = generateSeats(side, stage)
    // 앞변 x=-20, 무대는 x=0 → 열은 -x 방향
    expect(seats[0].position[0]).toBeCloseTo(-20.5, 5)
    expect(seats[2].position[0]).toBeCloseTo(-21.5, 5)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/seat-engine.test.ts`
Expected: 3 failed (`polygon 구역은 Task 4에서 구현`), 7 passed

- [ ] **Step 3: 구현**

`src/core/seat-engine.ts`에 `polygonPlacer` 추가하고 `generateSeats` 수정:
```ts
import type { ArcShape, GridSection, PolygonShape, Section, Stage } from './venue-schema'

function polygonPlacer(section: GridSection, shape: PolygonShape, stage: Stage): Placer {
  const p0 = shape.points[0]
  const p1 = shape.points[1]
  const ex = p1[0] - p0[0]
  const ez = p1[1] - p0[1]
  const len = Math.hypot(ex, ez)
  const ux = ex / len
  const uz = ez / len
  // 앞변에 수직인 방향. 무대 중앙에서 멀어지는 쪽을 고른다.
  let nx = -uz
  let nz = ux
  const mx = (p0[0] + p1[0]) / 2 - stage.center[0]
  const mz = (p0[1] + p1[1]) / 2 - stage.center[2]
  if (nx * mx + nz * mz < 0) {
    nx = -nx
    nz = -nz
  }
  return (r, s, n) => {
    const along = ((s + 0.5) / n) * len
    const back = (r + 0.5) * section.rowDepth
    return [
      p0[0] + ux * along + nx * back,
      section.baseHeight + r * section.riser,
      p0[1] + uz * along + nz * back,
    ]
  }
}

export function generateSeats(section: Section, stage: Stage): Seat[] {
  if ('seats' in section) throw new Error('explicit 구역은 Task 5에서 구현')
  const shape = section.shape
  if (shape.type === 'arc') return gridSeats(section, arcPlacer(section, shape))
  return gridSeats(section, polygonPlacer(section, shape, stage))
}
```
(`void stage` 줄은 삭제한다.)

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/seat-engine.test.ts`
Expected: 10 passed

- [ ] **Step 5: 커밋**

```bash
git add src/core/seat-engine.ts src/core/seat-engine.test.ts
git commit -m "feat(core): polygon 구역 좌석 생성"
```

---

### Task 5: seat-engine — explicit 구역과 공연장 단위 함수

**Files:**
- Modify: `src/core/seat-engine.ts`
- Test: `src/core/seat-engine.test.ts`

- [ ] **Step 1: 테스트 추가**

`src/core/seat-engine.test.ts` 하단에 추가:
```ts
import { allSeats, findSeat, seatCount } from './seat-engine'
import type { ExplicitSection, Venue } from './venue-schema'

const box: ExplicitSection = {
  id: 'BOX',
  shape: { type: 'explicit' },
  seats: [
    { row: '1', seat: 1, position: [-22, 6.5, 33] },
    { row: '1', seat: 2, position: [-21.2, 6.5, 33] },
    { row: '2', seat: 1, position: [-22, 7, 34] },
  ],
}

describe('generateSeats: explicit', () => {
  it('좌표를 그대로 쓰고 rowIndex/seatIndex를 등장 순서로 매긴다', () => {
    const seats = generateSeats(box, stage)
    expect(seats).toHaveLength(3)
    expect(seats[0]).toMatchObject({ id: 'BOX|1|1', position: [-22, 6.5, 33], rowIndex: 0, seatIndex: 0 })
    expect(seats[1]).toMatchObject({ rowIndex: 0, seatIndex: 1 })
    expect(seats[2]).toMatchObject({ id: 'BOX|2|1', rowIndex: 1, seatIndex: 0 })
  })
})

const venue: Venue = {
  id: 'v',
  name: 'V',
  units: 'm',
  stage,
  sections: [arc, poly, box],
  obstacles: [],
}

describe('venue-level helpers', () => {
  it('allSeats는 모든 구역 좌석을 합친다', () => {
    expect(allSeats(venue)).toHaveLength(8 + 4 + 3)
    expect(seatCount(venue)).toBe(15)
  })

  it('findSeat는 구역/열/번호로 찾고 없으면 undefined', () => {
    const seats = allSeats(venue)
    expect(findSeat(seats, 'P', '2', 1)?.id).toBe('P|2|1')
    expect(findSeat(seats, 'P', '9', 1)).toBeUndefined()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/seat-engine.test.ts`
Expected: FAIL (`allSeats` import 없음 또는 explicit 오류)

- [ ] **Step 3: 구현**

`src/core/seat-engine.ts`에 추가/수정:
```ts
import type { ArcShape, ExplicitSection, GridSection, PolygonShape, Section, Stage, Venue } from './venue-schema'

function explicitSeats(section: ExplicitSection): Seat[] {
  const rowOrder: string[] = []
  const seatIndexByRow = new Map<string, number>()
  return section.seats.map((s) => {
    if (!seatIndexByRow.has(s.row)) {
      rowOrder.push(s.row)
      seatIndexByRow.set(s.row, 0)
    }
    const seatIndex = seatIndexByRow.get(s.row)!
    seatIndexByRow.set(s.row, seatIndex + 1)
    return {
      id: seatId(section.id, s.row, s.seat),
      sectionId: section.id,
      row: s.row,
      seat: s.seat,
      rowIndex: rowOrder.indexOf(s.row),
      seatIndex,
      position: [...s.position] as Vec3,
    }
  })
}

export function generateSeats(section: Section, stage: Stage): Seat[] {
  if ('seats' in section) return explicitSeats(section)
  const shape = section.shape
  if (shape.type === 'arc') return gridSeats(section, arcPlacer(section, shape))
  return gridSeats(section, polygonPlacer(section, shape, stage))
}

export function allSeats(venue: Venue): Seat[] {
  return venue.sections.flatMap((s) => generateSeats(s, venue.stage))
}

export function seatCount(venue: Venue): number {
  return allSeats(venue).length
}

export function findSeat(seats: Seat[], sectionId: string, row: string, seat: number): Seat | undefined {
  return seats.find((s) => s.sectionId === sectionId && s.row === row && s.seat === seat)
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/seat-engine.test.ts`
Expected: 13 passed

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/core/seat-engine.ts src/core/seat-engine.test.ts
git commit -m "feat(core): explicit 구역, allSeats/findSeat/seatCount"
```

---

### Task 6: section-outline — 구역 윤곽

2D 좌석도와 관리자 도구가 구역을 그리고 클릭 판정에 쓰는 다각형.

**Files:**
- Create: `src/core/section-outline.ts`
- Test: `src/core/section-outline.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/section-outline.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { sectionOutline, sectionCentroid } from './section-outline'
import type { ArcSection, ExplicitSection, PolygonSection, Stage } from './venue-schema'

const stage: Stage = { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] }

describe('sectionOutline', () => {
  it('polygon은 점을 그대로 돌려준다', () => {
    const s: PolygonSection = {
      id: 'P', shape: { type: 'polygon', points: [[0, 10], [4, 10], [4, 14]] },
      rows: 1, rowDepth: 1, riser: 0, baseHeight: 0, seatsPerRow: 1, rowLabels: 'numeric', seatNumbering: 'left-to-right',
    }
    expect(sectionOutline(s, stage)).toEqual([[0, 10], [4, 10], [4, 14]])
  })

  it('arc는 안쪽 호와 바깥쪽 호(반대 방향)를 잇는 닫힌 띠를 만든다', () => {
    const s: ArcSection = {
      id: 'A', shape: { type: 'arc', center: [0, 0], radiusStart: 10, angleStart: 0, angleEnd: 90 },
      rows: 5, rowDepth: 1, riser: 0, baseHeight: 0, seatsPerRow: 1, rowLabels: 'numeric', seatNumbering: 'left-to-right',
    }
    const pts = sectionOutline(s, stage)
    expect(pts.length).toBeGreaterThanOrEqual(8)
    // 첫 점: 안쪽 반경 10, 각도 0 → (0, 10)
    expect(pts[0][0]).toBeCloseTo(0, 5)
    expect(pts[0][1]).toBeCloseTo(10, 5)
    // 마지막 점: 바깥쪽 반경 15, 각도 0 → (0, 15)
    const last = pts[pts.length - 1]
    expect(last[0]).toBeCloseTo(0, 5)
    expect(last[1]).toBeCloseTo(15, 5)
  })

  it('explicit은 좌석 좌표 경계 상자를 0.5m 여유로 돌려준다', () => {
    const s: ExplicitSection = {
      id: 'B', shape: { type: 'explicit' },
      seats: [{ row: '1', seat: 1, position: [1, 0, 2] }, { row: '1', seat: 2, position: [3, 0, 4] }],
    }
    expect(sectionOutline(s, stage)).toEqual([[0.5, 1.5], [3.5, 1.5], [3.5, 4.5], [0.5, 4.5]])
  })
})

describe('sectionCentroid', () => {
  it('윤곽 점의 평균을 돌려준다', () => {
    expect(sectionCentroid([[0, 0], [4, 0], [4, 4], [0, 4]])).toEqual([2, 2])
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/section-outline.test.ts`
Expected: FAIL, import 오류

- [ ] **Step 3: 구현**

`src/core/section-outline.ts`:
```ts
import type { Section, Stage } from './venue-schema'
import { generateSeats } from './seat-engine'

export type Vec2 = [number, number]

const ARC_SAMPLES = 16

function arcPoint(cx: number, cz: number, r: number, deg: number): Vec2 {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.sin(a), cz + r * Math.cos(a)]
}

export function sectionOutline(section: Section, stage: Stage): Vec2[] {
  if ('seats' in section) {
    const seats = generateSeats(section, stage)
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const s of seats) {
      minX = Math.min(minX, s.position[0]); maxX = Math.max(maxX, s.position[0])
      minZ = Math.min(minZ, s.position[2]); maxZ = Math.max(maxZ, s.position[2])
    }
    const m = 0.5
    return [[minX - m, minZ - m], [maxX + m, minZ - m], [maxX + m, maxZ + m], [minX - m, maxZ + m]]
  }
  const shape = section.shape
  if (shape.type === 'polygon') return shape.points.map((p) => [p[0], p[1]] as Vec2)

  const [cx, cz] = shape.center
  const r0 = shape.radiusStart
  const r1 = shape.radiusStart + section.rows * section.rowDepth
  const inner: Vec2[] = []
  const outer: Vec2[] = []
  for (let i = 0; i <= ARC_SAMPLES; i++) {
    const deg = shape.angleStart + ((shape.angleEnd - shape.angleStart) * i) / ARC_SAMPLES
    inner.push(arcPoint(cx, cz, r0, deg))
    outer.push(arcPoint(cx, cz, r1, deg))
  }
  return [...inner, ...outer.reverse()]
}

export function sectionCentroid(outline: Vec2[]): Vec2 {
  let x = 0, z = 0
  for (const p of outline) { x += p[0]; z += p[1] }
  return [x / outline.length, z / outline.length]
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/section-outline.test.ts`
Expected: 4 passed

- [ ] **Step 5: 커밋**

```bash
git add src/core/section-outline.ts src/core/section-outline.test.ts
git commit -m "feat(core): 구역 윤곽 다각형 sectionOutline"
```

---

### Task 7: seat-camera — 카메라 포즈, 거리, 인접 좌석

**Files:**
- Create: `src/core/seat-camera.ts`
- Test: `src/core/seat-camera.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/seat-camera.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { cameraForSeat, distanceToStage, neighborSeat, EYE_HEIGHT } from './seat-camera'
import { generateSeats } from './seat-engine'
import type { PolygonSection, Stage } from './venue-schema'

const stage: Stage = { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] }

const poly: PolygonSection = {
  id: 'P',
  shape: { type: 'polygon', points: [[-3, 10], [3, 10], [3, 20], [-3, 20]] },
  rows: 3, rowDepth: 1, riser: 0.4, baseHeight: 0,
  seatsPerRow: [3, 3, 2], rowLabels: 'numeric', seatNumbering: 'left-to-right',
}
const seats = generateSeats(poly, stage)
const at = (r: number, s: number) => seats.find((x) => x.rowIndex === r && x.seatIndex === s)!

describe('cameraForSeat', () => {
  it('좌석 위치에서 눈높이만큼 올리고 무대 바닥면 중앙을 본다', () => {
    const pose = cameraForSeat(at(0, 0), stage)
    expect(pose.position).toEqual([at(0, 0).position[0], EYE_HEIGHT, at(0, 0).position[2]])
    expect(pose.target).toEqual([0, 1.2, 0])
  })
})

describe('distanceToStage', () => {
  it('무대 중앙까지 수평 거리', () => {
    expect(distanceToStage(at(0, 1), stage)).toBeCloseTo(10.5, 5)
  })
})

describe('neighborSeat', () => {
  it('front는 무대 쪽(rowIndex-1), back은 반대', () => {
    expect(neighborSeat(seats, at(1, 1), 'front')?.id).toBe(at(0, 1).id)
    expect(neighborSeat(seats, at(1, 1), 'back')?.id).toBe(at(2, 1).id)
  })
  it('left/right는 seatIndex ±1', () => {
    expect(neighborSeat(seats, at(1, 1), 'left')?.id).toBe(at(1, 0).id)
    expect(neighborSeat(seats, at(1, 1), 'right')?.id).toBe(at(1, 2).id)
  })
  it('경계를 넘으면 undefined', () => {
    expect(neighborSeat(seats, at(0, 0), 'front')).toBeUndefined()
    expect(neighborSeat(seats, at(1, 2), 'back')).toBeUndefined() // 3열은 2석뿐
    expect(neighborSeat(seats, at(1, 0), 'left')).toBeUndefined()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/seat-camera.test.ts`
Expected: FAIL, import 오류

- [ ] **Step 3: 구현**

`src/core/seat-camera.ts`:
```ts
import type { Seat, Vec3 } from './seat-engine'
import type { Stage } from './venue-schema'

export const EYE_HEIGHT = 1.2

export interface CameraPose {
  position: Vec3
  target: Vec3
}

export function stageFocus(stage: Stage): Vec3 {
  return [stage.center[0], stage.center[1] + stage.size[1], stage.center[2]]
}

export function cameraForSeat(seat: Seat, stage: Stage): CameraPose {
  const [x, y, z] = seat.position
  return { position: [x, y + EYE_HEIGHT, z], target: stageFocus(stage) }
}

export function distanceToStage(seat: Seat, stage: Stage): number {
  return Math.hypot(seat.position[0] - stage.center[0], seat.position[2] - stage.center[2])
}

export type Direction = 'front' | 'back' | 'left' | 'right'

export function neighborSeat(seats: Seat[], seat: Seat, dir: Direction): Seat | undefined {
  const dr = dir === 'front' ? -1 : dir === 'back' ? 1 : 0
  const ds = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
  return seats.find(
    (s) => s.sectionId === seat.sectionId && s.rowIndex === seat.rowIndex + dr && s.seatIndex === seat.seatIndex + ds,
  )
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/seat-camera.test.ts`
Expected: 5 passed

- [ ] **Step 5: 커밋**

```bash
git add src/core/seat-camera.ts src/core/seat-camera.test.ts
git commit -m "feat(core): 좌석 카메라 포즈, 무대 거리, 인접 좌석"
```

---

### Task 8: seat-search — 좌석 텍스트 파싱

**Files:**
- Create: `src/core/seat-search.ts`
- Test: `src/core/seat-search.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/seat-search.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseSeatQuery } from './seat-search'

describe('parseSeatQuery', () => {
  it.each([
    ['A구역 12열 7번', { sectionId: 'A', row: '12', seat: 7 }],
    ['A 12 7', { sectionId: 'A', row: '12', seat: 7 }],
    ['A-12-7', { sectionId: 'A', row: '12', seat: 7 }],
    ['2F-201 12 7', { sectionId: '2F-201', row: '12', seat: 7 }],
    ['  BOX-1 구역  B 열  3 번 ', { sectionId: 'BOX-1', row: 'B', seat: 3 }],
  ])('%s', (input, expected) => {
    expect(parseSeatQuery(input)).toEqual(expected)
  })

  it('형식이 아니면 null', () => {
    expect(parseSeatQuery('')).toBeNull()
    expect(parseSeatQuery('A구역')).toBeNull()
    expect(parseSeatQuery('A 12 x')).toBeNull()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/seat-search.test.ts`
Expected: FAIL, import 오류

- [ ] **Step 3: 구현**

`src/core/seat-search.ts`:
```ts
export interface SeatQuery {
  sectionId: string
  row: string
  seat: number
}

// "구역/열/번" 접미어를 떼고 공백·쉼표·슬래시·하이픈으로 토큰화한다.
// 마지막 토큰 = 좌석 번호, 그 앞 = 열, 나머지를 '-'로 이어 구역 id로 본다 ("2F-201 12 7" → 2F-201).
const SUFFIX = /(구역|열|번)(?=[\s,/\-]|$)/g
const SEP = /[\s,/\-]+/

export function parseSeatQuery(text: string): SeatQuery | null {
  const parts = text.replace(SUFFIX, ' ').trim().split(SEP).filter(Boolean)
  if (parts.length < 3) return null
  const seatText = parts[parts.length - 1]
  if (!/^\d+$/.test(seatText)) return null
  const row = parts[parts.length - 2]
  const sectionId = parts.slice(0, -2).join('-')
  return { sectionId, row, seat: Number(seatText) }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/seat-search.test.ts`
Expected: 6 passed

- [ ] **Step 5: 커밋**

```bash
git add src/core/seat-search.ts src/core/seat-search.test.ts
git commit -m "feat(core): 좌석 텍스트 검색 파서"
```

---
### Task 9: 샘플 공연장 데이터

파라미터만으로 만든 가상의 아레나. 이후 모든 화면 작업의 검증 데이터.

**Files:**
- Create: `public/venues/index.json`, `public/venues/sample-arena/venue.json`
- Test: `src/core/sample-venue.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/sample-venue.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { validateVenue } from './venue-schema'
import { seatCount } from './seat-engine'

function loadJson(rel: string): unknown {
  return JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'))
}

describe('sample-arena', () => {
  it('index.json에 등록되어 있다', () => {
    const index = loadJson('../../public/venues/index.json') as { id: string; name: string }[]
    expect(index.some((v) => v.id === 'sample-arena')).toBe(true)
  })

  it('스키마를 통과하고 좌석 수가 2888석이다', () => {
    const r = validateVenue(loadJson('../../public/venues/sample-arena/venue.json'))
    expect(r.ok, r.ok ? '' : r.errors.join('\n')).toBe(true)
    if (!r.ok) return
    expect(seatCount(r.venue)).toBe(2888)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/sample-venue.test.ts`
Expected: FAIL, `ENOENT ... index.json`

- [ ] **Step 3: 데이터 작성**

`public/venues/index.json`:
```json
[
  { "id": "sample-arena", "name": "샘플 아레나" }
]
```

`public/venues/sample-arena/venue.json`:
```json
{
  "id": "sample-arena",
  "name": "샘플 아레나",
  "units": "m",
  "stage": { "center": [0, 0, 0], "size": [20, 1.2, 12], "facing": [0, 0, 1] },
  "sections": [
    {
      "id": "F1", "label": "플로어 F1",
      "shape": { "type": "polygon", "points": [[-12, 8], [12, 8], [12, 20], [-12, 20]] },
      "rows": 12, "rowDepth": 1.0, "riser": 0, "baseHeight": 0, "seatsPerRow": 24
    },
    {
      "id": "F2", "label": "플로어 F2",
      "shape": { "type": "polygon", "points": [[-12, 21], [12, 21], [12, 33], [-12, 33]] },
      "rows": 12, "rowDepth": 1.0, "riser": 0, "baseHeight": 0, "seatsPerRow": 24
    },
    {
      "id": "101", "label": "1층 101",
      "shape": { "type": "arc", "center": [0, 0], "radiusStart": 36, "angleStart": -50, "angleEnd": -17 },
      "rows": 18, "rowDepth": 0.9, "riser": 0.4, "baseHeight": 1.5, "seatsPerRow": 22
    },
    {
      "id": "102", "label": "1층 102",
      "shape": { "type": "arc", "center": [0, 0], "radiusStart": 36, "angleStart": -16, "angleEnd": 16 },
      "rows": 18, "rowDepth": 0.9, "riser": 0.4, "baseHeight": 1.5, "seatsPerRow": 22
    },
    {
      "id": "103", "label": "1층 103",
      "shape": { "type": "arc", "center": [0, 0], "radiusStart": 36, "angleStart": 17, "angleEnd": 50 },
      "rows": 18, "rowDepth": 0.9, "riser": 0.4, "baseHeight": 1.5, "seatsPerRow": 22
    },
    {
      "id": "201", "label": "2층 201",
      "shape": { "type": "arc", "center": [0, 0], "radiusStart": 54, "angleStart": -60, "angleEnd": -31 },
      "rows": 14, "rowDepth": 0.85, "riser": 0.5, "baseHeight": 10, "seatsPerRow": 20
    },
    {
      "id": "202", "label": "2층 202",
      "shape": { "type": "arc", "center": [0, 0], "radiusStart": 54, "angleStart": -30, "angleEnd": -1 },
      "rows": 14, "rowDepth": 0.85, "riser": 0.5, "baseHeight": 10, "seatsPerRow": 20
    },
    {
      "id": "203", "label": "2층 203",
      "shape": { "type": "arc", "center": [0, 0], "radiusStart": 54, "angleStart": 1, "angleEnd": 30 },
      "rows": 14, "rowDepth": 0.85, "riser": 0.5, "baseHeight": 10, "seatsPerRow": 20
    },
    {
      "id": "204", "label": "2층 204",
      "shape": { "type": "arc", "center": [0, 0], "radiusStart": 54, "angleStart": 31, "angleEnd": 60 },
      "rows": 14, "rowDepth": 0.85, "riser": 0.5, "baseHeight": 10, "seatsPerRow": 20
    },
    {
      "id": "BOX-1", "label": "박스 1",
      "shape": { "type": "explicit" },
      "seats": [
        { "row": "1", "seat": 1, "position": [-22, 1.0, 24] },
        { "row": "1", "seat": 2, "position": [-21.2, 1.0, 24] },
        { "row": "1", "seat": 3, "position": [-20.4, 1.0, 24] },
        { "row": "1", "seat": 4, "position": [-19.6, 1.0, 24] }
      ]
    }
  ],
  "obstacles": [
    { "type": "pillar", "position": [-23.1, 0, 26.6], "radius": 0.5, "height": 14 },
    { "type": "railing", "from": [-26.75, 10, 46.33], "to": [-13.85, 10, 51.68], "height": 1.0 },
    { "type": "railing", "from": [-13.85, 10, 51.68], "to": [0, 10, 53.5], "height": 1.0 },
    { "type": "railing", "from": [0, 10, 53.5], "to": [13.85, 10, 51.68], "height": 1.0 },
    { "type": "railing", "from": [13.85, 10, 51.68], "to": [26.75, 10, 46.33], "height": 1.0 }
  ]
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/sample-venue.test.ts`
Expected: 2 passed

- [ ] **Step 5: 커밋**

```bash
git add public/venues src/core/sample-venue.test.ts
git commit -m "feat(data): 샘플 아레나 공연장 데이터"
```

---

### Task 10: venue-mesh — 좌석·무대·방해물 three.js 메시

**Files:**
- Create: `src/three/venue-mesh.ts`
- Test: `src/three/venue-mesh.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/three/venue-mesh.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { buildVenueGroup } from './venue-mesh'
import { allSeats } from '../core/seat-engine'
import type { Venue } from '../core/venue-schema'

const venue: Venue = {
  id: 'v', name: 'V', units: 'm',
  stage: { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] },
  sections: [
    {
      id: 'P', shape: { type: 'polygon', points: [[-2, 10], [2, 10], [2, 14], [-2, 14]] },
      rows: 2, rowDepth: 1, riser: 0.4, baseHeight: 3, seatsPerRow: 2, rowLabels: 'numeric', seatNumbering: 'left-to-right',
    },
  ],
  obstacles: [
    { type: 'pillar', position: [5, 0, 5], radius: 0.4, height: 10 },
    { type: 'railing', from: [-3, 3, 9.5], to: [3, 3, 9.5], height: 1 },
  ],
}

describe('buildVenueGroup', () => {
  const seats = allSeats(venue)
  const group = buildVenueGroup(venue, seats)

  it('좌석 수만큼 인스턴스를 가진 InstancedMesh를 만든다', () => {
    const seatMesh = group.getObjectByName('seats') as THREE.InstancedMesh
    expect(seatMesh).toBeInstanceOf(THREE.InstancedMesh)
    expect(seatMesh.count).toBe(seats.length)
  })

  it('첫 좌석 인스턴스는 좌석 위치 위에 놓인다', () => {
    const seatMesh = group.getObjectByName('seats') as THREE.InstancedMesh
    const m = new THREE.Matrix4()
    seatMesh.getMatrixAt(0, m)
    const p = new THREE.Vector3().setFromMatrixPosition(m)
    expect(p.x).toBeCloseTo(seats[0].position[0], 5)
    expect(p.y).toBeGreaterThan(seats[0].position[1])
    expect(p.z).toBeCloseTo(seats[0].position[2], 5)
  })

  it('무대, 방해물, 조명을 포함한다', () => {
    expect(group.getObjectByName('stage')).toBeDefined()
    expect(group.getObjectByName('obstacles')!.children).toHaveLength(2)
    expect(group.children.some((c) => (c as THREE.Light).isLight)).toBe(true)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/three/venue-mesh.test.ts`
Expected: FAIL, import 오류

- [ ] **Step 3: 구현**

`src/three/venue-mesh.ts`:
```ts
import * as THREE from 'three'
import type { Seat } from '../core/seat-engine'
import type { Obstacle, Stage, Venue } from '../core/venue-schema'

const SEAT_SIZE = 0.45
const TILE_SIZE = 0.9
const TILE_THICKNESS = 0.12

function buildStage(stage: Stage): THREE.Group {
  const g = new THREE.Group()
  g.name = 'stage'
  const [w, h, d] = stage.size
  const [cx, cy, cz] = stage.center
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x7c4dff }))
  floor.position.set(cx, cy + h / 2, cz)
  g.add(floor)
  // 무대 뒤 백월: 방향감을 주기 위한 얇은 벽
  const wallH = 8
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w * 1.2, wallH, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x22232e, emissive: 0x11121a }),
  )
  wall.position.set(cx - stage.facing[0] * (d / 2), cy + wallH / 2, cz - stage.facing[2] * (d / 2))
  g.add(wall)
  return g
}

function buildSeats(seats: Seat[], stage: Stage): THREE.Group {
  const g = new THREE.Group()
  g.name = 'seatGroup'
  const seatMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(SEAT_SIZE, SEAT_SIZE, SEAT_SIZE),
    new THREE.MeshStandardMaterial({ color: 0xc23a4a }),
    seats.length,
  )
  seatMesh.name = 'seats'
  const tileMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(TILE_SIZE, TILE_THICKNESS, TILE_SIZE),
    new THREE.MeshStandardMaterial({ color: 0x555a66 }),
    seats.length,
  )
  tileMesh.name = 'tiles'
  const dummy = new THREE.Object3D()
  seats.forEach((s, i) => {
    const [x, y, z] = s.position
    const yaw = Math.atan2(stage.center[0] - x, stage.center[2] - z)
    dummy.rotation.set(0, yaw, 0)
    dummy.position.set(x, y + SEAT_SIZE / 2, z)
    dummy.updateMatrix()
    seatMesh.setMatrixAt(i, dummy.matrix)
    dummy.position.set(x, y - TILE_THICKNESS / 2, z)
    dummy.updateMatrix()
    tileMesh.setMatrixAt(i, dummy.matrix)
  })
  seatMesh.instanceMatrix.needsUpdate = true
  tileMesh.instanceMatrix.needsUpdate = true
  g.add(tileMesh, seatMesh)
  return g
}

function buildObstacle(o: Obstacle): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0 })
  if (o.type === 'pillar') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(o.radius, o.radius, o.height, 16), mat)
    m.position.set(o.position[0], o.position[1] + o.height / 2, o.position[2])
    return m
  }
  const dx = o.to[0] - o.from[0]
  const dz = o.to[2] - o.from[2]
  const len = Math.hypot(dx, dz)
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, o.height, len), mat)
  m.position.set((o.from[0] + o.to[0]) / 2, o.from[1] + o.height / 2, (o.from[2] + o.to[2]) / 2)
  m.rotation.y = Math.atan2(dx, dz)
  return m
}

export function buildVenueGroup(venue: Venue, seats: Seat[]): THREE.Group {
  const root = new THREE.Group()
  root.name = `venue:${venue.id}`

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2e }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.02
  root.add(ground)

  root.add(buildStage(venue.stage))
  root.add(buildSeats(seats, venue.stage))

  const obstacles = new THREE.Group()
  obstacles.name = 'obstacles'
  for (const o of venue.obstacles) obstacles.add(buildObstacle(o))
  root.add(obstacles)

  root.add(new THREE.HemisphereLight(0xffffff, 0x333340, 1.2))
  const sun = new THREE.DirectionalLight(0xffffff, 1.4)
  sun.position.set(50, 80, 30)
  root.add(sun)
  return root
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/three/venue-mesh.test.ts`
Expected: 3 passed

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/three/venue-mesh.ts src/three/venue-mesh.test.ts
git commit -m "feat(three): 좌석 InstancedMesh, 무대, 방해물 메시 생성"
```

---

### Task 11: look-controls, seat-view, shell-loader (브라우저 렌더링)

브라우저 전용이라 단위 테스트 없음. Task 14에서 화면으로 검증한다.

**Files:**
- Create: `src/three/look-controls.ts`, `src/three/seat-view.ts`, `src/three/shell-loader.ts`

- [ ] **Step 1: look-controls.ts 작성**

카메라는 제자리에 고정하고 드래그로 시선(yaw/pitch)만 돌린다. 오른쪽 드래그 = 오른쪽 보기, 아래 드래그 = 아래 보기.

```ts
import * as THREE from 'three'
import type { Vec3 } from '../core/seat-engine'

const MAX_PITCH = (85 * Math.PI) / 180

export class LookControls {
  yaw = 0
  pitch = 0
  enabled = true
  private dragging = false
  private lastX = 0
  private lastY = 0

  constructor(
    private camera: THREE.PerspectiveCamera,
    private dom: HTMLElement,
  ) {
    dom.style.touchAction = 'none'
    dom.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerup', this.onUp)
  }

  /** 현재 카메라 위치에서 target을 바라보도록 yaw/pitch를 맞춘다 */
  lookAt(target: Vec3): void {
    const d = new THREE.Vector3(target[0], target[1], target[2]).sub(this.camera.position)
    this.yaw = Math.atan2(d.x, d.z)
    this.pitch = Math.asin(THREE.MathUtils.clamp(d.y / d.length(), -1, 1))
    this.apply()
  }

  apply(): void {
    const cp = Math.cos(this.pitch)
    const dir = new THREE.Vector3(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp)
    this.camera.lookAt(this.camera.position.clone().add(dir))
  }

  private onDown = (e: PointerEvent): void => {
    if (!this.enabled) return
    this.dragging = true
    this.lastX = e.clientX
    this.lastY = e.clientY
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.dragging) return
    const dx = e.clientX - this.lastX
    const dy = e.clientY - this.lastY
    this.lastX = e.clientX
    this.lastY = e.clientY
    const k = 0.004 * (this.camera.fov / 60)
    this.yaw -= dx * k
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -MAX_PITCH, MAX_PITCH)
    this.apply()
  }

  private onUp = (): void => {
    this.dragging = false
  }

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerup', this.onUp)
  }
}
```

- [ ] **Step 2: seat-view.ts 작성**

```ts
import * as THREE from 'three'
import { LookControls } from './look-controls'
import type { CameraPose } from '../core/seat-camera'
import type { Vec3 } from '../core/seat-engine'

interface CameraAnim {
  from: THREE.Vector3
  to: THREE.Vector3
  target: Vec3
  start: number
  ms: number
}

export class SeatView {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  private controls: LookControls
  private venueGroup: THREE.Object3D | null = null
  private shellGroup: THREE.Object3D | null = null
  private marker: THREE.Mesh
  private anim: CameraAnim | null = null
  private raf = 0
  private observer: ResizeObserver

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)
    this.scene.background = new THREE.Color(0x1b1b20)
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
    this.controls = new LookControls(this.camera, this.renderer.domElement)
    this.marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffdd33 }),
    )
    this.marker.visible = false
    this.scene.add(this.marker)
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(container)
    this.resize()
    this.raf = requestAnimationFrame(this.loop)
  }

  setVenue(group: THREE.Object3D): void {
    if (this.venueGroup) this.scene.remove(this.venueGroup)
    this.venueGroup = group
    this.scene.add(group)
  }

  setShell(group: THREE.Object3D | null): void {
    if (this.shellGroup) this.scene.remove(this.shellGroup)
    this.shellGroup = group
    if (group) this.scene.add(group)
  }

  /** 공연장 전체가 보이는 부감 위치 */
  showOverview(stageCenter: Vec3): void {
    this.anim = null
    this.marker.visible = false
    this.camera.position.set(stageCenter[0], 70, stageCenter[2] + 110)
    this.controls.lookAt(stageCenter)
  }

  goToSeat(pose: CameraPose, seatPosition: Vec3): void {
    this.marker.position.set(seatPosition[0], seatPosition[1] + 0.3, seatPosition[2])
    this.marker.visible = true
    this.anim = {
      from: this.camera.position.clone(),
      to: new THREE.Vector3(pose.position[0], pose.position[1], pose.position[2]),
      target: pose.target,
      start: performance.now(),
      ms: 700,
    }
  }

  setFov(deg: number): void {
    this.camera.fov = deg
    this.camera.updateProjectionMatrix()
  }

  private resize(): void {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  private loop = (t: number): void => {
    this.raf = requestAnimationFrame(this.loop)
    if (this.anim) {
      const k = Math.min(1, (t - this.anim.start) / this.anim.ms)
      const eased = 1 - Math.pow(1 - k, 3)
      this.camera.position.lerpVectors(this.anim.from, this.anim.to, eased)
      this.controls.lookAt(this.anim.target)
      if (k >= 1) this.anim = null
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
```

- [ ] **Step 3: shell-loader.ts 작성**

```ts
import type { Group } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export function loadShell(url: string): Promise<Group> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  })
}
```

- [ ] **Step 4: 타입 검사**

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/three/look-controls.ts src/three/seat-view.ts src/three/shell-loader.ts
git commit -m "feat(three): SeatView 렌더러, 1인칭 둘러보기, glb 로더"
```

---

### Task 12: seatmap-math + SeatMap2D (2D 좌석도)

**Files:**
- Create: `src/core/seatmap-math.ts`, `src/ui/seatmap-2d.ts`
- Test: `src/core/seatmap-math.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/seatmap-math.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  boundsOf, expandBounds, fitTransform, worldToScreen, screenToWorld, zoomAt, pan, pointInPolygon, nearestSeat,
} from './seatmap-math'
import type { Seat } from './seat-engine'

describe('bounds', () => {
  it('boundsOf/expandBounds', () => {
    const b = boundsOf([[1, 2], [5, -3], [2, 9]])
    expect(b).toEqual({ minX: 1, maxX: 5, minZ: -3, maxZ: 9 })
    expect(expandBounds(b, 1)).toEqual({ minX: 0, maxX: 6, minZ: -4, maxZ: 10 })
  })
})

describe('fitTransform', () => {
  it('경계 중심을 캔버스 중심에 놓고 패딩 안에 들어가게 축소한다', () => {
    const t = fitTransform({ minX: -10, maxX: 10, minZ: 0, maxZ: 40 }, 200, 200, 20)
    expect(t.scale).toBeCloseTo(160 / 40, 5)
    expect(worldToScreen(t, [0, 20])).toEqual([100, 100])
  })
})

describe('transform roundtrip / zoom / pan', () => {
  const t = { scale: 4, offsetX: 50, offsetY: 30 }
  it('worldToScreen ↔ screenToWorld', () => {
    const w = screenToWorld(t, worldToScreen(t, [3, -7]))
    expect(w[0]).toBeCloseTo(3, 9)
    expect(w[1]).toBeCloseTo(-7, 9)
  })
  it('zoomAt은 커서 아래 월드 점을 고정한다', () => {
    const before = screenToWorld(t, [120, 80])
    const z = zoomAt(t, [120, 80], 2)
    expect(z.scale).toBe(8)
    const after = screenToWorld(z, [120, 80])
    expect(after[0]).toBeCloseTo(before[0], 9)
    expect(after[1]).toBeCloseTo(before[1], 9)
  })
  it('pan은 offset만 옮긴다', () => {
    expect(pan(t, 5, -3)).toEqual({ scale: 4, offsetX: 55, offsetY: 27 })
  })
})

describe('pointInPolygon', () => {
  const sq: [number, number][] = [[0, 0], [4, 0], [4, 4], [0, 4]]
  it('안/밖', () => {
    expect(pointInPolygon([2, 2], sq)).toBe(true)
    expect(pointInPolygon([5, 2], sq)).toBe(false)
  })
})

describe('nearestSeat', () => {
  const mk = (id: string, x: number, z: number): Seat =>
    ({ id, sectionId: 'A', row: '1', seat: 1, rowIndex: 0, seatIndex: 0, position: [x, 0, z] })
  const seats = [mk('a', 0, 0), mk('b', 1, 0), mk('c', 5, 5)]
  it('최대 거리 안의 가장 가까운 좌석', () => {
    expect(nearestSeat(seats, [0.8, 0.1], 0.5)?.id).toBe('b')
    expect(nearestSeat(seats, [3, 3], 0.5)).toBeUndefined()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/core/seatmap-math.test.ts`
Expected: FAIL, import 오류

- [ ] **Step 3: seatmap-math.ts 구현**

```ts
import type { Seat } from './seat-engine'
import type { Vec2 } from './section-outline'

export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number }
/** screen = world * scale + offset. 화면 y축은 월드 z축 */
export interface Transform { scale: number; offsetX: number; offsetY: number }

export function boundsOf(points: Vec2[]): Bounds {
  const b: Bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  for (const [x, z] of points) {
    b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x)
    b.minZ = Math.min(b.minZ, z); b.maxZ = Math.max(b.maxZ, z)
  }
  return b
}

export function expandBounds(b: Bounds, margin: number): Bounds {
  return { minX: b.minX - margin, maxX: b.maxX + margin, minZ: b.minZ - margin, maxZ: b.maxZ + margin }
}

export function fitTransform(b: Bounds, width: number, height: number, padding = 20): Transform {
  const w = b.maxX - b.minX || 1
  const h = b.maxZ - b.minZ || 1
  const scale = Math.min((width - 2 * padding) / w, (height - 2 * padding) / h)
  const cx = (b.minX + b.maxX) / 2
  const cz = (b.minZ + b.maxZ) / 2
  return { scale, offsetX: width / 2 - cx * scale, offsetY: height / 2 - cz * scale }
}

export function worldToScreen(t: Transform, p: Vec2): Vec2 {
  return [p[0] * t.scale + t.offsetX, p[1] * t.scale + t.offsetY]
}

export function screenToWorld(t: Transform, s: Vec2): Vec2 {
  return [(s[0] - t.offsetX) / t.scale, (s[1] - t.offsetY) / t.scale]
}

export function zoomAt(t: Transform, s: Vec2, factor: number): Transform {
  const w = screenToWorld(t, s)
  const scale = t.scale * factor
  return { scale, offsetX: s[0] - w[0] * scale, offsetY: s[1] - w[1] * scale }
}

export function pan(t: Transform, dx: number, dy: number): Transform {
  return { scale: t.scale, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }
}

export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    const crosses = zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

export function nearestSeat(seats: Seat[], p: Vec2, maxDist: number): Seat | undefined {
  let best: Seat | undefined
  let bestD = maxDist * maxDist
  for (const s of seats) {
    const dx = s.position[0] - p[0]
    const dz = s.position[2] - p[1]
    const d = dx * dx + dz * dz
    if (d < bestD) { bestD = d; best = s }
  }
  return best
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/core/seatmap-math.test.ts`
Expected: 7 passed

- [ ] **Step 5: SeatMap2D 작성 (브라우저 전용)**

`src/ui/seatmap-2d.ts`:
```ts
import type { Seat } from '../core/seat-engine'
import type { Section, Venue } from '../core/venue-schema'
import { sectionCentroid, sectionOutline, type Vec2 } from '../core/section-outline'
import {
  boundsOf, expandBounds, fitTransform, nearestSeat, pan, pointInPolygon, screenToWorld, worldToScreen, zoomAt,
  type Transform,
} from '../core/seatmap-math'

/** 이 배율(px/m) 이상이면 개별 좌석을 그리고 클릭할 수 있다 */
export const SEAT_ZOOM = 6
const CLICK_TOLERANCE_PX = 4

interface OutlineEntry { section: Section; pts: Vec2[]; center: Vec2 }

export interface SeatMapCallbacks {
  onSeat: (seat: Seat) => void
}

export class SeatMap2D {
  private ctx: CanvasRenderingContext2D
  private t: Transform = { scale: 1, offsetX: 0, offsetY: 0 }
  private outlines: OutlineEntry[]
  private selectedId: string | null = null
  private dragging = false
  private moved = false
  private last: Vec2 = [0, 0]
  private observer: ResizeObserver

  constructor(
    private canvas: HTMLCanvasElement,
    private venue: Venue,
    private seats: Seat[],
    private cb: SeatMapCallbacks,
  ) {
    this.ctx = canvas.getContext('2d')!
    this.outlines = venue.sections.map((section) => {
      const pts = sectionOutline(section, venue.stage)
      return { section, pts, center: sectionCentroid(pts) }
    })
    canvas.style.touchAction = 'none'
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointerleave', this.onUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.observer = new ResizeObserver(() => { this.syncSize(); this.fitAll() })
    this.observer.observe(canvas)
    this.syncSize()
    this.fitAll()
  }

  private get width(): number { return this.canvas.clientWidth }
  private get height(): number { return this.canvas.clientHeight }

  private syncSize(): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.max(1, Math.round(this.width * dpr))
    this.canvas.height = Math.max(1, Math.round(this.height * dpr))
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private allPoints(): Vec2[] {
    const [cx, , cz] = this.venue.stage.center
    const [w, , d] = this.venue.stage.size
    const stage: Vec2[] = [[cx - w / 2, cz - d / 2], [cx + w / 2, cz + d / 2]]
    return [...stage, ...this.outlines.flatMap((o) => o.pts)]
  }

  fitAll(): void {
    this.t = fitTransform(expandBounds(boundsOf(this.allPoints()), 2), this.width, this.height)
    this.draw()
  }

  zoomToSection(id: string): void {
    const o = this.outlines.find((x) => x.section.id === id)
    if (!o) return
    let t = fitTransform(expandBounds(boundsOf(o.pts), 1), this.width, this.height)
    if (t.scale < SEAT_ZOOM) {
      t = { scale: SEAT_ZOOM, offsetX: this.width / 2 - o.center[0] * SEAT_ZOOM, offsetY: this.height / 2 - o.center[1] * SEAT_ZOOM }
    }
    this.t = t
    this.draw()
  }

  setSelected(seatId: string | null): void {
    this.selectedId = seatId
    this.draw()
  }

  /** 선택 좌석이 화면에 들어오도록 그 구역으로 확대 */
  focusSeat(seat: Seat): void {
    this.selectedId = seat.id
    this.zoomToSection(seat.sectionId)
  }

  draw(): void {
    const { ctx, t } = this
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.fillStyle = '#f4f4f6'
    ctx.fillRect(0, 0, this.width, this.height)

    // 무대
    const [cx, , cz] = this.venue.stage.center
    const [w, , d] = this.venue.stage.size
    const s0 = worldToScreen(t, [cx - w / 2, cz - d / 2])
    const s1 = worldToScreen(t, [cx + w / 2, cz + d / 2])
    ctx.fillStyle = '#7c4dff'
    ctx.fillRect(s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1])
    ctx.fillStyle = '#fff'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('STAGE', (s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2)

    // 구역
    for (const o of this.outlines) {
      ctx.beginPath()
      o.pts.forEach((p, i) => {
        const s = worldToScreen(t, p)
        if (i === 0) ctx.moveTo(s[0], s[1])
        else ctx.lineTo(s[0], s[1])
      })
      ctx.closePath()
      ctx.fillStyle = 'rgba(80, 110, 200, 0.18)'
      ctx.strokeStyle = '#4a5fa8'
      ctx.lineWidth = 1
      ctx.fill()
      ctx.stroke()
      const c = worldToScreen(t, o.center)
      ctx.fillStyle = '#233'
      ctx.fillText(o.section.label ?? o.section.id, c[0], c[1])
    }

    // 좌석
    if (t.scale >= SEAT_ZOOM) {
      const r = Math.min(t.scale * 0.3, 5)
      ctx.fillStyle = '#c23a4a'
      for (const seat of this.seats) {
        const s = worldToScreen(t, [seat.position[0], seat.position[2]])
        if (s[0] < -r || s[1] < -r || s[0] > this.width + r || s[1] > this.height + r) continue
        ctx.fillRect(s[0] - r, s[1] - r, r * 2, r * 2)
      }
    }

    // 선택 좌석
    if (this.selectedId) {
      const seat = this.seats.find((x) => x.id === this.selectedId)
      if (seat) {
        const s = worldToScreen(t, [seat.position[0], seat.position[2]])
        ctx.beginPath()
        ctx.arc(s[0], s[1], Math.max(6, t.scale * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = '#ffdd33'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.fill()
        ctx.stroke()
      }
    }
  }

  private local(e: PointerEvent | WheelEvent): Vec2 {
    const r = this.canvas.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  private onDown = (e: PointerEvent): void => {
    this.dragging = true
    this.moved = false
    this.last = this.local(e)
    this.canvas.setPointerCapture(e.pointerId)
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.dragging) return
    const p = this.local(e)
    const dx = p[0] - this.last[0]
    const dy = p[1] - this.last[1]
    if (Math.abs(dx) + Math.abs(dy) > CLICK_TOLERANCE_PX) this.moved = true
    if (this.moved) {
      this.t = pan(this.t, dx, dy)
      this.last = p
      this.draw()
    }
  }

  private onUp = (e: PointerEvent): void => {
    if (!this.dragging) return
    this.dragging = false
    if (this.moved) return
    this.click(this.local(e))
  }

  private click(s: Vec2): void {
    const w = screenToWorld(this.t, s)
    if (this.t.scale >= SEAT_ZOOM) {
      const seat = nearestSeat(this.seats, w, 0.5)
      if (seat) {
        this.cb.onSeat(seat)
        return
      }
    }
    const hit = this.outlines.find((o) => pointInPolygon(w, o.pts))
    if (hit) this.zoomToSection(hit.section.id)
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2
    this.t = zoomAt(this.t, this.local(e), factor)
    this.draw()
  }

  dispose(): void {
    this.observer.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointerleave', this.onUp)
    this.canvas.removeEventListener('wheel', this.onWheel)
  }
}
```

- [ ] **Step 6: 타입 검사**

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 7: 커밋**

```bash
git add src/core/seatmap-math.ts src/core/seatmap-math.test.ts src/ui/seatmap-2d.ts
git commit -m "feat(ui): 2D 좌석도 캔버스와 좌표 변환"
```

---
### Task 13: 뷰어 — 라우터, 에셋 경로, 공연장 목록

**Files:**
- Create: `src/viewer/router.ts`, `src/viewer/assets.ts`, `src/viewer/dom.ts`, `src/viewer/venue-list.ts`
- Modify: `src/viewer/main.ts`
- Test: `src/viewer/router.test.ts`, `src/viewer/assets.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/viewer/router.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseRoute, buildVenueHash } from './router'

describe('parseRoute', () => {
  it('빈 해시나 알 수 없는 경로는 목록', () => {
    expect(parseRoute('')).toEqual({ page: 'list' })
    expect(parseRoute('#/')).toEqual({ page: 'list' })
    expect(parseRoute('#/foo')).toEqual({ page: 'list' })
  })
  it('공연장만', () => {
    expect(parseRoute('#/v/kspo-dome')).toEqual({ page: 'venue', venueId: 'kspo-dome' })
  })
  it('공연장 + 좌석', () => {
    expect(parseRoute('#/v/kspo-dome?s=A&r=12&n=7')).toEqual({
      page: 'venue', venueId: 'kspo-dome', seat: { sectionId: 'A', row: '12', seat: 7 },
    })
  })
  it('좌석 파라미터가 불완전하면 seat 없음', () => {
    expect(parseRoute('#/v/kspo-dome?s=A&r=12')).toEqual({ page: 'venue', venueId: 'kspo-dome' })
    expect(parseRoute('#/v/kspo-dome?s=A&r=12&n=x')).toEqual({ page: 'venue', venueId: 'kspo-dome' })
  })
})

describe('buildVenueHash', () => {
  it('왕복', () => {
    const h = buildVenueHash('sample-arena', { sectionId: '2F-201', row: 'B', seat: 3 })
    expect(h).toBe('#/v/sample-arena?s=2F-201&r=B&n=3')
    expect(parseRoute(h)).toEqual({ page: 'venue', venueId: 'sample-arena', seat: { sectionId: '2F-201', row: 'B', seat: 3 } })
  })
  it('좌석 없이', () => {
    expect(buildVenueHash('x')).toBe('#/v/x')
  })
})
```

`src/viewer/assets.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { assetUrl, venueJsonUrl } from './assets'

describe('assetUrl', () => {
  it('BASE_URL 뒤에 경로를 붙이고 슬래시를 하나로 맞춘다', () => {
    // vitest 기본 BASE_URL은 '/'
    expect(assetUrl('/venues/index.json')).toBe('/venues/index.json')
    expect(assetUrl('venues/index.json')).toBe('/venues/index.json')
    expect(venueJsonUrl('sample-arena')).toBe('/venues/sample-arena/venue.json')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/viewer`
Expected: FAIL, import 오류 2건

- [ ] **Step 3: router.ts, assets.ts, dom.ts 구현**

`src/viewer/router.ts`:
```ts
import type { SeatQuery } from '../core/seat-search'

export type Route = { page: 'list' } | { page: 'venue'; venueId: string; seat?: SeatQuery }
export type VenueRoute = Extract<Route, { page: 'venue' }>

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, '')
  const m = /^\/v\/([a-z0-9-]+)(?:\?(.*))?$/.exec(h)
  if (!m) return { page: 'list' }
  const params = new URLSearchParams(m[2] ?? '')
  const s = params.get('s')
  const r = params.get('r')
  const n = params.get('n')
  const route: Route = { page: 'venue', venueId: m[1] }
  if (s && r && n && /^\d+$/.test(n)) route.seat = { sectionId: s, row: r, seat: Number(n) }
  return route
}

export function buildVenueHash(venueId: string, seat?: SeatQuery): string {
  let h = `#/v/${venueId}`
  if (seat) h += `?${new URLSearchParams({ s: seat.sectionId, r: seat.row, n: String(seat.seat) })}`
  return h
}
```

`src/viewer/assets.ts`:
```ts
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/${path.replace(/^\//, '')}`
}

export function venueJsonUrl(venueId: string): string {
  return assetUrl(`venues/${venueId}/venue.json`)
}
```

`src/viewer/dom.ts`:
```ts
const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

export function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => MAP[c])
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/viewer`
Expected: 7 passed

- [ ] **Step 5: venue-list.ts 작성**

```ts
import { assetUrl, venueJsonUrl } from './assets'
import { buildVenueHash } from './router'
import { esc } from './dom'
import { validateVenue } from '../core/venue-schema'
import { seatCount } from '../core/seat-engine'

interface IndexEntry { id: string; name: string }

function card(e: IndexEntry, meta: string, hasShell: boolean): string {
  return `<a class="card" href="${buildVenueHash(e.id)}">
    <h2>${esc(e.name)}</h2>
    <p>${esc(meta)}${hasShell ? ' · 3D 외형 있음' : ''}</p>
  </a>`
}

async function describeVenue(e: IndexEntry): Promise<string> {
  try {
    const res = await fetch(venueJsonUrl(e.id))
    if (!res.ok) throw new Error(String(res.status))
    const r = validateVenue(await res.json())
    if (!r.ok) return card(e, '데이터 오류', false)
    return card(e, `${seatCount(r.venue).toLocaleString('ko-KR')}석`, Boolean(r.venue.shell))
  } catch {
    return card(e, '데이터 오류', false)
  }
}

export async function renderVenueList(root: HTMLElement): Promise<void> {
  root.innerHTML = `
    <header class="topbar"><h1>SeatView</h1><span class="muted">좌석 시야 미리보기</span></header>
    <main class="list"><p class="muted">불러오는 중…</p></main>`
  const main = root.querySelector('main')!
  let entries: IndexEntry[]
  try {
    const res = await fetch(assetUrl('venues/index.json'))
    if (!res.ok) throw new Error(String(res.status))
    entries = (await res.json()) as IndexEntry[]
  } catch {
    main.innerHTML = '<p class="error">공연장 목록을 불러오지 못했습니다.</p>'
    return
  }
  const cards = await Promise.all(entries.map(describeVenue))
  main.innerHTML = cards.join('') || '<p class="muted">등록된 공연장이 없습니다.</p>'
}
```

- [ ] **Step 6: main.ts를 해시 라우터로 교체**

`src/viewer/main.ts` (전체 교체):
```ts
import { parseRoute, type VenueRoute } from './router'
import { renderVenueList } from './venue-list'
import { renderVenuePage, type PageHandle } from './venue-page'

const root = document.getElementById('app')!
let page: PageHandle | null = null
let currentKey = ''

function navigate(): void {
  const route = parseRoute(location.hash)
  const key = route.page === 'list' ? 'list' : `venue:${route.venueId}`
  if (route.page === 'venue' && key === currentKey && page) {
    page.applyRoute(route as VenueRoute)
    return
  }
  page?.dispose()
  page = null
  currentKey = key
  if (route.page === 'list') {
    document.title = 'SeatView'
    void renderVenueList(root)
  } else {
    page = renderVenuePage(root, route)
  }
}

window.addEventListener('hashchange', navigate)
navigate()
```

이 시점에는 `./venue-page`가 없어 타입 검사가 실패한다. Task 14에서 만든다. 임시로 `src/viewer/venue-page.ts`를 아래 스텁으로 만들어 둔다:
```ts
import type { VenueRoute } from './router'

export interface PageHandle {
  dispose(): void
  applyRoute(route: VenueRoute): void
}

export function renderVenuePage(root: HTMLElement, route: VenueRoute): PageHandle {
  root.innerHTML = `<p>venue: ${route.venueId}</p>`
  return { dispose: () => { root.innerHTML = '' }, applyRoute: () => {} }
}
```

- [ ] **Step 7: 타입 검사와 브라우저 확인**

Run: `npm run typecheck`
Expected: 오류 없음

Run: `npm run dev` (백그라운드) 후 브라우저에서 `http://localhost:5173/`
Expected: "SeatView" 헤더 아래 "샘플 아레나" 카드, "2,888석" 표시. 카드 클릭 시 URL이 `#/v/sample-arena`로 바뀌고 "venue: sample-arena" 텍스트.

- [ ] **Step 8: 커밋**

```bash
git add src/viewer
git commit -m "feat(viewer): 해시 라우터와 공연장 목록 페이지"
```

---

### Task 14: 뷰어 — 좌석도 + 3D 시야 페이지

**Files:**
- Modify: `src/viewer/venue-page.ts` (스텁 교체), `src/viewer/style.css`

- [ ] **Step 1: venue-page.ts 작성**

```ts
import type { VenueRoute } from './router'
import { buildVenueHash } from './router'
import { assetUrl, venueJsonUrl } from './assets'
import { esc } from './dom'
import { validateVenue, type Venue } from '../core/venue-schema'
import { allSeats, findSeat, type Seat } from '../core/seat-engine'
import { cameraForSeat, distanceToStage, neighborSeat, type Direction } from '../core/seat-camera'
import { parseSeatQuery, type SeatQuery } from '../core/seat-search'
import { SeatMap2D } from '../ui/seatmap-2d'
import { SeatView } from '../three/seat-view'
import { buildVenueGroup } from '../three/venue-mesh'
import { loadShell } from '../three/shell-loader'

export interface PageHandle {
  dispose(): void
  applyRoute(route: VenueRoute): void
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const DIRECTIONS: Direction[] = ['front', 'back', 'left', 'right']

function layout(): string {
  return `
    <header class="topbar">
      <a href="#/" class="back">← 목록</a>
      <h1 id="venueName">불러오는 중…</h1>
      <form id="searchForm" class="search">
        <input id="searchInput" placeholder="예: A구역 12열 7번" autocomplete="off" />
        <button type="submit">이동</button>
      </form>
      <label class="fov">시야각 <input id="fov" type="range" min="30" max="100" value="60" /></label>
    </header>
    <main class="split">
      <section class="pane map">
        <canvas id="map"></canvas>
        <p class="hint">구역을 클릭해 확대한 뒤 좌석을 클릭하세요. 휠로 확대/축소, 드래그로 이동.</p>
      </section>
      <section class="pane view3d" id="view3d">
        <div id="notice" class="notice" hidden></div>
      </section>
    </main>
    <footer class="infobar">
      <span id="seatLabel">좌석을 선택하세요</span>
      <span id="distance"></span>
      <span class="nav">
        <button data-dir="front" disabled>앞열</button>
        <button data-dir="back" disabled>뒷열</button>
        <button data-dir="left" disabled>◀ 좌</button>
        <button data-dir="right" disabled>우 ▶</button>
      </span>
      <span id="message" class="message"></span>
    </footer>`
}

export function renderVenuePage(root: HTMLElement, route: VenueRoute): PageHandle {
  let disposed = false
  let venue: Venue | null = null
  let seats: Seat[] = []
  let map: SeatMap2D | null = null
  let view: SeatView | null = null
  let current: Seat | null = null
  let pending: VenueRoute = route

  root.innerHTML = layout()
  const $ = <T extends HTMLElement>(sel: string): T => root.querySelector(sel) as T

  function message(text: string): void {
    $('#message').textContent = text
  }

  function notice(text: string): void {
    const n = $('#notice')
    n.textContent = text
    n.hidden = false
  }

  function showFatal(text: string): void {
    root.innerHTML = `<div class="fatal"><p>${esc(text)}</p><a href="#/">공연장 목록으로</a></div>`
  }

  function sectionLabel(id: string): string {
    return venue?.sections.find((s) => s.id === id)?.label ?? id
  }

  function updateNav(): void {
    for (const dir of DIRECTIONS) {
      const btn = $<HTMLButtonElement>(`button[data-dir="${dir}"]`)
      btn.disabled = !current || !neighborSeat(seats, current, dir)
    }
  }

  function selectSeat(seat: Seat): void {
    if (!venue) return
    current = seat
    map?.setSelected(seat.id)
    view?.goToSeat(cameraForSeat(seat, venue.stage), seat.position)
    $('#seatLabel').textContent = `${sectionLabel(seat.sectionId)} ${seat.row}열 ${seat.seat}번`
    $('#distance').textContent = `무대까지 ${distanceToStage(seat, venue.stage).toFixed(1)} m`
    updateNav()
    message('')
    history.replaceState(null, '', buildVenueHash(route.venueId, { sectionId: seat.sectionId, row: seat.row, seat: seat.seat }))
  }

  function selectByQuery(q: SeatQuery): void {
    const seat = findSeat(seats, q.sectionId, q.row, q.seat)
    if (!seat) {
      message(`좌석을 찾을 수 없습니다: ${q.sectionId} ${q.row}열 ${q.seat}번`)
      return
    }
    map?.focusSeat(seat)
    selectSeat(seat)
  }

  function applyRoute(r: VenueRoute): void {
    pending = r
    if (!venue || !r.seat) return
    selectByQuery(r.seat)
  }

  async function load(): Promise<void> {
    let json: unknown
    try {
      const res = await fetch(venueJsonUrl(route.venueId))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      json = await res.json()
    } catch (e) {
      if (!disposed) showFatal(`공연장 데이터를 불러오지 못했습니다. (${e instanceof Error ? e.message : String(e)})`)
      return
    }
    if (disposed) return
    const r = validateVenue(json)
    if (!r.ok) {
      showFatal(`공연장 데이터 형식 오류:\n${r.errors.slice(0, 5).join('\n')}`)
      return
    }
    venue = r.venue
    seats = allSeats(venue)
    $('#venueName').textContent = venue.name
    document.title = `${venue.name} · SeatView`

    map = new SeatMap2D($('#map'), venue, seats, { onSeat: selectSeat })

    if (hasWebGL()) {
      view = new SeatView($('#view3d'))
      view.setVenue(buildVenueGroup(venue, seats))
      view.showOverview(venue.stage.center)
      if (venue.shell) {
        loadShell(assetUrl(venue.shell.glb))
          .then((g) => view?.setShell(g))
          .catch(() => notice('외형 모델을 불러오지 못해 기본 구조만 표시합니다.'))
      }
    } else {
      notice('이 브라우저는 WebGL을 지원하지 않아 3D 시야를 표시할 수 없습니다. 2D 좌석도만 제공합니다.')
    }
    applyRoute(pending)
  }

  $('#searchForm').addEventListener('submit', (e) => {
    e.preventDefault()
    const q = parseSeatQuery($<HTMLInputElement>('#searchInput').value)
    if (!q) {
      message('형식: 구역 열 번호 (예: A구역 12열 7번)')
      return
    }
    selectByQuery(q)
  })

  $('#fov').addEventListener('input', (e) => {
    view?.setFov(Number((e.target as HTMLInputElement).value))
  })

  for (const dir of DIRECTIONS) {
    $(`button[data-dir="${dir}"]`).addEventListener('click', () => {
      if (!current) return
      const next = neighborSeat(seats, current, dir)
      if (next) selectSeat(next)
    })
  }

  void load()

  return {
    applyRoute,
    dispose() {
      disposed = true
      map?.dispose()
      view?.dispose()
      root.innerHTML = ''
    },
  }
}
```

- [ ] **Step 2: style.css 작성 (전체 교체)**

`src/viewer/style.css`:
```css
:root {
  --bg: #ffffff;
  --fg: #1c1c22;
  --muted: #6b6b76;
  --accent: #7c4dff;
  --border: #e3e3e8;
  --topbar-h: 56px;
  --infobar-h: 52px;
}

* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--fg); }
#app { height: 100%; display: flex; flex-direction: column; }
a { color: var(--accent); }

.topbar {
  height: var(--topbar-h); display: flex; align-items: center; gap: 16px; padding: 0 16px;
  border-bottom: 1px solid var(--border); flex: none;
}
.topbar h1 { font-size: 18px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topbar .back { text-decoration: none; white-space: nowrap; }
.search { display: flex; gap: 6px; margin-left: auto; }
.search input { width: 200px; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; }
.search button, .nav button { padding: 6px 10px; border: 1px solid var(--border); background: #fafafc; border-radius: 6px; cursor: pointer; }
.nav button:disabled { opacity: 0.4; cursor: default; }
.fov { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 6px; }

.muted { color: var(--muted); }
.error { color: #c0392b; }

.list { padding: 24px 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.card { display: block; padding: 16px; border: 1px solid var(--border); border-radius: 10px; text-decoration: none; color: inherit; }
.card:hover { border-color: var(--accent); }
.card h2 { margin: 0 0 6px; font-size: 16px; }
.card p { margin: 0; color: var(--muted); font-size: 13px; }

.split { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; }
.pane { position: relative; min-height: 0; overflow: hidden; }
.pane.map { border-right: 1px solid var(--border); }
#map { width: 100%; height: 100%; display: block; cursor: grab; }
.hint { position: absolute; left: 8px; bottom: 8px; margin: 0; font-size: 12px; color: var(--muted); background: rgba(255,255,255,0.85); padding: 4px 8px; border-radius: 6px; pointer-events: none; }
.view3d { background: #1b1b20; }
.view3d canvas { width: 100%; height: 100%; display: block; cursor: move; }
.notice { position: absolute; top: 8px; left: 8px; right: 8px; padding: 8px 10px; background: rgba(255, 221, 51, 0.92); color: #222; font-size: 13px; border-radius: 6px; }

.infobar {
  height: var(--infobar-h); display: flex; align-items: center; gap: 16px; padding: 0 16px;
  border-top: 1px solid var(--border); flex: none; font-size: 14px;
}
#seatLabel { font-weight: 600; }
.nav { display: flex; gap: 4px; }
.message { color: #c0392b; margin-left: auto; font-size: 13px; }

.fatal { padding: 48px 16px; text-align: center; white-space: pre-line; }

@media (max-width: 800px) {
  .topbar { flex-wrap: wrap; height: auto; padding: 8px 12px; gap: 8px; }
  .search { margin-left: 0; width: 100%; }
  .search input { flex: 1; width: auto; }
  .split { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
  .pane.map { border-right: none; border-bottom: 1px solid var(--border); }
  .infobar { height: auto; flex-wrap: wrap; padding: 8px 12px; gap: 8px; }
  .message { margin-left: 0; width: 100%; }
}
```

- [ ] **Step 3: 타입 검사와 전체 테스트**

Run: `npm run typecheck && npm test`
Expected: 타입 오류 없음, 모든 테스트 통과

- [ ] **Step 4: 브라우저 수동 검증**

`npm run dev` 상태에서 `http://localhost:5173/#/v/sample-arena` 열고 아래를 차례로 확인한다.

1. 좌측에 무대(보라색 STAGE)와 구역 10개가 그려진 2D 좌석도, 우측에 3D 부감 뷰(계단식 관중석, 무대, 기둥, 난간).
2. 2D에서 "1층 102" 구역 클릭 → 그 구역으로 확대되고 좌석 점이 보인다.
3. 좌석 점 하나 클릭 → 3D 카메라가 0.7초 동안 그 좌석으로 이동하고 무대를 바라본다. 하단에 "1층 102 N열 M번", "무대까지 XX.X m". URL이 `#/v/sample-arena?s=102&r=N&n=M`으로 바뀐다.
4. 3D 화면 드래그 → 카메라 위치는 고정된 채 시선만 돈다. 시야각 슬라이더 → 화각 변화.
5. 앞열/뒷열/좌/우 버튼 → 인접 좌석으로 이동. 1열에서 "앞열"이 비활성.
6. 검색창에 `201 3 4` 입력 → 2층 201 3열 4번으로 이동. `999 1 1` → 하단에 "좌석을 찾을 수 없습니다".
7. 현재 URL을 새 탭에 붙여넣기 → 같은 좌석이 선택된 상태로 열린다.
8. `#/v/nope` → "공연장 데이터를 불러오지 못했습니다" + 목록 링크.
9. "1층 101" 앞쪽 좌석(예: `101 2 5`)에서 기둥(회색 원기둥)이 시야 안에 보인다.
10. 브라우저 폭을 700px로 줄이면 좌석도와 3D가 위아래로 쌓인다.

문제가 있으면 여기서 고친다. 통과할 때까지 다음 단계로 가지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add src/viewer
git commit -m "feat(viewer): 좌석도 + 3D 시야 페이지, URL 상태, 검색, 인접 좌석"
```

---
### Task 15: 관리자 도구 — 상태, 저장, px↔m 변환

**Files:**
- Create: `src/admin/admin-state.ts`, `src/admin/export.ts`
- Test: `src/admin/admin-state.test.ts`, `src/admin/export.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/admin/admin-state.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { emptyState, pxToWorld, worldToPx, type Calibration } from './admin-state'

const cal: Calibration = { originPx: [100, 100], pxPerMeter: 10, zSign: 1 }

describe('px ↔ world', () => {
  it('원점 기준으로 픽셀을 미터로 바꾼다', () => {
    expect(pxToWorld(cal, [150, 120])).toEqual([5, 2])
  })
  it('zSign이 -1이면 이미지 아래쪽이 -Z', () => {
    expect(pxToWorld({ ...cal, zSign: -1 }, [150, 120])).toEqual([5, -2])
  })
  it('왕복', () => {
    const p = worldToPx(cal, pxToWorld(cal, [37, 250]))
    expect(p[0]).toBeCloseTo(37, 9)
    expect(p[1]).toBeCloseTo(250, 9)
  })
})

describe('emptyState', () => {
  it('유효한 빈 공연장 초안을 만든다', () => {
    const s = emptyState()
    expect(s.venue.units).toBe('m')
    expect(s.venue.sections).toEqual([])
    expect(s.calibration.originPx).toBeNull()
  })
})
```

`src/admin/export.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { serializeVenue } from './export'
import { emptyState } from './admin-state'

describe('serializeVenue', () => {
  it('구역이 없으면 오류 목록을 돌려준다', () => {
    const r = serializeVenue(emptyState().venue)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.join('\n')).toContain('sections')
  })

  it('유효하면 들여쓰기된 JSON과 좌석 수를 돌려준다', () => {
    const s = emptyState()
    s.venue.id = 'demo'
    s.venue.name = '데모'
    s.venue.sections.push({
      id: 'A',
      shape: { type: 'polygon', points: [[-2, 10], [2, 10], [2, 14], [-2, 14]] },
      rows: 2, rowDepth: 1, riser: 0.3, baseHeight: 0, seatsPerRow: 3,
      rowLabels: 'numeric', seatNumbering: 'left-to-right',
    })
    const r = serializeVenue(s.venue)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.seatCount).toBe(6)
    expect(JSON.parse(r.json).id).toBe('demo')
    expect(r.json).toContain('\n  ')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/admin`
Expected: FAIL, import 오류

- [ ] **Step 3: admin-state.ts 구현**

```ts
import type { Venue } from '../core/venue-schema'
import type { Vec2 } from '../core/section-outline'

export interface Calibration {
  /** 무대 중앙(원점)의 이미지 픽셀 좌표 */
  originPx: Vec2 | null
  pxPerMeter: number | null
  /** 이미지 아래쪽이 +Z(관중석)면 1, 위쪽이 관중석이면 -1 */
  zSign: 1 | -1
}

export interface AdminState {
  imageDataUrl: string | null
  calibration: Calibration
  venue: Venue
}

const STORAGE_KEY = 'seatview-admin-draft'

export function emptyState(): AdminState {
  return {
    imageDataUrl: null,
    calibration: { originPx: null, pxPerMeter: null, zSign: 1 },
    venue: {
      id: 'new-venue',
      name: '새 공연장',
      units: 'm',
      stage: { center: [0, 0, 0], size: [20, 1.2, 12], facing: [0, 0, 1] },
      sections: [],
      obstacles: [],
    },
  }
}

export function isCalibrated(c: Calibration): c is Calibration & { originPx: Vec2; pxPerMeter: number } {
  return c.originPx !== null && c.pxPerMeter !== null
}

export function pxToWorld(c: Calibration, px: Vec2): Vec2 {
  if (!isCalibrated(c)) throw new Error('스케일과 원점을 먼저 지정하세요')
  return [(px[0] - c.originPx[0]) / c.pxPerMeter, ((px[1] - c.originPx[1]) / c.pxPerMeter) * c.zSign]
}

export function worldToPx(c: Calibration, w: Vec2): Vec2 {
  if (!isCalibrated(c)) throw new Error('스케일과 원점을 먼저 지정하세요')
  return [w[0] * c.pxPerMeter + c.originPx[0], (w[1] * c.zSign) * c.pxPerMeter + c.originPx[1]]
}

export function loadState(): AdminState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<AdminState>
    const base = emptyState()
    return {
      imageDataUrl: parsed.imageDataUrl ?? null,
      calibration: { ...base.calibration, ...(parsed.calibration ?? {}) },
      venue: { ...base.venue, ...(parsed.venue ?? {}) },
    }
  } catch {
    return emptyState()
  }
}

export function saveState(s: AdminState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // 용량 초과 등. 자동 저장 실패는 치명적이지 않다.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
```

- [ ] **Step 4: export.ts 구현**

```ts
import { validateVenue, type Venue } from '../core/venue-schema'
import { seatCount } from '../core/seat-engine'

export type SerializeResult = { ok: true; json: string; seatCount: number } | { ok: false; errors: string[] }

export function serializeVenue(draft: Venue): SerializeResult {
  const r = validateVenue(draft)
  if (!r.ok) return { ok: false, errors: r.errors }
  return { ok: true, json: JSON.stringify(r.venue, null, 2), seatCount: seatCount(r.venue) }
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/admin`
Expected: 6 passed

- [ ] **Step 6: 커밋**

```bash
git add src/admin/admin-state.ts src/admin/admin-state.test.ts src/admin/export.ts src/admin/export.test.ts
git commit -m "feat(admin): 편집 상태, localStorage 저장, px-m 변환, JSON 내보내기"
```

---

### Task 16: 관리자 도구 — 이미지 캔버스와 구역 폼

**Files:**
- Create: `src/admin/image-canvas.ts`, `src/admin/section-form.ts`

- [ ] **Step 1: image-canvas.ts 작성**

배경 이미지 위에 오버레이(원점, 무대, 구역 윤곽, 방해물, 작업 중인 점)를 그리고, 클릭을 **이미지 픽셀 좌표**로 돌려준다. 팬/줌은 `seatmap-math`의 Transform을 픽셀 공간에 그대로 적용한다.

```ts
import type { Vec2 } from '../core/section-outline'
import { sectionOutline } from '../core/section-outline'
import { fitTransform, pan, screenToWorld, worldToScreen, zoomAt, type Transform } from '../core/seatmap-math'
import { isCalibrated, worldToPx, type AdminState } from './admin-state'

export interface ImageCanvasCallbacks {
  /** 드래그가 아닌 클릭. 이미지 픽셀 좌표 */
  onClick: (px: Vec2) => void
}

export class ImageCanvas {
  private ctx: CanvasRenderingContext2D
  private img: HTMLImageElement | null = null
  private t: Transform = { scale: 1, offsetX: 0, offsetY: 0 }
  private dragging = false
  private moved = false
  private last: Vec2 = [0, 0]
  private observer: ResizeObserver
  /** 작업 중인 임시 점들(픽셀). 폴리곤 그리는 중, 난간 첫 점 등 */
  pendingPx: Vec2[] = []
  private state: AdminState

  constructor(
    private canvas: HTMLCanvasElement,
    state: AdminState,
    private cb: ImageCanvasCallbacks,
  ) {
    this.state = state
    this.ctx = canvas.getContext('2d')!
    canvas.style.touchAction = 'none'
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointerleave', this.onUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.observer = new ResizeObserver(() => { this.syncSize(); this.draw() })
    this.observer.observe(canvas)
    this.syncSize()
  }

  setState(state: AdminState): void {
    this.state = state
    this.draw()
  }

  async setImage(dataUrl: string | null): Promise<void> {
    if (!dataUrl) {
      this.img = null
      this.draw()
      return
    }
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다'))
      img.src = dataUrl
    })
    this.img = img
    this.fit()
  }

  fit(): void {
    if (!this.img) return
    this.t = fitTransform({ minX: 0, maxX: this.img.width, minZ: 0, maxZ: this.img.height }, this.width, this.height, 10)
    this.draw()
  }

  private get width(): number { return this.canvas.clientWidth }
  private get height(): number { return this.canvas.clientHeight }

  private syncSize(): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.max(1, Math.round(this.width * dpr))
    this.canvas.height = Math.max(1, Math.round(this.height * dpr))
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private dot(px: Vec2, color: string, r = 5): void {
    const s = worldToScreen(this.t, px)
    this.ctx.beginPath()
    this.ctx.arc(s[0], s[1], r, 0, Math.PI * 2)
    this.ctx.fillStyle = color
    this.ctx.fill()
  }

  private path(pxs: Vec2[], close: boolean): void {
    this.ctx.beginPath()
    pxs.forEach((p, i) => {
      const s = worldToScreen(this.t, p)
      if (i === 0) this.ctx.moveTo(s[0], s[1])
      else this.ctx.lineTo(s[0], s[1])
    })
    if (close) this.ctx.closePath()
  }

  draw(): void {
    const { ctx } = this
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.fillStyle = '#e9e9ee'
    ctx.fillRect(0, 0, this.width, this.height)
    if (this.img) {
      const s = worldToScreen(this.t, [0, 0])
      ctx.drawImage(this.img, s[0], s[1], this.img.width * this.t.scale, this.img.height * this.t.scale)
    }

    const cal = this.state.calibration
    if (cal.originPx) this.dot(cal.originPx, '#7c4dff', 6)

    if (isCalibrated(cal)) {
      const { stage, sections, obstacles } = this.state.venue
      // 무대
      const [cx, , cz] = stage.center
      const [w, , d] = stage.size
      this.path(
        [[cx - w / 2, cz - d / 2], [cx + w / 2, cz - d / 2], [cx + w / 2, cz + d / 2], [cx - w / 2, cz + d / 2]].map((p) => worldToPx(cal, p as Vec2)),
        true,
      )
      ctx.fillStyle = 'rgba(124, 77, 255, 0.35)'
      ctx.fill()
      // 구역
      ctx.lineWidth = 1.5
      for (const section of sections) {
        this.path(sectionOutline(section, stage).map((p) => worldToPx(cal, p)), true)
        ctx.fillStyle = 'rgba(80, 110, 200, 0.25)'
        ctx.strokeStyle = '#2f3f8f'
        ctx.fill()
        ctx.stroke()
      }
      // 방해물
      for (const o of obstacles) {
        if (o.type === 'pillar') this.dot(worldToPx(cal, [o.position[0], o.position[2]]), '#333', 5)
        else {
          this.path([worldToPx(cal, [o.from[0], o.from[2]]), worldToPx(cal, [o.to[0], o.to[2]])], false)
          ctx.strokeStyle = '#333'
          ctx.lineWidth = 3
          ctx.stroke()
        }
      }
    }

    // 작업 중인 점
    if (this.pendingPx.length) {
      this.path(this.pendingPx, false)
      ctx.strokeStyle = '#e53935'
      ctx.lineWidth = 1.5
      ctx.stroke()
      for (const p of this.pendingPx) this.dot(p, '#e53935', 4)
    }
  }

  private local(e: PointerEvent | WheelEvent): Vec2 {
    const r = this.canvas.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  private onDown = (e: PointerEvent): void => {
    this.dragging = true
    this.moved = false
    this.last = this.local(e)
    this.canvas.setPointerCapture(e.pointerId)
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.dragging) return
    const p = this.local(e)
    const dx = p[0] - this.last[0]
    const dy = p[1] - this.last[1]
    if (Math.abs(dx) + Math.abs(dy) > 4) this.moved = true
    if (this.moved) {
      this.t = pan(this.t, dx, dy)
      this.last = p
      this.draw()
    }
  }

  private onUp = (e: PointerEvent): void => {
    if (!this.dragging) return
    this.dragging = false
    if (this.moved) return
    const px = screenToWorld(this.t, this.local(e))
    this.cb.onClick([Math.round(px[0] * 10) / 10, Math.round(px[1] * 10) / 10])
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    this.t = zoomAt(this.t, this.local(e), e.deltaY < 0 ? 1.2 : 1 / 1.2)
    this.draw()
  }

  dispose(): void {
    this.observer.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointerleave', this.onUp)
    this.canvas.removeEventListener('wheel', this.onWheel)
  }
}
```

- [ ] **Step 2: section-form.ts 작성**

구역 하나의 파라미터를 입력받는 폼. polygon은 점을 캔버스에서 찍어 넘겨받고, arc는 폼 숫자로 정의한다. 값이 바뀔 때마다 `onChange`로 미리보기를 갱신하고, 저장 시 `onSave`.

```ts
import type { ArcSection, GridSection, PolygonSection } from '../core/venue-schema'
import type { Vec2 } from '../core/section-outline'

export interface SectionFormCallbacks {
  onChange: (section: GridSection | null) => void
  onSave: (section: GridSection) => void
  onCancel: () => void
}

interface Fields {
  id: string
  label: string
  rows: number
  rowDepth: number
  riser: number
  baseHeight: number
  seatsPerRow: string
  rowLabels: string
  seatNumbering: 'left-to-right' | 'right-to-left'
  // arc 전용
  centerX: number
  centerZ: number
  radiusStart: number
  angleStart: number
  angleEnd: number
}

function parseSeatsPerRow(text: string, rows: number): number | number[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean).map(Number)
  if (parts.some((n) => !Number.isInteger(n) || n <= 0)) return null
  if (parts.length === 1) return parts[0]
  if (parts.length === rows) return parts
  return null
}

function parseRowLabels(text: string, rows: number): 'numeric' | string[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean)
  if (parts.length === 0) return 'numeric'
  return parts.length === rows ? parts : null
}

export function buildSection(f: Fields, kind: 'polygon' | 'arc', points: Vec2[]): GridSection | null {
  const seatsPerRow = parseSeatsPerRow(f.seatsPerRow, f.rows)
  const rowLabels = parseRowLabels(f.rowLabels, f.rows)
  if (!f.id || !seatsPerRow || !rowLabels || f.rows < 1 || f.rowDepth <= 0) return null
  const base = {
    id: f.id.trim(),
    label: f.label.trim() || undefined,
    rows: f.rows,
    rowDepth: f.rowDepth,
    riser: f.riser,
    baseHeight: f.baseHeight,
    seatsPerRow,
    rowLabels,
    seatNumbering: f.seatNumbering,
  }
  if (kind === 'polygon') {
    if (points.length < 3) return null
    const s: PolygonSection = { ...base, shape: { type: 'polygon', points } }
    return s
  }
  if (f.radiusStart <= 0 || f.angleEnd <= f.angleStart) return null
  const s: ArcSection = {
    ...base,
    shape: { type: 'arc', center: [f.centerX, f.centerZ], radiusStart: f.radiusStart, angleStart: f.angleStart, angleEnd: f.angleEnd },
  }
  return s
}

const num = (name: string, label: string, value: number, step = '0.05') =>
  `<label>${label}<input name="${name}" type="number" step="${step}" value="${value}" /></label>`

export class SectionForm {
  private form: HTMLFormElement

  constructor(
    private container: HTMLElement,
    private kind: 'polygon' | 'arc',
    private points: Vec2[],
    initial: GridSection | null,
    private cb: SectionFormCallbacks,
  ) {
    const init = initial
    const arc = init?.shape.type === 'arc' ? init.shape : null
    container.innerHTML = `
      <form class="section-form">
        <h3>${kind === 'polygon' ? `다각형 구역 (점 ${points.length}개)` : '호(arc) 구역'}</h3>
        <label>구역 id<input name="id" value="${init?.id ?? ''}" required /></label>
        <label>표시 이름<input name="label" value="${init?.label ?? ''}" /></label>
        ${num('rows', '열 수', init?.rows ?? 10, '1')}
        ${num('rowDepth', '열 간격(m)', init?.rowDepth ?? 0.9)}
        ${num('riser', '열당 단차(m)', init?.riser ?? 0.35)}
        ${num('baseHeight', '1열 바닥 높이(m)', init?.baseHeight ?? 0)}
        <label>열당 좌석 수 (하나 또는 열 수만큼 쉼표 구분)
          <input name="seatsPerRow" value="${Array.isArray(init?.seatsPerRow) ? init.seatsPerRow.join(',') : (init?.seatsPerRow ?? 20)}" /></label>
        <label>열 이름 (비우면 1,2,3…)
          <input name="rowLabels" value="${Array.isArray(init?.rowLabels) ? init.rowLabels.join(',') : ''}" /></label>
        <label>번호 방향
          <select name="seatNumbering">
            <option value="left-to-right" ${init?.seatNumbering !== 'right-to-left' ? 'selected' : ''}>왼쪽→오른쪽</option>
            <option value="right-to-left" ${init?.seatNumbering === 'right-to-left' ? 'selected' : ''}>오른쪽→왼쪽</option>
          </select></label>
        ${kind === 'arc' ? `
          <fieldset><legend>호 정의 (m, 도)</legend>
            ${num('centerX', '중심 X', arc?.center[0] ?? 0)}
            ${num('centerZ', '중심 Z', arc?.center[1] ?? 0)}
            ${num('radiusStart', '시작 반경', arc?.radiusStart ?? 30)}
            ${num('angleStart', '시작 각도', arc?.angleStart ?? -30, '1')}
            ${num('angleEnd', '끝 각도', arc?.angleEnd ?? 30, '1')}
          </fieldset>` : ''}
        <p class="form-error" hidden></p>
        <div class="actions"><button type="submit">구역 저장</button><button type="button" data-cancel>취소</button></div>
      </form>`
    this.form = container.querySelector('form')!
    this.form.addEventListener('input', () => this.cb.onChange(this.read()))
    this.form.addEventListener('submit', (e) => {
      e.preventDefault()
      const s = this.read()
      const err = this.form.querySelector<HTMLElement>('.form-error')!
      if (!s) {
        err.textContent = '입력을 확인하세요: id, 열 수, 열당 좌석 수(열 수와 개수 일치), 호 각도'
        err.hidden = false
        return
      }
      this.cb.onSave(s)
    })
    this.form.querySelector('[data-cancel]')!.addEventListener('click', () => this.cb.onCancel())
    this.cb.onChange(this.read())
  }

  private read(): GridSection | null {
    const d = new FormData(this.form)
    const n = (k: string) => Number(d.get(k) ?? 0)
    const f: Fields = {
      id: String(d.get('id') ?? ''),
      label: String(d.get('label') ?? ''),
      rows: n('rows'),
      rowDepth: n('rowDepth'),
      riser: n('riser'),
      baseHeight: n('baseHeight'),
      seatsPerRow: String(d.get('seatsPerRow') ?? ''),
      rowLabels: String(d.get('rowLabels') ?? ''),
      seatNumbering: d.get('seatNumbering') === 'right-to-left' ? 'right-to-left' : 'left-to-right',
      centerX: n('centerX'),
      centerZ: n('centerZ'),
      radiusStart: n('radiusStart'),
      angleStart: n('angleStart'),
      angleEnd: n('angleEnd'),
    }
    return buildSection(f, this.kind, this.points)
  }

  dispose(): void {
    this.container.innerHTML = ''
  }
}
```

- [ ] **Step 3: buildSection 단위 테스트 추가**

`src/admin/section-form.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildSection } from './section-form'

const base = {
  id: 'A', label: '', rows: 3, rowDepth: 0.9, riser: 0.3, baseHeight: 0,
  seatsPerRow: '10', rowLabels: '', seatNumbering: 'left-to-right' as const,
  centerX: 0, centerZ: 0, radiusStart: 30, angleStart: -20, angleEnd: 20,
}

describe('buildSection', () => {
  it('polygon: 점 3개 이상이면 구역을 만든다', () => {
    const s = buildSection(base, 'polygon', [[0, 10], [4, 10], [4, 14]])
    expect(s?.shape.type).toBe('polygon')
    expect(s?.seatsPerRow).toBe(10)
    expect(s?.rowLabels).toBe('numeric')
  })
  it('polygon: 점이 부족하면 null', () => {
    expect(buildSection(base, 'polygon', [[0, 10], [4, 10]])).toBeNull()
  })
  it('seatsPerRow 쉼표 목록은 열 수와 같아야 한다', () => {
    expect(buildSection({ ...base, seatsPerRow: '10,11,12' }, 'arc', [])?.seatsPerRow).toEqual([10, 11, 12])
    expect(buildSection({ ...base, seatsPerRow: '10,11' }, 'arc', [])).toBeNull()
  })
  it('rowLabels 목록은 열 수와 같아야 한다', () => {
    expect(buildSection({ ...base, rowLabels: 'A,B,C' }, 'arc', [])?.rowLabels).toEqual(['A', 'B', 'C'])
    expect(buildSection({ ...base, rowLabels: 'A,B' }, 'arc', [])).toBeNull()
  })
  it('arc: 각도 범위가 뒤집히면 null', () => {
    expect(buildSection({ ...base, angleEnd: -30 }, 'arc', [])).toBeNull()
  })
  it('id가 비면 null', () => {
    expect(buildSection({ ...base, id: '' }, 'arc', [])).toBeNull()
  })
})
```

Run: `npx vitest run src/admin/section-form.test.ts`
Expected: 6 passed

- [ ] **Step 4: 타입 검사**

Run: `npm run typecheck`
Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/admin/image-canvas.ts src/admin/section-form.ts src/admin/section-form.test.ts
git commit -m "feat(admin): 배경 이미지 캔버스와 구역 입력 폼"
```

---

### Task 17: 관리자 도구 — 화면 조립, 모드, 미리보기, 내보내기

**Files:**
- Create: `src/admin/preview.ts`
- Modify: `src/admin/main.ts` (전체 교체), `src/admin/style.css` (전체 교체)

- [ ] **Step 1: preview.ts 작성**

```ts
import { SeatView } from '../three/seat-view'
import { buildVenueGroup } from '../three/venue-mesh'
import { allSeats, findSeat, type Seat } from '../core/seat-engine'
import { cameraForSeat } from '../core/seat-camera'
import type { Venue, GridSection } from '../core/venue-schema'
import type { SeatQuery } from '../core/seat-search'

/** 관리자 화면 하단의 3D 미리보기. 상태가 바뀔 때마다 rebuild() */
export class Preview {
  private view: SeatView
  private seats: Seat[] = []
  private venue: Venue | null = null

  constructor(container: HTMLElement) {
    this.view = new SeatView(container)
  }

  /** draft 구역(편집 중, 아직 저장 전)이 있으면 같은 id의 기존 구역을 대체해서 그린다 */
  rebuild(venue: Venue, draft: GridSection | null): void {
    const sections = draft
      ? [...venue.sections.filter((s) => s.id !== draft.id), draft]
      : venue.sections
    const merged: Venue = { ...venue, sections }
    this.venue = merged
    this.seats = sections.length ? allSeats(merged) : []
    this.view.setVenue(buildVenueGroup(merged, this.seats))
  }

  overview(): void {
    if (this.venue) this.view.showOverview(this.venue.stage.center)
  }

  /** 좌석으로 이동. 성공 여부 반환 */
  goTo(q: SeatQuery): boolean {
    if (!this.venue) return false
    const seat = findSeat(this.seats, q.sectionId, q.row, q.seat)
    if (!seat) return false
    this.view.goToSeat(cameraForSeat(seat, this.venue.stage), seat.position)
    return true
  }

  dispose(): void {
    this.view.dispose()
  }
}
```

- [ ] **Step 2: main.ts 작성 (전체 교체)**

모드: `scale`(두 점 + 거리) → `origin`(무대 중앙 클릭) → `audience`(관중석 쪽 클릭으로 zSign) → `stage`(모서리 두 점) → `polygon` / `arc` / `pillar` / `railing` / `select`.

```ts
import { ImageCanvas } from './image-canvas'
import { SectionForm } from './section-form'
import { Preview } from './preview'
import { clearState, isCalibrated, loadState, pxToWorld, saveState, type AdminState } from './admin-state'
import { downloadText, serializeVenue } from './export'
import { parseSeatQuery } from '../core/seat-search'
import { sectionOutline, type Vec2 } from '../core/section-outline'
import { pointInPolygon } from '../core/seatmap-math'
import type { GridSection, Section } from '../core/venue-schema'

type Mode = 'idle' | 'scale' | 'origin' | 'audience' | 'stage' | 'polygon' | 'arc' | 'pillar' | 'railing' | 'select'

const root = document.getElementById('app')!
root.innerHTML = `
  <header class="topbar">
    <h1>SeatView Admin</h1>
    <label>id <input id="venueId" /></label>
    <label>이름 <input id="venueName" /></label>
    <label class="file">좌석도 이미지 <input id="imageFile" type="file" accept="image/*" /></label>
    <button id="resetBtn" type="button" class="danger">초안 지우기</button>
  </header>
  <div class="body">
    <aside class="tools">
      <section>
        <h2>1. 캘리브레이션</h2>
        <button data-mode="scale">스케일: 두 점 찍기</button>
        <div id="scaleInput" hidden><label>두 점 사이 실제 거리(m) <input id="scaleMeters" type="number" step="0.1" /></label><button id="scaleApply" type="button">적용</button></div>
        <button data-mode="origin">원점: 무대 중앙 클릭</button>
        <button data-mode="audience">관중석 방향 클릭</button>
        <p id="calStatus" class="status"></p>
      </section>
      <section>
        <h2>2. 무대</h2>
        <button data-mode="stage">무대: 모서리 두 점</button>
        <label>무대 바닥 높이(m) <input id="stageHeight" type="number" step="0.1" /></label>
      </section>
      <section>
        <h2>3. 구역</h2>
        <button data-mode="polygon">다각형 구역 그리기</button>
        <button id="polygonDone" type="button" hidden>점 찍기 끝 → 입력</button>
        <button data-mode="arc">호(arc) 구역 추가</button>
        <button data-mode="select">구역 선택/수정</button>
        <div id="sectionForm"></div>
        <ul id="sectionList" class="section-list"></ul>
      </section>
      <section>
        <h2>4. 방해물</h2>
        <button data-mode="pillar">기둥: 위치 클릭</button>
        <button data-mode="railing">난간: 두 점</button>
        <div id="obstacleForm" hidden>
          <label>반경(m, 기둥) <input id="obRadius" type="number" step="0.05" value="0.4" /></label>
          <label>높이(m) <input id="obHeight" type="number" step="0.1" value="1.0" /></label>
          <label>바닥 높이(m) <input id="obBase" type="number" step="0.1" value="0" /></label>
        </div>
        <ul id="obstacleList" class="section-list"></ul>
      </section>
      <section>
        <h2>5. 확인·내보내기</h2>
        <form id="gotoForm"><input id="gotoInput" placeholder="예: A구역 12열 7번" /><button type="submit">시야 보기</button></form>
        <button id="overviewBtn" type="button">전체 보기</button>
        <p id="seatTotal" class="status"></p>
        <button id="exportBtn" type="button" class="primary">venue.json 다운로드</button>
        <p id="exportErrors" class="error"></p>
      </section>
    </aside>
    <main class="work">
      <canvas id="image"></canvas>
      <p id="modeHint" class="hint"></p>
    </main>
  </div>
  <section class="preview" id="preview"></section>`

const $ = <T extends HTMLElement>(sel: string): T => root.querySelector(sel) as T

let state: AdminState = loadState()
let mode: Mode = 'idle'
let clicks: Vec2[] = []          // 현재 모드에서 찍은 픽셀 점
let draftSection: GridSection | null = null
let form: SectionForm | null = null
let editingId: string | null = null

const preview = new Preview($('#preview'))
const canvas = new ImageCanvas($('#image'), state, { onClick: handleClick })

const HINTS: Record<Mode, string> = {
  idle: '좌석도 이미지를 올리고 1번부터 진행하세요. 휠로 확대, 드래그로 이동.',
  scale: '실제 거리를 아는 두 점을 차례로 클릭하세요 (예: 무대 양 끝).',
  origin: '무대 중앙을 클릭하세요. 이 점이 (0,0)이 됩니다.',
  audience: '관중석이 있는 쪽 아무 곳이나 클릭하세요.',
  stage: '무대 사각형의 마주보는 두 모서리를 클릭하세요.',
  polygon: '구역 윤곽을 따라 점을 클릭하세요. 무대에 가까운 변의 두 점을 먼저 찍습니다. 끝나면 "점 찍기 끝".',
  arc: '오른쪽 폼에서 호 파라미터를 조정하세요. 이미지에 윤곽이 바로 표시됩니다.',
  pillar: '기둥 위치를 클릭하세요.',
  railing: '난간의 시작점과 끝점을 클릭하세요.',
  select: '수정할 구역을 클릭하세요.',
}

function persist(): void {
  saveState(state)
  canvas.setState(state)
  preview.rebuild(state.venue, draftSection)
  renderLists()
  renderStatus()
}

function setMode(m: Mode): void {
  mode = m
  clicks = []
  canvas.pendingPx = []
  $('#modeHint').textContent = HINTS[m]
  $('#scaleInput').hidden = true
  $('#polygonDone').hidden = m !== 'polygon'
  $('#obstacleForm').hidden = m !== 'pillar' && m !== 'railing'
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === m))
  if (m !== 'polygon' && m !== 'arc' && m !== 'select') closeForm()
  if (m === 'arc') openForm('arc', [], null)
  canvas.draw()
}

function requireCalibration(): boolean {
  if (isCalibrated(state.calibration)) return true
  alertMsg('먼저 스케일과 원점을 지정하세요.')
  return false
}

function alertMsg(text: string): void {
  $('#modeHint').textContent = text
}

function handleClick(px: Vec2): void {
  switch (mode) {
    case 'scale':
      clicks.push(px)
      canvas.pendingPx = [...clicks]
      if (clicks.length === 2) $('#scaleInput').hidden = false
      canvas.draw()
      break
    case 'origin':
      state.calibration.originPx = px
      persist()
      setMode('idle')
      break
    case 'audience': {
      if (!state.calibration.originPx) { alertMsg('원점을 먼저 지정하세요.'); break }
      state.calibration.zSign = px[1] >= state.calibration.originPx[1] ? 1 : -1
      persist()
      setMode('idle')
      break
    }
    case 'stage': {
      if (!requireCalibration()) break
      clicks.push(px)
      canvas.pendingPx = [...clicks]
      canvas.draw()
      if (clicks.length < 2) break
      const a = pxToWorld(state.calibration, clicks[0])
      const b = pxToWorld(state.calibration, clicks[1])
      const w = Math.abs(a[0] - b[0])
      const d = Math.abs(a[1] - b[1])
      const cx = (a[0] + b[0]) / 2
      const cz = (a[1] + b[1]) / 2
      const h = state.venue.stage.size[1]
      state.venue.stage = { center: [cx, 0, cz], size: [w, h, d], facing: [0, 0, 1] }
      persist()
      setMode('idle')
      break
    }
    case 'polygon':
      if (!requireCalibration()) break
      clicks.push(px)
      canvas.pendingPx = [...clicks]
      canvas.draw()
      break
    case 'pillar': {
      if (!requireCalibration()) break
      const p = pxToWorld(state.calibration, px)
      state.venue.obstacles.push({
        type: 'pillar',
        position: [p[0], Number($<HTMLInputElement>('#obBase').value) || 0, p[1]],
        radius: Number($<HTMLInputElement>('#obRadius').value) || 0.4,
        height: Number($<HTMLInputElement>('#obHeight').value) || 1,
      })
      persist()
      break
    }
    case 'railing': {
      if (!requireCalibration()) break
      clicks.push(px)
      canvas.pendingPx = [...clicks]
      canvas.draw()
      if (clicks.length < 2) break
      const a = pxToWorld(state.calibration, clicks[0])
      const b = pxToWorld(state.calibration, clicks[1])
      const base = Number($<HTMLInputElement>('#obBase').value) || 0
      state.venue.obstacles.push({
        type: 'railing',
        from: [a[0], base, a[1]],
        to: [b[0], base, b[1]],
        height: Number($<HTMLInputElement>('#obHeight').value) || 1,
      })
      clicks = []
      canvas.pendingPx = []
      persist()
      break
    }
    case 'select': {
      if (!requireCalibration()) break
      const w = pxToWorld(state.calibration, px)
      const hit = state.venue.sections.find((s) => pointInPolygon(w, sectionOutline(s, state.venue.stage)))
      if (!hit) break
      if (!('rows' in hit)) { alertMsg('explicit 구역은 JSON에서 직접 수정하세요.'); break }
      editingId = hit.id
      const pts = hit.shape.type === 'polygon' ? hit.shape.points : []
      openForm(hit.shape.type, pts, hit)
      break
    }
    default:
      break
  }
}

function openForm(kind: 'polygon' | 'arc', points: Vec2[], initial: GridSection | null): void {
  closeForm()
  form = new SectionForm($('#sectionForm'), kind, points, initial, {
    onChange(section) {
      draftSection = section
      canvas.setState(draftState())
      preview.rebuild(state.venue, draftSection)
    },
    onSave(section) {
      const dup = state.venue.sections.some((s) => s.id === section.id && s.id !== editingId)
      if (dup) { alertMsg(`구역 id "${section.id}"가 이미 있습니다.`); return }
      const idx = editingId ? state.venue.sections.findIndex((s) => s.id === editingId) : -1
      if (idx >= 0) state.venue.sections[idx] = section
      else state.venue.sections.push(section)
      draftSection = null
      editingId = null
      closeForm()
      persist()
      setMode('idle')
    },
    onCancel() {
      draftSection = null
      editingId = null
      closeForm()
      persist()
      setMode('idle')
    },
  })
}

/** 편집 중 구역을 포함한 상태 (캔버스 윤곽 표시용) */
function draftState(): AdminState {
  if (!draftSection) return state
  const sections: Section[] = [...state.venue.sections.filter((s) => s.id !== draftSection!.id), draftSection]
  return { ...state, venue: { ...state.venue, sections } }
}

function closeForm(): void {
  form?.dispose()
  form = null
  draftSection = null
}

function renderLists(): void {
  const sl = $('#sectionList')
  sl.innerHTML = state.venue.sections
    .map((s) => `<li>${s.label ?? s.id} <small>(${s.id}, ${s.shape.type})</small> <button data-del-section="${s.id}">삭제</button></li>`)
    .join('')
  sl.querySelectorAll<HTMLButtonElement>('[data-del-section]').forEach((b) =>
    b.addEventListener('click', () => {
      state.venue.sections = state.venue.sections.filter((s) => s.id !== b.dataset.delSection)
      persist()
    }),
  )
  const ol = $('#obstacleList')
  ol.innerHTML = state.venue.obstacles
    .map((o, i) => `<li>${o.type === 'pillar' ? '기둥' : '난간'} #${i + 1} <button data-del-obstacle="${i}">삭제</button></li>`)
    .join('')
  ol.querySelectorAll<HTMLButtonElement>('[data-del-obstacle]').forEach((b) =>
    b.addEventListener('click', () => {
      state.venue.obstacles.splice(Number(b.dataset.delObstacle), 1)
      persist()
    }),
  )
}

function renderStatus(): void {
  const c = state.calibration
  $('#calStatus').textContent = isCalibrated(c)
    ? `스케일 ${c.pxPerMeter.toFixed(2)} px/m · 원점 (${c.originPx[0]}, ${c.originPx[1]}) · 관중석 ${c.zSign === 1 ? '아래' : '위'}`
    : `스케일 ${c.pxPerMeter ? '완료' : '미지정'} · 원점 ${c.originPx ? '완료' : '미지정'}`
  const r = serializeVenue(state.venue)
  $('#seatTotal').textContent = r.ok ? `총 좌석 수: ${r.seatCount.toLocaleString('ko-KR')}석` : '총 좌석 수: (유효하지 않음)'
  $<HTMLInputElement>('#venueId').value = state.venue.id
  $<HTMLInputElement>('#venueName').value = state.venue.name
  $<HTMLInputElement>('#stageHeight').value = String(state.venue.stage.size[1])
}

// --- 이벤트 연결 ---
root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) =>
  b.addEventListener('click', () => setMode(b.dataset.mode as Mode)),
)

$('#scaleApply').addEventListener('click', () => {
  const meters = Number($<HTMLInputElement>('#scaleMeters').value)
  if (!(meters > 0) || clicks.length !== 2) return
  const px = Math.hypot(clicks[0][0] - clicks[1][0], clicks[0][1] - clicks[1][1])
  state.calibration.pxPerMeter = px / meters
  persist()
  setMode('idle')
})

$('#polygonDone').addEventListener('click', () => {
  if (!isCalibrated(state.calibration)) return
  if (clicks.length < 3) { alertMsg('점을 3개 이상 찍어야 합니다.'); return }
  const cal = state.calibration
  const points = clicks.map((p) => pxToWorld(cal, p))
  editingId = null
  openForm('polygon', points, null)
})

$('#venueId').addEventListener('change', (e) => { state.venue.id = (e.target as HTMLInputElement).value.trim(); persist() })
$('#venueName').addEventListener('change', (e) => { state.venue.name = (e.target as HTMLInputElement).value.trim(); persist() })
$('#stageHeight').addEventListener('change', (e) => {
  state.venue.stage.size[1] = Number((e.target as HTMLInputElement).value) || 0
  persist()
})

$('#imageFile').addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(file)
  })
  state.imageDataUrl = dataUrl
  await canvas.setImage(dataUrl)
  persist()
})

$('#resetBtn').addEventListener('click', () => {
  // 브라우저 confirm 대신 두 번 클릭으로 확인
  const btn = $<HTMLButtonElement>('#resetBtn')
  if (btn.dataset.armed !== '1') {
    btn.dataset.armed = '1'
    btn.textContent = '정말 지우려면 한 번 더'
    setTimeout(() => { btn.dataset.armed = '0'; btn.textContent = '초안 지우기' }, 3000)
    return
  }
  clearState()
  location.reload()
})

$('#gotoForm').addEventListener('submit', (e) => {
  e.preventDefault()
  const q = parseSeatQuery($<HTMLInputElement>('#gotoInput').value)
  if (!q || !preview.goTo(q)) alertMsg('좌석을 찾을 수 없습니다. 형식: A구역 12열 7번')
})

$('#overviewBtn').addEventListener('click', () => preview.overview())

$('#exportBtn').addEventListener('click', () => {
  const r = serializeVenue(state.venue)
  const errBox = $('#exportErrors')
  if (!r.ok) {
    errBox.textContent = r.errors.join('\n')
    return
  }
  errBox.textContent = ''
  downloadText('venue.json', r.json)
})

// --- 시작 ---
void (async () => {
  if (state.imageDataUrl) {
    try { await canvas.setImage(state.imageDataUrl) } catch { state.imageDataUrl = null }
  }
  persist()
  preview.overview()
  setMode('idle')
})()
```

- [ ] **Step 3: style.css 작성 (전체 교체)**

`src/admin/style.css`:
```css
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #1c1c22; background: #fff; font-size: 14px; }
#app { height: 100%; display: grid; grid-template-rows: 48px 1fr 280px; }

.topbar { display: flex; align-items: center; gap: 12px; padding: 0 12px; border-bottom: 1px solid #e3e3e8; }
.topbar h1 { font-size: 16px; margin: 0 8px 0 0; }
.topbar label { display: flex; align-items: center; gap: 4px; }
.topbar input:not([type=file]) { width: 140px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; }
.topbar .danger { margin-left: auto; }

.body { display: grid; grid-template-columns: 320px 1fr; min-height: 0; }
.tools { overflow-y: auto; border-right: 1px solid #e3e3e8; padding: 8px 12px; }
.tools section { margin-bottom: 14px; }
.tools h2 { font-size: 13px; margin: 8px 0 6px; color: #444; }
.tools button { display: block; width: 100%; margin: 4px 0; padding: 6px 8px; border: 1px solid #ccc; background: #fafafc; border-radius: 4px; cursor: pointer; text-align: left; }
.tools button.active { border-color: #7c4dff; background: #efe9ff; }
.tools button.primary { background: #7c4dff; color: #fff; border-color: #7c4dff; }
.tools button.danger { color: #c0392b; }
.tools label { display: block; margin: 4px 0; }
.tools input[type=number], .tools input[type=text], .tools input:not([type]) { width: 100%; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; }
.tools select { width: 100%; padding: 4px; }
.status { color: #555; font-size: 12px; white-space: pre-line; }
.error { color: #c0392b; font-size: 12px; white-space: pre-line; }
.section-list { list-style: none; padding: 0; margin: 6px 0; }
.section-list li { display: flex; align-items: center; gap: 6px; padding: 2px 0; }
.section-list li button { width: auto; margin: 0; padding: 2px 6px; font-size: 12px; }
.section-form fieldset { border: 1px solid #ddd; padding: 6px; margin: 6px 0; }
.section-form .actions { display: flex; gap: 6px; }
.section-form .actions button { width: auto; }
.form-error { color: #c0392b; font-size: 12px; }

.work { position: relative; min-height: 0; }
#image { width: 100%; height: 100%; display: block; cursor: crosshair; }
.hint { position: absolute; left: 8px; top: 8px; margin: 0; padding: 6px 10px; background: rgba(255,255,255,0.92); border: 1px solid #ddd; border-radius: 6px; font-size: 13px; pointer-events: none; }

.preview { position: relative; border-top: 1px solid #e3e3e8; background: #1b1b20; min-height: 0; }
.preview canvas { width: 100%; height: 100%; display: block; }
```

- [ ] **Step 4: 타입 검사와 전체 테스트**

Run: `npm run typecheck && npm test`
Expected: 오류 없음, 모든 테스트 통과

- [ ] **Step 5: 브라우저 수동 검증**

`npm run dev` 상태에서 `http://localhost:5173/admin/` 열고 아래를 차례로 확인한다. 테스트용 좌석도 이미지가 없으면 `public/venues/sample-arena/` 의 2D 좌석도를 뷰어에서 스크린샷으로 저장해 쓴다.

1. 이미지 업로드 → 캔버스에 표시. 휠 확대, 드래그 이동. 새로고침해도 이미지와 상태가 남는다(localStorage).
2. "스케일: 두 점 찍기" → 두 점 클릭 → 거리 입력란 표시 → `20` 입력, 적용 → 상태에 px/m 표시.
3. "원점" → 무대 중앙 클릭 → 보라색 점. "관중석 방향" → 관중석 클릭 → 상태에 "관중석 아래/위".
4. "무대: 모서리 두 점" → 두 모서리 클릭 → 이미지에 보라색 사각형, 하단 3D에 무대 박스.
5. "다각형 구역 그리기" → 점 4개 클릭(무대 가까운 변 두 점 먼저) → "점 찍기 끝" → 폼 표시. 열 수 10, 좌석 수 20 입력 중에 3D 미리보기에 좌석이 실시간으로 나타난다. 저장 → 목록에 추가, 총 좌석 수 200석.
6. "호 구역 추가" → 폼의 반경/각도 조정 시 이미지에 띠 모양 윤곽이 즉시 그려진다. 저장.
7. "구역 선택/수정" → 구역 클릭 → 기존 값이 채워진 폼. 열 수 변경 후 저장 → 좌석 수 변경 반영.
8. 기둥 클릭 추가, 난간 두 점 추가 → 이미지와 3D에 표시. 목록에서 삭제 동작.
9. "시야 보기"에 `A 3 5` 입력 → 3D 카메라가 그 좌석으로 이동. "전체 보기" → 부감.
10. id를 `Test Venue`처럼 잘못 입력 후 "venue.json 다운로드" → 오류 문구(소문자/숫자/하이픈). `test-venue`로 고치면 파일이 다운로드되고, 그 파일을 `public/venues/test-venue/venue.json`에 두고 `index.json`에 추가하면 뷰어 목록에 뜬다.
11. "초안 지우기" 두 번 클릭 → 초기화.

- [ ] **Step 6: 커밋**

```bash
git add src/admin
git commit -m "feat(admin): 디지타이징 도구 화면, 모드, 3D 미리보기, 내보내기"
```

---

### Task 18: README, 빌드 검증, 마무리

**Files:**
- Create: `README.md`
- Modify: `public/venues/index.json` (Task 17에서 test-venue를 추가했다면 원복)

- [ ] **Step 1: README.md 작성**

```markdown
# SeatView

공연장 좌석을 고르면 그 자리에서 무대가 어떻게 보이는지 3D로 보여주는 정적 웹앱.

## 실행

    npm install
    npm run dev        # http://localhost:5173/  (뷰어), /admin/ (디지타이징 도구)
    npm test
    npm run build      # dist/ 정적 파일

## 공연장 추가

1. 티켓 사이트 좌석배치도 이미지를 저장한다.
2. `/admin/`에서 이미지를 올리고 스케일·원점·무대·구역·방해물을 입력한다. 하단 3D로 즉시 확인.
3. "venue.json 다운로드" → `public/venues/<id>/venue.json`에 두고 `public/venues/index.json`에 `{ "id", "name" }`을 추가한다.
4. (선택) Blender로 만든 외형 glb를 `public/venues/<id>/shell.glb`에 두고 venue.json에 `"shell": { "glb": "/venues/<id>/shell.glb" }`를 추가한다. glb 원점은 무대 중앙 바닥, +Z가 관중석 방향.

## 데이터 모델

`docs/superpowers/specs/2026-09-07-seat-view-design.md` 참고. 좌표계: 미터, 원점 = 무대 중앙 바닥, Y 위, 관중석 +Z.

## 구조

- `src/core` — 좌석 생성·카메라·검색·2D 수학. three.js 의존 없음, 단위 테스트.
- `src/three` — 메시 생성, 렌더러, 둘러보기, glb 로더.
- `src/ui` — 2D 좌석도 캔버스.
- `src/viewer` — 사용자 화면. `src/admin` — 관리자 도구.
```

- [ ] **Step 2: 최종 검증**

Run: `npm run typecheck && npm test && npm run build`
Expected: 타입 오류 없음, 모든 테스트 통과, `dist/` 생성

Run: `npm run preview` 후 `http://localhost:4173/#/v/sample-arena` 와 `http://localhost:4173/admin/`
Expected: 빌드 결과물에서도 뷰어와 관리자 도구가 dev와 동일하게 동작 (venue.json, 이미지 경로 정상)

- [ ] **Step 3: 커밋**

```bash
git add README.md public/venues/index.json
git commit -m "docs: README와 공연장 추가 절차"
```

---

## 자체 검토 결과

**스펙 커버리지**
- 범위(목록 → 좌석도 → 좌석 → 시야, 개별 좌석): Task 13, 14
- 3D 확보 정책(파라미터 기본, glb 선택): Task 10, 11(shell-loader), 14(shell 로드 + 실패 시 안내)
- 데이터 모델(arc/polygon/explicit, 규칙): Task 2, 3, 4, 5
- 디지타이징 흐름 4~10단계: Task 15, 16, 17 (이미지·스케일·원점·무대·구역·층(baseHeight)·방해물·좌석 수·다운로드·localStorage)
- 화면 흐름(URL 공유, 검색, FOV, 거리, 인접 좌석, 모바일 스택): Task 8, 13, 14
- 오류 처리 4가지: Task 14 (`showFatal`, shell catch, 좌석 없음 message, WebGL 미지원 notice)
- 테스트 계획: core 전부 단위 테스트, 시각 검증은 Task 14/17 수동 단계, InstancedMesh는 Task 10
- MVP 범위: 샘플 공연장(Task 9)으로 끝까지 동작, glb는 로더만

**스펙과 다른 점 (의도적)**
- 관리자 도구의 호(arc) 구역은 핸들 드래그 대신 폼 숫자 입력 + 이미지 위 실시간 윤곽 표시로 구현한다. 구현 단순화 목적이며 결과 데이터는 같다.
- 관리자 미리보기에서 좌석 클릭 대신 텍스트 입력("A 3 5")으로 시야를 확인한다.
- 스펙의 "성능 30fps" 기준은 자동 테스트 없이 Task 14 수동 검증에서 체감 확인한다.
