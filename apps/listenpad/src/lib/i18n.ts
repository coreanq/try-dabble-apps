/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "listenpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://listenpad.try-dabble.com/og-image-ko.png",
  en: "https://listenpad.try-dabble.com/og-image-en.png",
  ja: "https://listenpad.try-dabble.com/og-image-ja.png",
  zh: "https://listenpad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoLogin"
  | "chipNoUpload"
  | "chipFreeLoop"
  | "chipPhone"
  | "chipShort"
  | "chipSaved"
  | "chipNoAds"
  | "chipLangs"
  | "fileTitle"
  | "pickFile"
  | "changeFile"
  | "dropHint"
  | "emptyTitle"
  | "emptyBody"
  | "iosNote"
  | "badFile"
  | "loadError"
  | "currentFile"
  | "play"
  | "pause"
  | "rewindTitle"
  | "rewindHint"
  | "rewindN"
  | "forwardN"
  | "forwardTitle"
  | "loopTitle"
  | "setA"
  | "setB"
  | "clearLoop"
  | "loopOff"
  | "loopArmed"
  | "loopOn"
  | "loopHint"
  | "speedTitle"
  | "speedHint"
  | "resetSpeed"
  | "scrubLabel"
  | "notesTitle"
  | "notesFor"
  | "notesNoFile"
  | "notesPlaceholder"
  | "notesHint"
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
  | "docTitle"
  | "docIos"
  | "docMobile"
  | "docNotLibrary"
  | "docFormats"
  | "docKeys"
  | "promiseTitle"
  | "privacy"
  | "terms"
  | "guide";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "리슨패드",
    shortName: "리슨패드",
    tagline: "무료 로컬 언어 듣기 플레이어. 한 탭 짧은 되감기, A–B 구간 반복, 배속. 이 기기에서 파일 선택. 계정 없음. 구독 없음.",
    metaDescription:
      "로그인 없는 무료 로컬 언어 듣기 연습 플레이어. 이 기기의 오디오 파일을 하나 골라 재생하고, 1·2·3·4초 짧은 되감기 버튼 한 번으로 방금 지나간 문장을 다시 듣고, A–B 구간 반복으로 같은 부분을 반복하고, 0.5×부터 1.5×까지 배속을 바꾸고, 슬라이더로 위치를 옮깁니다. 파일 이름별 듣기 메모, 설정 자동 저장, JSON 백업, 오프라인 PWA 셸. 폰 화면에 맞춘 큰 버튼. 음악 라이브러리가 아니라 한 파일을 파고드는 연습용 플레이어입니다. 오디오는 업로드하지 않습니다. 계정 없음, 광고 없음, 유료 구독 없음.",
    localOnly: "오디오와 메모는 이 기기에만 둡니다. 업로드·로그인·광고 없음. 되감기·구간반복·배속 모두 무료.",
    langLabel: "언어",
    chipNoLogin: "로그인 없음",
    chipNoUpload: "클라우드 업로드 없음",
    chipFreeLoop: "되감기·구간반복 무료",
    chipPhone: "폰에 맞는 큰 버튼",
    chipShort: "1–4초 짧은 되감기",
    chipSaved: "설정은 이 기기에 저장",
    chipNoAds: "광고 없음",
    chipLangs: "ko/en/ja/zh",
    fileTitle: "오디오 파일",
    pickFile: "파일 선택",
    changeFile: "파일 바꾸기",
    dropHint: "또는 여기에 오디오 파일을 끌어다 놓으세요",
    emptyTitle: "열린 파일 없음",
    emptyBody: "이 기기의 오디오 파일을 하나 고르세요. 팟캐스트 한 편, 교재 음원, 녹음 파일. 여기서 재생되고 기기 밖으로 나가지 않습니다.",
    iosNote: "아이폰에서는 새로고침 후 파일을 다시 골라야 할 수 있습니다.",
    badFile: "오디오 파일이 아닌 것 같습니다. MP3, M4A, WAV, OGG, FLAC을 써 보세요.",
    loadError: "이 브라우저가 그 파일을 재생하지 못했습니다. MP3나 M4A 같은 다른 형식을 써 보세요.",
    currentFile: "열림: {name}",
    play: "재생",
    pause: "일시정지",
    rewindTitle: "짧은 되감기",
    rewindHint: "한 번 누르면 조금만 뒤로 갑니다. 놓친 문장을 자리 잃지 않고 다시 듣습니다.",
    rewindN: "{n}초 되감기",
    forwardN: "{n}초 앞으로",
    forwardTitle: "앞으로 건너뛰기",
    loopTitle: "A–B 구간 반복",
    setA: "A 지정",
    setB: "B 지정",
    clearLoop: "구간 해제",
    loopOff: "반복 없음. 구간 시작에서 A 지정, 끝에서 B 지정을 누르세요.",
    loopArmed: "A {a}. 계속 재생하다가 구간 끝에서 B 지정을 누르세요.",
    loopOn: "{a} – {b} 반복 중. B에 닿으면 A로 돌아갑니다.",
    loopHint: "해제할 때까지 반복이 유지됩니다. 지점은 이 파일 이름으로 저장됩니다.",
    speedTitle: "배속",
    speedHint: "느리게 해도 음높이는 그대로라 목소리가 자연스럽습니다. 1×가 보통 속도입니다.",
    resetSpeed: "1×로 초기화",
    scrubLabel: "재생 위치",
    notesTitle: "듣기 메모",
    notesFor: "{name} 메모",
    notesNoFile: "파일을 열면 그 파일의 메모를 남길 수 있습니다.",
    notesPlaceholder: "들리는 대로, 새 단어, 확인할 표현…",
    notesHint: "이 파일 이름으로 이 기기에 저장됩니다. 같은 파일을 다시 열면 메모가 돌아옵니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 불러오기",
    importTitle: "이 백업을 불러올까요?",
    importBody: "파일의 설정과 메모가 이 기기의 것을 대체합니다. 오디오는 백업에 들어 있지 않습니다.",
    importDone: "백업을 불러왔습니다.",
    importBad: "리슨패드 백업으로 읽을 수 없는 파일입니다.",
    clearAll: "모두 삭제",
    clearTitle: "모두 삭제할까요?",
    clearBody: "이 기기의 설정, 구간 지점, 모든 메모가 지워집니다. 오디오 파일은 건드리지 않습니다.",
    cleared: "이 기기의 내용을 모두 지웠습니다.",
    cancel: "취소",
    docTitle: "알아 두기",
    docIos: "아이폰 사파리는 방문 사이에 파일을 열어 두지 못합니다. 새로고침 후 파일 바꾸기를 눌러 같은 파일을 고르면 그 파일 이름의 구간 지점과 메모가 돌아옵니다.",
    docMobile: "폰의 Chrome과 Safari에서 됩니다. 되감기·구간·배속이 모두 큰 버튼이라 키보드가 필요 없습니다.",
    docNotLibrary: "한 번에 한 파일을 파고드는 연습용 플레이어입니다. 라이브러리, 재생목록, 앨범은 없습니다. 그건 음악 플레이어의 몫입니다.",
    docFormats: "이 브라우저가 재생할 수 있는 형식은 다 됩니다. 보통 MP3, M4A/AAC, WAV, OGG, FLAC. 파일은 제자리에서 열리고 업로드되지 않습니다.",
    docKeys: "키보드가 있으면 스페이스로 재생·일시정지, ←·→로 마지막에 누른 초만큼 되감기·앞으로.",
    promiseTitle: "이 앱이 약속하는 것",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Listenpad",
    shortName: "Listenpad",
    tagline: "Free local language-listening player. One-tap short rewind, A–B loop, speed control. Pick a file on this device. No account. No subscription.",
    metaDescription:
      "Free local language-listening practice player with no login. Pick one audio file on this device, then drill it: one-tap 1, 2, 3 or 4 second rewind to hear the phrase you just missed, A–B loop to repeat one passage, playback speed from 0.5× to 1.5×, and a scrubber with time labels. Listening notes per file name, settings saved automatically, JSON backup, offline PWA shell. Big buttons sized for a phone. A drill player for one file at a time, not a music library. Audio is never uploaded. No account, no ads, no paid subscription.",
    localOnly: "Audio and notes stay on this device. No upload. No login. No ads. Rewind, A–B loop, and speed are free.",
    langLabel: "Language",
    chipNoLogin: "No login",
    chipNoUpload: "No cloud upload",
    chipFreeLoop: "Rewind & loop free",
    chipPhone: "Phone-sized buttons",
    chipShort: "Short 1–4s rewind",
    chipSaved: "Settings saved here",
    chipNoAds: "No ads",
    chipLangs: "ko/en/ja/zh",
    fileTitle: "Audio file",
    pickFile: "Pick a file",
    changeFile: "Change file",
    dropHint: "or drop an audio file here",
    emptyTitle: "No file open",
    emptyBody: "Pick one audio file on this device: a podcast episode, a textbook track, a recording. It plays here and never leaves this device.",
    iosNote: "On iPhone you may need to pick the file again after reload.",
    badFile: "That does not look like an audio file. Try MP3, M4A, WAV, OGG or FLAC.",
    loadError: "This browser could not play that file. Try another format such as MP3 or M4A.",
    currentFile: "Open: {name}",
    play: "Play",
    pause: "Pause",
    rewindTitle: "Short rewind",
    rewindHint: "One tap jumps back just a little, so the phrase you missed plays again without losing your place.",
    rewindN: "Rewind {n}s",
    forwardN: "Forward {n}s",
    forwardTitle: "Skip forward",
    loopTitle: "A–B loop",
    setA: "Set A",
    setB: "Set B",
    clearLoop: "Clear loop",
    loopOff: "No loop. Tap Set A at the start of a passage, then Set B at its end.",
    loopArmed: "A at {a}. Keep playing and tap Set B at the end of the passage.",
    loopOn: "Looping {a} – {b}. Playback jumps back to A at B.",
    loopHint: "The loop stays on until you clear it. Points are saved for this file name.",
    speedTitle: "Speed",
    speedHint: "Slower keeps the pitch, so voices stay natural. 1× is normal speed.",
    resetSpeed: "Reset 1×",
    scrubLabel: "Position",
    notesTitle: "Listening notes",
    notesFor: "Notes for {name}",
    notesNoFile: "Open a file to keep notes for it.",
    notesPlaceholder: "Write what you hear, new words, a phrase to check…",
    notesHint: "Saved on this device under this file’s name. Open the same file again and the notes come back.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    importTitle: "Import this backup?",
    importBody: "Settings and notes in the file replace what is on this device. Audio is not part of a backup.",
    importDone: "Backup imported.",
    importBad: "Could not read that file as a Listenpad backup.",
    clearAll: "Delete everything",
    clearTitle: "Delete everything?",
    clearBody: "Settings, loop points and all notes on this device are removed. Your audio files are not touched.",
    cleared: "Everything on this device was deleted.",
    cancel: "Cancel",
    docTitle: "Good to know",
    docIos: "Safari on iPhone cannot keep a file open between visits. After a reload, tap Change file and choose the same file; your loop points and notes for that file name come back.",
    docMobile: "Works in Chrome and Safari on a phone. Every rewind, loop and speed control is a big button; no keyboard needed.",
    docNotLibrary: "This is a drill player for one file at a time. It has no library, playlists or albums; for that, use a music player.",
    docFormats: "Plays whatever this browser can play: usually MP3, M4A/AAC, WAV, OGG and FLAC. The file is opened in place and never uploaded.",
    docKeys: "On a keyboard: Space plays and pauses, ← and → rewind and skip by the last amount you tapped.",
    promiseTitle: "What this app promises",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "リッスンパッド",
    shortName: "リッスンパッド",
    tagline: "無料のローカル語学リスニングプレーヤー。ワンタップ短戻し、A–Bループ、速度調整。この端末でファイルを選ぶだけ。アカウント不要。サブスクなし。",
    metaDescription:
      "ログイン不要の無料ローカル語学リスニング練習プレーヤー。この端末の音声ファイルを一つ選び、1・2・3・4秒の短戻しボタンをワンタップして聞き逃した一文をもう一度、A–Bループで同じ箇所を繰り返し、0.5×から1.5×まで速度を変え、スライダーで位置を動かします。ファイル名ごとのリスニングメモ、設定の自動保存、JSONバックアップ、オフラインPWAシェル。スマホ画面に合わせた大きなボタン。音楽ライブラリではなく、一つのファイルを掘り下げる練習用プレーヤーです。音声はアップロードしません。アカウント不要、広告なし、有料サブスクなし。",
    localOnly: "音声とメモはこの端末にだけ残ります。アップロード・ログイン・広告なし。戻し・A–Bループ・速度はすべて無料。",
    langLabel: "言語",
    chipNoLogin: "ログイン不要",
    chipNoUpload: "クラウドアップロードなし",
    chipFreeLoop: "戻し・ループ無料",
    chipPhone: "スマホ向け大きなボタン",
    chipShort: "1–4秒の短戻し",
    chipSaved: "設定はこの端末に保存",
    chipNoAds: "広告なし",
    chipLangs: "ko/en/ja/zh",
    fileTitle: "音声ファイル",
    pickFile: "ファイルを選ぶ",
    changeFile: "ファイルを変更",
    dropHint: "またはここに音声ファイルをドロップ",
    emptyTitle: "開いているファイルはありません",
    emptyBody: "この端末の音声ファイルを一つ選んでください。ポッドキャスト一話、教材の音源、録音。ここで再生され、端末の外には出ません。",
    iosNote: "iPhoneでは再読み込み後にファイルを選び直す必要がある場合があります。",
    badFile: "音声ファイルではないようです。MP3、M4A、WAV、OGG、FLACをお試しください。",
    loadError: "このブラウザではそのファイルを再生できませんでした。MP3やM4Aなど別の形式をお試しください。",
    currentFile: "開いているファイル: {name}",
    play: "再生",
    pause: "一時停止",
    rewindTitle: "短戻し",
    rewindHint: "ワンタップで少しだけ戻ります。聞き逃した一文を、位置を見失わずにもう一度。",
    rewindN: "{n}秒戻す",
    forwardN: "{n}秒進む",
    forwardTitle: "早送り",
    loopTitle: "A–Bループ",
    setA: "Aを設定",
    setB: "Bを設定",
    clearLoop: "ループ解除",
    loopOff: "ループなし。区間の始めでAを設定、終わりでBを設定を押します。",
    loopArmed: "A {a}。そのまま再生し、区間の終わりでBを設定を押してください。",
    loopOn: "{a} – {b} をループ中。Bに達するとAへ戻ります。",
    loopHint: "解除するまでループは続きます。地点はこのファイル名で保存されます。",
    speedTitle: "速度",
    speedHint: "遅くしても音の高さは変わらず、声が自然なままです。1×が通常速度。",
    resetSpeed: "1×に戻す",
    scrubLabel: "再生位置",
    notesTitle: "リスニングメモ",
    notesFor: "{name} のメモ",
    notesNoFile: "ファイルを開くと、そのファイルのメモを残せます。",
    notesPlaceholder: "聞こえたまま、新しい単語、確認したい表現…",
    notesHint: "このファイル名でこの端末に保存されます。同じファイルを開き直すとメモが戻ります。",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    importTitle: "このバックアップを読み込みますか？",
    importBody: "ファイル内の設定とメモがこの端末のものを置き換えます。音声はバックアップに含まれません。",
    importDone: "バックアップを読み込みました。",
    importBad: "リッスンパッドのバックアップとして読めないファイルです。",
    clearAll: "すべて削除",
    clearTitle: "すべて削除しますか？",
    clearBody: "この端末の設定、ループ地点、すべてのメモが消えます。音声ファイルには触れません。",
    cleared: "この端末の内容をすべて削除しました。",
    cancel: "キャンセル",
    docTitle: "知っておくこと",
    docIos: "iPhoneのSafariは訪問をまたいでファイルを開いたままにできません。再読み込み後にファイルを変更で同じファイルを選ぶと、そのファイル名のループ地点とメモが戻ります。",
    docMobile: "スマホのChromeとSafariで動きます。戻し・ループ・速度はすべて大きなボタンで、キーボードは不要です。",
    docNotLibrary: "一度に一つのファイルを掘り下げる練習用プレーヤーです。ライブラリ、プレイリスト、アルバムはありません。それは音楽プレーヤーの仕事です。",
    docFormats: "このブラウザが再生できる形式なら何でも。通常はMP3、M4A/AAC、WAV、OGG、FLAC。ファイルはその場で開かれ、アップロードされません。",
    docKeys: "キーボードがあれば、スペースで再生・一時停止、←・→で最後に押した秒数だけ戻し・早送り。",
    promiseTitle: "このアプリの約束",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "听力练习板",
    shortName: "听力练习板",
    tagline: "免费本地听力练习播放器。一键短回退、A–B 循环、变速。在本机选择文件。无需账号。无订阅。",
    metaDescription:
      "无需登录的免费本地听力练习播放器。在本机选一个音频文件，然后反复练：一键回退 1、2、3 或 4 秒重听刚错过的那句，A–B 循环重复同一段，0.5× 到 1.5× 变速，带时间标签的进度条。按文件名保存听力笔记，设置自动保存，JSON 备份，离线 PWA 外壳。为手机屏幕设计的大按钮。这是一次专注一个文件的练习播放器，不是音乐库。音频绝不上传。无需账号，无广告，无付费订阅。",
    localOnly: "音频和笔记仅留在此设备。无上传、无登录、无广告。回退、A–B 循环和变速全部免费。",
    langLabel: "语言",
    chipNoLogin: "无需登录",
    chipNoUpload: "无云端上传",
    chipFreeLoop: "回退与循环免费",
    chipPhone: "手机大按钮",
    chipShort: "1–4 秒短回退",
    chipSaved: "设置保存在本机",
    chipNoAds: "无广告",
    chipLangs: "ko/en/ja/zh",
    fileTitle: "音频文件",
    pickFile: "选择文件",
    changeFile: "更换文件",
    dropHint: "或把音频文件拖到这里",
    emptyTitle: "尚未打开文件",
    emptyBody: "在本机选一个音频文件：一集播客、教材音频、一段录音。它在这里播放，不会离开此设备。",
    iosNote: "在 iPhone 上，刷新后可能需要重新选择文件。",
    badFile: "这似乎不是音频文件。试试 MP3、M4A、WAV、OGG 或 FLAC。",
    loadError: "此浏览器无法播放该文件。试试 MP3 或 M4A 等其他格式。",
    currentFile: "已打开：{name}",
    play: "播放",
    pause: "暂停",
    rewindTitle: "短回退",
    rewindHint: "一键只退一点点，错过的那句再听一遍，也不会丢掉位置。",
    rewindN: "回退 {n} 秒",
    forwardN: "前进 {n} 秒",
    forwardTitle: "向前跳",
    loopTitle: "A–B 循环",
    setA: "设 A",
    setB: "设 B",
    clearLoop: "清除循环",
    loopOff: "未循环。在一段开头按“设 A”，在结尾按“设 B”。",
    loopArmed: "A 在 {a}。继续播放，到这段结尾时按“设 B”。",
    loopOn: "正在循环 {a} – {b}。到 B 就跳回 A。",
    loopHint: "循环会一直保持，直到你清除。点位按此文件名保存。",
    speedTitle: "速度",
    speedHint: "放慢也不改变音高，人声依然自然。1× 为正常速度。",
    resetSpeed: "恢复 1×",
    scrubLabel: "播放位置",
    notesTitle: "听力笔记",
    notesFor: "{name} 的笔记",
    notesNoFile: "打开文件后即可为它记笔记。",
    notesPlaceholder: "听到的内容、生词、要核对的表达……",
    notesHint: "按此文件名保存在本机。再次打开同一文件，笔记会回来。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    importTitle: "导入这个备份？",
    importBody: "文件里的设置和笔记会替换本机上的内容。备份不包含音频。",
    importDone: "备份已导入。",
    importBad: "无法把这个文件当作听力练习板备份读取。",
    clearAll: "全部删除",
    clearTitle: "全部删除？",
    clearBody: "本机上的设置、循环点位和所有笔记都会被删除。不会动你的音频文件。",
    cleared: "已删除本机上的全部内容。",
    cancel: "取消",
    docTitle: "须知",
    docIos: "iPhone 上的 Safari 无法在两次访问之间保持文件打开。刷新后按“更换文件”再选同一个文件，该文件名下的循环点位和笔记就会回来。",
    docMobile: "手机上的 Chrome 和 Safari 都能用。回退、循环、速度全是大按钮，不需要键盘。",
    docNotLibrary: "这是一次只钻一个文件的练习播放器。没有曲库、播放列表或专辑；那是音乐播放器的事。",
    docFormats: "此浏览器能播放的格式都可以：通常是 MP3、M4A/AAC、WAV、OGG 和 FLAC。文件就地打开，绝不上传。",
    docKeys: "有键盘时：空格播放/暂停，← 和 → 按你最后点过的秒数回退/前进。",
    promiseTitle: "这个应用的承诺",
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
