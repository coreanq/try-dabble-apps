import {
  gameAnnouncementPresentation,
  type GameAnnouncement,
} from '@/lib/game/game-view-model';

interface GameAnnouncerProps {
  readonly announcement: GameAnnouncement;
}

/**
 * RN called AccessibilityInfo.announceForAccessibility; on the web the
 * screen reader watches a live region instead. The region element itself stays
 * mounted so mutations inside it are announced, and the inner span is keyed by
 * the announcement sequence — a repeated message still replaces the node, so it
 * is spoken again.
 */
export function GameAnnouncer({ announcement }: GameAnnouncerProps) {
  const presentation = gameAnnouncementPresentation(announcement);

  return (
    <div aria-atomic="true" aria-live="polite" className="sr-only" role="status">
      <span id={presentation.domId} key={presentation.key}>
        {presentation.spokenMessage}
      </span>
    </div>
  );
}
