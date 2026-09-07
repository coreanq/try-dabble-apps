import { z } from 'zod'

const vec2 = z.tuple([z.number(), z.number()])
const vec3 = z.tuple([z.number(), z.number(), z.number()])

// 검색(seat-search)에서 타이핑 가능하고 seatId 조합에서 모호하지 않도록 공백, |, 쉼표, 슬래시를 금지한다.
export const IDENTIFIER = /^[^\s|,/]+$/
/** 열 이름은 검색 파서(seat-search)가 '-'로 토큰을 나누므로 하이픈도 금지한다. */
export const ROW_LABEL = /^[^\s|,/\-]+$/

const gridFields = {
  id: z.string().regex(IDENTIFIER, '구역 id에 공백, |, 쉼표, 슬래시를 쓸 수 없습니다'),
  label: z.string().optional(),
  rows: z.number().int().positive(),
  rowDepth: z.number().positive(),
  riser: z.number().min(0),
  baseHeight: z.number(),
  seatsPerRow: z.union([z.number().int().positive(), z.array(z.number().int().positive()).min(1)]),
  rowLabels: z
    .union([z.literal('numeric'), z.array(z.string().regex(ROW_LABEL, '열 이름에 공백, |, 쉼표, 슬래시, 하이픈을 쓸 수 없습니다'))])
    .default('numeric'),
  seatNumbering: z.enum(['left-to-right', 'right-to-left']).default('left-to-right'),
}

export const arcShapeSchema = z.strictObject({
  type: z.literal('arc'),
  center: vec2,
  radiusStart: z.number().positive(),
  angleStart: z.number(),
  angleEnd: z.number(),
})

export const polygonShapeSchema = z.strictObject({
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
  if (Array.isArray(section.rowLabels) && new Set(section.rowLabels).size !== section.rowLabels.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['rowLabels'],
      message: 'rowLabels에 중복된 열 이름이 있습니다',
    })
  }
}

export const arcSectionSchema = z
  .strictObject({ ...gridFields, shape: arcShapeSchema })
  .superRefine((s, ctx) => {
    checkGrid(s, ctx)
    if (s.shape.angleEnd <= s.shape.angleStart) {
      ctx.addIssue({ code: 'custom', path: ['shape', 'angleEnd'], message: 'angleEnd는 angleStart보다 커야 합니다' })
    }
  })

export const polygonSectionSchema = z
  .strictObject({ ...gridFields, shape: polygonShapeSchema })
  .superRefine((s, ctx) => {
    checkGrid(s, ctx)
    const [a, b] = s.shape.points
    if (a[0] === b[0] && a[1] === b[1]) {
      ctx.addIssue({ code: 'custom', path: ['shape', 'points'], message: '앞변(첫 두 점)의 길이가 0입니다' })
    }
  })

export const explicitSectionSchema = z
  .strictObject({
    id: z.string().regex(IDENTIFIER, '구역 id에 공백, |, 쉼표, 슬래시를 쓸 수 없습니다'),
    label: z.string().optional(),
    shape: z.strictObject({ type: z.literal('explicit') }),
    seats: z
      .array(
        z.strictObject({
          row: z.string().regex(ROW_LABEL, '열 이름에 공백, |, 쉼표, 슬래시, 하이픈을 쓸 수 없습니다'),
          seat: z.number().int().positive(),
          position: vec3,
        }),
      )
      .min(1),
  })
  .superRefine((s, ctx) => {
    const seen = new Set<string>()
    s.seats.forEach((seat, i) => {
      const key = `${seat.row}|${seat.seat}`
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['seats', i],
          message: `좌석 중복: ${seat.row}열 ${seat.seat}번`,
        })
      }
      seen.add(key)
    })
  })

export const sectionSchema = z.union([arcSectionSchema, polygonSectionSchema, explicitSectionSchema])

export const obstacleSchema = z.union([
  z.strictObject({ type: z.literal('pillar'), position: vec3, radius: z.number().positive(), height: z.number().positive() }),
  z.strictObject({ type: z.literal('railing'), from: vec3, to: vec3, height: z.number().positive() }),
])

export const stageSchema = z.strictObject({ center: vec3, size: vec3, facing: vec3 })

export const venueSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/, '소문자, 숫자, 하이픈만 허용'),
    name: z.string().min(1),
    units: z.literal('m'),
    stage: stageSchema,
    sections: z.array(sectionSchema).min(1),
    obstacles: z.array(obstacleSchema).default([]),
    shell: z.strictObject({ glb: z.string().min(1) }).optional(),
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
  return [...prefix, ...p]
}

/**
 * zod 4는 union 실패를 invalid_union 하나로 묶고 세부 오류를 errors에 넣는다.
 * 중첩된 errors의 경로는 항상 해당 union 필드 기준 상대 경로이므로, prefix를 붙여
 * 사람이 읽을 수 있는 절대 경로 문자열로 펼친다.
 */
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
