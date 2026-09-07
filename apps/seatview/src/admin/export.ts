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
