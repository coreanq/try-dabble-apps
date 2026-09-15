/**
 * Voice punctuation. A final transcript that is only a command word
 * ("period", "마침표", "句点", "句号") becomes the mark instead of the word, and a
 * command spoken inside a longer sentence ("hello world comma how are you")
 * is cut out at that point. Commands are matched for the recognition
 * language first and then for every other language, because Chrome sometimes
 * hands back a Korean command while set to en-US and vice versa.
 *
 * Marks follow the recognition language: ja / zh get full-width 。、，？！,
 * ko / en get ASCII. Nothing here touches the DOM.
 */
export type Punct = "period" | "comma" | "newline" | "paragraph" | "question" | "exclaim";

export type Segment = { kind: "text"; value: string } | { kind: "punct"; value: string; punct: Punct };

type Family = "ko" | "en" | "ja" | "zh";

const COMMANDS: Record<Family, Record<Punct, string[]>> = {
  en: {
    period: ["period", "full stop", "fullstop"],
    comma: ["comma"],
    newline: ["new line", "newline", "line break", "next line"],
    paragraph: ["new paragraph", "paragraph", "paragraph break"],
    question: ["question mark"],
    exclaim: ["exclamation mark", "exclamation point"],
  },
  ko: {
    period: ["마침표", "온점"],
    comma: ["쉼표", "반점"],
    newline: ["줄바꿈", "줄 바꿈", "새 줄", "새줄", "개행"],
    paragraph: ["단락", "새 단락", "새단락", "문단", "새 문단", "새문단"],
    question: ["물음표"],
    exclaim: ["느낌표"],
  },
  ja: {
    period: ["句点", "くてん", "まる"],
    comma: ["読点", "とうてん", "コンマ", "カンマ"],
    newline: ["改行", "かいぎょう"],
    paragraph: ["段落", "新しい段落", "だんらく"],
    question: ["疑問符", "クエスチョンマーク", "はてな"],
    exclaim: ["感嘆符", "びっくりマーク"],
  },
  zh: {
    period: ["句号"],
    comma: ["逗号"],
    newline: ["换行", "換行", "新行"],
    paragraph: ["段落", "新段落", "分段"],
    question: ["问号", "問號"],
    exclaim: ["感叹号", "感嘆號", "叹号"],
  },
};

const FAMILIES: Family[] = ["en", "ko", "ja", "zh"];

export function familyOf(lang: string): Family {
  const l = (lang || "").toLowerCase();
  if (l.startsWith("ko")) return "ko";
  if (l.startsWith("ja")) return "ja";
  if (l.startsWith("zh") || l.startsWith("yue") || l.startsWith("cmn")) return "zh";
  return "en";
}

/** True for languages written without spaces between words. */
export function isSpaceless(lang: string): boolean {
  const f = familyOf(lang);
  return f === "ja" || f === "zh";
}

export function markFor(punct: Punct, lang: string): string {
  const f = familyOf(lang);
  const wide = f === "ja" || f === "zh";
  switch (punct) {
    case "period":
      return wide ? "。" : ".";
    case "comma":
      if (f === "ja") return "、";
      return f === "zh" ? "，" : ",";
    case "question":
      return wide ? "？" : "?";
    case "exclaim":
      return wide ? "！" : "!";
    case "newline":
      return "\n";
    case "paragraph":
      return "\n\n";
  }
}

const TRAILING = /[\s.。,，、!！?？]+$/u;
const LEADING = /^[\s.。,，、!！?？]+/u;

