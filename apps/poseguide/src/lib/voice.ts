/**
 * Voice Coach on speechSynthesis. Everything is local: the browser's own
 * voices, no network TTS. Missing support is reported, not thrown.
 */
import { SPEECH_LANG, type Lang } from "./i18n.ts";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function speak(text: string, lang: Lang): boolean {
  if (!speechSupported() || !text) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LANG[lang];
    u.rate = 0.95;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(SPEECH_LANG[lang].toLowerCase().slice(0, 2)));
    if (voice) u.voice = voice;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
