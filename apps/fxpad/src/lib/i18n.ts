/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "fxpad:lang";

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

/** Locale for number formatting and the "updated" clock. */
export const NUM_LOCALE: Record<Lang, string> = {
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
  | "amountLabel"
  | "amountPlaceholder"
  | "fromLabel"
  | "toLabel"
  | "swap"
  | "resultLabel"
  | "unitRate"
  | "noRateForPair"
  | "enterAmount"
  | "statusOnline"
  | "statusOffline"
  | "sourceLive"
  | "sourceCached"
  | "sourceNone"
  | "updatedAt"
  | "ratesDate"
  | "neverSynced"
  | "refresh"
  | "refreshing"
  | "syncOk"
  | "syncFailedCached"
  | "errorTitle"
  | "errorBody"
  | "errorOffline"
  | "retry"
  | "pickFrom"
  | "pickTo"
  | "searchPlaceholder"
  | "noMatch"
  | "close"
  | "fontSizeLabel"
  | "fontMd"
  | "fontLg"
  | "fontXl"
  | "chipNoAds"
  | "chipOffline"
  | "chipCache"
  | "chipNoLogin"
  | "chipJpy"
  | "chipLangs"
  | "about"
  | "sourceNote"
  | "privacy"
  | "terms"
  | "guide";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "환율패드",
    shortName: "환율패드",
    tagline: "광고 없는 오프라인 환율. 받아 두고, 비행기 안에서도 환산.",
    metaDescription:
      "광고 없는 오프라인 환율 계산기. 환율을 한 번 받아 두면 비행기 안, 로밍 없는 곳에서도 그대로 환산합니다. JPY 포함 30여 통화, 로그인 없음, 무료. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    amountLabel: "금액",
    amountPlaceholder: "0",
    fromLabel: "보내는 통화",
    toLabel: "받는 통화",
    swap: "바꾸기",
    resultLabel: "환산 결과",
    unitRate: "1 {from} = {rate} {to}",
    noRateForPair: "이 통화쌍의 환율이 캐시에 없습니다. 새로고침해 보세요.",
    enterAmount: "금액을 입력하세요",
    statusOnline: "온라인",
    statusOffline: "오프라인",
    sourceLive: "방금 받은 환율",
    sourceCached: "캐시된 환율 사용 중",
    sourceNone: "아직 환율이 없습니다",
    updatedAt: "받은 시각 {time}",
    ratesDate: "기준일 {date}",
    neverSynced: "아직 한 번도 받지 않았습니다",
    refresh: "환율 새로고침",
    refreshing: "받는 중…",
    syncOk: "환율을 받았습니다",
    syncFailedCached: "받지 못해 캐시된 환율을 씁니다",
    errorTitle: "환율을 받지 못했습니다",
    errorBody: "연결을 확인한 뒤 다시 시도하세요. 한 번만 받아 두면 그다음부터는 오프라인에서도 환산됩니다.",
    errorOffline: "지금은 오프라인이고 저장된 환율도 없습니다. 인터넷이 될 때 한 번만 받아 두세요.",
    retry: "다시 시도",
    pickFrom: "보내는 통화 선택",
    pickTo: "받는 통화 선택",
    searchPlaceholder: "통화 검색 (예: JPY, 엔)",
    noMatch: "일치하는 통화가 없습니다",
    close: "닫기",
    fontSizeLabel: "글자 크기",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    chipNoAds: "광고 없음",
    chipOffline: "오프라인 환산",
    chipCache: "환율 캐시",
    chipNoLogin: "로그인 없음",
    chipJpy: "JPY 포함",
    chipLangs: "ko/en/ja/zh",
    about:
      "인터넷이 될 때 ‘환율 새로고침’을 한 번 누르면 환율이 이 기기에 저장됩니다. 그 뒤로는 기내나 로밍 없는 곳에서도 그대로 환산합니다. 금액을 적고 통화를 고르면 결과와 1단위 환율이 함께 보입니다.",
    sourceNote: "환율 출처: Frankfurter(유럽중앙은행 고시 기준). 은행·환전소 실거래 환율과는 차이가 있습니다.",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Fxpad",
    shortName: "Fxpad",
    tagline: "Ad-free offline currency converter. Sync rates, convert on the plane.",
    metaDescription:
      "Ad-free offline currency converter. Sync rates once and keep converting on the plane or without roaming. 30+ currencies including JPY, no login, all free. Data stays on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    amountLabel: "Amount",
    amountPlaceholder: "0",
    fromLabel: "From",
    toLabel: "To",
    swap: "Swap",
    resultLabel: "Converted",
    unitRate: "1 {from} = {rate} {to}",
    noRateForPair: "No cached rate for this pair. Try refreshing.",
    enterAmount: "Enter an amount",
    statusOnline: "Online",
    statusOffline: "Offline",
    sourceLive: "Fresh rates",
    sourceCached: "Using cached rates",
    sourceNone: "No rates yet",
    updatedAt: "Updated {time}",
    ratesDate: "Rates for {date}",
    neverSynced: "Never synced",
    refresh: "Refresh rates",
    refreshing: "Syncing…",
    syncOk: "Rates updated",
    syncFailedCached: "Could not sync, using cached rates",
    errorTitle: "Could not load rates",
    errorBody: "Check your connection and try again. One successful sync is enough; after that you can convert offline.",
    errorOffline: "You are offline and there are no saved rates yet. Sync once while you have internet.",
    retry: "Try again",
    pickFrom: "Choose the From currency",
    pickTo: "Choose the To currency",
    searchPlaceholder: "Search currency (e.g. JPY, yen)",
    noMatch: "No currency matches",
    close: "Close",
    fontSizeLabel: "Text size",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    chipNoAds: "No ads",
    chipOffline: "Offline convert",
    chipCache: "Rates cache",
    chipNoLogin: "No login",
    chipJpy: "Includes JPY",
    chipLangs: "ko/en/ja/zh",
    about:
      "Tap “Refresh rates” once while you have internet and the rates are saved on this device. From then on it converts on the plane or without roaming. Type an amount, pick two currencies, and you get the result plus the rate for one unit.",
    sourceNote: "Rates from Frankfurter (European Central Bank reference rates). Banks and exchange counters will differ.",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "為替パッド",
    shortName: "為替パッド",
    tagline: "広告なしのオフライン為替。取り込んで、機内でも換算。",
    metaDescription:
      "広告なしのオフライン為替計算機。一度レートを取り込めば、機内やローミングなしでもそのまま換算できます。JPYを含む30以上の通貨、ログインなし、すべて無料。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    amountLabel: "金額",
    amountPlaceholder: "0",
    fromLabel: "換算元",
    toLabel: "換算先",
    swap: "入れ替え",
    resultLabel: "換算結果",
    unitRate: "1 {from} = {rate} {to}",
    noRateForPair: "この通貨ペアのレートがキャッシュにありません。更新してみてください。",
    enterAmount: "金額を入力してください",
    statusOnline: "オンライン",
    statusOffline: "オフライン",
    sourceLive: "取り込んだばかりのレート",
    sourceCached: "キャッシュのレートを使用中",
    sourceNone: "まだレートがありません",
    updatedAt: "取得 {time}",
    ratesDate: "基準日 {date}",
    neverSynced: "まだ一度も取得していません",
    refresh: "レートを更新",
    refreshing: "取得中…",
    syncOk: "レートを取得しました",
    syncFailedCached: "取得できず、キャッシュのレートを使います",
    errorTitle: "レートを取得できませんでした",
    errorBody: "接続を確認してもう一度お試しください。一度取り込めば、その後はオフラインでも換算できます。",
    errorOffline: "いまはオフラインで、保存されたレートもありません。ネットにつながるときに一度取り込んでください。",
    retry: "もう一度",
    pickFrom: "換算元の通貨を選ぶ",
    pickTo: "換算先の通貨を選ぶ",
    searchPlaceholder: "通貨を検索（例: JPY, 円）",
    noMatch: "一致する通貨がありません",
    close: "閉じる",
    fontSizeLabel: "文字サイズ",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    chipNoAds: "広告なし",
    chipOffline: "オフライン換算",
    chipCache: "レートをキャッシュ",
    chipNoLogin: "ログインなし",
    chipJpy: "JPY対応",
    chipLangs: "ko/en/ja/zh",
    about:
      "ネットにつながるときに「レートを更新」を一度タップすると、レートがこの端末に保存されます。その後は機内やローミングなしでもそのまま換算できます。金額を入れて通貨を選ぶと、結果と1単位あたりのレートが並んで表示されます。",
    sourceNote: "レートの出典: Frankfurter（欧州中央銀行の参考レート）。銀行や両替所の実勢レートとは異なります。",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "汇率板",
    shortName: "汇率板",
    tagline: "无广告离线汇率。同步后，飞机上也能换算。",
    metaDescription:
      "无广告的离线汇率换算器。同步一次汇率，在飞机上或没有漫游时照样换算。含日元在内 30 多种货币，无需登录，完全免费。数据仅保存在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    amountLabel: "金额",
    amountPlaceholder: "0",
    fromLabel: "从",
    toLabel: "到",
    swap: "交换",
    resultLabel: "换算结果",
    unitRate: "1 {from} = {rate} {to}",
    noRateForPair: "缓存里没有这对货币的汇率，请试着刷新。",
    enterAmount: "请输入金额",
    statusOnline: "在线",
    statusOffline: "离线",
    sourceLive: "刚同步的汇率",
    sourceCached: "正在使用缓存汇率",
    sourceNone: "还没有汇率",
    updatedAt: "更新于 {time}",
    ratesDate: "基准日 {date}",
    neverSynced: "还从未同步过",
    refresh: "刷新汇率",
    refreshing: "同步中…",
    syncOk: "汇率已更新",
    syncFailedCached: "同步失败，使用缓存汇率",
    errorTitle: "无法获取汇率",
    errorBody: "请检查网络后重试。只要成功同步一次，之后离线也能换算。",
    errorOffline: "现在处于离线状态，也没有已保存的汇率。有网络时同步一次即可。",
    retry: "重试",
    pickFrom: "选择换出货币",
    pickTo: "选择换入货币",
    searchPlaceholder: "搜索货币（如 JPY、日元）",
    noMatch: "没有匹配的货币",
    close: "关闭",
    fontSizeLabel: "字号",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    chipNoAds: "无广告",
    chipOffline: "离线换算",
    chipCache: "汇率缓存",
    chipNoLogin: "无需登录",
    chipJpy: "含日元",
    chipLangs: "ko/en/ja/zh",
    about:
      "有网络时点一次“刷新汇率”，汇率就保存在这台设备上。之后在飞机上或没有漫游时照样能换算。输入金额、选好两种货币，就会同时看到结果和 1 单位的汇率。",
    sourceNote: "汇率来源：Frankfurter（欧洲央行参考汇率）。银行和兑换点的实际汇率会有差异。",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
  },
};

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://fxpad.try-dabble.com/og-image-ko.png",
  en: "https://fxpad.try-dabble.com/og-image-en.png",
  ja: "https://fxpad.try-dabble.com/og-image-ja.png",
  zh: "https://fxpad.try-dabble.com/og-image-zh.png",
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
