/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "recpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://recpad.try-dabble.com/og-image-ko.png",
  en: "https://recpad.try-dabble.com/og-image-en.png",
  ja: "https://recpad.try-dabble.com/og-image-ja.png",
  zh: "https://recpad.try-dabble.com/og-image-zh.png",
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
  | "chipNoiseFree"
  | "chipExportFree"
  | "chipOnDevice"
  | "chipNoUpload"
  | "chipLangs"
  | "recordTitle"
  | "recordHint"
  | "record"
  | "stop"
  | "play"
  | "pause"
  | "recording"
  | "micNote"
  | "micDenied"
  | "micUnsupported"
  | "micBusy"
  | "demoBtn"
  | "demoLoaded"
  | "waveEmpty"
  | "waveHint"
  | "lengthLabel"
  | "selectionLabel"
  | "selectionNone"
  | "playheadLabel"
  | "editTitle"
  | "trim"
  | "cutSel"
  | "clearSel"
  | "undo"
  | "trimDone"
  | "cutDone"
  | "undoDone"
  | "noiseTitle"
  | "noiseHint"
  | "noiseStrength"
  | "noiseLight"
  | "noiseMedium"
  | "noiseStrong"
  | "noiseBtn"
  | "noiseBusy"
  | "noiseDone"
  | "gainTitle"
  | "gainLabel"
  | "gainApply"
  | "normalize"
  | "gainDone"
  | "normalizeDone"
  | "exportTitle"
  | "exportHint"
  | "downloadWav"
  | "downloadMp3"
  | "mp3Busy"
  | "exported"
  | "exportFailed"
  | "draftsTitle"
  | "draftsHint"
  | "draftNameLabel"
  | "draftNamePlaceholder"
  | "saveDraft"
  | "updateDraft"
  | "draftsEmpty"
  | "draftsUnsupported"
  | "open"
  | "rename"
  | "deleteDraft"
  | "draftSaved"
  | "draftOpened"
  | "draftDeleted"
  | "draftRenamed"
  | "draftFailed"
  | "deleteTitle"
  | "deleteBody"
  | "renameTitle"
  | "replaceTitle"
  | "replaceBody"
  | "replaceOk"
  | "save"
  | "cancel"
  | "privacy"
  | "terms"
  | "guide";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "렉패드",
    shortName: "렉패드",
    tagline: "무료 로컬 연습 녹음. 마이크 녹음, 노이즈 정리, 자르기, 게인, WAV·MP3 내보내기. 초안은 이 기기에만. 계정 없음. 업로드 없음.",
    metaDescription:
      "설치 없이 쓰는 무료 로컬 연습 녹음기. 마이크로 기타·연습 테이크를 녹음하고 파형을 보며 구간을 선택해 자르거나 삭제하고, 노이즈 정리와 게인·노멀라이즈를 적용하고, 되돌리기로 실수를 되돌립니다. WAV와 MP3로 내려받고, 초안은 이 기기에만 저장됩니다. 녹음·처리·내보내기 모두 이 기기에서만. 계정 없음, 업로드 없음, 광고 없음, 구독 없음.",
    localOnly: "이 앱의 녹음과 처리는 이 기기에서만 이루어지며 서버로 보내지 않습니다. 구독·광고 없음.",
    langLabel: "언어",
    chipNoAds: "중간 광고 없음",
    chipNoAccount: "계정 없음",
    chipNoiseFree: "노이즈 정리 무료",
    chipExportFree: "WAV/MP3 무료",
    chipOnDevice: "이 기기에서만",
    chipNoUpload: "업로드 없음",
    chipLangs: "ko/en/ja/zh",
    recordTitle: "새 녹음",
    recordHint: "녹음을 누르면 마이크 권한을 묻습니다. 브라우저의 음성용 노이즈 억제와 자동 게인은 꺼 두어 기타와 방 소리가 그대로 들어옵니다.",
    record: "녹음",
    stop: "정지",
    play: "재생",
    pause: "일시정지",
    recording: "녹음 중",
    micNote: "녹음, 노이즈 정리, 내보내기는 모두 이 브라우저 탭 안에서 실행됩니다. 소리는 어디로도 전송되지 않습니다.",
    micDenied: "마이크 권한이 거부되었습니다. 브라우저 주소창의 사이트 설정에서 마이크를 허용해 주세요.",
    micUnsupported: "이 브라우저는 마이크 녹음을 지원하지 않습니다. 최신 Chrome, Safari, Firefox를 써 주세요.",
    micBusy: "마이크를 열 수 없습니다. 다른 앱이 쓰고 있는지 확인해 주세요.",
    demoBtn: "예시 테이크 넣기",
    demoLoaded: "예시 테이크를 넣었습니다",
    waveEmpty: "아직 테이크가 없습니다. 녹음을 누르거나 예시 테이크를 넣어 보세요.",
    waveHint: "파형을 드래그하면 구간이 선택되고, 탭하면 재생 위치가 이동합니다. 가장자리를 끌어 구간을 조절하세요.",
    lengthLabel: "길이",
    selectionLabel: "선택 구간",
    selectionNone: "없음",
    playheadLabel: "위치",
    editTitle: "편집",
    trim: "선택 구간만 남기기",
    cutSel: "선택 구간 삭제",
    clearSel: "선택 해제",
    undo: "되돌리기",
    trimDone: "선택 구간만 남겼습니다",
    cutDone: "선택 구간을 삭제했습니다",
    undoDone: "되돌렸습니다",
    noiseTitle: "노이즈 정리",
    noiseHint: "가장 조용한 순간을 잡음 기준으로 삼아 그보다 낮은 소리를 줄입니다. 연주 앞뒤의 방 소리와 히스에 맞습니다. 이 기기에서만 계산합니다.",
    noiseStrength: "강도",
    noiseLight: "약하게",
    noiseMedium: "보통",
    noiseStrong: "강하게",
    noiseBtn: "노이즈 줄이기",
    noiseBusy: "이 기기에서 정리하는 중…",
    noiseDone: "노이즈를 줄였습니다",
    gainTitle: "게인·노멀라이즈",
    gainLabel: "게인 (dB)",
    gainApply: "게인 적용",
    normalize: "-1 dB로 노멀라이즈",
    gainDone: "게인을 적용했습니다",
    normalizeDone: "노멀라이즈했습니다",
    exportTitle: "내보내기",
    exportHint: "WAV와 MP3 모두 이 탭 안에서 만듭니다. 무료이며 계정이나 결제가 없습니다.",
    downloadWav: "WAV 내려받기",
    downloadMp3: "MP3 내려받기",
    mp3Busy: "이 기기에서 MP3로 변환하는 중…",
    exported: "내려받았습니다",
    exportFailed: "내보내지 못했습니다. 다시 시도해 주세요.",
    draftsTitle: "이 기기의 초안",
    draftsHint: "초안은 이 브라우저에만 저장되어 새로고침해도 남습니다. 계정이 없으니 로그인으로 지워질 일도 없습니다.",
    draftNameLabel: "초안 이름",
    draftNamePlaceholder: "예: 인트로 리프 2번째",
    saveDraft: "초안으로 저장",
    updateDraft: "초안 업데이트",
    draftsEmpty: "아직 초안이 없습니다.",
    draftsUnsupported: "이 브라우저에서는 초안을 저장할 수 없습니다. 내려받기는 그대로 됩니다.",
    open: "열기",
    rename: "이름 바꾸기",
    deleteDraft: "삭제",
    draftSaved: "초안을 저장했습니다",
    draftOpened: "초안을 열었습니다",
    draftDeleted: "초안을 삭제했습니다",
    draftRenamed: "이름을 바꿨습니다",
    draftFailed: "초안을 저장하지 못했습니다. 저장 공간을 확인해 주세요.",
    deleteTitle: "이 초안을 삭제할까요?",
    deleteBody: "이 기기에서 지웁니다. 되돌릴 수 없습니다.",
    renameTitle: "초안 이름 바꾸기",
    replaceTitle: "지금 테이크를 바꿀까요?",
    replaceBody: "저장하지 않은 편집은 사라집니다. 먼저 초안으로 저장하거나 내려받을 수 있습니다.",
    replaceOk: "바꾸기",
    save: "저장",
    cancel: "취소",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Recpad",
    shortName: "Recpad",
    tagline: "Free local practice recorder. Mic record, noise clean, trim, gain, export WAV or MP3. Drafts stay on this device. No account. No upload.",
    metaDescription:
      "Free local practice recorder with nothing to install. Record guitar or practice takes from the mic, see the waveform, select a region to trim or cut, clean noise, apply gain or normalize, and undo mistakes. Download as WAV or MP3 and keep drafts on this device. Recording, processing and export all happen on this device. No account, no upload, no ads, no subscription.",
    localOnly: "Your recordings stay on this device. Noise clean and export run here — nothing is sent to our servers. No subscription. No ads.",
    langLabel: "Language",
    chipNoAds: "No mid-use ads",
    chipNoAccount: "No account",
    chipNoiseFree: "Noise clean free",
    chipExportFree: "WAV/MP3 free",
    chipOnDevice: "On-device only",
    chipNoUpload: "No upload",
    chipLangs: "ko/en/ja/zh",
    recordTitle: "New recording",
    recordHint: "Record asks for mic permission. The browser's speech-style noise suppression and auto gain are switched off so a guitar and the room come through as they are.",
    record: "Record",
    stop: "Stop",
    play: "Play",
    pause: "Pause",
    recording: "Recording",
    micNote: "Recording, noise clean and export all run inside this browser tab. The sound is never sent anywhere.",
    micDenied: "Microphone access was denied. Allow the mic in the site settings next to the address bar.",
    micUnsupported: "This browser cannot record from the mic. Use a recent Chrome, Safari or Firefox.",
    micBusy: "Could not open the microphone. Check whether another app is using it.",
    demoBtn: "Load a demo take",
    demoLoaded: "Demo take loaded",
    waveEmpty: "No take yet. Press Record, or load the demo take.",
    waveHint: "Drag on the waveform to select a region; tap to move the playhead. Drag an edge to adjust the selection.",
    lengthLabel: "Length",
    selectionLabel: "Selection",
    selectionNone: "None",
    playheadLabel: "Position",
    editTitle: "Edit",
    trim: "Trim to selection",
    cutSel: "Cut selection",
    clearSel: "Clear selection",
    undo: "Undo",
    trimDone: "Trimmed to selection",
    cutDone: "Selection cut",
    undoDone: "Undone",
    noiseTitle: "Noise clean",
    noiseHint: "Uses the quietest moments as the noise profile and turns down everything below it. Made for room tone and hiss before and after you play. Computed on this device.",
    noiseStrength: "Strength",
    noiseLight: "Light",
    noiseMedium: "Medium",
    noiseStrong: "Strong",
    noiseBtn: "Noise reduce",
    noiseBusy: "Cleaning on this device…",
    noiseDone: "Noise reduced",
    gainTitle: "Gain and normalize",
    gainLabel: "Gain (dB)",
    gainApply: "Apply gain",
    normalize: "Normalize to -1 dB",
    gainDone: "Gain applied",
    normalizeDone: "Normalized",
    exportTitle: "Export",
    exportHint: "Both WAV and MP3 are made inside this tab. Free, with no account and no payment.",
    downloadWav: "Download WAV",
    downloadMp3: "Download MP3",
    mp3Busy: "Encoding MP3 on this device…",
    exported: "Downloaded",
    exportFailed: "Export failed. Please try again.",
    draftsTitle: "Drafts on this device",
    draftsHint: "Drafts are kept in this browser and survive a refresh. There is no account, so nothing can wipe them by signing you out.",
    draftNameLabel: "Draft name",
    draftNamePlaceholder: "e.g. intro riff, take 2",
    saveDraft: "Save as draft",
    updateDraft: "Update draft",
    draftsEmpty: "No drafts yet.",
    draftsUnsupported: "This browser cannot keep drafts. Downloads still work.",
    open: "Open",
    rename: "Rename",
    deleteDraft: "Delete",
    draftSaved: "Draft saved",
    draftOpened: "Draft opened",
    draftDeleted: "Draft deleted",
    draftRenamed: "Draft renamed",
    draftFailed: "Could not save the draft. Check the free space on this device.",
    deleteTitle: "Delete this draft?",
    deleteBody: "It is removed from this device. This cannot be undone.",
    renameTitle: "Rename draft",
    replaceTitle: "Replace the current take?",
    replaceBody: "Unsaved edits will be lost. You can save a draft or download first.",
    replaceOk: "Replace",
    save: "Save",
    cancel: "Cancel",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "レックパッド",
    shortName: "レックパッド",
    tagline: "無料のローカル練習レコーダー。マイク録音、ノイズ除去、トリム、ゲイン、WAV/MP3書き出し。下書きはこの端末だけ。アカウント不要。アップロードなし。",
    metaDescription:
      "インストール不要の無料ローカル練習レコーダー。マイクでギターや練習テイクを録音し、波形を見ながら範囲を選んでトリムやカット、ノイズ除去、ゲインやノーマライズを適用し、失敗は元に戻せます。WAVやMP3でダウンロードし、下書きはこの端末にだけ保存。録音・処理・書き出しはすべてこの端末だけ。アカウント不要、アップロードなし、広告なし、サブスクなし。",
    localOnly: "録音と処理はこの端末だけで、サーバーには送りません。サブスク・広告なし。",
    langLabel: "言語",
    chipNoAds: "途中の広告なし",
    chipNoAccount: "アカウント不要",
    chipNoiseFree: "ノイズ除去は無料",
    chipExportFree: "WAV/MP3は無料",
    chipOnDevice: "この端末だけ",
    chipNoUpload: "アップロードなし",
    chipLangs: "ko/en/ja/zh",
    recordTitle: "新しい録音",
    recordHint: "録音を押すとマイクの許可を求めます。ブラウザの音声向けノイズ抑制と自動ゲインは切ってあるので、ギターと部屋の音がそのまま入ります。",
    record: "録音",
    stop: "停止",
    play: "再生",
    pause: "一時停止",
    recording: "録音中",
    micNote: "録音、ノイズ除去、書き出しはすべてこのブラウザのタブの中で動きます。音はどこにも送られません。",
    micDenied: "マイクの使用が拒否されました。アドレスバー横のサイト設定でマイクを許可してください。",
    micUnsupported: "このブラウザはマイク録音に対応していません。新しいChrome、Safari、Firefoxをお使いください。",
    micBusy: "マイクを開けませんでした。ほかのアプリが使っていないか確認してください。",
    demoBtn: "デモテイクを入れる",
    demoLoaded: "デモテイクを入れました",
    waveEmpty: "まだテイクがありません。録音を押すか、デモテイクを入れてください。",
    waveHint: "波形をドラッグすると範囲を選択、タップで再生位置を移動。端をドラッグして範囲を調整します。",
    lengthLabel: "長さ",
    selectionLabel: "選択範囲",
    selectionNone: "なし",
    playheadLabel: "位置",
    editTitle: "編集",
    trim: "選択範囲だけ残す",
    cutSel: "選択範囲を削除",
    clearSel: "選択を解除",
    undo: "元に戻す",
    trimDone: "選択範囲だけ残しました",
    cutDone: "選択範囲を削除しました",
    undoDone: "元に戻しました",
    noiseTitle: "ノイズ除去",
    noiseHint: "いちばん静かな瞬間をノイズの基準にして、それより小さい音を下げます。演奏の前後の部屋の音やヒスに向いています。計算はこの端末だけ。",
    noiseStrength: "強さ",
    noiseLight: "弱め",
    noiseMedium: "ふつう",
    noiseStrong: "強め",
    noiseBtn: "ノイズを減らす",
    noiseBusy: "この端末で処理中…",
    noiseDone: "ノイズを減らしました",
    gainTitle: "ゲインとノーマライズ",
    gainLabel: "ゲイン (dB)",
    gainApply: "ゲインを適用",
    normalize: "-1 dBにノーマライズ",
    gainDone: "ゲインを適用しました",
    normalizeDone: "ノーマライズしました",
    exportTitle: "書き出し",
    exportHint: "WAVもMP3もこのタブの中で作ります。無料で、アカウントも支払いもありません。",
    downloadWav: "WAVをダウンロード",
    downloadMp3: "MP3をダウンロード",
    mp3Busy: "この端末でMP3に変換中…",
    exported: "ダウンロードしました",
    exportFailed: "書き出せませんでした。もう一度お試しください。",
    draftsTitle: "この端末の下書き",
    draftsHint: "下書きはこのブラウザにだけ保存され、再読み込みしても残ります。アカウントがないので、ログアウトで消えることもありません。",
    draftNameLabel: "下書き名",
    draftNamePlaceholder: "例: イントロのリフ テイク2",
    saveDraft: "下書きとして保存",
    updateDraft: "下書きを更新",
    draftsEmpty: "まだ下書きはありません。",
    draftsUnsupported: "このブラウザでは下書きを保存できません。ダウンロードはそのまま使えます。",
    open: "開く",
    rename: "名前を変更",
    deleteDraft: "削除",
    draftSaved: "下書きを保存しました",
    draftOpened: "下書きを開きました",
    draftDeleted: "下書きを削除しました",
    draftRenamed: "名前を変更しました",
    draftFailed: "下書きを保存できませんでした。端末の空き容量を確認してください。",
    deleteTitle: "この下書きを削除しますか？",
    deleteBody: "この端末から消えます。元に戻せません。",
    renameTitle: "下書きの名前を変更",
    replaceTitle: "今のテイクを置き換えますか？",
    replaceBody: "保存していない編集は失われます。先に下書きとして保存するかダウンロードできます。",
    replaceOk: "置き換える",
    save: "保存",
    cancel: "キャンセル",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "录音板",
    shortName: "录音板",
    tagline: "免费本地练习录音。麦克风录制、降噪、裁剪、增益，导出 WAV 或 MP3。草稿只留在本机。无需账号。不上传。",
    metaDescription:
      "免安装的免费本地练习录音机。用麦克风录下吉他或练习片段，看着波形选中区域裁剪或删除，做降噪、增益或标准化，出错可撤销。导出为 WAV 或 MP3，草稿只留在本机。录制、处理、导出都只在此设备完成。无需账号，不上传，无广告，无订阅。",
    localOnly: "录音与处理仅在此设备完成，不会上传到服务器。无订阅、无广告。",
    langLabel: "语言",
    chipNoAds: "无中途广告",
    chipNoAccount: "无需账号",
    chipNoiseFree: "降噪免费",
    chipExportFree: "WAV/MP3 免费",
    chipOnDevice: "仅在本机",
    chipNoUpload: "不上传",
    chipLangs: "ko/en/ja/zh",
    recordTitle: "新录音",
    recordHint: "按下录制会请求麦克风权限。浏览器针对语音的噪声抑制和自动增益已关闭，吉他和房间的声音会原样录入。",
    record: "录制",
    stop: "停止",
    play: "播放",
    pause: "暂停",
    recording: "录制中",
    micNote: "录制、降噪和导出都在这个浏览器标签页里完成。声音不会发往任何地方。",
    micDenied: "麦克风权限被拒绝。请在地址栏旁的网站设置里允许麦克风。",
    micUnsupported: "此浏览器不支持麦克风录音。请使用较新的 Chrome、Safari 或 Firefox。",
    micBusy: "无法打开麦克风。请检查是否有其他应用正在使用。",
    demoBtn: "载入示例片段",
    demoLoaded: "已载入示例片段",
    waveEmpty: "还没有片段。按下录制，或载入示例片段。",
    waveHint: "在波形上拖动可选中区域，点击可移动播放位置。拖动边缘可调整选区。",
    lengthLabel: "时长",
    selectionLabel: "选区",
    selectionNone: "无",
    playheadLabel: "位置",
    editTitle: "编辑",
    trim: "只保留选区",
    cutSel: "删除选区",
    clearSel: "取消选区",
    undo: "撤销",
    trimDone: "已只保留选区",
    cutDone: "已删除选区",
    undoDone: "已撤销",
    noiseTitle: "降噪",
    noiseHint: "以最安静的片刻作为噪声样本，压低比它更小的声音。适合演奏前后的房间底噪和嘶声。只在此设备上计算。",
    noiseStrength: "强度",
    noiseLight: "轻",
    noiseMedium: "中",
    noiseStrong: "强",
    noiseBtn: "降低噪声",
    noiseBusy: "正在本机处理…",
    noiseDone: "已降噪",
    gainTitle: "增益与标准化",
    gainLabel: "增益 (dB)",
    gainApply: "应用增益",
    normalize: "标准化到 -1 dB",
    gainDone: "已应用增益",
    normalizeDone: "已标准化",
    exportTitle: "导出",
    exportHint: "WAV 和 MP3 都在这个标签页里生成。免费，无需账号，不用付费。",
    downloadWav: "下载 WAV",
    downloadMp3: "下载 MP3",
    mp3Busy: "正在本机编码 MP3…",
    exported: "已下载",
    exportFailed: "导出失败，请重试。",
    draftsTitle: "本机草稿",
    draftsHint: "草稿只保存在此浏览器里，刷新后仍在。没有账号，也就不会因为退出登录而被清空。",
    draftNameLabel: "草稿名称",
    draftNamePlaceholder: "例如：前奏 riff 第 2 遍",
    saveDraft: "保存为草稿",
    updateDraft: "更新草稿",
    draftsEmpty: "还没有草稿。",
    draftsUnsupported: "此浏览器无法保存草稿。下载功能不受影响。",
    open: "打开",
    rename: "重命名",
    deleteDraft: "删除",
    draftSaved: "草稿已保存",
    draftOpened: "已打开草稿",
    draftDeleted: "草稿已删除",
    draftRenamed: "已重命名",
    draftFailed: "无法保存草稿。请检查本机剩余空间。",
    deleteTitle: "删除这个草稿？",
    deleteBody: "将从此设备移除，无法撤销。",
    renameTitle: "重命名草稿",
    replaceTitle: "替换当前片段？",
    replaceBody: "未保存的编辑会丢失。可以先保存为草稿或下载。",
    replaceOk: "替换",
    save: "保存",
    cancel: "取消",
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
