/** Every visible string in ko/en/ja/zh. Same shape as the sibling apps. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "storelog:lang";

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
  ko: "https://storelog.try-dabble.com/og-image.png",
  en: "https://storelog.try-dabble.com/og-image-en.png",
  ja: "https://storelog.try-dabble.com/og-image-ja.png",
  zh: "https://storelog.try-dabble.com/og-image-zh.png",
};

/** Collation locale, so A–Z means 가나다 in ko and あいうえお in ja. */
export const SORT_LOCALE: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-Hans-CN",
};

export type MsgKey =
  | "title"
  | "tagline"
  | "localOnly"
  | "metaDescription"
  | "about"
  | "langLabel"
  | "chipNoLogin"
  | "chipNoLock"
  | "chipNoSheet"
  | "chipExport"
  | "chipPersist"
  | "addTitle"
  | "addHint"
  | "nameLabel"
  | "namePlaceholder"
  | "nameRequired"
  | "numberLabel"
  | "numberPlaceholder"
  | "notesLabel"
  | "notesPlaceholder"
  | "optional"
  | "addButton"
  | "storeAdded"
  | "listTitle"
  | "storeCount"
  | "sortNote"
  | "searchLabel"
  | "searchPlaceholder"
  | "clearSearch"
  | "searchEmpty"
  | "searchCount"
  | "emptyTitle"
  | "emptyBody"
  | "emptyBody2"
  | "noNumber"
  | "numberTag"
  | "notesTag"
  | "openEdit"
  | "closeEdit"
  | "editTitle"
  | "save"
  | "saved"
  | "deleteStore"
  | "deleteConfirmTitle"
  | "deleteConfirmBody"
  | "cancel"
  | "delete"
  | "storeDeleted"
  | "callStore"
  | "exportTitle"
  | "exportBody"
  | "exportJson"
  | "exportCsv"
  | "exportDone"
  | "exportEmpty"
  | "promiseTitle"
  | "promiseLogin"
  | "promiseLock"
  | "promiseSheet"
  | "promiseSort"
  | "promisePersist"
  | "promiseExport"
  | "howTitle"
  | "howBody"
  | "privacy"
  | "terms";

