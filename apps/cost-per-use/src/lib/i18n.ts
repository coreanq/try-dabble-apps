/** Ported from the pre-Vite public/js/i18n.js — same copy, now typed. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
/** Unchanged from the pre-Vite app, so a returning visitor keeps their pick. */
export const LANG_KEY = "cpu_lang";

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

export const OG_LOCALE: Record<Lang, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
  zh: "zh_CN",
};

/** No zh sheet was ever drawn for this app, so zh shares the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://cost-per-use.try-dabble.com/og-image.png",
  en: "https://cost-per-use.try-dabble.com/og-image-en.png",
  ja: "https://cost-per-use.try-dabble.com/og-image-ja.png",
  zh: "https://cost-per-use.try-dabble.com/og-image-en.png",
};

export type MsgKey =
  | "title"
  | "localOnly"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "about"
  | "formTitle"
  | "editTitle"
  | "name"
  | "namePh"
  | "price"
  | "pricePh"
  | "currencyHint"
  | "date"
  | "lifetime"
  | "lifetimeUnit"
  | "lifetimeDays"
  | "lifetimeMonths"
  | "lifetimeYears"
  | "lifetimePh"
  | "lifetimeHint"
  | "lifetimeHintShort"
  | "uses"
  | "usesPh"
  | "save"
  | "update"
  | "cancel"
  | "listTitle"
  | "empty"
  | "costPerDay"
  | "costPerDaySoFar"
  | "costPerUse"
  | "daysOwned"
  | "lifetimeLabel"
  | "usesCount"
  | "noUses"
  | "edit"
  | "delete"
  | "previewDay"
  | "previewUse"
  | "previewTitle"
  | "needUse"
  | "today"
  | "saved"
  | "deleted"
  | "privacy"
  | "terms"
  | "adPlaceholder"
  | "langLabel"
  | "invalid"
  | "deleteConfirm"
  | "deleteBody"
  | "sortLabel"
  | "sortRecent"
  | "sortPerDay"
  | "sortName"
  | "itemsCount";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  en: {
    title: "Cost-per-use Calculator",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    shortName: "Cost/Use",
    tagline: "See what each day and each use really costs",
    metaDescription:
      "Free cost-per-use and cost-per-day calculator. Enter price, purchase date, and expected lifespan to learn the true daily and per-use cost of anything you buy.",
    about:
      "Add purchases with price, date, and expected useful life. Daily cost is based on that lifespan (not just days since purchase). Track times used for cost per use. Everything stays on this device.",
    formTitle: "Add item",
    editTitle: "Edit item",
    name: "Item name",
    namePh: "e.g. Winter coat",
    price: "Purchase price",
    pricePh: "0",
    currencyHint: "Currency symbol follows your language",
    date: "Purchase date",
    lifetime: "Expected useful life",
    lifetimeUnit: "Unit",
    lifetimeDays: "Days",
    lifetimeMonths: "Months",
    lifetimeYears: "Years",
    lifetimePh: "e.g. 1",
    lifetimeHint:
      "Set expected useful life for a sensible daily cost (especially when purchased today).",
    lifetimeHintShort: "Set useful life",
    uses: "Times used (optional)",
    usesPh: "e.g. 12",
    save: "Save",
    update: "Update",
    cancel: "Cancel",
    listTitle: "Your items",
    empty: "No items yet. Add your first purchase above.",
    costPerDay: "Cost / day",
    costPerDaySoFar: "So far / day",
    costPerUse: "Cost / use",
    daysOwned: "{n} days owned",
    lifetimeLabel: "Life: {n} {unit}",
    usesCount: "{n} uses",
    noUses: "No uses tracked",
    edit: "Edit",
    delete: "Delete",
    previewDay: "Cost / day",
    previewUse: "Cost / use",
    previewTitle: "Running total",
    needUse: "Add times used",
    today: "Today",
    saved: "Saved",
    deleted: "Deleted",
    privacy: "Privacy",
    terms: "Terms",
    adPlaceholder: "Ad",
    langLabel: "Language",
    invalid: "Please enter a name, price, and purchase date.",
    deleteConfirm: "Delete “{name}”?",
    deleteBody: "This entry is removed from this device. It cannot be undone.",
    sortLabel: "Sort",
    sortRecent: "Newest",
    sortPerDay: "Highest / day",
    sortName: "Name",
    itemsCount: "{n} entries",
  },
  ko: {
    title: "사용단가 계산기",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    shortName: "사용단가",
    tagline: "하루·1회 사용 비용을 바로 확인",
    metaDescription:
      "구매 가격, 구매일, 예상 사용 기간으로 하루·1회 사용 비용을 계산하는 무료 사용단가 계산기. 데이터는 브라우저에만 저장됩니다.",
    about:
      "물품 이름, 구매 가격, 구매일, 예상 사용 기간을 입력하면 수명 기준 하루 비용과(사용 횟수 입력 시) 1회 사용 비용을 보여 줍니다. 모든 데이터는 이 기기에만 저장됩니다.",
    formTitle: "물품 추가",
    editTitle: "물품 수정",
    name: "물품 이름",
    namePh: "예: 패딩 점퍼",
    price: "구매 가격",
    pricePh: "0",
    currencyHint: "한국어는 원(₩)으로 표시",
    date: "구매일",
    lifetime: "예상 사용 기간",
    lifetimeUnit: "단위",
    lifetimeDays: "일",
    lifetimeMonths: "개월",
    lifetimeYears: "년",
    lifetimePh: "예: 1",
    lifetimeHint: "합리적인 하루 비용을 위해 예상 사용 기간을 입력하세요(특히 오늘 구매한 경우).",
    lifetimeHintShort: "사용 기간 입력 권장",
    uses: "사용 횟수 (선택)",
    usesPh: "예: 12",
    save: "저장",
    update: "수정 완료",
    cancel: "취소",
    listTitle: "내 목록",
    empty: "아직 항목이 없습니다. 위에서 첫 구매를 추가해 보세요.",
    costPerDay: "하루 비용",
    costPerDaySoFar: "지금까지 하루",
    costPerUse: "1회 비용",
    daysOwned: "{n}일 보유",
    lifetimeLabel: "수명: {n}{unit}",
    usesCount: "{n}회 사용",
    noUses: "사용 횟수 없음",
    edit: "수정",
    delete: "삭제",
    previewDay: "하루 비용",
    previewUse: "1회 비용",
    previewTitle: "계산 결과",
    needUse: "사용 횟수 입력",
    today: "오늘",
    saved: "저장됨",
    deleted: "삭제됨",
    privacy: "개인정보",
    terms: "이용약관",
    adPlaceholder: "광고",
    langLabel: "언어",
    invalid: "이름, 가격, 구매일을 입력해 주세요.",
    deleteConfirm: "“{name}”을(를) 삭제할까요?",
    deleteBody: "이 기기에서 항목이 지워집니다. 되돌릴 수 없습니다.",
    sortLabel: "정렬",
    sortRecent: "최근 구매",
    sortPerDay: "하루 비용 높은순",
    sortName: "이름순",
    itemsCount: "{n}개 항목",
  },
  zh: {
    title: "单次使用成本计算器",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    shortName: "使用成本",
    tagline: "查看每天和每次使用的真实成本",
    metaDescription:
      "免费的单次使用成本与每日成本计算器。输入价格、购买日期与预期使用寿命，了解物品的真实日均与单次成本。",
    about:
      "输入物品名称、价格、购买日期与预期使用寿命，即可按寿命计算每日成本；若填写使用次数，还会显示单次成本。数据仅保存在本设备。",
    formTitle: "添加物品",
    editTitle: "编辑物品",
    name: "物品名称",
    namePh: "例如：冬季外套",
    price: "购买价格",
    pricePh: "0",
    currencyHint: "货币符号随语言变化",
    date: "购买日期",
    lifetime: "预期使用寿命",
    lifetimeUnit: "单位",
    lifetimeDays: "天",
    lifetimeMonths: "月",
    lifetimeYears: "年",
    lifetimePh: "例如：1",
    lifetimeHint: "请填写预期使用寿命以获得合理的每日成本（尤其是今天刚购买时）。",
    lifetimeHintShort: "建议填写使用寿命",
    uses: "使用次数（可选）",
    usesPh: "例如：12",
    save: "保存",
    update: "更新",
    cancel: "取消",
    listTitle: "我的列表",
    empty: "暂无物品。请先在上方添加一次购买。",
    costPerDay: "每日成本",
    costPerDaySoFar: "至今每日",
    costPerUse: "单次成本",
    daysOwned: "{n}天持有",
    lifetimeLabel: "寿命：{n}{unit}",
    usesCount: "使用 {n} 次",
    noUses: "未记录使用次数",
    edit: "编辑",
    delete: "删除",
    previewDay: "每日成本",
    previewUse: "单次成本",
    previewTitle: "计算结果",
    needUse: "请填写使用次数",
    today: "今天",
    saved: "已保存",
    deleted: "已删除",
    privacy: "隐私",
    terms: "条款",
    adPlaceholder: "广告",
    langLabel: "语言",
    invalid: "请填写名称、价格和购买日期。",
    deleteConfirm: "删除“{name}”？",
    deleteBody: "该条目将从此设备移除，且无法恢复。",
    sortLabel: "排序",
    sortRecent: "最近购买",
    sortPerDay: "每日成本高",
    sortName: "名称",
    itemsCount: "{n} 条记录",
  },
  ja: {
    title: "1回あたり費用計算機",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    shortName: "使用単価",
    tagline: "1日・1回あたりの本当のコストを確認",
    metaDescription:
      "購入価格・購入日・想定使用期間で1日あたり・1回あたりの費用を計算する無料ツール。データはこの端末にのみ保存されます。",
    about:
      "品名・購入価格・購入日・想定使用期間を入力すると、寿命に基づく1日あたり費用と（使用回数入力時）1回あたり費用を表示します。データはこの端末のみに保存されます。",
    formTitle: "アイテム追加",
    editTitle: "アイテム編集",
    name: "品名",
    namePh: "例：ダウンジャケット",
    price: "購入価格",
    pricePh: "0",
    currencyHint: "通貨記号は言語に合わせて表示",
    date: "購入日",
    lifetime: "想定使用期間",
    lifetimeUnit: "単位",
    lifetimeDays: "日",
    lifetimeMonths: "か月",
    lifetimeYears: "年",
    lifetimePh: "例：1",
    lifetimeHint: "妥当な1日あたり費用のため、想定使用期間を入力してください（特に今日購入した場合）。",
    lifetimeHintShort: "使用期間の入力を推奨",
    uses: "使用回数（任意）",
    usesPh: "例：12",
    save: "保存",
    update: "更新",
    cancel: "キャンセル",
    listTitle: "マイリスト",
    empty: "まだアイテムがありません。上から最初の購入を追加してください。",
    costPerDay: "1日あたり",
    costPerDaySoFar: "現時点の1日",
    costPerUse: "1回あたり",
    daysOwned: "{n}日所有",
    lifetimeLabel: "寿命: {n}{unit}",
    usesCount: "{n}回使用",
    noUses: "使用回数なし",
    edit: "編集",
    delete: "削除",
    previewDay: "1日あたり",
    previewUse: "1回あたり",
    previewTitle: "計算結果",
    needUse: "使用回数を入力",
    today: "今日",
    saved: "保存しました",
    deleted: "削除しました",
    privacy: "プライバシー",
    terms: "利用規約",
    adPlaceholder: "広告",
    langLabel: "言語",
    invalid: "名前・価格・購入日を入力してください。",
    deleteConfirm: "「{name}」を削除しますか？",
    deleteBody: "この端末から項目が削除されます。元に戻せません。",
    sortLabel: "並び替え",
    sortRecent: "新しい順",
    sortPerDay: "1日あたり高い順",
    sortName: "名前順",
    itemsCount: "{n}件",
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
 * ?lang= wins — the language combo writes it there, so a pick beats everything
 * below — then the td_lang cookie (so hops between try-dabble subdomains keep
 * the chosen language), then this app's saved cpu_lang, then the browser. The
 * Worker only sees the query and the cookie, so those two must outrank
 * localStorage or the first HTML and the mounted app would disagree.
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

export type Translate = (key: MsgKey, vars?: Record<string, string | number>) => string;