function normalize(s: string): string {
  return s.replace(LEADING, "").replace(TRAILING, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function familiesFor(lang: string): Family[] {
  const first = familyOf(lang);
  return [first, ...FAMILIES.filter((f) => f !== first)];
}

/** Whole-transcript match: the recogniser returned just a command word. */
export function matchCommand(transcript: string, lang: string): Punct | null {
  const key = normalize(transcript);
  if (!key) return null;
  for (const fam of familiesFor(lang)) {
    const table = COMMANDS[fam];
    for (const punct of Object.keys(table) as Punct[]) {
      for (const phrase of table[punct]) {
        if (phrase === key || phrase.replace(/\s+/g, "") === key.replace(/\s+/g, "")) return punct;
      }
    }
  }
  return null;
}

/**
 * The single-phrase helper the UI and tests lean on: a transcript that is
 * exactly a command becomes { kind: 'punct' }, anything else is text.
 */
export function applyVoiceCommand(transcript: string, lang: string): { kind: "text" | "punct"; value: string } {
  const punct = matchCommand(transcript, lang);
  if (punct) return { kind: "punct", value: markFor(punct, lang) };
  return { kind: "text", value: transcript.trim() };
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const patternCache = new Map<string, { rx: RegExp; lookup: Map<string, Punct> }>();

function patternFor(lang: string): { rx: RegExp; lookup: Map<string, Punct> } {
  const fam = familyOf(lang);
  const hit = patternCache.get(fam);
  if (hit) return hit;
  const lookup = new Map<string, Punct>();
  const phrases: string[] = [];
  for (const f of familiesFor(fam)) {
    const table = COMMANDS[f];
    for (const punct of Object.keys(table) as Punct[]) {
      for (const phrase of table[punct]) {
        const k = phrase.toLowerCase();
        if (!lookup.has(k)) {
          lookup.set(k, punct);
          phrases.push(k);
        }
      }
    }
  }
  phrases.sort((a, b) => b.length - a.length);
  const alt = phrases.map((p) => esc(p).replace(/ /g, "\\s+")).join("|");
  // Latin phrases need word boundaries ("comma" must not fire inside
  // "commander"); CJK phrases have no spaces around them, so they match bare.
  const rx = new RegExp(`(?<![\\p{L}\\p{N}])(${alt})(?![\\p{L}\\p{N}])|(${alt})`, "giu");
  const built = { rx, lookup };
  patternCache.set(fam, built);
  return built;
}

function isLatinPhrase(p: string): boolean {
  return /^[a-z ]+$/i.test(p);
}

/**
 * Splits one final transcript into text and punctuation segments, so a
 * sentence with a spoken "comma" in the middle is written with the mark in
 * that place. Latin commands only match as whole words; CJK commands match
 * anywhere, which is how the recogniser returns them (no spaces).
 */
export function segmentTranscript(transcript: string, lang: string): Segment[] {
  const out: Segment[] = [];
  const src = transcript;
  if (!src.trim()) return out;
  const { rx, lookup } = patternFor(lang);
  rx.lastIndex = 0;
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(src)) !== null) {
    const bounded = m[1];
    const bare = m[2];
    const phrase = (bounded ?? bare ?? "").toLowerCase().replace(/\s+/g, " ");
    // A Latin phrase that only matched bare (inside a word) is not a command.
    if (!bounded && isLatinPhrase(phrase)) continue;
    const punct = lookup.get(phrase);
    if (!punct) continue;
    const before = src.slice(cursor, m.index);
    if (normalizeText(before)) out.push({ kind: "text", value: normalizeText(before) });
    out.push({ kind: "punct", value: markFor(punct, lang), punct });
    cursor = m.index + m[0].length;
  }
  const tail = src.slice(cursor);
  if (normalizeText(tail)) out.push({ kind: "text", value: normalizeText(tail) });
  return out;
}

function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Appends segments to a note body. Text gets a space before it in ko / en
 * unless the body is empty or ends with a line break; ja / zh join directly.
 * Punctuation glues to the previous character (no space before a comma).
 * English gets a capital after a sentence end.
 */
export function appendSegments(body: string, segments: Segment[], lang: string): string {
  let out = body;
  const fam = familyOf(lang);
  const spaceless = isSpaceless(lang);
  for (const seg of segments) {
    if (seg.kind === "punct") {
      if (seg.punct === "newline" || seg.punct === "paragraph") {
        out = out.replace(/[ \t]+$/, "") + seg.value;
      } else {
        out = out.replace(/\s+$/, "") + seg.value;
      }
      continue;
    }
    let text = seg.value;
    if (!text) continue;
    if (fam === "en") {
      const endsSentence = out === "" || /[.!?]\s*$/.test(out) || /\n\s*$/.test(out);
      if (endsSentence) text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    if (out === "" || /\n$/.test(out)) out += text;
    else if (spaceless) out += text;
    else out += (/\s$/.test(out) ? "" : " ") + text;
  }
  return out;
}

/** Convenience: one final transcript straight into the body. */
export function appendTranscript(body: string, transcript: string, lang: string): string {
  return appendSegments(body, segmentTranscript(transcript, lang), lang);
}
