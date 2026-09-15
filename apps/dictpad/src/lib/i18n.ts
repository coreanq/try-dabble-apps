/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "dictpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://dictpad.try-dabble.com/og-image-ko.png",
  en: "https://dictpad.try-dabble.com/og-image-en.png",
  ja: "https://dictpad.try-dabble.com/og-image-ja.png",
  zh: "https://dictpad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoPaywall"
  | "chipNoAds"
  | "chipLocal"
  | "chipBackup"
  | "chipMicSafe"
  | "chipNotKeyboard"
  | "chipFree"
  | "chipLangs"
  | "speechLangLabel"
  | "speechLangHint"
  | "record"
  | "stop"
  | "statusIdle"
  | "statusListening"
  | "statusStarting"
  | "interimEmpty"
  | "unsupported"
  | "errNotAllowed"
  | "errNetwork"
  | "errAudio"
  | "errGeneric"
  | "notesTitle"
  | "noteSelectLabel"
  | "newNote"
  | "rename"
  | "delete"
  | "untitled"
  | "renameTitle"
  | "renameBody"
  | "noteTitleLabel"
  | "deleteNoteTitle"
  | "deleteNoteBody"
  | "notepadLabel"
  | "notepadPlaceholder"
  | "charsN"
  | "savedLocally"
  | "copy"
  | "copied"
  | "copyFailed"
  | "downloadTxt"
  | "exportJson"
  | "importJson"
  | "importTitle"
  | "importBody"
  | "importDone"
  | "importBad"
  | "clearAll"
  | "clearTitle"
  | "clearBody"
  | "cleared"
  | "cancel"
  | "confirm"
  | "save"
  | "voiceTitle"
  | "voiceHint"
  | "voicePeriod"
  | "voiceComma"
  | "voiceNewline"
  | "voiceParagraph"
  | "voiceQuestion"
  | "sayPrefix"
  | "docTitle"
  | "docAndroid"
  | "docNetwork"
  | "docNotKeyboard"
  | "docEdit"
  | "promiseTitle"
  | "privacy"
  | "terms"
  | "guide";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "딕트패드",
    shortName: "딕트패드",
    tagline: "무료 로컬 음성 받아쓰기 메모장. 녹음 버튼으로 실시간 받아쓰기, 구두점 음성 명령, 언어 선택, JSON 백업. 계정 없음. 구독 없음.",
    metaDescription:
      "로그인 없는 무료 로컬 음성 받아쓰기 메모장. 녹음 버튼을 누르고 말하면 브라우저 음성 인식(Web Speech API)이 실시간으로 받아써서 바로 고칠 수 있는 메모장에 넣습니다. “마침표”·“쉼표”·“줄바꿈”·“단락” 같은 구두점 음성 명령, 한국어·영어·일본어·중국어 등 인식 언어 선택, 여러 개의 이름 있는 노트, 자동 저장, 복사·TXT 다운로드, JSON 내보내기·불러오기, 오프라인 PWA 셸. 시스템 키보드가 아니라 브라우저 안 메모장입니다. 계정 없음, 광고 없음, 유료 구독 없음. 노트는 이 기기에만.",
    localOnly: "노트는 이 기기에만 저장됩니다. 로그인·광고·유료 구독 없음. 시스템 키보드가 아니라 브라우저 메모장입니다.",
    langLabel: "언어",
    chipNoPaywall: "유료 벽 없음",
    chipNoAds: "도구 화면에 광고 없음",
    chipLocal: "노트는 이 기기에만",
    chipBackup: "JSON 백업",
    chipMicSafe: "마이크 정지 후에도 다음 세션 정상",
    chipNotKeyboard: "시스템 키보드 아님",
    chipFree: "영원히 무료",
    chipLangs: "ko/en/ja/zh",
    speechLangLabel: "인식 언어",
    speechLangHint: "말하는 언어입니다. 화면 언어와 따로 고를 수 있습니다.",
    record: "녹음",
    stop: "정지",
    statusIdle: "대기 중",
    statusListening: "듣는 중",
    statusStarting: "시작하는 중",
    interimEmpty: "말하면 여기에 먼저 보이고, 확정되면 메모장에 들어갑니다.",
    unsupported: "이 브라우저는 음성 인식을 지원하지 않습니다. Chrome이나 Edge를 권장합니다(Safari는 제한적). 타이핑은 그대로 됩니다.",
    errNotAllowed: "마이크 권한이 거부되었습니다. 브라우저 주소창의 자물쇠에서 마이크를 허용한 뒤 다시 녹음을 누르세요.",
    errNetwork: "음성 인식 서비스에 연결할 수 없습니다. 대부분의 브라우저는 인식에 인터넷이 필요합니다.",
    errAudio: "마이크에서 소리를 받지 못했습니다. 다른 앱이 마이크를 쓰고 있는지 확인하세요.",
    errGeneric: "음성 인식이 중단되었습니다. 녹음을 다시 누르세요.",
    notesTitle: "노트",
    noteSelectLabel: "노트 선택",
    newNote: "새 노트",
    rename: "이름 변경",
    delete: "삭제",
    untitled: "제목 없는 노트",
    renameTitle: "노트 이름 변경",
    renameBody: "이 노트의 제목을 정합니다. 본문은 그대로입니다.",
    noteTitleLabel: "제목",
    deleteNoteTitle: "이 노트를 삭제할까요?",
    deleteNoteBody: "이 노트의 본문이 이 기기에서 지워집니다. 되돌릴 수 없습니다.",
    notepadLabel: "메모장",
    notepadPlaceholder: "녹음을 누르고 말하거나, 여기에 바로 입력하세요.",
    charsN: "{n}자",
    savedLocally: "이 기기에 자동 저장됨",
    copy: "복사",
    copied: "복사했습니다",
    copyFailed: "복사하지 못했습니다. 본문을 길게 눌러 선택하세요.",
    downloadTxt: "TXT 다운로드",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    importTitle: "백업을 가져올까요?",
    importBody: "노트 {n}개를 찾았습니다. 지금 있는 노트는 이 백업으로 바뀝니다.",
    importDone: "노트 {n}개를 가져왔습니다",
    importBad: "읽을 수 없는 파일입니다. 딕트패드 JSON 백업을 고르세요.",
    clearAll: "모두 삭제",
    clearTitle: "모든 노트를 지울까요?",
    clearBody: "이 기기의 노트가 전부 지워집니다. 먼저 JSON으로 내보내 두세요.",
    cleared: "모두 지웠습니다",
    cancel: "취소",
    confirm: "확인",
    save: "저장",
    voiceTitle: "구두점 음성 명령",
    voiceHint: "말한 단어 대신 부호가 들어갑니다. 인식 언어에 맞는 명령을 씁니다.",
    voicePeriod: "마침표",
    voiceComma: "쉼표",
    voiceNewline: "줄바꿈",
    voiceParagraph: "단락",
    voiceQuestion: "물음표",
    sayPrefix: "“{w}”라고 말하면",
    docTitle: "알아 두기",
    docAndroid: "Android Chrome: 한 번 탭하면 녹음이 시작됩니다. 녹음 중에는 화면이 꺼지지 않게 유지합니다.",
    docNetwork: "음성 인식은 브라우저의 음성 서비스를 씁니다. 대부분의 브라우저에서 인터넷 연결이 필요하고, 메모장 자체는 오프라인에서도 열립니다.",
    docNotKeyboard: "다른 앱에 글자를 넣는 시스템 키보드가 아닙니다. 이 메모장에 받아쓴 뒤 복사해서 쓰세요.",
    docEdit: "녹음 중에도 본문을 자유롭게 고칠 수 있습니다. 확정된 문장은 끝에 이어 붙습니다.",
    promiseTitle: "약속",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Dictpad",
    shortName: "Dictpad",
    tagline: "Free local talk-to-text notepad. Tap record for live dictation into editable notes. Voice punctuation, language picker, JSON backup. No account. No subscription.",
    metaDescription:
      "Free local talk-to-text notepad with no login. Tap record and speak: the browser's speech recognition (Web Speech API) dictates live into a notepad you can edit at any time. Voice punctuation commands like “period”, “comma”, “new line” and “new paragraph”, a recognition-language picker for Korean, English, Japanese, Chinese and more, several named notes, autosave, copy and TXT download, JSON export and import, offline PWA shell. An in-browser notepad, not a system keyboard. No account, no ads, no paid subscription. Notes stay on this device.",
    localOnly: "Your notes stay on this device. No login. No ads. No paid subscription. This is an in-browser notepad — not a system keyboard.",
    langLabel: "Language",
    chipNoPaywall: "No paywall",
    chipNoAds: "No ads on tool",
    chipLocal: "Notes stay on device",
    chipBackup: "JSON backup",
    chipMicSafe: "Mic stop does not break next session",
    chipNotKeyboard: "Not a system keyboard",
    chipFree: "Free forever",
    chipLangs: "ko/en/ja/zh",
    speechLangLabel: "Recognition language",
    speechLangHint: "The language you speak. Separate from the screen language.",
    record: "Record",
    stop: "Stop",
    statusIdle: "Idle",
    statusListening: "Listening",
    statusStarting: "Starting",
    interimEmpty: "What you say shows here first, then lands in the notepad once final.",
    unsupported: "This browser has no speech recognition. Chrome or Edge is recommended (Safari is limited). Typing still works.",
    errNotAllowed: "Microphone access was denied. Allow the mic from the lock icon in the address bar, then tap Record again.",
    errNetwork: "Could not reach the speech service. Most browsers need an internet connection to recognise speech.",
    errAudio: "No audio came from the microphone. Check that another app is not using it.",
    errGeneric: "Speech recognition stopped. Tap Record again.",
    notesTitle: "Notes",
    noteSelectLabel: "Choose a note",
    newNote: "New note",
    rename: "Rename",
    delete: "Delete",
    untitled: "Untitled note",
    renameTitle: "Rename note",
    renameBody: "Give this note a title. The text stays as it is.",
    noteTitleLabel: "Title",
    deleteNoteTitle: "Delete this note?",
    deleteNoteBody: "Its text is removed from this device. This cannot be undone.",
    notepadLabel: "Notepad",
    notepadPlaceholder: "Tap Record and speak, or just type here.",
    charsN: "{n} chars",
    savedLocally: "Autosaved on this device",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Could not copy. Long-press the text to select it.",
    downloadTxt: "Download .txt",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    importTitle: "Import this backup?",
    importBody: "Found {n} notes. Your current notes will be replaced by this backup.",
    importDone: "Imported {n} notes",
    importBad: "Could not read that file. Pick a Dictpad JSON backup.",
    clearAll: "Delete everything",
    clearTitle: "Delete all notes?",
    clearBody: "Every note on this device is removed. Export JSON first if you want a copy.",
    cleared: "Everything deleted",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    voiceTitle: "Voice punctuation",
    voiceHint: "Say the word and the mark is inserted instead. Commands follow the recognition language.",
    voicePeriod: "period",
    voiceComma: "comma",
    voiceNewline: "new line",
    voiceParagraph: "new paragraph",
    voiceQuestion: "question mark",
    sayPrefix: "Say “{w}”",
    docTitle: "Good to know",
    docAndroid: "Chrome on Android: one tap starts recording. The screen is kept awake while recording.",
    docNetwork: "Recognition uses your browser's speech service. Most browsers need a connection for it; the notepad itself opens offline.",
    docNotKeyboard: "Not a system keyboard that types into other apps. Dictate here, then copy the text where you need it.",
    docEdit: "You can edit the text freely while recording. Final sentences are appended at the end.",
    promiseTitle: "Promises",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "ディクトパッド",
    shortName: "ディクトパッド",
    tagline: "無料のローカル音声入力メモ帳。録音ボタンでリアルタイム書き取り、句読点の音声コマンド、言語選択、JSONバックアップ。アカウント不要。サブスクなし。",
    metaDescription:
      "ログイン不要の無料ローカル音声入力メモ帳。録音ボタンを押して話すと、ブラウザの音声認識（Web Speech API）がリアルタイムで書き取り、いつでも編集できるメモ帳に入れます。「句点」「読点」「改行」「段落」などの句読点音声コマンド、韓国語・英語・日本語・中国語ほかの認識言語の選択、名前付きノートを複数、自動保存、コピー・TXTダウンロード、JSONの書き出し・読み込み、オフラインPWAシェル。システムキーボードではなく、ブラウザの中のメモ帳です。アカウント不要、広告なし、有料サブスクなし。ノートはこの端末だけ。",
    localOnly: "ノートはこの端末にだけ保存されます。ログイン・広告・有料サブスクなし。システムキーボードではなく、ブラウザのメモ帳です。",
    langLabel: "言語",
    chipNoPaywall: "課金の壁なし",
    chipNoAds: "ツール画面に広告なし",
    chipLocal: "ノートはこの端末だけ",
    chipBackup: "JSONバックアップ",
    chipMicSafe: "マイク停止後も次のセッションは正常",
    chipNotKeyboard: "システムキーボードではない",
    chipFree: "ずっと無料",
    chipLangs: "ko/en/ja/zh",
    speechLangLabel: "認識言語",
    speechLangHint: "話す言語です。画面の言語とは別に選べます。",
    record: "録音",
    stop: "停止",
    statusIdle: "待機中",
    statusListening: "聞き取り中",
    statusStarting: "開始中",
    interimEmpty: "話した内容はまずここに出て、確定するとメモ帳に入ります。",
    unsupported: "このブラウザは音声認識に対応していません。ChromeかEdgeを推奨します（Safariは制限あり）。入力はそのまま使えます。",
    errNotAllowed: "マイクの許可が拒否されました。アドレスバーの鍵アイコンからマイクを許可し、もう一度録音を押してください。",
    errNetwork: "音声認識サービスに接続できません。ほとんどのブラウザは認識にインターネット接続が必要です。",
    errAudio: "マイクから音声が届きませんでした。他のアプリがマイクを使っていないか確認してください。",
    errGeneric: "音声認識が止まりました。もう一度録音を押してください。",
    notesTitle: "ノート",
    noteSelectLabel: "ノートを選ぶ",
    newNote: "新しいノート",
    rename: "名前を変更",
    delete: "削除",
    untitled: "無題のノート",
    renameTitle: "ノート名を変更",
    renameBody: "このノートのタイトルを決めます。本文はそのままです。",
    noteTitleLabel: "タイトル",
    deleteNoteTitle: "このノートを削除しますか？",
    deleteNoteBody: "本文がこの端末から消えます。元に戻せません。",
    notepadLabel: "メモ帳",
    notepadPlaceholder: "録音を押して話すか、ここに直接入力してください。",
    charsN: "{n}文字",
    savedLocally: "この端末に自動保存",
    copy: "コピー",
    copied: "コピーしました",
    copyFailed: "コピーできませんでした。本文を長押しして選択してください。",
    downloadTxt: "TXTをダウンロード",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    importTitle: "このバックアップを読み込みますか？",
    importBody: "ノートが{n}件見つかりました。今のノートはこのバックアップに置き換わります。",
    importDone: "ノートを{n}件読み込みました",
    importBad: "読めないファイルです。ディクトパッドのJSONバックアップを選んでください。",
    clearAll: "すべて削除",
    clearTitle: "すべてのノートを削除しますか？",
    clearBody: "この端末のノートがすべて消えます。先にJSONを書き出しておいてください。",
    cleared: "すべて削除しました",
    cancel: "キャンセル",
    confirm: "確認",
    save: "保存",
    voiceTitle: "句読点の音声コマンド",
    voiceHint: "言った単語の代わりに記号が入ります。コマンドは認識言語に合わせます。",
    voicePeriod: "句点",
    voiceComma: "読点",
    voiceNewline: "改行",
    voiceParagraph: "段落",
    voiceQuestion: "疑問符",
    sayPrefix: "「{w}」と言うと",
    docTitle: "知っておくこと",
    docAndroid: "Android Chrome: 1回タップで録音が始まります。録音中は画面が消えないようにします。",
    docNetwork: "認識にはブラウザの音声サービスを使います。ほとんどのブラウザで接続が必要ですが、メモ帳自体はオフラインでも開きます。",
    docNotKeyboard: "他のアプリに文字を入れるシステムキーボードではありません。ここで書き取ってからコピーして使ってください。",
    docEdit: "録音中も本文を自由に編集できます。確定した文は末尾に追加されます。",
    promiseTitle: "約束",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "听写板",
    shortName: "听写板",
    tagline: "免费本地听写记事本。点录音即可实时听写到可编辑笔记。语音标点、语言选择、JSON 备份。无需账号。无订阅。",
    metaDescription:
      "无需登录的免费本地听写记事本。点录音开口说话，浏览器的语音识别（Web Speech API）实时听写进一个随时可编辑的记事本。“句号”“逗号”“换行”“段落”等语音标点命令，韩语、英语、日语、中文等识别语言选择，多个命名笔记，自动保存，复制和 TXT 下载，JSON 导出与导入，离线 PWA 外壳。这是浏览器里的记事本，不是系统输入法。无需账号，无广告，无付费订阅。笔记仅保存在此设备。",
    localOnly: "笔记仅保存在此设备。无登录、无广告、无付费订阅。这是浏览器记事本，不是系统输入法。",
    langLabel: "语言",
    chipNoPaywall: "无付费墙",
    chipNoAds: "工具页面无广告",
    chipLocal: "笔记仅在此设备",
    chipBackup: "JSON 备份",
    chipMicSafe: "停止麦克风后下次仍正常",
    chipNotKeyboard: "不是系统输入法",
    chipFree: "永久免费",
    chipLangs: "ko/en/ja/zh",
    speechLangLabel: "识别语言",
    speechLangHint: "你说话的语言，可与界面语言分开选择。",
    record: "录音",
    stop: "停止",
    statusIdle: "待机",
    statusListening: "正在听",
    statusStarting: "正在启动",
    interimEmpty: "说的话先显示在这里，确定后进入记事本。",
    unsupported: "此浏览器不支持语音识别。推荐 Chrome 或 Edge（Safari 有限制）。仍可正常打字。",
    errNotAllowed: "麦克风权限被拒绝。请在地址栏的锁图标里允许麦克风，然后再点录音。",
    errNetwork: "无法连接语音识别服务。大多数浏览器识别时需要联网。",
    errAudio: "没有从麦克风收到声音。请检查是否有其他应用占用麦克风。",
    errGeneric: "语音识别已停止。请再点一次录音。",
    notesTitle: "笔记",
    noteSelectLabel: "选择笔记",
    newNote: "新建笔记",
    rename: "重命名",
    delete: "删除",
    untitled: "未命名笔记",
    renameTitle: "重命名笔记",
    renameBody: "给这条笔记起个标题，正文保持不变。",
    noteTitleLabel: "标题",
    deleteNoteTitle: "删除这条笔记？",
    deleteNoteBody: "正文将从此设备移除，无法撤销。",
    notepadLabel: "记事本",
    notepadPlaceholder: "点录音开始说话，或直接在这里输入。",
    charsN: "{n} 字",
    savedLocally: "已自动保存到此设备",
    copy: "复制",
    copied: "已复制",
    copyFailed: "无法复制。请长按正文进行选择。",
    downloadTxt: "下载 TXT",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    importTitle: "导入这个备份？",
    importBody: "找到 {n} 条笔记。当前笔记将被这个备份替换。",
    importDone: "已导入 {n} 条笔记",
    importBad: "无法读取该文件。请选择听写板的 JSON 备份。",
    clearAll: "全部删除",
    clearTitle: "删除所有笔记？",
    clearBody: "此设备上的所有笔记都会被删除。想保留请先导出 JSON。",
    cleared: "已全部删除",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    voiceTitle: "语音标点",
    voiceHint: "说出这个词就会插入对应符号。命令跟随识别语言。",
    voicePeriod: "句号",
    voiceComma: "逗号",
    voiceNewline: "换行",
    voiceParagraph: "段落",
    voiceQuestion: "问号",
    sayPrefix: "说“{w}”",
    docTitle: "须知",
    docAndroid: "Android Chrome：点一下即开始录音。录音时屏幕保持常亮。",
    docNetwork: "识别使用浏览器自带的语音服务，大多数浏览器需要联网；记事本本身可离线打开。",
    docNotKeyboard: "不是往其他应用里打字的系统输入法。在这里听写，再把文字复制到需要的地方。",
    docEdit: "录音时也可以随意编辑正文。确定的句子会接在末尾。",
    promiseTitle: "承诺",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
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
