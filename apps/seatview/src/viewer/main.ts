import { parseRoute, type VenueRoute } from './router'
import { renderVenueList } from './venue-list'
import { renderVenuePage, type PageHandle } from './venue-page'

const root = document.getElementById('app')!
let page: PageHandle | null = null
let currentKey = ''
let gen = 0

function navigate(): void {
  gen++
  const route = parseRoute(location.hash)
  const key = route.page === 'list' ? 'list' : `venue:${route.venueId}`
  if (route.page === 'venue' && key === currentKey && page) {
    page.applyRoute(route as VenueRoute)
    return
  }
  page?.dispose()
  page = null
  currentKey = key
  if (route.page === 'list') {
    document.title = 'SeatView'
    const g = gen
    void renderVenueList(root, () => g === gen)
  } else {
    page = renderVenuePage(root, route)
  }
}

window.addEventListener('hashchange', navigate)
navigate()
