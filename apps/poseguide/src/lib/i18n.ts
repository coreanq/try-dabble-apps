/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "poseguide:lang";

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

/** BCP-47 tag handed to speechSynthesis for the Voice Coach. */
export const SPEECH_LANG: Record<Lang, string> = {
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
  | "library"
  | "libraryTitle"
  | "libraryHint"
  | "searchPlaceholder"
  | "noMatch"
  | "close"
  | "catAll"
  | "catSolo"
  | "catCouple"
  | "catTravel"
  | "catGrad"
  | "catCasual"
  | "catFormal"
  | "catAdaptive"
  | "genderAll"
  | "genderFemale"
  | "genderMale"
  | "tagFemale"
  | "tagMale"
  | "tagAny"
  | "tagSeated"
  | "diffEasy"
  | "diffMedium"
  | "diffHard"
  | "posesCount"
  | "currentPose"
  | "choosePose"
  | "allowCamera"
  | "retryCamera"
  | "stopCamera"
  | "cameraStarting"
  | "cameraIdleHint"
  | "cameraDeniedTitle"
  | "cameraDeniedBody"
  | "cameraErrorTitle"
  | "cameraErrorBody"
  | "cameraBlackTitle"
  | "cameraBlackBody"
  | "cameraUnsupported"
  | "flip"
  | "facingFront"
  | "facingRear"
  | "capture"
  | "captureBurst"
  | "captured"
  | "capturedBurst"
  | "saveHint"
  | "overlayOpacity"
  | "ghostLabel"
  | "matchLabel"
  | "matchOn"
  | "matchLoading"
  | "matchUnavailable"
  | "matchNoPerson"
  | "matchGreat"
  | "matchGood"
  | "matchAdjust"
  | "matchNeedsCamera"
  | "voiceCoach"
  | "voiceStep"
  | "voiceNext"
  | "voicePrev"
  | "voiceSpeak"
  | "voiceUnavailable"
  | "autoCapture"
  | "autoCaptureHint"
  | "autoCaptureArmed"
  | "autoCaptureNeedsMatch"
  | "composition"
  | "compOff"
  | "compThirds"
  | "compCenter"
  | "strangerMode"
  | "strangerHint"
  | "strangerExit"
  | "random"
  | "prev"
  | "next"
  | "handTip"
  | "tips"
  | "chipFreePoses"
  | "chipNoSub"
  | "chipAutoOff"
  | "chipCameraRetry"
  | "chipMaleFemale"
  | "chipLocal"
  | "chipLangs"
  | "recentCaptures"
  | "recentEmpty"
  | "streak"
  | "about"
  | "notIncluded"
  | "privacy"
  | "terms"
  | "guide";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "포즈가이드",
    shortName: "포즈가이드",
    tagline: "설치 없는 포즈 코치. 포즈 라이브러리, 실루엣 오버레이, 매치 점수, 음성 팁, 촬영. 전·후면. 핵심 포즈 무료. 계정 없음.",
    metaDescription:
      "설치 없는 포즈 코치. 포즈 라이브러리에서 고르면 카메라 위에 실루엣이 겹쳐지고, 매치 점수와 음성 팁이 자세를 잡아 줍니다. 전·후면 카메라, 촬영은 이 기기에만 저장. 핵심 포즈 전부 무료, 구독 없음, 계정 없음.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. 클라우드 AI·장면 인식 없음.",
    langLabel: "언어",
    library: "포즈 라이브러리",
    libraryTitle: "포즈 고르기",
    libraryHint: "모두 무료. 잠긴 포즈 없음.",
    searchPlaceholder: "포즈 검색 (예: 졸업, 앉기)",
    noMatch: "일치하는 포즈가 없습니다",
    close: "닫기",
    catAll: "전체",
    catSolo: "솔로",
    catCouple: "커플",
    catTravel: "여행",
    catGrad: "졸업",
    catCasual: "캐주얼",
    catFormal: "포멀",
    catAdaptive: "앉기·휠체어",
    genderAll: "모두",
    genderFemale: "여성",
    genderMale: "남성",
    tagFemale: "여성",
    tagMale: "남성",
    tagAny: "누구나",
    tagSeated: "앉기",
    diffEasy: "쉬움",
    diffMedium: "보통",
    diffHard: "어려움",
    posesCount: "{n}개 포즈 · 전부 무료",
    currentPose: "현재 포즈",
    choosePose: "포즈 고르기",
    allowCamera: "카메라 허용",
    retryCamera: "카메라 다시 시도",
    stopCamera: "카메라 끄기",
    cameraStarting: "카메라 여는 중…",
    cameraIdleHint: "카메라를 켜면 고른 포즈의 실루엣이 화면 위에 겹쳐집니다. 영상은 이 기기를 떠나지 않습니다.",
    cameraDeniedTitle: "카메라 권한이 거부되었습니다",
    cameraDeniedBody: "브라우저 설정 → 사이트 설정 → 카메라에서 이 사이트를 허용한 뒤 ‘카메라 다시 시도’를 누르세요. iOS는 설정 → Safari → 카메라.",
    cameraErrorTitle: "카메라를 열 수 없습니다",
    cameraErrorBody: "다른 앱이 카메라를 쓰고 있지 않은지 확인하고 다시 시도하세요. 전·후면 전환도 도움이 됩니다.",
    cameraBlackTitle: "화면이 검게 나옵니다",
    cameraBlackBody: "카메라가 열렸지만 영상이 비어 있습니다. 렌즈 덮개를 확인하고 ‘카메라 다시 시도’ 또는 전·후면 전환을 눌러 보세요.",
    cameraUnsupported: "이 브라우저는 카메라를 지원하지 않습니다. 최신 Safari 또는 Chrome에서 열어 주세요.",
    flip: "전·후면 전환",
    facingFront: "전면",
    facingRear: "후면",
    capture: "촬영",
    captureBurst: "촬영 (3연속)",
    captured: "사진을 이 기기에 저장했습니다",
    capturedBurst: "3장을 이 기기에 저장했습니다",
    saveHint: "촬영한 사진은 다운로드로 이 기기에만 저장됩니다.",
    overlayOpacity: "실루엣 투명도",
    ghostLabel: "실루엣",
    matchLabel: "포즈 매치",
    matchOn: "매치 켜기",
    matchLoading: "매치 준비 중…",
    matchUnavailable: "이 기기에서는 매치를 쓸 수 없습니다. 오버레이·음성·촬영은 그대로 됩니다.",
    matchNoPerson: "사람이 보이지 않습니다",
    matchGreat: "완벽해요",
    matchGood: "좋아요, 조금만 더",
    matchAdjust: "실루엣에 맞춰 보세요",
    matchNeedsCamera: "카메라를 켜면 점수가 나옵니다",
    voiceCoach: "음성 코치",
    voiceStep: "{n} / {total} 단계",
    voiceNext: "다음",
    voicePrev: "이전",
    voiceSpeak: "읽어 주기",
    voiceUnavailable: "이 브라우저는 음성 읽기를 지원하지 않습니다. 텍스트 팁은 그대로 보입니다.",
    autoCapture: "자동 촬영",
    autoCaptureHint: "기본 꺼짐. 켜면 매치 85% 이상이 2초 유지될 때 한 장 찍습니다.",
    autoCaptureArmed: "자동 촬영 대기 중",
    autoCaptureNeedsMatch: "자동 촬영은 매치가 켜져 있을 때만 동작합니다",
    composition: "구도 가이드",
    compOff: "끔",
    compThirds: "3분할",
    compCenter: "중앙",
    strangerMode: "낯선 사람 모드",
    strangerHint: "후면 카메라 · 큰 버튼 하나 · 3연속 촬영. 지나가는 분께 부탁할 때.",
    strangerExit: "모드 종료",
    random: "랜덤",
    prev: "이전 포즈",
    next: "다음 포즈",
    handTip: "손 위치",
    tips: "팁",
    chipFreePoses: "핵심 포즈 무료 (2개 아님)",
    chipNoSub: "구독 없음",
    chipAutoOff: "자동 촬영 기본 꺼짐",
    chipCameraRetry: "카메라 재시도 안내",
    chipMaleFemale: "남성·여성 포즈",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    recentCaptures: "최근 촬영 (이 기기)",
    recentEmpty: "아직 촬영이 없습니다",
    streak: "{n}일 연속",
    about:
      "라이브러리에서 포즈를 고르면 카메라 위에 실루엣이 겹쳐집니다. 실루엣에 몸을 맞추고, 원하면 매치 점수와 음성 팁을 켜세요. 촬영 버튼은 사진을 이 기기에 저장합니다.",
    notIncluded: "일부러 뺀 것: 클라우드 AI 코치, 장면 인식, 두 대 연동. 전부 이 기기 안에서만 동작합니다.",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Poseguide",
    shortName: "Poseguide",
    tagline: "Free no-install pose coach. Library, silhouette overlay, match score, voice tips, capture. Front & rear. Core poses free. No account.",
    metaDescription:
      "Free no-install pose coach. Pick a pose from the library, a silhouette floats over your camera, and a match score plus voice tips line you up. Front and rear camera, captures stay on this device. All core poses free, no subscription, no account.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers. No cloud AI or scene detection.",
    langLabel: "Language",
    library: "Pose library",
    libraryTitle: "Pick a pose",
    libraryHint: "All free. Nothing locked.",
    searchPlaceholder: "Search poses (e.g. grad, seated)",
    noMatch: "No pose matches",
    close: "Close",
    catAll: "All",
    catSolo: "Solo",
    catCouple: "Couple",
    catTravel: "Travel",
    catGrad: "Grad",
    catCasual: "Casual",
    catFormal: "Formal",
    catAdaptive: "Seated / wheelchair",
    genderAll: "Everyone",
    genderFemale: "Female",
    genderMale: "Male",
    tagFemale: "Female",
    tagMale: "Male",
    tagAny: "Anyone",
    tagSeated: "Seated",
    diffEasy: "Easy",
    diffMedium: "Medium",
    diffHard: "Hard",
    posesCount: "{n} poses · all free",
    currentPose: "Current pose",
    choosePose: "Choose pose",
    allowCamera: "Allow camera",
    retryCamera: "Retry camera",
    stopCamera: "Stop camera",
    cameraStarting: "Opening camera…",
    cameraIdleHint: "Turn the camera on and the chosen pose floats over the view as a silhouette. The video never leaves this device.",
    cameraDeniedTitle: "Camera permission was denied",
    cameraDeniedBody: "Open your browser settings → Site settings → Camera, allow this site, then tap “Retry camera”. On iOS: Settings → Safari → Camera.",
    cameraErrorTitle: "Could not open the camera",
    cameraErrorBody: "Make sure no other app is using the camera and try again. Flipping front / rear also helps.",
    cameraBlackTitle: "The preview is black",
    cameraBlackBody: "The camera opened but the frames are empty. Check the lens cover, then tap “Retry camera” or flip front / rear.",
    cameraUnsupported: "This browser cannot open a camera. Try a recent Safari or Chrome.",
    flip: "Flip camera",
    facingFront: "Front",
    facingRear: "Rear",
    capture: "Capture",
    captureBurst: "Capture (3 burst)",
    captured: "Photo saved to this device",
    capturedBurst: "3 photos saved to this device",
    saveHint: "Captures download to this device only.",
    overlayOpacity: "Silhouette opacity",
    ghostLabel: "Silhouette",
    matchLabel: "Pose Match",
    matchOn: "Match on",
    matchLoading: "Getting Match ready…",
    matchUnavailable: "Match unavailable on this device. Overlay, voice and capture still work.",
    matchNoPerson: "No person in view",
    matchGreat: "Nailed it",
    matchGood: "Close, a little more",
    matchAdjust: "Line up with the silhouette",
    matchNeedsCamera: "Turn the camera on to get a score",
    voiceCoach: "Voice Coach",
    voiceStep: "Step {n} of {total}",
    voiceNext: "Next",
    voicePrev: "Back",
    voiceSpeak: "Say it",
    voiceUnavailable: "This browser has no speech output. The text tips still show.",
    autoCapture: "Auto-capture",
    autoCaptureHint: "Off by default. When on, takes one photo after the match holds 85% for 2 seconds.",
    autoCaptureArmed: "Auto-capture armed",
    autoCaptureNeedsMatch: "Auto-capture only fires while Match is on",
    composition: "Composition guide",
    compOff: "Off",
    compThirds: "Thirds",
    compCenter: "Center",
    strangerMode: "Stranger Mode",
    strangerHint: "Rear camera, one big button, 3-shot burst. For handing your phone to a passer-by.",
    strangerExit: "Exit mode",
    random: "Random",
    prev: "Previous pose",
    next: "Next pose",
    handTip: "Hands",
    tips: "Tips",
    chipFreePoses: "Core poses free (not just 2)",
    chipNoSub: "No subscription",
    chipAutoOff: "Auto-capture off by default",
    chipCameraRetry: "Camera retry help",
    chipMaleFemale: "Male + female poses",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    recentCaptures: "Recent captures (this device)",
    recentEmpty: "No captures yet",
    streak: "{n}-day streak",
    about:
      "Pick a pose from the library and its silhouette floats over the camera. Line yourself up, and turn on Match for a live score or the Voice Coach for step-by-step tips. Capture saves the photo to this device.",
    notIncluded: "Left out on purpose: cloud AI coach, scene detection, two-phone sync. Everything runs on this device.",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "ポーズガイド",
    shortName: "ポーズガイド",
    tagline: "インストール不要のポーズコーチ。ライブラリ、シルエット重ね、マッチ得点、音声ヒント、撮影。前後カメラ。基本ポーズ無料。アカウント不要。",
    metaDescription:
      "インストール不要のポーズコーチ。ライブラリからポーズを選ぶとカメラにシルエットが重なり、マッチ得点と音声ヒントが姿勢を合わせてくれます。前後カメラ、撮影はこの端末にだけ保存。基本ポーズはすべて無料、サブスクなし、アカウント不要。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。クラウドAI・シーン認識なし。",
    langLabel: "言語",
    library: "ポーズライブラリ",
    libraryTitle: "ポーズを選ぶ",
    libraryHint: "すべて無料。ロックなし。",
    searchPlaceholder: "ポーズを検索（例: 卒業、座り）",
    noMatch: "一致するポーズがありません",
    close: "閉じる",
    catAll: "すべて",
    catSolo: "ソロ",
    catCouple: "カップル",
    catTravel: "旅行",
    catGrad: "卒業",
    catCasual: "カジュアル",
    catFormal: "フォーマル",
    catAdaptive: "座り・車いす",
    genderAll: "みんな",
    genderFemale: "女性",
    genderMale: "男性",
    tagFemale: "女性",
    tagMale: "男性",
    tagAny: "誰でも",
    tagSeated: "座り",
    diffEasy: "かんたん",
    diffMedium: "ふつう",
    diffHard: "むずかしい",
    posesCount: "{n}ポーズ · すべて無料",
    currentPose: "いまのポーズ",
    choosePose: "ポーズを選ぶ",
    allowCamera: "カメラを許可",
    retryCamera: "カメラを再試行",
    stopCamera: "カメラを止める",
    cameraStarting: "カメラを開いています…",
    cameraIdleHint: "カメラをオンにすると、選んだポーズのシルエットが画面に重なります。映像はこの端末から出ません。",
    cameraDeniedTitle: "カメラの許可が拒否されました",
    cameraDeniedBody: "ブラウザ設定 → サイトの設定 → カメラでこのサイトを許可してから「カメラを再試行」を押してください。iOSは 設定 → Safari → カメラ。",
    cameraErrorTitle: "カメラを開けません",
    cameraErrorBody: "ほかのアプリがカメラを使っていないか確認して、もう一度お試しください。前後の切り替えも有効です。",
    cameraBlackTitle: "プレビューが真っ黒です",
    cameraBlackBody: "カメラは開きましたが映像が空です。レンズカバーを確認し、「カメラを再試行」か前後の切り替えを押してください。",
    cameraUnsupported: "このブラウザはカメラを開けません。新しいSafariかChromeでお試しください。",
    flip: "前後を切り替え",
    facingFront: "前面",
    facingRear: "背面",
    capture: "撮影",
    captureBurst: "撮影（3連写）",
    captured: "写真をこの端末に保存しました",
    capturedBurst: "3枚をこの端末に保存しました",
    saveHint: "撮影した写真はダウンロードでこの端末にだけ保存されます。",
    overlayOpacity: "シルエットの透明度",
    ghostLabel: "シルエット",
    matchLabel: "ポーズマッチ",
    matchOn: "マッチをオン",
    matchLoading: "マッチを準備中…",
    matchUnavailable: "この端末ではマッチを使えません。重ね表示・音声・撮影はそのまま使えます。",
    matchNoPerson: "人が映っていません",
    matchGreat: "完璧",
    matchGood: "もう少し",
    matchAdjust: "シルエットに合わせて",
    matchNeedsCamera: "カメラをオンにすると得点が出ます",
    voiceCoach: "音声コーチ",
    voiceStep: "{total}のうち{n}",
    voiceNext: "次へ",
    voicePrev: "戻る",
    voiceSpeak: "読み上げ",
    voiceUnavailable: "このブラウザは読み上げに対応していません。テキストのヒントはそのまま表示されます。",
    autoCapture: "自動撮影",
    autoCaptureHint: "初期設定はオフ。オンにすると、マッチ85%以上が2秒続いたときに1枚撮ります。",
    autoCaptureArmed: "自動撮影 待機中",
    autoCaptureNeedsMatch: "自動撮影はマッチがオンのときだけ動きます",
    composition: "構図ガイド",
    compOff: "オフ",
    compThirds: "三分割",
    compCenter: "中央",
    strangerMode: "おまかせモード",
    strangerHint: "背面カメラ・大きなボタン1つ・3連写。通りがかりの人に頼むときに。",
    strangerExit: "モードを終了",
    random: "ランダム",
    prev: "前のポーズ",
    next: "次のポーズ",
    handTip: "手の位置",
    tips: "ヒント",
    chipFreePoses: "基本ポーズ無料（2つだけではない）",
    chipNoSub: "サブスクなし",
    chipAutoOff: "自動撮影は初期オフ",
    chipCameraRetry: "カメラ再試行の案内",
    chipMaleFemale: "男性・女性ポーズ",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    recentCaptures: "最近の撮影（この端末）",
    recentEmpty: "まだ撮影はありません",
    streak: "{n}日連続",
    about:
      "ライブラリでポーズを選ぶと、カメラにシルエットが重なります。体を合わせて、必要ならマッチ得点や音声コーチをオンに。撮影ボタンで写真をこの端末に保存します。",
    notIncluded: "あえて入れていないもの: クラウドAIコーチ、シーン認識、2台連携。すべてこの端末の中だけで動きます。",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "姿势指南",
    shortName: "姿势指南",
    tagline: "免安装姿势教练。姿势库、轮廓叠加、匹配分数、语音提示、拍照。前后摄像头。核心姿势免费。无需账号。",
    metaDescription:
      "免安装姿势教练。从姿势库里挑一个，轮廓就叠在取景画面上，匹配分数和语音提示帮你摆好。前后摄像头，拍下的照片只留在此设备。核心姿势全部免费，无订阅，无需账号。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。无云端 AI，无场景识别。",
    langLabel: "语言",
    library: "姿势库",
    libraryTitle: "选一个姿势",
    libraryHint: "全部免费，没有锁定。",
    searchPlaceholder: "搜索姿势（如：毕业、坐姿）",
    noMatch: "没有匹配的姿势",
    close: "关闭",
    catAll: "全部",
    catSolo: "单人",
    catCouple: "情侣",
    catTravel: "旅行",
    catGrad: "毕业",
    catCasual: "休闲",
    catFormal: "正式",
    catAdaptive: "坐姿 / 轮椅",
    genderAll: "所有人",
    genderFemale: "女性",
    genderMale: "男性",
    tagFemale: "女性",
    tagMale: "男性",
    tagAny: "任何人",
    tagSeated: "坐姿",
    diffEasy: "简单",
    diffMedium: "中等",
    diffHard: "困难",
    posesCount: "{n} 个姿势 · 全部免费",
    currentPose: "当前姿势",
    choosePose: "选择姿势",
    allowCamera: "允许摄像头",
    retryCamera: "重试摄像头",
    stopCamera: "关闭摄像头",
    cameraStarting: "正在打开摄像头…",
    cameraIdleHint: "打开摄像头后，所选姿势的轮廓会叠在画面上。视频不会离开此设备。",
    cameraDeniedTitle: "摄像头权限被拒绝",
    cameraDeniedBody: "打开浏览器设置 → 网站设置 → 摄像头，允许本站，然后点“重试摄像头”。iOS：设置 → Safari → 摄像头。",
    cameraErrorTitle: "无法打开摄像头",
    cameraErrorBody: "确认没有其他应用占用摄像头，然后重试。切换前后摄像头也有帮助。",
    cameraBlackTitle: "预览是黑的",
    cameraBlackBody: "摄像头已打开但画面为空。检查镜头盖，然后点“重试摄像头”或切换前后摄像头。",
    cameraUnsupported: "此浏览器无法打开摄像头。请用较新的 Safari 或 Chrome。",
    flip: "切换前后",
    facingFront: "前置",
    facingRear: "后置",
    capture: "拍照",
    captureBurst: "拍照（连拍 3 张）",
    captured: "照片已保存到此设备",
    capturedBurst: "3 张照片已保存到此设备",
    saveHint: "拍下的照片只会下载到此设备。",
    overlayOpacity: "轮廓透明度",
    ghostLabel: "轮廓",
    matchLabel: "姿势匹配",
    matchOn: "开启匹配",
    matchLoading: "正在准备匹配…",
    matchUnavailable: "此设备无法使用匹配。叠加、语音和拍照照常可用。",
    matchNoPerson: "画面里没有人",
    matchGreat: "完美",
    matchGood: "接近了，再调一点",
    matchAdjust: "对齐轮廓",
    matchNeedsCamera: "打开摄像头后才有分数",
    voiceCoach: "语音教练",
    voiceStep: "第 {n} 步，共 {total} 步",
    voiceNext: "下一步",
    voicePrev: "上一步",
    voiceSpeak: "朗读",
    voiceUnavailable: "此浏览器没有语音输出。文字提示照常显示。",
    autoCapture: "自动拍照",
    autoCaptureHint: "默认关闭。开启后，匹配达到 85% 并保持 2 秒时拍一张。",
    autoCaptureArmed: "自动拍照待命",
    autoCaptureNeedsMatch: "自动拍照仅在匹配开启时生效",
    composition: "构图辅助线",
    compOff: "关",
    compThirds: "三分线",
    compCenter: "居中",
    strangerMode: "路人模式",
    strangerHint: "后置摄像头、一个大按钮、连拍 3 张。把手机交给路人时用。",
    strangerExit: "退出模式",
    random: "随机",
    prev: "上一个姿势",
    next: "下一个姿势",
    handTip: "手的位置",
    tips: "提示",
    chipFreePoses: "核心姿势免费（不止 2 个）",
    chipNoSub: "无订阅",
    chipAutoOff: "自动拍照默认关闭",
    chipCameraRetry: "摄像头重试帮助",
    chipMaleFemale: "男性 + 女性姿势",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    recentCaptures: "最近拍摄（此设备）",
    recentEmpty: "还没有拍照",
    streak: "连续 {n} 天",
    about:
      "在姿势库里选一个姿势，轮廓就会叠在摄像头画面上。对齐轮廓，想要的话打开匹配看实时分数，或打开语音教练听分步提示。拍照会把照片保存到此设备。",
    notIncluded: "有意不做的：云端 AI 教练、场景识别、双机联动。一切都只在此设备上运行。",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
  },
};

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://poseguide.try-dabble.com/og-image-ko.png",
  en: "https://poseguide.try-dabble.com/og-image-en.png",
  ja: "https://poseguide.try-dabble.com/og-image-ja.png",
  zh: "https://poseguide.try-dabble.com/og-image-zh.png",
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
