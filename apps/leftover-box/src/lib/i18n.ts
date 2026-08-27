/** Ported from the pre-Vite public/js/i18n.js — same copy, now typed. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "leftover-box:lang";

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

export type MsgKey =
  | "title"
  | "localOnly"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "about"
  | "langLabel"
  | "addTitle"
  | "labelName"
  | "namePh"
  | "labelCooked"
  | "labelEatBy"
  | "labelLocation"
  | "locNone"
  | "locFridge"
  | "locFreezer"
  | "locOther"
  | "labelNote"
  | "notePh"
  | "save"
  | "update"
  | "cancel"
  | "delete"
  | "listOpen"
  | "listEaten"
  | "sortHintOpen"
  | "sortHintEaten"
  | "emptyOpen"
  | "emptyEaten"
  | "tools"
  | "exportJson"
  | "importJson"
  | "toolsHint"
  | "privacy"
  | "terms"
  | "edit"
  | "eaten"
  | "saved"
  | "deleted"
  | "exported"
  | "imported"
  | "importFail"
  | "needName"
  | "deleteConfirm"
  | "badgeToday"
  | "badgeOverdue"
  | "badgeDays"
  | "cookedLabel"
  | "eatenOn"
  | "locFridgeShort"
  | "locFreezerShort"
  | "locOtherShort";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  en: {
    title: "Leftover Box",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    shortName: "Leftovers",
    tagline: "Eat the oldest leftover first",
    metaDescription:
      "Log leftover dishes and eat-by dates. Eat the oldest first. Data stays on this device.",
    about:
      "FridgeBuddy, eggg, and pecco are inventory + login + AI recipe apps. This is just leftover names and eat-by dates. No account — everything stays in this browser.",
    langLabel: "Language",
    addTitle: "Add a leftover",
    labelName: "Dish name",
    namePh: "yesterday's stew",
    labelCooked: "Cooked on",
    labelEatBy: "Eat by",
    labelLocation: "Location (optional)",
    locNone: "Not set",
    locFridge: "Fridge",
    locFreezer: "Freezer",
    locOther: "Other",
    labelNote: "One-line note (optional)",
    notePh: "just reheat a little",
    save: "Save",
    update: "Update",
    cancel: "Cancel",
    delete: "Delete",
    listOpen: "Open leftovers",
    listEaten: "Eaten",
    sortHintOpen: "Soonest eat-by first",
    sortHintEaten: "Recently eaten first",
    emptyOpen: "Start with yesterday's stew",
    emptyEaten: "Nothing marked eaten yet.",
    tools: "Tools",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    toolsHint: "Take a JSON file when you change devices. Nothing is uploaded.",
    privacy: "Privacy",
    terms: "Terms",
    edit: "Edit",
    eaten: "Eaten",
    saved: "Saved",
    deleted: "Deleted",
    exported: "Exported",
    imported: "Imported",
    importFail: "Could not import that file.",
    needName: "A dish name is required.",
    deleteConfirm: "Delete this leftover permanently?",
    badgeToday: "today",
    badgeOverdue: "overdue",
    badgeDays: "D-{n}",
    cookedLabel: "cooked {d}",
    eatenOn: "eaten {d}",
    locFridgeShort: "fridge",
    locFreezerShort: "freezer",
    locOtherShort: "other",
  },
  ko: {
    title: "반찬함",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    shortName: "반찬함",
    tagline: "오래된 반찬부터 먹기",
    metaDescription:
      "남은 반찬 이름과 먹을 날짜만 적습니다. 오래된 것부터 먹습니다. 데이터는 이 기기에만 남습니다.",
    about:
      "FridgeBuddy·eggg·pecco는 재고·로그인·AI 레시피 앱입니다. 반찬함은 남은 음식 이름과 먹을 날짜만 적습니다. 계정 없이 이 브라우저에만 저장됩니다.",
    langLabel: "언어",
    addTitle: "반찬 넣기",
    labelName: "반찬 이름",
    namePh: "어제 찌개",
    labelCooked: "만든 날",
    labelEatBy: "먹을 날",
    labelLocation: "위치 (선택)",
    locNone: "선택 안 함",
    locFridge: "냉장고",
    locFreezer: "냉동실",
    locOther: "그 외",
    labelNote: "한 줄 메모 (선택)",
    notePh: "조금만 데우면 됨",
    save: "저장",
    update: "수정 완료",
    cancel: "취소",
    delete: "삭제",
    listOpen: "남은 반찬",
    listEaten: "먹음",
    sortHintOpen: "먹을 날이 가까운 것부터",
    sortHintEaten: "최근에 먹은 것부터",
    emptyOpen: "어제 찌개부터",
    emptyEaten: "먹은 기록이 없습니다.",
    tools: "도구",
    exportJson: "JSON보내기",
    importJson: "JSON가져오기",
    toolsHint: "기기를 옮길 때 JSON으로 가져가세요. 서버에는 올라가지 않습니다.",
    privacy: "개인정보",
    terms: "이용약관",
    edit: "수정",
    eaten: "먹음",
    saved: "저장됨",
    deleted: "삭제됨",
    exported: "내보냄",
    imported: "가져옴",
    importFail: "파일을 가져올 수 없습니다.",
    needName: "반찬 이름이 필요합니다.",
    deleteConfirm: "이 반찬을 완전히 삭제할까요?",
    badgeToday: "오늘",
    badgeOverdue: "지남",
    badgeDays: "D-{n}",
    cookedLabel: "만든 날 {d}",
    eatenOn: "먹은 날 {d}",
    locFridgeShort: "냉장고",
    locFreezerShort: "냉동실",
    locOtherShort: "그 외",
  },
  ja: {
    title: "残りもの箱",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    shortName: "残りもの",
    tagline: "古い残りものから食べる",
    metaDescription:
      "残りものの名前と食べる期限だけ残します。古いものから食べます。データはこの端末だけです。",
    about:
      "FridgeBuddy・eggg・peccoは在庫・ログイン・AIレシピアプリです。これは残りものの名前と期限だけ。アカウントなし、このブラウザだけです。",
    langLabel: "言語",
    addTitle: "残りものを入れる",
    labelName: "料理名",
    namePh: "昨日の鍋",
    labelCooked: "作った日",
    labelEatBy: "食べる日",
    labelLocation: "場所（任意）",
    locNone: "未設定",
    locFridge: "冷蔵庫",
    locFreezer: "冷凍庫",
    locOther: "その他",
    labelNote: "一行メモ（任意）",
    notePh: "少し温めればOK",
    save: "保存",
    update: "更新",
    cancel: "キャンセル",
    delete: "削除",
    listOpen: "残りもの",
    listEaten: "食べた",
    sortHintOpen: "期限が近い順",
    sortHintEaten: "最近食べた順",
    emptyOpen: "昨日の鍋から",
    emptyEaten: "食べた記録はまだありません。",
    tools: "ツール",
    exportJson: "JSON書き出し",
    importJson: "JSON読み込み",
    toolsHint:
      "端末を移すときはJSONを持っていってください。サーバーには上がりません。",
    privacy: "プライバシー",
    terms: "利用規約",
    edit: "編集",
    eaten: "食べた",
    saved: "保存しました",
    deleted: "削除しました",
    exported: "書き出しました",
    imported: "読み込みました",
    importFail: "そのファイルは読み込めません。",
    needName: "料理名が必要です。",
    deleteConfirm: "この残りものを完全に削除しますか？",
    badgeToday: "今日",
    badgeOverdue: "期限切れ",
    badgeDays: "D-{n}",
    cookedLabel: "作った日 {d}",
    eatenOn: "食べた日 {d}",
    locFridgeShort: "冷蔵庫",
    locFreezerShort: "冷凍庫",
    locOtherShort: "その他",
  },
  zh: {
    title: "剩菜盒",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    shortName: "剩菜盒",
    tagline: "先吃最早的剩菜",
    metaDescription: "记下剩菜名字和食用日期。先吃最早的。数据只留在此设备。",
    about:
      "FridgeBuddy、eggg、pecco 是库存+登录+AI食谱应用。这里只记剩菜名字和食用日期。无需账户，只存在此浏览器。",
    langLabel: "语言",
    addTitle: "添加剩菜",
    labelName: "菜名",
    namePh: "昨天的汤",
    labelCooked: "做的日期",
    labelEatBy: "吃完日期",
    labelLocation: "位置（可选）",
    locNone: "未设置",
    locFridge: "冰箱",
    locFreezer: "冷冻",
    locOther: "其他",
    labelNote: "一行备注（可选）",
    notePh: "稍微热一下就行",
    save: "保存",
    update: "更新",
    cancel: "取消",
    delete: "删除",
    listOpen: "未吃完",
    listEaten: "已吃",
    sortHintOpen: "食用日期最近的在前",
    sortHintEaten: "最近吃过的在前",
    emptyOpen: "从昨天的汤开始",
    emptyEaten: "还没有已吃记录。",
    tools: "工具",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    toolsHint: "换设备时带走 JSON。不会上传到服务器。",
    privacy: "隐私",
    terms: "条款",
    edit: "编辑",
    eaten: "已吃",
    saved: "已保存",
    deleted: "已删除",
    exported: "已导出",
    imported: "已导入",
    importFail: "无法导入该文件。",
    needName: "需要菜名。",
    deleteConfirm: "永久删除这道剩菜？",
    badgeToday: "今天",
    badgeOverdue: "过期",
    badgeDays: "D-{n}",
    cookedLabel: "做于 {d}",
    eatenOn: "吃于 {d}",
    locFridgeShort: "冰箱",
    locFreezerShort: "冷冻",
    locOtherShort: "其他",
  },
};

/** Same OG mapping as the Worker: zh reuses the English card. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://leftover-box.try-dabble.com/og-image.png",
  en: "https://leftover-box.try-dabble.com/og-image-en.png",
  ja: "https://leftover-box.try-dabble.com/og-image-ja.png",
  zh: "https://leftover-box.try-dabble.com/og-image-en.png",
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
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
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

export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — language just won't stick */
  }
}

export type Translate = (
  key: MsgKey,
  vars?: Record<string, string | number>,
) => string;
