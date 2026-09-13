/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "scrubpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://scrubpad.try-dabble.com/og-image-ko.png",
  en: "https://scrubpad.try-dabble.com/og-image-en.png",
  ja: "https://scrubpad.try-dabble.com/og-image-ja.png",
  zh: "https://scrubpad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoSub"
  | "chipPasteFirst"
  | "chipOnDevice"
  | "chipNoUpload"
  | "chipNoAds"
  | "chipNoAccount"
  | "chipLangs"
  | "pasteLabel"
  | "pastePlaceholder"
  | "scrubBtn"
  | "sampleBtn"
  | "clearTextBtn"
  | "onDeviceNote"
  | "reviewTitle"
  | "reviewHint"
  | "reviewEmpty"
  | "reviewNone"
  | "foundCount"
  | "occurrences"
  | "checkAll"
  | "uncheckAll"
  | "typeEMAIL"
  | "typePHONE"
  | "typeCARD"
  | "typeIP"
  | "typeKEY"
  | "typeADDRESS"
  | "typeNAME"
  | "typeWORD"
  | "customTitle"
  | "customHint"
  | "customPlaceholder"
  | "addWord"
  | "removeWord"
  | "dictEmpty"
  | "dictExport"
  | "dictImport"
  | "dictImported"
  | "dictImportBad"
  | "dictExported"
  | "compareTitle"
  | "originalPane"
  | "scrubbedPane"
  | "scrubbedEmpty"
  | "copyScrubbed"
  | "copied"
  | "copyFailed"
  | "downloadScrubbed"
  | "downloaded"
  | "restoreTitle"
  | "restoreWarn"
  | "restoreShow"
  | "restoreHide"
  | "restoreCopy"
  | "restoreDownload"
  | "restoreEmpty"
  | "settingsTitle"
  | "keepLastOn"
  | "keepLastOff"
  | "keepLastHint"
  | "clearAll"
  | "clearAllTitle"
  | "clearAllBody"
  | "cleared"
  | "cancel"
  | "privacy"
  | "terms"
  | "guide";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "스크럽패드",
    shortName: "스크럽패드",
    tagline: "무료 로컬 개인정보 가리기. 글을 붙여 넣으면 이름과 비밀을 안정적인 자리표시로 바꾸고, 검토한 뒤 ChatGPT·Claude에 복사합니다. 복원 표는 선택. 계정 없음. 업로드 없음.",
    metaDescription:
      "설치 없이 쓰는 무료 로컬 개인정보 가리기. 글을 붙여 넣으면 이메일, 전화번호, 주소, 카드번호, IP, API 키와 사람 이름을 찾아 [NAME_1] 같은 안정적인 자리표시로 바꿉니다. 검토 목록에서 항목을 체크 해제하면 원문이 남고, 직접 추가한 단어도 가릴 수 있습니다. 원문과 가린 글을 나란히 보고, 복사하거나 내려받고, 선택으로 복원 표를 보관합니다. 처리는 이 기기에서만. 계정 없음, 업로드 없음, 광고 없음, 구독 없음.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 가리기는 이 기기에서만 이루어지며 서버로 보내지 않습니다. 구독·광고 없음.",
    langLabel: "언어",
    chipNoSub: "월 $9.99 없음",
    chipPasteFirst: "큰 붙여넣기 칸이 맨 앞",
    chipOnDevice: "이 기기에서만 처리",
    chipNoUpload: "업로드 없음",
    chipNoAds: "광고 없음",
    chipNoAccount: "계정 없음",
    chipLangs: "ko/en/ja/zh",
    pasteLabel: "가릴 글을 붙여 넣으세요",
    pastePlaceholder: "이메일, 메모, 회의록, 로그… 붙여 넣으면 이름·이메일·전화·주소·카드번호·IP·API 키를 찾아 자리표시로 바꿉니다.",
    scrubBtn: "가리기",
    sampleBtn: "예시 넣기",
    clearTextBtn: "비우기",
    onDeviceNote: "가리기는 이 브라우저 탭 안에서 실행됩니다. 붙여 넣은 글은 어디로도 전송되지 않습니다.",
    reviewTitle: "검토 목록",
    reviewHint: "찾은 항목마다 종류, 원문, 자리표시가 보입니다. 체크를 풀면 그 항목은 원문 그대로 남습니다. 이름 찾기는 추정이니 꼭 훑어보세요.",
    reviewEmpty: "글을 붙여 넣으면 찾은 항목이 여기에 나타납니다.",
    reviewNone: "가릴 항목을 찾지 못했습니다. 아래에서 직접 단어를 추가할 수 있습니다.",
    foundCount: "{n}개 찾음",
    occurrences: "{n}회",
    checkAll: "모두 선택",
    uncheckAll: "모두 해제",
    typeEMAIL: "이메일",
    typePHONE: "전화",
    typeCARD: "카드",
    typeIP: "IP",
    typeKEY: "키",
    typeADDRESS: "주소",
    typeNAME: "이름",
    typeWORD: "단어",
    customTitle: "직접 추가한 단어",
    customHint: "프로젝트명, 회사명, 별명처럼 자동으로 못 찾는 말을 넣으세요. 대소문자 구분 없이 단어 단위로 [WORD_n]이 됩니다. 이 기기에 저장됩니다.",
    customPlaceholder: "예: Project Phoenix",
    addWord: "추가",
    removeWord: "{word} 삭제",
    dictEmpty: "아직 추가한 단어가 없습니다.",
    dictExport: "사전 내보내기 (JSON)",
    dictImport: "사전 가져오기 (JSON)",
    dictImported: "사전을 가져왔습니다: {n}개 단어",
    dictImportBad: "사전 파일을 읽지 못했습니다. {\"words\":[…]} 또는 문자열 배열이어야 합니다.",
    dictExported: "사전 JSON을 내려받았습니다",
    compareTitle: "원문 vs 가린 글",
    originalPane: "원문",
    scrubbedPane: "가린 글",
    scrubbedEmpty: "아직 가린 글이 없습니다.",
    copyScrubbed: "가린 글 복사",
    copied: "복사했습니다",
    copyFailed: "복사하지 못했습니다. 글을 직접 선택해 복사하세요.",
    downloadScrubbed: "가린 글 내려받기 (.txt)",
    downloaded: "내려받았습니다",
    restoreTitle: "복원 표 (선택)",
    restoreWarn: "복원 표에는 원문이 그대로 들어 있습니다. 채팅에 붙여 넣지 말고 이 기기에만 두세요. 답변을 받은 뒤 자리표시를 되돌릴 때만 쓰세요.",
    restoreShow: "복원 표 보기",
    restoreHide: "복원 표 숨기기",
    restoreCopy: "복원 표 복사",
    restoreDownload: "복원 표 내려받기 (JSON)",
    restoreEmpty: "가린 항목이 없어 복원 표가 비어 있습니다.",
    settingsTitle: "설정",
    keepLastOn: "마지막 글을 이 기기에 남김: 켬",
    keepLastOff: "마지막 글을 이 기기에 남김: 끔",
    keepLastHint: "켜 두면 다음에 열 때 마지막으로 붙여 넣은 글이 남아 있습니다. 공용 기기라면 끄세요.",
    clearAll: "모두 지우기",
    clearAllTitle: "모두 지울까요?",
    clearAllBody: "붙여 넣은 글, 직접 추가한 단어, 설정을 이 기기에서 지웁니다. 되돌릴 수 없습니다.",
    cleared: "모두 지웠습니다",
    cancel: "취소",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Scrubpad",
    shortName: "Scrubpad",
    tagline: "Free local PII scrubber. Paste text, replace names and secrets with stable placeholders, review, copy for ChatGPT or Claude. Optional restore map. No account. No upload.",
    metaDescription:
      "Free local PII scrubber with nothing to install. Paste text and it finds emails, phone numbers, addresses, card numbers, IPs, API keys and person names, then swaps each one for a stable placeholder like [NAME_1]. Uncheck a row in the review list to keep the original, add your own words, see original and scrubbed side by side, copy or download, and optionally keep a restore map. Processing happens on this device. No account, no upload, no ads, no subscription.",
    localOnly: "Your data stays on this device. Scrubbing runs on this device — nothing is sent to our servers. No subscription. No ads.",
    langLabel: "Language",
    chipNoSub: "No $9.99/mo",
    chipPasteFirst: "Large paste up front",
    chipOnDevice: "On-device only",
    chipNoUpload: "No upload",
    chipNoAds: "No ads",
    chipNoAccount: "No account",
    chipLangs: "ko/en/ja/zh",
    pasteLabel: "Paste the text you want to scrub",
    pastePlaceholder: "Emails, notes, meeting minutes, logs… Paste and it finds names, emails, phones, addresses, card numbers, IPs and API keys and swaps them for placeholders.",
    scrubBtn: "Scrub",
    sampleBtn: "Try a sample",
    clearTextBtn: "Clear",
    onDeviceNote: "Scrubbing runs inside this browser tab. What you paste is never sent anywhere.",
    reviewTitle: "Review list",
    reviewHint: "Each hit shows its type, the original and its placeholder. Uncheck a row to keep that original. Name detection is a guess, so skim the list before you copy.",
    reviewEmpty: "Paste some text and every detection will show up here.",
    reviewNone: "Nothing to scrub was found. You can add your own words below.",
    foundCount: "{n} found",
    occurrences: "×{n}",
    checkAll: "Check all",
    uncheckAll: "Uncheck all",
    typeEMAIL: "Email",
    typePHONE: "Phone",
    typeCARD: "Card",
    typeIP: "IP",
    typeKEY: "Key",
    typeADDRESS: "Address",
    typeNAME: "Name",
    typeWORD: "Word",
    customTitle: "Your own words",
    customHint: "Project names, company names, nicknames — anything the detector cannot guess. Matched as whole words, case-insensitive, and replaced with [WORD_n]. Saved on this device.",
    customPlaceholder: "e.g. Project Phoenix",
    addWord: "Add",
    removeWord: "Remove {word}",
    dictEmpty: "No custom words yet.",
    dictExport: "Export dictionary (JSON)",
    dictImport: "Import dictionary (JSON)",
    dictImported: "Dictionary imported: {n} words",
    dictImportBad: "Could not read that dictionary. Expected {\"words\":[…]} or a plain array of strings.",
    dictExported: "Dictionary JSON downloaded",
    compareTitle: "Original vs scrubbed",
    originalPane: "Original",
    scrubbedPane: "Scrubbed",
    scrubbedEmpty: "Nothing scrubbed yet.",
    copyScrubbed: "Copy scrubbed",
    copied: "Copied",
    copyFailed: "Copy failed. Select the text and copy it by hand.",
    downloadScrubbed: "Download scrubbed (.txt)",
    downloaded: "Downloaded",
    restoreTitle: "Restore map (optional)",
    restoreWarn: "The restore map contains the originals. Keep it on this device and out of the chat. Use it only to put the real values back into an answer you got.",
    restoreShow: "Show restore map",
    restoreHide: "Hide restore map",
    restoreCopy: "Copy restore map",
    restoreDownload: "Download restore map (JSON)",
    restoreEmpty: "Nothing is scrubbed, so the restore map is empty.",
    settingsTitle: "Settings",
    keepLastOn: "Keep last paste on this device: on",
    keepLastOff: "Keep last paste on this device: off",
    keepLastHint: "When on, the last text you pasted is still here next time you open the app. Turn it off on a shared device.",
    clearAll: "Delete everything",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Removes the pasted text, your custom words and settings from this device. This cannot be undone.",
    cleared: "Everything deleted",
    cancel: "Cancel",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "スクラブパッド",
    shortName: "スクラブパッド",
    tagline: "無料のローカル個人情報マスク。文章を貼ると名前と秘密を安定したプレースホルダーに替え、確認してからChatGPTやClaudeにコピー。復元表は任意。アカウント不要。アップロードなし。",
    metaDescription:
      "インストール不要の無料ローカル個人情報マスク。文章を貼ると、メール、電話番号、住所、カード番号、IP、APIキー、人名を見つけて [NAME_1] のような安定したプレースホルダーに置き換えます。確認リストで行のチェックを外せば原文が残り、自分の言葉も追加できます。原文とマスク後を並べて見て、コピーやダウンロードし、任意で復元表を保管。処理はこの端末だけ。アカウント不要、アップロードなし、広告なし、サブスクなし。",
    localOnly: "データはこの端末にだけ保存されます。マスク処理もこの端末だけで、サーバーには送りません。サブスク・広告なし。",
    langLabel: "言語",
    chipNoSub: "月$9.99なし",
    chipPasteFirst: "大きな貼り付け欄が最初",
    chipOnDevice: "この端末だけで処理",
    chipNoUpload: "アップロードなし",
    chipNoAds: "広告なし",
    chipNoAccount: "アカウント不要",
    chipLangs: "ko/en/ja/zh",
    pasteLabel: "マスクしたい文章を貼り付け",
    pastePlaceholder: "メール、メモ、議事録、ログ… 貼り付けると名前・メール・電話・住所・カード番号・IP・APIキーを見つけてプレースホルダーに替えます。",
    scrubBtn: "マスクする",
    sampleBtn: "サンプルを入れる",
    clearTextBtn: "空にする",
    onDeviceNote: "マスク処理はこのブラウザのタブの中だけで動きます。貼り付けた文章はどこにも送られません。",
    reviewTitle: "確認リスト",
    reviewHint: "見つけた項目ごとに種類、原文、プレースホルダーが並びます。チェックを外すとその原文がそのまま残ります。人名の検出は推定なので、コピー前に目を通してください。",
    reviewEmpty: "文章を貼ると、見つけた項目がここに並びます。",
    reviewNone: "マスクする項目は見つかりませんでした。下で自分の言葉を追加できます。",
    foundCount: "{n}件",
    occurrences: "×{n}",
    checkAll: "すべて選択",
    uncheckAll: "すべて解除",
    typeEMAIL: "メール",
    typePHONE: "電話",
    typeCARD: "カード",
    typeIP: "IP",
    typeKEY: "キー",
    typeADDRESS: "住所",
    typeNAME: "人名",
    typeWORD: "単語",
    customTitle: "自分の言葉",
    customHint: "プロジェクト名、会社名、あだ名など、自動では見つけられない言葉を入れます。大文字小文字を区別せず単語単位で [WORD_n] になります。この端末に保存されます。",
    customPlaceholder: "例: Project Phoenix",
    addWord: "追加",
    removeWord: "{word} を削除",
    dictEmpty: "追加した言葉はまだありません。",
    dictExport: "辞書を書き出す (JSON)",
    dictImport: "辞書を取り込む (JSON)",
    dictImported: "辞書を取り込みました: {n}語",
    dictImportBad: "辞書ファイルを読めませんでした。{\"words\":[…]} か文字列の配列が必要です。",
    dictExported: "辞書JSONをダウンロードしました",
    compareTitle: "原文とマスク後",
    originalPane: "原文",
    scrubbedPane: "マスク後",
    scrubbedEmpty: "まだマスクした文章はありません。",
    copyScrubbed: "マスク後をコピー",
    copied: "コピーしました",
    copyFailed: "コピーできませんでした。文章を選択して手動でコピーしてください。",
    downloadScrubbed: "マスク後をダウンロード (.txt)",
    downloaded: "ダウンロードしました",
    restoreTitle: "復元表（任意）",
    restoreWarn: "復元表には原文がそのまま入っています。この端末に置き、チャットには貼らないでください。返ってきた答えに元の値を戻すときだけ使います。",
    restoreShow: "復元表を表示",
    restoreHide: "復元表を隠す",
    restoreCopy: "復元表をコピー",
    restoreDownload: "復元表をダウンロード (JSON)",
    restoreEmpty: "マスクした項目がないので復元表は空です。",
    settingsTitle: "設定",
    keepLastOn: "最後の文章をこの端末に残す: オン",
    keepLastOff: "最後の文章をこの端末に残す: オフ",
    keepLastHint: "オンにすると、次に開いたときも最後に貼った文章が残っています。共用端末ではオフにしてください。",
    clearAll: "すべて削除",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "貼り付けた文章、自分の言葉、設定をこの端末から消します。元に戻せません。",
    cleared: "すべて削除しました",
    cancel: "キャンセル",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "脱敏板",
    shortName: "脱敏板",
    tagline: "免费本地脱敏。粘贴文本，把姓名和秘密换成稳定占位符，核对后再复制给 ChatGPT 或 Claude。可选还原表。无需账号。不上传。",
    metaDescription:
      "免安装的免费本地脱敏工具。粘贴文本，它会找出邮箱、电话、地址、卡号、IP、API 密钥和人名，并换成 [NAME_1] 这样的稳定占位符。在核对列表里取消勾选某行即可保留原文，也能添加自己的词。原文与脱敏后并排显示，可复制或下载，还可选保留一份还原表。处理只在此设备完成。无需账号，不上传，无广告，无订阅。",
    localOnly: "数据仅保存在此设备。脱敏也在此设备完成，不会上传到服务器。无订阅、无广告。",
    langLabel: "语言",
    chipNoSub: "没有 $9.99/月",
    chipPasteFirst: "大粘贴框在最前",
    chipOnDevice: "仅在此设备处理",
    chipNoUpload: "不上传",
    chipNoAds: "无广告",
    chipNoAccount: "无需账号",
    chipLangs: "ko/en/ja/zh",
    pasteLabel: "粘贴要脱敏的文本",
    pastePlaceholder: "邮件、笔记、会议记录、日志… 粘贴后会找出姓名、邮箱、电话、地址、卡号、IP 和 API 密钥，并换成占位符。",
    scrubBtn: "脱敏",
    sampleBtn: "填入示例",
    clearTextBtn: "清空",
    onDeviceNote: "脱敏只在这个浏览器标签页里运行。你粘贴的内容不会发往任何地方。",
    reviewTitle: "核对列表",
    reviewHint: "每一项显示类型、原文和占位符。取消勾选就会保留那条原文。人名识别是猜测，复制前请扫一眼。",
    reviewEmpty: "粘贴文本后，找到的项目会出现在这里。",
    reviewNone: "没有找到需要脱敏的内容。可以在下面添加自己的词。",
    foundCount: "找到 {n} 项",
    occurrences: "×{n}",
    checkAll: "全选",
    uncheckAll: "全不选",
    typeEMAIL: "邮箱",
    typePHONE: "电话",
    typeCARD: "卡号",
    typeIP: "IP",
    typeKEY: "密钥",
    typeADDRESS: "地址",
    typeNAME: "姓名",
    typeWORD: "词",
    customTitle: "自己的词",
    customHint: "项目名、公司名、昵称等自动识别不到的词。按整词匹配，不分大小写，替换为 [WORD_n]。保存在此设备。",
    customPlaceholder: "例如：Project Phoenix",
    addWord: "添加",
    removeWord: "删除 {word}",
    dictEmpty: "还没有添加自己的词。",
    dictExport: "导出词典 (JSON)",
    dictImport: "导入词典 (JSON)",
    dictImported: "已导入词典：{n} 个词",
    dictImportBad: "无法读取该词典。需要 {\"words\":[…]} 或纯字符串数组。",
    dictExported: "已下载词典 JSON",
    compareTitle: "原文与脱敏后",
    originalPane: "原文",
    scrubbedPane: "脱敏后",
    scrubbedEmpty: "还没有脱敏后的文本。",
    copyScrubbed: "复制脱敏后",
    copied: "已复制",
    copyFailed: "复制失败。请选中文本手动复制。",
    downloadScrubbed: "下载脱敏后 (.txt)",
    downloaded: "已下载",
    restoreTitle: "还原表（可选）",
    restoreWarn: "还原表里就是原文。请只留在此设备，不要贴进聊天。只在把真实值放回收到的回答时使用。",
    restoreShow: "显示还原表",
    restoreHide: "隐藏还原表",
    restoreCopy: "复制还原表",
    restoreDownload: "下载还原表 (JSON)",
    restoreEmpty: "没有脱敏的项目，还原表为空。",
    settingsTitle: "设置",
    keepLastOn: "在此设备保留上次文本：开",
    keepLastOff: "在此设备保留上次文本：关",
    keepLastHint: "开启后，下次打开还能看到上次粘贴的文本。公用设备请关闭。",
    clearAll: "全部删除",
    clearAllTitle: "全部删除？",
    clearAllBody: "从此设备移除粘贴的文本、自己的词和设置。无法撤销。",
    cleared: "已全部删除",
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
