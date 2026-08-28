/** Every visible string in ko/en/ja/zh. Same shape as the sibling apps. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "trashpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  zh: "zh",
};

/** zh has its own card. Never point it at the en file. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://trashpad.try-dabble.com/og-image.png",
  en: "https://trashpad.try-dabble.com/og-image-en.png",
  ja: "https://trashpad.try-dabble.com/og-image-ja.png",
  zh: "https://trashpad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "localOnly"
  | "metaDescription"
  | "about"
  | "langLabel"
  | "defaultTimerLabel"
  | "defaultTimerHint"
  | "noteTimerLabel"
  | "newNote"
  | "notePlaceholder"
  | "emptyTitle"
  | "emptyBody"
  | "emptyCta"
  | "leftLabel"
  | "goneSoon"
  | "expiringNow"
  | "resetTimer"
  | "resetDone"
  | "deleteNote"
  | "deleteConfirmTitle"
  | "deleteConfirmBody"
  | "cancel"
  | "delete"
  | "autosave"
  | "sweptOne"
  | "sweptN"
  | "padCount"
  | "editedAt"
  | "unitD"
  | "unitH"
  | "unitM"
  | "unitS"
  | "preset1h"
  | "preset6h"
  | "preset24h"
  | "preset48h"
  | "preset7d"
  | "privacy"
  | "terms"
  | "howTitle"
  | "howBody";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "휴지패드",
    shortName: "휴지패드",
    tagline: "적으면 남고, 시간이 지나면 지워집니다",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    metaDescription:
      "저장 버튼 없는 메모장. 적는 순간 남고, 마지막으로 고친 뒤 24시간이 지나면 스스로 지워집니다. 타이머는 1시간·6시간·24시간·48시간·7일 중에 고릅니다. 계정도 구독도 없고, 탭을 닫아도 남습니다.",
    about:
      "적기만 하면 저장됩니다. 저장 버튼은 없습니다. 각 메모는 마지막으로 고친 시각부터 타이머만큼 지나면 스스로 지워집니다. 기본은 24시간이고, 메모마다 따로 바꿀 수 있습니다. 계정도 구독도 없고, 이 기기에만 남습니다.",
    langLabel: "언어",
    defaultTimerLabel: "새 메모 기본 타이머",
    defaultTimerHint: "마지막 수정 시각부터 셉니다. 고치면 다시 처음부터.",
    noteTimerLabel: "이 메모 타이머",
    newNote: "새 메모",
    notePlaceholder: "여기에 적으세요. 저장 버튼은 없습니다.",
    emptyTitle: "아직 비어 있습니다",
    emptyBody:
      "여기에 적으면 그대로 남습니다. 저장 버튼도, 계정도 없습니다. 탭을 닫아도 남아 있다가, 타이머가 끝나면 스스로 지워집니다. 기본은 마지막 수정으로부터 24시간입니다.",
    emptyCta: "첫 메모 적기",
    leftLabel: "남음",
    goneSoon: "곧 사라짐",
    expiringNow: "지워지는 중",
    resetTimer: "타이머 다시",
    resetDone: "타이머를 다시 시작했습니다",
    deleteNote: "지금 버리기",
    deleteConfirmTitle: "이 메모를 지금 버릴까요?",
    deleteConfirmBody: "되돌릴 수 없습니다. 보관함은 없습니다.",
    cancel: "취소",
    delete: "버리기",
    autosave: "적는 대로 저장됨 · 저장 버튼 없음",
    sweptOne: "만료된 메모 1개를 지웠습니다.",
    sweptN: "만료된 메모 {n}개를 지웠습니다.",
    padCount: "메모 {n}개",
    editedAt: "마지막 수정",
    unitD: "일",
    unitH: "시간",
    unitM: "분",
    unitS: "초",
    preset1h: "1시간",
    preset6h: "6시간",
    preset24h: "24시간",
    preset48h: "48시간",
    preset7d: "7일",
    privacy: "개인정보",
    terms: "이용약관",
    howTitle: "지워지는 규칙",
    howBody:
      "타이머는 마지막으로 고친 시각부터 셉니다. 고칠 때마다 처음부터 다시 셉니다. 시간이 끝난 메모는 앱을 열 때와 열려 있는 동안 자동으로 지워집니다. 보관함은 없습니다.",
  },
  en: {
    title: "Trashpad",
    shortName: "Trashpad",
    tagline: "Type it. It stays. Then it disappears.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    metaDescription:
      "A scratch pad with no Save button. Type and it stays, then deletes itself 24 hours after your last edit. Pick the timer: 1h, 6h, 24h, 48h, or 7 days. No account, no subscription, and it survives closing the tab.",
    about:
      "Type and it is saved. There is no Save button. Each note deletes itself once its timer runs out, counted from your last edit. The default is 24 hours and every note can use its own. No account, no subscription — it stays on this device.",
    langLabel: "Language",
    defaultTimerLabel: "Default timer for new notes",
    defaultTimerHint: "Counted from your last edit. Editing restarts it.",
    noteTimerLabel: "This note's timer",
    newNote: "New note",
    notePlaceholder: "Type here. There is no Save button.",
    emptyTitle: "The pad is empty",
    emptyBody:
      "Write here and it stays — no Save button, no account. It survives closing the tab, then deletes itself when the timer runs out. Default: 24 hours from your last edit.",
    emptyCta: "Start a note",
    leftLabel: "left",
    goneSoon: "going soon",
    expiringNow: "deleting now",
    resetTimer: "Restart timer",
    resetDone: "Timer restarted",
    deleteNote: "Trash it now",
    deleteConfirmTitle: "Trash this note now?",
    deleteConfirmBody: "This cannot be undone. There is no archive.",
    cancel: "Cancel",
    delete: "Trash it",
    autosave: "Saves as you type · no Save button",
    sweptOne: "Deleted 1 expired note.",
    sweptN: "Deleted {n} expired notes.",
    padCount: "{n} notes",
    editedAt: "Last edit",
    unitD: "d",
    unitH: "h",
    unitM: "m",
    unitS: "s",
    preset1h: "1h",
    preset6h: "6h",
    preset24h: "24h",
    preset48h: "48h",
    preset7d: "7d",
    privacy: "Privacy",
    terms: "Terms",
    howTitle: "How it disappears",
    howBody:
      "The timer counts from your last edit, and every edit restarts it. Expired notes are deleted when you open the app and while it stays open. There is no archive.",
  },
  ja: {
    title: "消えるメモ",
    shortName: "消えるメモ",
    tagline: "書けば残る。時間が来たら消える。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    metaDescription:
      "保存ボタンのないメモ帳。書けばそのまま残り、最後に直してから24時間で自動的に消えます。タイマーは1時間・6時間・24時間・48時間・7日から選べます。アカウントも定額課金もなく、タブを閉じても残ります。",
    about:
      "書けばそのまま保存されます。保存ボタンはありません。各メモは最後に直した時刻からタイマー分が過ぎると自動的に消えます。初期値は24時間で、メモごとに変えられます。アカウントも定額課金もなく、この端末にだけ残ります。",
    langLabel: "言語",
    defaultTimerLabel: "新しいメモの既定タイマー",
    defaultTimerHint: "最後に直した時刻から数えます。直すと数え直します。",
    noteTimerLabel: "このメモのタイマー",
    newNote: "新しいメモ",
    notePlaceholder: "ここに書いてください。保存ボタンはありません。",
    emptyTitle: "まだ空です",
    emptyBody:
      "ここに書けばそのまま残ります。保存ボタンもアカウントもありません。タブを閉じても残り、タイマーが切れると自動的に消えます。初期値は最後に直してから24時間です。",
    emptyCta: "最初のメモを書く",
    leftLabel: "残り",
    goneSoon: "まもなく消えます",
    expiringNow: "消しています",
    resetTimer: "タイマーやり直し",
    resetDone: "タイマーを数え直しました",
    deleteNote: "今すぐ捨てる",
    deleteConfirmTitle: "このメモを今すぐ捨てますか？",
    deleteConfirmBody: "元に戻せません。保管庫はありません。",
    cancel: "キャンセル",
    delete: "捨てる",
    autosave: "書くたび保存 · 保存ボタンなし",
    sweptOne: "期限切れのメモを1件消しました。",
    sweptN: "期限切れのメモを{n}件消しました。",
    padCount: "メモ {n} 件",
    editedAt: "最終更新",
    unitD: "日",
    unitH: "時間",
    unitM: "分",
    unitS: "秒",
    preset1h: "1時間",
    preset6h: "6時間",
    preset24h: "24時間",
    preset48h: "48時間",
    preset7d: "7日",
    privacy: "プライバシー",
    terms: "利用規約",
    howTitle: "消えるしくみ",
    howBody:
      "タイマーは最後に直した時刻から数え、直すたびに数え直します。期限切れのメモは、アプリを開いたときと開いている間に自動で消えます。保管庫はありません。",
  },
  zh: {
    title: "废纸便签",
    shortName: "废纸便签",
    tagline: "写下来会留下，时间到了就消失。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    metaDescription:
      "没有保存按钮的便签本。写下就留住，最后一次修改 24 小时后自动删除。计时可选 1 小时、6 小时、24 小时、48 小时或 7 天。无需账户，没有订阅，关掉标签页也还在。",
    about:
      "写下就已保存，没有保存按钮。每条便签在计时结束后自动删除，时间从你最后一次修改算起。默认 24 小时，每条便签也可以单独设置。没有账户，没有订阅，只留在这台设备上。",
    langLabel: "语言",
    defaultTimerLabel: "新便签的默认计时",
    defaultTimerHint: "从最后一次修改算起。修改后重新计时。",
    noteTimerLabel: "这条便签的计时",
    newNote: "新便签",
    notePlaceholder: "在这里写。没有保存按钮。",
    emptyTitle: "便签本是空的",
    emptyBody:
      "在这里写下就会留住 — 没有保存按钮，也不用账户。关掉标签页也还在，计时结束后自动删除。默认是最后一次修改后 24 小时。",
    emptyCta: "写第一条",
    leftLabel: "剩余",
    goneSoon: "快要消失",
    expiringNow: "正在删除",
    resetTimer: "重新计时",
    resetDone: "已重新计时",
    deleteNote: "立刻扔掉",
    deleteConfirmTitle: "现在就扔掉这条便签？",
    deleteConfirmBody: "无法撤销。没有归档。",
    cancel: "取消",
    delete: "扔掉",
    autosave: "边写边存 · 没有保存按钮",
    sweptOne: "已删除 1 条过期便签。",
    sweptN: "已删除 {n} 条过期便签。",
    padCount: "{n} 条便签",
    editedAt: "最后修改",
    unitD: "天",
    unitH: "小时",
    unitM: "分",
    unitS: "秒",
    preset1h: "1 小时",
    preset6h: "6 小时",
    preset24h: "24 小时",
    preset48h: "48 小时",
    preset7d: "7 天",
    privacy: "隐私",
    terms: "条款",
    howTitle: "怎么消失",
    howBody:
      "计时从最后一次修改算起，每次修改都会重新开始。过期的便签会在你打开应用时以及应用开着的时候自动删除。没有归档。",
  },
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as string[]).includes(value);
}

export function translate(
  lang: Lang,
  key: MsgKey,
  vars?: Record<string, string | number>,
): string {
  let out = I18N[lang]?.[key] ?? I18N.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value));
    }
  }
  return out;
}

function readCookieLang(): Lang | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/);
  return m && isLang(m[1]) ? m[1] : null;
}

function readStoredLang(): Lang | null {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return isLang(saved) ? saved : null;
  } catch {
    return null;
  }
}

function readNavigatorLang(): Lang {
  const nav = (navigator.language || "ko").toLowerCase();
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("en")) return "en";
  return "ko";
}

/**
 * ?lang= wins, then the td_lang cookie (so hops between try-dabble subdomains
 * keep the chosen language), then the language saved by this app, then the
 * browser. The Worker only sees the query and the cookie, so those two must
 * outrank localStorage or the first HTML and the mounted app would disagree.
 */
export function detectLang(searchLang?: string | null): Lang {
  if (isLang(searchLang)) {
    rememberLang(searchLang);
    return searchLang;
  }
  const cookie = readCookieLang();
  if (cookie) {
    rememberLang(cookie);
    return cookie;
  }
  return readStoredLang() ?? readNavigatorLang();
}

/** Saved locally AND written to the shared td_lang cookie, so the Worker can
 *  serve the same language in the first HTML on the next request. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — language just won't stick */
  }
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `td_lang=${lang}; Domain=.try-dabble.com; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  } catch {
    /* cookies blocked — ?lang= still works */
  }
}

export type Translate = (
  key: MsgKey,
  vars?: Record<string, string | number>,
) => string;
