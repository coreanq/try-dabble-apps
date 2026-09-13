/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "subpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://subpad.try-dabble.com/og-image-ko.png",
  en: "https://subpad.try-dabble.com/og-image-en.png",
  ja: "https://subpad.try-dabble.com/og-image-ja.png",
  zh: "https://subpad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoAds"
  | "chipUnlimited"
  | "chipNoBank"
  | "chipNoLoginWipe"
  | "chipBackup"
  | "chipCalendar"
  | "chipFree"
  | "chipLocal"
  | "chipLangs"
  | "summaryUpcoming"
  | "summaryUpcomingHint"
  | "summaryMonthly"
  | "summaryYearly"
  | "summaryActive"
  | "noFxNote"
  | "noTotalsYet"
  | "searchPlaceholder"
  | "filterCategory"
  | "filterCurrency"
  | "filterCycle"
  | "filterWindow"
  | "allCategories"
  | "allCurrencies"
  | "allCycles"
  | "windowAll"
  | "window7"
  | "window30"
  | "windowOverdue"
  | "sortLabel"
  | "sortRenewal"
  | "sortName"
  | "sortPrice"
  | "showCancelled"
  | "listTitle"
  | "listCount"
  | "emptyTitle"
  | "emptyBody"
  | "emptyStarter"
  | "noMatch"
  | "addSub"
  | "addFromTemplate"
  | "addBlank"
  | "editSub"
  | "templateTitle"
  | "templateSearch"
  | "templateNone"
  | "templateHint"
  | "fieldName"
  | "fieldPrice"
  | "fieldCurrency"
  | "fieldNext"
  | "fieldCycle"
  | "fieldCategory"
  | "fieldStatus"
  | "fieldNotes"
  | "fieldWebsite"
  | "newCategory"
  | "newCategoryPlaceholder"
  | "cycleWeekly"
  | "cycleMonthly"
  | "cycleQuarterly"
  | "cycleYearly"
  | "perWeek"
  | "perMonth"
  | "perQuarter"
  | "perYear"
  | "statusActive"
  | "statusPaused"
  | "statusCancelled"
  | "dueToday"
  | "dueTomorrow"
  | "dueIn"
  | "overdueBy"
  | "nextOn"
  | "markPaid"
  | "skip"
  | "edit"
  | "delete"
  | "deleteSubTitle"
  | "deleteSubBody"
  | "paidToast"
  | "skippedToast"
  | "savedToast"
  | "deletedToast"
  | "needName"
  | "needPrice"
  | "needDate"
  | "historyTitle"
  | "historyEmpty"
  | "historyPaid"
  | "historySkipped"
  | "historyUnknownSub"
  | "removePayment"
  | "backupTitle"
  | "backupHint"
  | "exportJson"
  | "importJson"
  | "exportIcs"
  | "exportIcsOne"
  | "icsHint"
  | "icsEmpty"
  | "clearAll"
  | "exported"
  | "importBad"
  | "importOk"
  | "importConfirmTitle"
  | "importConfirmBody"
  | "clearAllTitle"
  | "clearAllBody"
  | "cleared"
  | "save"
  | "cancel"
  | "close"
  | "privacy"
  | "terms"
  | "guide"
  | "tabList"
  | "tabHistory"
  | "tabBackup"
  | "defaultCurrency"
  | "promiseTitle"
  | "categoryLabel";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "섭패드",
    shortName: "섭패드",
    tagline: "무료 로컬 구독·청구 기록. 가격과 다음 갱신일, 월·연 합계, 템플릿, 결제 기록, JSON 백업, 달력보내기. 은행 연동 없음. 계정 없음. 광고 없음.",
    metaDescription:
      "은행 연동 없는 무료 로컬 구독·청구 기록. 구독마다 가격, 통화, 다음 갱신일, 결제 주기를 적으면 남은 날짜와 월·연 합계를 통화별로 보여 줍니다. 환율은 지어내지 않습니다. 넷플릭스·스포티파이·iCloud+·ChatGPT 같은 검색 가능한 템플릿과 카테고리, 앱에 내장된 브랜드 타일, 결제 완료·건너뛰기 기록, 검색·필터, JSON 백업, OS 알림용 달력(.ics) 내보내기. 목록 무제한. 계정 없음, 광고 없음. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 은행 연동·로그인·광고 없음. 환율을 지어내지 않습니다.",
    langLabel: "언어",
    chipNoAds: "사용 중 광고 없음",
    chipUnlimited: "목록 무제한",
    chipNoBank: "은행 연동 없음",
    chipNoLoginWipe: "로그인 초기화 없음",
    chipBackup: "JSON 백업",
    chipCalendar: "달력 내보내기",
    chipFree: "영원히 무료",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    summaryUpcoming: "7일 안 갱신",
    summaryUpcomingHint: "지난 것 {overdue}건",
    summaryMonthly: "월 합계",
    summaryYearly: "연 합계",
    summaryActive: "활성 구독 {n}개",
    noFxNote: "합계는 통화별로 따로 둡니다. 환율을 지어내지 않습니다.",
    noTotalsYet: "구독을 추가하면 통화별 합계가 여기 나옵니다.",
    searchPlaceholder: "이름·메모 검색",
    filterCategory: "카테고리",
    filterCurrency: "통화",
    filterCycle: "주기",
    filterWindow: "기간",
    allCategories: "모든 카테고리",
    allCurrencies: "모든 통화",
    allCycles: "모든 주기",
    windowAll: "전체",
    window7: "7일 안",
    window30: "30일 안",
    windowOverdue: "지난 갱신",
    sortLabel: "정렬",
    sortRenewal: "갱신일순",
    sortName: "이름순",
    sortPrice: "가격순",
    showCancelled: "취소된 것도 보기",
    listTitle: "구독 목록",
    listCount: "{n}개",
    emptyTitle: "아직 구독이 없습니다",
    emptyBody: "템플릿에서 고르거나 직접 적어 넣으세요. 개수 제한은 없습니다.",
    emptyStarter: "바로 추가",
    noMatch: "필터에 맞는 구독이 없습니다.",
    addSub: "구독 추가",
    addFromTemplate: "템플릿에서",
    addBlank: "직접 입력",
    editSub: "구독 편집",
    templateTitle: "템플릿 고르기",
    templateSearch: "서비스 검색 (예: 넷플릭스, VPN)",
    templateNone: "맞는 템플릿이 없습니다. 직접 입력으로 추가하세요.",
    templateHint: "브랜드 타일은 앱에 내장되어 있습니다. 인터넷에서 로고를 가져오지 않습니다.",
    fieldName: "이름",
    fieldPrice: "가격",
    fieldCurrency: "통화",
    fieldNext: "다음 갱신일",
    fieldCycle: "결제 주기",
    fieldCategory: "카테고리",
    fieldStatus: "상태",
    fieldNotes: "메모 (선택)",
    fieldWebsite: "웹사이트 (선택)",
    newCategory: "새 카테고리",
    newCategoryPlaceholder: "새 카테고리 이름",
    cycleWeekly: "매주",
    cycleMonthly: "매월",
    cycleQuarterly: "분기",
    cycleYearly: "매년",
    perWeek: "/주",
    perMonth: "/월",
    perQuarter: "/분기",
    perYear: "/년",
    statusActive: "활성",
    statusPaused: "일시정지",
    statusCancelled: "취소됨",
    dueToday: "오늘 갱신",
    dueTomorrow: "내일 갱신",
    dueIn: "{n}일 후",
    overdueBy: "{n}일 지남",
    nextOn: "다음: {date}",
    markPaid: "결제 완료",
    skip: "건너뛰기",
    edit: "편집",
    delete: "삭제",
    deleteSubTitle: "이 구독을 삭제할까요?",
    deleteSubBody: "결제 기록도 함께 지워집니다. 되돌릴 수 없습니다.",
    paidToast: "결제 기록 추가. 다음 갱신일이 한 주기 미뤄졌습니다.",
    skippedToast: "건너뛰기 기록. 다음 갱신일이 한 주기 미뤄졌습니다.",
    savedToast: "저장했습니다.",
    deletedToast: "삭제했습니다.",
    needName: "이름을 적어 주세요.",
    needPrice: "가격은 0 이상의 숫자여야 합니다.",
    needDate: "다음 갱신일을 골라 주세요.",
    historyTitle: "결제 기록",
    historyEmpty: "아직 기록이 없습니다. 목록에서 ‘결제 완료’나 ‘건너뛰기’를 누르면 여기 쌓입니다.",
    historyPaid: "결제",
    historySkipped: "건너뜀",
    historyUnknownSub: "(삭제된 구독)",
    removePayment: "기록 삭제",
    backupTitle: "백업과 달력",
    backupHint: "JSON 파일 하나에 구독, 결제 기록, 카테고리가 모두 들어갑니다. 다른 기기로 옮기거나 재설치 뒤 불러오세요. { services: [...] } 같은 단순한 형태도 읽습니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 불러오기",
    exportIcs: "달력(.ics) 내보내기",
    exportIcsOne: "달력",
    icsHint: "활성 구독마다 반복 일정과 하루 전 알림이 들어갑니다. 파일을 열면 OS 달력이 알려 줍니다.",
    icsEmpty: "내보낼 활성 구독이 없습니다.",
    clearAll: "모두 삭제",
    exported: "파일을 내려받았습니다.",
    importBad: "읽을 수 없는 파일입니다.",
    importOk: "{n}개 구독을 불러왔습니다.",
    importConfirmTitle: "백업을 불러올까요?",
    importConfirmBody: "지금 목록을 파일 내용으로 바꿉니다. 먼저 내보내기를 해 두면 안전합니다.",
    clearAllTitle: "모두 삭제할까요?",
    clearAllBody: "이 기기의 구독, 결제 기록, 카테고리를 전부 지웁니다. 되돌릴 수 없습니다.",
    cleared: "모두 삭제했습니다.",
    save: "저장",
    cancel: "취소",
    close: "닫기",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
    tabList: "목록",
    tabHistory: "기록",
    tabBackup: "백업",
    defaultCurrency: "기본 통화",
    promiseTitle: "약속",
    categoryLabel: "카테고리",
  },
  en: {
    title: "Subpad",
    shortName: "Subpad",
    tagline: "Free local subscription tracker. Price, next renewal, monthly and yearly totals, templates, payment history, JSON backup, calendar export. No bank link. No account. No ads.",
    metaDescription:
      "Free local subscription and bill tracker with no bank link. Give each subscription a price, currency, next renewal and billing cycle and see days until renewal plus monthly and yearly totals per currency. No invented exchange rates. Searchable templates and categories for Netflix, Spotify, iCloud+, ChatGPT and more, brand tiles baked into the app, paid and skipped history, search and filters, JSON backup, and a calendar (.ics) export for OS reminders. Unlimited list. No account, no ads. Data stays on this device.",
    localOnly: "Your data stays on this device. No bank link. No login. No ads. We do not invent exchange rates.",
    langLabel: "Language",
    chipNoAds: "No ads mid-use",
    chipUnlimited: "Unlimited list",
    chipNoBank: "No bank link",
    chipNoLoginWipe: "No login wipe",
    chipBackup: "JSON backup",
    chipCalendar: "Calendar export",
    chipFree: "Free forever",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    summaryUpcoming: "Renew in 7 days",
    summaryUpcomingHint: "{overdue} overdue",
    summaryMonthly: "Monthly total",
    summaryYearly: "Yearly total",
    summaryActive: "{n} active",
    noFxNote: "Totals stay in each currency. We do not invent exchange rates.",
    noTotalsYet: "Add a subscription and totals per currency appear here.",
    searchPlaceholder: "Search name or notes",
    filterCategory: "Category",
    filterCurrency: "Currency",
    filterCycle: "Cycle",
    filterWindow: "Window",
    allCategories: "All categories",
    allCurrencies: "All currencies",
    allCycles: "All cycles",
    windowAll: "Any date",
    window7: "Next 7 days",
    window30: "Next 30 days",
    windowOverdue: "Overdue",
    sortLabel: "Sort",
    sortRenewal: "By renewal",
    sortName: "By name",
    sortPrice: "By price",
    showCancelled: "Show cancelled",
    listTitle: "Subscriptions",
    listCount: "{n} items",
    emptyTitle: "No subscriptions yet",
    emptyBody: "Pick a template or type one in. There is no limit on how many you keep.",
    emptyStarter: "Quick add",
    noMatch: "Nothing matches these filters.",
    addSub: "Add subscription",
    addFromTemplate: "From template",
    addBlank: "Type it in",
    editSub: "Edit subscription",
    templateTitle: "Pick a template",
    templateSearch: "Search services (e.g. Netflix, VPN)",
    templateNone: "No template matches. Use “Type it in” instead.",
    templateHint: "Brand tiles are built into the app. No logo is fetched from the internet.",
    fieldName: "Name",
    fieldPrice: "Price",
    fieldCurrency: "Currency",
    fieldNext: "Next renewal",
    fieldCycle: "Billing cycle",
    fieldCategory: "Category",
    fieldStatus: "Status",
    fieldNotes: "Notes (optional)",
    fieldWebsite: "Website (optional)",
    newCategory: "New category",
    newCategoryPlaceholder: "New category name",
    cycleWeekly: "Weekly",
    cycleMonthly: "Monthly",
    cycleQuarterly: "Quarterly",
    cycleYearly: "Yearly",
    perWeek: "/wk",
    perMonth: "/mo",
    perQuarter: "/qtr",
    perYear: "/yr",
    statusActive: "Active",
    statusPaused: "Paused",
    statusCancelled: "Cancelled",
    dueToday: "Renews today",
    dueTomorrow: "Renews tomorrow",
    dueIn: "In {n} days",
    overdueBy: "{n} days overdue",
    nextOn: "Next: {date}",
    markPaid: "Mark paid",
    skip: "Skip",
    edit: "Edit",
    delete: "Delete",
    deleteSubTitle: "Delete this subscription?",
    deleteSubBody: "Its payment history goes with it. This cannot be undone.",
    paidToast: "Payment recorded. Next renewal moved one cycle ahead.",
    skippedToast: "Skip recorded. Next renewal moved one cycle ahead.",
    savedToast: "Saved.",
    deletedToast: "Deleted.",
    needName: "Please enter a name.",
    needPrice: "Price must be a number of 0 or more.",
    needDate: "Please pick the next renewal date.",
    historyTitle: "Payment history",
    historyEmpty: "Nothing yet. Press “Mark paid” or “Skip” on a subscription and it lands here.",
    historyPaid: "Paid",
    historySkipped: "Skipped",
    historyUnknownSub: "(deleted subscription)",
    removePayment: "Remove entry",
    backupTitle: "Backup and calendar",
    backupHint: "One JSON file holds subscriptions, payment history and categories. Move it to another device or restore after a reinstall. Simple shapes like { services: [...] } are accepted too.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exportIcs: "Export calendar (.ics)",
    exportIcsOne: "Calendar",
    icsHint: "Every active subscription becomes a repeating event with a reminder one day before. Open the file and your OS calendar does the nagging.",
    icsEmpty: "No active subscription to export.",
    clearAll: "Delete everything",
    exported: "File downloaded.",
    importBad: "That file could not be read.",
    importOk: "Imported {n} subscriptions.",
    importConfirmTitle: "Import this backup?",
    importConfirmBody: "The current list will be replaced by the file. Export first if you want to keep it.",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Removes every subscription, payment and category on this device. This cannot be undone.",
    cleared: "Everything deleted.",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    tabList: "List",
    tabHistory: "History",
    tabBackup: "Backup",
    defaultCurrency: "Default currency",
    promiseTitle: "Promises",
    categoryLabel: "Category",
  },
  ja: {
    title: "サブパッド",
    shortName: "サブパッド",
    tagline: "無料のローカルサブスク・請求トラッカー。料金と次回更新、月・年合計、テンプレ、支払い履歴、JSONバックアップ、カレンダー出力。銀行連携なし。アカウント不要。広告なし。",
    metaDescription:
      "銀行連携のない無料ローカルサブスク・請求トラッカー。サブスクごとに料金、通貨、次回更新日、支払い周期を入れると、残り日数と通貨ごとの月・年合計が見えます。為替レートは作りません。Netflix・Spotify・iCloud+・ChatGPT などの検索できるテンプレとカテゴリ、アプリ内蔵のブランドタイル、支払い済み・スキップの履歴、検索とフィルタ、JSONバックアップ、OS のリマインダー向けカレンダー（.ics）出力。件数無制限。アカウント不要、広告なし。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。銀行連携・ログイン・広告なし。為替レートは作りません。",
    langLabel: "言語",
    chipNoAds: "利用中の広告なし",
    chipUnlimited: "件数無制限",
    chipNoBank: "銀行連携なし",
    chipNoLoginWipe: "ログインで消えない",
    chipBackup: "JSONバックアップ",
    chipCalendar: "カレンダー出力",
    chipFree: "ずっと無料",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    summaryUpcoming: "7日以内に更新",
    summaryUpcomingHint: "期限切れ {overdue} 件",
    summaryMonthly: "月合計",
    summaryYearly: "年合計",
    summaryActive: "有効 {n} 件",
    noFxNote: "合計は通貨ごとに分けています。為替レートは作りません。",
    noTotalsYet: "サブスクを追加すると通貨ごとの合計がここに出ます。",
    searchPlaceholder: "名前・メモを検索",
    filterCategory: "カテゴリ",
    filterCurrency: "通貨",
    filterCycle: "周期",
    filterWindow: "期間",
    allCategories: "すべてのカテゴリ",
    allCurrencies: "すべての通貨",
    allCycles: "すべての周期",
    windowAll: "すべて",
    window7: "7日以内",
    window30: "30日以内",
    windowOverdue: "期限切れ",
    sortLabel: "並び替え",
    sortRenewal: "更新日順",
    sortName: "名前順",
    sortPrice: "料金順",
    showCancelled: "解約済みも表示",
    listTitle: "サブスク一覧",
    listCount: "{n} 件",
    emptyTitle: "まだサブスクがありません",
    emptyBody: "テンプレから選ぶか、直接入力してください。件数に上限はありません。",
    emptyStarter: "すぐ追加",
    noMatch: "フィルタに合うサブスクがありません。",
    addSub: "サブスクを追加",
    addFromTemplate: "テンプレから",
    addBlank: "直接入力",
    editSub: "サブスクを編集",
    templateTitle: "テンプレを選ぶ",
    templateSearch: "サービスを検索（例: Netflix、VPN）",
    templateNone: "合うテンプレがありません。「直接入力」で追加してください。",
    templateHint: "ブランドタイルはアプリに内蔵。ロゴをインターネットから取得しません。",
    fieldName: "名前",
    fieldPrice: "料金",
    fieldCurrency: "通貨",
    fieldNext: "次回更新日",
    fieldCycle: "支払い周期",
    fieldCategory: "カテゴリ",
    fieldStatus: "状態",
    fieldNotes: "メモ（任意）",
    fieldWebsite: "ウェブサイト（任意）",
    newCategory: "新しいカテゴリ",
    newCategoryPlaceholder: "新しいカテゴリ名",
    cycleWeekly: "毎週",
    cycleMonthly: "毎月",
    cycleQuarterly: "四半期",
    cycleYearly: "毎年",
    perWeek: "/週",
    perMonth: "/月",
    perQuarter: "/四半期",
    perYear: "/年",
    statusActive: "有効",
    statusPaused: "一時停止",
    statusCancelled: "解約済み",
    dueToday: "今日更新",
    dueTomorrow: "明日更新",
    dueIn: "あと {n} 日",
    overdueBy: "{n} 日超過",
    nextOn: "次回: {date}",
    markPaid: "支払い済み",
    skip: "スキップ",
    edit: "編集",
    delete: "削除",
    deleteSubTitle: "このサブスクを削除しますか？",
    deleteSubBody: "支払い履歴も一緒に消えます。元に戻せません。",
    paidToast: "支払いを記録。次回更新日を一周期進めました。",
    skippedToast: "スキップを記録。次回更新日を一周期進めました。",
    savedToast: "保存しました。",
    deletedToast: "削除しました。",
    needName: "名前を入力してください。",
    needPrice: "料金は 0 以上の数字にしてください。",
    needDate: "次回更新日を選んでください。",
    historyTitle: "支払い履歴",
    historyEmpty: "まだ履歴がありません。一覧で「支払い済み」か「スキップ」を押すとここに残ります。",
    historyPaid: "支払い",
    historySkipped: "スキップ",
    historyUnknownSub: "（削除されたサブスク）",
    removePayment: "履歴を削除",
    backupTitle: "バックアップとカレンダー",
    backupHint: "JSON ファイル一つにサブスク、支払い履歴、カテゴリがすべて入ります。別の端末へ移すか、再インストール後に読み込んでください。{ services: [...] } のような簡単な形式も読めます。",
    exportJson: "JSON を書き出す",
    importJson: "JSON を読み込む",
    exportIcs: "カレンダー(.ics)を書き出す",
    exportIcsOne: "カレンダー",
    icsHint: "有効なサブスクごとに繰り返し予定と前日のリマインダーが入ります。ファイルを開けば OS のカレンダーが知らせてくれます。",
    icsEmpty: "書き出す有効なサブスクがありません。",
    clearAll: "すべて削除",
    exported: "ファイルをダウンロードしました。",
    importBad: "読み込めないファイルです。",
    importOk: "{n} 件のサブスクを読み込みました。",
    importConfirmTitle: "バックアップを読み込みますか？",
    importConfirmBody: "今の一覧をファイルの内容に置き換えます。先に書き出しておくと安全です。",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "この端末のサブスク、支払い履歴、カテゴリをすべて消します。元に戻せません。",
    cleared: "すべて削除しました。",
    save: "保存",
    cancel: "キャンセル",
    close: "閉じる",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    tabList: "一覧",
    tabHistory: "履歴",
    tabBackup: "バックアップ",
    defaultCurrency: "既定の通貨",
    promiseTitle: "約束",
    categoryLabel: "カテゴリ",
  },
  zh: {
    title: "续费板",
    shortName: "续费板",
    tagline: "免费本地订阅/账单记录。价格与下次续费、月/年合计、模板、付款记录、JSON 备份、日历导出。无银行连接。无需账号。无广告。",
    metaDescription:
      "无需银行连接的免费本地订阅/账单记录。为每个订阅填上价格、货币、下次续费日和付款周期，就能看到剩余天数以及按货币分开的月/年合计。不编造汇率。Netflix、Spotify、iCloud+、ChatGPT 等可搜索模板与分类，内置品牌图标，已付/跳过记录，搜索与筛选，JSON 备份，以及用于系统提醒的日历（.ics）导出。列表不限数量。无需账号，无广告。数据只留在此设备。",
    localOnly: "数据仅保存在此设备。无银行连接、无登录、无广告。我们不编造汇率。",
    langLabel: "语言",
    chipNoAds: "使用中无广告",
    chipUnlimited: "列表不限数量",
    chipNoBank: "无银行连接",
    chipNoLoginWipe: "不会因登录清空",
    chipBackup: "JSON 备份",
    chipCalendar: "日历导出",
    chipFree: "永久免费",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    summaryUpcoming: "7 天内续费",
    summaryUpcomingHint: "已逾期 {overdue} 项",
    summaryMonthly: "月合计",
    summaryYearly: "年合计",
    summaryActive: "生效中 {n} 项",
    noFxNote: "合计按货币分开。我们不编造汇率。",
    noTotalsYet: "添加订阅后，这里会按货币显示合计。",
    searchPlaceholder: "搜索名称或备注",
    filterCategory: "分类",
    filterCurrency: "货币",
    filterCycle: "周期",
    filterWindow: "时间",
    allCategories: "全部分类",
    allCurrencies: "全部货币",
    allCycles: "全部周期",
    windowAll: "全部",
    window7: "7 天内",
    window30: "30 天内",
    windowOverdue: "已逾期",
    sortLabel: "排序",
    sortRenewal: "按续费日",
    sortName: "按名称",
    sortPrice: "按价格",
    showCancelled: "显示已取消",
    listTitle: "订阅列表",
    listCount: "{n} 项",
    emptyTitle: "还没有订阅",
    emptyBody: "从模板里选，或者直接输入。数量没有上限。",
    emptyStarter: "快速添加",
    noMatch: "没有符合筛选条件的订阅。",
    addSub: "添加订阅",
    addFromTemplate: "从模板",
    addBlank: "直接输入",
    editSub: "编辑订阅",
    templateTitle: "选择模板",
    templateSearch: "搜索服务（如 Netflix、VPN）",
    templateNone: "没有匹配的模板。请用“直接输入”添加。",
    templateHint: "品牌图标内置在应用里，不会从网上抓取 logo。",
    fieldName: "名称",
    fieldPrice: "价格",
    fieldCurrency: "货币",
    fieldNext: "下次续费日",
    fieldCycle: "付款周期",
    fieldCategory: "分类",
    fieldStatus: "状态",
    fieldNotes: "备注（可选）",
    fieldWebsite: "网站（可选）",
    newCategory: "新分类",
    newCategoryPlaceholder: "新分类名称",
    cycleWeekly: "每周",
    cycleMonthly: "每月",
    cycleQuarterly: "每季",
    cycleYearly: "每年",
    perWeek: "/周",
    perMonth: "/月",
    perQuarter: "/季",
    perYear: "/年",
    statusActive: "生效中",
    statusPaused: "已暂停",
    statusCancelled: "已取消",
    dueToday: "今天续费",
    dueTomorrow: "明天续费",
    dueIn: "{n} 天后",
    overdueBy: "已逾期 {n} 天",
    nextOn: "下次：{date}",
    markPaid: "标记已付",
    skip: "跳过",
    edit: "编辑",
    delete: "删除",
    deleteSubTitle: "删除这个订阅？",
    deleteSubBody: "它的付款记录也会一起删除。无法撤销。",
    paidToast: "已记录付款。下次续费日推后一个周期。",
    skippedToast: "已记录跳过。下次续费日推后一个周期。",
    savedToast: "已保存。",
    deletedToast: "已删除。",
    needName: "请输入名称。",
    needPrice: "价格必须是大于等于 0 的数字。",
    needDate: "请选择下次续费日。",
    historyTitle: "付款记录",
    historyEmpty: "还没有记录。在列表里点“标记已付”或“跳过”，就会出现在这里。",
    historyPaid: "已付",
    historySkipped: "已跳过",
    historyUnknownSub: "（已删除的订阅）",
    removePayment: "删除记录",
    backupTitle: "备份与日历",
    backupHint: "一个 JSON 文件包含订阅、付款记录和分类。可以转到另一台设备，或重装后导入。{ services: [...] } 这类简单格式也能读取。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    exportIcs: "导出日历(.ics)",
    exportIcsOne: "日历",
    icsHint: "每个生效中的订阅都会变成重复事件，并在前一天提醒。打开文件后由系统日历来提醒你。",
    icsEmpty: "没有可导出的生效订阅。",
    clearAll: "全部删除",
    exported: "文件已下载。",
    importBad: "无法读取该文件。",
    importOk: "已导入 {n} 个订阅。",
    importConfirmTitle: "导入这个备份？",
    importConfirmBody: "当前列表会被文件内容替换。想保留的话请先导出。",
    clearAllTitle: "全部删除？",
    clearAllBody: "会删除此设备上的所有订阅、付款记录和分类。无法撤销。",
    cleared: "已全部删除。",
    save: "保存",
    cancel: "取消",
    close: "关闭",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
    tabList: "列表",
    tabHistory: "记录",
    tabBackup: "备份",
    defaultCurrency: "默认货币",
    promiseTitle: "承诺",
    categoryLabel: "分类",
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
