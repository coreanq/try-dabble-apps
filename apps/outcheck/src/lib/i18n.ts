/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "outcheck:lang";

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

/** Locale used for the "Checked 7:42 AM" clock. */
export const TIME_LOCALE: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "defaultDoor"
  | "defaultGas"
  | "defaultGarage"
  | "todayTitle"
  | "resetsAtMidnight"
  | "checkedAt"
  | "notYet"
  | "tapToCheck"
  | "tapToUncheck"
  | "progress"
  | "allClearTitle"
  | "allClearSub"
  | "emptyTitle"
  | "emptyHint"
  | "addItem"
  | "addTitle"
  | "labelLabel"
  | "labelPlaceholder"
  | "add"
  | "cancel"
  | "save"
  | "close"
  | "editItem"
  | "editTitle"
  | "rename"
  | "moveUp"
  | "moveDown"
  | "remove"
  | "removeConfirm"
  | "chipNoLogin"
  | "chipNoAds"
  | "chipNoIap"
  | "chipOneTap"
  | "chipMidnight"
  | "chipVibrate"
  | "chipDefaults"
  | "chipLocal"
  | "about"
  | "toastAdded"
  | "toastRenamed"
  | "toastRemoved"
  | "toastNewDay"
  | "privacy"
  | "terms";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "나갔어체크",
    shortName: "나갔어체크",
    tagline: "문·가스·차고를 원탭으로 확인하고 자정에 리셋. 계정·광고 없음.",
    metaDescription:
      "외출 전 문·가스·차고 확인 체크리스트. 한 번 누르면 오늘 확인한 시각이 남고, 자정에 모두 리셋됩니다. 계정 없음, 광고 없음, 항목 무제한, 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    defaultDoor: "문 잠금",
    defaultGas: "가스 잠금",
    defaultGarage: "차고 닫힘",
    todayTitle: "오늘 나가기 전",
    resetsAtMidnight: "자정에 리셋",
    checkedAt: "{time} 확인",
    notYet: "아직",
    tapToCheck: "눌러서 확인",
    tapToUncheck: "다시 누르면 취소",
    progress: "{done} / {total} 확인",
    allClearTitle: "전부 확인했어요",
    allClearSub: "잘 다녀오세요. 자정에 다시 비워집니다.",
    emptyTitle: "항목이 없습니다",
    emptyHint: "아래 ‘항목 추가’로 확인할 것을 넣으세요. 개수 제한은 없습니다.",
    addItem: "항목 추가",
    addTitle: "확인할 것 추가",
    labelLabel: "이름",
    labelPlaceholder: "예: 창문 닫힘",
    add: "추가",
    cancel: "취소",
    save: "저장",
    close: "닫기",
    editItem: "편집",
    editTitle: "항목 편집",
    rename: "이름 바꾸기",
    moveUp: "위로",
    moveDown: "아래로",
    remove: "삭제",
    removeConfirm: "이 항목을 목록에서 뺄까요?",
    chipNoLogin: "로그인 없음",
    chipNoAds: "광고 없음",
    chipNoIap: "IAP/캡 없음",
    chipOneTap: "원탭 확인 + 시각 표시",
    chipMidnight: "자정 리셋",
    chipVibrate: "진동(지원 기기)",
    chipDefaults: "문/가스/차고 기본 + 커스텀 무제한",
    chipLocal: "데이터 이 기기만",
    about:
      "나가기 전에 한 줄씩 누릅니다. 누르면 지금 시각이 남고, 다시 누르면 지워집니다. 어제 확인은 자정에 사라져 오늘 것과 섞이지 않습니다.",
    toastAdded: "추가했습니다",
    toastRenamed: "이름을 바꿨습니다",
    toastRemoved: "뺐습니다",
    toastNewDay: "새 날입니다. 확인이 비워졌습니다.",
    privacy: "개인정보",
    terms: "이용약관",
  },
  en: {
    title: "Outcheck",
    shortName: "Outcheck",
    tagline: "One-tap door, gas, and garage checks that reset at midnight. No account, no ads.",
    metaDescription:
      "A leave-home checklist for door, gas and garage. One tap stamps today's time on an item, and everything clears at midnight. No account, no ads, unlimited items, data on this device only.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    defaultDoor: "Door locked",
    defaultGas: "Gas off",
    defaultGarage: "Garage closed",
    todayTitle: "Before you leave today",
    resetsAtMidnight: "Resets at midnight",
    checkedAt: "Checked {time}",
    notYet: "Not yet",
    tapToCheck: "Tap to check",
    tapToUncheck: "Tap again to uncheck",
    progress: "{done} / {total} checked",
    allClearTitle: "All clear",
    allClearSub: "Everything is checked for today. It clears again at midnight.",
    emptyTitle: "No items",
    emptyHint: "Use “Add item” below to add what you check. There is no limit.",
    addItem: "Add item",
    addTitle: "Add something to check",
    labelLabel: "Name",
    labelPlaceholder: "e.g. Windows closed",
    add: "Add",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    editItem: "Edit",
    editTitle: "Edit item",
    rename: "Rename",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    removeConfirm: "Remove this item from the list?",
    chipNoLogin: "No login",
    chipNoAds: "No ads",
    chipNoIap: "No IAP, no cap",
    chipOneTap: "One-tap confirm + time shown",
    chipMidnight: "Midnight reset",
    chipVibrate: "Vibrates on supported devices",
    chipDefaults: "Door/gas/garage defaults + unlimited custom",
    chipLocal: "Data on this device only",
    about:
      "Tap each row on your way out. A tap stamps the time; a second tap clears it. Yesterday's checks vanish at midnight, so they never blur into today.",
    toastAdded: "Added",
    toastRenamed: "Renamed",
    toastRemoved: "Removed",
    toastNewDay: "New day. Checks cleared.",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "外出チェック",
    shortName: "外出チェック",
    tagline: "ドア・ガス・ガレージをワンタップ。毎日0時にリセット。アカウントも広告もなし。",
    metaDescription:
      "外出前のドア・ガス・ガレージ確認リスト。1回タップで今日の確認時刻が残り、0時にすべてリセットされます。アカウントなし、広告なし、項目は無制限、データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    defaultDoor: "ドア施錠",
    defaultGas: "ガスオフ",
    defaultGarage: "ガレージ閉鎖",
    todayTitle: "今日出かける前に",
    resetsAtMidnight: "0時にリセット",
    checkedAt: "{time} 確認",
    notYet: "まだ",
    tapToCheck: "タップで確認",
    tapToUncheck: "もう一度タップで取り消し",
    progress: "{done} / {total} 確認済み",
    allClearTitle: "すべて確認済み",
    allClearSub: "いってらっしゃい。0時にまた空になります。",
    emptyTitle: "項目がありません",
    emptyHint: "下の「項目を追加」で確認するものを入れてください。数に制限はありません。",
    addItem: "項目を追加",
    addTitle: "確認するものを追加",
    labelLabel: "名前",
    labelPlaceholder: "例: 窓を閉めた",
    add: "追加",
    cancel: "キャンセル",
    save: "保存",
    close: "閉じる",
    editItem: "編集",
    editTitle: "項目を編集",
    rename: "名前を変える",
    moveUp: "上へ",
    moveDown: "下へ",
    remove: "削除",
    removeConfirm: "この項目をリストから外しますか？",
    chipNoLogin: "ログインなし",
    chipNoAds: "広告なし",
    chipNoIap: "IAP・上限なし",
    chipOneTap: "ワンタップ確認＋時刻表示",
    chipMidnight: "0時にリセット",
    chipVibrate: "振動（対応端末）",
    chipDefaults: "ドア/ガス/ガレージ標準＋カスタム無制限",
    chipLocal: "データはこの端末だけ",
    about:
      "出かける前に1行ずつタップします。タップで時刻が残り、もう一度タップで消えます。昨日の確認は0時に消えるので、今日のものと混ざりません。",
    toastAdded: "追加しました",
    toastRenamed: "名前を変えました",
    toastRemoved: "外しました",
    toastNewDay: "新しい日です。確認を空にしました。",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    title: "出门核对",
    shortName: "出门核对",
    tagline: "一键确认门锁、燃气、车库，每天零点清零。无账号，无广告。",
    metaDescription:
      "出门前的门锁、燃气、车库核对清单。点一下就记下今天的确认时间，零点全部清零。无账号，无广告，条目不限，数据仅在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    defaultDoor: "门锁好",
    defaultGas: "燃气关好",
    defaultGarage: "车库关好",
    todayTitle: "今天出门前",
    resetsAtMidnight: "零点清零",
    checkedAt: "{time} 已确认",
    notYet: "还没",
    tapToCheck: "点一下确认",
    tapToUncheck: "再点一下取消",
    progress: "已确认 {done} / {total}",
    allClearTitle: "全部确认",
    allClearSub: "放心出门。零点会再次清空。",
    emptyTitle: "没有条目",
    emptyHint: "用下面的“添加条目”加入要确认的事项，数量不限。",
    addItem: "添加条目",
    addTitle: "添加要确认的事项",
    labelLabel: "名称",
    labelPlaceholder: "例如：窗户关好",
    add: "添加",
    cancel: "取消",
    save: "保存",
    close: "关闭",
    editItem: "编辑",
    editTitle: "编辑条目",
    rename: "改名",
    moveUp: "上移",
    moveDown: "下移",
    remove: "删除",
    removeConfirm: "把这一条从清单里删除？",
    chipNoLogin: "无需登录",
    chipNoAds: "无广告",
    chipNoIap: "无内购、无上限",
    chipOneTap: "一键确认＋显示时间",
    chipMidnight: "零点清零",
    chipVibrate: "振动（支持的设备）",
    chipDefaults: "门/燃气/车库默认＋自定义不限",
    chipLocal: "数据仅在此设备",
    about:
      "出门前逐行点一下。点一下记下时间，再点一下清除。昨天的确认在零点消失，不会和今天的混在一起。",
    toastAdded: "已添加",
    toastRenamed: "已改名",
    toastRemoved: "已删除",
    toastNewDay: "新的一天，确认已清空。",
    privacy: "隐私",
    terms: "条款",
  },
};

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://outcheck.try-dabble.com/og-image-ko.png",
  en: "https://outcheck.try-dabble.com/og-image-en.png",
  ja: "https://outcheck.try-dabble.com/og-image-ja.png",
  zh: "https://outcheck.try-dabble.com/og-image-zh.png",
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

export type Translate = (
  key: MsgKey,
  vars?: Record<string, string | number>,
) => string;
