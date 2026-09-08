export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/${path.replace(/^\//, '')}`
}

export function venueJsonUrl(venueId: string): string {
  return assetUrl(`venues/${venueId}/venue.json`)
}
