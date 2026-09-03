/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline, description and local-only notice for the FIRST
 * HTML, so the two must stay in step: the mounted app has to say exactly what
 * a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "slowroll:lang";

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

export const DATE_LOCALE: Record<Lang, string> = {
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
  | "about"
  | "chipNoLogin"
  | "chipNoUpload"
  | "chipNoPreview"
  | "chipRealLock"
  | "chipPersist"
  | "chipAllAtOnce"
  | "chipSaveDevice"
  | "chipFrameCount"
  | "chipNoAds"
  | "cameraTitle"
  | "counterLabel"
  | "framesLeft"
  | "frameOf"
  | "loadTitle"
  | "modeQuestion"
  | "modeFull"
  | "modeFullHint"
  | "modeFirst"
  | "modeFirstHint"
  | "modeDefault"
  | "loadBtn"
  | "framesPerRoll"
  | "modeTagFull"
  | "modeTagFirst"
  | "noRoll"
  | "rollLoaded"
  | "shutter"
  | "shutterHint"
  | "shotCommitted"
  | "rollFull"
  | "timerStarted"
  | "camStarting"
  | "camError"
  | "camRetry"
  | "camFallback"
  | "camFallbackHint"
  | "filesAdded"
  | "filesSkipped"
  | "notImage"
  | "storeFail"
  | "finishRoll"
  | "finishTitle"
  | "finishBody"
  | "finishBtn"
  | "needOneFrame"
  | "discardRoll"
  | "discardTitle"
  | "discardBody"
  | "discardBtn"
  | "toastDiscarded"
  | "darkroomTitle"
  | "sealedWith"
  | "developsIn"
  | "opensAt"
  | "days"
  | "hours"
  | "minutes"
  | "seconds"
  | "stillShooting"
  | "developing"
  | "developEarly"
  | "developEarlyTitle"
  | "developEarlyBody"
  | "developEarlyBtn"
  | "toastDevelopedEarly"
  | "developedTitle"
  | "developedOn"
  | "shotOn"
  | "frameNo"
  | "download"
  | "downloadAll"
  | "downloading"
  | "downloadedAll"
  | "downloadedOne"
  | "newRoll"
  | "loadNewRoll"
  | "backToCamera"
  | "shelfTitle"
  | "shelfShooting"
  | "shelfLocked"
  | "shelfDeveloped"
  | "shelfEmpty"
  | "open"
  | "cancel"
  | "close"
  | "privacy"
  | "terms";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "슬로우롤",
    shortName: "슬로우롤",
    tagline: "롤을 채우고 3일 기다리면 한 번에 현상됩니다. 미리보기는 없습니다.",
    metaDescription:
      "웹에서 쓰는 일회용 필름 카메라. 24장짜리 롤을 찍고, 찍은 사진은 볼 수 없고, 3일(72시간)이 지나야 롤 전체가 한 번에 현상됩니다. 로그인 없음, 업로드 없음, 사진은 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    about:
      "일회용 필름 카메라처럼 씁니다. 셔터를 누르면 그 프레임은 롤에 들어가고, 현상되기 전까지는 누구도 볼 수 없습니다. 한 장씩 지우거나 다시 찍을 수 없습니다. 3일이 지나면 롤 전체가 한 번에 나타납니다.",
    chipNoLogin: "로그인 없음",
    chipNoUpload: "업로드 없음",
    chipNoPreview: "촬영 중 미리보기 절대 없음",
    chipRealLock: "3일 카운트다운이 실제로 잠금",
    chipPersist: "탭 닫고 다시 열어도 타이머/롤 유지",
    chipAllAtOnce: "현상되면 롤 전체가 한 번에",
    chipSaveDevice: "사진 기기로 저장",
    chipFrameCount: "프레임 수 표시",
    chipNoAds: "광고/캡 없음",
    cameraTitle: "카메라",
    counterLabel: "남은 프레임",
    framesLeft: "{n}장 남음",
    frameOf: "{i} / {n}",
    loadTitle: "새 롤 넣기",
    modeQuestion: "이 롤은 언제 현상할까요?",
    modeFull: "롤을 다 채우면 현상",
    modeFullHint: "마지막 프레임을 찍는 순간부터 72시간을 기다립니다.",
    modeFirst: "첫 컷 찍고 3일 뒤 현상",
    modeFirstHint: "첫 프레임을 찍는 순간부터 72시간이 갑니다. 그동안 롤이 찰 때까지, 또는 직접 마감할 때까지 계속 찍을 수 있습니다.",
    modeDefault: "기본",
    loadBtn: "롤 넣기",
    framesPerRoll: "{n}장 롤",
    modeTagFull: "다 채우면 현상",
    modeTagFirst: "첫 컷 후 3일",
    noRoll: "롤이 없습니다",
    rollLoaded: "롤 장착됨",
    shutter: "촬영",
    shutterHint: "누르면 찍힙니다. 찍은 뒤에는 보이지 않습니다.",
    shotCommitted: "{i}번 프레임이 롤에 들어갔습니다. {n}장 남음.",
    rollFull: "롤이 다 찼습니다. 암실로 들어갑니다.",
    timerStarted: "첫 컷. 72시간 타이머가 시작됐습니다.",
    camStarting: "카메라를 켜는 중…",
    camError: "카메라를 쓸 수 없거나 권한이 거부되었습니다.",
    camRetry: "다시 시도",
    camFallback: "이 기기의 사진 넣기",
    camFallbackHint: "넣은 사진도 바로 롤로 들어갑니다. 마찬가지로 미리보기는 없습니다.",
    filesAdded: "사진 {n}장이 롤에 들어갔습니다. {left}장 남음.",
    filesSkipped: "롤에 자리가 없어 {n}장은 넣지 못했습니다.",
    notImage: "이미지 파일이 아닙니다.",
    storeFail: "이 브라우저에는 사진을 남길 수 없습니다. 이 프레임은 저장되지 않았습니다.",
    finishRoll: "지금 롤 마감",
    finishTitle: "지금 롤을 마감할까요?",
    finishBody: "남은 {n}장은 포기합니다. 롤은 암실로 들어가고 실제 72시간 대기가 시작됩니다. 아무것도 미리 보이지 않습니다.",
    finishBtn: "롤 마감",
    needOneFrame: "먼저 한 장 이상 찍어야 합니다.",
    discardRoll: "롤 전체 버리기",
    discardTitle: "롤 전체를 버릴까요?",
    discardBody: "이 롤의 모든 프레임({n}장)이 영구히 삭제됩니다. 한 장씩은 지울 수 없고, 롤 전체만 버릴 수 있습니다.",
    discardBtn: "{n}장 모두 버리기",
    toastDiscarded: "롤을 버렸습니다.",
    darkroomTitle: "암실",
    sealedWith: "{n}장 봉인됨",
    developsIn: "현상까지",
    opensAt: "{date}에 열립니다",
    days: "일",
    hours: "시간",
    minutes: "분",
    seconds: "초",
    stillShooting: "타이머가 도는 동안에도 계속 찍을 수 있습니다.",
    developing: "롤 전체를 현상하는 중…",
    developEarly: "미리 현상",
    developEarlyTitle: "기다리지 않고 현상할까요?",
    developEarlyBody: "남은 카운트다운을 건너뛰고 지금 바로 현상합니다. 기다리는 것이 이 앱의 핵심입니다. 꼭 필요할 때만 쓰세요.",
    developEarlyBtn: "그래도 지금 현상",
    toastDevelopedEarly: "미리 현상했습니다.",
    developedTitle: "현상 완료",
    developedOn: "{date} 현상",
    shotOn: "{date} 촬영",
    frameNo: "#{n}",
    download: "저장",
    downloadAll: "전부 저장 ({n})",
    downloading: "{i} / {n} 저장 중…",
    downloadedAll: "{n}장을 기기에 저장했습니다.",
    downloadedOne: "저장했습니다.",
    newRoll: "새 롤",
    loadNewRoll: "새 롤 넣기",
    backToCamera: "카메라로",
    shelfTitle: "롤 선반",
    shelfShooting: "카메라 안 · {n} / {cap}",
    shelfLocked: "봉인됨 · {n}장",
    shelfDeveloped: "현상됨 · {n}장",
    shelfEmpty: "아직 롤이 없습니다.",
    open: "열기",
    cancel: "취소",
    close: "닫기",
    privacy: "개인정보",
    terms: "이용약관",
  },
  en: {
    title: "Slowroll",
    shortName: "Slowroll",
    tagline: "Fill the roll, wait three days, and it all develops at once. No preview.",
    metaDescription:
      "A disposable film camera on the web. Shoot a 24-frame roll, never see a shot, and the whole roll develops at once after a real 3-day (72-hour) wait. No login, no upload, photos stay on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    about:
      "It works like a disposable film camera. Press the shutter and that frame goes into the roll where nobody can see it until it develops. No deleting or retaking a single frame. After three days the whole roll appears at once.",
    chipNoLogin: "No login",
    chipNoUpload: "No upload",
    chipNoPreview: "Never a preview while shooting",
    chipRealLock: "The 3-day countdown really locks",
    chipPersist: "Timer and roll survive closing the tab",
    chipAllAtOnce: "When it develops, the whole roll at once",
    chipSaveDevice: "Photos saved to your device",
    chipFrameCount: "Frame count shown",
    chipNoAds: "No ads, no cap",
    cameraTitle: "Camera",
    counterLabel: "Frames left",
    framesLeft: "{n} left",
    frameOf: "{i} / {n}",
    loadTitle: "Load a roll",
    modeQuestion: "When should this roll develop?",
    modeFull: "Develop when the roll is full",
    modeFullHint: "The 72-hour wait starts the moment the last frame is shot.",
    modeFirst: "Develop 3 days after the first shot",
    modeFirstHint: "The 72-hour wait starts at the first shot. You can keep shooting until the roll is full or you finish it.",
    modeDefault: "Default",
    loadBtn: "Load roll",
    framesPerRoll: "{n}-frame roll",
    modeTagFull: "Develops when full",
    modeTagFirst: "3 days after the first shot",
    noRoll: "No roll loaded",
    rollLoaded: "Roll loaded",
    shutter: "Shoot",
    shutterHint: "Tap to shoot. Nothing is shown after the shutter.",
    shotCommitted: "Frame {i} is in the roll. {n} left.",
    rollFull: "Roll full. Into the darkroom.",
    timerStarted: "First shot. The 72-hour timer is running.",
    camStarting: "Starting the camera…",
    camError: "The camera is not available or permission was denied.",
    camRetry: "Try again",
    camFallback: "Add a photo from this device",
    camFallbackHint: "Added photos go straight into the roll. They are not previewed either.",
    filesAdded: "{n} photo(s) went into the roll. {left} left.",
    filesSkipped: "{n} photo(s) did not fit in the roll.",
    notImage: "That was not an image file.",
    storeFail: "This browser cannot keep photos. That frame was not saved.",
    finishRoll: "Finish roll now",
    finishTitle: "Finish this roll now?",
    finishBody: "The remaining {n} frames are given up. The roll goes into the darkroom and the real 72-hour wait begins. Nothing is revealed early.",
    finishBtn: "Finish roll",
    needOneFrame: "Shoot at least one frame first.",
    discardRoll: "Discard the whole roll",
    discardTitle: "Throw away the whole roll?",
    discardBody: "Every frame in this roll ({n} so far) is deleted for good. Single frames cannot be deleted, only the whole roll.",
    discardBtn: "Discard all {n} frames",
    toastDiscarded: "Roll discarded.",
    darkroomTitle: "Darkroom",
    sealedWith: "{n} frames sealed",
    developsIn: "Develops in",
    opensAt: "Opens {date}",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
    stillShooting: "You can keep shooting while the timer runs.",
    developing: "Developing the whole roll…",
    developEarly: "Develop early",
    developEarlyTitle: "Skip the wait?",
    developEarlyBody: "This develops the roll right now and skips the rest of the countdown. Waiting is the whole point of this app. Only do it if you must.",
    developEarlyBtn: "Develop now anyway",
    toastDevelopedEarly: "Developed early.",
    developedTitle: "Developed",
    developedOn: "Developed {date}",
    shotOn: "Shot {date}",
    frameNo: "#{n}",
    download: "Download",
    downloadAll: "Download all ({n})",
    downloading: "Saving {i} of {n}…",
    downloadedAll: "Saved {n} photos to this device.",
    downloadedOne: "Saved.",
    newRoll: "New roll",
    loadNewRoll: "Load a new roll",
    backToCamera: "Back to the camera",
    shelfTitle: "Roll shelf",
    shelfShooting: "In the camera · {n} of {cap}",
    shelfLocked: "Sealed · {n} frames",
    shelfDeveloped: "Developed · {n} frames",
    shelfEmpty: "No rolls yet.",
    open: "Open",
    cancel: "Cancel",
    close: "Close",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "スローロール",
    shortName: "スローロール",
    tagline: "ロールを撮り切って3日待つと、まとめて現像。プレビューはありません。",
    metaDescription:
      "ウェブで使う使い捨てフィルムカメラ。24枚のロールを撮り、撮った写真は見られず、3日（72時間）待つとロール全体が一度に現像されます。ログインなし、アップロードなし、写真はこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    about:
      "使い捨てフィルムカメラのように使います。シャッターを押すとそのコマはロールに入り、現像されるまで誰にも見えません。1枚ずつ消したり撮り直したりはできません。3日たつとロール全体が一度に現れます。",
    chipNoLogin: "ログインなし",
    chipNoUpload: "アップロードなし",
    chipNoPreview: "撮影中のプレビューは一切なし",
    chipRealLock: "3日のカウントダウンは本当にロック",
    chipPersist: "タブを閉じてもタイマーとロールは保持",
    chipAllAtOnce: "現像されればロール全体を一度に",
    chipSaveDevice: "写真は端末に保存",
    chipFrameCount: "残り枚数を表示",
    chipNoAds: "広告・上限なし",
    cameraTitle: "カメラ",
    counterLabel: "残りコマ",
    framesLeft: "残り{n}枚",
    frameOf: "{i} / {n}",
    loadTitle: "ロールを入れる",
    modeQuestion: "このロールはいつ現像しますか？",
    modeFull: "ロールを撮り切ったら現像",
    modeFullHint: "最後のコマを撮った瞬間から72時間待ちます。",
    modeFirst: "最初の1枚から3日後に現像",
    modeFirstHint: "最初のコマを撮った瞬間から72時間が進みます。その間はロールが埋まるか自分で締めるまで撮り続けられます。",
    modeDefault: "初期値",
    loadBtn: "ロールを入れる",
    framesPerRoll: "{n}枚ロール",
    modeTagFull: "撮り切ったら現像",
    modeTagFirst: "最初の1枚から3日",
    noRoll: "ロールがありません",
    rollLoaded: "ロール装填済み",
    shutter: "撮る",
    shutterHint: "押すと撮れます。撮ったあとは見えません。",
    shotCommitted: "{i}コマ目がロールに入りました。残り{n}枚。",
    rollFull: "ロールが埋まりました。暗室へ。",
    timerStarted: "最初の1枚。72時間タイマーが動き出しました。",
    camStarting: "カメラを起動中…",
    camError: "カメラが使えないか、許可されませんでした。",
    camRetry: "もう一度",
    camFallback: "この端末の写真を入れる",
    camFallbackHint: "入れた写真もそのままロールに入ります。同じくプレビューはありません。",
    filesAdded: "写真{n}枚がロールに入りました。残り{left}枚。",
    filesSkipped: "ロールに空きがなく{n}枚は入りませんでした。",
    notImage: "画像ファイルではありません。",
    storeFail: "このブラウザでは写真を残せません。このコマは保存されませんでした。",
    finishRoll: "今すぐロールを締める",
    finishTitle: "今このロールを締めますか？",
    finishBody: "残り{n}枚はあきらめます。ロールは暗室に入り、本当の72時間の待ち時間が始まります。何も先に見えません。",
    finishBtn: "ロールを締める",
    needOneFrame: "先に1枚以上撮ってください。",
    discardRoll: "ロールごと捨てる",
    discardTitle: "ロール全体を捨てますか？",
    discardBody: "このロールのすべてのコマ（今のところ{n}枚）が完全に消えます。1枚ずつは消せず、ロール全体だけ捨てられます。",
    discardBtn: "{n}枚すべて捨てる",
    toastDiscarded: "ロールを捨てました。",
    darkroomTitle: "暗室",
    sealedWith: "{n}枚を封印中",
    developsIn: "現像まで",
    opensAt: "{date}に開きます",
    days: "日",
    hours: "時間",
    minutes: "分",
    seconds: "秒",
    stillShooting: "タイマーが進む間も撮り続けられます。",
    developing: "ロール全体を現像中…",
    developEarly: "早めに現像",
    developEarlyTitle: "待たずに現像しますか？",
    developEarlyBody: "残りのカウントダウンを飛ばして今すぐ現像します。待つことがこのアプリの肝です。どうしても必要なときだけにしてください。",
    developEarlyBtn: "それでも今現像する",
    toastDevelopedEarly: "早めに現像しました。",
    developedTitle: "現像済み",
    developedOn: "{date} 現像",
    shotOn: "{date} 撮影",
    frameNo: "#{n}",
    download: "保存",
    downloadAll: "すべて保存（{n}）",
    downloading: "{i} / {n} を保存中…",
    downloadedAll: "{n}枚を端末に保存しました。",
    downloadedOne: "保存しました。",
    newRoll: "新しいロール",
    loadNewRoll: "新しいロールを入れる",
    backToCamera: "カメラへ戻る",
    shelfTitle: "ロール棚",
    shelfShooting: "カメラ内 · {n} / {cap}",
    shelfLocked: "封印中 · {n}枚",
    shelfDeveloped: "現像済み · {n}枚",
    shelfEmpty: "まだロールがありません。",
    open: "開く",
    cancel: "キャンセル",
    close: "閉じる",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    title: "慢卷",
    shortName: "慢卷",
    tagline: "拍满一卷，等三天，一次性冲洗完成。没有预览。",
    metaDescription:
      "网页版一次性胶片相机。拍一卷 24 张，拍完看不到，等真正的 3 天（72 小时）后整卷一次冲洗出来。无需登录，不上传，照片只留在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    about:
      "用法和一次性胶片相机一样。按下快门，这一张就进入胶卷，冲洗前谁也看不到。不能单张删除或重拍。三天后整卷一次出现。",
    chipNoLogin: "无需登录",
    chipNoUpload: "不上传",
    chipNoPreview: "拍摄中绝不预览",
    chipRealLock: "3天倒计时真正锁定",
    chipPersist: "关闭标签页后计时和胶卷仍保留",
    chipAllAtOnce: "冲洗时整卷一次显示",
    chipSaveDevice: "照片保存到设备",
    chipFrameCount: "显示剩余张数",
    chipNoAds: "无广告无上限",
    cameraTitle: "相机",
    counterLabel: "剩余张数",
    framesLeft: "剩 {n} 张",
    frameOf: "{i} / {n}",
    loadTitle: "装入胶卷",
    modeQuestion: "这卷什么时候冲洗？",
    modeFull: "拍满后冲洗",
    modeFullHint: "从拍下最后一张的那一刻起等 72 小时。",
    modeFirst: "第一张之后 3 天冲洗",
    modeFirstHint: "从拍下第一张起开始计 72 小时。期间可以继续拍，直到拍满或你手动收卷。",
    modeDefault: "默认",
    loadBtn: "装入胶卷",
    framesPerRoll: "{n} 张一卷",
    modeTagFull: "拍满后冲洗",
    modeTagFirst: "第一张后 3 天",
    noRoll: "未装胶卷",
    rollLoaded: "胶卷已装入",
    shutter: "拍摄",
    shutterHint: "按下即拍。拍完不会显示。",
    shotCommitted: "第 {i} 张已进入胶卷。剩 {n} 张。",
    rollFull: "胶卷拍满，进入暗房。",
    timerStarted: "第一张。72 小时计时已开始。",
    camStarting: "正在打开相机…",
    camError: "相机不可用或权限被拒绝。",
    camRetry: "重试",
    camFallback: "从此设备添加照片",
    camFallbackHint: "添加的照片同样直接进入胶卷，也不会预览。",
    filesAdded: "{n} 张照片已进入胶卷。剩 {left} 张。",
    filesSkipped: "胶卷已无空位，{n} 张未放入。",
    notImage: "这不是图片文件。",
    storeFail: "此浏览器无法保存照片，这一张未能保存。",
    finishRoll: "立即收卷",
    finishTitle: "现在收卷？",
    finishBody: "放弃剩余的 {n} 张。胶卷进入暗房，真正的 72 小时等待开始。不会提前显示任何内容。",
    finishBtn: "收卷",
    needOneFrame: "请先至少拍一张。",
    discardRoll: "丢弃整卷",
    discardTitle: "丢弃整卷胶卷？",
    discardBody: "这卷里的每一张（目前 {n} 张）都会被永久删除。不能单张删除，只能丢弃整卷。",
    discardBtn: "丢弃全部 {n} 张",
    toastDiscarded: "已丢弃胶卷。",
    darkroomTitle: "暗房",
    sealedWith: "已封存 {n} 张",
    developsIn: "距冲洗还有",
    opensAt: "{date} 开启",
    days: "天",
    hours: "小时",
    minutes: "分",
    seconds: "秒",
    stillShooting: "计时期间仍可继续拍摄。",
    developing: "正在冲洗整卷…",
    developEarly: "提前冲洗",
    developEarlyTitle: "跳过等待？",
    developEarlyBody: "这会立刻冲洗胶卷并跳过剩余倒计时。等待正是这个应用的意义。只在万不得已时使用。",
    developEarlyBtn: "仍然现在冲洗",
    toastDevelopedEarly: "已提前冲洗。",
    developedTitle: "已冲洗",
    developedOn: "{date} 冲洗",
    shotOn: "{date} 拍摄",
    frameNo: "#{n}",
    download: "保存",
    downloadAll: "全部保存（{n}）",
    downloading: "正在保存 {i} / {n}…",
    downloadedAll: "已把 {n} 张保存到此设备。",
    downloadedOne: "已保存。",
    newRoll: "新胶卷",
    loadNewRoll: "装入新胶卷",
    backToCamera: "回到相机",
    shelfTitle: "胶卷架",
    shelfShooting: "相机中 · {n} / {cap}",
    shelfLocked: "已封存 · {n} 张",
    shelfDeveloped: "已冲洗 · {n} 张",
    shelfEmpty: "还没有胶卷。",
    open: "打开",
    cancel: "取消",
    close: "关闭",
    privacy: "隐私",
    terms: "条款",
  },
};

/** The fail-fix chip row, in order. */
export const CHIP_KEYS: MsgKey[] = [
  "chipNoLogin",
  "chipNoUpload",
  "chipNoPreview",
  "chipRealLock",
  "chipPersist",
  "chipAllAtOnce",
  "chipSaveDevice",
  "chipFrameCount",
  "chipNoAds",
];

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://slowroll.try-dabble.com/og-image-ko.png",
  en: "https://slowroll.try-dabble.com/og-image-en.png",
  ja: "https://slowroll.try-dabble.com/og-image-ja.png",
  zh: "https://slowroll.try-dabble.com/og-image-zh.png",
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
