/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "timerpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://timerpad.try-dabble.com/og-image-ko.png",
  en: "https://timerpad.try-dabble.com/og-image-en.png",
  ja: "https://timerpad.try-dabble.com/og-image-ja.png",
  zh: "https://timerpad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoLogin"
  | "chipNoLock"
  | "chipHistoryFree"
  | "chipBackup"
  | "chipNoAds"
  | "chipLocal"
  | "chipLangs"
  | "modeCountdown"
  | "modePomodoro"
  | "modeInterval"
  | "modeStopwatch"
  | "countdownTitle"
  | "pomodoroTitle"
  | "intervalTitle"
  | "stopwatchTitle"
  | "start"
  | "pause"
  | "resume"
  | "reset"
  | "stop"
  | "skip"
  | "lap"
  | "hours"
  | "minutes"
  | "seconds"
  | "rounds"
  | "longEvery"
  | "workLabel"
  | "restLabel"
  | "longRestLabel"
  | "phaseWork"
  | "phaseRest"
  | "phaseLongRest"
  | "roundOf"
  | "doneLabel"
  | "nextPhase"
  | "addStep"
  | "removeStep"
  | "stepKind"
  | "stepSeconds"
  | "stepName"
  | "editPreset"
  | "presetHint"
  | "saveRoutine"
  | "routineName"
  | "routineNamePlaceholder"
  | "routineSaved"
  | "routineLoaded"
  | "routineDeleted"
  | "deleteRoutine"
  | "noRoutines"
  | "loadRoutine"
  | "needName"
  | "needStep"
  | "routinesTitle"
  | "lapsTitle"
  | "noLaps"
  | "lapN"
  | "midHint"
  | "keepTicking"
  | "soundOn"
  | "soundOff"
  | "soundHint"
  | "wakeOn"
  | "wakeOff"
  | "wakeHint"
  | "fullscreen"
  | "exitFullscreen"
  | "fullscreenHint"
  | "backupTitle"
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
  | "settingsTitle"
  | "fontSizeLabel"
  | "fontMd"
  | "fontLg"
  | "fontXl"
  | "save"
  | "cancel"
  | "delete"
  | "edit"
  | "add"
  | "privacy"
  | "terms"
  | "guide"
  | "idle"
  | "running"
  | "paused";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "타이머패드",
    shortName: "타이머패드",
    tagline: "무료 로컬 HIIT·포모도로·스톱워치. 편집 가능한 프리셋, 랩, 루틴 저장, 전체화면·화면 켜짐, 소리, JSON 백업. 계정 없음. 광고 없음.",
    metaDescription:
      "계정 없는 무료 로컬 타이머. 카운트다운, 포모도로 라운드, HIIT·타바타 인터벌, 스톱워치와 랩을 한 화면에서. 프리셋은 모두 편집할 수 있고, 루틴을 저장하고, 운동 중간에 멈추거나 리셋할 수 있습니다. 전체화면과 화면 켜짐, 짧은 알림음, 백그라운드에서도 드리프트를 보정한 시각. JSON 백업. 광고 없음, 결제 없음. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    chipNoLogin: "로그인 없음",
    chipNoLock: "운동 중 정지·리셋 가능",
    chipHistoryFree: "핵심 타이머 모두 무료",
    chipBackup: "JSON 백업",
    chipNoAds: "광고 없음",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    modeCountdown: "카운트다운",
    modePomodoro: "포모도로",
    modeInterval: "인터벌",
    modeStopwatch: "스톱워치",
    countdownTitle: "카운트다운",
    pomodoroTitle: "포모도로 라운드",
    intervalTitle: "HIIT · 타바타",
    stopwatchTitle: "스톱워치와 랩",
    start: "시작",
    pause: "일시정지",
    resume: "이어하기",
    reset: "리셋",
    stop: "정지",
    skip: "다음 구간",
    lap: "랩",
    hours: "시간",
    minutes: "분",
    seconds: "초",
    rounds: "라운드",
    longEvery: "긴 휴식 주기",
    workLabel: "운동",
    restLabel: "휴식",
    longRestLabel: "긴 휴식",
    phaseWork: "운동",
    phaseRest: "휴식",
    phaseLongRest: "긴 휴식",
    roundOf: "라운드 {n} / {total}",
    doneLabel: "끝",
    nextPhase: "다음",
    addStep: "구간 추가",
    removeStep: "구간 삭제",
    stepKind: "종류",
    stepSeconds: "초",
    stepName: "이름 (선택)",
    editPreset: "프리셋 편집",
    presetHint: "타바타·HIIT를 포함해 모든 프리셋은 숫자와 구간을 바꿀 수 있습니다. 고정된 프리셋은 없습니다.",
    saveRoutine: "루틴 저장",
    routineName: "루틴 이름",
    routineNamePlaceholder: "예: 아침 타바타",
    routineSaved: "루틴을 저장했어요",
    routineLoaded: "루틴을 불러왔어요",
    routineDeleted: "루틴을 지웠어요",
    deleteRoutine: "루틴 삭제",
    noRoutines: "아직 저장한 루틴이 없어요. 지금 설정을 저장해 두세요.",
    loadRoutine: "불러오기",
    needName: "이름을 적어 주세요",
    needStep: "초가 1 이상인 구간이 하나 이상 필요해요",
    routinesTitle: "저장한 루틴",
    lapsTitle: "랩",
    noLaps: "아직 랩이 없어요. 달리는 동안 랩을 눌러 구간을 남기세요.",
    lapN: "랩 {n}",
    midHint: "운동 중간에도 정지와 리셋은 항상 열려 있습니다. 잠금이나 광고는 없습니다.",
    keepTicking: "탭을 백그라운드로 보내도 가능한 한 계속 셉니다. 다시 열면 실제 경과에 맞춰 맞춰집니다.",
    soundOn: "소리 켜짐",
    soundOff: "소리 꺼짐",
    soundHint: "짧은 알림음만 납니다. 음악을 가로채거나 계속 죽이지 않습니다.",
    wakeOn: "화면 켜짐",
    wakeOff: "화면 꺼짐 허용",
    wakeHint: "운동하는 동안 화면이 꺼지지 않게 요청합니다. 브라우저가 거절하면 그냥 넘어갑니다.",
    fullscreen: "전체화면",
    exitFullscreen: "전체화면 종료",
    fullscreenHint: "큰 숫자만 남기고 보고 싶을 때.",
    backupTitle: "백업",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    clearAll: "모두 지우기",
    exported: "파일을 저장했어요",
    importBad: "이 파일은 타이머패드 백업이 아니에요",
    importOk: "백업을 가져왔어요",
    importConfirmTitle: "이 백업으로 바꿀까요?",
    importConfirmBody: "지금 기기에 있는 루틴과 설정이 파일 내용으로 바뀝니다. 되돌릴 수 없어요.",
    clearAllTitle: "모든 데이터를 지울까요?",
    clearAllBody: "저장한 루틴과 설정이 기본값으로 돌아갑니다. 되돌릴 수 없어요.",
    cleared: "모두 지웠어요",
    settingsTitle: "설정",
    fontSizeLabel: "글자 크기",
    fontMd: "보통",
    fontLg: "크게",
    fontXl: "더 크게",
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    edit: "편집",
    add: "추가",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
    idle: "대기",
    running: "진행 중",
    paused: "일시정지",
  },
  en: {
    title: "Timerpad",
    shortName: "Timerpad",
    tagline: "Free local HIIT, Pomodoro and stopwatch. Editable presets, laps, saved routines, fullscreen and wake lock, sounds, JSON backup. No account. No ads.",
    metaDescription:
      "Free local timer with no account. Countdown, Pomodoro rounds, HIIT and Tabata intervals, and a stopwatch with laps in one place. Every preset is editable, you can save routines, and you can stop or reset mid-workout. Fullscreen and wake lock, short cue sounds, drift-corrected time that keeps ticking when the tab is in the background as much as the browser allows. JSON backup. No ads, no payments. Data stays on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    chipNoLogin: "No login",
    chipNoLock: "Stop or reset mid-workout",
    chipHistoryFree: "Every timer is free",
    chipBackup: "JSON backup",
    chipNoAds: "No ads",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    modeCountdown: "Countdown",
    modePomodoro: "Pomodoro",
    modeInterval: "Intervals",
    modeStopwatch: "Stopwatch",
    countdownTitle: "Countdown",
    pomodoroTitle: "Pomodoro rounds",
    intervalTitle: "HIIT · Tabata",
    stopwatchTitle: "Stopwatch and laps",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    stop: "Stop",
    skip: "Skip interval",
    lap: "Lap",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    rounds: "Rounds",
    longEvery: "Long break every",
    workLabel: "Work",
    restLabel: "Rest",
    longRestLabel: "Long rest",
    phaseWork: "Work",
    phaseRest: "Rest",
    phaseLongRest: "Long rest",
    roundOf: "Round {n} / {total}",
    doneLabel: "Done",
    nextPhase: "Next",
    addStep: "Add interval",
    removeStep: "Remove interval",
    stepKind: "Kind",
    stepSeconds: "Seconds",
    stepName: "Name (optional)",
    editPreset: "Edit preset",
    presetHint: "Tabata, HIIT and every other preset can change its numbers and steps. Nothing is locked as rigid-only.",
    saveRoutine: "Save routine",
    routineName: "Routine name",
    routineNamePlaceholder: "e.g. Morning Tabata",
    routineSaved: "Routine saved",
    routineLoaded: "Routine loaded",
    routineDeleted: "Routine deleted",
    deleteRoutine: "Delete routine",
    noRoutines: "No saved routines yet. Save the setup you are looking at.",
    loadRoutine: "Load",
    needName: "Give it a name",
    needStep: "Need at least one interval of 1 second or more",
    routinesTitle: "Saved routines",
    lapsTitle: "Laps",
    noLaps: "No laps yet. Tap Lap while it is running to stamp a split.",
    lapN: "Lap {n}",
    midHint: "Stop and Reset stay available in the middle of a workout. No lock, no interstitial.",
    keepTicking: "Keeps counting as much as the browser allows when the tab is in the background, and snaps to real elapsed time when you come back.",
    soundOn: "Sound on",
    soundOff: "Sound off",
    soundHint: "Short cue tones only. We do not take over or duck your music for good.",
    wakeOn: "Keep screen on",
    wakeOff: "Allow sleep",
    wakeHint: "Asks the browser to keep the screen awake during a run. If it refuses, the timer still runs.",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    fullscreenHint: "Just the big digits, when you want them.",
    backupTitle: "Backup",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    clearAll: "Delete everything",
    exported: "File saved",
    importBad: "That file is not a Timerpad backup",
    importOk: "Backup imported",
    importConfirmTitle: "Replace with this backup?",
    importConfirmBody: "Routines and settings on this device will become the file. This cannot be undone.",
    clearAllTitle: "Delete all data?",
    clearAllBody: "Saved routines and settings return to the starter set. This cannot be undone.",
    cleared: "Everything deleted",
    settingsTitle: "Settings",
    fontSizeLabel: "Text size",
    fontMd: "Regular",
    fontLg: "Large",
    fontXl: "Larger",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    idle: "Ready",
    running: "Running",
    paused: "Paused",
  },
  ja: {
    title: "タイマーパッド",
    shortName: "タイマーパッド",
    tagline: "無料のローカルHIIT・ポモドーロ・ストップウォッチ。編集できるプリセット、ラップ、ルーティン保存、全画面・画面点灯、音、JSONバックアップ。アカウント不要。広告なし。",
    metaDescription:
      "アカウント不要の無料ローカルタイマー。カウントダウン、ポモドーロのラウンド、HIIT・タバタのインターバル、ラップ付きストップウォッチを一つの画面で。プリセットはすべて編集でき、ルーティンを保存でき、ワークアウトの途中でも停止やリセットができます。全画面と画面点灯、短い合図音、タブを裏に回してもブラウザが許す限り進む補正済みの時刻。JSONバックアップ。広告なし、課金なし。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    chipNoLogin: "ログイン不要",
    chipNoLock: "途中で停止・リセット可",
    chipHistoryFree: "タイマーはすべて無料",
    chipBackup: "JSONバックアップ",
    chipNoAds: "広告なし",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    modeCountdown: "カウントダウン",
    modePomodoro: "ポモドーロ",
    modeInterval: "インターバル",
    modeStopwatch: "ストップウォッチ",
    countdownTitle: "カウントダウン",
    pomodoroTitle: "ポモドーロのラウンド",
    intervalTitle: "HIIT · タバタ",
    stopwatchTitle: "ストップウォッチとラップ",
    start: "開始",
    pause: "一時停止",
    resume: "再開",
    reset: "リセット",
    stop: "停止",
    skip: "次の区間",
    lap: "ラップ",
    hours: "時間",
    minutes: "分",
    seconds: "秒",
    rounds: "ラウンド",
    longEvery: "長い休憩の間隔",
    workLabel: "運動",
    restLabel: "休憩",
    longRestLabel: "長い休憩",
    phaseWork: "運動",
    phaseRest: "休憩",
    phaseLongRest: "長い休憩",
    roundOf: "ラウンド {n} / {total}",
    doneLabel: "完了",
    nextPhase: "次",
    addStep: "区間を追加",
    removeStep: "区間を削除",
    stepKind: "種類",
    stepSeconds: "秒",
    stepName: "名前（任意）",
    editPreset: "プリセットを編集",
    presetHint: "タバタもHIITも、数字と区間は変えられます。固定だけのプリセットはありません。",
    saveRoutine: "ルーティンを保存",
    routineName: "ルーティン名",
    routineNamePlaceholder: "例: 朝のタバタ",
    routineSaved: "ルーティンを保存しました",
    routineLoaded: "ルーティンを読み込みました",
    routineDeleted: "ルーティンを消しました",
    deleteRoutine: "ルーティンを削除",
    noRoutines: "まだ保存したルーティンがありません。今の設定を残してください。",
    loadRoutine: "読み込む",
    needName: "名前を入れてください",
    needStep: "1秒以上の区間が1つ以上必要です",
    routinesTitle: "保存したルーティン",
    lapsTitle: "ラップ",
    noLaps: "まだラップがありません。動作中にラップを押すと区間が残ります。",
    lapN: "ラップ {n}",
    midHint: "ワークアウトの途中でも停止とリセットはいつでも使えます。ロックも広告もありません。",
    keepTicking: "タブを裏に回しても、ブラウザが許す限り数え続け、戻ったときに実際の経過に合わせます。",
    soundOn: "音オン",
    soundOff: "音オフ",
    soundHint: "短い合図音だけです。音楽を奪ったり、ずっと小さくしたりしません。",
    wakeOn: "画面を点灯",
    wakeOff: "スリープを許可",
    wakeHint: "動作中は画面を消さないようブラウザに頼みます。拒否されてもタイマーは進みます。",
    fullscreen: "全画面",
    exitFullscreen: "全画面を終了",
    fullscreenHint: "大きな数字だけ見たいとき。",
    backupTitle: "バックアップ",
    exportJson: "JSONを書き出す",
    importJson: "JSONを取り込む",
    clearAll: "すべて削除",
    exported: "ファイルを保存しました",
    importBad: "そのファイルはタイマーパッドのバックアップではありません",
    importOk: "バックアップを取り込みました",
    importConfirmTitle: "このバックアップで置き換えますか？",
    importConfirmBody: "この端末のルーティンと設定がファイルの内容になります。元に戻せません。",
    clearAllTitle: "すべてのデータを消しますか？",
    clearAllBody: "保存したルーティンと設定が初期状態に戻ります。元に戻せません。",
    cleared: "すべて消しました",
    settingsTitle: "設定",
    fontSizeLabel: "文字サイズ",
    fontMd: "ふつう",
    fontLg: "大きく",
    fontXl: "さらに大きく",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    edit: "編集",
    add: "追加",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    idle: "待機",
    running: "動作中",
    paused: "一時停止",
  },
  zh: {
    title: "计时板",
    shortName: "计时板",
    tagline: "免费本地 HIIT、番茄钟与秒表。可编辑预设、计圈、保存套路、全屏与保持亮屏、提示音、JSON 备份。无需账号。无广告。",
    metaDescription:
      "无需账号的免费本地计时器。倒计时、番茄钟轮次、HIIT 与 Tabata 间歇、带计圈的秒表都在同一屏。每个预设都能改，套路可以保存，训练中途也能停止或重置。全屏与保持亮屏、短提示音、标签页在后台时也会尽量按真实时间走。JSON 备份。无广告，无付费。数据只留在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    chipNoLogin: "无需登录",
    chipNoLock: "中途可停可重置",
    chipHistoryFree: "核心计时全部免费",
    chipBackup: "JSON 备份",
    chipNoAds: "无广告",
    chipLocal: "数据只在此设备",
    chipLangs: "ko/en/ja/zh",
    modeCountdown: "倒计时",
    modePomodoro: "番茄钟",
    modeInterval: "间歇",
    modeStopwatch: "秒表",
    countdownTitle: "倒计时",
    pomodoroTitle: "番茄钟轮次",
    intervalTitle: "HIIT · 塔巴塔",
    stopwatchTitle: "秒表与计圈",
    start: "开始",
    pause: "暂停",
    resume: "继续",
    reset: "重置",
    stop: "停止",
    skip: "下一段",
    lap: "计圈",
    hours: "小时",
    minutes: "分",
    seconds: "秒",
    rounds: "轮次",
    longEvery: "长休息间隔",
    workLabel: "运动",
    restLabel: "休息",
    longRestLabel: "长休息",
    phaseWork: "运动",
    phaseRest: "休息",
    phaseLongRest: "长休息",
    roundOf: "第 {n} / {total} 轮",
    doneLabel: "结束",
    nextPhase: "下一段",
    addStep: "加一段",
    removeStep: "删一段",
    stepKind: "类型",
    stepSeconds: "秒",
    stepName: "名称（可选）",
    editPreset: "编辑预设",
    presetHint: "Tabata、HIIT 以及所有预设的数字和段落都能改。没有只能死用的预设。",
    saveRoutine: "保存套路",
    routineName: "套路名称",
    routineNamePlaceholder: "例如：早晨 Tabata",
    routineSaved: "已保存套路",
    routineLoaded: "已载入套路",
    routineDeleted: "已删除套路",
    deleteRoutine: "删除套路",
    noRoutines: "还没有保存的套路。把眼前的设置存下来。",
    loadRoutine: "载入",
    needName: "请写一个名称",
    needStep: "至少需要一段不少于 1 秒的间歇",
    routinesTitle: "已存套路",
    lapsTitle: "计圈",
    noLaps: "还没有计圈。运行时点计圈就能留下分段。",
    lapN: "第 {n} 圈",
    midHint: "训练中途也可以随时停止和重置。没有锁定，也没有插页广告。",
    keepTicking: "标签页到后台时，浏览器允许的范围内会继续走；回来时按真实经过时间对齐。",
    soundOn: "提示音开",
    soundOff: "提示音关",
    soundHint: "只有短提示音。不会长期抢走或压低你正在听的音乐。",
    wakeOn: "保持亮屏",
    wakeOff: "允许熄屏",
    wakeHint: "运行时请求浏览器不要熄屏。被拒绝也不影响计时。",
    fullscreen: "全屏",
    exitFullscreen: "退出全屏",
    fullscreenHint: "只想看大数字的时候。",
    backupTitle: "备份",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    clearAll: "全部删除",
    exported: "已保存文件",
    importBad: "这个文件不是计时板备份",
    importOk: "已导入备份",
    importConfirmTitle: "用这份备份替换吗？",
    importConfirmBody: "此设备上的套路和设置会变成文件里的内容。无法撤销。",
    clearAllTitle: "删除全部数据？",
    clearAllBody: "已存套路和设置会回到初始组合。无法撤销。",
    cleared: "已全部删除",
    settingsTitle: "设置",
    fontSizeLabel: "字号",
    fontMd: "常规",
    fontLg: "大",
    fontXl: "更大",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    add: "添加",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
    idle: "就绪",
    running: "进行中",
    paused: "已暂停",
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
