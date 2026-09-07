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
