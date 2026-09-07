import { SeatView } from '../three/seat-view'
import { buildVenueGroup } from '../three/venue-mesh'
import { allSeats, findSeat, type Seat } from '../core/seat-engine'
import { cameraForSeat } from '../core/seat-camera'
import type { Venue } from '../core/venue-schema'
import type { SeatQuery } from '../core/seat-search'

/** 관리자 화면 하단의 3D 미리보기. 상태가 바뀔 때마다 rebuild() */
export class Preview {
  private view: SeatView
  private seats: Seat[] = []
  private venue: Venue | null = null

  constructor(container: HTMLElement) {
    this.view = new SeatView(container)
  }

  rebuild(venue: Venue): void {
    this.venue = venue
    try {
      this.seats = venue.sections.length ? allSeats(venue) : []
    } catch {
      this.seats = []
    }
    this.view.setVenue(buildVenueGroup(venue, this.seats))
  }

  overview(): void {
    if (this.venue) this.view.showOverview(this.venue.stage.center)
  }

  /** 좌석으로 이동. 성공 여부 반환 */
  goTo(q: SeatQuery): boolean {
    if (!this.venue) return false
    const seat = findSeat(this.seats, q.sectionId, q.row, q.seat)
    if (!seat) return false
    this.view.goToSeat(cameraForSeat(seat, this.venue.stage), seat.position)
    return true
  }

  dispose(): void {
    this.view.dispose()
  }
}