const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "가게록",
    tagline: "가게 이름, 매장 번호, 메모. 가나다순. 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    metaDescription:
      "가게 이름과 매장 번호, 그리고 짧은 메모만 적어 두는 휴대폰용 가게 명단. 스프레드시트를 열 필요가 없고, 가나다순으로 저절로 정렬되며, 이름·번호·메모를 한 칸으로 검색합니다. 로그인도 100건 잠금도 유료 잠금도 없고, 탭을 닫아도 그대로 남습니다. JSON과 CSV로 내보낼 수 있습니다.",
    about:
      "스프레드시트가 아닙니다. 칸도 수식도 시트 탭도 없습니다. 가게 이름 한 줄, 매장 번호 한 줄, 메모 한 칸이 전부입니다.",
    langLabel: "언어",
    chipNoLogin: "로그인 없음",
    chipNoLock: "100건 잠금 없음",
    chipNoSheet: "스프레드시트 없음",
    chipExport: "JSON·CSV 내보내기",
    chipPersist: "탭을 닫아도 남음",
    addTitle: "가게 추가",
    addHint: "가게 이름만 필수입니다. 번호와 메모는 비워 둬도 됩니다.",
    nameLabel: "가게 이름",
    namePlaceholder: "예: 성수 철물점",
    nameRequired: "가게 이름을 적어 주세요.",
    numberLabel: "매장 번호 / 전화",
    numberPlaceholder: "예: 1023 또는 02-1234-5678",
    notesLabel: "메모",
    notesPlaceholder: "예: 뒷문 하역, 점장 김씨, 월요일 휴무",
    optional: "선택",
    addButton: "목록에 넣기",
    storeAdded: "{name} — 목록에 넣었습니다.",
    listTitle: "가게 목록",
    storeCount: "모두 {n}곳",
    sortNote: "이름 가나다순으로 저절로 정렬됩니다. 정렬 버튼은 없습니다.",
    searchLabel: "이름·번호·메모 검색",
    searchPlaceholder: "이름, 번호, 메모로 찾기",
    clearSearch: "지우기",
    searchEmpty: "\"{q}\"와 맞는 가게가 없습니다.",
    searchCount: "{n}곳 찾음",
    emptyTitle: "아직 넣은 가게가 없습니다",
    emptyBody:
      "가게 이름을 적고, 아는 사람만 아는 매장 번호를 적고, 기억해야 할 말을 메모에 적으세요. 목록은 가나다순으로 저절로 줄을 서고, 나중에 이름이든 번호든 메모든 한 칸에 쳐서 찾으면 됩니다.",
    emptyBody2:
      "스프레드시트를 열 필요가 없습니다. 로그인도, 100건 제한도, 유료 잠금도 없습니다. 적는 즉시 이 기기에 저장되고, 탭을 닫아도 그대로 있습니다.",
    noNumber: "번호 없음",
    numberTag: "매장 번호",
    notesTag: "메모",
    openEdit: "펼쳐서 고치기",
    closeEdit: "접기",
    editTitle: "고치기",
    save: "저장",
    saved: "고쳤습니다.",
    deleteStore: "목록에서 빼기",
    deleteConfirmTitle: "{name}을(를) 뺄까요?",
    deleteConfirmBody: "이 기기에서 이 가게의 기록이 지워집니다. 되돌릴 수 없습니다.",
    cancel: "그대로 두기",
    delete: "빼기",
    storeDeleted: "목록에서 뺐습니다.",
    callStore: "전화 걸기",
    exportTitle: "내보내기",
    exportBody:
      "목록 전체를 파일 하나로 내려받습니다. CSV는 엑셀이나 구글 시트에서 바로 열리고, JSON은 그대로 옮겨 담기 좋습니다. 어느 쪽도 서버를 거치지 않습니다.",
    exportJson: "JSON 내보내기",
    exportCsv: "CSV 내보내기",
    exportDone: "{file} 내려받았습니다.",
    exportEmpty: "내보낼 가게가 아직 없습니다.",
    promiseTitle: "약속",
    promiseLogin: "로그인도 회원가입도 없습니다. 열면 바로 첫 가게를 넣습니다.",
    promiseLock: "100건 잠금도, 유료 카탈로그 잠금도 없습니다. 몇 곳이든 넣으세요.",
    promiseSheet: "스프레드시트가 아닙니다. 칸도, 수식도, 손가락으로 옮기는 열 너비도 없습니다.",
    promiseSort: "정렬 버튼이 없습니다. 넣는 순간 이름 가나다순으로 제자리를 찾습니다.",
    promisePersist: "탭을 닫아도, 브라우저를 닫아도 그대로 있습니다. 시간이 지나 지워지지 않습니다.",
    promiseExport: "JSON과 CSV로 언제든 내보냅니다. 가둬 두지 않습니다.",
    howTitle: "어디에 저장되나요",
    howBody:
      "가게 이름, 번호, 메모는 모두 이 기기의 브라우저에만 저장됩니다. 계정도 서버도 동기화도 없습니다. 직접 빼거나, 브라우저의 사이트 데이터를 지우거나, 기기를 바꿀 때만 사라집니다. 오래 남기고 싶다면 CSV나 JSON으로 내보내 두세요.",
    privacy: "개인정보",
    terms: "약관",
  },
  en: {
    title: "Storelog",
    tagline: "Store name, store number, notes. A–Z. On this device only.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    metaDescription:
      "A phone-first store directory: store name, store number and a short note. No spreadsheet to open, sorted A–Z by itself, and one search box across name, number and notes. No login, no 100-record lock, no PRO catalog lock, and it survives closing the tab. Export to JSON and CSV whenever you want.",
    about:
      "This is not a spreadsheet. No cells, no formulas, no sheet tabs. One line for the store name, one line for the store number, one box for notes.",
    langLabel: "Language",
    chipNoLogin: "No login",
    chipNoLock: "No 100-store lock",
    chipNoSheet: "No spreadsheet",
    chipExport: "JSON and CSV export",
    chipPersist: "Survives closing the tab",
    addTitle: "Add a store",
    addHint: "Only the store name is required. Number and notes can stay empty.",
    nameLabel: "Store name",
    namePlaceholder: "e.g. Northgate Hardware",
    nameRequired: "Please type a store name.",
    numberLabel: "Store number / phone",
    numberPlaceholder: "e.g. 1023 or (555) 010-4477",
    notesLabel: "Notes",
    notesPlaceholder: "e.g. loading dock at the back, ask for Dana, closed Mondays",
    optional: "optional",
    addButton: "Add to the list",
    storeAdded: "{name} — added to the list.",
    listTitle: "Store list",
    storeCount: "{n} stores",
    sortNote: "Sorted A–Z by name automatically. There is no sort button.",
    searchLabel: "Search name, number and notes",
    searchPlaceholder: "Search by name, number or notes",
    clearSearch: "Clear",
    searchEmpty: "Nothing matches “{q}”.",
    searchCount: "{n} found",
    emptyTitle: "No stores in here yet",
    emptyBody:
      "Type the store name, type the store number only you and the depot know, and put whatever you have to remember in the notes. The list files itself A–Z, and later you find any of it — name, number or note — from one search box.",
    emptyBody2:
      "No spreadsheet to open. No login, no 100-record cap and no PRO unlock. It saves the moment you type it, and it is still here after you close the tab.",
    noNumber: "No number",
    numberTag: "STORE NO.",
    notesTag: "NOTES",
    openEdit: "Open to edit",
    closeEdit: "Close",
    editTitle: "Edit",
    save: "Save",
    saved: "Saved.",
    deleteStore: "Remove from list",
    deleteConfirmTitle: "Remove “{name}”?",
    deleteConfirmBody: "This deletes the store from this device. It cannot be undone.",
    cancel: "Keep it",
    delete: "Remove",
    storeDeleted: "Removed from the list.",
    callStore: "Call",
    exportTitle: "Export",
    exportBody:
      "Download the whole list as one file. The CSV opens straight in Excel or Google Sheets; the JSON is the easiest thing to move somewhere else. Neither one goes through a server.",
    exportJson: "Export JSON",
    exportCsv: "Export CSV",
    exportDone: "Downloaded {file}.",
    exportEmpty: "There is nothing to export yet.",
    promiseTitle: "Promises",
    promiseLogin: "No login and no sign-up. Open it and add the first store.",
    promiseLock: "No 100-record cap and no PRO catalog unlock. Keep as many stores as you like.",
    promiseSheet: "Not a spreadsheet. No cells, no formulas, no column widths to drag on a phone.",
    promiseSort: "No sort button. A store takes its place A–Z the moment you add it.",
    promisePersist:
      "Close the tab, close the browser — it is still here. Nothing expires on a timer.",
    promiseExport: "Export to JSON and CSV any time. Nothing is locked in.",
    howTitle: "Where this is kept",
    howBody:
      "Store names, numbers and notes are kept in this browser on this device only. No account, no server, no sync. They disappear only when you remove them, when you clear the browser's site data, or when you change device. Export a CSV or JSON copy if the list is one you cannot lose.",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "店舗帳",
    tagline: "店名、店舗番号、メモ。あいうえお順。この端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    metaDescription:
      "店名と店舗番号、それに短いメモだけを書いておくスマホ向けの店舗一覧。表計算アプリを開く必要がなく、あいうえお順に自動で並び、名前・番号・メモを一つの検索欄で探せます。ログインも100件の上限も有料ロックもなく、タブを閉じても残ります。JSONとCSVで書き出せます。",
    about:
      "表計算アプリではありません。セルも数式もシートのタブもありません。店名が一行、店舗番号が一行、メモが一枠。それだけです。",
    langLabel: "言語",
    chipNoLogin: "ログインなし",
    chipNoLock: "100件の上限なし",
    chipNoSheet: "表計算アプリ不要",
    chipExport: "JSON・CSV書き出し",
    chipPersist: "タブを閉じても残る",
    addTitle: "店を追加",
    addHint: "必須は店名だけです。番号とメモは空のままでも構いません。",
    nameLabel: "店名",
    namePlaceholder: "例：北口金物店",
    nameRequired: "店名を書いてください。",
    numberLabel: "店舗番号／電話",
    numberPlaceholder: "例：1023 または 03-1234-5678",
    notesLabel: "メモ",
    notesPlaceholder: "例：裏口で荷下ろし、担当は田中さん、月曜定休",
    optional: "任意",
    addButton: "一覧に入れる",
    storeAdded: "{name} — 一覧に入れました。",
    listTitle: "店舗一覧",
    storeCount: "全{n}件",
    sortNote: "店名のあいうえお順に自動で並びます。並べ替えボタンはありません。",
    searchLabel: "名前・番号・メモを検索",
    searchPlaceholder: "名前、番号、メモで探す",
    clearSearch: "消す",
    searchEmpty: "「{q}」に合う店はありません。",
    searchCount: "{n}件",
    emptyTitle: "まだ一件も入っていません",
    emptyBody:
      "店名を書き、身内だけが使う店舗番号を書き、覚えておくことをメモに書きます。一覧はあいうえお順に勝手に並び、あとから名前でも番号でもメモでも、一つの欄で探せます。",
    emptyBody2:
      "表計算アプリを開く必要はありません。ログインも100件の上限も有料ロックもなく、書いた瞬間にこの端末へ保存され、タブを閉じても残ります。",
    noNumber: "番号なし",
    numberTag: "店舗番号",
    notesTag: "メモ",
    openEdit: "開いて直す",
    closeEdit: "閉じる",
    editTitle: "直す",
    save: "保存",
    saved: "直しました。",
    deleteStore: "一覧から外す",
    deleteConfirmTitle: "「{name}」を外しますか？",
    deleteConfirmBody: "この端末からこの店の記録を消します。元には戻せません。",
    cancel: "残す",
    delete: "外す",
    storeDeleted: "一覧から外しました。",
    callStore: "電話する",
    exportTitle: "書き出し",
    exportBody:
      "一覧まるごとを一つのファイルとして保存します。CSVはExcelやGoogleスプレッドシートでそのまま開け、JSONはどこかへ移すのに向いています。どちらもサーバーを通りません。",
    exportJson: "JSONで書き出す",
    exportCsv: "CSVで書き出す",
    exportDone: "{file} を保存しました。",
    exportEmpty: "まだ書き出す店がありません。",
    promiseTitle: "約束",
    promiseLogin: "ログインも会員登録もありません。開けばすぐ最初の一件を入れられます。",
    promiseLock: "100件の上限も、有料版のロックもありません。何件でもどうぞ。",
    promiseSheet: "表計算アプリではありません。セルも数式も、指で動かす列幅もありません。",
    promiseSort: "並べ替えボタンはありません。入れた瞬間にあいうえお順の位置へ収まります。",
    promisePersist: "タブを閉じても、ブラウザを閉じても残ります。時間で消えることはありません。",
    promiseExport: "いつでもJSONとCSVで書き出せます。閉じ込めません。",
    howTitle: "どこに保存されますか",
    howBody:
      "店名、番号、メモはこの端末のブラウザにだけ保存されます。アカウントもサーバーも同期もありません。自分で外すか、ブラウザのサイトデータを消すか、端末を替えたときにだけ消えます。長く残したい一覧はCSVかJSONで書き出しておいてください。",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    // zh has its own card. Never point it at the en file.
    title: "店录",
    tagline: "店名、门店号、备注。按字母排序。仅此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    metaDescription:
      "为手机准备的门店名录：店名、门店号，再加一句备注。不用打开电子表格，自动按字母顺序排列，一个搜索框同时找名字、号码和备注。无需登录，没有 100 条上限，也没有 PRO 解锁，关掉标签页也还在。随时导出 JSON 和 CSV。",
    about:
      "这不是电子表格。没有单元格，没有公式，没有工作表标签。店名一行，门店号一行，备注一格，就这些。",
    langLabel: "语言",
    chipNoLogin: "无需登录",
    chipNoLock: "不限门店数量",
    chipNoSheet: "不用电子表格",
    chipExport: "导出 JSON 和 CSV",
    chipPersist: "关掉标签页也还在",
    addTitle: "添加门店",
    addHint: "只有店名是必填的。号码和备注可以留空。",
    nameLabel: "店名",
    namePlaceholder: "例：北门五金店",
    nameRequired: "请写下店名。",
    numberLabel: "门店号／电话",
    numberPlaceholder: "例：1023 或 010-1234-5678",
    notesLabel: "备注",
    notesPlaceholder: "例：后门卸货、找李店长、周一休息",
    optional: "可填可不填",
    addButton: "加入名录",
    storeAdded: "{name} — 已加入名录。",
    listTitle: "门店名录",
    storeCount: "共 {n} 家",
    sortNote: "按店名自动排序，没有排序按钮。",
    searchLabel: "搜索名字、号码和备注",
    searchPlaceholder: "按名字、号码或备注查找",
    clearSearch: "清除",
    searchEmpty: "没有和“{q}”匹配的门店。",
    searchCount: "找到 {n} 家",
    emptyTitle: "名录还是空的",
    emptyBody:
      "写下店名，写下只有自己人才知道的门店号，把要记住的话写进备注。名录会自己按字母排好队，以后名字、号码、备注都能在同一个框里搜到。",
    emptyBody2:
      "不用打开电子表格。没有登录，没有 100 条上限，也没有付费解锁。写下就保存在这台设备上，关掉标签页也还在。",
    noNumber: "没有号码",
    numberTag: "门店号",
    notesTag: "备注",
    openEdit: "展开修改",
    closeEdit: "收起",
    editTitle: "修改",
    save: "保存",
    saved: "已修改。",
    deleteStore: "从名录移除",
    deleteConfirmTitle: "要移除“{name}”吗？",
    deleteConfirmBody: "这会从此设备删除这家门店的记录，无法恢复。",
    cancel: "先留着",
    delete: "移除",
    storeDeleted: "已从名录移除。",
    callStore: "拨号",
    exportTitle: "导出",
    exportBody:
      "把整份名录存成一个文件。CSV 可以直接用 Excel 或 Google 表格打开，JSON 最方便搬到别处。两种都不经过服务器。",
    exportJson: "导出 JSON",
    exportCsv: "导出 CSV",
    exportDone: "已下载 {file}。",
    exportEmpty: "还没有可以导出的门店。",
    promiseTitle: "承诺",
    promiseLogin: "没有登录也没有注册。打开就能加第一家店。",
    promiseLock: "没有 100 条上限，也没有 PRO 解锁。想加多少家都行。",
    promiseSheet: "不是电子表格。没有单元格、公式，也不用在手机上拖列宽。",
    promiseSort: "没有排序按钮。加进来的那一刻就排到该在的位置。",
    promisePersist: "关掉标签页、关掉浏览器，它都还在。不会到时间自动消失。",
    promiseExport: "随时导出 JSON 和 CSV，不会把你锁住。",
    howTitle: "保存在哪里",
    howBody:
      "店名、号码和备注只保存在这台设备的浏览器里。没有账号，没有服务器，也没有同步。只有你自己移除、清除浏览器站点数据，或者换设备时才会消失。重要的名录记得导出一份 CSV 或 JSON。",
    privacy: "隐私",
    terms: "条款",
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
