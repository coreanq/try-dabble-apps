import type { ArcShape, ExplicitSection, GridSection, PolygonShape, Section, Stage, Venue } from './venue-schema'

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

function polygonPlacer(section: GridSection, shape: PolygonShape, stage: Stage): Placer {
  let p0 = shape.points[0]
  let p1 = shape.points[1]
  const ex = p1[0] - p0[0]
  const ez = p1[1] - p0[1]
  const len = Math.hypot(ex, ez)
  if (len === 0) throw new Error(`구역 ${section.id}: 앞변(첫 두 점)의 길이가 0입니다`)
  let ux = ex / len
  let uz = ez / len
  // 앞변에 수직인 방향. 무대 중앙에서 멀어지는 쪽을 고른다.
  let nx = -uz
  let nz = ux
  const mx = (p0[0] + p1[0]) / 2 - stage.center[0]
  const mz = (p0[1] + p1[1]) / 2 - stage.center[2]
  if (nx * mx + nz * mz < 0) {
    nx = -nx
    nz = -nz
  }
  // 앞변 방향을 정규화한다: 관객이 무대를 바라볼 때(-Z 방향) 오른쪽((nz, -nx))을 향하도록
  // p0→p1이 놓여 있지 않으면 p0/p1을 맞바꿔, seatIndex가 항상 관객 기준 오른쪽으로 증가하게 한다.
  if (ux * nz + uz * -nx < 0) {
    ;[p0, p1] = [p1, p0]
    ux = -ux
    uz = -uz
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

/**
 * explicit 구역의 seats 배열은 각 열 안에서 물리적 순서대로 나열되어 있어야 한다.
 * rowIndex/seatIndex는 등장 순서로 매겨지며, 이후 이웃 좌석 탐색은 seatIndex ± 1을 사용한다.
 * 열 자체도 무대에서 가까운 순(앞→뒤)으로 나열되어 있어야 한다. 이웃 좌석 탐색이 rowIndex ± 1을 쓰기 때문이다.
 */
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
  return seats.find(
    (s) =>
      s.sectionId.toUpperCase() === sectionId.toUpperCase() &&
      s.row.toUpperCase() === row.toUpperCase() &&
      s.seat === seat,
  )
}
