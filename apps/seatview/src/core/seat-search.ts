export interface SeatQuery {
  sectionId: string
  row: string
  seat: number
}

// "구역/열/번" 접미어를 떼고 공백·쉼표·슬래시·하이픈으로 토큰화한다.
// 마지막 토큰 = 좌석 번호, 그 앞 = 열, 나머지를 '-'로 이어 구역 id로 본다 ("2F-201 12 7" → 2F-201).
const SUFFIX = /(구역|열|번)(?=[\s,/\-\d]|$)/g
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
