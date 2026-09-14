/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "hourpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://hourpad.try-dabble.com/og-image-ko.png",
  en: "https://hourpad.try-dabble.com/og-image-en.png",
  ja: "https://hourpad.try-dabble.com/og-image-ja.png",
  zh: "https://hourpad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoAds"
  | "chipNoAccount"
  | "chipBreaksFree"
  | "chipBankFree"
  | "chipBackup"
  | "chipHonest"
  | "chipFree"
  | "chipLocal"
  | "chipLangs"
  | "statusIdle"
  | "statusWorking"
  | "statusBreak"
  | "sinceAt"
  | "checkIn"
  | "startBreak"
  | "resumeWork"
  | "checkOut"
  | "labelLabel"
  | "labelPlaceholder"
  | "idleHint"
  | "todayTitle"
  | "workLabel"
  | "breakLabel"
  | "sessionsN"
  | "weekTitle"
  | "weekWork"
  | "targetLabel"
  | "remainingLabel"
  | "overLabel"
  | "bankTitle"
  | "bankLabel"
  | "bankHint"
  | "bankRule"
  | "bankProjected"
  | "editBank"
  | "editTarget"
  | "bankDialogTitle"
  | "bankDialogBody"
  | "targetDialogTitle"
  | "targetDialogBody"
  | "hoursUnit"
  | "needHours"
  | "settledToast"
  | "tabDay"
  | "tabWeeks"
  | "tabBackup"
  | "dayTitle"
  | "pickDay"
  | "noSessions"
  | "addEntry"
  | "entryTitle"
  | "entryHint"
  | "fieldDate"
  | "fieldKind"
  | "fieldStart"
  | "fieldEnd"
  | "fieldLabel"
  | "kindWork"
  | "kindBreak"
  | "needTimes"
  | "endBeforeStart"
  | "deleteEntry"
  | "deleteEntryTitle"
  | "deleteEntryBody"
  | "savedToast"
  | "deletedToast"
  | "weeksTitle"
  | "weeksHint"
  | "thisWeek"
  | "pending"
  | "settled"
  | "bankDelta"
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
  | "save"
  | "cancel"
  | "close"
  | "privacy"
  | "terms"
  | "guide"
  | "promiseTitle";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "아워패드",
    shortName: "아워패드",
    tagline: "무료 로컬 근무 시간 기록. 출근·휴식·퇴근. 일·주 합계와 목표 시간. 초과 근무 뱅크가 다음 주로 넘어갑니다. JSON 백업. 계정 없음. 광고 없음.",
    metaDescription:
      "회사 시스템도 로그인도 없는 무료 로컬 근무 시간 기록. 출근 버튼으로 시작하고, 휴식은 따로 재고, 퇴근으로 끝냅니다. 세션마다 선택 작업명. 오늘의 근무·휴식 합계와 이번 주 근무 시간을 설정 가능한 주 목표(기본 40시간)와 비교합니다. 주가 끝나면 목표 대비 초과·부족분이 초과 근무 뱅크로 넘어가고, 홈에서 보고 직접 고칠 수 있습니다. 하루·주 기록, JSON 내보내기·불러오기, 오프라인 PWA. 탭을 뒤로 보내도 실제 시각으로 계산합니다. 계정 없음, 광고 없음. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 휴식과 초과 근무 뱅크는 무료입니다.",
    langLabel: "언어",
    chipNoAds: "사용 중 광고 없음",
    chipNoAccount: "계정 없음",
    chipBreaksFree: "휴식 무료",
    chipBankFree: "초과 근무 뱅크 무료",
    chipBackup: "JSON 백업",
    chipHonest: "백그라운드 후에도 정직한 합계",
    chipFree: "영원히 무료",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    statusIdle: "퇴근 상태",
    statusWorking: "근무 중",
    statusBreak: "휴식 중",
    sinceAt: "{time}부터",
    checkIn: "출근",
    startBreak: "휴식",
    resumeWork: "근무 재개",
    checkOut: "퇴근",
    labelLabel: "작업 (선택)",
    labelPlaceholder: "예: 고객 보고서, 코드 리뷰",
    idleHint: "출근을 누르면 실제 시각으로 시간을 잽니다. 탭을 닫거나 화면을 꺼도 계속 셉니다.",
    todayTitle: "오늘",
    workLabel: "근무",
    breakLabel: "휴식",
    sessionsN: "세션 {n}개",
    weekTitle: "이번 주",
    weekWork: "근무",
    targetLabel: "목표",
    remainingLabel: "남음",
    overLabel: "초과",
    bankTitle: "초과 근무 뱅크",
    bankLabel: "뱅크 잔액",
    bankHint: "이번 주가 끝나면 뱅크가 {next}이 됩니다.",
    bankRule: "규칙: 근무가 기록된 주가 끝나면 (근무 − 목표)가 뱅크에 더해집니다. 초과는 늘리고 부족은 줄이며, 마이너스도 됩니다. 기록이 없는 주는 건드리지 않습니다.",
    bankProjected: "주말 예상",
    editBank: "뱅크 수정",
    editTarget: "목표 수정",
    bankDialogTitle: "뱅크 잔액 수정",
    bankDialogBody: "시간 단위로 적으세요. 예: 3.5, -2, 4h 30m. 다른 곳에서 넘어온 초과 근무를 여기에 넣으면 됩니다.",
    targetDialogTitle: "주 목표 시간",
    targetDialogBody: "한 주에 일하기로 한 시간입니다. 기본 40시간. 예: 37.5, 32h 30m.",
    hoursUnit: "시간",
    needHours: "숫자로 된 시간을 적어 주세요.",
    settledToast: "{week} 주 정산: 뱅크 {delta}",
    tabDay: "하루",
    tabWeeks: "주별",
    tabBackup: "백업",
    dayTitle: "하루 기록",
    pickDay: "날짜",
    noSessions: "이날은 기록이 없습니다.",
    addEntry: "직접 추가",
    entryTitle: "기록 직접 추가",
    entryHint: "잊고 출근을 안 눌렀을 때. 시작·끝 시각을 적으면 그날 기록에 들어갑니다.",
    fieldDate: "날짜",
    fieldKind: "종류",
    fieldStart: "시작",
    fieldEnd: "끝",
    fieldLabel: "작업 (선택)",
    kindWork: "근무",
    kindBreak: "휴식",
    needTimes: "시작과 끝 시각을 적어 주세요.",
    endBeforeStart: "끝 시각이 시작보다 빠릅니다.",
    deleteEntry: "삭제",
    deleteEntryTitle: "이 기록을 삭제할까요?",
    deleteEntryBody: "되돌릴 수 없습니다. 이미 정산된 주의 뱅크는 바뀌지 않습니다.",
    savedToast: "저장했습니다.",
    deletedToast: "삭제했습니다.",
    weeksTitle: "주별 기록",
    weeksHint: "주마다 근무·휴식 합계, 목표, 그리고 뱅크로 넘어간 양.",
    thisWeek: "이번 주",
    pending: "진행 중",
    settled: "정산됨",
    bankDelta: "뱅크",
    backupTitle: "백업",
    backupHint: "JSON 파일 하나에 세션, 진행 중인 세션, 목표와 뱅크, 정산된 주가 모두 들어갑니다. 다른 기기로 옮기거나 재설치 뒤 불러오세요. 세션 배열만 있는 단순한 파일도 읽습니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 불러오기",
    clearAll: "모두 삭제",
    exported: "파일을 내려받았습니다.",
    importBad: "읽을 수 없는 파일입니다. 아워패드 JSON이나 세션 목록이 필요합니다.",
    importOk: "불러왔습니다: 세션 {n}개.",
    importConfirmTitle: "이 파일로 바꿀까요?",
    importConfirmBody: "지금 있는 세션, 뱅크, 목표를 파일 내용으로 바꿉니다. 세션 {n}개.",
    clearAllTitle: "모두 삭제할까요?",
    clearAllBody: "세션, 뱅크, 목표, 정산 기록이 이 기기에서 지워집니다. 먼저 JSON으로 내보내 두세요.",
    cleared: "모두 삭제했습니다.",
    save: "저장",
    cancel: "취소",
    close: "닫기",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
    promiseTitle: "약속",
  },
  en: {
    title: "Hourpad",
    shortName: "Hourpad",
    tagline: "Free local work-hours tracker. Check in, take breaks, check out. Daily and weekly totals vs your target. Overtime bank rolls into next week. JSON backup. No account. No ads.",
    metaDescription:
      "Free local work-hours tracker with no company system and no login. Check in to start, track breaks separately, check out to finish, with an optional task label per session. See today's work and break totals and this week's hours against a settable weekly target (default 40h). When a week ends, the surplus or shortfall against the target rolls into an overtime bank that is visible on the home screen and editable. Day and week history, JSON export and import, offline PWA. Totals stay honest after the tab goes to the background because elapsed time is computed from the wall clock. No account, no ads. Data stays on this device.",
    localOnly: "Your data stays on this device. No login. No ads. Breaks and the overtime bank are free.",
    langLabel: "Language",
    chipNoAds: "No ads mid-use",
    chipNoAccount: "No account",
    chipBreaksFree: "Breaks free",
    chipBankFree: "Overtime bank free",
    chipBackup: "JSON backup",
    chipHonest: "Honest after background",
    chipFree: "Free forever",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    statusIdle: "Checked out",
    statusWorking: "Working",
    statusBreak: "On break",
    sinceAt: "since {time}",
    checkIn: "Check in",
    startBreak: "Break",
    resumeWork: "Resume work",
    checkOut: "Check out",
    labelLabel: "Task (optional)",
    labelPlaceholder: "e.g. client report, code review",
    idleHint: "Press Check in and the clock runs on real time. Closing the tab or locking the screen does not lose a minute.",
    todayTitle: "Today",
    workLabel: "Work",
    breakLabel: "Break",
    sessionsN: "{n} sessions",
    weekTitle: "This week",
    weekWork: "Work",
    targetLabel: "Target",
    remainingLabel: "Remaining",
    overLabel: "Over",
    bankTitle: "Overtime bank",
    bankLabel: "Bank balance",
    bankHint: "If this week ended now the bank would be {next}.",
    bankRule: "Rule: when a week with work logged ends, work minus target is added to the bank. Over target grows it, under target shrinks it, and it can go negative. Weeks with nothing logged are left alone.",
    bankProjected: "Projected at week end",
    editBank: "Edit bank",
    editTarget: "Edit target",
    bankDialogTitle: "Edit bank balance",
    bankDialogBody: "In hours. Examples: 3.5, -2, 4h 30m. Use this to bring in overtime carried from elsewhere.",
    targetDialogTitle: "Weekly target",
    targetDialogBody: "Hours you plan to work per week. Default 40. Examples: 37.5, 32h 30m.",
    hoursUnit: "hours",
    needHours: "Enter a number of hours.",
    settledToast: "Week of {week} settled: bank {delta}",
    tabDay: "Day",
    tabWeeks: "Weeks",
    tabBackup: "Backup",
    dayTitle: "Day history",
    pickDay: "Date",
    noSessions: "Nothing logged on this day.",
    addEntry: "Add entry",
    entryTitle: "Add an entry by hand",
    entryHint: "For the day you forgot to check in. Give it a start and an end and it joins that day's history.",
    fieldDate: "Date",
    fieldKind: "Kind",
    fieldStart: "Start",
    fieldEnd: "End",
    fieldLabel: "Task (optional)",
    kindWork: "Work",
    kindBreak: "Break",
    needTimes: "Enter a start and an end time.",
    endBeforeStart: "The end time is before the start.",
    deleteEntry: "Delete",
    deleteEntryTitle: "Delete this entry?",
    deleteEntryBody: "This cannot be undone. A week that is already settled keeps its bank figure.",
    savedToast: "Saved.",
    deletedToast: "Deleted.",
    weeksTitle: "Week history",
    weeksHint: "Work and break totals per week, the target, and what moved into the bank.",
    thisWeek: "This week",
    pending: "In progress",
    settled: "Settled",
    bankDelta: "Bank",
    backupTitle: "Backup",
    backupHint: "One JSON file holds sessions, the open session, target and bank, and settled weeks. Move it to another device or restore after a reinstall. A plain file with just a sessions array is read too.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    clearAll: "Delete everything",
    exported: "File downloaded.",
    importBad: "Could not read that file. It needs Hourpad JSON or a list of sessions.",
    importOk: "Imported {n} sessions.",
    importConfirmTitle: "Replace with this file?",
    importConfirmBody: "Current sessions, bank and target are replaced by the file. {n} sessions.",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Sessions, bank, target and settled weeks are removed from this device. Export a JSON first if you want to keep them.",
    cleared: "Everything deleted.",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    promiseTitle: "Promises",
  },
  ja: {
    title: "アワーパッド",
    shortName: "アワーパッド",
    tagline: "無料のローカル勤務時間トラッカー。出勤・休憩・退勤。日・週合計と目標時間。残業バンクは翌週へ繰り越し。JSONバックアップ。アカウント不要。広告なし。",
    metaDescription:
      "会社のシステムもログインもいらない無料のローカル勤務時間トラッカー。出勤で開始、休憩は別に計測、退勤で終了。セッションごとに任意の作業名。今日の勤務・休憩合計と今週の勤務時間を、設定できる週目標（既定40時間）と比べます。週が終わると目標との差が残業バンクに繰り越され、ホームで見えて手で直せます。日・週の履歴、JSONの書き出し・読み込み、オフラインPWA。タブを裏に回しても実時刻で計算します。アカウント不要、広告なし。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。ログイン・広告なし。休憩と残業バンクは無料です。",
    langLabel: "言語",
    chipNoAds: "使用中の広告なし",
    chipNoAccount: "アカウント不要",
    chipBreaksFree: "休憩は無料",
    chipBankFree: "残業バンクも無料",
    chipBackup: "JSONバックアップ",
    chipHonest: "裏に回しても正直な合計",
    chipFree: "ずっと無料",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    statusIdle: "退勤中",
    statusWorking: "勤務中",
    statusBreak: "休憩中",
    sinceAt: "{time} から",
    checkIn: "出勤",
    startBreak: "休憩",
    resumeWork: "勤務に戻る",
    checkOut: "退勤",
    labelLabel: "作業（任意）",
    labelPlaceholder: "例: 顧客レポート、コードレビュー",
    idleHint: "出勤を押すと実時刻で計測します。タブを閉じても画面を消しても一分も失いません。",
    todayTitle: "今日",
    workLabel: "勤務",
    breakLabel: "休憩",
    sessionsN: "{n} セッション",
    weekTitle: "今週",
    weekWork: "勤務",
    targetLabel: "目標",
    remainingLabel: "残り",
    overLabel: "超過",
    bankTitle: "残業バンク",
    bankLabel: "バンク残高",
    bankHint: "今週が今終わればバンクは {next} になります。",
    bankRule: "ルール: 勤務が記録された週が終わると、勤務 − 目標 がバンクに加算されます。超過なら増え、不足なら減り、マイナスにもなります。記録のない週は触りません。",
    bankProjected: "週末の見込み",
    editBank: "バンクを編集",
    editTarget: "目標を編集",
    bankDialogTitle: "バンク残高を編集",
    bankDialogBody: "時間単位で。例: 3.5、-2、4h 30m。他から持ち越した残業をここに入れられます。",
    targetDialogTitle: "週の目標時間",
    targetDialogBody: "一週間に働く予定の時間。既定は40。例: 37.5、32h 30m。",
    hoursUnit: "時間",
    needHours: "数字の時間を入れてください。",
    settledToast: "{week} の週を精算: バンク {delta}",
    tabDay: "日",
    tabWeeks: "週",
    tabBackup: "バックアップ",
    dayTitle: "日の履歴",
    pickDay: "日付",
    noSessions: "この日は記録がありません。",
    addEntry: "手で追加",
    entryTitle: "記録を手で追加",
    entryHint: "出勤を押し忘れた日のために。開始と終了を入れるとその日の履歴に入ります。",
    fieldDate: "日付",
    fieldKind: "種類",
    fieldStart: "開始",
    fieldEnd: "終了",
    fieldLabel: "作業（任意）",
    kindWork: "勤務",
    kindBreak: "休憩",
    needTimes: "開始と終了の時刻を入れてください。",
    endBeforeStart: "終了が開始より前です。",
    deleteEntry: "削除",
    deleteEntryTitle: "この記録を削除しますか？",
    deleteEntryBody: "元に戻せません。精算済みの週のバンクは変わりません。",
    savedToast: "保存しました。",
    deletedToast: "削除しました。",
    weeksTitle: "週の履歴",
    weeksHint: "週ごとの勤務・休憩合計、目標、バンクに動いた量。",
    thisWeek: "今週",
    pending: "進行中",
    settled: "精算済み",
    bankDelta: "バンク",
    backupTitle: "バックアップ",
    backupHint: "JSONファイル一つにセッション、進行中のセッション、目標とバンク、精算済みの週がすべて入ります。別の端末へ移すか、再インストール後に読み込んでください。セッション配列だけの単純なファイルも読めます。",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    clearAll: "すべて削除",
    exported: "ファイルをダウンロードしました。",
    importBad: "読めないファイルです。アワーパッドのJSONかセッションの一覧が必要です。",
    importOk: "読み込みました: {n} セッション。",
    importConfirmTitle: "このファイルで置き換えますか？",
    importConfirmBody: "今のセッション、バンク、目標をファイルの内容で置き換えます。{n} セッション。",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "セッション、バンク、目標、精算記録がこの端末から消えます。残したければ先にJSONを書き出してください。",
    cleared: "すべて削除しました。",
    save: "保存",
    cancel: "キャンセル",
    close: "閉じる",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    promiseTitle: "約束",
  },
  zh: {
    title: "工时板",
    shortName: "工时板",
    tagline: "免费本地工时记录。上班、休息、下班。日/周合计与目标工时。加班库滚入下周。JSON 备份。无需账号。无广告。",
    metaDescription:
      "不用公司系统、不用登录的免费本地工时记录。按上班开始，休息单独计时，按下班结束，每段可选填任务名。查看今天的工作与休息合计，以及本周工时与可设置的周目标（默认 40 小时）的对比。一周结束时，相对目标的多出或不足会滚入加班库，首页可见并可手动修改。日/周历史，JSON 导出与导入，离线 PWA。标签页切到后台后合计依然按真实时间计算。无需账号，无广告。数据只留在此设备。",
    localOnly: "数据仅保存在此设备。无登录、无广告。休息与加班库免费。",
    langLabel: "语言",
    chipNoAds: "使用中无广告",
    chipNoAccount: "无需账号",
    chipBreaksFree: "休息免费",
    chipBankFree: "加班库免费",
    chipBackup: "JSON 备份",
    chipHonest: "后台后合计仍准确",
    chipFree: "永久免费",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    statusIdle: "已下班",
    statusWorking: "工作中",
    statusBreak: "休息中",
    sinceAt: "自 {time}",
    checkIn: "上班",
    startBreak: "休息",
    resumeWork: "继续工作",
    checkOut: "下班",
    labelLabel: "任务（可选）",
    labelPlaceholder: "例如：客户报告、代码审查",
    idleHint: "按上班后按真实时间计时。关闭标签页或锁屏都不会少算一分钟。",
    todayTitle: "今天",
    workLabel: "工作",
    breakLabel: "休息",
    sessionsN: "{n} 段",
    weekTitle: "本周",
    weekWork: "工作",
    targetLabel: "目标",
    remainingLabel: "剩余",
    overLabel: "超出",
    bankTitle: "加班库",
    bankLabel: "库余额",
    bankHint: "如果本周现在结束，加班库将为 {next}。",
    bankRule: "规则：有工作记录的一周结束时，工作 − 目标 会加入加班库。超出则增加，不足则减少，可以为负。没有记录的周不做处理。",
    bankProjected: "周末预计",
    editBank: "修改加班库",
    editTarget: "修改目标",
    bankDialogTitle: "修改库余额",
    bankDialogBody: "以小时计。例如：3.5、-2、4h 30m。可以把别处带来的加班放进来。",
    targetDialogTitle: "周目标工时",
    targetDialogBody: "计划每周工作的小时数。默认 40。例如：37.5、32h 30m。",
    hoursUnit: "小时",
    needHours: "请输入小时数。",
    settledToast: "{week} 周已结算：加班库 {delta}",
    tabDay: "按日",
    tabWeeks: "按周",
    tabBackup: "备份",
    dayTitle: "当日记录",
    pickDay: "日期",
    noSessions: "这一天没有记录。",
    addEntry: "手动添加",
    entryTitle: "手动添加记录",
    entryHint: "忘了按上班时用。填开始和结束时间，就会进入那天的记录。",
    fieldDate: "日期",
    fieldKind: "类型",
    fieldStart: "开始",
    fieldEnd: "结束",
    fieldLabel: "任务（可选）",
    kindWork: "工作",
    kindBreak: "休息",
    needTimes: "请填写开始和结束时间。",
    endBeforeStart: "结束时间早于开始时间。",
    deleteEntry: "删除",
    deleteEntryTitle: "删除这条记录？",
    deleteEntryBody: "无法撤销。已结算周的加班库数字不会变。",
    savedToast: "已保存。",
    deletedToast: "已删除。",
    weeksTitle: "按周记录",
    weeksHint: "每周的工作与休息合计、目标，以及进入加班库的量。",
    thisWeek: "本周",
    pending: "进行中",
    settled: "已结算",
    bankDelta: "加班库",
    backupTitle: "备份",
    backupHint: "一个 JSON 文件包含所有记录、进行中的记录、目标与加班库、已结算的周。可转移到其他设备或重装后导入。只有 sessions 数组的简单文件也能读。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    clearAll: "全部删除",
    exported: "文件已下载。",
    importBad: "无法读取该文件。需要工时板 JSON 或记录列表。",
    importOk: "已导入 {n} 段记录。",
    importConfirmTitle: "用此文件替换？",
    importConfirmBody: "当前记录、加班库和目标将被文件内容替换。{n} 段记录。",
    clearAllTitle: "全部删除？",
    clearAllBody: "记录、加班库、目标和结算记录将从此设备删除。想保留请先导出 JSON。",
    cleared: "已全部删除。",
    save: "保存",
    cancel: "取消",
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
