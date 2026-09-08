export { assetUrl } from '../core/assets'
import { assetUrl } from '../core/assets'

export function venueJsonUrl(venueId: string): string {
  return assetUrl(`venues/${venueId}/venue.json`)
}
