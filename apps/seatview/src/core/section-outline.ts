import type { ExplicitSection, Section, Stage } from './venue-schema'
import { generateSeats, type Seat } from './seat-engine'

export type Vec2 = [number, number]

const ARC_SAMPLES = 16
/** explicit 구역 윤곽을 좌석 바깥으로 넓히는 여유(m) */
const MARGIN = 0.5

function arcPoint(cx: number, cz: number, r: number, deg: number): Vec2 {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.sin(a), cz + r * Math.cos(a)]
}

function seatXZ(s: Seat): Vec2 {
  return [s.position[0], s.position[2]]
}

/**
 * 한 줄짜리 구역: 좌석 선을 따라 양옆으로 MARGIN만큼 부풀린 띠.
 * 경계 상자로 그리면 휘어 있는 한 줄(장애인석 84석, 98°)이 커다란 사각형이 된다.
 */
function ribbon(pts: Vec2[]): Vec2[] {
  const left: Vec2[] = []
  const right: Vec2[] = []
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(i - 1, 0)]
    const next = pts[Math.min(i + 1, pts.length - 1)]
    const tx = next[0] - prev[0]
    const tz = next[1] - prev[1]
    const len = Math.hypot(tx, tz) || 1
    const nx = (-tz / len) * MARGIN
    const nz = (tx / len) * MARGIN
    left.push([pts[i][0] + nx, pts[i][1] + nz])
    right.push([pts[i][0] - nx, pts[i][1] - nz])
  }
  return [...left, ...right.reverse()]
}

/** 앞열 → 오른쪽 끝 → 뒷열(역순) → 왼쪽 끝. 열을 따라가는 띠라서 휜 구역도 감싼다. */
function explicitOutline(section: ExplicitSection, stage: Stage): Vec2[] {
  const seats = [...generateSeats(section, stage)].sort(
    (a, b) => a.rowIndex - b.rowIndex || a.seatIndex - b.seatIndex,
  )
  if (seats.length === 1) {
    const [x, z] = seatXZ(seats[0])
    return [[x - MARGIN, z - MARGIN], [x + MARGIN, z - MARGIN], [x + MARGIN, z + MARGIN], [x - MARGIN, z + MARGIN]]
  }
  const rows: Vec2[][] = []
  let prev = -1
  for (const s of seats) {
    if (s.rowIndex !== prev) { rows.push([]); prev = s.rowIndex }
    rows[rows.length - 1].push(seatXZ(s))
  }
  if (rows.length === 1) return ribbon(rows[0])
  const middle = rows.slice(1, -1)
  const right = middle.map((r) => r[r.length - 1])
  const left = middle.map((r) => r[0]).reverse()
  return [...rows[0], ...right, ...rows[rows.length - 1].slice().reverse(), ...left]
}

export function sectionOutline(section: Section, stage: Stage): Vec2[] {
  if ('seats' in section) return explicitOutline(section, stage)
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
