/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "trailquest:lang";

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
  | "activeRoute"
  | "routeDone"
  | "routeDoneBody"
  | "progressLabel"
  | "walked"
  | "remaining"
  | "ofTotal"
  | "nextMilestone"
  | "toGo"
  | "allUnlocked"
  | "routesTitle"
  | "routesHint"
  | "presetRoutes"
  | "customRoutes"
  | "addRoute"
  | "editRoute"
  | "newRouteTitle"
  | "editRouteTitle"
  | "routeNameLabel"
  | "routeNamePlaceholder"
  | "totalDistanceLabel"
  | "unitLabel"
  | "unitMi"
  | "unitKm"
  | "milestonesLabel"
  | "milestonesHint"
  | "addMilestone"
  | "milestoneNameLabel"
  | "milestoneNamePlaceholder"
  | "milestoneAtLabel"
  | "removeMilestone"
  | "deleteRoute"
  | "deleteRouteTitle"
  | "deleteRouteBody"
  | "routeSaved"
  | "routeDeleted"
  | "invalidRouteName"
  | "invalidRouteDistance"
  | "invalidMilestone"
  | "milestonesTitle"
  | "locked"
  | "unlocked"
  | "unlockedOn"
  | "noMilestones"
  | "milestoneUnlockedToast"
  | "logTitle"
  | "distanceLabel"
  | "distancePlaceholder"
  | "dateLabel"
  | "noteLabel"
  | "notePlaceholder"
  | "addLog"
  | "logAdded"
  | "logSaved"
  | "logDeleted"
  | "invalidDistance"
  | "invalidDate"
  | "editLog"
  | "deleteLog"
  | "stepsTitle"
  | "stepsHint"
  | "stepsLabel"
  | "stepsPlaceholder"
  | "stepsPerMileLabel"
  | "stepsPerMileHint"
  | "stepsResult"
  | "useSteps"
  | "invalidSteps"
  | "fromSteps"
  | "historyTitle"
  | "historyHint"
  | "noHistory"
  | "statsTitle"
  | "totalAllTime"
  | "thisRouteTotal"
  | "activeDays"
  | "currentStreak"
  | "longestStreak"
  | "days"
  | "settingsTitle"
  | "fontSizeLabel"
  | "fontMd"
  | "fontLg"
  | "fontXl"
  | "backupTitle"
  | "backupBody"
  | "exportJson"
  | "importJson"
  | "exported"
  | "importConfirmTitle"
  | "importConfirmBody"
  | "importOk"
  | "importBad"
  | "clearAll"
  | "clearAllTitle"
  | "clearAllBody"
  | "cleared"
  | "chipManual"
  | "chipSwitch"
  | "chipNoMembership"
  | "chipBackup"
  | "chipNoAi"
  | "chipLocal"
  | "chipLangs"
  | "about"
  | "privacy"
  | "terms"
  | "guide"
  | "save"
  | "cancel"
  | "delete"
  | "close";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "트레일퀘스트",
    shortName: "트레일퀘스트",
    tagline: "무료 로컬 가상 장거리 트레일 트래커. 실제 마일/걸음을 기록해 PCT·AT급 루트를 진행. 마일스톤·스트릭·JSON 백업. 계정 없음. AI 아트 없음.",
    metaDescription:
      "계정 없는 무료 가상 장거리 트레일 트래커. 오늘 실제로 걷거나 달린 거리(또는 폰의 걸음 수)를 적으면 퍼시픽 크레스트 트레일, 애팔래치아 트레일, 카미노 같은 루트 위에서 진행률이 올라가고 마일스톤이 하나씩 열립니다. 여러 루트를 오가도 진행이 지워지지 않고, 기록은 수정·삭제할 수 있으며, JSON 백업으로 새 폰에서도 그대로. 자동 추적 없음, 멤버십 없음, 생성형 AI 풍경 없음. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. AI 생성 풍경 없음.",
    langLabel: "언어",
    activeRoute: "현재 루트",
    routeDone: "완주!",
    routeDoneBody: "이 루트를 끝까지 걸었습니다. 기록은 그대로 남고, 다른 루트를 골라 이어서 걸을 수 있습니다.",
    progressLabel: "진행률",
    walked: "걸은 거리",
    remaining: "남은 거리",
    ofTotal: "전체 {total}",
    nextMilestone: "다음 마일스톤",
    toGo: "{dist} 남음",
    allUnlocked: "모든 마일스톤을 열었습니다",
    routesTitle: "루트",
    routesHint: "루트를 바꿔도 각 루트의 진행과 기록은 그대로 남습니다.",
    presetRoutes: "기본 루트",
    customRoutes: "내 루트",
    addRoute: "내 루트 만들기",
    editRoute: "루트 편집",
    newRouteTitle: "새 루트",
    editRouteTitle: "루트 편집",
    routeNameLabel: "루트 이름",
    routeNamePlaceholder: "예: 동네 한 바퀴 100km",
    totalDistanceLabel: "전체 거리",
    unitLabel: "단위",
    unitMi: "마일",
    unitKm: "km",
    milestonesLabel: "마일스톤 (선택)",
    milestonesHint: "시작점에서의 거리와 이름을 적으세요. 비워 두면 진행률만 표시됩니다.",
    addMilestone: "마일스톤 추가",
    milestoneNameLabel: "이름",
    milestoneNamePlaceholder: "예: 첫 고개",
    milestoneAtLabel: "시작점에서",
    removeMilestone: "이 마일스톤 삭제",
    deleteRoute: "루트 삭제",
    deleteRouteTitle: "루트를 삭제할까요?",
    deleteRouteBody: "“{name}”와 이 루트의 기록 {count}개가 지워집니다. 다른 루트는 그대로입니다.",
    routeSaved: "루트를 저장했습니다",
    routeDeleted: "루트를 삭제했습니다",
    invalidRouteName: "루트 이름을 적어 주세요",
    invalidRouteDistance: "전체 거리를 0보다 크게 적어 주세요",
    invalidMilestone: "마일스톤 거리는 0과 전체 거리 사이여야 합니다",
    milestonesTitle: "마일스톤",
    locked: "잠김",
    unlocked: "열림",
    unlockedOn: "{date} 도달",
    noMilestones: "이 루트에는 마일스톤이 없습니다. 진행률만 보여 드립니다.",
    milestoneUnlockedToast: "마일스톤 도달: {name}",
    logTitle: "오늘 걸은 거리 기록",
    distanceLabel: "거리",
    distancePlaceholder: "0",
    dateLabel: "날짜",
    noteLabel: "메모 (선택)",
    notePlaceholder: "예: 아침 산책",
    addLog: "기록 추가",
    logAdded: "기록을 추가했습니다",
    logSaved: "기록을 저장했습니다",
    logDeleted: "기록을 삭제했습니다",
    invalidDistance: "거리를 0보다 크게 적어 주세요",
    invalidDate: "날짜를 확인해 주세요",
    editLog: "기록 편집",
    deleteLog: "기록 삭제",
    stepsTitle: "걸음 수 붙여넣기",
    stepsHint: "폰 건강 앱의 걸음 수를 여기에 적으면 거리로 바꿔 줍니다. 이 앱은 걸음이나 위치를 자동으로 읽지 않습니다. 웹 앱은 건강 앱(HealthKit·Google Fit)에 접근할 수 없어 직접 적어야 합니다.",
    stepsLabel: "걸음 수",
    stepsPlaceholder: "예: 8000",
    stepsPerMileLabel: "1마일당 걸음 수",
    stepsPerMileHint: "보통 1,900~2,200. 키가 크면 적게, 작으면 많게.",
    stepsResult: "{steps} 걸음 ≈ {dist}",
    useSteps: "이 거리로 기록",
    invalidSteps: "걸음 수를 0보다 크게 적어 주세요",
    fromSteps: "{steps} 걸음",
    historyTitle: "기록",
    historyHint: "한 줄을 누르면 편집하거나 삭제할 수 있습니다. 진행률은 바로 다시 계산됩니다.",
    noHistory: "아직 이 루트에 기록이 없습니다. 위에서 첫 거리를 적어 보세요.",
    statsTitle: "통계",
    totalAllTime: "전체 누적",
    thisRouteTotal: "이 루트",
    activeDays: "걸은 날",
    currentStreak: "현재 연속",
    longestStreak: "최장 연속",
    days: "{n}일",
    settingsTitle: "설정",
    fontSizeLabel: "글자 크기",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "백업",
    backupBody: "재설치하거나 폰을 바꾸면 기록이 사라집니다. JSON으로 내보내 두고, 새 기기에서 가져오기를 누르면 루트·기록·진행이 그대로 돌아옵니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    exported: "파일을 내려받았습니다",
    importConfirmTitle: "백업으로 덮어쓸까요?",
    importConfirmBody: "지금 기기의 루트와 기록이 파일 내용으로 바뀝니다.",
    importOk: "가져왔습니다: 루트 {r}개, 기록 {l}개",
    importBad: "트레일퀘스트 백업 파일이 아닙니다",
    clearAll: "모든 데이터 삭제",
    clearAllTitle: "모든 데이터를 삭제할까요?",
    clearAllBody: "내 루트, 기록, 진행이 이 기기에서 모두 지워집니다. 되돌릴 수 없습니다.",
    cleared: "모두 삭제했습니다",
    chipManual: "직접 기록만 (자동 추적 없음)",
    chipSwitch: "루트 바꿔도 진행 유지",
    chipNoMembership: "멤버십 잠금 없음",
    chipBackup: "재설치 대비 JSON 백업",
    chipNoAi: "AI 아트 없음",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    about:
      "트레일퀘스트는 실제로 걸은 거리를 가상의 장거리 트레일 위에 올려 주는 기록장입니다. 오늘 걷거나 달린 거리를 적으면(또는 폰의 걸음 수를 붙여 넣으면) PCT, AT, 카미노 같은 루트에서 진행률이 올라가고 마일스톤이 열립니다. 루트를 오가도 각 루트의 진행은 그대로이고, 기록은 언제든 고치거나 지울 수 있습니다. 자동 추적도, 계정도, 멤버십도, 생성형 AI 풍경도 없습니다. 그림은 모두 손으로 그린 SVG입니다.",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    close: "닫기",
  },
  en: {
    title: "Trailquest",
    shortName: "Trailquest",
    tagline: "Free local virtual trail tracker. Log real miles toward PCT/AT-class routes. Milestones, streaks, JSON backup. No account. No AI art.",
    metaDescription:
      "Free virtual long-trail tracker with no account. Type in the distance you actually walked or ran today (or paste your phone's step count) and watch your progress climb along the Pacific Crest Trail, the Appalachian Trail, the Camino and more, unlocking milestones as you go. Switch between routes without losing anything, edit or delete any entry, and carry it all to a new phone with a JSON backup. No auto-tracking, no membership, no generative AI landscapes. Data stays on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers. No generative AI landscapes.",
    langLabel: "Language",
    activeRoute: "Active route",
    routeDone: "Route complete!",
    routeDoneBody: "You walked this whole route. Your log stays here, and you can pick another route to keep going.",
    progressLabel: "Progress",
    walked: "Walked",
    remaining: "Remaining",
    ofTotal: "of {total}",
    nextMilestone: "Next milestone",
    toGo: "{dist} to go",
    allUnlocked: "Every milestone unlocked",
    routesTitle: "Routes",
    routesHint: "Switching routes keeps each route's own progress and log.",
    presetRoutes: "Preset routes",
    customRoutes: "My routes",
    addRoute: "Create a route",
    editRoute: "Edit route",
    newRouteTitle: "New route",
    editRouteTitle: "Edit route",
    routeNameLabel: "Route name",
    routeNamePlaceholder: "e.g. Around the lake, 100 km",
    totalDistanceLabel: "Total distance",
    unitLabel: "Unit",
    unitMi: "mi",
    unitKm: "km",
    milestonesLabel: "Milestones (optional)",
    milestonesHint: "Name each one and give its distance from the start. Leave empty for a plain progress bar.",
    addMilestone: "Add milestone",
    milestoneNameLabel: "Name",
    milestoneNamePlaceholder: "e.g. First pass",
    milestoneAtLabel: "From start",
    removeMilestone: "Remove this milestone",
    deleteRoute: "Delete route",
    deleteRouteTitle: "Delete this route?",
    deleteRouteBody: "“{name}” and its {count} log entries will be removed. Other routes are untouched.",
    routeSaved: "Route saved",
    routeDeleted: "Route deleted",
    invalidRouteName: "Give the route a name",
    invalidRouteDistance: "Total distance must be above 0",
    invalidMilestone: "Milestone distances must sit between 0 and the total",
    milestonesTitle: "Milestones",
    locked: "Locked",
    unlocked: "Unlocked",
    unlockedOn: "Reached {date}",
    noMilestones: "This route has no milestones, so only the progress bar moves.",
    milestoneUnlockedToast: "Milestone reached: {name}",
    logTitle: "Log today's distance",
    distanceLabel: "Distance",
    distancePlaceholder: "0",
    dateLabel: "Date",
    noteLabel: "Note (optional)",
    notePlaceholder: "e.g. Morning walk",
    addLog: "Add to log",
    logAdded: "Added to the log",
    logSaved: "Entry saved",
    logDeleted: "Entry deleted",
    invalidDistance: "Distance must be above 0",
    invalidDate: "Check the date",
    editLog: "Edit entry",
    deleteLog: "Delete entry",
    stepsTitle: "Paste step count",
    stepsHint: "Copy the step count from your phone's health app and it becomes a distance. This app never reads steps or location by itself: a web app cannot reach HealthKit or Google Fit, so you type it in.",
    stepsLabel: "Steps",
    stepsPlaceholder: "e.g. 8000",
    stepsPerMileLabel: "Steps per mile",
    stepsPerMileHint: "Usually 1,900 to 2,200. Fewer if you are tall, more if you are short.",
    stepsResult: "{steps} steps ≈ {dist}",
    useSteps: "Log this distance",
    invalidSteps: "Steps must be above 0",
    fromSteps: "{steps} steps",
    historyTitle: "Log",
    historyHint: "Tap a row to edit or delete it. Progress recalculates right away.",
    noHistory: "Nothing logged on this route yet. Add your first distance above.",
    statsTitle: "Stats",
    totalAllTime: "All routes",
    thisRouteTotal: "This route",
    activeDays: "Active days",
    currentStreak: "Current streak",
    longestStreak: "Longest streak",
    days: "{n} days",
    settingsTitle: "Settings",
    fontSizeLabel: "Text size",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "Backup",
    backupBody: "A reinstall or a new phone starts empty. Export JSON now, then Import on the new device and every route, entry and milestone comes back.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exported: "File downloaded",
    importConfirmTitle: "Replace with this backup?",
    importConfirmBody: "The routes and log on this device will be replaced by the file.",
    importOk: "Imported {r} routes and {l} entries",
    importBad: "That is not a Trailquest backup file",
    clearAll: "Delete all data",
    clearAllTitle: "Delete all data?",
    clearAllBody: "Your routes, log and progress will be erased from this device. This cannot be undone.",
    cleared: "Everything deleted",
    chipManual: "Manual log only (no auto-track spam)",
    chipSwitch: "Switch routes, progress kept",
    chipNoMembership: "No membership lock",
    chipBackup: "JSON backup for reinstall",
    chipNoAi: "No AI art",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    about:
      "Trailquest lays the distance you really walked onto a virtual long trail. Type in today's miles or kilometres (or paste the step count from your phone) and your marker moves along the PCT, the AT, the Camino or a route of your own, unlocking milestones as you pass them. Each route keeps its own progress when you switch, and any entry can be edited or deleted. No auto-tracking, no account, no membership, no generative AI landscapes: every picture here is hand-drawn SVG.",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    close: "Close",
  },
  ja: {
    title: "トレイルクエスト",
    shortName: "トレイルクエスト",
    tagline: "無料のローカル仮想ロングトレイル記録。実際のマイルや歩数をPCT・AT級ルートの進捗に。マイルストーン、連続記録、JSONバックアップ。アカウント不要。AIアートなし。",
    metaDescription:
      "アカウント不要の無料仮想ロングトレイル記録。今日実際に歩いたり走ったりした距離（またはスマホの歩数）を入れると、パシフィック・クレスト・トレイルやアパラチアン・トレイル、カミーノなどのルート上で進捗が伸び、マイルストーンが順に開きます。ルートを切り替えても進捗は消えず、記録はいつでも編集・削除でき、JSONバックアップで新しい端末にもそのまま。自動トラッキングなし、会員制なし、生成AIの風景なし。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。生成AIの風景画像はありません。",
    langLabel: "言語",
    activeRoute: "現在のルート",
    routeDone: "完歩！",
    routeDoneBody: "このルートを最後まで歩きました。記録はそのまま残り、別のルートを選んで続けられます。",
    progressLabel: "進捗",
    walked: "歩いた距離",
    remaining: "残り",
    ofTotal: "全体 {total}",
    nextMilestone: "次のマイルストーン",
    toGo: "あと {dist}",
    allUnlocked: "すべてのマイルストーンを開きました",
    routesTitle: "ルート",
    routesHint: "ルートを切り替えても、それぞれの進捗と記録は残ります。",
    presetRoutes: "プリセット",
    customRoutes: "マイルート",
    addRoute: "ルートを作る",
    editRoute: "ルートを編集",
    newRouteTitle: "新しいルート",
    editRouteTitle: "ルートを編集",
    routeNameLabel: "ルート名",
    routeNamePlaceholder: "例: 湖一周 100km",
    totalDistanceLabel: "全体の距離",
    unitLabel: "単位",
    unitMi: "マイル",
    unitKm: "km",
    milestonesLabel: "マイルストーン（任意）",
    milestonesHint: "名前と起点からの距離を入れます。空のままなら進捗バーだけ表示します。",
    addMilestone: "マイルストーンを追加",
    milestoneNameLabel: "名前",
    milestoneNamePlaceholder: "例: 最初の峠",
    milestoneAtLabel: "起点から",
    removeMilestone: "このマイルストーンを削除",
    deleteRoute: "ルートを削除",
    deleteRouteTitle: "このルートを削除しますか？",
    deleteRouteBody: "「{name}」とその記録 {count} 件を消します。ほかのルートはそのままです。",
    routeSaved: "ルートを保存しました",
    routeDeleted: "ルートを削除しました",
    invalidRouteName: "ルート名を入れてください",
    invalidRouteDistance: "全体の距離は0より大きくしてください",
    invalidMilestone: "マイルストーンの距離は0と全体の間にしてください",
    milestonesTitle: "マイルストーン",
    locked: "未到達",
    unlocked: "到達",
    unlockedOn: "{date} 到達",
    noMilestones: "このルートにはマイルストーンがありません。進捗バーだけ動きます。",
    milestoneUnlockedToast: "マイルストーン到達: {name}",
    logTitle: "今日の距離を記録",
    distanceLabel: "距離",
    distancePlaceholder: "0",
    dateLabel: "日付",
    noteLabel: "メモ（任意）",
    notePlaceholder: "例: 朝の散歩",
    addLog: "記録する",
    logAdded: "記録しました",
    logSaved: "記録を保存しました",
    logDeleted: "記録を削除しました",
    invalidDistance: "距離は0より大きくしてください",
    invalidDate: "日付を確認してください",
    editLog: "記録を編集",
    deleteLog: "記録を削除",
    stepsTitle: "歩数を貼り付け",
    stepsHint: "スマホのヘルスアプリの歩数を入れると距離に換算します。このアプリが歩数や位置を勝手に読むことはありません。ウェブアプリはHealthKitやGoogle Fitに届かないので、手で入力します。",
    stepsLabel: "歩数",
    stepsPlaceholder: "例: 8000",
    stepsPerMileLabel: "1マイルあたりの歩数",
    stepsPerMileHint: "ふつう1,900〜2,200。背が高いと少なめ、低いと多め。",
    stepsResult: "{steps} 歩 ≈ {dist}",
    useSteps: "この距離を記録",
    invalidSteps: "歩数は0より大きくしてください",
    fromSteps: "{steps} 歩",
    historyTitle: "記録",
    historyHint: "行をタップすると編集や削除ができます。進捗はすぐ計算し直されます。",
    noHistory: "このルートにはまだ記録がありません。上で最初の距離を入れてみましょう。",
    statsTitle: "統計",
    totalAllTime: "全ルート合計",
    thisRouteTotal: "このルート",
    activeDays: "歩いた日",
    currentStreak: "現在の連続",
    longestStreak: "最長の連続",
    days: "{n}日",
    settingsTitle: "設定",
    fontSizeLabel: "文字サイズ",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "バックアップ",
    backupBody: "再インストールや機種変更では記録が空になります。JSONで書き出しておき、新しい端末で読み込めばルート・記録・マイルストーンがそのまま戻ります。",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    exported: "ファイルを保存しました",
    importConfirmTitle: "このバックアップで置き換えますか？",
    importConfirmBody: "この端末のルートと記録がファイルの内容に置き換わります。",
    importOk: "読み込みました: ルート {r} 件、記録 {l} 件",
    importBad: "トレイルクエストのバックアップではありません",
    clearAll: "すべてのデータを削除",
    clearAllTitle: "すべてのデータを削除しますか？",
    clearAllBody: "マイルート、記録、進捗がこの端末から消えます。元に戻せません。",
    cleared: "すべて削除しました",
    chipManual: "手入力のみ（自動追跡なし）",
    chipSwitch: "ルート切替でも進捗は維持",
    chipNoMembership: "会員制の鍵なし",
    chipBackup: "再インストール用JSONバックアップ",
    chipNoAi: "AIアートなし",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    about:
      "トレイルクエストは、実際に歩いた距離を仮想のロングトレイルに重ねる記録帳です。今日のマイルやキロ（またはスマホの歩数）を入れると、PCT、AT、カミーノ、あるいは自分で作ったルートの上をマーカーが進み、通過したマイルストーンが開きます。ルートを切り替えてもそれぞれの進捗は残り、記録はいつでも編集・削除できます。自動追跡もアカウントも会員制も生成AIの風景もなく、絵はすべて手描きのSVGです。",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    close: "閉じる",
  },
  zh: {
    title: "步道征途",
    shortName: "步道征途",
    tagline: "免费本地虚拟长途步道追踪。把真实里程/步数记到 PCT/AT 级路线进度。里程碑、连续打卡、JSON 备份。无需账号。无 AI 绘图。",
    metaDescription:
      "无需账号的免费虚拟长途步道追踪。把今天真实走过或跑过的距离（或手机的步数）记进来，进度就会沿着太平洋屋脊步道、阿巴拉契亚步道、朝圣之路等路线向前，一个个里程碑随之解锁。切换路线不会丢进度，任何记录都能修改或删除，JSON 备份带到新手机照样恢复。无自动追踪，无会员制，无生成式 AI 风景。数据仅保存在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。无生成式 AI 风景图。",
    langLabel: "语言",
    activeRoute: "当前路线",
    routeDone: "全程走完！",
    routeDoneBody: "这条路线已经走到终点。记录会留着，可以再挑一条路线继续。",
    progressLabel: "进度",
    walked: "已走",
    remaining: "剩余",
    ofTotal: "共 {total}",
    nextMilestone: "下一个里程碑",
    toGo: "还差 {dist}",
    allUnlocked: "所有里程碑都已解锁",
    routesTitle: "路线",
    routesHint: "切换路线后，每条路线自己的进度和记录都还在。",
    presetRoutes: "预设路线",
    customRoutes: "我的路线",
    addRoute: "创建路线",
    editRoute: "编辑路线",
    newRouteTitle: "新路线",
    editRouteTitle: "编辑路线",
    routeNameLabel: "路线名称",
    routeNamePlaceholder: "例如：环湖 100 公里",
    totalDistanceLabel: "总距离",
    unitLabel: "单位",
    unitMi: "英里",
    unitKm: "公里",
    milestonesLabel: "里程碑（可选）",
    milestonesHint: "填名称和距起点的距离。留空就只显示进度条。",
    addMilestone: "添加里程碑",
    milestoneNameLabel: "名称",
    milestoneNamePlaceholder: "例如：第一个垭口",
    milestoneAtLabel: "距起点",
    removeMilestone: "删除这个里程碑",
    deleteRoute: "删除路线",
    deleteRouteTitle: "删除这条路线？",
    deleteRouteBody: "“{name}”和它的 {count} 条记录会被删除。其他路线不受影响。",
    routeSaved: "路线已保存",
    routeDeleted: "路线已删除",
    invalidRouteName: "请填写路线名称",
    invalidRouteDistance: "总距离必须大于 0",
    invalidMilestone: "里程碑距离必须在 0 和总距离之间",
    milestonesTitle: "里程碑",
    locked: "未到",
    unlocked: "已到",
    unlockedOn: "{date} 到达",
    noMilestones: "这条路线没有里程碑，只有进度条会动。",
    milestoneUnlockedToast: "到达里程碑：{name}",
    logTitle: "记录今天的距离",
    distanceLabel: "距离",
    distancePlaceholder: "0",
    dateLabel: "日期",
    noteLabel: "备注（可选）",
    notePlaceholder: "例如：早上散步",
    addLog: "加入记录",
    logAdded: "已加入记录",
    logSaved: "记录已保存",
    logDeleted: "记录已删除",
    invalidDistance: "距离必须大于 0",
    invalidDate: "请检查日期",
    editLog: "编辑记录",
    deleteLog: "删除记录",
    stepsTitle: "粘贴步数",
    stepsHint: "把手机健康应用里的步数填进来，就会换算成距离。这个应用不会自己读取步数或位置：网页应用无法访问 HealthKit 或 Google Fit，所以需要手动填写。",
    stepsLabel: "步数",
    stepsPlaceholder: "例如：8000",
    stepsPerMileLabel: "每英里步数",
    stepsPerMileHint: "一般 1,900 到 2,200。个子高就少些，个子矮就多些。",
    stepsResult: "{steps} 步 ≈ {dist}",
    useSteps: "记下这段距离",
    invalidSteps: "步数必须大于 0",
    fromSteps: "{steps} 步",
    historyTitle: "记录",
    historyHint: "点一行就能编辑或删除。进度会立刻重新计算。",
    noHistory: "这条路线还没有记录。在上面填第一段距离吧。",
    statsTitle: "统计",
    totalAllTime: "全部路线",
    thisRouteTotal: "这条路线",
    activeDays: "活动天数",
    currentStreak: "当前连续",
    longestStreak: "最长连续",
    days: "{n} 天",
    settingsTitle: "设置",
    fontSizeLabel: "字号",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "备份",
    backupBody: "重装或换手机后记录会是空的。现在导出 JSON，在新设备上导入，路线、记录和里程碑都会回来。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    exported: "文件已下载",
    importConfirmTitle: "用这个备份覆盖？",
    importConfirmBody: "此设备上的路线和记录会被文件内容替换。",
    importOk: "已导入 {r} 条路线、{l} 条记录",
    importBad: "这不是步道征途的备份文件",
    clearAll: "删除全部数据",
    clearAllTitle: "删除全部数据？",
    clearAllBody: "我的路线、记录和进度都会从此设备清除，无法恢复。",
    cleared: "已全部删除",
    chipManual: "仅手动记录（无自动追踪）",
    chipSwitch: "切换路线保留进度",
    chipNoMembership: "无会员锁定",
    chipBackup: "重装用 JSON 备份",
    chipNoAi: "无 AI 绘图",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    about:
      "步道征途把你真实走过的距离铺到一条虚拟长途步道上。填进今天的英里或公里（或粘贴手机步数），你的标记就沿着 PCT、AT、朝圣之路或自建路线前进，经过的里程碑依次解锁。切换路线时每条路线各自保留进度，任何记录都能修改或删除。没有自动追踪、账号、会员制，也没有生成式 AI 风景：这里的图全是手绘 SVG。",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    close: "关闭",
  },
};

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://trailquest.try-dabble.com/og-image-ko.png",
  en: "https://trailquest.try-dabble.com/og-image-en.png",
  ja: "https://trailquest.try-dabble.com/og-image-ja.png",
  zh: "https://trailquest.try-dabble.com/og-image-zh.png",
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
