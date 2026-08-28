/** Every visible string in ko/en/ja/zh. Same shape as the sibling apps. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "memomap:lang";

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
  ko: "https://memomap.try-dabble.com/og-image.png",
  en: "https://memomap.try-dabble.com/og-image-en.png",
  ja: "https://memomap.try-dabble.com/og-image-ja.png",
  zh: "https://memomap.try-dabble.com/og-image-zh.png",
};

/** Date formatting locale per UI language. */
export const DATE_LOCALE: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "localOnly"
  | "metaDescription"
  | "about"
  | "langLabel"
  | "mapAria"
  | "mapHint"
  | "addHere"
  | "pinCount"
  | "searchLabel"
  | "searchPlaceholder"
  | "clearSearch"
  | "searchEmpty"
  | "listTitle"
  | "emptyTitle"
  | "emptyBody"
  | "emptyCta"
  | "pinDialogTitle"
  | "memoLabel"
  | "memoPlaceholder"
  | "photoLabel"
  | "photoHint"
  | "choosePhoto"
  | "takePhoto"
  | "replacePhoto"
  | "removePhoto"
  | "photoAlt"
  | "photoFailed"
  | "coordsLabel"
  | "visitedLabel"
  | "done"
  | "openOnMap"
  | "noMemo"
  | "deletePin"
  | "deleteConfirmTitle"
  | "deleteConfirmBody"
  | "cancel"
  | "delete"
  | "pinAdded"
  | "pinDeleted"
  | "howTitle"
  | "howBody"
  | "promiseTitle"
  | "promiseLogin"
  | "promiseStamina"
  | "promisePhoto"
  | "promiseSub"
  | "promisePrivate"
  | "privacy"
  | "terms";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "기억지도",
    shortName: "기억지도",
    tagline: "다녀온 곳에 핀과 한 줄, 이 기기에만",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    metaDescription:
      "다녀온 곳을 지도에 핀으로 남기는 개인 기억 지도. 탭해서 핀을 꽂고 한 줄 메모와 사진을 붙입니다. 로그인도, 스태미나도, 사진 개수 제한도, 구독도 없습니다. 핀은 이 기기에만 남습니다.",
    about:
      "가고 싶은 곳을 모으는 위시리스트가 아니라, 이미 다녀온 곳을 남기는 지도입니다. 지도를 탭하면 그 자리에 핀이 꽂히고, 한 줄 메모와 사진 한 장을 붙일 수 있습니다. 계정도 로그인도 없고, 핀과 사진은 이 기기 밖으로 나가지 않습니다.",
    langLabel: "언어",
    mapAria: "다녀온 곳 지도",
    mapHint: "지도를 탭하면 그 자리에 핀이 꽂힙니다. 핀을 누르면 메모가 열립니다.",
    addHere: "지도 중앙에 핀 꽂기",
    pinCount: "핀 {n}개",
    searchLabel: "메모 검색",
    searchPlaceholder: "메모 안의 말로 찾기",
    clearSearch: "검색 지우기",
    searchEmpty: "‘{q}’와 맞는 메모가 없습니다.",
    listTitle: "다녀온 곳",
    emptyTitle: "아직 핀이 없습니다",
    emptyBody:
      "다녀온 곳을 지도에서 찾아 탭하세요. 그 자리에 핀이 꽂히고, 한 줄 메모와 사진 한 장을 붙일 수 있습니다. 로그인도 구독도 없고, 사진 개수 제한도 없습니다. 핀은 이 기기에만 남습니다.",
    emptyCta: "지금 보이는 자리에 핀 꽂기",
    pinDialogTitle: "이곳의 기억",
    memoLabel: "한 줄 메모",
    memoPlaceholder: "여기서 뭘 했나요? 한 줄이면 충분합니다.",
    photoLabel: "사진 (선택)",
    photoHint: "사진은 이 기기 안에만 저장됩니다. 개수 제한은 없습니다.",
    choosePhoto: "사진 고르기",
    takePhoto: "카메라로 찍기",
    replacePhoto: "사진 바꾸기",
    removePhoto: "사진 빼기",
    photoAlt: "이 핀에 붙인 사진",
    photoFailed: "사진을 불러오지 못했습니다.",
    coordsLabel: "좌표",
    visitedLabel: "적은 날",
    done: "닫기",
    openOnMap: "지도에서 보기",
    noMemo: "메모 없음",
    deletePin: "핀 지우기",
    deleteConfirmTitle: "이 핀을 지울까요?",
    deleteConfirmBody: "메모와 사진도 함께 지워집니다. 되돌릴 수 없습니다.",
    cancel: "취소",
    delete: "지우기",
    pinAdded: "핀을 꽂았습니다.",
    pinDeleted: "핀을 지웠습니다.",
    howTitle: "어떻게 남나요",
    howBody:
      "핀과 메모는 이 브라우저에, 사진은 이 기기의 브라우저 저장소에 들어갑니다. 시간이 지나도 지워지지 않고, 앱을 고쳐도 0으로 돌아가지 않습니다. 지우는 건 직접 지울 때뿐입니다. 기기를 바꾸거나 브라우저 데이터를 지우면 함께 사라지니, 오래 남길 사진은 따로 보관하세요.",
    promiseTitle: "없는 것들",
    promiseLogin: "로그인·회원가입 없음 — 열면 바로 씁니다",
    promiseStamina: "스태미나·기력·하루 제한 없음 — 업데이트해도 0이 되지 않습니다",
    promisePhoto: "사진 개수 잠금 없음",
    promiseSub: "구독·유료 잠금 없음",
    promisePrivate: "기본이 비공개 — 공유 링크도, 서버 업로드도 없습니다",
    privacy: "개인정보",
    terms: "이용약관",
  },
  en: {
    title: "Memomap",
    shortName: "Memomap",
    tagline: "Pins, a short note, a photo. Private, on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    metaDescription:
      "A private map of the places you have already been. Tap to drop a pin, add a short memo and a photo. No login, no stamina, no photo limit, no subscription. Pins stay on this device.",
    about:
      "Not a wishlist of places to go — a map of the ones you have already been to. Tap the map and a pin lands there, ready for one line of memo and one photo. No account, no login, and nothing about a pin ever leaves this device.",
    langLabel: "Language",
    mapAria: "Map of places you have been",
    mapHint: "Tap the map to drop a pin there. Tap a pin to open its memo.",
    addHere: "Pin the centre of the map",
    pinCount: "{n} pins",
    searchLabel: "Search memos",
    searchPlaceholder: "Find a word inside your memos",
    clearSearch: "Clear search",
    searchEmpty: "No memo matches “{q}”.",
    listTitle: "Places you have been",
    emptyTitle: "No pins yet",
    emptyBody:
      "Find a place you have been and tap it. A pin lands there, and you can add one line of memo and one photo. No login, no subscription, no cap on photos. Pins stay on this device.",
    emptyCta: "Pin what I am looking at",
    pinDialogTitle: "This place",
    memoLabel: "Short memo",
    memoPlaceholder: "What happened here? One line is enough.",
    photoLabel: "Photo (optional)",
    photoHint: "Photos are kept on this device only. There is no limit on how many.",
    choosePhoto: "Choose a photo",
    takePhoto: "Use the camera",
    replacePhoto: "Replace photo",
    removePhoto: "Remove photo",
    photoAlt: "Photo attached to this pin",
    photoFailed: "That photo could not be read.",
    coordsLabel: "Coordinates",
    visitedLabel: "Noted",
    done: "Close",
    openOnMap: "Show on the map",
    noMemo: "No memo yet",
    deletePin: "Delete pin",
    deleteConfirmTitle: "Delete this pin?",
    deleteConfirmBody: "The memo and the photo go with it. This cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    pinAdded: "Pin dropped.",
    pinDeleted: "Pin deleted.",
    howTitle: "How it is kept",
    howBody:
      "Pins and memos live in this browser; photos live in this device's browser storage. Nothing expires, and an update never resets it to zero. The only thing that removes a pin is you. Changing devices or clearing browser data clears it too, so keep a copy of photos you cannot lose.",
    promiseTitle: "What is not here",
    promiseLogin: "No login, no sign-up — open it and use it",
    promiseStamina: "No stamina, no energy, no daily cap — an update never resets it to 0",
    promisePhoto: "No lock on how many photos you attach",
    promiseSub: "No subscription, no paid gate",
    promisePrivate: "Private by default — no share links, no upload",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "視える記憶",
    shortName: "視える記憶",
    tagline: "行った場所にピンと一行。この端末だけに。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    metaDescription:
      "行ったことのある場所をピンで残す、自分だけの記憶地図。タップでピンを置き、一行のメモと写真を添えます。ログインもスタミナも写真枚数の制限も定額課金もありません。ピンはこの端末にだけ残ります。",
    about:
      "行きたい場所を集めるウィッシュリストではなく、すでに行った場所を残す地図です。地図をタップするとその場所にピンが立ち、一行のメモと写真を一枚添えられます。アカウントもログインもなく、ピンも写真もこの端末から出ません。",
    langLabel: "言語",
    mapAria: "行った場所の地図",
    mapHint: "地図をタップするとその場所にピンが立ちます。ピンを押すとメモが開きます。",
    addHere: "地図の中心にピンを立てる",
    pinCount: "ピン {n} 本",
    searchLabel: "メモを検索",
    searchPlaceholder: "メモの中の言葉で探す",
    clearSearch: "検索を消す",
    searchEmpty: "「{q}」に合うメモはありません。",
    listTitle: "行った場所",
    emptyTitle: "まだピンがありません",
    emptyBody:
      "行った場所を地図で探してタップしてください。その場所にピンが立ち、一行のメモと写真を一枚添えられます。ログインも定額課金もなく、写真の枚数制限もありません。ピンはこの端末にだけ残ります。",
    emptyCta: "いま見えている場所にピンを立てる",
    pinDialogTitle: "この場所の記憶",
    memoLabel: "一行メモ",
    memoPlaceholder: "ここで何をしましたか？ 一行で十分です。",
    photoLabel: "写真（任意）",
    photoHint: "写真はこの端末の中だけに保存されます。枚数の制限はありません。",
    choosePhoto: "写真を選ぶ",
    takePhoto: "カメラで撮る",
    replacePhoto: "写真を差し替える",
    removePhoto: "写真を外す",
    photoAlt: "このピンに添えた写真",
    photoFailed: "写真を読み込めませんでした。",
    coordsLabel: "座標",
    visitedLabel: "記録日",
    done: "閉じる",
    openOnMap: "地図で見る",
    noMemo: "メモなし",
    deletePin: "ピンを消す",
    deleteConfirmTitle: "このピンを消しますか？",
    deleteConfirmBody: "メモと写真も一緒に消えます。元に戻せません。",
    cancel: "キャンセル",
    delete: "消す",
    pinAdded: "ピンを立てました。",
    pinDeleted: "ピンを消しました。",
    howTitle: "どう残るか",
    howBody:
      "ピンとメモはこのブラウザに、写真はこの端末のブラウザ保存領域に入ります。時間で消えることはなく、アップデートしても0に戻りません。消えるのは自分で消したときだけです。端末を変えたりブラウザのデータを消すと一緒に消えるので、残したい写真は別に保管してください。",
    promiseTitle: "ないもの",
    promiseLogin: "ログインも会員登録もなし — 開いてすぐ使えます",
    promiseStamina: "スタミナ・気力・1日の上限なし — 更新しても0になりません",
    promisePhoto: "写真の枚数制限なし",
    promiseSub: "定額課金や有料ロックなし",
    promisePrivate: "既定で非公開 — 共有リンクもアップロードもありません",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    title: "记忆地图",
    shortName: "记忆地图",
    tagline: "去过的地方，一枚针一句话，只留在这台设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    metaDescription:
      "记录你去过的地方的私人记忆地图。点一下就能放针，再写一句话、配一张照片。无需登录，没有体力值，不限照片数量，没有订阅。所有针只留在这台设备。",
    about:
      "这不是收集想去哪儿的愿望清单，而是留住已经去过的地方的地图。点一下地图，针就落在那里，可以写一句话、配一张照片。没有账户，没有登录，针和照片都不会离开这台设备。",
    langLabel: "语言",
    mapAria: "去过的地方的地图",
    mapHint: "点一下地图就在那里放针。点针可以打开备注。",
    addHere: "在地图中心放针",
    pinCount: "{n} 枚针",
    searchLabel: "搜索备注",
    searchPlaceholder: "用备注里的词来找",
    clearSearch: "清除搜索",
    searchEmpty: "没有备注匹配“{q}”。",
    listTitle: "去过的地方",
    emptyTitle: "还没有针",
    emptyBody:
      "在地图上找到你去过的地方，点一下。针会落在那里，你可以写一句话、配一张照片。无需登录，没有订阅，照片数量也不设上限。所有针只留在这台设备。",
    emptyCta: "在当前画面放一枚针",
    pinDialogTitle: "这里的记忆",
    memoLabel: "一句话备注",
    memoPlaceholder: "在这里做了什么？一句话就够。",
    photoLabel: "照片（可选）",
    photoHint: "照片只保存在这台设备里，数量不设上限。",
    choosePhoto: "选择照片",
    takePhoto: "用相机拍",
    replacePhoto: "换一张照片",
    removePhoto: "去掉照片",
    photoAlt: "这枚针附带的照片",
    photoFailed: "这张照片读不出来。",
    coordsLabel: "坐标",
    visitedLabel: "记录于",
    done: "关闭",
    openOnMap: "在地图上看",
    noMemo: "还没有备注",
    deletePin: "删除这枚针",
    deleteConfirmTitle: "删除这枚针？",
    deleteConfirmBody: "备注和照片会一起删除，无法撤销。",
    cancel: "取消",
    delete: "删除",
    pinAdded: "已放下一枚针。",
    pinDeleted: "已删除这枚针。",
    howTitle: "怎么保存",
    howBody:
      "针和备注存在这个浏览器里，照片存在这台设备的浏览器存储里。不会到期消失，更新也不会归零。只有你自己删才会消失。换设备或清除浏览器数据会一起清掉，重要的照片请另外备份。",
    promiseTitle: "这里没有的东西",
    promiseLogin: "没有登录，没有注册 — 打开就能用",
    promiseStamina: "没有体力、精力或每日上限 — 更新后也不会归零",
    promisePhoto: "照片数量不上锁",
    promiseSub: "没有订阅，没有付费墙",
    promisePrivate: "默认私密 — 没有分享链接，不上传",
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
