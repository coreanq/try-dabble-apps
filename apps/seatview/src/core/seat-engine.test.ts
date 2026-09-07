import { describe, it, expect } from 'vitest'
import { allSeats, findSeat, generateSeats, seatCount } from './seat-engine'
import type { ArcSection, ExplicitSection, PolygonSection, Stage, Venue } from './venue-schema'

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

  it('center가 원점이 아니어도 그만큼 평행이동한다', () => {
    const offset: ArcSection = { ...arc, shape: { ...arc.shape, center: [5, -3] } }
    const s = generateSeats(offset, stage)[0]
    const a = (-67.5 * Math.PI) / 180
    expect(s.position[0]).toBeCloseTo(5 + 10.5 * Math.sin(a), 5)
    expect(s.position[2]).toBeCloseTo(-3 + 10.5 * Math.cos(a), 5)
  })
})

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
    // 앞변 방향은 정규화되어 첫 좌석은 항상 관객 기준 왼쪽(-x)
    expect(seats[0].position[0]).toBeCloseTo(-1, 5)
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

  it('seatsPerRow 배열이면 열마다 좌석 수가 다르다', () => {
    const seats = generateSeats({ ...poly, seatsPerRow: [1, 3] }, stage)
    expect(seats).toHaveLength(4)
    const row0 = seats.filter((s) => s.rowIndex === 0)
    expect(row0).toHaveLength(1)
    expect(row0[0].position[0]).toBeCloseTo(0, 5)
    expect(row0[0].position[2]).toBeCloseTo(10.5, 5)
    const row1 = seats.filter((s) => s.rowIndex === 1)
    expect(row1).toHaveLength(3)
    expect(row1[0].position[0]).toBeCloseTo(-1.3333, 3)
    expect(row1[1].position[0]).toBeCloseTo(0, 3)
    expect(row1[2].position[0]).toBeCloseTo(1.3333, 3)
  })

  it('앞변(첫 두 점)의 길이가 0이면 오류를 던진다', () => {
    const zero: PolygonSection = {
      ...poly,
      shape: { type: 'polygon', points: [[0, 10], [0, 10], [4, 14], [0, 14]] },
    }
    expect(() => generateSeats(zero, stage)).toThrow('길이가 0')
  })
})

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

  it('position은 원본 배열의 복사본이다', () => {
    const seats = generateSeats(box, stage)
    expect(seats[0].position).not.toBe(box.seats[0].position)
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

  it('findSeat는 구역/열 대소문자를 구분하지 않는다', () => {
    const seats = allSeats(venue)
    expect(findSeat(seats, 'p', '2', 1)?.id).toBe('P|2|1')
  })
})
