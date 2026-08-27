import type { Translate } from "@/lib/i18n";

/**
 * The engine binds these by data-key at load time — it reads
 * querySelectorAll("[data-key]") once and pushes the value into its keyboard
 * state — so the pad is always in the DOM and CSS alone decides whether a
 * coarse pointer sees it. Ids stay as they were: the Worker labels them.
 */
export function TouchPad({ t }: { t: Translate }) {
  return (
    <div id="touch-controls">
      <button id="btn-left" type="button" data-key="ArrowLeft" aria-label={t("ariaLeft")}>
        ◀
      </button>
      <button id="btn-right" type="button" data-key="ArrowRight" aria-label={t("ariaRight")}>
        ▶
      </button>
      <button id="btn-jump" type="button" data-key=" " aria-label={t("ariaJump")}>
        ⤴
      </button>
      <button id="btn-menu" type="button" data-key="m" aria-label={t("ariaMenu")}>
        ☰
      </button>
    </div>
  );
}
