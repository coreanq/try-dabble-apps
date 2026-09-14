/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "paypad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://paypad.try-dabble.com/og-image-ko.png",
  en: "https://paypad.try-dabble.com/og-image-en.png",
  ja: "https://paypad.try-dabble.com/og-image-ja.png",
  zh: "https://paypad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoCap"
  | "chipNoPlus"
  | "chipNoAccount"
  | "chipAuto"
  | "chipViews"
  | "chipBackup"
  | "chipNoAds"
  | "chipFree"
  | "chipLocal"
  | "chipLangs"
  | "planLabel"
  | "planNew"
  | "planRename"
  | "planDuplicate"
  | "planDelete"
  | "planNamePlaceholder"
  | "planDefaultName"
  | "planCopySuffix"
  | "planNewTitle"
  | "planRenameTitle"
  | "deletePlanTitle"
  | "deletePlanBody"
  | "planCreated"
  | "planRenamed"
  | "planDuplicated"
  | "planDeleted"
  | "needPlanName"
  | "incomeMode"
  | "modeBiweekly"
  | "modeMonthly"
  | "modeIrregular"
  | "modeHintBiweekly"
  | "modeHintMonthly"
  | "modeHintIrregular"
  | "currencyLabel"
  | "viewMonthly"
  | "viewAnnual"
  | "prevPeriod"
  | "nextPeriod"
  | "jumpToday"
  | "earningsTitle"
  | "addEarning"
  | "editEarning"
  | "fieldAmount"
  | "fieldDate"
  | "fieldLabel"
  | "fieldCurrency"
  | "labelPlaceholder"
  | "labelDefaultBiweekly"
  | "labelDefaultMonthly"
  | "labelDefaultIrregular"
  | "earningAdded"
  | "earningSaved"
  | "earningDeleted"
  | "earningsEmpty"
  | "earningsEmptyAnnual"
  | "needAmount"
  | "needDate"
  | "otherCurrencyNote"
  | "earningsCount"
  | "deleteEarningTitle"
  | "deleteEarningBody"
  | "envelopesTitle"
  | "addEnvelope"
  | "editEnvelope"
  | "fieldName"
  | "fieldKind"
  | "kindPercent"
  | "kindFixed"
  | "fieldPercent"
  | "fieldFixed"
  | "fieldCategory"
  | "catSavings"
  | "catDebt"
  | "catBills"
  | "catSinking"
  | "catFlexible"
  | "envelopeSaved"
  | "envelopeDeleted"
  | "envelopesEmpty"
  | "envelopeNamePlaceholder"
  | "needName"
  | "needValue"
  | "unlimitedHint"
  | "ofIncome"
  | "perMonthFixed"
  | "deleteEnvelopeTitle"
  | "deleteEnvelopeBody"
  | "moveUp"
  | "moveDown"
  | "totalsTitle"
  | "totalIncome"
  | "totalAllocated"
  | "totalBuffer"
  | "totalOverflow"
  | "overWarn"
  | "percentSum"
  | "chartTitle"
  | "chartAllocated"
  | "chartBuffer"
  | "byCategory"
  | "noIncomeYet"
  | "annualMonths"
  | "annualHint"
  | "activeMonths"
  | "backupTitle"
  | "backupHint"
  | "exportJson"
  | "importJson"
  | "clearAll"
  | "exported"
  | "importBad"
  | "importOk"
  | "importConfirmTitle"
  | "importConfirmBody"
  | "clearAllTitle"
  | "clearAllBody"
  | "cleared"
  | "starterSavings"
  | "starterBills"
  | "starterDebt"
  | "starterSinking"
  | "starterFun"
  | "save"
  | "cancel"
  | "edit"
  | "delete"
  | "close"
  | "privacy"
  | "terms"
  | "guide"
  | "promiseTitle";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "페이패드",
    shortName: "페이패드",
    tagline: "무료 로컬 비정기 수입 봉투 예산. 들어온 수입을 기록하고 %·고정 봉투로 나눕니다. 월·연 보기. 수입 추가 시 자동 재계산. JSON 백업. 계정 없음. 광고 없음.",
    metaDescription:
      "무료 로컬 비정기 수입 봉투 예산 앱. 프리랜서·긱·부업 수입이 들어올 때마다 기록하면 %·고정 봉투(저축·부채·고정비·적립·자유)가 즉시 다시 계산됩니다. 이름 있는 급여 플랜 여러 개(이름 변경·복제·삭제), 격주·월·비정기 수입 모드, 통화별 합계(환율 지어내지 않음), 남는 돈은 버퍼로, 월·연 보기, JSON 백업. 봉투 개수 무제한, Plus 결제 없음, 계정 없음, 광고 없음. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 봉투 개수 제한과 Plus 결제 없음.",
    langLabel: "언어",
    chipNoCap: "봉투 개수 무제한",
    chipNoPlus: "Plus 결제 없음",
    chipNoAccount: "계정 없음",
    chipAuto: "수입 추가 시 자동 재계산",
    chipViews: "월·연 보기",
    chipBackup: "JSON 백업",
    chipNoAds: "도구 화면 광고 없음",
    chipFree: "영원히 무료",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    planLabel: "플랜",
    planNew: "새 플랜",
    planRename: "이름 변경",
    planDuplicate: "복제",
    planDelete: "삭제",
    planNamePlaceholder: "예: 프리랜서 수입, 본업 급여",
    planDefaultName: "내 플랜",
    planCopySuffix: " (복사본)",
    planNewTitle: "새 플랜 만들기",
    planRenameTitle: "플랜 이름 변경",
    deletePlanTitle: "이 플랜을 삭제할까요?",
    deletePlanBody: "플랜과 그 안의 수입·봉투가 모두 이 기기에서 지워집니다. 먼저 JSON 백업을 받아 두세요.",
    planCreated: "플랜을 만들었습니다",
    planRenamed: "이름을 바꿨습니다",
    planDuplicated: "봉투를 포함해 복제했습니다 (수입은 비어 있음)",
    planDeleted: "플랜을 삭제했습니다",
    needPlanName: "플랜 이름을 적어 주세요",
    incomeMode: "수입 방식",
    modeBiweekly: "격주 급여",
    modeMonthly: "월급",
    modeIrregular: "비정기",
    modeHintBiweekly: "2주마다 급여가 들어옵니다. 월 보기에는 그달에 받은 급여를 모두 합산합니다.",
    modeHintMonthly: "한 달에 한 번 급여가 들어옵니다. 월 보기가 곧 이번 급여의 봉투입니다.",
    modeHintIrregular: "수입이 들어올 때마다 기록하세요. 봉투는 그달의 합계에 맞춰 바로 다시 계산됩니다.",
    currencyLabel: "플랜 통화",
    viewMonthly: "월",
    viewAnnual: "연",
    prevPeriod: "이전",
    nextPeriod: "다음",
    jumpToday: "오늘",
    earningsTitle: "수입",
    addEarning: "수입 추가",
    editEarning: "수입 수정",
    fieldAmount: "금액",
    fieldDate: "받은 날짜",
    fieldLabel: "메모 (선택)",
    fieldCurrency: "통화",
    labelPlaceholder: "예: 클라이언트 A, 배달 정산",
    labelDefaultBiweekly: "격주 급여",
    labelDefaultMonthly: "월급",
    labelDefaultIrregular: "수입",
    earningAdded: "수입을 추가했습니다. 봉투를 다시 계산했습니다.",
    earningSaved: "수입을 저장했습니다",
    earningDeleted: "수입을 삭제했습니다",
    earningsEmpty: "이달에 기록한 수입이 없습니다. 들어온 돈을 적으면 % 봉투가 바로 채워집니다.",
    earningsEmptyAnnual: "올해 기록한 수입이 없습니다.",
    needAmount: "0보다 큰 금액을 적어 주세요",
    needDate: "날짜를 골라 주세요",
    otherCurrencyNote: "다른 통화는 따로 합산되며 봉투에 배분되지 않습니다. 환율을 지어내지 않습니다.",
    earningsCount: "{n}건",
    deleteEarningTitle: "이 수입을 삭제할까요?",
    deleteEarningBody: "봉투가 그에 맞춰 다시 계산됩니다.",
    envelopesTitle: "봉투",
    addEnvelope: "봉투 추가",
    editEnvelope: "봉투 수정",
    fieldName: "이름",
    fieldKind: "방식",
    kindPercent: "수입의 %",
    kindFixed: "고정 금액",
    fieldPercent: "비율 (%)",
    fieldFixed: "금액",
    fieldCategory: "분류",
    catSavings: "저축",
    catDebt: "부채",
    catBills: "고정비",
    catSinking: "적립",
    catFlexible: "자유",
    envelopeSaved: "봉투를 저장했습니다",
    envelopeDeleted: "봉투를 삭제했습니다",
    envelopesEmpty: "봉투가 없습니다. 원하는 만큼 추가하세요. 개수 제한이 없습니다.",
    envelopeNamePlaceholder: "예: 비상금, 월세, 세금",
    needName: "봉투 이름을 적어 주세요",
    needValue: "0 이상의 값을 적어 주세요",
    unlimitedHint: "봉투 개수에 제한이 없습니다. Plus 결제도 없습니다.",
    ofIncome: "수입의 {p}",
    perMonthFixed: "고정",
    deleteEnvelopeTitle: "이 봉투를 삭제할까요?",
    deleteEnvelopeBody: "합계와 버퍼가 다시 계산됩니다.",
    moveUp: "위로",
    moveDown: "아래로",
    totalsTitle: "합계",
    totalIncome: "수입",
    totalAllocated: "봉투 배분",
    totalBuffer: "버퍼 · 다음 급여로",
    totalOverflow: "초과 배분",
    overWarn: "봉투 합이 수입보다 {amt} 많습니다. 고정 봉투를 줄이거나 수입을 더 기록하세요.",
    percentSum: "% 봉투 합계 {p}",
    chartTitle: "배분 vs 버퍼",
    chartAllocated: "배분",
    chartBuffer: "버퍼",
    byCategory: "분류별",
    noIncomeYet: "아직 수입이 없어 % 봉투는 0입니다. 고정 봉투만 배분됩니다.",
    annualMonths: "월별",
    annualHint: "연 보기는 12개월을 합산합니다. % 봉투는 연 수입에, 고정 봉투는 수입이 있던 달마다 한 번씩 계산합니다.",
    activeMonths: "수입 있는 달 {n}",
    backupTitle: "백업",
    backupHint: "플랜·수입·봉투를 JSON 파일로 내려받거나 되돌립니다. 파일은 이 기기에만 만들어지고 어디에도 보내지 않습니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    clearAll: "모두 삭제",
    exported: "JSON을 내려받았습니다",
    importBad: "읽을 수 있는 백업이 아닙니다",
    importOk: "플랜 {n}개, 봉투 {e}개, 수입 {i}건을 되돌렸습니다",
    importConfirmTitle: "백업을 가져올까요?",
    importConfirmBody: "지금 이 기기의 플랜·수입·봉투가 백업 내용으로 바뀝니다.",
    clearAllTitle: "모두 삭제할까요?",
    clearAllBody: "이 기기의 모든 플랜·수입·봉투가 지워집니다. 되돌릴 수 없습니다.",
    cleared: "모두 삭제했습니다",
    starterSavings: "비상금",
    starterBills: "월세·공과금",
    starterDebt: "대출 상환",
    starterSinking: "세금 적립",
    starterFun: "자유 지출",
    save: "저장",
    cancel: "취소",
    edit: "수정",
    delete: "삭제",
    close: "닫기",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
    promiseTitle: "약속",
  },
  en: {
    title: "Paypad",
    shortName: "Paypad",
    tagline: "Free local irregular-income envelope budget. Log earnings as they land, split into % or fixed envelopes, monthly and annual views. Auto-recomputes when you add income. JSON backup. No account. No ads.",
    metaDescription:
      "Free local envelope budget for irregular income. Log freelance, gig or side earnings as they land and your % or fixed envelopes (savings, debt, bills, sinking, flexible) recompute instantly. Several named paycheck plans (rename, duplicate, delete), biweekly / monthly / irregular income modes, totals per currency with no invented FX, leftover to a buffer, monthly and annual views, JSON backup. Unlimited envelopes, no Plus paywall, no account, no ads. Data stays on this device.",
    localOnly: "Your data stays on this device. No login. No ads. Unlimited envelopes — no Plus paywall.",
    langLabel: "Language",
    chipNoCap: "No envelope cap",
    chipNoPlus: "No Plus paywall",
    chipNoAccount: "No account",
    chipAuto: "Auto-recompute on income",
    chipViews: "Monthly + annual",
    chipBackup: "JSON backup",
    chipNoAds: "No ads on tool",
    chipFree: "Free forever",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    planLabel: "Plan",
    planNew: "New plan",
    planRename: "Rename",
    planDuplicate: "Duplicate",
    planDelete: "Delete",
    planNamePlaceholder: "e.g. Freelance income, Day job",
    planDefaultName: "My plan",
    planCopySuffix: " (copy)",
    planNewTitle: "Create a plan",
    planRenameTitle: "Rename plan",
    deletePlanTitle: "Delete this plan?",
    deletePlanBody: "The plan and every earning and envelope in it are removed from this device. Export a JSON backup first.",
    planCreated: "Plan created",
    planRenamed: "Plan renamed",
    planDuplicated: "Duplicated with its envelopes (earnings left empty)",
    planDeleted: "Plan deleted",
    needPlanName: "Give the plan a name",
    incomeMode: "Income mode",
    modeBiweekly: "Biweekly pay",
    modeMonthly: "Monthly pay",
    modeIrregular: "Irregular",
    modeHintBiweekly: "Paid every two weeks. The monthly view adds up every paycheck that landed that month.",
    modeHintMonthly: "Paid once a month. The monthly view is this paycheck's envelopes.",
    modeHintIrregular: "Log each payout as it lands. Envelopes recompute against that month's total right away.",
    currencyLabel: "Plan currency",
    viewMonthly: "Monthly",
    viewAnnual: "Annual",
    prevPeriod: "Previous",
    nextPeriod: "Next",
    jumpToday: "Today",
    earningsTitle: "Earnings",
    addEarning: "Add earning",
    editEarning: "Edit earning",
    fieldAmount: "Amount",
    fieldDate: "Date received",
    fieldLabel: "Label (optional)",
    fieldCurrency: "Currency",
    labelPlaceholder: "e.g. Client A, delivery payout",
    labelDefaultBiweekly: "Paycheck",
    labelDefaultMonthly: "Salary",
    labelDefaultIrregular: "Payout",
    earningAdded: "Earning added. Envelopes recomputed.",
    earningSaved: "Earning saved",
    earningDeleted: "Earning deleted",
    earningsEmpty: "No earnings logged this month. Add what landed and the % envelopes fill in right away.",
    earningsEmptyAnnual: "No earnings logged this year.",
    needAmount: "Enter an amount above 0",
    needDate: "Pick a date",
    otherCurrencyNote: "Other currencies are totalled separately and not split into envelopes. We do not invent exchange rates.",
    earningsCount: "{n} entries",
    deleteEarningTitle: "Delete this earning?",
    deleteEarningBody: "Envelopes recompute to match.",
    envelopesTitle: "Envelopes",
    addEnvelope: "Add envelope",
    editEnvelope: "Edit envelope",
    fieldName: "Name",
    fieldKind: "Kind",
    kindPercent: "% of income",
    kindFixed: "Fixed amount",
    fieldPercent: "Percent (%)",
    fieldFixed: "Amount",
    fieldCategory: "Category",
    catSavings: "Savings",
    catDebt: "Debt",
    catBills: "Bills",
    catSinking: "Sinking fund",
    catFlexible: "Flexible",
    envelopeSaved: "Envelope saved",
    envelopeDeleted: "Envelope deleted",
    envelopesEmpty: "No envelopes yet. Add as many as you like; there is no cap.",
    envelopeNamePlaceholder: "e.g. Emergency fund, Rent, Taxes",
    needName: "Give the envelope a name",
    needValue: "Enter a value of 0 or more",
    unlimitedHint: "Unlimited envelopes. No Plus paywall.",
    ofIncome: "{p} of income",
    perMonthFixed: "fixed",
    deleteEnvelopeTitle: "Delete this envelope?",
    deleteEnvelopeBody: "Totals and the buffer recompute.",
    moveUp: "Move up",
    moveDown: "Move down",
    totalsTitle: "Totals",
    totalIncome: "Income",
    totalAllocated: "Allocated",
    totalBuffer: "Buffer · to next paycheck",
    totalOverflow: "Over-allocated",
    overWarn: "Envelopes exceed income by {amt}. Trim a fixed envelope or log more income.",
    percentSum: "% envelopes add up to {p}",
    chartTitle: "Allocated vs buffer",
    chartAllocated: "Allocated",
    chartBuffer: "Buffer",
    byCategory: "By category",
    noIncomeYet: "No income yet, so % envelopes are 0. Only fixed envelopes are allocated.",
    annualMonths: "By month",
    annualHint: "The annual view adds up twelve months. % envelopes run on the year's income; fixed envelopes count once per month that had income.",
    activeMonths: "{n} months with income",
    backupTitle: "Backup",
    backupHint: "Download plans, earnings and envelopes as a JSON file, or restore one. The file is created on this device and sent nowhere.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    clearAll: "Delete everything",
    exported: "JSON downloaded",
    importBad: "That is not a backup this app can read",
    importOk: "Restored {n} plans, {e} envelopes, {i} earnings",
    importConfirmTitle: "Import this backup?",
    importConfirmBody: "The plans, earnings and envelopes on this device are replaced by the backup.",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Every plan, earning and envelope on this device is removed. This cannot be undone.",
    cleared: "Everything deleted",
    starterSavings: "Emergency fund",
    starterBills: "Rent & bills",
    starterDebt: "Loan payment",
    starterSinking: "Tax set-aside",
    starterFun: "Flexible spending",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    promiseTitle: "Promises",
  },
  ja: {
    title: "ペイパッド",
    shortName: "ペイパッド",
    tagline: "無料のローカル不定期収入エンベロープ予算。入金を記録し％または定額で振り分け。月次・年次表示。収入追加で自動再計算。JSONバックアップ。アカウント不要。広告なし。",
    metaDescription:
      "不定期収入のための無料ローカル封筒予算アプリ。フリーランス・ギグ・副業の入金をその都度記録すると、％または定額の封筒（貯蓄・返済・固定費・積立・自由）が即座に再計算されます。名前付きの給与プランを複数（名前変更・複製・削除）、隔週・月次・不定期の収入モード、通貨ごとの合計（為替は作らない）、余りはバッファへ、月次・年次表示、JSONバックアップ。封筒数無制限、Plus課金なし、アカウント不要、広告なし。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。ログイン・広告なし。封筒数の上限もPlus課金もありません。",
    langLabel: "言語",
    chipNoCap: "封筒数の上限なし",
    chipNoPlus: "Plus課金なし",
    chipNoAccount: "アカウント不要",
    chipAuto: "収入追加で自動再計算",
    chipViews: "月次・年次表示",
    chipBackup: "JSONバックアップ",
    chipNoAds: "ツール画面に広告なし",
    chipFree: "ずっと無料",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    planLabel: "プラン",
    planNew: "新しいプラン",
    planRename: "名前を変更",
    planDuplicate: "複製",
    planDelete: "削除",
    planNamePlaceholder: "例: フリーランス収入、本業の給与",
    planDefaultName: "マイプラン",
    planCopySuffix: " (コピー)",
    planNewTitle: "プランを作成",
    planRenameTitle: "プラン名を変更",
    deletePlanTitle: "このプランを削除しますか？",
    deletePlanBody: "プランと、その中の収入・封筒がすべてこの端末から消えます。先にJSONバックアップを取ってください。",
    planCreated: "プランを作成しました",
    planRenamed: "名前を変更しました",
    planDuplicated: "封筒ごと複製しました（収入は空）",
    planDeleted: "プランを削除しました",
    needPlanName: "プラン名を入力してください",
    incomeMode: "収入モード",
    modeBiweekly: "隔週給与",
    modeMonthly: "月給",
    modeIrregular: "不定期",
    modeHintBiweekly: "2週間ごとに給与が入ります。月次表示ではその月に入った給与をすべて合計します。",
    modeHintMonthly: "月に1回給与が入ります。月次表示がそのまま今回の給与の封筒です。",
    modeHintIrregular: "入金のたびに記録してください。封筒はその月の合計に合わせてすぐ再計算されます。",
    currencyLabel: "プランの通貨",
    viewMonthly: "月次",
    viewAnnual: "年次",
    prevPeriod: "前へ",
    nextPeriod: "次へ",
    jumpToday: "今日",
    earningsTitle: "収入",
    addEarning: "収入を追加",
    editEarning: "収入を編集",
    fieldAmount: "金額",
    fieldDate: "受け取った日",
    fieldLabel: "メモ（任意）",
    fieldCurrency: "通貨",
    labelPlaceholder: "例: クライアントA、配達の精算",
    labelDefaultBiweekly: "給与",
    labelDefaultMonthly: "月給",
    labelDefaultIrregular: "入金",
    earningAdded: "収入を追加しました。封筒を再計算しました。",
    earningSaved: "収入を保存しました",
    earningDeleted: "収入を削除しました",
    earningsEmpty: "今月の収入はまだありません。入金を記録すると％封筒がすぐに埋まります。",
    earningsEmptyAnnual: "今年の収入はまだありません。",
    needAmount: "0より大きい金額を入力してください",
    needDate: "日付を選んでください",
    otherCurrencyNote: "他の通貨は別に合計され、封筒には振り分けません。為替レートは作りません。",
    earningsCount: "{n}件",
    deleteEarningTitle: "この収入を削除しますか？",
    deleteEarningBody: "封筒はそれに合わせて再計算されます。",
    envelopesTitle: "封筒",
    addEnvelope: "封筒を追加",
    editEnvelope: "封筒を編集",
    fieldName: "名前",
    fieldKind: "種類",
    kindPercent: "収入の％",
    kindFixed: "定額",
    fieldPercent: "割合（％）",
    fieldFixed: "金額",
    fieldCategory: "カテゴリ",
    catSavings: "貯蓄",
    catDebt: "返済",
    catBills: "固定費",
    catSinking: "積立",
    catFlexible: "自由",
    envelopeSaved: "封筒を保存しました",
    envelopeDeleted: "封筒を削除しました",
    envelopesEmpty: "封筒がまだありません。好きなだけ追加できます。上限はありません。",
    envelopeNamePlaceholder: "例: 緊急資金、家賃、税金",
    needName: "封筒の名前を入力してください",
    needValue: "0以上の値を入力してください",
    unlimitedHint: "封筒数は無制限。Plus課金もありません。",
    ofIncome: "収入の{p}",
    perMonthFixed: "定額",
    deleteEnvelopeTitle: "この封筒を削除しますか？",
    deleteEnvelopeBody: "合計とバッファが再計算されます。",
    moveUp: "上へ",
    moveDown: "下へ",
    totalsTitle: "合計",
    totalIncome: "収入",
    totalAllocated: "振り分け済み",
    totalBuffer: "バッファ · 次の給与へ",
    totalOverflow: "振り分け超過",
    overWarn: "封筒の合計が収入を{amt}上回っています。定額封筒を減らすか、収入を追加してください。",
    percentSum: "％封筒の合計 {p}",
    chartTitle: "振り分け vs バッファ",
    chartAllocated: "振り分け",
    chartBuffer: "バッファ",
    byCategory: "カテゴリ別",
    noIncomeYet: "まだ収入がないため％封筒は0です。定額封筒だけが振り分けられます。",
    annualMonths: "月別",
    annualHint: "年次表示は12か月を合計します。％封筒は年間収入に、定額封筒は収入のあった月ごとに1回ずつ計算します。",
    activeMonths: "収入のある月 {n}",
    backupTitle: "バックアップ",
    backupHint: "プラン・収入・封筒をJSONファイルとしてダウンロード、または復元します。ファイルはこの端末で作られ、どこにも送られません。",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    clearAll: "すべて削除",
    exported: "JSONをダウンロードしました",
    importBad: "このアプリで読めるバックアップではありません",
    importOk: "プラン{n}件、封筒{e}件、収入{i}件を復元しました",
    importConfirmTitle: "このバックアップを読み込みますか？",
    importConfirmBody: "この端末のプラン・収入・封筒がバックアップの内容に置き換わります。",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "この端末のすべてのプラン・収入・封筒が消えます。元に戻せません。",
    cleared: "すべて削除しました",
    starterSavings: "緊急資金",
    starterBills: "家賃・光熱費",
    starterDebt: "ローン返済",
    starterSinking: "税金の積立",
    starterFun: "自由に使うお金",
    save: "保存",
    cancel: "キャンセル",
    edit: "編集",
    delete: "削除",
    close: "閉じる",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    promiseTitle: "約束",
  },
  zh: {
    title: "薪资信封板",
    shortName: "薪资信封板",
    tagline: "免费本地不定期收入信封预算。到账即记，按百分比或固定额分入信封，月/年视图。加收入自动重算。JSON 备份。无需账号。无广告。",
    metaDescription:
      "面向不定期收入的免费本地信封预算应用。自由职业、零工或副业收入到账就记一笔，百分比或固定额信封（储蓄、还债、账单、专项、灵活）立即重新计算。多个命名薪资计划（重命名、复制、删除），双周/月薪/不定期收入模式，按货币分开合计（不编造汇率），余额进入缓冲，月/年视图，JSON 备份。信封数量不限，无 Plus 付费墙，无需账号，无广告。数据仅在此设备。",
    localOnly: "数据仅保存在此设备。无登录、无广告。信封数量不限，无 Plus 付费墙。",
    langLabel: "语言",
    chipNoCap: "信封数量不限",
    chipNoPlus: "无 Plus 付费墙",
    chipNoAccount: "无需账号",
    chipAuto: "加收入自动重算",
    chipViews: "月 + 年视图",
    chipBackup: "JSON 备份",
    chipNoAds: "工具页无广告",
    chipFree: "永久免费",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    planLabel: "计划",
    planNew: "新建计划",
    planRename: "重命名",
    planDuplicate: "复制",
    planDelete: "删除",
    planNamePlaceholder: "例如：自由职业收入、主业工资",
    planDefaultName: "我的计划",
    planCopySuffix: "（副本）",
    planNewTitle: "新建计划",
    planRenameTitle: "重命名计划",
    deletePlanTitle: "删除这个计划？",
    deletePlanBody: "计划及其中的所有收入和信封都会从此设备删除。请先导出 JSON 备份。",
    planCreated: "已创建计划",
    planRenamed: "已重命名",
    planDuplicated: "已连同信封复制（收入留空）",
    planDeleted: "已删除计划",
    needPlanName: "请填写计划名称",
    incomeMode: "收入模式",
    modeBiweekly: "双周薪",
    modeMonthly: "月薪",
    modeIrregular: "不定期",
    modeHintBiweekly: "每两周发一次薪。月视图会把当月到账的每笔薪水加总。",
    modeHintMonthly: "每月发一次薪。月视图就是这笔薪水的信封。",
    modeHintIrregular: "每笔收入到账就记一笔。信封会按当月合计立即重算。",
    currencyLabel: "计划货币",
    viewMonthly: "月",
    viewAnnual: "年",
    prevPeriod: "上一个",
    nextPeriod: "下一个",
    jumpToday: "今天",
    earningsTitle: "收入",
    addEarning: "添加收入",
    editEarning: "编辑收入",
    fieldAmount: "金额",
    fieldDate: "到账日期",
    fieldLabel: "备注（可选）",
    fieldCurrency: "货币",
    labelPlaceholder: "例如：客户 A、外卖结算",
    labelDefaultBiweekly: "薪水",
    labelDefaultMonthly: "月薪",
    labelDefaultIrregular: "收入",
    earningAdded: "已添加收入，信封已重算。",
    earningSaved: "已保存收入",
    earningDeleted: "已删除收入",
    earningsEmpty: "本月还没有记录收入。记下到账的钱，百分比信封会立刻填上。",
    earningsEmptyAnnual: "今年还没有记录收入。",
    needAmount: "请输入大于 0 的金额",
    needDate: "请选择日期",
    otherCurrencyNote: "其他货币单独合计，不会分入信封。我们不编造汇率。",
    earningsCount: "{n} 笔",
    deleteEarningTitle: "删除这笔收入？",
    deleteEarningBody: "信封会相应重算。",
    envelopesTitle: "信封",
    addEnvelope: "添加信封",
    editEnvelope: "编辑信封",
    fieldName: "名称",
    fieldKind: "方式",
    kindPercent: "收入的 %",
    kindFixed: "固定金额",
    fieldPercent: "百分比 (%)",
    fieldFixed: "金额",
    fieldCategory: "分类",
    catSavings: "储蓄",
    catDebt: "还债",
    catBills: "账单",
    catSinking: "专项",
    catFlexible: "灵活",
    envelopeSaved: "已保存信封",
    envelopeDeleted: "已删除信封",
    envelopesEmpty: "还没有信封。想加多少就加多少，没有上限。",
    envelopeNamePlaceholder: "例如：应急金、房租、税款",
    needName: "请填写信封名称",
    needValue: "请输入 0 或以上的数值",
    unlimitedHint: "信封数量不限。没有 Plus 付费墙。",
    ofIncome: "收入的 {p}",
    perMonthFixed: "固定",
    deleteEnvelopeTitle: "删除这个信封？",
    deleteEnvelopeBody: "合计和缓冲会重算。",
    moveUp: "上移",
    moveDown: "下移",
    totalsTitle: "合计",
    totalIncome: "收入",
    totalAllocated: "已分配",
    totalBuffer: "缓冲 · 转入下次薪水",
    totalOverflow: "超额分配",
    overWarn: "信封总额比收入多 {amt}。请减少固定信封或记录更多收入。",
    percentSum: "百分比信封合计 {p}",
    chartTitle: "已分配 vs 缓冲",
    chartAllocated: "已分配",
    chartBuffer: "缓冲",
    byCategory: "按分类",
    noIncomeYet: "还没有收入，百分比信封为 0。只分配固定信封。",
    annualMonths: "按月",
    annualHint: "年视图加总十二个月。百分比信封按全年收入计算；固定信封在每个有收入的月份各算一次。",
    activeMonths: "{n} 个月有收入",
    backupTitle: "备份",
    backupHint: "把计划、收入和信封下载为 JSON 文件，或从文件恢复。文件在此设备生成，不会发送到任何地方。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    clearAll: "全部删除",
    exported: "已下载 JSON",
    importBad: "这不是本应用能读取的备份",
    importOk: "已恢复 {n} 个计划、{e} 个信封、{i} 笔收入",
    importConfirmTitle: "导入这个备份？",
    importConfirmBody: "此设备上的计划、收入和信封会被备份内容替换。",
    clearAllTitle: "全部删除？",
    clearAllBody: "此设备上的所有计划、收入和信封都会被删除，无法撤销。",
    cleared: "已全部删除",
    starterSavings: "应急金",
    starterBills: "房租与账单",
    starterDebt: "贷款还款",
    starterSinking: "税款预留",
    starterFun: "灵活支出",
    save: "保存",
    cancel: "取消",
    edit: "编辑",
    delete: "删除",
    close: "关闭",
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
