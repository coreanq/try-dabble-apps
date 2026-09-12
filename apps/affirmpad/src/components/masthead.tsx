import { Moon, Sun, Vibrate, VibrateOff, Volume2, VolumeX } from "lucide-react";

import { ApMark } from "@/components/ap-mark";
import { LANGS, LANG_NAMES, type Lang, type Translate } from "@/lib/i18n";

/**
 * Brand row plus the three feedback toggles. The toggles are plain buttons
 * with aria-pressed so the state reads without colour; every one of them is
 * free and none of them is a gate.
 */
export function Masthead({
  t,
  lang,
  darkMode,
  soundEnabled,
  vibeEnabled,
  onLangChange,
  onToggleDark,
  onToggleSound,
  onToggleVibe,
}: {
  t: Translate;
  lang: Lang;
  darkMode: boolean;
  soundEnabled: boolean;
  vibeEnabled: boolean;
  onLangChange: (next: Lang) => void;
  onToggleDark: () => void;
  onToggleSound: () => void;
  onToggleVibe: () => void;
}) {
  return (
    <header className="ap-masthead">
      <div className="ap-masthead-row">
        <ApMark className="ap-mark" />
        <h1 id="brand-title">{t("title")}</h1>
        <label className="sr-only" htmlFor="lang-select">
          {t("langLabel")}
        </label>
        <select
          id="lang-select"
          className="ap-select"
          aria-label={t("langLabel")}
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
        >
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {LANG_NAMES[code]}
            </option>
          ))}
        </select>
      </div>
      <p className="ap-tagline">{t("tagline")}</p>
      <div className="ap-toggles" role="group" aria-label={t("settingsTitle")}>
        <button type="button" className="ap-pill" id="toggle-dark" aria-pressed={darkMode} onClick={onToggleDark}>
          {darkMode ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
          <span className="ap-pill-text">{darkMode ? t("darkMode") : t("lightMode")}</span>
        </button>
        <button type="button" className="ap-pill" id="toggle-sound" aria-pressed={soundEnabled} onClick={onToggleSound}>
          {soundEnabled ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
          <span className="ap-pill-text">{soundEnabled ? t("soundOn") : t("soundOff")}</span>
        </button>
        <button type="button" className="ap-pill" id="toggle-vibe" aria-pressed={vibeEnabled} onClick={onToggleVibe}>
          {vibeEnabled ? <Vibrate className="size-4" aria-hidden /> : <VibrateOff className="size-4" aria-hidden />}
          <span className="ap-pill-text">{vibeEnabled ? t("vibeOn") : t("vibeOff")}</span>
        </button>
      </div>
    </header>
  );
}
