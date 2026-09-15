/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "lockpad:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://lockpad.try-dabble.com/og-image-ko.png",
  en: "https://lockpad.try-dabble.com/og-image-en.png",
  ja: "https://lockpad.try-dabble.com/og-image-ja.png",
  zh: "https://lockpad.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipAndroidWeb"
  | "chipNoLogin"
  | "chipNoAds"
  | "chipBackup"
  | "chipNoAttachPaywall"
  | "chipNoWipe"
  | "chipLocal"
  | "chipPin"
  | "chipAutoLock"
  | "chipFree"
  | "chipLangs"
  | "howTitle"
  | "howBody"
  | "notesTitle"
  | "noteCount"
  | "lockedCount"
  | "newNote"
  | "searchLabel"
  | "searchPlaceholder"
  | "searchHint"
  | "noNotes"
  | "noMatches"
  | "untitled"
  | "lockedBadge"
  | "openBadge"
  | "lockAllBtn"
  | "lockedAllToast"
  | "backToList"
  | "noteTitleLabel"
  | "noteTitlePlaceholder"
  | "noteBodyLabel"
  | "noteBodyPlaceholder"
  | "tagsLabel"
  | "tagsPlaceholder"
  | "colorLabel"
  | "colorNone"
  | "colorBrass"
  | "colorSage"
  | "colorRose"
  | "colorLavender"
  | "colorSlate"
  | "editedAt"
  | "savedHint"
  | "pickNote"
  | "lockBtn"
  | "relockBtn"
  | "removeLockBtn"
  | "unlockBtn"
  | "lockDialogTitle"
  | "lockDialogBody"
  | "pinLabel"
  | "pinPlaceholder"
  | "pinConfirmLabel"
  | "pinTooShort"
  | "pinMismatch"
  | "showPin"
  | "hidePin"
  | "lockedToast"
  | "unlockDialogTitle"
  | "unlockDialogBody"
  | "wrongPin"
  | "waitSeconds"
  | "unlockedToast"
  | "lockedCardTitle"
  | "lockedCardBody"
  | "lostPinHint"
  | "removeLockTitle"
  | "removeLockBody"
  | "removedLockToast"
  | "relockedToast"
  | "autoLockedToast"
  | "prefsTitle"
  | "prefsHint"
  | "idleLockLabel"
  | "idleOff"
  | "idle1"
  | "idle5"
  | "idle15"
  | "idle60"
  | "hideLockLabel"
  | "deleteNote"
  | "deleteNoteTitle"
  | "deleteNoteBody"
  | "deletedToast"
  | "backupTitle"
  | "backupHint"
  | "exportJson"
  | "importJson"
  | "exported"
  | "importBad"
  | "importOk"
  | "importConfirmTitle"
  | "importConfirmBody"
  | "deleteAllBtn"
  | "deleteAllTitle"
  | "deleteAllBody"
  | "deleteAllTypeLabel"
  | "deleteAllMismatch"
  | "deletedAll"
  | "create"
  | "save"
  | "cancel"
  | "close"
  | "privacy"
  | "terms"
  | "guide"
  | "promiseTitle";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "락패드",
    shortName: "락패드",
    tagline: "메모별 PIN 잠금이 있는 심플 로컬 메모장. 잠금 해제 모달, 유휴 자동 잠금, 제목 검색(잠긴 본문은 암호문 그대로), 태그·색상, 잠긴 블롭까지 담는 JSON 백업. 계정 없음. 광고 없음. 인앱 결제 없음.",
    metaDescription:
      "삼성 노트처럼 메모 하나하나에 잠금을 걸 수 있는, 로그인도 광고도 인앱 결제도 없는 무료 로컬 메모장입니다. 메모를 만들고, 골라서 PIN이나 비밀번호로 잠그면 본문은 이 기기에서 Web Crypto(PBKDF2 + AES-GCM)로 암호화되어 암호문으로만 저장됩니다. 잠긴 메모를 열 때는 잠금 해제 모달이 뜨고, PIN을 틀릴수록 대기 시간이 1초·2초·4초로 늘어납니다. 원하면 일정 시간 손대지 않거나 탭을 숨길 때 열린 메모를 모두 다시 잠그는 자동 잠금을 켤 수 있습니다. 검색은 제목과 태그만 봅니다 — 잠긴 본문은 절대 복호화하지 않습니다. 태그와 색상은 선택입니다. JSON 백업에는 잠긴 메모가 암호문·솔트·KDF 파라미터 그대로 들어가서 새 브라우저나 새 기기에서 불러와도 그대로 잠긴 채 복원되고, 같은 PIN으로 열립니다. 잠긴 메모를 평문으로 몰래 풀어 내보내는 일은 없습니다. 사진·음성 첨부 유료 벽 없음, 전체 삭제 버튼 없음(있어도 타이핑 확인 뒤), 사용 중 광고 없음. 안드로이드와 모든 브라우저에서 설치해 오프라인으로 쓰는 PWA입니다. 데이터는 이 기기에만 남습니다.",
    localOnly: "메모는 이 기기에만 저장됩니다. 잠긴 메모는 암호문으로만 남습니다. 로그인·광고 없음. JSON으로 백업하세요.",
    langLabel: "언어",
    chipAndroidWeb: "안드로이드·웹에서 작동",
    chipNoLogin: "로그인 없음",
    chipNoAds: "도구에 광고 없음",
    chipBackup: "잠긴 JSON 백업 이동 가능",
    chipNoAttachPaywall: "첨부 유료 벽 없음",
    chipNoWipe: "전체 삭제 없음",
    chipLocal: "이 기기에만 저장",
    chipPin: "메모별 PIN",
    chipAutoLock: "유휴 자동 잠금",
    chipFree: "영원히 무료",
    chipLangs: "ko/en/ja/zh",
    howTitle: "메모를 쓰고, 필요한 것만 잠그세요",
    howBody: "메모는 평범한 메모장처럼 씁니다. 자물쇠를 누르고 PIN을 정하면 그 메모의 본문만 이 기기에서 암호화됩니다. 제목·태그는 그대로 보여서 검색이 되고, 본문은 PIN을 넣어야 열립니다.",
    notesTitle: "메모",
    noteCount: "메모 {n}개",
    lockedCount: "잠김 {n}개",
    newNote: "새 메모",
    searchLabel: "검색",
    searchPlaceholder: "제목·태그 검색",
    searchHint: "잠긴 메모는 제목과 태그만 검색됩니다. 본문은 열지 않습니다.",
    noNotes: "아직 메모가 없습니다. 새 메모를 만들어 보세요.",
    noMatches: "일치하는 메모가 없습니다.",
    untitled: "제목 없음",
    lockedBadge: "잠김",
    openBadge: "열림",
    lockAllBtn: "모두 잠그기",
    lockedAllToast: "열려 있던 메모를 모두 잠갔습니다",
    backToList: "목록",
    noteTitleLabel: "제목",
    noteTitlePlaceholder: "제목",
    noteBodyLabel: "본문",
    noteBodyPlaceholder: "여기에 적으세요…",
    tagsLabel: "태그 (쉼표로 구분)",
    tagsPlaceholder: "예: 집, 일, 아이디어",
    colorLabel: "색상",
    colorNone: "없음",
    colorBrass: "황동",
    colorSage: "세이지",
    colorRose: "로즈",
    colorLavender: "라벤더",
    colorSlate: "슬레이트",
    editedAt: "수정 {time}",
    savedHint: "이 기기에 자동 저장됩니다.",
    pickNote: "왼쪽에서 메모를 고르거나 새 메모를 만드세요.",
    lockBtn: "잠그기",
    relockBtn: "지금 잠그기",
    removeLockBtn: "잠금 해제(영구)",
    unlockBtn: "열기",
    lockDialogTitle: "이 메모를 잠글까요?",
    lockDialogBody: "PIN이나 비밀번호를 정하세요. 본문은 이 기기에서 암호화되어 암호문으로만 저장됩니다. PIN을 잊으면 되찾을 방법이 없습니다.",
    pinLabel: "PIN 또는 비밀번호 (4자 이상)",
    pinPlaceholder: "PIN",
    pinConfirmLabel: "PIN 다시 입력",
    pinTooShort: "PIN은 4자 이상이어야 합니다.",
    pinMismatch: "두 PIN이 서로 다릅니다.",
    showPin: "PIN 보기",
    hidePin: "PIN 숨기기",
    lockedToast: "메모를 잠갔습니다",
    unlockDialogTitle: "잠금 해제",
    unlockDialogBody: "이 메모의 PIN을 입력하세요.",
    wrongPin: "PIN이 틀렸습니다.",
    waitSeconds: "PIN이 틀렸습니다. {s}초 뒤에 다시 시도하세요.",
    unlockedToast: "메모를 열었습니다",
    lockedCardTitle: "잠긴 메모입니다",
    lockedCardBody: "본문은 이 기기에 암호문으로만 저장되어 있습니다. PIN을 입력하면 이 세션에서만 읽고 고칠 수 있습니다.",
    lostPinHint: "PIN을 잊으면 복구할 수 없습니다. 암호문은 PIN 없이 열리지 않습니다.",
    removeLockTitle: "잠금을 영구 해제할까요?",
    removeLockBody: "이 메모의 본문이 다시 평문으로 이 기기에 저장됩니다. 언제든 다시 잠글 수 있습니다.",
    removedLockToast: "잠금을 해제했습니다",
    relockedToast: "다시 잠갔습니다",
    autoLockedToast: "자동 잠금: 열려 있던 메모를 잠갔습니다",
    prefsTitle: "자동 잠금",
    prefsHint: "열어 둔 메모를 일정 시간 손대지 않거나 탭이 숨겨질 때 다시 잠급니다. 둘 다 선택입니다.",
    idleLockLabel: "손대지 않으면",
    idleOff: "끄기",
    idle1: "1분 뒤 잠금",
    idle5: "5분 뒤 잠금",
    idle15: "15분 뒤 잠금",
    idle60: "1시간 뒤 잠금",
    hideLockLabel: "탭을 숨기거나 앱을 벗어나면 잠금",
    deleteNote: "삭제",
    deleteNoteTitle: "이 메모를 삭제할까요?",
    deleteNoteBody: "이 메모가 이 기기에서 지워집니다. 되돌릴 수 없습니다.",
    deletedToast: "삭제했습니다",
    backupTitle: "백업",
    backupHint: "JSON에는 잠긴 메모가 암호문·솔트·KDF 파라미터 그대로 들어갑니다. 새 브라우저나 새 기기에서 불러오면 그대로 잠긴 채 복원되고 같은 PIN으로 열립니다. 평문으로 풀어 내보내지 않습니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 불러오기",
    exported: "JSON을 내보냈습니다",
    importBad: "파일을 읽을 수 없습니다",
    importOk: "{n}개 메모를 불러왔습니다 (잠김 {locked}개)",
    importConfirmTitle: "JSON을 불러올까요?",
    importConfirmBody: "파일의 메모 {n}개(잠김 {locked}개)를 이 기기에 합칩니다. 같은 ID의 메모는 파일 쪽으로 바뀌고, 나머지는 그대로 남습니다.",
    deleteAllBtn: "모든 메모 삭제",
    deleteAllTitle: "정말 모든 메모를 삭제할까요?",
    deleteAllBody: "잠긴 메모를 포함해 모든 메모가 이 기기에서 지워집니다. 먼저 JSON으로 내보내세요. 진행하려면 아래에 확인 단어를 입력하세요.",
    deleteAllTypeLabel: "확인하려면 {word} 입력",
    deleteAllMismatch: "확인 단어가 다릅니다.",
    deletedAll: "모든 메모를 삭제했습니다",
    create: "만들기",
    save: "저장",
    cancel: "취소",
    close: "닫기",
    privacy: "개인정보",
    terms: "약관",
    guide: "가이드",
    promiseTitle: "약속",
  },
  en: {
    title: "Lockpad",
    shortName: "Lockpad",
    tagline: "Simple local notepad with per-note PIN lock. Unlock modal, idle auto-lock, title search (locked bodies stay ciphertext), tags & colors, portable JSON backup of locked blobs. No account. No ads. No IAP.",
    metaDescription:
      "A free local notepad with a Samsung Notes–style lock on any note you choose — no login, no ads, no in-app purchases. Write notes like any notepad, then lock the ones that matter behind a PIN or password: the body is encrypted on this device with Web Crypto (PBKDF2 + AES-GCM) and stored only as ciphertext. Opening a locked note brings up an unlock modal, and every wrong PIN makes the next try wait longer (1s, 2s, 4s…). Optional app-wide auto-lock re-locks every open note after idle time or when the tab is hidden. Search looks at titles and tags only — locked bodies are never decrypted for search. Tags and colors are optional. The JSON backup carries locked notes as ciphertext + salt + KDF params, so importing on a new browser or device restores them still locked and still opening with the same PIN. Nothing ever dumps a locked note as plaintext. No photo or voice attachment paywall, no wipe button without a typed confirm, no mid-use ads. Works offline as an installable PWA on Android and any browser. Data stays on this device.",
    localOnly: "Your notes stay on this device. Locked notes are stored as ciphertext only. No login. No ads. Export JSON to keep a copy.",
    langLabel: "Language",
    chipAndroidWeb: "Works on Android & web",
    chipNoLogin: "No login",
    chipNoAds: "No ads on tool",
    chipBackup: "Portable locked JSON backup",
    chipNoAttachPaywall: "No attachment paywall",
    chipNoWipe: "No wipe",
    chipLocal: "Stays on this device",
    chipPin: "Per-note PIN",
    chipAutoLock: "Idle auto-lock",
    chipFree: "Free forever",
    chipLangs: "ko/en/ja/zh",
    howTitle: "Write notes, lock only the ones that matter",
    howBody: "Notes work like any notepad. Tap the lock, pick a PIN, and only that note's body is encrypted on this device. Title and tags stay visible so search still works; the body opens only with the PIN.",
    notesTitle: "Notes",
    noteCount: "{n} notes",
    lockedCount: "{n} locked",
    newNote: "New note",
    searchLabel: "Search",
    searchPlaceholder: "Search titles & tags",
    searchHint: "Locked notes match on title and tags only. Their bodies are never opened for search.",
    noNotes: "No notes yet. Create one to start.",
    noMatches: "No notes match.",
    untitled: "Untitled",
    lockedBadge: "Locked",
    openBadge: "Open",
    lockAllBtn: "Lock all",
    lockedAllToast: "Every open note is locked again",
    backToList: "Notes",
    noteTitleLabel: "Title",
    noteTitlePlaceholder: "Title",
    noteBodyLabel: "Body",
    noteBodyPlaceholder: "Write here…",
    tagsLabel: "Tags (comma-separated)",
    tagsPlaceholder: "e.g. home, work, ideas",
    colorLabel: "Color",
    colorNone: "None",
    colorBrass: "Brass",
    colorSage: "Sage",
    colorRose: "Rose",
    colorLavender: "Lavender",
    colorSlate: "Slate",
    editedAt: "Edited {time}",
    savedHint: "Saved automatically on this device.",
    pickNote: "Pick a note on the left or create a new one.",
    lockBtn: "Lock",
    relockBtn: "Lock now",
    removeLockBtn: "Remove lock",
    unlockBtn: "Unlock",
    lockDialogTitle: "Lock this note?",
    lockDialogBody: "Choose a PIN or password. The body is encrypted on this device and stored only as ciphertext. If you forget the PIN there is no way to recover it.",
    pinLabel: "PIN or password (4+ characters)",
    pinPlaceholder: "PIN",
    pinConfirmLabel: "Repeat the PIN",
    pinTooShort: "The PIN needs at least 4 characters.",
    pinMismatch: "The two PINs do not match.",
    showPin: "Show PIN",
    hidePin: "Hide PIN",
    lockedToast: "Note locked",
    unlockDialogTitle: "Unlock",
    unlockDialogBody: "Enter the PIN for this note.",
    wrongPin: "Wrong PIN.",
    waitSeconds: "Wrong PIN. Try again in {s}s.",
    unlockedToast: "Note unlocked",
    lockedCardTitle: "This note is locked",
    lockedCardBody: "The body is stored on this device as ciphertext only. Enter the PIN to read and edit it for this session.",
    lostPinHint: "A lost PIN cannot be recovered. The ciphertext will not open without it.",
    removeLockTitle: "Remove the lock for good?",
    removeLockBody: "This note's body will be stored on this device as plain text again. You can lock it again any time.",
    removedLockToast: "Lock removed",
    relockedToast: "Locked again",
    autoLockedToast: "Auto-lock: open notes were locked again",
    prefsTitle: "Auto-lock",
    prefsHint: "Re-lock open notes after a stretch of idle time or when the tab is hidden. Both are optional.",
    idleLockLabel: "When idle",
    idleOff: "Off",
    idle1: "Lock after 1 minute",
    idle5: "Lock after 5 minutes",
    idle15: "Lock after 15 minutes",
    idle60: "Lock after 1 hour",
    hideLockLabel: "Lock when the tab is hidden or the app goes to the background",
    deleteNote: "Delete",
    deleteNoteTitle: "Delete this note?",
    deleteNoteBody: "This note will be removed from this device. This cannot be undone.",
    deletedToast: "Deleted",
    backupTitle: "Backup",
    backupHint: "The JSON carries locked notes exactly as stored: ciphertext, salt and KDF params. Import it on a new browser or device and they come back still locked, opening with the same PIN. Nothing is ever exported as plaintext.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exported: "JSON exported",
    importBad: "Could not read that file",
    importOk: "Imported {n} notes ({locked} locked)",
    importConfirmTitle: "Import this JSON?",
    importConfirmBody: "{n} notes from the file ({locked} locked) will be merged into this device. A note with the same ID is replaced by the file's copy; everything else stays.",
    deleteAllBtn: "Delete all notes",
    deleteAllTitle: "Really delete every note?",
    deleteAllBody: "Every note, locked ones included, will be removed from this device. Export JSON first. Type the confirmation word below to continue.",
    deleteAllTypeLabel: "Type {word} to confirm",
    deleteAllMismatch: "The confirmation word does not match.",
    deletedAll: "All notes deleted",
    create: "Create",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
    promiseTitle: "Promises",
  },
  ja: {
    title: "ロックパッド",
    shortName: "ロックパッド",
    tagline: "メモごとにPINロックできるシンプルなローカルメモ帳。解除モーダル、アイドル自動ロック、タイトル検索（ロック済み本文は暗号文のまま）、タグと色、ロック済みブロブごと持ち運べるJSONバックアップ。アカウント不要。広告なし。アプリ内課金なし。",
    metaDescription:
      "Samsung Notes のように好きなメモだけをロックできる、ログインも広告もアプリ内課金もない無料のローカルメモ帳です。普通のメモ帳のように書いて、大事なメモだけ PIN やパスワードでロックすると、本文はこの端末の Web Crypto（PBKDF2 + AES-GCM）で暗号化され、暗号文としてだけ保存されます。ロック済みメモを開くときは解除モーダルが出て、PIN を間違えるたびに次の試行までの待ち時間が 1秒・2秒・4秒…と伸びます。任意で、一定時間触らないときやタブが隠れたときに開いているメモをすべてロックし直す自動ロックも使えます。検索はタイトルとタグだけを見ます——ロック済み本文は検索のために復号されません。タグと色は任意です。JSON バックアップにはロック済みメモが暗号文・ソルト・KDF パラメータのまま入るので、新しいブラウザや端末で読み込んでもロックされたまま復元され、同じ PIN で開きます。ロック済みメモを平文で書き出すことは決してありません。写真・音声添付の課金壁なし、入力確認なしの全消去ボタンなし、使用中の広告なし。Android とあらゆるブラウザでインストールしてオフラインで使える PWA です。データはこの端末だけに残ります。",
    localOnly: "メモはこの端末にだけ保存されます。ロック済みメモは暗号文のみ。ログイン・広告なし。JSONでバックアップしてください。",
    langLabel: "言語",
    chipAndroidWeb: "Android・ウェブで動く",
    chipNoLogin: "ログイン不要",
    chipNoAds: "ツールに広告なし",
    chipBackup: "ロック済みJSONを持ち運べる",
    chipNoAttachPaywall: "添付の課金壁なし",
    chipNoWipe: "全消去なし",
    chipLocal: "この端末だけに保存",
    chipPin: "メモごとのPIN",
    chipAutoLock: "アイドル自動ロック",
    chipFree: "ずっと無料",
    chipLangs: "ko/en/ja/zh",
    howTitle: "メモを書いて、大事なものだけロック",
    howBody: "メモは普通のメモ帳と同じように書けます。鍵を押して PIN を決めると、そのメモの本文だけがこの端末で暗号化されます。タイトルとタグは見えたままなので検索でき、本文は PIN を入れたときだけ開きます。",
    notesTitle: "メモ",
    noteCount: "メモ {n} 件",
    lockedCount: "ロック {n} 件",
    newNote: "新しいメモ",
    searchLabel: "検索",
    searchPlaceholder: "タイトル・タグを検索",
    searchHint: "ロック済みメモはタイトルとタグだけが検索対象です。本文は開きません。",
    noNotes: "まだメモがありません。新しいメモを作りましょう。",
    noMatches: "一致するメモがありません。",
    untitled: "無題",
    lockedBadge: "ロック",
    openBadge: "開いている",
    lockAllBtn: "すべてロック",
    lockedAllToast: "開いていたメモをすべてロックしました",
    backToList: "一覧",
    noteTitleLabel: "タイトル",
    noteTitlePlaceholder: "タイトル",
    noteBodyLabel: "本文",
    noteBodyPlaceholder: "ここに書く…",
    tagsLabel: "タグ（カンマ区切り）",
    tagsPlaceholder: "例: 家, 仕事, アイデア",
    colorLabel: "色",
    colorNone: "なし",
    colorBrass: "真鍮",
    colorSage: "セージ",
    colorRose: "ローズ",
    colorLavender: "ラベンダー",
    colorSlate: "スレート",
    editedAt: "編集 {time}",
    savedHint: "この端末に自動保存されます。",
    pickNote: "左のメモを選ぶか、新しいメモを作ってください。",
    lockBtn: "ロック",
    relockBtn: "今すぐロック",
    removeLockBtn: "ロック解除（恒久）",
    unlockBtn: "開く",
    lockDialogTitle: "このメモをロックしますか？",
    lockDialogBody: "PIN またはパスワードを決めてください。本文はこの端末で暗号化され、暗号文としてだけ保存されます。PIN を忘れると復元する方法はありません。",
    pinLabel: "PIN またはパスワード（4文字以上）",
    pinPlaceholder: "PIN",
    pinConfirmLabel: "PIN をもう一度",
    pinTooShort: "PIN は4文字以上にしてください。",
    pinMismatch: "2つの PIN が一致しません。",
    showPin: "PIN を表示",
    hidePin: "PIN を隠す",
    lockedToast: "メモをロックしました",
    unlockDialogTitle: "ロック解除",
    unlockDialogBody: "このメモの PIN を入力してください。",
    wrongPin: "PIN が違います。",
    waitSeconds: "PIN が違います。{s}秒後にもう一度試してください。",
    unlockedToast: "メモを開きました",
    lockedCardTitle: "このメモはロックされています",
    lockedCardBody: "本文はこの端末に暗号文としてだけ保存されています。PIN を入力すると、このセッションの間だけ読んで編集できます。",
    lostPinHint: "PIN を忘れると復元できません。暗号文は PIN なしでは開きません。",
    removeLockTitle: "ロックを恒久的に解除しますか？",
    removeLockBody: "このメモの本文は再び平文としてこの端末に保存されます。いつでもまたロックできます。",
    removedLockToast: "ロックを解除しました",
    relockedToast: "ロックし直しました",
    autoLockedToast: "自動ロック: 開いていたメモをロックしました",
    prefsTitle: "自動ロック",
    prefsHint: "一定時間触らなかったとき、またはタブが隠れたときに、開いているメモをロックし直します。どちらも任意です。",
    idleLockLabel: "操作がないとき",
    idleOff: "オフ",
    idle1: "1分後にロック",
    idle5: "5分後にロック",
    idle15: "15分後にロック",
    idle60: "1時間後にロック",
    hideLockLabel: "タブが隠れたりアプリを離れたらロック",
    deleteNote: "削除",
    deleteNoteTitle: "このメモを削除しますか？",
    deleteNoteBody: "このメモはこの端末から消えます。元に戻せません。",
    deletedToast: "削除しました",
    backupTitle: "バックアップ",
    backupHint: "JSON にはロック済みメモが保存されたままの形（暗号文・ソルト・KDF パラメータ）で入ります。新しいブラウザや端末で読み込むとロックされたまま戻り、同じ PIN で開きます。平文で書き出すことはありません。",
    exportJson: "JSON 書き出し",
    importJson: "JSON 読み込み",
    exported: "JSON を書き出しました",
    importBad: "ファイルを読めませんでした",
    importOk: "{n} 件のメモを読み込みました（ロック {locked} 件）",
    importConfirmTitle: "この JSON を読み込みますか？",
    importConfirmBody: "ファイルの {n} 件（ロック {locked} 件）をこの端末に統合します。同じ ID のメモはファイル側に置き換わり、それ以外はそのまま残ります。",
    deleteAllBtn: "すべてのメモを削除",
    deleteAllTitle: "本当にすべてのメモを削除しますか？",
    deleteAllBody: "ロック済みを含むすべてのメモがこの端末から消えます。先に JSON で書き出してください。続けるには下に確認ワードを入力してください。",
    deleteAllTypeLabel: "確認のため {word} と入力",
    deleteAllMismatch: "確認ワードが一致しません。",
    deletedAll: "すべてのメモを削除しました",
    create: "作成",
    save: "保存",
    cancel: "キャンセル",
    close: "閉じる",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
    promiseTitle: "約束",
  },
  zh: {
    title: "加锁便签",
    shortName: "加锁便签",
    tagline: "可按条加 PIN 锁的简洁本地记事本。解锁弹窗、闲置自动上锁、标题搜索（已锁正文保持密文）、标签与颜色、可携带已锁数据块的 JSON 备份。无需账号。无广告。无内购。",
    metaDescription:
      "像三星备忘录一样可以给任意一条笔记加锁的免费本地记事本——无登录、无广告、无内购。像普通记事本一样写笔记，再把重要的那几条用 PIN 或密码锁起来：正文在此设备上用 Web Crypto（PBKDF2 + AES-GCM）加密，只以密文保存。打开已锁笔记时会弹出解锁窗口，每输错一次 PIN，下一次尝试都要多等一会儿（1 秒、2 秒、4 秒……）。可选的全局自动上锁会在闲置一段时间或标签页隐藏时把所有已打开的笔记重新锁上。搜索只看标题和标签——已锁正文绝不会为了搜索而被解密。标签和颜色可选。JSON 备份中的已锁笔记以密文 + 盐 + KDF 参数原样导出，在新浏览器或新设备导入后仍保持锁定，并能用同一 PIN 打开。绝不会把已锁笔记以明文导出。没有照片/语音附件付费墙，没有不经输入确认的清空按钮，使用中没有广告。可在 Android 和任意浏览器上安装为离线 PWA。数据只留在此设备。",
    localOnly: "笔记只保存在此设备。已锁笔记仅以密文保存。无登录、无广告。请用 JSON 备份。",
    langLabel: "语言",
    chipAndroidWeb: "支持 Android 和网页",
    chipNoLogin: "无需登录",
    chipNoAds: "工具无广告",
    chipBackup: "已锁 JSON 备份可携带",
    chipNoAttachPaywall: "无附件付费墙",
    chipNoWipe: "不会清空",
    chipLocal: "只留在此设备",
    chipPin: "按条 PIN",
    chipAutoLock: "闲置自动上锁",
    chipFree: "永久免费",
    chipLangs: "ko/en/ja/zh",
    howTitle: "先写笔记，只锁重要的那几条",
    howBody: "笔记和普通记事本一样写。点一下锁并设置 PIN，只有这条笔记的正文会在此设备上加密。标题和标签保持可见，所以搜索照常；正文只有输入 PIN 才能打开。",
    notesTitle: "笔记",
    noteCount: "{n} 条笔记",
    lockedCount: "{n} 条已锁",
    newNote: "新笔记",
    searchLabel: "搜索",
    searchPlaceholder: "搜索标题和标签",
    searchHint: "已锁笔记只按标题和标签匹配，正文不会被打开。",
    noNotes: "还没有笔记。新建一条开始吧。",
    noMatches: "没有匹配的笔记。",
    untitled: "无标题",
    lockedBadge: "已锁",
    openBadge: "已打开",
    lockAllBtn: "全部上锁",
    lockedAllToast: "所有已打开的笔记已重新上锁",
    backToList: "列表",
    noteTitleLabel: "标题",
    noteTitlePlaceholder: "标题",
    noteBodyLabel: "正文",
    noteBodyPlaceholder: "在这里写…",
    tagsLabel: "标签（逗号分隔）",
    tagsPlaceholder: "例如：家、工作、想法",
    colorLabel: "颜色",
    colorNone: "无",
    colorBrass: "黄铜",
    colorSage: "鼠尾草绿",
    colorRose: "玫瑰",
    colorLavender: "薰衣草",
    colorSlate: "石板灰",
    editedAt: "编辑于 {time}",
    savedHint: "自动保存在此设备。",
    pickNote: "在左侧选一条笔记，或新建一条。",
    lockBtn: "上锁",
    relockBtn: "立即上锁",
    removeLockBtn: "解除锁定（永久）",
    unlockBtn: "解锁",
    lockDialogTitle: "给这条笔记上锁？",
    lockDialogBody: "设置一个 PIN 或密码。正文会在此设备上加密，只以密文保存。忘记 PIN 将无法找回。",
    pinLabel: "PIN 或密码（至少 4 位）",
    pinPlaceholder: "PIN",
    pinConfirmLabel: "再次输入 PIN",
    pinTooShort: "PIN 至少需要 4 位。",
    pinMismatch: "两次输入的 PIN 不一致。",
    showPin: "显示 PIN",
    hidePin: "隐藏 PIN",
    lockedToast: "笔记已上锁",
    unlockDialogTitle: "解锁",
    unlockDialogBody: "输入这条笔记的 PIN。",
    wrongPin: "PIN 错误。",
    waitSeconds: "PIN 错误。请在 {s} 秒后重试。",
    unlockedToast: "笔记已解锁",
    lockedCardTitle: "这条笔记已上锁",
    lockedCardBody: "正文在此设备上仅以密文保存。输入 PIN 后，本次会话内可以阅读和编辑。",
    lostPinHint: "PIN 丢失无法找回。没有 PIN，密文无法打开。",
    removeLockTitle: "永久解除锁定？",
    removeLockBody: "这条笔记的正文会重新以明文保存在此设备。随时可以再次上锁。",
    removedLockToast: "已解除锁定",
    relockedToast: "已重新上锁",
    autoLockedToast: "自动上锁：已打开的笔记已重新锁上",
    prefsTitle: "自动上锁",
    prefsHint: "闲置一段时间或标签页隐藏时，重新锁上已打开的笔记。两项都是可选的。",
    idleLockLabel: "闲置时",
    idleOff: "关闭",
    idle1: "1 分钟后上锁",
    idle5: "5 分钟后上锁",
    idle15: "15 分钟后上锁",
    idle60: "1 小时后上锁",
    hideLockLabel: "标签页隐藏或切出应用时上锁",
    deleteNote: "删除",
    deleteNoteTitle: "删除这条笔记？",
    deleteNoteBody: "这条笔记会从此设备删除，无法撤销。",
    deletedToast: "已删除",
    backupTitle: "备份",
    backupHint: "JSON 中的已锁笔记按存储原样导出：密文、盐和 KDF 参数。在新浏览器或新设备导入后仍保持锁定，并用同一 PIN 打开。绝不会以明文导出。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    exported: "已导出 JSON",
    importBad: "无法读取该文件",
    importOk: "已导入 {n} 条笔记（{locked} 条已锁）",
    importConfirmTitle: "导入这个 JSON？",
    importConfirmBody: "文件中的 {n} 条笔记（{locked} 条已锁）将合并到此设备。相同 ID 的笔记会被文件中的版本替换，其余保持不变。",
    deleteAllBtn: "删除全部笔记",
    deleteAllTitle: "真的要删除全部笔记？",
    deleteAllBody: "包括已锁笔记在内的所有笔记都会从此设备删除。请先导出 JSON。继续请在下方输入确认词。",
    deleteAllTypeLabel: "输入 {word} 以确认",
    deleteAllMismatch: "确认词不匹配。",
    deletedAll: "已删除全部笔记",
    create: "创建",
    save: "保存",
    cancel: "取消",
    close: "关闭",
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
