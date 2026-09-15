/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "essaypad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://essaypad.try-dabble.com/og-image-ko.png",
  en: "https://essaypad.try-dabble.com/og-image-en.png",
  ja: "https://essaypad.try-dabble.com/og-image-ja.png",
  zh: "https://essaypad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipAndroid"
  | "chipNoLogin"
  | "chipNoAds"
  | "chipNoSub"
  | "chipLocal"
  | "chipBackup"
  | "chipWeekend"
  | "chipBackdate"
  | "chipFree"
  | "chipLangs"
  | "howTitle"
  | "howBody"
  | "essaysTitle"
  | "newEssay"
  | "newTitle"
  | "editTitle"
  | "essayTitleLabel"
  | "essayTitlePlaceholder"
  | "targetLabel"
  | "targetPlaceholder"
  | "deadlineLabel"
  | "deadlineHint"
  | "clearDeadline"
  | "create"
  | "save"
  | "cancel"
  | "edit"
  | "deleteEssay"
  | "deleteEssayTitle"
  | "deleteEssayBody"
  | "noEssays"
  | "noEssaysHint"
  | "essayCreated"
  | "essayDeleted"
  | "currentLabel"
  | "wordsN"
  | "ofTarget"
  | "percentDone"
  | "remainingN"
  | "doneLabel"
  | "overLimitWarn"
  | "updateWords"
  | "updateTitle"
  | "updateHint"
  | "newTotalLabel"
  | "dateLabel"
  | "noteLabel"
  | "notePlaceholder"
  | "needTitle"
  | "needTarget"
  | "needWords"
  | "savedToast"
  | "deletedToast"
  | "paceTitle"
  | "dailyTargetLabel"
  | "perDay"
  | "writeDaysLeftN"
  | "calendarDaysLeftN"
  | "deadlineOn"
  | "deadlineToday"
  | "noDeadlineMsg"
  | "overdueMsg"
  | "catchUpMsg"
  | "doneMsg"
  | "writeDaysLabel"
  | "allDays"
  | "weekdaysOnly"
  | "weekendSkipped"
  | "tabHistory"
  | "tabBackup"
  | "historyTitle"
  | "historyHint"
  | "noHistory"
  | "colDate"
  | "colTotal"
  | "colDelta"
  | "deleteEntry"
  | "deleteEntryTitle"
  | "deleteEntryBody"
  | "prevMonth"
  | "nextMonth"
  | "todayLabel"
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
    title: "에세이패드",
    shortName: "에세이패드",
    tagline: "무료 로컬 에세이·프로젝트 단어 진행 기록. 목표 단어 수와 선택 마감일을 정하고, 쓴 단어 수를 직접 입력하면 진행률과 하루 목표가 보입니다. 주말 제외 옵션. JSON 백업. 계정 없음. 구독 없음.",
    metaDescription:
      "로그인도 구독도 없는 무료 로컬 단어 진행 기록. 에세이·논문·소설 등 어떤 글쓰기 프로젝트든 추가하고 목표 단어 수와 선택 마감일을 정합니다. 글은 Docs·Word·Notion이나 종이에 쓰고, 돌아와서 새 합계만 입력하세요. 잊었다면 지난 날짜로도 기록할 수 있습니다. 진행 막대, 퍼센트, 남은 단어 수와 함께 남은 단어 ÷ 남은 집필일로 계산한 하루 목표를 보여 주며, 모든 날 또는 평일만 셀 수 있습니다. 목표의 110%를 넘으면 경고가 뜹니다. 날짜별 달력 기록, 여러 에세이, JSON 내보내기·불러오기, 안드로이드와 모든 브라우저에서 되는 오프라인 PWA. 계정 없음, 광고 없음, 앱 내 결제 없음. 데이터는 이 기기에만.",
    localOnly: "에세이 데이터는 이 기기에만 저장됩니다. 로그인·광고·구독 없음. 에세이 개수 제한 없이 무료입니다.",
    langLabel: "언어",
    chipAndroid: "안드로이드·웹에서 작동",
    chipNoLogin: "로그인 없음",
    chipNoAds: "도구에 광고 없음",
    chipNoSub: "구독 없음",
    chipLocal: "이 기기에만 저장",
    chipBackup: "JSON 백업",
    chipWeekend: "주말 제외 페이스",
    chipBackdate: "지난 날짜 기록",
    chipFree: "영원히 무료",
    chipLangs: "ko/en/ja/zh",
    howTitle: "쓰는 곳은 따로, 세는 곳은 여기",
    howBody: "글은 Docs·Word·Notion이나 종이에 쓰세요. 돌아와서 새 합계 단어 수만 입력하면 진행률과 하루 목표가 다시 계산됩니다. 이 앱은 편집기가 아닙니다.",
    essaysTitle: "에세이",
    newEssay: "새 에세이",
    newTitle: "새 에세이 만들기",
    editTitle: "에세이 수정",
    essayTitleLabel: "제목",
    essayTitlePlaceholder: "예: 장학금 에세이, 논문 2장",
    targetLabel: "목표 단어 수",
    targetPlaceholder: "예: 1500",
    deadlineLabel: "마감일 (선택)",
    deadlineHint: "비워 두면 진행률만 보이고 하루 목표는 계산하지 않습니다.",
    clearDeadline: "마감일 지우기",
    create: "만들기",
    save: "저장",
    cancel: "취소",
    edit: "수정",
    deleteEssay: "에세이 삭제",
    deleteEssayTitle: "이 에세이를 삭제할까요?",
    deleteEssayBody: "목표, 현재 단어 수, 날짜별 기록이 이 기기에서 지워집니다. 되돌릴 수 없습니다.",
    noEssays: "아직 에세이가 없습니다",
    noEssaysHint: "제목과 목표 단어 수를 정하고 시작하세요. 마감일은 나중에 넣어도 됩니다.",
    essayCreated: "에세이를 만들었습니다",
    essayDeleted: "에세이를 삭제했습니다",
    currentLabel: "현재 단어 수",
    wordsN: "{n} 단어",
    ofTarget: "/ 목표 {n}",
    percentDone: "{pct}%",
    remainingN: "{n} 단어 남음",
    doneLabel: "목표 달성",
    overLimitWarn: "목표의 110%를 넘었습니다 ({current} / {target}). 제한이 있다면 줄여야 할 수 있습니다.",
    updateWords: "단어 수 업데이트",
    updateTitle: "단어 수 업데이트",
    updateHint: "다른 곳에서 쓴 글의 새 합계를 입력하세요. 오늘이 아니면 날짜를 바꿔 지난 날에 기록할 수 있습니다.",
    newTotalLabel: "새 합계 단어 수",
    dateLabel: "날짜",
    noteLabel: "메모 (선택)",
    notePlaceholder: "예: 서론 완료",
    needTitle: "제목을 적어 주세요.",
    needTarget: "목표 단어 수는 1 이상의 정수여야 합니다.",
    needWords: "0 이상의 정수를 입력해 주세요.",
    savedToast: "저장했습니다",
    deletedToast: "삭제했습니다",
    paceTitle: "하루 목표",
    dailyTargetLabel: "오늘부터 마감까지 하루에",
    perDay: "단어 / 일",
    writeDaysLeftN: "집필일 {n}일 남음",
    calendarDaysLeftN: "마감까지 {n}일",
    deadlineOn: "마감 {date}",
    deadlineToday: "마감이 오늘입니다",
    noDeadlineMsg: "마감일을 정하면 하루 목표를 계산합니다. 진행률은 그대로 보입니다.",
    overdueMsg: "마감이 {n}일 지났습니다. {remaining} 단어가 남았습니다.",
    catchUpMsg: "오늘 따라잡기: {n} 단어",
    doneMsg: "목표를 채웠습니다. 더 쓸 필요가 없습니다.",
    writeDaysLabel: "집필일",
    allDays: "모든 날",
    weekdaysOnly: "평일만",
    weekendSkipped: "토·일은 세지 않습니다.",
    tabHistory: "기록",
    tabBackup: "백업",
    historyTitle: "날짜별 기록",
    historyHint: "그날 끝의 합계와 그날 늘어난 단어 수입니다. 지난 날짜로 업데이트하면 여기에 들어갑니다.",
    noHistory: "아직 기록이 없습니다. 단어 수를 업데이트하면 날짜별로 쌓입니다.",
    colDate: "날짜",
    colTotal: "합계",
    colDelta: "증감",
    deleteEntry: "삭제",
    deleteEntryTitle: "이 날의 기록을 삭제할까요?",
    deleteEntryBody: "현재 단어 수는 남은 기록 중 가장 최근 값으로 돌아갑니다.",
    prevMonth: "이전 달",
    nextMonth: "다음 달",
    todayLabel: "오늘",
    backupTitle: "JSON 백업",
    backupHint: "모든 에세이, 기록, 설정을 파일 하나로 내보내고 다시 불러옵니다. 불러오기는 지금 데이터를 파일 내용으로 바꿉니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 불러오기",
    clearAll: "모두 삭제",
    exported: "JSON 파일을 내려받았습니다",
    importBad: "읽을 수 없는 파일입니다",
    importOk: "에세이 {n}개를 불러왔습니다",
    importConfirmTitle: "이 파일로 바꿀까요?",
    importConfirmBody: "지금 이 기기의 에세이가 파일의 에세이 {n}개로 바뀝니다.",
    clearAllTitle: "모두 삭제할까요?",
    clearAllBody: "모든 에세이와 기록이 이 기기에서 지워집니다. 먼저 JSON을 내보내 두세요.",
    cleared: "모두 삭제했습니다",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
    promiseTitle: "약속",
  },
  en: {
    title: "Essaypad",
    shortName: "Essaypad",
    tagline: "Free local essay & project word-progress tracker. Set a target, optional deadline, update words written by hand, see progress and daily pace. Weekend-aware write days. JSON backup. No account. No subscription.",
    metaDescription:
      "Free local word-progress tracker for essays, theses, novels and any writing project, with no login and no subscription. Add an essay, set a target word count and an optional deadline. You write in Docs, Word, Notion or on paper; come back and enter the new total, back-dated to any day if you forgot. See a progress bar, the percentage and the words still to go, plus a daily target computed from the remaining words and the write days left, counting all days or weekdays only. A warning appears when you pass 110% of the target. Per-day calendar history, several essays, JSON export and import, offline PWA that works on Android and any browser. No account, no ads, nothing to buy in the app. Data stays on this device.",
    localOnly: "Your essays stay on this device. No login. No ads. No subscription. Unlimited essays are free.",
    langLabel: "Language",
    chipAndroid: "Works on Android & web",
    chipNoLogin: "No login",
    chipNoAds: "No ads on tool",
    chipNoSub: "No subscription",
    chipLocal: "Stays on this device",
    chipBackup: "JSON backup",
    chipWeekend: "Weekend-aware pace",
    chipBackdate: "Back-date history",
    chipFree: "Free forever",
    chipLangs: "ko/en/ja/zh",
    howTitle: "Write elsewhere, count here",
    howBody: "Write in Docs, Word, Notion or on paper. Come back and type the new total; progress and the daily target recompute. This is not an editor.",
    essaysTitle: "Essays",
    newEssay: "New essay",
    newTitle: "New essay",
    editTitle: "Edit essay",
    essayTitleLabel: "Title",
    essayTitlePlaceholder: "e.g. Scholarship essay, Thesis ch. 2",
    targetLabel: "Target words",
    targetPlaceholder: "e.g. 1500",
    deadlineLabel: "Deadline (optional)",
    deadlineHint: "Leave empty to track progress only, with no daily target.",
    clearDeadline: "Clear deadline",
    create: "Create",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    deleteEssay: "Delete essay",
    deleteEssayTitle: "Delete this essay?",
    deleteEssayBody: "Its target, current words and per-day history are removed from this device. This cannot be undone.",
    noEssays: "No essays yet",
    noEssaysHint: "Give it a title and a target word count to start. A deadline can come later.",
    essayCreated: "Essay created",
    essayDeleted: "Essay deleted",
    currentLabel: "Current words",
    wordsN: "{n} words",
    ofTarget: "/ target {n}",
    percentDone: "{pct}%",
    remainingN: "{n} words to go",
    doneLabel: "Target reached",
    overLimitWarn: "Over 110% of the target ({current} / {target}). If there is a limit, you may need to cut.",
    updateWords: "Update words",
    updateTitle: "Update words",
    updateHint: "Enter the new total from wherever you write. Change the date to record a past day you forgot.",
    newTotalLabel: "New total words",
    dateLabel: "Date",
    noteLabel: "Note (optional)",
    notePlaceholder: "e.g. intro done",
    needTitle: "Please enter a title.",
    needTarget: "Target words must be a whole number of at least 1.",
    needWords: "Please enter a whole number of 0 or more.",
    savedToast: "Saved",
    deletedToast: "Deleted",
    paceTitle: "Daily target",
    dailyTargetLabel: "Per day from today to the deadline",
    perDay: "words / day",
    writeDaysLeftN: "{n} write days left",
    calendarDaysLeftN: "{n} days to deadline",
    deadlineOn: "Deadline {date}",
    deadlineToday: "The deadline is today",
    noDeadlineMsg: "Set a deadline to get a daily target. Progress is tracked either way.",
    overdueMsg: "Deadline passed {n} days ago. {remaining} words remain.",
    catchUpMsg: "Catch up today: {n} words",
    doneMsg: "Target reached. Nothing left to write.",
    writeDaysLabel: "Write days",
    allDays: "All days",
    weekdaysOnly: "Weekdays only",
    weekendSkipped: "Saturday and Sunday are not counted.",
    tabHistory: "History",
    tabBackup: "Backup",
    historyTitle: "Per-day history",
    historyHint: "The total at the end of each day and how many words that day added. Back-dated updates land here.",
    noHistory: "No entries yet. Update words and each day stacks up here.",
    colDate: "Date",
    colTotal: "Total",
    colDelta: "Change",
    deleteEntry: "Delete",
    deleteEntryTitle: "Delete this day's entry?",
    deleteEntryBody: "Current words fall back to the latest remaining entry.",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    todayLabel: "Today",
    backupTitle: "JSON backup",
    backupHint: "Export every essay, its history and your settings as one file, and read it back. Importing replaces what is on this device.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    clearAll: "Delete everything",
    exported: "JSON file downloaded",
    importBad: "That file could not be read",
    importOk: "{n} essays loaded",
    importConfirmTitle: "Replace with this file?",
    importConfirmBody: "The essays on this device will be replaced by the {n} in the file.",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Every essay and its history is removed from this device. Export a JSON first if you want to keep it.",
    cleared: "Everything deleted",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    promiseTitle: "Promises",
  },
  ja: {
    title: "エッセイパッド",
    shortName: "エッセイパッド",
    tagline: "無料のローカル エッセイ・プロジェクト語数進捗トラッカー。目標語数と任意の締切を決め、書いた語数を手で更新すると進捗と一日のペースが見えます。週末を除く執筆日設定。JSONバックアップ。アカウント不要。サブスクなし。",
    metaDescription:
      "ログインもサブスクもいらない無料のローカル語数進捗トラッカー。エッセイ・論文・小説などどんな執筆プロジェクトでも追加し、目標語数と任意の締切を決めます。文章は Docs・Word・Notion や紙に書き、戻って新しい合計を入力するだけ。忘れた日は過去の日付でも記録できます。進捗バー、パーセント、残り語数に加え、残り語数 ÷ 残り執筆日で計算した一日の目標を表示し、全ての日か平日だけかを選べます。目標の110%を超えると警告が出ます。日ごとのカレンダー履歴、複数のエッセイ、JSONの書き出し・読み込み、Android でもどのブラウザでも動くオフラインPWA。アカウント不要、広告なし、アプリ内課金なし。データはこの端末だけ。",
    localOnly: "エッセイのデータはこの端末にだけ保存されます。ログイン・広告・サブスクなし。エッセイ数は無制限で無料です。",
    langLabel: "言語",
    chipAndroid: "Android・ウェブで動く",
    chipNoLogin: "ログイン不要",
    chipNoAds: "ツールに広告なし",
    chipNoSub: "サブスクなし",
    chipLocal: "この端末にだけ保存",
    chipBackup: "JSONバックアップ",
    chipWeekend: "週末を除くペース",
    chipBackdate: "過去日付の記録",
    chipFree: "ずっと無料",
    chipLangs: "ko/en/ja/zh",
    howTitle: "書く場所は別、数える場所はここ",
    howBody: "文章は Docs・Word・Notion や紙に書いてください。戻って新しい合計語数を入力すれば、進捗と一日の目標が計算し直されます。このアプリはエディタではありません。",
    essaysTitle: "エッセイ",
    newEssay: "新しいエッセイ",
    newTitle: "新しいエッセイを作る",
    editTitle: "エッセイを編集",
    essayTitleLabel: "タイトル",
    essayTitlePlaceholder: "例: 奨学金エッセイ、論文 第2章",
    targetLabel: "目標語数",
    targetPlaceholder: "例: 1500",
    deadlineLabel: "締切（任意）",
    deadlineHint: "空のままなら進捗だけを追い、一日の目標は計算しません。",
    clearDeadline: "締切を消す",
    create: "作成",
    save: "保存",
    cancel: "キャンセル",
    edit: "編集",
    deleteEssay: "エッセイを削除",
    deleteEssayTitle: "このエッセイを削除しますか？",
    deleteEssayBody: "目標、現在の語数、日ごとの履歴がこの端末から消えます。元に戻せません。",
    noEssays: "まだエッセイがありません",
    noEssaysHint: "タイトルと目標語数を決めて始めましょう。締切は後からでも入れられます。",
    essayCreated: "エッセイを作成しました",
    essayDeleted: "エッセイを削除しました",
    currentLabel: "現在の語数",
    wordsN: "{n} 語",
    ofTarget: "/ 目標 {n}",
    percentDone: "{pct}%",
    remainingN: "残り {n} 語",
    doneLabel: "目標達成",
    overLimitWarn: "目標の110%を超えています（{current} / {target}）。上限があるなら削る必要があるかもしれません。",
    updateWords: "語数を更新",
    updateTitle: "語数を更新",
    updateHint: "書いている場所の新しい合計を入力してください。忘れた日は日付を変えて過去の日に記録できます。",
    newTotalLabel: "新しい合計語数",
    dateLabel: "日付",
    noteLabel: "メモ（任意）",
    notePlaceholder: "例: 序論完了",
    needTitle: "タイトルを入力してください。",
    needTarget: "目標語数は1以上の整数にしてください。",
    needWords: "0以上の整数を入力してください。",
    savedToast: "保存しました",
    deletedToast: "削除しました",
    paceTitle: "一日の目標",
    dailyTargetLabel: "今日から締切まで一日あたり",
    perDay: "語 / 日",
    writeDaysLeftN: "執筆日 残り {n} 日",
    calendarDaysLeftN: "締切まで {n} 日",
    deadlineOn: "締切 {date}",
    deadlineToday: "締切は今日です",
    noDeadlineMsg: "締切を決めると一日の目標を計算します。進捗はそのまま見えます。",
    overdueMsg: "締切を {n} 日過ぎています。残り {remaining} 語。",
    catchUpMsg: "今日で追いつく: {n} 語",
    doneMsg: "目標を満たしました。これ以上書く必要はありません。",
    writeDaysLabel: "執筆日",
    allDays: "すべての日",
    weekdaysOnly: "平日のみ",
    weekendSkipped: "土・日は数えません。",
    tabHistory: "履歴",
    tabBackup: "バックアップ",
    historyTitle: "日ごとの履歴",
    historyHint: "その日の終わりの合計と、その日に増えた語数です。過去の日付で更新するとここに入ります。",
    noHistory: "まだ履歴がありません。語数を更新すると日ごとに積み上がります。",
    colDate: "日付",
    colTotal: "合計",
    colDelta: "増減",
    deleteEntry: "削除",
    deleteEntryTitle: "この日の履歴を削除しますか？",
    deleteEntryBody: "現在の語数は、残った履歴のうち最新の値に戻ります。",
    prevMonth: "前の月",
    nextMonth: "次の月",
    todayLabel: "今日",
    backupTitle: "JSONバックアップ",
    backupHint: "すべてのエッセイ、履歴、設定を一つのファイルに書き出し、読み戻します。読み込みは今のデータをファイルの内容で置き換えます。",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    clearAll: "すべて削除",
    exported: "JSONファイルをダウンロードしました",
    importBad: "読めないファイルです",
    importOk: "エッセイ {n} 件を読み込みました",
    importConfirmTitle: "このファイルで置き換えますか？",
    importConfirmBody: "この端末のエッセイが、ファイルの {n} 件に置き換わります。",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "すべてのエッセイと履歴がこの端末から消えます。残したい場合は先にJSONを書き出してください。",
    cleared: "すべて削除しました",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    promiseTitle: "約束",
  },
  zh: {
    title: "作文进度板",
    shortName: "作文进度板",
    tagline: "免费本地作文/项目字数进度记录。设定目标字数和可选截止日，手动更新已写字数，查看进度和每日配额。可跳过周末的写作日。JSON 备份。无需账号。无订阅。",
    metaDescription:
      "不用登录、没有订阅的免费本地字数进度记录。添加作文、论文、小说等任何写作项目，设定目标字数和可选截止日。文章写在 Docs、Word、Notion 或纸上，回来只需输入新的总字数；忘了也能补记到过去的日期。显示进度条、百分比、剩余字数，以及按剩余字数 ÷ 剩余写作日算出的每日目标，可按所有日子或仅工作日计算。超过目标 110% 会出现提醒。按日日历历史、多个作文、JSON 导出与导入、在 Android 和任何浏览器都能用的离线 PWA。无需账号、无广告、无应用内购买。数据只留在此设备。",
    localOnly: "作文数据仅保存在此设备。无登录、无广告、无订阅。作文数量不限，全部免费。",
    langLabel: "语言",
    chipAndroid: "支持 Android 和网页",
    chipNoLogin: "无需登录",
    chipNoAds: "工具无广告",
    chipNoSub: "无订阅",
    chipLocal: "只留在此设备",
    chipBackup: "JSON 备份",
    chipWeekend: "可跳过周末的配额",
    chipBackdate: "补记过去日期",
    chipFree: "永久免费",
    chipLangs: "ko/en/ja/zh",
    howTitle: "在别处写，在这里数",
    howBody: "文章写在 Docs、Word、Notion 或纸上。回来输入新的总字数，进度和每日目标会重新计算。这不是编辑器。",
    essaysTitle: "作文",
    newEssay: "新建作文",
    newTitle: "新建作文",
    editTitle: "编辑作文",
    essayTitleLabel: "标题",
    essayTitlePlaceholder: "例如：奖学金作文、论文第 2 章",
    targetLabel: "目标字数",
    targetPlaceholder: "例如：1500",
    deadlineLabel: "截止日（可选）",
    deadlineHint: "留空则只记录进度，不计算每日目标。",
    clearDeadline: "清除截止日",
    create: "创建",
    save: "保存",
    cancel: "取消",
    edit: "编辑",
    deleteEssay: "删除作文",
    deleteEssayTitle: "删除这篇作文？",
    deleteEssayBody: "它的目标、当前字数和按日历史将从此设备移除。无法撤销。",
    noEssays: "还没有作文",
    noEssaysHint: "先填标题和目标字数开始。截止日可以以后再加。",
    essayCreated: "已创建作文",
    essayDeleted: "已删除作文",
    currentLabel: "当前字数",
    wordsN: "{n} 字",
    ofTarget: "/ 目标 {n}",
    percentDone: "{pct}%",
    remainingN: "还差 {n} 字",
    doneLabel: "已达目标",
    overLimitWarn: "已超过目标的 110%（{current} / {target}）。如果有上限，可能需要删减。",
    updateWords: "更新字数",
    updateTitle: "更新字数",
    updateHint: "输入你写作处的新总字数。忘了记的日子可以改日期补记到过去。",
    newTotalLabel: "新的总字数",
    dateLabel: "日期",
    noteLabel: "备注（可选）",
    notePlaceholder: "例如：引言完成",
    needTitle: "请输入标题。",
    needTarget: "目标字数必须是不小于 1 的整数。",
    needWords: "请输入不小于 0 的整数。",
    savedToast: "已保存",
    deletedToast: "已删除",
    paceTitle: "每日目标",
    dailyTargetLabel: "从今天到截止日每天",
    perDay: "字 / 天",
    writeDaysLeftN: "还剩 {n} 个写作日",
    calendarDaysLeftN: "距截止日 {n} 天",
    deadlineOn: "截止 {date}",
    deadlineToday: "今天就是截止日",
    noDeadlineMsg: "设定截止日后会计算每日目标。进度照常显示。",
    overdueMsg: "截止日已过 {n} 天。还差 {remaining} 字。",
    catchUpMsg: "今天补上：{n} 字",
    doneMsg: "目标已完成。不用再写了。",
    writeDaysLabel: "写作日",
    allDays: "所有日子",
    weekdaysOnly: "仅工作日",
    weekendSkipped: "周六、周日不计入。",
    tabHistory: "历史",
    tabBackup: "备份",
    historyTitle: "按日历史",
    historyHint: "每天结束时的总字数和当天增加的字数。补记到过去日期的更新也会出现在这里。",
    noHistory: "还没有记录。更新字数后会按日累积在这里。",
    colDate: "日期",
    colTotal: "总计",
    colDelta: "增减",
    deleteEntry: "删除",
    deleteEntryTitle: "删除这一天的记录？",
    deleteEntryBody: "当前字数会回退到剩余记录中最新的值。",
    prevMonth: "上个月",
    nextMonth: "下个月",
    todayLabel: "今天",
    backupTitle: "JSON 备份",
    backupHint: "把所有作文、历史和设置导出为一个文件，并可导回。导入会替换此设备上的数据。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    clearAll: "全部删除",
    exported: "已下载 JSON 文件",
    importBad: "无法读取该文件",
    importOk: "已载入 {n} 篇作文",
    importConfirmTitle: "用这个文件替换？",
    importConfirmBody: "此设备上的作文将被文件中的 {n} 篇替换。",
    clearAllTitle: "全部删除？",
    clearAllBody: "所有作文和历史将从此设备移除。想保留请先导出 JSON。",
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
