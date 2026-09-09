/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "weekpad:lang";

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

/** Locale for number and date formatting. */
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
  | "prevWeek"
  | "nextWeek"
  | "thisWeek"
  | "backToThisWeek"
  | "weekNumber"
  | "pastWeek"
  | "futureWeek"
  | "newWeekToast"
  | "totalPlanned"
  | "totalSpent"
  | "totalRemaining"
  | "totalOver"
  | "categoriesTitle"
  | "addCategory"
  | "noCategoriesTitle"
  | "noCategoriesBody"
  | "planned"
  | "spent"
  | "remaining"
  | "overBy"
  | "notPlannedThisWeek"
  | "badgeRecurring"
  | "badgeOneOff"
  | "editCategory"
  | "quickExpense"
  | "amountLabel"
  | "amountPlaceholder"
  | "categoryLabel"
  | "pickCategory"
  | "noteLabel"
  | "notePlaceholder"
  | "dateLabel"
  | "addExpense"
  | "expenseAdded"
  | "expenseSaved"
  | "expenseDeleted"
  | "invalidAmount"
  | "needCategory"
  | "expensesTitle"
  | "noExpenses"
  | "editExpense"
  | "deleteExpense"
  | "unknownCategory"
  | "newCategoryTitle"
  | "editCategoryTitle"
  | "nameLabel"
  | "namePlaceholder"
  | "plannedLabel"
  | "recurringLabel"
  | "recurringHint"
  | "oneOffHint"
  | "archivedLabel"
  | "archivedHint"
  | "deleteCategory"
  | "deleteCategoryTitle"
  | "deleteCategoryBody"
  | "categorySaved"
  | "categoryDeleted"
  | "showArchived"
  | "hideArchived"
  | "save"
  | "cancel"
  | "delete"
  | "close"
  | "settingsTitle"
  | "currencyLabel"
  | "currencyHint"
  | "weekStartLabel"
  | "weekStartMon"
  | "weekStartSun"
  | "fontSizeLabel"
  | "fontMd"
  | "fontLg"
  | "fontXl"
  | "backupTitle"
  | "backupBody"
  | "exportJson"
  | "importJson"
  | "exportCsv"
  | "exported"
  | "importConfirmTitle"
  | "importConfirmBody"
  | "importOk"
  | "importBad"
  | "clearAll"
  | "clearAllTitle"
  | "clearAllBody"
  | "cleared"
  | "nothingToExport"
  | "chipNoAds"
  | "chipNoIap"
  | "chipBackup"
  | "chipNoLogin"
  | "chipFree"
  | "chipLocal"
  | "chipLangs"
  | "about"
  | "privacy"
  | "terms"
  | "guide";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "위크패드",
    shortName: "위크패드",
    tagline: "무료 주간 지출 패드. 카테고리별 미니 예산, 지출 기록, 남은 금액. 매주 자동 리셋. 계정 없음.",
    metaDescription:
      "계정 없는 무료 주간 지출 패드. 식비·커피처럼 카테고리마다 이번 주 예산을 정하고, 지출을 적으면 진행 바와 남은 금액이 바로 보입니다. 매주 자동으로 새 주가 시작되고 지난 주는 그대로 남습니다. 광고 없음, 로그인 없음, JSON·CSV 백업. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    prevWeek: "지난주",
    nextWeek: "다음주",
    thisWeek: "이번 주",
    backToThisWeek: "이번 주로",
    weekNumber: "{n}주차",
    pastWeek: "지난 주",
    futureWeek: "다가올 주",
    newWeekToast: "새 주가 시작됐습니다. 지출은 0부터 다시 셉니다.",
    totalPlanned: "계획",
    totalSpent: "지출",
    totalRemaining: "남음",
    totalOver: "초과",
    categoriesTitle: "이번 주 예산",
    addCategory: "카테고리 추가",
    noCategoriesTitle: "아직 카테고리가 없습니다",
    noCategoriesBody: "‘식비 80,000’처럼 카테고리와 이번 주 예산을 하나 추가해 보세요. 매주 반복으로 두면 다음 주에도 같은 예산이 자동으로 잡힙니다.",
    planned: "계획",
    spent: "지출",
    remaining: "남음",
    overBy: "{amount} 초과",
    notPlannedThisWeek: "이번 주 예산 없음",
    badgeRecurring: "매주",
    badgeOneOff: "이번 주만",
    editCategory: "카테고리 편집",
    quickExpense: "빠른 지출 입력",
    amountLabel: "금액",
    amountPlaceholder: "0",
    categoryLabel: "카테고리",
    pickCategory: "카테고리 선택",
    noteLabel: "메모 (선택)",
    notePlaceholder: "예: 마트, 점심",
    dateLabel: "날짜",
    addExpense: "지출 추가",
    expenseAdded: "지출을 추가했습니다",
    expenseSaved: "지출을 저장했습니다",
    expenseDeleted: "지출을 삭제했습니다",
    invalidAmount: "금액을 숫자로 입력하세요",
    needCategory: "먼저 카테고리를 하나 추가하세요",
    expensesTitle: "이번 주 지출",
    noExpenses: "이번 주에 적은 지출이 없습니다.",
    editExpense: "지출 편집",
    deleteExpense: "이 지출 삭제",
    unknownCategory: "(삭제된 카테고리)",
    newCategoryTitle: "새 카테고리",
    editCategoryTitle: "카테고리 편집",
    nameLabel: "이름",
    namePlaceholder: "예: 식비, 커피, 교통",
    plannedLabel: "이번 주 예산",
    recurringLabel: "매주 반복",
    recurringHint: "켜 두면 같은 예산이 매주 자동으로 잡힙니다. 다시 입력할 필요가 없습니다.",
    oneOffHint: "끄면 이번 주에만 예산이 잡히고, 다른 주에는 지출만 기록됩니다.",
    archivedLabel: "보관",
    archivedHint: "보관하면 목록과 선택창에서 숨겨집니다. 지난 지출은 그대로 남습니다.",
    deleteCategory: "카테고리 삭제",
    deleteCategoryTitle: "이 카테고리를 삭제할까요?",
    deleteCategoryBody: "‘{name}’과 여기에 적은 지출 {count}건이 함께 삭제됩니다. 되돌릴 수 없습니다. 지난 주 기록만 남기려면 삭제 대신 ‘보관’을 쓰세요.",
    categorySaved: "카테고리를 저장했습니다",
    categoryDeleted: "카테고리를 삭제했습니다",
    showArchived: "보관함 보기 ({n})",
    hideArchived: "보관함 숨기기",
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    close: "닫기",
    settingsTitle: "설정",
    currencyLabel: "통화 표시",
    currencyHint: "표시용 기호일 뿐입니다. 환율 계산은 하지 않습니다.",
    weekStartLabel: "주 시작 요일",
    weekStartMon: "월요일",
    weekStartSun: "일요일",
    fontSizeLabel: "글자 크기",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "백업",
    backupBody: "앱을 지우거나 기기를 바꾸면 이 기기의 데이터는 사라집니다. JSON으로 내보내 두면 언제든 그대로 되돌릴 수 있고, CSV는 스프레드시트용 지출 목록입니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    exportCsv: "CSV 내보내기",
    exported: "파일을 내보냈습니다",
    importConfirmTitle: "백업으로 바꿀까요?",
    importConfirmBody: "지금 이 기기에 있는 카테고리와 지출을 파일 내용으로 바꿉니다. 필요하면 먼저 JSON으로 내보내 두세요.",
    importOk: "카테고리 {c}개, 지출 {e}건을 가져왔습니다",
    importBad: "위크패드 백업 파일이 아닙니다",
    clearAll: "모든 데이터 삭제",
    clearAllTitle: "모든 데이터를 삭제할까요?",
    clearAllBody: "이 기기의 카테고리와 지출을 전부 지웁니다. 되돌릴 수 없습니다. 먼저 JSON으로 내보내 두세요.",
    cleared: "모든 데이터를 삭제했습니다",
    nothingToExport: "아직 내보낼 지출이 없습니다",
    chipNoAds: "여는 광고 없음",
    chipNoIap: "주간 결제 없음",
    chipBackup: "JSON 백업 (재설치해도 복원)",
    chipNoLogin: "로그인 없음",
    chipFree: "무료",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    about:
      "위크패드는 한 주 단위로 쓰는 지출 패드입니다. 카테고리마다 이번 주 예산을 정하고, 쓴 돈을 적으면 진행 바와 남은 금액이 바로 바뀝니다. 월요일(또는 일요일)이 오면 새 주가 자동으로 시작되고, 지난 주는 화살표로 언제든 되돌아볼 수 있습니다. 은행 연결도, 계정도, 광고도 없습니다.",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Weekpad",
    shortName: "Weekpad",
    tagline: "Free weekly spending pad. Mini-budgets per category, expense log, progress and remaining. Resets each week. No account.",
    metaDescription:
      "Free weekly spending pad with no account. Set a small budget per category like groceries or coffee, log what you spend, and watch the progress bar and remaining amount. A fresh week starts automatically and past weeks stay browsable. No ads, no login, JSON and CSV backup. Data stays on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    prevWeek: "Previous week",
    nextWeek: "Next week",
    thisWeek: "This week",
    backToThisWeek: "Back to this week",
    weekNumber: "Week {n}",
    pastWeek: "Past week",
    futureWeek: "Upcoming week",
    newWeekToast: "A new week has started. Counters are back to 0.",
    totalPlanned: "Planned",
    totalSpent: "Spent",
    totalRemaining: "Remaining",
    totalOver: "Over",
    categoriesTitle: "This week's budgets",
    addCategory: "Add category",
    noCategoriesTitle: "No categories yet",
    noCategoriesBody: "Add one like “Groceries 80” with a weekly amount. Leave “Every week” on and the same budget shows up next week by itself.",
    planned: "Planned",
    spent: "Spent",
    remaining: "Remaining",
    overBy: "Over by {amount}",
    notPlannedThisWeek: "No budget this week",
    badgeRecurring: "Every week",
    badgeOneOff: "This week only",
    editCategory: "Edit category",
    quickExpense: "Quick expense",
    amountLabel: "Amount",
    amountPlaceholder: "0",
    categoryLabel: "Category",
    pickCategory: "Pick a category",
    noteLabel: "Note (optional)",
    notePlaceholder: "e.g. market, lunch",
    dateLabel: "Date",
    addExpense: "Add expense",
    expenseAdded: "Expense added",
    expenseSaved: "Expense saved",
    expenseDeleted: "Expense deleted",
    invalidAmount: "Enter the amount as a number",
    needCategory: "Add a category first",
    expensesTitle: "Expenses this week",
    noExpenses: "Nothing logged this week yet.",
    editExpense: "Edit expense",
    deleteExpense: "Delete this expense",
    unknownCategory: "(deleted category)",
    newCategoryTitle: "New category",
    editCategoryTitle: "Edit category",
    nameLabel: "Name",
    namePlaceholder: "e.g. Groceries, Coffee, Transit",
    plannedLabel: "Weekly budget",
    recurringLabel: "Every week",
    recurringHint: "Keep this on and the same budget carries into every week. No need to re-enter it.",
    oneOffHint: "Off means the budget applies to this week only; other weeks just log the spending.",
    archivedLabel: "Archived",
    archivedHint: "Archived categories are hidden from the cards and the picker. Past expenses stay.",
    deleteCategory: "Delete category",
    deleteCategoryTitle: "Delete this category?",
    deleteCategoryBody: "“{name}” and its {count} logged expenses will be deleted. This cannot be undone. To keep past weeks, archive it instead.",
    categorySaved: "Category saved",
    categoryDeleted: "Category deleted",
    showArchived: "Show archived ({n})",
    hideArchived: "Hide archived",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    close: "Close",
    settingsTitle: "Settings",
    currencyLabel: "Currency",
    currencyHint: "Display only. The symbol changes; the numbers are never converted.",
    weekStartLabel: "Week starts on",
    weekStartMon: "Monday",
    weekStartSun: "Sunday",
    fontSizeLabel: "Text size",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "Backup",
    backupBody: "Uninstall or switch phones and the data on this device is gone. Export JSON and you can put it all back any time; CSV is the expense log for a spreadsheet.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exportCsv: "Export CSV",
    exported: "File exported",
    importConfirmTitle: "Replace with this backup?",
    importConfirmBody: "The categories and expenses on this device will be replaced by the file. Export JSON first if you need the current ones.",
    importOk: "Imported {c} categories and {e} expenses",
    importBad: "That is not a Weekpad backup file",
    clearAll: "Delete all data",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Every category and expense on this device will be removed. This cannot be undone. Export JSON first.",
    cleared: "All data deleted",
    nothingToExport: "No expenses to export yet",
    chipNoAds: "No opening ads",
    chipNoIap: "No weekly IAP",
    chipBackup: "JSON backup (survives reinstall)",
    chipNoLogin: "No login",
    chipFree: "Free",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    about:
      "Weekpad is a spending pad that thinks in weeks. Give each category a weekly amount, log what you spend, and the progress bar and remaining figure update on the spot. When Monday (or Sunday) comes, a fresh week starts on its own and the arrows take you back through past weeks. No bank link, no account, no ads.",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "ウィークパッド",
    shortName: "ウィークパッド",
    tagline: "無料の週間支出パッド。カテゴリごとのミニ予算、支出ログ、残り金額。毎週自動リセット。アカウント不要。",
    metaDescription:
      "アカウント不要の無料週間支出パッド。食費やコーヒーなどカテゴリごとに今週の予算を決め、使った分を記録すると進捗バーと残りがすぐ分かります。新しい週は自動で始まり、過去の週もそのまま見返せます。広告なし、ログインなし、JSON・CSVバックアップ。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    prevWeek: "前の週",
    nextWeek: "次の週",
    thisWeek: "今週",
    backToThisWeek: "今週に戻る",
    weekNumber: "第{n}週",
    pastWeek: "過去の週",
    futureWeek: "これからの週",
    newWeekToast: "新しい週が始まりました。カウントは0からです。",
    totalPlanned: "予算",
    totalSpent: "支出",
    totalRemaining: "残り",
    totalOver: "超過",
    categoriesTitle: "今週の予算",
    addCategory: "カテゴリを追加",
    noCategoriesTitle: "まだカテゴリがありません",
    noCategoriesBody: "「食費 8,000」のようにカテゴリと今週の予算を1つ追加してみてください。「毎週」をオンにすると来週も同じ予算が自動で入ります。",
    planned: "予算",
    spent: "支出",
    remaining: "残り",
    overBy: "{amount} 超過",
    notPlannedThisWeek: "今週の予算なし",
    badgeRecurring: "毎週",
    badgeOneOff: "今週だけ",
    editCategory: "カテゴリを編集",
    quickExpense: "支出をすばやく記録",
    amountLabel: "金額",
    amountPlaceholder: "0",
    categoryLabel: "カテゴリ",
    pickCategory: "カテゴリを選ぶ",
    noteLabel: "メモ（任意）",
    notePlaceholder: "例: スーパー、昼食",
    dateLabel: "日付",
    addExpense: "支出を追加",
    expenseAdded: "支出を追加しました",
    expenseSaved: "支出を保存しました",
    expenseDeleted: "支出を削除しました",
    invalidAmount: "金額は数字で入力してください",
    needCategory: "先にカテゴリを1つ追加してください",
    expensesTitle: "今週の支出",
    noExpenses: "今週はまだ支出がありません。",
    editExpense: "支出を編集",
    deleteExpense: "この支出を削除",
    unknownCategory: "（削除されたカテゴリ）",
    newCategoryTitle: "新しいカテゴリ",
    editCategoryTitle: "カテゴリを編集",
    nameLabel: "名前",
    namePlaceholder: "例: 食費、コーヒー、交通",
    plannedLabel: "今週の予算",
    recurringLabel: "毎週",
    recurringHint: "オンのままにすると同じ予算が毎週自動で入ります。入れ直す必要はありません。",
    oneOffHint: "オフにすると予算は今週だけになり、ほかの週は支出の記録だけになります。",
    archivedLabel: "アーカイブ",
    archivedHint: "アーカイブするとカードと選択肢から隠れます。過去の支出は残ります。",
    deleteCategory: "カテゴリを削除",
    deleteCategoryTitle: "このカテゴリを削除しますか？",
    deleteCategoryBody: "「{name}」と、ここに記録した支出{count}件が一緒に削除されます。元に戻せません。過去の週を残すなら削除ではなくアーカイブを使ってください。",
    categorySaved: "カテゴリを保存しました",
    categoryDeleted: "カテゴリを削除しました",
    showArchived: "アーカイブを表示（{n}）",
    hideArchived: "アーカイブを隠す",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    close: "閉じる",
    settingsTitle: "設定",
    currencyLabel: "通貨表示",
    currencyHint: "表示用の記号だけです。為替換算はしません。",
    weekStartLabel: "週の始まり",
    weekStartMon: "月曜日",
    weekStartSun: "日曜日",
    fontSizeLabel: "文字サイズ",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "バックアップ",
    backupBody: "アプリを消したり端末を替えたりすると、この端末のデータは消えます。JSONで書き出しておけばいつでもそのまま戻せます。CSVは表計算用の支出リストです。",
    exportJson: "JSON書き出し",
    importJson: "JSON読み込み",
    exportCsv: "CSV書き出し",
    exported: "ファイルを書き出しました",
    importConfirmTitle: "バックアップで置き換えますか？",
    importConfirmBody: "この端末のカテゴリと支出をファイルの内容に置き換えます。必要なら先にJSONで書き出してください。",
    importOk: "カテゴリ{c}件、支出{e}件を読み込みました",
    importBad: "ウィークパッドのバックアップファイルではありません",
    clearAll: "すべてのデータを削除",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "この端末のカテゴリと支出をすべて消します。元に戻せません。先にJSONで書き出してください。",
    cleared: "すべてのデータを削除しました",
    nothingToExport: "書き出す支出がまだありません",
    chipNoAds: "起動時の広告なし",
    chipNoIap: "週額課金なし",
    chipBackup: "JSONバックアップ（再インストールでも復元）",
    chipNoLogin: "ログインなし",
    chipFree: "無料",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    about:
      "ウィークパッドは週単位で使う支出パッドです。カテゴリごとに今週の予算を決め、使った分を記録すると進捗バーと残りがその場で変わります。月曜（または日曜）が来ると新しい週が自動で始まり、矢印でいつでも過去の週に戻れます。銀行連携もアカウントも広告もありません。",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "周预算板",
    shortName: "周预算板",
    tagline: "免费周支出板。按类别设迷你预算、记开支、看进度和剩余。每周自动重置。无需账号。",
    metaDescription:
      "无需账号的免费周支出板。给买菜、咖啡等每个类别定一个本周预算，记下花销，进度条和剩余金额立刻更新。新的一周自动开始，过去几周随时可以翻看。无广告，无需登录，支持 JSON 和 CSV 备份。数据仅保存在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    prevWeek: "上一周",
    nextWeek: "下一周",
    thisWeek: "本周",
    backToThisWeek: "回到本周",
    weekNumber: "第 {n} 周",
    pastWeek: "过去的一周",
    futureWeek: "未来的一周",
    newWeekToast: "新的一周开始了，计数从 0 重新算。",
    totalPlanned: "预算",
    totalSpent: "已花",
    totalRemaining: "剩余",
    totalOver: "超支",
    categoriesTitle: "本周预算",
    addCategory: "添加类别",
    noCategoriesTitle: "还没有类别",
    noCategoriesBody: "先加一个，比如“买菜 500”和本周金额。开着“每周”，下周同样的预算会自动出现。",
    planned: "预算",
    spent: "已花",
    remaining: "剩余",
    overBy: "超支 {amount}",
    notPlannedThisWeek: "本周没有预算",
    badgeRecurring: "每周",
    badgeOneOff: "仅本周",
    editCategory: "编辑类别",
    quickExpense: "快速记一笔",
    amountLabel: "金额",
    amountPlaceholder: "0",
    categoryLabel: "类别",
    pickCategory: "选择类别",
    noteLabel: "备注（可选）",
    notePlaceholder: "如：超市、午饭",
    dateLabel: "日期",
    addExpense: "添加开支",
    expenseAdded: "已添加开支",
    expenseSaved: "已保存开支",
    expenseDeleted: "已删除开支",
    invalidAmount: "请用数字输入金额",
    needCategory: "请先添加一个类别",
    expensesTitle: "本周开支",
    noExpenses: "本周还没有记录。",
    editExpense: "编辑开支",
    deleteExpense: "删除这笔开支",
    unknownCategory: "（已删除的类别）",
    newCategoryTitle: "新类别",
    editCategoryTitle: "编辑类别",
    nameLabel: "名称",
    namePlaceholder: "如：买菜、咖啡、交通",
    plannedLabel: "本周预算",
    recurringLabel: "每周",
    recurringHint: "开着的话，同样的预算每周自动带入，不用再输一遍。",
    oneOffHint: "关掉则预算只算本周，其他周只记录花销。",
    archivedLabel: "归档",
    archivedHint: "归档后会从卡片和选择列表里隐藏，过去的开支照样保留。",
    deleteCategory: "删除类别",
    deleteCategoryTitle: "删除这个类别？",
    deleteCategoryBody: "“{name}”和它下面的 {count} 笔开支会一起删除，无法恢复。想保留过去几周的记录，请改用“归档”。",
    categorySaved: "已保存类别",
    categoryDeleted: "已删除类别",
    showArchived: "显示已归档（{n}）",
    hideArchived: "隐藏已归档",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    close: "关闭",
    settingsTitle: "设置",
    currencyLabel: "货币显示",
    currencyHint: "只是显示用的符号，不做汇率换算。",
    weekStartLabel: "一周从",
    weekStartMon: "周一",
    weekStartSun: "周日",
    fontSizeLabel: "字号",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "备份",
    backupBody: "卸载或换手机后，这台设备上的数据就没了。导出 JSON 随时可以原样恢复；CSV 是给表格用的开支清单。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    exportCsv: "导出 CSV",
    exported: "文件已导出",
    importConfirmTitle: "用这份备份替换？",
    importConfirmBody: "这台设备上的类别和开支会被文件内容替换。需要的话先导出 JSON。",
    importOk: "已导入 {c} 个类别、{e} 笔开支",
    importBad: "这不是周预算板的备份文件",
    clearAll: "删除全部数据",
    clearAllTitle: "全部删除？",
    clearAllBody: "这台设备上的所有类别和开支都会被清除，无法恢复。请先导出 JSON。",
    cleared: "已删除全部数据",
    nothingToExport: "还没有可导出的开支",
    chipNoAds: "无开屏广告",
    chipNoIap: "无周付费",
    chipBackup: "JSON 备份（重装也能恢复）",
    chipNoLogin: "无需登录",
    chipFree: "免费",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    about:
      "周预算板是按周来用的支出板。给每个类别定一个本周金额，记下花销，进度条和剩余立刻变化。到了周一（或周日），新的一周自动开始，用箭头随时翻回过去的周。不连银行，不用账号，没有广告。",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
  },
};

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://weekpad.try-dabble.com/og-image-ko.png",
  en: "https://weekpad.try-dabble.com/og-image-en.png",
  ja: "https://weekpad.try-dabble.com/og-image-ja.png",
  zh: "https://weekpad.try-dabble.com/og-image-zh.png",
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
