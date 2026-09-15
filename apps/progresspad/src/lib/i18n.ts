/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "progresspad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://progresspad.try-dabble.com/og-image-ko.png",
  en: "https://progresspad.try-dabble.com/og-image-en.png",
  ja: "https://progresspad.try-dabble.com/og-image-ja.png",
  zh: "https://progresspad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoTimer"
  | "chipNoDyingTree"
  | "chipNoMidAds"
  | "chipNoUpsell"
  | "chipNoLogin"
  | "chipLocal"
  | "chipBackup"
  | "chipFree"
  | "chipLangs"
  | "howTitle"
  | "howBody"
  | "tasksTitle"
  | "newTask"
  | "newTaskTitle"
  | "editTaskTitle"
  | "taskTitleLabel"
  | "taskTitlePlaceholder"
  | "targetModeLabel"
  | "modeHours"
  | "modePercent"
  | "targetHoursLabel"
  | "targetHoursPlaceholder"
  | "targetPercentLabel"
  | "targetPercentPlaceholder"
  | "targetHint"
  | "minutesPerPercentLabel"
  | "minutesPerPercentHint"
  | "create"
  | "save"
  | "cancel"
  | "edit"
  | "deleteTask"
  | "deleteTaskTitle"
  | "deleteTaskBody"
  | "noTasks"
  | "noTasksHint"
  | "taskCreated"
  | "taskDeleted"
  | "badgeHours"
  | "badgePercent"
  | "loggedLabel"
  | "hoursMinutes"
  | "minutesN"
  | "ofTargetHours"
  | "ofTargetPercent"
  | "percentDone"
  | "remainingHM"
  | "remainingPct"
  | "doneLabel"
  | "overTargetMsg"
  | "earnedPercentLine"
  | "logFocus"
  | "logTitle"
  | "logHint"
  | "minutesLabel"
  | "minutesPlaceholder"
  | "quickAdd"
  | "dateLabel"
  | "noteLabel"
  | "notePlaceholder"
  | "needTitle"
  | "needTargetHours"
  | "needTargetPercent"
  | "needMinutes"
  | "needDate"
  | "savedToast"
  | "deletedToast"
  | "editLogTitle"
  | "editLog"
  | "deleteLog"
  | "deleteLogTitle"
  | "deleteLogBody"
  | "stageTitle"
  | "stageLabel"
  | "stagePlant"
  | "stageBlocks"
  | "stageOff"
  | "stageNeverDies"
  | "stageOffHint"
  | "stage0"
  | "stage1"
  | "stage2"
  | "stage3"
  | "stage4"
  | "timerTitle"
  | "timerHint"
  | "timerStart"
  | "timerStop"
  | "timerRunning"
  | "timerSaveTitle"
  | "timerSaveBody"
  | "timerSave"
  | "timerDiscard"
  | "timerTooShort"
  | "tabHistory"
  | "tabBackup"
  | "historyTitle"
  | "historyHint"
  | "noHistory"
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
  | "privacy"
  | "terms"
  | "guide"
  | "promiseTitle";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "프로그레스패드",
    shortName: "프로그레스패드",
    tagline: "무료 로컬 장기 과제 진행 기록. 시간 또는 % 목표, 날짜별 집중 분 기록, 진행 막대. 선택적 식물·블록 스테이지 — 강제 타이머·시드는 나무 없음. 여러 과제, JSON 백업. 계정 없음. 광고 없음.",
    metaDescription:
      "로그인도 광고도 없는 무료 로컬 장기 과제 진행 기록. 논문, 자격증 공부, 사이드 프로젝트처럼 며칠·몇 주 걸리는 과제를 추가하고 목표를 시간(예: 40시간) 또는 퍼센트로 정합니다. 집중한 시간은 나중에 날짜와 분으로 직접 기록하면 됩니다. 실시간 타이머를 켜 둘 필요가 없고, 하루 빠져도 아무것도 시들거나 죽지 않습니다. 진행 막대와 합계, 선택적 식물·블록 스테이지, 과제별 기록 목록(수정·삭제), 선택적 간단 타이머, 여러 과제, JSON 내보내기·불러오기, 안드로이드와 모든 브라우저에서 되는 오프라인 PWA. 계정 없음, 광고 없음, 구독 없음. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 강제 타이머 없이 손으로 기록하면 됩니다.",
    langLabel: "언어",
    chipNoTimer: "강제 타이머 없음",
    chipNoDyingTree: "시드는 나무 없음",
    chipNoMidAds: "집중 중 광고 없음",
    chipNoUpsell: "Plus 유도 없음",
    chipNoLogin: "로그인 없음",
    chipLocal: "이 기기에만 저장",
    chipBackup: "JSON 백업",
    chipFree: "영원히 무료",
    chipLangs: "ko/en/ja/zh",
    howTitle: "집중은 어디서든, 기록은 나중에 여기서",
    howBody: "과제마다 목표를 시간 또는 %로 정하세요. 집중한 뒤(또는 다음 날) 날짜와 분을 손으로 적으면 막대가 찹니다. 타이머는 선택이고, 하루 빠져도 아무것도 줄지 않습니다.",
    tasksTitle: "과제",
    newTask: "새 과제",
    newTaskTitle: "새 과제 만들기",
    editTaskTitle: "과제 수정",
    taskTitleLabel: "제목",
    taskTitlePlaceholder: "예: 논문 3장, 자격증 공부",
    targetModeLabel: "목표 방식",
    modeHours: "시간",
    modePercent: "퍼센트",
    targetHoursLabel: "목표 시간",
    targetHoursPlaceholder: "예: 40",
    targetPercentLabel: "목표 퍼센트",
    targetPercentPlaceholder: "예: 100",
    targetHint: "시간 목표는 기록한 분의 합으로, 퍼센트 목표는 “몇 분 = 1%” 환산으로 채워집니다. 나중에 바꿔도 기록은 그대로입니다.",
    minutesPerPercentLabel: "1%당 분 (퍼센트 과제 공통)",
    minutesPerPercentHint: "기본 30분 = 1%. 퍼센트 목표 과제에 공통 적용됩니다.",
    create: "만들기",
    save: "저장",
    cancel: "취소",
    edit: "수정",
    deleteTask: "과제 삭제",
    deleteTaskTitle: "이 과제를 삭제할까요?",
    deleteTaskBody: "목표와 집중 기록이 이 기기에서 지워집니다. 되돌릴 수 없습니다.",
    noTasks: "아직 과제가 없습니다",
    noTasksHint: "제목과 목표(시간 또는 %)를 정하고 시작하세요. 집중한 시간은 나중에 손으로 기록하면 됩니다.",
    taskCreated: "과제를 만들었습니다",
    taskDeleted: "과제를 삭제했습니다",
    badgeHours: "목표 {n}시간",
    badgePercent: "목표 {n}%",
    loggedLabel: "기록한 집중",
    hoursMinutes: "{h}시간 {m}분",
    minutesN: "{n}분",
    ofTargetHours: "/ {n}시간",
    ofTargetPercent: "/ {n}%",
    percentDone: "{pct}%",
    remainingHM: "{h}시간 {m}분 남음",
    remainingPct: "{n}% 남음",
    doneLabel: "목표 달성",
    overTargetMsg: "목표를 {extra} 넘었습니다. 잘했어요 — 시드는 것도, 초기화되는 것도 없습니다.",
    earnedPercentLine: "{n}% 획득 · {m}분 = 1%",
    logFocus: "집중 기록",
    logTitle: "집중 시간 기록",
    logHint: "집중한 분을 적으세요. 어제나 지난주에 한 것도 날짜만 바꿔 기록할 수 있습니다. 타이머는 필요 없습니다.",
    minutesLabel: "분",
    minutesPlaceholder: "예: 45",
    quickAdd: "빠른 입력",
    dateLabel: "날짜",
    noteLabel: "메모 (선택)",
    notePlaceholder: "예: 2장 초안",
    needTitle: "제목을 적어 주세요.",
    needTargetHours: "목표 시간은 0보다 큰 숫자여야 합니다 (예: 40 또는 2.5).",
    needTargetPercent: "목표 퍼센트는 1 이상의 정수여야 합니다.",
    needMinutes: "분은 1 이상의 정수여야 합니다.",
    needDate: "날짜를 확인해 주세요.",
    savedToast: "저장했습니다",
    deletedToast: "삭제했습니다",
    editLogTitle: "기록 수정",
    editLog: "수정",
    deleteLog: "삭제",
    deleteLogTitle: "이 기록을 삭제할까요?",
    deleteLogBody: "이 집중 기록이 지워지고 진행률이 바로 다시 계산됩니다.",
    stageTitle: "스테이지",
    stageLabel: "스테이지 표시",
    stagePlant: "식물",
    stageBlocks: "블록",
    stageOff: "끄기",
    stageNeverDies: "함께 자랍니다 — 절대 시들지 않아요",
    stageOffHint: "스테이지를 꺼 두었습니다. 기록은 그대로이고 언제든 다시 켤 수 있습니다.",
    stage0: "씨앗",
    stage1: "새싹",
    stage2: "잎",
    stage3: "꽃봉오리",
    stage4: "만개",
    timerTitle: "타이머 (선택)",
    timerHint: "선택 사항입니다. 손으로 기록하는 것만으로 충분합니다. 멈추면 오늘 날짜로 저장할지 물어봅니다.",
    timerStart: "타이머 시작",
    timerStop: "멈추기",
    timerRunning: "{time}부터 진행 중 · {n}분",
    timerSaveTitle: "타이머 분을 저장할까요?",
    timerSaveBody: "{n}분을 오늘 기록으로 저장합니다. 저장하지 않아도 아무 일도 없습니다.",
    timerSave: "오늘로 저장",
    timerDiscard: "저장 안 함",
    timerTooShort: "1분 미만이라 저장할 것이 없습니다.",
    tabHistory: "기록",
    tabBackup: "백업",
    historyTitle: "집중 기록",
    historyHint: "날짜, 분, 메모. 잘못 적었으면 수정하거나 삭제하세요. 진행률은 바로 다시 계산됩니다.",
    noHistory: "아직 기록이 없습니다. 첫 집중 분을 적어 보세요.",
    backupTitle: "백업",
    backupHint: "JSON으로 내보내면 기기를 바꾸거나 재설치해도 과제와 기록을 되살릴 수 있습니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 불러오기",
    clearAll: "모두 삭제",
    exported: "JSON을 내보냈습니다",
    importBad: "파일을 읽을 수 없습니다",
    importOk: "{n}개 과제를 불러왔습니다",
    importConfirmTitle: "JSON을 불러올까요?",
    importConfirmBody: "이 기기의 과제가 파일의 {n}개로 바뀝니다.",
    clearAllTitle: "모두 삭제할까요?",
    clearAllBody: "모든 과제와 기록이 이 기기에서 지워집니다. 남기려면 먼저 JSON으로 내보내세요.",
    cleared: "모두 삭제했습니다",
    privacy: "개인정보",
    terms: "약관",
    guide: "가이드",
    promiseTitle: "약속",
  },
  en: {
    title: "Progresspad",
    shortName: "Progresspad",
    tagline: "Free local long-task progress pad. Set a target in hours or percent, log focus minutes by date, watch the bar fill. Optional gentle plant or blocks stage — no forced timer, no dying tree. Multi-task list, JSON backup. No account. No ads.",
    metaDescription:
      "A free local progress pad for tasks that take days or weeks, with no login and no ads. Add a thesis, an exam prep, a side project, and set the target in hours (say 40h) or in percent. Log the focus time afterwards by hand: a date and a number of minutes. No live timer has to run, and a missed day never wilts or resets anything. Progress bar and totals, an optional plant or blocks stage that only grows, a per-task log list you can edit or delete, an optional simple timer, several tasks, JSON export and import, and an offline PWA that works on Android and any browser. No account, no ads, no subscription. Data stays on this device.",
    localOnly: "Your data stays on this device. No login. No ads. Log by hand — no forced timer required.",
    langLabel: "Language",
    chipNoTimer: "No forced timer",
    chipNoDyingTree: "No dying tree",
    chipNoMidAds: "No ads mid-focus",
    chipNoUpsell: "No Plus upsell",
    chipNoLogin: "No login",
    chipLocal: "Stays on this device",
    chipBackup: "JSON backup",
    chipFree: "Free forever",
    chipLangs: "ko/en/ja/zh",
    howTitle: "Focus anywhere, log it here afterwards",
    howBody: "Give each task a target in hours or percent. After a session (or the next day) write down the date and the minutes by hand, and the bar fills. The timer is optional, and a day without a log never takes anything away.",
    tasksTitle: "Tasks",
    newTask: "New task",
    newTaskTitle: "Create a task",
    editTaskTitle: "Edit task",
    taskTitleLabel: "Title",
    taskTitlePlaceholder: "e.g. Thesis chapter 3, Exam prep",
    targetModeLabel: "Target type",
    modeHours: "Hours",
    modePercent: "Percent",
    targetHoursLabel: "Target hours",
    targetHoursPlaceholder: "e.g. 40",
    targetPercentLabel: "Target percent",
    targetPercentPlaceholder: "e.g. 100",
    targetHint: "An hours target fills from the sum of logged minutes. A percent target converts minutes with a “minutes = 1%” rate. Change it later and the logs stay.",
    minutesPerPercentLabel: "Minutes per 1% (shared by percent tasks)",
    minutesPerPercentHint: "Default 30 min = 1%. Applies to every percent-target task.",
    create: "Create",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    deleteTask: "Delete task",
    deleteTaskTitle: "Delete this task?",
    deleteTaskBody: "Its target and every focus log are removed from this device. This cannot be undone.",
    noTasks: "No tasks yet",
    noTasksHint: "Name a task and give it a target in hours or percent. Log the focus time afterwards by hand.",
    taskCreated: "Task created",
    taskDeleted: "Task deleted",
    badgeHours: "{n}h target",
    badgePercent: "{n}% target",
    loggedLabel: "Focus logged",
    hoursMinutes: "{h}h {m}m",
    minutesN: "{n} min",
    ofTargetHours: "/ {n}h",
    ofTargetPercent: "/ {n}%",
    percentDone: "{pct}%",
    remainingHM: "{h}h {m}m to go",
    remainingPct: "{n}% to go",
    doneLabel: "Target reached",
    overTargetMsg: "Over the target by {extra}. Nice — nothing wilts, nothing resets.",
    earnedPercentLine: "{n}% earned · {m} min = 1%",
    logFocus: "Log focus",
    logTitle: "Log focus time",
    logHint: "Write down the minutes you focused. Yesterday or last week works too: just change the date. No timer needed.",
    minutesLabel: "Minutes",
    minutesPlaceholder: "e.g. 45",
    quickAdd: "Quick add",
    dateLabel: "Date",
    noteLabel: "Note (optional)",
    notePlaceholder: "e.g. chapter 2 draft",
    needTitle: "Please enter a title.",
    needTargetHours: "Target hours must be a number above 0 (e.g. 40 or 2.5).",
    needTargetPercent: "Target percent must be a whole number of 1 or more.",
    needMinutes: "Minutes must be a whole number of 1 or more.",
    needDate: "Please check the date.",
    savedToast: "Saved",
    deletedToast: "Deleted",
    editLogTitle: "Edit log",
    editLog: "Edit",
    deleteLog: "Delete",
    deleteLogTitle: "Delete this log?",
    deleteLogBody: "This focus entry is removed and progress is recomputed right away.",
    stageTitle: "Stage",
    stageLabel: "Stage visual",
    stagePlant: "Plant",
    stageBlocks: "Blocks",
    stageOff: "Off",
    stageNeverDies: "Grows with you — never dies",
    stageOffHint: "The stage is hidden. Your logs are untouched; turn it back on any time.",
    stage0: "Seed",
    stage1: "Sprout",
    stage2: "Leaves",
    stage3: "Bud",
    stage4: "In bloom",
    timerTitle: "Timer (optional)",
    timerHint: "Entirely optional. Logging by hand is enough. When you stop, it offers to save the minutes to today.",
    timerStart: "Start timer",
    timerStop: "Stop",
    timerRunning: "Running since {time} · {n} min",
    timerSaveTitle: "Save the timer minutes?",
    timerSaveBody: "Save {n} min as a log for today. Skipping changes nothing.",
    timerSave: "Save to today",
    timerDiscard: "Don't save",
    timerTooShort: "Under a minute, nothing to save.",
    tabHistory: "History",
    tabBackup: "Backup",
    historyTitle: "Focus history",
    historyHint: "Date, minutes, note. Made a mistake? Edit or delete the entry; progress recomputes immediately.",
    noHistory: "No logs yet. Write down your first focus minutes.",
    backupTitle: "Backup",
    backupHint: "Export a JSON file to bring your tasks and logs back after a reinstall or on another device.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    clearAll: "Delete everything",
    exported: "JSON exported",
    importBad: "Could not read that file",
    importOk: "{n} tasks imported",
    importConfirmTitle: "Import this JSON?",
    importConfirmBody: "The tasks on this device are replaced by the {n} in the file.",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Every task and log is removed from this device. Export a JSON first if you want to keep them.",
    cleared: "Everything deleted",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    promiseTitle: "Promises",
  },
  ja: {
    title: "プログレスパッド",
    shortName: "プログレスパッド",
    tagline: "無料のローカル長期タスク進捗パッド。時間または％の目標、日付ごとの集中分を記録、進捗バー。任意の植物・ブロック演出 — 強制タイマーも枯れる木もなし。複数タスク、JSONバックアップ。アカウント不要。広告なし。",
    metaDescription:
      "ログインも広告もない、数日・数週間かかるタスクのための無料ローカル進捗パッド。論文、試験勉強、サイドプロジェクトを追加し、目標を時間（例：40時間）またはパーセントで決めます。集中した時間は後から日付と分を手で記録するだけ。ライブタイマーを回す必要はなく、一日空いても何も枯れず、リセットもされません。進捗バーと合計、育つだけの任意の植物・ブロック演出、編集・削除できるタスクごとの記録一覧、任意の簡単タイマー、複数タスク、JSONのエクスポート・インポート、Androidとあらゆるブラウザで動くオフラインPWA。アカウント不要、広告なし、サブスクなし。データはこの端末だけに。",
    localOnly: "データはこの端末にだけ保存されます。ログイン・広告なし。強制タイマーなしで手入力で記録できます。",
    langLabel: "言語",
    chipNoTimer: "強制タイマーなし",
    chipNoDyingTree: "枯れる木なし",
    chipNoMidAds: "集中中の広告なし",
    chipNoUpsell: "Plus への誘導なし",
    chipNoLogin: "ログイン不要",
    chipLocal: "この端末にだけ保存",
    chipBackup: "JSONバックアップ",
    chipFree: "ずっと無料",
    chipLangs: "ko/en/ja/zh",
    howTitle: "集中はどこでも、記録は後からここで",
    howBody: "タスクごとに目標を時間か％で決めます。集中した後（または翌日）に日付と分を手で書けばバーが満ちます。タイマーは任意で、記録のない日があっても何も減りません。",
    tasksTitle: "タスク",
    newTask: "新しいタスク",
    newTaskTitle: "タスクを作成",
    editTaskTitle: "タスクを編集",
    taskTitleLabel: "タイトル",
    taskTitlePlaceholder: "例：論文3章、資格試験の勉強",
    targetModeLabel: "目標の種類",
    modeHours: "時間",
    modePercent: "パーセント",
    targetHoursLabel: "目標時間",
    targetHoursPlaceholder: "例：40",
    targetPercentLabel: "目標パーセント",
    targetPercentPlaceholder: "例：100",
    targetHint: "時間目標は記録した分の合計で満ちます。パーセント目標は「何分＝1%」の換算で満ちます。後で変えても記録はそのままです。",
    minutesPerPercentLabel: "1%あたりの分（パーセントタスク共通）",
    minutesPerPercentHint: "既定は30分＝1%。パーセント目標のすべてのタスクに適用されます。",
    create: "作成",
    save: "保存",
    cancel: "キャンセル",
    edit: "編集",
    deleteTask: "タスクを削除",
    deleteTaskTitle: "このタスクを削除しますか？",
    deleteTaskBody: "目標とすべての集中記録がこの端末から消えます。元に戻せません。",
    noTasks: "まだタスクがありません",
    noTasksHint: "タイトルと目標（時間か％）を決めて始めましょう。集中した時間は後から手で記録できます。",
    taskCreated: "タスクを作成しました",
    taskDeleted: "タスクを削除しました",
    badgeHours: "目標 {n}時間",
    badgePercent: "目標 {n}%",
    loggedLabel: "記録した集中",
    hoursMinutes: "{h}時間{m}分",
    minutesN: "{n}分",
    ofTargetHours: "/ {n}時間",
    ofTargetPercent: "/ {n}%",
    percentDone: "{pct}%",
    remainingHM: "残り {h}時間{m}分",
    remainingPct: "残り {n}%",
    doneLabel: "目標達成",
    overTargetMsg: "目標を {extra} 超えました。お見事 — 枯れるものもリセットされるものもありません。",
    earnedPercentLine: "{n}% 獲得 · {m}分＝1%",
    logFocus: "集中を記録",
    logTitle: "集中時間を記録",
    logHint: "集中した分を書きます。昨日や先週の分も日付を変えれば記録できます。タイマーは不要です。",
    minutesLabel: "分",
    minutesPlaceholder: "例：45",
    quickAdd: "クイック入力",
    dateLabel: "日付",
    noteLabel: "メモ（任意）",
    notePlaceholder: "例：2章の下書き",
    needTitle: "タイトルを入力してください。",
    needTargetHours: "目標時間は0より大きい数にしてください（例：40 や 2.5）。",
    needTargetPercent: "目標パーセントは1以上の整数にしてください。",
    needMinutes: "分は1以上の整数にしてください。",
    needDate: "日付を確認してください。",
    savedToast: "保存しました",
    deletedToast: "削除しました",
    editLogTitle: "記録を編集",
    editLog: "編集",
    deleteLog: "削除",
    deleteLogTitle: "この記録を削除しますか？",
    deleteLogBody: "この集中記録が消え、進捗はすぐに再計算されます。",
    stageTitle: "ステージ",
    stageLabel: "ステージ表示",
    stagePlant: "植物",
    stageBlocks: "ブロック",
    stageOff: "オフ",
    stageNeverDies: "一緒に育つ — 決して枯れない",
    stageOffHint: "ステージは非表示です。記録はそのままで、いつでも戻せます。",
    stage0: "種",
    stage1: "芽",
    stage2: "葉",
    stage3: "つぼみ",
    stage4: "満開",
    timerTitle: "タイマー（任意）",
    timerHint: "完全に任意です。手入力の記録だけで十分。止めると今日の分として保存するか尋ねます。",
    timerStart: "タイマー開始",
    timerStop: "停止",
    timerRunning: "{time} から計測中 · {n}分",
    timerSaveTitle: "タイマーの分を保存しますか？",
    timerSaveBody: "{n}分を今日の記録として保存します。保存しなくても何も変わりません。",
    timerSave: "今日として保存",
    timerDiscard: "保存しない",
    timerTooShort: "1分未満なので保存するものがありません。",
    tabHistory: "履歴",
    tabBackup: "バックアップ",
    historyTitle: "集中の履歴",
    historyHint: "日付、分、メモ。間違えたら編集か削除を。進捗はすぐに再計算されます。",
    noHistory: "まだ記録がありません。最初の集中分を書いてみましょう。",
    backupTitle: "バックアップ",
    backupHint: "JSONにエクスポートしておくと、再インストールや別の端末でもタスクと記録を戻せます。",
    exportJson: "JSONをエクスポート",
    importJson: "JSONをインポート",
    clearAll: "すべて削除",
    exported: "JSONをエクスポートしました",
    importBad: "ファイルを読めませんでした",
    importOk: "{n}件のタスクをインポートしました",
    importConfirmTitle: "このJSONをインポートしますか？",
    importConfirmBody: "この端末のタスクはファイルの{n}件に置き換わります。",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "すべてのタスクと記録がこの端末から消えます。残したい場合は先にJSONをエクスポートしてください。",
    cleared: "すべて削除しました",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    promiseTitle: "約束",
  },
  zh: {
    title: "进度板",
    shortName: "进度板",
    tagline: "免费本地长期任务进度板。按小时或百分比设目标，按日期记录专注分钟，进度条填充。可选温和植物/方块阶段 — 无强制计时器、无枯死树。多任务、JSON 备份。无需账号。无广告。",
    metaDescription:
      "无登录、无广告的免费本地进度板，专为要花几天或几周的任务而做。添加论文、备考、副业项目，目标按小时（如 40 小时）或百分比设定。专注时间事后手动记录：一个日期加多少分钟。不必开着实时计时器，漏掉一天也不会枯萎或重置任何东西。进度条与合计、只会生长的可选植物/方块阶段、可编辑删除的每任务记录列表、可选简易计时器、多任务、JSON 导出导入，以及在 Android 和任何浏览器都能用的离线 PWA。无需账号、无广告、无订阅。数据仅保存在此设备。",
    localOnly: "数据仅保存在此设备。无登录、无广告。可手记，无需强制计时器。",
    langLabel: "语言",
    chipNoTimer: "无强制计时器",
    chipNoDyingTree: "无枯死树",
    chipNoMidAds: "专注中无广告",
    chipNoUpsell: "无 Plus 推销",
    chipNoLogin: "无需登录",
    chipLocal: "仅存于此设备",
    chipBackup: "JSON 备份",
    chipFree: "永久免费",
    chipLangs: "ko/en/ja/zh",
    howTitle: "在哪专注都行，之后来这里记一笔",
    howBody: "给每个任务设一个小时或百分比目标。专注之后（或第二天）手动写下日期和分钟，进度条就会填充。计时器是可选的，没记录的日子不会扣掉任何东西。",
    tasksTitle: "任务",
    newTask: "新任务",
    newTaskTitle: "创建任务",
    editTaskTitle: "编辑任务",
    taskTitleLabel: "标题",
    taskTitlePlaceholder: "例：论文第三章、备考",
    targetModeLabel: "目标类型",
    modeHours: "小时",
    modePercent: "百分比",
    targetHoursLabel: "目标小时数",
    targetHoursPlaceholder: "例：40",
    targetPercentLabel: "目标百分比",
    targetPercentPlaceholder: "例：100",
    targetHint: "小时目标由记录的分钟总和填满；百分比目标按“多少分钟 = 1%”换算。之后修改也不会影响已有记录。",
    minutesPerPercentLabel: "每 1% 对应分钟（百分比任务共用）",
    minutesPerPercentHint: "默认 30 分钟 = 1%。适用于所有百分比目标任务。",
    create: "创建",
    save: "保存",
    cancel: "取消",
    edit: "编辑",
    deleteTask: "删除任务",
    deleteTaskTitle: "删除此任务？",
    deleteTaskBody: "它的目标和所有专注记录将从此设备移除，无法撤销。",
    noTasks: "还没有任务",
    noTasksHint: "写下标题，设一个小时或百分比目标。专注时间之后手动记录即可。",
    taskCreated: "已创建任务",
    taskDeleted: "已删除任务",
    badgeHours: "目标 {n} 小时",
    badgePercent: "目标 {n}%",
    loggedLabel: "已记录专注",
    hoursMinutes: "{h}小时{m}分",
    minutesN: "{n} 分钟",
    ofTargetHours: "/ {n} 小时",
    ofTargetPercent: "/ {n}%",
    percentDone: "{pct}%",
    remainingHM: "还差 {h}小时{m}分",
    remainingPct: "还差 {n}%",
    doneLabel: "已达目标",
    overTargetMsg: "超出目标 {extra}。很棒 — 不会枯萎，也不会重置。",
    earnedPercentLine: "已获 {n}% · {m} 分钟 = 1%",
    logFocus: "记录专注",
    logTitle: "记录专注时间",
    logHint: "写下你专注的分钟数。昨天或上周的也可以，改一下日期即可。不需要计时器。",
    minutesLabel: "分钟",
    minutesPlaceholder: "例：45",
    quickAdd: "快速添加",
    dateLabel: "日期",
    noteLabel: "备注（可选）",
    notePlaceholder: "例：第二章草稿",
    needTitle: "请输入标题。",
    needTargetHours: "目标小时数必须大于 0（例如 40 或 2.5）。",
    needTargetPercent: "目标百分比必须是不小于 1 的整数。",
    needMinutes: "分钟必须是不小于 1 的整数。",
    needDate: "请检查日期。",
    savedToast: "已保存",
    deletedToast: "已删除",
    editLogTitle: "编辑记录",
    editLog: "编辑",
    deleteLog: "删除",
    deleteLogTitle: "删除此记录？",
    deleteLogBody: "这条专注记录将被移除，进度会立即重新计算。",
    stageTitle: "阶段",
    stageLabel: "阶段显示",
    stagePlant: "植物",
    stageBlocks: "方块",
    stageOff: "关闭",
    stageNeverDies: "与你一起生长 — 永不枯死",
    stageOffHint: "阶段已隐藏。记录不受影响，随时可以重新打开。",
    stage0: "种子",
    stage1: "嫩芽",
    stage2: "叶子",
    stage3: "花苞",
    stage4: "盛开",
    timerTitle: "计时器（可选）",
    timerHint: "完全可选。手动记录就足够了。停止时会询问是否把分钟保存到今天。",
    timerStart: "开始计时",
    timerStop: "停止",
    timerRunning: "从 {time} 开始 · {n} 分钟",
    timerSaveTitle: "保存计时器的分钟？",
    timerSaveBody: "把 {n} 分钟保存为今天的记录。不保存也不会有任何影响。",
    timerSave: "保存到今天",
    timerDiscard: "不保存",
    timerTooShort: "不足一分钟，没有可保存的内容。",
    tabHistory: "历史",
    tabBackup: "备份",
    historyTitle: "专注历史",
    historyHint: "日期、分钟、备注。记错了？编辑或删除即可，进度会立即重新计算。",
    noHistory: "还没有记录。写下你的第一笔专注分钟吧。",
    backupTitle: "备份",
    backupHint: "导出 JSON 文件，重装或换设备后可以恢复任务和记录。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    clearAll: "全部删除",
    exported: "已导出 JSON",
    importBad: "无法读取该文件",
    importOk: "已导入 {n} 个任务",
    importConfirmTitle: "导入此 JSON？",
    importConfirmBody: "此设备上的任务将被文件中的 {n} 个替换。",
    clearAllTitle: "全部删除？",
    clearAllBody: "所有任务和记录将从此设备移除。想保留请先导出 JSON。",
    cleared: "已全部删除",
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
