const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

export function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => MAP[c])
}
