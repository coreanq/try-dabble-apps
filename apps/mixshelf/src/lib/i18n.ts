/** Every visible string in ko/en/ja/zh. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "mixshelf:lang";

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

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://mixshelf.try-dabble.com/og-image.png",
  en: "https://mixshelf.try-dabble.com/og-image-en.png",
  ja: "https://mixshelf.try-dabble.com/og-image-ja.png",
  zh: "https://mixshelf.try-dabble.com/og-image-zh.png",
};

export const OG_LOCALE: Record<Lang, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
  zh: "zh_CN",
};

export type MsgKey =
  | "title"
  | "tagline"
  | "localOnly"
  | "metaDescription"
  | "about"
  | "langLabel"
  | "chipNoLogin"
  | "chipNoCap"
  | "chipMultiType"
  | "chipTags"
  | "chipFilter"
  | "chipManual"
  | "chipPersist"
  | "chipJson"
  | "addTitle"
  | "editTitle"
  | "titleLabel"
  | "titlePlaceholder"
  | "titleRequired"
  | "typeLabel"
  | "typeBook"
  | "typeGame"
  | "typeMovie"
  | "typeTv"
  | "tagsLabel"
  | "tagsPlaceholder"
  | "tagsHint"
  | "addTag"
  | "notesLabel"
  | "notesPlaceholder"
  | "statusLabel"
  | "statusNone"
  | "statusUnread"
  | "statusReading"
  | "statusRead"
  | "statusPlaying"
  | "statusFinished"
  | "statusWishlist"
  | "optional"
  | "addButton"
  | "save"
  | "cancel"
  | "delete"
  | "itemAdded"
  | "itemSaved"
  | "itemDeleted"
  | "listTitle"
  | "itemCount"
  | "searchLabel"
  | "searchPlaceholder"
  | "clearSearch"
  | "searchEmpty"
  | "searchCount"
  | "filterType"
  | "filterTag"
  | "clearFilters"
  | "emptyTitle"
  | "emptyBody"
  | "emptyBody2"
  | "openEdit"
  | "deleteConfirmTitle"
  | "deleteConfirmBody"
  | "exportTitle"
  | "exportBody"
  | "exportJson"
  | "importJson"
  | "exportDone"
  | "importDone"
  | "importFail"
  | "importConfirmTitle"
  | "importConfirmBody"
  | "exportEmpty"
  | "privacy"
  | "terms"
  | "noTagsYet"
  | "filteredEmpty";

const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "믹선반",
    tagline: "책·게임·영화·TV를 한 선반에. 내가 만든 태그로 골라 본다. 계정 없음.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    metaDescription:
      "책·게임·영화·TV를 한 선반에 모아 두고, 내가 만든 태그로 골라 보는 개인 도서관. 바코드도 카탈로그 계정도 없고, 제목을 직접 적습니다. 로그인·구독·유형별 무료 한도 없이 이 기기에만 저장되며 JSON으로 내보내기와 가져오기가 됩니다.",
    about: "한 선반에 책·게임·영화·TV. 태그는 마음대로. 필터는 유형과 태그로.",
    langLabel: "언어",
    chipNoLogin: "로그인 없음",
    chipNoCap: "구독/캡 없음",
    chipMultiType: "책·게임·영화·TV 한 선반",
    chipTags: "커스텀 다중 태그",
    chipFilter: "태그·유형 필터",
    chipManual: "수동 제목",
    chipPersist: "이 기기 저장",
    chipJson: "JSON 내보내기/가져오기",
    addTitle: "작품 추가",
    editTitle: "작품 고치기",
    titleLabel: "제목",
    titlePlaceholder: "예: 샤이닝",
    titleRequired: "제목을 적어 주세요.",
    typeLabel: "유형",
    typeBook: "책",
    typeGame: "게임",
    typeMovie: "영화",
    typeTv: "TV",
    tagsLabel: "태그",
    tagsPlaceholder: "예: Author: Stephen King",
    tagsHint: "엔터나 추가로 여러 태그를 붙입니다.",
    addTag: "태그 추가",
    notesLabel: "메모",
    notesPlaceholder: "짧은 메모",
    statusLabel: "상태",
    statusNone: "없음",
    statusUnread: "안 읽음",
    statusReading: "읽는 중",
    statusRead: "읽음",
    statusPlaying: "플레이 중",
    statusFinished: "완료",
    statusWishlist: "위시",
    optional: "선택",
    addButton: "선반에 넣기",
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    itemAdded: "선반에 넣었습니다.",
    itemSaved: "저장했습니다.",
    itemDeleted: "삭제했습니다.",
    listTitle: "내 선반",
    itemCount: "모두 {n}개",
    searchLabel: "제목 검색",
    searchPlaceholder: "제목으로 찾기",
    clearSearch: "지우기",
    searchEmpty: "\"{q}\"와 맞는 작품이 없습니다.",
    searchCount: "{n}개 찾음",
    filterType: "유형",
    filterTag: "태그",
    clearFilters: "필터 지우기",
    emptyTitle: "아직 선반이 비어 있습니다",
    emptyBody:
      "책·게임·영화·TV 제목을 직접 적고, Author: Stephen King 같은 태그를 붙이세요. 유형과 태그로 골라 볼 수 있습니다.",
    emptyBody2:
      "바코드도 카탈로그 계정도 없습니다. 로그인·구독·유형별 한도 없이 이 기기에만 남고, JSON으로 백업할 수 있습니다.",
    openEdit: "고치기",
    deleteConfirmTitle: "이 작품을 삭제할까요?",
    deleteConfirmBody: "삭제하면 되돌릴 수 없습니다. JSON 백업이 있다면 다시 가져올 수 있습니다.",
    exportTitle: "백업",
    exportBody: "선반 전체를 JSON 파일로 내보내거나 가져옵니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    exportDone: "내보냈습니다.",
    importDone: "가져왔습니다.",
    importFail: "그 파일은 가져올 수 없습니다.",
    importConfirmTitle: "가져오기로 바꿀까요?",
    importConfirmBody: "지금 선반을 가져온 목록으로 바꿉니다. 지금 내용은 JSON으로 먼저 내보내 두세요.",
    exportEmpty: "내보낼 작품이 없습니다.",
    privacy: "개인정보",
    terms: "이용약관",
    noTagsYet: "아직 태그가 없습니다",
    filteredEmpty: "이 필터에 맞는 작품이 없습니다.",
  },
  en: {
    title: "Mixshelf",
    tagline: "Books, games, movies, and TV on one shelf. Filter by your own tags. No account.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    metaDescription:
      "A personal library for books, games, movies and TV on one shelf, with your own multi-tags and smooth filters. Manual titles — no barcode or catalog login. No subscription, no per-type free-tier lock. Stays on this device; export and import JSON anytime.",
    about: "One shelf for books, games, movies and TV. Tags you invent. Filter by type and tag.",
    langLabel: "Language",
    chipNoLogin: "No login",
    chipNoCap: "No sub/cap",
    chipMultiType: "Books+games+movies+TV",
    chipTags: "Custom multi-tags",
    chipFilter: "Filter by tag & type",
    chipManual: "Manual titles",
    chipPersist: "On this device",
    chipJson: "JSON export/import",
    addTitle: "Add item",
    editTitle: "Edit item",
    titleLabel: "Title",
    titlePlaceholder: "e.g. The Shining",
    titleRequired: "Please enter a title.",
    typeLabel: "Type",
    typeBook: "Book",
    typeGame: "Game",
    typeMovie: "Movie",
    typeTv: "TV",
    tagsLabel: "Tags",
    tagsPlaceholder: "e.g. Author: Stephen King",
    tagsHint: "Press Enter or Add to attach several tags.",
    addTag: "Add tag",
    notesLabel: "Notes",
    notesPlaceholder: "Short notes",
    statusLabel: "Status",
    statusNone: "None",
    statusUnread: "Unread",
    statusReading: "Reading",
    statusRead: "Read",
    statusPlaying: "Playing",
    statusFinished: "Finished",
    statusWishlist: "Wishlist",
    optional: "optional",
    addButton: "Add to shelf",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    itemAdded: "Added to your shelf.",
    itemSaved: "Saved.",
    itemDeleted: "Deleted.",
    listTitle: "Your shelf",
    itemCount: "{n} items",
    searchLabel: "Search titles",
    searchPlaceholder: "Search by title",
    clearSearch: "Clear",
    searchEmpty: "No items match \"{q}\".",
    searchCount: "{n} found",
    filterType: "Type",
    filterTag: "Tag",
    clearFilters: "Clear filters",
    emptyTitle: "Your shelf is empty",
    emptyBody:
      "Type a book, game, movie or TV title by hand and add tags like Author: Stephen King. Filter by type and by tag.",
    emptyBody2:
      "No barcode, no catalog account. No login, subscription or per-type lock. It stays on this device and you can back it up as JSON.",
    openEdit: "Edit",
    deleteConfirmTitle: "Delete this item?",
    deleteConfirmBody: "This cannot be undone here. If you exported JSON, you can import it again.",
    exportTitle: "Backup",
    exportBody: "Export the whole shelf as JSON, or import a named backup.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exportDone: "Exported.",
    importDone: "Imported.",
    importFail: "Could not import that file.",
    importConfirmTitle: "Replace the shelf?",
    importConfirmBody: "Import replaces what is on this device. Export a JSON backup first if you need it.",
    exportEmpty: "Nothing to export yet.",
    privacy: "Privacy",
    terms: "Terms",
    noTagsYet: "No tags yet",
    filteredEmpty: "Nothing matches these filters.",
  },
  ja: {
    title: "ミックス棚",
    tagline: "本・ゲーム・映画・テレビを一つの棚に。自分のタグで絞り込み。アカウント不要。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    metaDescription:
      "本・ゲーム・映画・テレビを一つの棚にまとめ、自分で付けたタグで絞り込む個人ライブラリ。バーコードもカタログ用アカウントも不要で、タイトルは手入力。ログイン・定額・種類ごとの無料上限なし。この端末だけに残り、JSONで書き出し・読み込みできます。",
    about: "本・ゲーム・映画・テレビを一つの棚に。タグは自由。種類とタグで絞り込み。",
    langLabel: "言語",
    chipNoLogin: "ログインなし",
    chipNoCap: "定額・上限なし",
    chipMultiType: "本・ゲーム・映画・TV",
    chipTags: "自由な複数タグ",
    chipFilter: "タグ・種類フィルタ",
    chipManual: "手入力タイトル",
    chipPersist: "この端末に保存",
    chipJson: "JSON書き出し/読み込み",
    addTitle: "作品を追加",
    editTitle: "作品を編集",
    titleLabel: "タイトル",
    titlePlaceholder: "例: シャイニング",
    titleRequired: "タイトルを入力してください。",
    typeLabel: "種類",
    typeBook: "本",
    typeGame: "ゲーム",
    typeMovie: "映画",
    typeTv: "テレビ",
    tagsLabel: "タグ",
    tagsPlaceholder: "例: Author: Stephen King",
    tagsHint: "Enter か追加で複数タグを付けます。",
    addTag: "タグ追加",
    notesLabel: "メモ",
    notesPlaceholder: "短いメモ",
    statusLabel: "状態",
    statusNone: "なし",
    statusUnread: "未読",
    statusReading: "読書中",
    statusRead: "読了",
    statusPlaying: "プレイ中",
    statusFinished: "完了",
    statusWishlist: "ほしい",
    optional: "任意",
    addButton: "棚に入れる",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    itemAdded: "棚に入れました。",
    itemSaved: "保存しました。",
    itemDeleted: "削除しました。",
    listTitle: "自分の棚",
    itemCount: "全 {n} 件",
    searchLabel: "タイトル検索",
    searchPlaceholder: "タイトルで探す",
    clearSearch: "クリア",
    searchEmpty: "「{q}」に合う作品はありません。",
    searchCount: "{n} 件",
    filterType: "種類",
    filterTag: "タグ",
    clearFilters: "フィルタ解除",
    emptyTitle: "まだ棚が空です",
    emptyBody:
      "本・ゲーム・映画・テレビのタイトルを手で書き、Author: Stephen King のようなタグを付けます。種類とタグで絞り込めます。",
    emptyBody2:
      "バーコードもカタログ用アカウントもありません。ログイン・定額・種類ごとの上限なし。この端末に残り、JSONでバックアップできます。",
    openEdit: "編集",
    deleteConfirmTitle: "この作品を削除しますか？",
    deleteConfirmBody: "元には戻せません。JSONバックアップがあれば再度読み込めます。",
    exportTitle: "バックアップ",
    exportBody: "棚全体をJSONで書き出すか、バックアップを読み込みます。",
    exportJson: "JSON書き出し",
    importJson: "JSON読み込み",
    exportDone: "書き出しました。",
    importDone: "読み込みました。",
    importFail: "そのファイルは読めません。",
    importConfirmTitle: "棚を置き換えますか？",
    importConfirmBody: "読み込みはこの端末の内容を置き換えます。必要なら先にJSONで書き出してください。",
    exportEmpty: "書き出す作品がありません。",
    privacy: "プライバシー",
    terms: "利用規約",
    noTagsYet: "まだタグがありません",
    filteredEmpty: "この条件に合う作品はありません。",
  },
  zh: {
    title: "混架",
    tagline: "书、游戏、电影、剧集放在同一层架。用自己的标签筛选。无需账号。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    metaDescription:
      "把书、游戏、电影和剧集放在同一层架，用自己创建的多标签轻松筛选。手动输入标题，无需条码或目录账号。无订阅、无按类型的免费上限。数据留在此设备，可随时导出/导入 JSON。",
    about: "一书架收纳书、游戏、电影与剧集。标签自定。按类型与标签筛选。",
    langLabel: "语言",
    chipNoLogin: "无需登录",
    chipNoCap: "无订阅/上限",
    chipMultiType: "书·游戏·电影·剧集",
    chipTags: "自定义多标签",
    chipFilter: "按标签与类型筛选",
    chipManual: "手动标题",
    chipPersist: "仅此设备",
    chipJson: "JSON 导出/导入",
    addTitle: "添加作品",
    editTitle: "编辑作品",
    titleLabel: "标题",
    titlePlaceholder: "例如：闪灵",
    titleRequired: "请填写标题。",
    typeLabel: "类型",
    typeBook: "书",
    typeGame: "游戏",
    typeMovie: "电影",
    typeTv: "剧集",
    tagsLabel: "标签",
    tagsPlaceholder: "例如：Author: Stephen King",
    tagsHint: "按回车或点添加，可挂多个标签。",
    addTag: "添加标签",
    notesLabel: "备注",
    notesPlaceholder: "简短备注",
    statusLabel: "状态",
    statusNone: "无",
    statusUnread: "未读",
    statusReading: "在读",
    statusRead: "已读",
    statusPlaying: "游玩中",
    statusFinished: "已完成",
    statusWishlist: "想看/想玩",
    optional: "可选",
    addButton: "放到架上",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    itemAdded: "已放到架上。",
    itemSaved: "已保存。",
    itemDeleted: "已删除。",
    listTitle: "我的架子",
    itemCount: "共 {n} 项",
    searchLabel: "搜索标题",
    searchPlaceholder: "按标题搜索",
    clearSearch: "清除",
    searchEmpty: "没有匹配 “{q}” 的作品。",
    searchCount: "找到 {n} 项",
    filterType: "类型",
    filterTag: "标签",
    clearFilters: "清除筛选",
    emptyTitle: "架子还是空的",
    emptyBody:
      "手动输入书、游戏、电影或剧集标题，并加上 Author: Stephen King 这类标签。可按类型和标签筛选。",
    emptyBody2:
      "没有条码，也没有目录账号。无登录、订阅或按类型上限。数据留在此设备，可用 JSON 备份。",
    openEdit: "编辑",
    deleteConfirmTitle: "删除这部作品？",
    deleteConfirmBody: "此处无法撤销。若已导出 JSON，可以再导入。",
    exportTitle: "备份",
    exportBody: "将整架导出为 JSON，或导入命名备份。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    exportDone: "已导出。",
    importDone: "已导入。",
    importFail: "无法导入该文件。",
    importConfirmTitle: "替换当前架子？",
    importConfirmBody: "导入会替换此设备上的内容。需要的话先导出 JSON。",
    exportEmpty: "还没有可导出的作品。",
    privacy: "隐私",
    terms: "条款",
    noTagsYet: "还没有标签",
    filteredEmpty: "没有符合这些筛选的作品。",
  },
};

export function t(lang: Lang, key: MsgKey, vars?: Record<string, string | number>): string {
  let s = I18N[lang][key] ?? I18N.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `td_lang=${lang}; Domain=.try-dabble.com; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function isLang(v: unknown): v is Lang {
  return v === "ko" || v === "en" || v === "ja" || v === "zh";
}

export function detectLang(preferred?: Lang | null): Lang {
  if (preferred && isLang(preferred)) return preferred;
  if (typeof window === "undefined") return "ko";
  const q = new URLSearchParams(window.location.search).get("lang");
  if (q === "ko" || q === "en" || q === "ja" || q === "zh") return q;
  const m = document.cookie.match(/(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/);
  if (m) return m[1] as Lang;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ko" || saved === "en" || saved === "ja" || saved === "zh") return saved;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("zh")) return "zh";
  return "en";
}

export function typeLabel(lang: Lang, type: string): string {
  switch (type) {
    case "book":
      return t(lang, "typeBook");
    case "game":
      return t(lang, "typeGame");
    case "movie":
      return t(lang, "typeMovie");
    case "tv":
      return t(lang, "typeTv");
    default:
      return type;
  }
}

export function statusLabel(lang: Lang, status: string): string {
  switch (status) {
    case "unread":
      return t(lang, "statusUnread");
    case "reading":
      return t(lang, "statusReading");
    case "read":
      return t(lang, "statusRead");
    case "playing":
      return t(lang, "statusPlaying");
    case "finished":
      return t(lang, "statusFinished");
    case "wishlist":
      return t(lang, "statusWishlist");
    default:
      return t(lang, "statusNone");
  }
}
export const translate = t;
