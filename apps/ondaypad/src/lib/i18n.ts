/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "ondaypad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://ondaypad.try-dabble.com/og-image-ko.png",
  en: "https://ondaypad.try-dabble.com/og-image-en.png",
  ja: "https://ondaypad.try-dabble.com/og-image-ja.png",
  zh: "https://ondaypad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoAccount"
  | "chipNoCloud"
  | "chipBackup"
  | "chipNoAds"
  | "chipLocal"
  | "chipFree"
  | "chipLangs"
  | "howTitle"
  | "howBody"
  | "calendarTitle"
  | "tabDay"
  | "tabStack"
  | "prevMonthAria"
  | "nextMonthAria"
  | "prevYearAria"
  | "nextYearAria"
  | "todayBtn"
  | "jumpMonthAria"
  | "dayNotesTitle"
  | "noNotesForDay"
  | "addNote"
  | "newNoteTitle"
  | "editNoteTitle"
  | "noteTitleLabel"
  | "noteTitlePlaceholder"
  | "noteBodyLabel"
  | "noteBodyPlaceholder"
  | "save"
  | "cancel"
  | "create"
  | "edit"
  | "deleteNote"
  | "deleteNoteTitle"
  | "deleteNoteBody"
  | "needBody"
  | "savedToast"
  | "deletedToast"
  | "stackTitle"
  | "stackHint"
  | "stackOrderLabel"
  | "orderNewest"
  | "orderOldest"
  | "noStackNotes"
  | "jumpToYear"
  | "backupTitle"
  | "backupHint"
  | "exportJson"
  | "importJson"
  | "clearAllBtn"
  | "exported"
  | "importBad"
  | "importOk"
  | "importConfirmTitle"
  | "importConfirmBody"
  | "clearAllTitle"
  | "clearAllBody"
  | "cleared"
  | "privacy"
  | "terms"
  | "guide"
  | "promiseTitle";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "온데이패드",
    shortName: "온데이패드",
    tagline: "무료 로컬 향수 캘린더. 월 그리드, 날짜별 메모, 같은 MM-DD의 여러 해 메모를 쌓아 보기. JSON 백업. 계정 없음. 광고 없음.",
    metaDescription:
      "로그인도 광고도 없는 무료 로컬 향수 캘린더입니다. 원하는 달을 열어 날짜를 고르고 메모를 남기세요 — 그날의 기억, 못 찍은 사진 대신 남기는 한 줄, 날씨 이야기도 좋습니다. MM-DD(월-일)를 고르면 온데이패드가 그 날짜에 쓴 모든 해의 메모를 연도별 카드로 쌓아 보여줘서, \"9월 15일에 무슨 일이 있었지\"라는 질문에 짐작이 아니라 진짜 답을 줍니다. 내장된 날짜 이동으로 아무 달, 아무 해나 자유롭게 넘나들고, 하루에 메모를 여러 개 남길 수 있고, JSON으로 모두 내보내 두면 폰을 잃어버려도 기억은 사라지지 않습니다 — 어느 기기에서든 순서 상관없이 다시 불러올 수 있습니다. 안드로이드와 모든 브라우저에서 설치해 오프라인으로 쓸 수 있는 PWA입니다. 계정 없음, 광고 없음, 구독 없음. 데이터는 이 기기에만 남습니다.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. JSON으로 백업하세요.",
    langLabel: "언어",
    chipNoAccount: "계정 없음",
    chipNoCloud: "강제 클라우드 없음",
    chipBackup: "JSON 백업",
    chipNoAds: "도구에 광고 없음",
    chipLocal: "이 기기에만 저장",
    chipFree: "영원히 무료",
    chipLangs: "ko/en/ja/zh",
    howTitle: "하루를 고르고, 몇 년 뒤에 다시 와 보세요",
    howBody: "달력에서 날짜를 눌러 그날 있었던 일을 적으세요. 나중에 같은 월-일을 고르면 온데이패드가 그동안 쓴 모든 해의 메모를 나란히 보여줍니다.",
    calendarTitle: "캘린더",
    tabDay: "이 날",
    tabStack: "여러 해",
    prevMonthAria: "이전 달",
    nextMonthAria: "다음 달",
    prevYearAria: "이전 해",
    nextYearAria: "다음 해",
    todayBtn: "오늘",
    jumpMonthAria: "월 이동",
    dayNotesTitle: "{date}의 메모",
    noNotesForDay: "아직 이 날짜에 남긴 메모가 없습니다.",
    addNote: "메모 추가",
    newNoteTitle: "새 메모",
    editNoteTitle: "메모 수정",
    noteTitleLabel: "제목 (선택)",
    noteTitlePlaceholder: "예: 한 줄 제목",
    noteBodyLabel: "있었던 일",
    noteBodyPlaceholder: "무엇이든 적어보세요 — 기억, 사진 설명, 날씨…",
    save: "저장",
    cancel: "취소",
    create: "추가",
    edit: "수정",
    deleteNote: "삭제",
    deleteNoteTitle: "이 메모를 삭제할까요?",
    deleteNoteBody: "이 메모가 이 기기에서 지워집니다. 되돌릴 수 없습니다.",
    needBody: "저장하기 전에 내용을 적어 주세요.",
    savedToast: "저장했습니다",
    deletedToast: "삭제했습니다",
    stackTitle: "이 날의 여러 해 기록",
    stackHint: "{mmdd}에 남긴 모든 해의 메모를 연도별 카드로 보여줍니다.",
    stackOrderLabel: "정렬",
    orderNewest: "최신순",
    orderOldest: "오래된순",
    noStackNotes: "아직 이 월-일에 남긴 메모가 없습니다.",
    jumpToYear: "{year}년 열기",
    backupTitle: "백업",
    backupHint: "JSON으로 내보내면 재설치하거나 다른 기기에서도 메모를 되살릴 수 있습니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 불러오기",
    clearAllBtn: "모두 삭제",
    exported: "JSON을 내보냈습니다",
    importBad: "파일을 읽을 수 없습니다",
    importOk: "{n}개 메모를 불러왔습니다",
    importConfirmTitle: "JSON을 불러올까요?",
    importConfirmBody: "이 기기의 메모가 파일의 {n}개로 바뀝니다.",
    clearAllTitle: "모두 삭제할까요?",
    clearAllBody: "모든 메모가 이 기기에서 지워집니다. 남기려면 먼저 JSON으로 내보내세요.",
    cleared: "모두 삭제했습니다",
    privacy: "개인정보",
    terms: "약관",
    guide: "가이드",
    promiseTitle: "약속",
  },
  en: {
    title: "Ondaypad",
    shortName: "Ondaypad",
    tagline: "Free local nostalgia calendar. Month grid, notes per day, and a \"this day across years\" stack for any MM-DD. JSON backup. No account. No ads.",
    metaDescription:
      "A free local nostalgia calendar app with no login and no ads. Open any month, click a day and write a note — a memory, a photo caption you didn't take, a line about the weather. Pick a MM-DD and Ondaypad stacks every note you've ever written for that calendar day, one card per year, so \"what happened on September 15th\" turns into an answer instead of a guess. Browse any month or year with the built-in date jump, keep several notes per day, and export everything to JSON so a lost phone is never the end of your memories — import it back on any device, in any order. Works offline as an installable PWA on Android and any browser. No account, no ads, no subscription. Data stays on this device.",
    localOnly: "Your data stays on this device. No login. No ads. Export JSON so a lost phone is not the end.",
    langLabel: "Language",
    chipNoAccount: "No account",
    chipNoCloud: "No forced cloud",
    chipBackup: "JSON backup",
    chipNoAds: "No ads on tool",
    chipLocal: "Stays on this device",
    chipFree: "Free forever",
    chipLangs: "ko/en/ja/zh",
    howTitle: "Pick a day, come back years later",
    howBody: "Tap any day on the calendar and write what happened. Later, pick that same month and day and Ondaypad lines up every year you wrote something, side by side.",
    calendarTitle: "Calendar",
    tabDay: "This day",
    tabStack: "Across years",
    prevMonthAria: "Previous month",
    nextMonthAria: "Next month",
    prevYearAria: "Previous year",
    nextYearAria: "Next year",
    todayBtn: "Today",
    jumpMonthAria: "Jump to month",
    dayNotesTitle: "Notes for {date}",
    noNotesForDay: "No notes for this day yet.",
    addNote: "Add a note",
    newNoteTitle: "New note",
    editNoteTitle: "Edit note",
    noteTitleLabel: "Title (optional)",
    noteTitlePlaceholder: "e.g. a short title",
    noteBodyLabel: "What happened",
    noteBodyPlaceholder: "Write anything — a memory, a photo caption, the weather…",
    save: "Save",
    cancel: "Cancel",
    create: "Add",
    edit: "Edit",
    deleteNote: "Delete",
    deleteNoteTitle: "Delete this note?",
    deleteNoteBody: "This note is removed from this device. This cannot be undone.",
    needBody: "Write something before saving.",
    savedToast: "Saved",
    deletedToast: "Deleted",
    stackTitle: "This day across years",
    stackHint: "Every note ever written for {mmdd}, one card per year.",
    stackOrderLabel: "Order",
    orderNewest: "Newest first",
    orderOldest: "Oldest first",
    noStackNotes: "No notes yet for this month and day.",
    jumpToYear: "Open {year}",
    backupTitle: "Backup",
    backupHint: "Export a JSON file to bring your notes back after a reinstall or on another device.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    clearAllBtn: "Delete everything",
    exported: "JSON exported",
    importBad: "Could not read that file",
    importOk: "{n} notes imported",
    importConfirmTitle: "Import this JSON?",
    importConfirmBody: "The notes on this device are replaced by the {n} in the file.",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Every note is removed from this device. Export a JSON first if you want to keep them.",
    cleared: "Everything deleted",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    promiseTitle: "Promises",
  },
  ja: {
    title: "オンデイパッド",
    shortName: "オンデイパッド",
    tagline: "無料のローカル懐かしさカレンダー。月グリッド、日付メモ、同じMM-DDの年ごとのメモを積み重ね表示。JSONバックアップ。アカウント不要。広告なし。",
    metaDescription:
      "ログインも広告もない、無料のローカル懐かしさカレンダーです。好きな月を開いて日付を選び、メモを残しましょう——その日の思い出、撮れなかった写真の代わりの一行、天気の話でもかまいません。MM-DD（月日）を選ぶと、オンデイパッドはその日付に書いたすべての年のメモを年ごとのカードに積み重ねて見せてくれるので、「9月15日に何があったっけ」という問いに推測ではなく本当の答えが返ってきます。内蔵の日付ジャンプで好きな月・好きな年へ自由に移動でき、一日に複数のメモを残すことができ、JSONにすべて書き出しておけば、スマホをなくしても思い出は消えません——どの端末でも順序に関係なく読み込み直せます。Androidとあらゆるブラウザでインストールしてオフラインで使えるPWAです。アカウント不要、広告なし、サブスクなし。データはこの端末だけに残ります。",
    localOnly: "データはこの端末にだけ保存されます。ログイン・広告なし。JSONでバックアップしてください。",
    langLabel: "言語",
    chipNoAccount: "アカウント不要",
    chipNoCloud: "強制クラウドなし",
    chipBackup: "JSONバックアップ",
    chipNoAds: "ツールに広告なし",
    chipLocal: "この端末にだけ保存",
    chipFree: "ずっと無料",
    chipLangs: "ko/en/ja/zh",
    howTitle: "その日を選んで、何年か後にまた来てみて",
    howBody: "カレンダーで日付をタップして、その日にあったことを書きましょう。あとで同じ月日を選べば、オンデイパッドがこれまで書いたすべての年のメモを並べて見せてくれます。",
    calendarTitle: "カレンダー",
    tabDay: "この日",
    tabStack: "年ごと",
    prevMonthAria: "前の月",
    nextMonthAria: "次の月",
    prevYearAria: "前の年",
    nextYearAria: "次の年",
    todayBtn: "今日",
    jumpMonthAria: "月に移動",
    dayNotesTitle: "{date}のメモ",
    noNotesForDay: "この日のメモはまだありません。",
    addNote: "メモを追加",
    newNoteTitle: "新しいメモ",
    editNoteTitle: "メモを編集",
    noteTitleLabel: "タイトル（任意）",
    noteTitlePlaceholder: "例：短いタイトル",
    noteBodyLabel: "あったこと",
    noteBodyPlaceholder: "何でも書いてみましょう——思い出、写真の説明、天気…",
    save: "保存",
    cancel: "キャンセル",
    create: "追加",
    edit: "編集",
    deleteNote: "削除",
    deleteNoteTitle: "このメモを削除しますか？",
    deleteNoteBody: "このメモはこの端末から削除されます。元に戻せません。",
    needBody: "保存する前に何か書いてください。",
    savedToast: "保存しました",
    deletedToast: "削除しました",
    stackTitle: "この日の積み重ね（年ごと）",
    stackHint: "{mmdd}に書いたすべての年のメモを、年ごとのカードで表示します。",
    stackOrderLabel: "並び順",
    orderNewest: "新しい順",
    orderOldest: "古い順",
    noStackNotes: "この月日のメモはまだありません。",
    jumpToYear: "{year}年を開く",
    backupTitle: "バックアップ",
    backupHint: "JSONにエクスポートしておくと、再インストールや別の端末でもメモを復元できます。",
    exportJson: "JSONをエクスポート",
    importJson: "JSONをインポート",
    clearAllBtn: "すべて削除",
    exported: "JSONをエクスポートしました",
    importBad: "ファイルを読めませんでした",
    importOk: "{n}件のメモをインポートしました",
    importConfirmTitle: "このJSONをインポートしますか？",
    importConfirmBody: "この端末のメモはファイルの{n}件に置き換わります。",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "すべてのメモがこの端末から削除されます。残したい場合は先にJSONをエクスポートしてください。",
    cleared: "すべて削除しました",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    promiseTitle: "約束",
  },
  zh: {
    title: "当日记事板",
    shortName: "当日记事板",
    tagline: "免费本地怀旧日历。月网格、每日笔记，以及任意 MM-DD 的跨年笔记堆叠。JSON 备份。无需账号。无广告。",
    metaDescription:
      "无登录、无广告的免费本地怀旧日历。打开任意一个月，点选日期写下笔记——那天的回忆，一张没拍成的照片的说明，或者只是聊聊天气。选定一个 MM-DD（月-日），当日记事板就会把你在这个日期写过的所有年份的笔记按年份卡片堆叠展示，让“9 月 15 日那天发生了什么”不再是猜测，而是有据可查的答案。内置的日期跳转能让你自由穿梭任意月份和年份，一天可以写多条笔记，导出成 JSON 备份后，丢手机也不会丢掉回忆——在任何设备上都能按原样导回。支持在 Android 和任意浏览器上安装成离线可用的 PWA。无需账号、无广告、无订阅。数据只留在这台设备上。",
    localOnly: "数据仅保存在此设备。无登录、无广告。请用 JSON 备份，以免丢手机丢数据。",
    langLabel: "语言",
    chipNoAccount: "无需账号",
    chipNoCloud: "无强制云同步",
    chipBackup: "JSON 备份",
    chipNoAds: "工具内无广告",
    chipLocal: "仅存于此设备",
    chipFree: "永久免费",
    chipLangs: "ko/en/ja/zh",
    howTitle: "选一天，写下来，多年后再回来看看",
    howBody: "在日历上点一个日期，写下当天发生的事。以后选同一个月-日，当日记事板会把你这些年写过的笔记并排展示给你。",
    calendarTitle: "日历",
    tabDay: "这一天",
    tabStack: "跨年",
    prevMonthAria: "上个月",
    nextMonthAria: "下个月",
    prevYearAria: "上一年",
    nextYearAria: "下一年",
    todayBtn: "今天",
    jumpMonthAria: "跳转到月份",
    dayNotesTitle: "{date}的笔记",
    noNotesForDay: "这一天还没有笔记。",
    addNote: "添加笔记",
    newNoteTitle: "新建笔记",
    editNoteTitle: "编辑笔记",
    noteTitleLabel: "标题（可选）",
    noteTitlePlaceholder: "例如：一句话标题",
    noteBodyLabel: "发生的事",
    noteBodyPlaceholder: "写点什么——回忆、照片说明、天气……",
    save: "保存",
    cancel: "取消",
    create: "添加",
    edit: "编辑",
    deleteNote: "删除",
    deleteNoteTitle: "删除这条笔记？",
    deleteNoteBody: "这条笔记将从此设备移除，无法撤销。",
    needBody: "保存前请先写点内容。",
    savedToast: "已保存",
    deletedToast: "已删除",
    stackTitle: "这一天，跨年堆叠",
    stackHint: "把在 {mmdd} 写过的所有年份笔记按年份卡片展示。",
    stackOrderLabel: "排序",
    orderNewest: "最新优先",
    orderOldest: "最早优先",
    noStackNotes: "这个月-日还没有笔记。",
    jumpToYear: "打开 {year} 年",
    backupTitle: "备份",
    backupHint: "导出 JSON 文件，重装或换设备后可以恢复笔记。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    clearAllBtn: "全部删除",
    exported: "已导出 JSON",
    importBad: "无法读取该文件",
    importOk: "已导入 {n} 条笔记",
    importConfirmTitle: "导入此 JSON？",
    importConfirmBody: "此设备上的笔记将被文件中的 {n} 条替换。",
    clearAllTitle: "全部删除？",
    clearAllBody: "所有笔记将从此设备移除。想保留请先导出 JSON。",
    cleared: "已全部删除",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
    promiseTitle: "承诺",
  },
};

export function isLang(v: unknown): v is Lang {
  return v === "ko" || v === "en" || v === "ja" || v === "zh";
}

export function translate(lang: Lang, key: MsgKey, vars?: Record<string, string | number>): string {
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
 * outrank local storage or the first HTML and the mounted app would disagree.
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

/** Saves locally AND writes the shared cookie, so the next try-dabble app
 *  opens in the same language without a ?lang= on the link. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — the language just will not stick */
  }
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `td_lang=${lang}; Domain=.try-dabble.com; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  } catch {
    /* file:// or a blocked cookie jar — local storage still carries it */
  }
}

export type Translate = (key: MsgKey, vars?: Record<string, string | number>) => string;
