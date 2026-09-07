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
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('json')) throw new Error('공연장을 찾을 수 없습니다')
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

    try {
      view = new SeatView($('#view3d'))
      view.setVenue(buildVenueGroup(venue, seats))
      view.showOverview(venue.stage.center)
      if (venue.shell) {
        loadShell(assetUrl(venue.shell.glb))
          .then((g) => { if (!disposed) view?.setShell(g) })
          .catch(() => { if (!disposed) notice('외형 모델을 불러오지 못해 기본 구조만 표시합니다.') })
      }
    } catch {
      view = null
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
      map = null
      view = null
      root.innerHTML = ''
    },
  }
}
