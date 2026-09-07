import { assetUrl, venueJsonUrl } from './assets'
import { buildVenueHash } from './router'
import { esc } from './dom'
import { validateVenue } from '../core/venue-schema'
import { seatCount } from '../core/seat-engine'

interface IndexEntry { id: string; name: string }

function card(e: IndexEntry, meta: string, hasShell: boolean): string {
  return `<a class="card" href="${esc(buildVenueHash(e.id))}">
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

export async function renderVenueList(root: HTMLElement, alive: () => boolean = () => true): Promise<void> {
  root.innerHTML = `
    <header class="topbar"><h1>SeatView</h1><span class="muted">좌석 시야 미리보기</span></header>
    <main class="list"><p class="muted">불러오는 중…</p></main>`
  const main = root.querySelector('main')!
  let entries: IndexEntry[]
  try {
    const res = await fetch(assetUrl('venues/index.json'))
    if (!res.ok) throw new Error(String(res.status))
    entries = (await res.json()) as IndexEntry[]
    if (!Array.isArray(entries)) throw new Error('index.json must be an array')
  } catch {
    main.innerHTML = '<p class="error">공연장 목록을 불러오지 못했습니다.</p>'
    return
  }
  const cards = await Promise.all(entries.map(describeVenue))
  if (!alive()) return
  main.innerHTML = cards.join('') || '<p class="muted">등록된 공연장이 없습니다.</p>'
}
