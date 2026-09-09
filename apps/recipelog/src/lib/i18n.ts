/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 * zh has its own full set — it never falls back to English.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "recipelog:lang";

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
  | "searchLabel"
  | "searchPlaceholder"
  | "searchNoMatch"
  | "recipesCount"
  | "emptyTitle"
  | "emptyBody"
  | "addRecipe"
  | "fromUrl"
  | "urlLabel"
  | "urlPlaceholder"
  | "extract"
  | "extracting"
  | "extractOk"
  | "extractOkNoPhoto"
  | "extractFailBlocked"
  | "extractFailNoRecipe"
  | "extractFailBadUrl"
  | "extractFailFetch"
  | "extractHelp"
  | "noSocialImport"
  | "formNewTitle"
  | "formEditTitle"
  | "fieldTitle"
  | "titlePlaceholder"
  | "titleRequired"
  | "fieldPhoto"
  | "choosePhoto"
  | "changePhoto"
  | "removePhoto"
  | "photoNote"
  | "photoFailed"
  | "fieldPrep"
  | "fieldCook"
  | "fieldTotal"
  | "minutesShort"
  | "fieldServings"
  | "fieldTags"
  | "tagsPlaceholder"
  | "fieldNotes"
  | "notesPlaceholder"
  | "fieldIngredients"
  | "ingredientsPlaceholder"
  | "fieldSteps"
  | "stepsPlaceholder"
  | "fieldSource"
  | "save"
  | "cancel"
  | "close"
  | "delete"
  | "edit"
  | "deleteConfirmTitle"
  | "deleteConfirmBody"
  | "saved"
  | "deleted"
  | "prepShort"
  | "cookShort"
  | "totalShort"
  | "servingsLabel"
  | "servingsValue"
  | "scaleNote"
  | "ingredientsHeading"
  | "stepsHeading"
  | "notesHeading"
  | "openSource"
  | "cookMode"
  | "cookStep"
  | "prev"
  | "next"
  | "finish"
  | "timer"
  | "timerStart"
  | "timerPause"
  | "timerReset"
  | "timerDone"
  | "timerMinutes"
  | "shopping"
  | "shoppingBody"
  | "shoppingAdd"
  | "shoppingAdded"
  | "shoppingEmpty"
  | "shoppingClearChecked"
  | "shoppingClearAll"
  | "shoppingCopy"
  | "shoppingCopied"
  | "shoppingAddItem"
  | "shoppingItemPlaceholder"
  | "backup"
  | "backupBody"
  | "exportJson"
  | "importJson"
  | "exportDone"
  | "exportEmpty"
  | "importDone"
  | "importFail"
  | "clearAll"
  | "clearConfirmTitle"
  | "clearConfirmBody"
  | "cleared"
  | "fontSizeLabel"
  | "fontMd"
  | "fontLg"
  | "fontXl"
  | "chipNoWipe"
  | "chipNoCatalog"
  | "chipNoAds"
  | "chipManual"
  | "chipFree"
  | "chipLocal"
  | "chipLangs"
  | "about"
  | "privacy"
  | "terms"
  | "guide";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "레시피로그",
    shortName: "레시피로그",
    tagline: "무료 로컬 레시피 보관함. 제목·사진·시간·태그와 메모를 한곳에. 계정 없음.",
    metaDescription:
      "틱톡·인스타·블로그·메일에 흩어진 레시피를 한곳에. 제목, 사진, 조리 시간, 태그, 메모, 재료, 순서를 이 기기에만 저장합니다. URL 붙여넣기로 재료·순서 가져오기, 인분 조절, JSON 백업. 계정 없음, 광고 없음, 무료.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    searchLabel: "검색",
    searchPlaceholder: "제목·태그·메모·재료 검색",
    searchNoMatch: "일치하는 레시피가 없습니다.",
    recipesCount: "레시피 {n}개",
    emptyTitle: "아직 레시피가 없습니다",
    emptyBody: "‘레시피 추가’로 직접 적거나, ‘URL로 가져오기’에 레시피 페이지 주소를 붙여 넣으세요. 모두 이 기기에만 남습니다.",
    addRecipe: "레시피 추가",
    fromUrl: "URL로 가져오기",
    urlLabel: "레시피 페이지 주소",
    urlPlaceholder: "https://…",
    extract: "가져오기",
    extracting: "가져오는 중…",
    extractOk: "재료와 순서를 가져왔습니다. 확인 후 저장하세요.",
    extractOkNoPhoto: "가져왔습니다. 사진은 받지 못했으니 직접 넣어 주세요.",
    extractFailBlocked: "이 사이트는 가져오기를 막습니다(NYT, AllRecipes 등). 아래에 재료와 순서를 붙여 넣거나 직접 적어 주세요.",
    extractFailNoRecipe: "이 페이지에서 레시피 데이터를 찾지 못했습니다. 재료와 순서를 붙여 넣거나 직접 적어 주세요.",
    extractFailBadUrl: "http(s)로 시작하는 공개 페이지 주소만 됩니다.",
    extractFailFetch: "페이지를 받지 못했습니다. 주소를 확인하거나 붙여 넣기로 진행하세요.",
    extractHelp: "레시피 데이터(schema.org)를 공개한 페이지만 가져올 수 있습니다. 일부 사이트(NYT, AllRecipes 등)는 막혀 있어 붙여 넣기나 직접 입력으로 넘어갑니다.",
    noSocialImport: "인스타그램·틱톡 자동 가져오기는 없습니다. 자막을 붙여 넣고 스크린샷을 사진으로 넣어 두세요.",
    formNewTitle: "새 레시피",
    formEditTitle: "레시피 수정",
    fieldTitle: "제목",
    titlePlaceholder: "예: 김치볶음밥",
    titleRequired: "제목을 적어 주세요.",
    fieldPhoto: "사진",
    choosePhoto: "사진 선택",
    changePhoto: "사진 바꾸기",
    removePhoto: "사진 지우기",
    photoNote: "사진은 압축해서 이 기기에만 저장합니다. 사진 속 글자는 읽지 않으니, 재료와 순서는 글로 붙여 넣어 주세요.",
    photoFailed: "이 사진은 열 수 없습니다.",
    fieldPrep: "준비",
    fieldCook: "조리",
    fieldTotal: "전체",
    minutesShort: "분",
    fieldServings: "기준 인분",
    fieldTags: "태그",
    tagsPlaceholder: "쉼표로 구분: 한식, 15분, 도시락",
    fieldNotes: "메모",
    notesPlaceholder: "출처, 바꾼 점, 다음엔 이렇게…",
    fieldIngredients: "재료 (한 줄에 하나)",
    ingredientsPlaceholder: "2컵 밥\n1/2컵 김치\n1큰술 참기름",
    fieldSteps: "순서 (한 줄에 하나)",
    stepsPlaceholder: "팬을 달군다\n김치를 볶는다\n밥을 넣고 섞는다",
    fieldSource: "출처 URL (선택)",
    save: "저장",
    cancel: "취소",
    close: "닫기",
    delete: "삭제",
    edit: "수정",
    deleteConfirmTitle: "이 레시피를 삭제할까요?",
    deleteConfirmBody: "이 기기에서만 지워지며 되돌릴 수 없습니다.",
    saved: "저장했습니다.",
    deleted: "삭제했습니다.",
    prepShort: "준비 {n}분",
    cookShort: "조리 {n}분",
    totalShort: "{n}분",
    servingsLabel: "인분",
    servingsValue: "{n}인분",
    scaleNote: "숫자로 시작하는 재료만 인분에 맞춰 계산합니다. 글로만 적은 재료는 그대로 둡니다.",
    ingredientsHeading: "재료",
    stepsHeading: "순서",
    notesHeading: "메모",
    openSource: "원문 열기",
    cookMode: "요리 모드",
    cookStep: "{n} / {total} 단계",
    prev: "이전",
    next: "다음",
    finish: "마침",
    timer: "타이머",
    timerStart: "시작",
    timerPause: "일시정지",
    timerReset: "초기화",
    timerDone: "시간 끝!",
    timerMinutes: "분",
    shopping: "장보기 목록",
    shoppingBody: "레시피 화면의 ‘장보기에 담기’로 재료를 모아 두고 체크하며 삽니다.",
    shoppingAdd: "장보기에 담기",
    shoppingAdded: "재료 {n}개를 장보기에 담았습니다.",
    shoppingEmpty: "장보기 목록이 비어 있습니다.",
    shoppingClearChecked: "체크한 것 지우기",
    shoppingClearAll: "모두 지우기",
    shoppingCopy: "목록 복사",
    shoppingCopied: "복사했습니다.",
    shoppingAddItem: "추가",
    shoppingItemPlaceholder: "직접 추가…",
    backup: "백업",
    backupBody: "레시피 전체(사진 포함)를 JSON 파일로 내보내거나 가져옵니다. 로그인 없이도 기기를 바꾸거나 브라우저 데이터가 지워질 때 이걸로 되살립니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    exportDone: "내보냈습니다.",
    exportEmpty: "내보낼 레시피가 없습니다.",
    importDone: "레시피 {n}개를 가져왔습니다.",
    importFail: "그 파일은 가져올 수 없습니다.",
    clearAll: "모두 삭제",
    clearConfirmTitle: "모든 레시피를 삭제할까요?",
    clearConfirmBody: "이 기기의 레시피와 장보기 목록이 지워집니다. 먼저 JSON으로 내보내 두세요.",
    cleared: "모두 지웠습니다.",
    fontSizeLabel: "글자 크기",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    chipNoWipe: "로그인 초기화 없음(JSON 백업)",
    chipNoCatalog: "개수 제한 없음",
    chipNoAds: "결제 후 광고 없음",
    chipManual: "직접·URL·사진 (IG/틱톡 자동 없음)",
    chipFree: "무료",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    about:
      "틱톡·인스타·블로그·메일에 흩어진 레시피를 한 화면에 모아 둡니다. 제목과 사진, 시간, 태그, 메모, 재료, 순서를 적어 저장하면 이 기기에만 남습니다. 공개 레시피 페이지 주소를 붙이면 재료와 순서를 가져와 채워 주고, 막힌 사이트는 붙여 넣기로 이어 갑니다. 인분을 바꾸면 숫자 재료가 따라 계산됩니다.",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Recipelog",
    shortName: "Recipelog",
    tagline: "Free local recipe vault. Title, photo, time, tags and notes in one place. No account.",
    metaDescription:
      "Recipes scattered across TikTok, Instagram, blogs and email, gathered in one place. Title, photo, cook time, tags, notes, ingredients and steps stay on this device only. Paste a URL to pull ingredients and steps, scale servings, back up to JSON. No account, no ads, free.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    searchLabel: "Search",
    searchPlaceholder: "Search title, tags, notes, ingredients",
    searchNoMatch: "No recipe matches.",
    recipesCount: "{n} recipes",
    emptyTitle: "No recipes yet",
    emptyBody: "Tap “Add recipe” to type one in, or “From URL” to paste a recipe page address. Everything stays on this device.",
    addRecipe: "Add recipe",
    fromUrl: "From URL",
    urlLabel: "Recipe page address",
    urlPlaceholder: "https://…",
    extract: "Extract",
    extracting: "Extracting…",
    extractOk: "Ingredients and steps pulled in. Check them, then save.",
    extractOkNoPhoto: "Pulled in. The photo could not be fetched, so add one yourself.",
    extractFailBlocked: "This site blocks extraction (NYT, AllRecipes and others). Paste the ingredients and steps below or type them in.",
    extractFailNoRecipe: "No recipe data found on that page. Paste the ingredients and steps or type them in.",
    extractFailBadUrl: "Only a public http(s) page address works here.",
    extractFailFetch: "Could not fetch that page. Check the address or carry on by pasting.",
    extractHelp: "Only pages that publish recipe data (schema.org) can be extracted. Some sites (NYT, AllRecipes and others) block it, so you fall back to paste or manual entry.",
    noSocialImport: "No Instagram or TikTok auto-import. Paste the caption and keep a screenshot as the photo.",
    formNewTitle: "New recipe",
    formEditTitle: "Edit recipe",
    fieldTitle: "Title",
    titlePlaceholder: "e.g. Kimchi fried rice",
    titleRequired: "Give it a title.",
    fieldPhoto: "Photo",
    choosePhoto: "Choose photo",
    changePhoto: "Change photo",
    removePhoto: "Remove photo",
    photoNote: "Photos are compressed and stored on this device only. Text inside a photo is not read, so paste ingredients and steps as text.",
    photoFailed: "That image could not be opened.",
    fieldPrep: "Prep",
    fieldCook: "Cook",
    fieldTotal: "Total",
    minutesShort: "min",
    fieldServings: "Base servings",
    fieldTags: "Tags",
    tagsPlaceholder: "Comma separated: weeknight, 15 min, lunchbox",
    fieldNotes: "Notes",
    notesPlaceholder: "Where it came from, what you changed, next time…",
    fieldIngredients: "Ingredients (one per line)",
    ingredientsPlaceholder: "2 cups cooked rice\n1/2 cup kimchi\n1 tbsp sesame oil",
    fieldSteps: "Steps (one per line)",
    stepsPlaceholder: "Heat the pan\nFry the kimchi\nAdd rice and toss",
    fieldSource: "Source URL (optional)",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    deleteConfirmTitle: "Delete this recipe?",
    deleteConfirmBody: "It is removed from this device only and cannot be undone.",
    saved: "Saved.",
    deleted: "Deleted.",
    prepShort: "Prep {n} min",
    cookShort: "Cook {n} min",
    totalShort: "{n} min",
    servingsLabel: "Servings",
    servingsValue: "{n} servings",
    scaleNote: "Only ingredients that start with a number are scaled. Free-text ingredients stay as written.",
    ingredientsHeading: "Ingredients",
    stepsHeading: "Steps",
    notesHeading: "Notes",
    openSource: "Open source page",
    cookMode: "Cook mode",
    cookStep: "Step {n} of {total}",
    prev: "Back",
    next: "Next",
    finish: "Finish",
    timer: "Timer",
    timerStart: "Start",
    timerPause: "Pause",
    timerReset: "Reset",
    timerDone: "Time is up!",
    timerMinutes: "min",
    shopping: "Shopping list",
    shoppingBody: "Use “Add to shopping list” on a recipe to collect ingredients, then tick them off in the store.",
    shoppingAdd: "Add to shopping list",
    shoppingAdded: "{n} ingredients added to the shopping list.",
    shoppingEmpty: "The shopping list is empty.",
    shoppingClearChecked: "Remove ticked",
    shoppingClearAll: "Clear all",
    shoppingCopy: "Copy list",
    shoppingCopied: "Copied.",
    shoppingAddItem: "Add",
    shoppingItemPlaceholder: "Add an item…",
    backup: "Backup",
    backupBody: "Export every recipe (photos included) to a JSON file, or import one. With no login to lose, this is how you move devices or recover after browser data is cleared.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exportDone: "Exported.",
    exportEmpty: "No recipes to export.",
    importDone: "Imported {n} recipes.",
    importFail: "That file cannot be imported.",
    clearAll: "Delete all",
    clearConfirmTitle: "Delete every recipe?",
    clearConfirmBody: "Recipes and the shopping list on this device are removed. Export to JSON first.",
    cleared: "Everything cleared.",
    fontSizeLabel: "Text size",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    chipNoWipe: "No login wipe (JSON export)",
    chipNoCatalog: "No catalog lock",
    chipNoAds: "No ads after pay",
    chipManual: "Manual+URL+photo (no IG/TikTok auto)",
    chipFree: "Free",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    about:
      "Recipes you saved on TikTok, Instagram, blogs and email end up in one screen. Write the title, photo, time, tags, notes, ingredients and steps, save, and it stays on this device. Paste a public recipe page address and the ingredients and steps are pulled in; blocked sites fall back to paste. Change servings and numeric ingredients follow.",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "レシピログ",
    shortName: "レシピログ",
    tagline: "無料のローカルレシピ保管庫。タイトル・写真・時間・タグとメモをひとつに。アカウント不要。",
    metaDescription:
      "TikTok・Instagram・ブログ・メールに散らばったレシピをひとつに。タイトル、写真、調理時間、タグ、メモ、材料、手順をこの端末だけに保存。URLを貼って材料と手順を取り込み、人数を調整、JSONでバックアップ。アカウント不要、広告なし、無料。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    searchLabel: "検索",
    searchPlaceholder: "タイトル・タグ・メモ・材料を検索",
    searchNoMatch: "一致するレシピがありません。",
    recipesCount: "レシピ {n} 件",
    emptyTitle: "まだレシピがありません",
    emptyBody: "「レシピを追加」で書き込むか、「URLから取り込む」にレシピページのアドレスを貼り付けてください。すべてこの端末にだけ残ります。",
    addRecipe: "レシピを追加",
    fromUrl: "URLから取り込む",
    urlLabel: "レシピページのアドレス",
    urlPlaceholder: "https://…",
    extract: "取り込む",
    extracting: "取り込み中…",
    extractOk: "材料と手順を取り込みました。確認して保存してください。",
    extractOkNoPhoto: "取り込みました。写真は取得できなかったので、ご自身で追加してください。",
    extractFailBlocked: "このサイトは取り込みをブロックしています（NYT、AllRecipes など）。下に材料と手順を貼り付けるか、直接入力してください。",
    extractFailNoRecipe: "このページにレシピデータが見つかりません。材料と手順を貼り付けるか、直接入力してください。",
    extractFailBadUrl: "http(s) で始まる公開ページのアドレスだけ使えます。",
    extractFailFetch: "ページを取得できませんでした。アドレスを確認するか、貼り付けで進めてください。",
    extractHelp: "レシピデータ（schema.org）を公開しているページだけ取り込めます。一部のサイト（NYT、AllRecipes など）はブロックされているため、貼り付けか手入力に切り替えます。",
    noSocialImport: "Instagram・TikTok の自動取り込みはありません。キャプションを貼り付け、スクリーンショットを写真として残してください。",
    formNewTitle: "新しいレシピ",
    formEditTitle: "レシピを編集",
    fieldTitle: "タイトル",
    titlePlaceholder: "例: キムチチャーハン",
    titleRequired: "タイトルを入れてください。",
    fieldPhoto: "写真",
    choosePhoto: "写真を選ぶ",
    changePhoto: "写真を変える",
    removePhoto: "写真を削除",
    photoNote: "写真は圧縮してこの端末にだけ保存します。写真の中の文字は読み取らないので、材料と手順は文字で貼り付けてください。",
    photoFailed: "この画像は開けません。",
    fieldPrep: "準備",
    fieldCook: "調理",
    fieldTotal: "合計",
    minutesShort: "分",
    fieldServings: "基準の人数",
    fieldTags: "タグ",
    tagsPlaceholder: "カンマ区切り: 平日, 15分, お弁当",
    fieldNotes: "メモ",
    notesPlaceholder: "出典、変えたところ、次はこうする…",
    fieldIngredients: "材料（1行に1つ）",
    ingredientsPlaceholder: "ご飯 2カップ\nキムチ 1/2カップ\nごま油 大さじ1",
    fieldSteps: "手順（1行に1つ）",
    stepsPlaceholder: "フライパンを熱する\nキムチを炒める\nご飯を加えて混ぜる",
    fieldSource: "出典URL（任意）",
    save: "保存",
    cancel: "キャンセル",
    close: "閉じる",
    delete: "削除",
    edit: "編集",
    deleteConfirmTitle: "このレシピを削除しますか？",
    deleteConfirmBody: "この端末からだけ消え、元に戻せません。",
    saved: "保存しました。",
    deleted: "削除しました。",
    prepShort: "準備 {n}分",
    cookShort: "調理 {n}分",
    totalShort: "{n}分",
    servingsLabel: "人数",
    servingsValue: "{n}人分",
    scaleNote: "数字で始まる材料だけ人数に合わせて計算します。文字だけの材料はそのままです。",
    ingredientsHeading: "材料",
    stepsHeading: "手順",
    notesHeading: "メモ",
    openSource: "元のページを開く",
    cookMode: "調理モード",
    cookStep: "手順 {n} / {total}",
    prev: "戻る",
    next: "次へ",
    finish: "完了",
    timer: "タイマー",
    timerStart: "開始",
    timerPause: "一時停止",
    timerReset: "リセット",
    timerDone: "時間です！",
    timerMinutes: "分",
    shopping: "買い物リスト",
    shoppingBody: "レシピ画面の「買い物リストに追加」で材料を集め、店でチェックしながら買います。",
    shoppingAdd: "買い物リストに追加",
    shoppingAdded: "材料 {n} 件を買い物リストに追加しました。",
    shoppingEmpty: "買い物リストは空です。",
    shoppingClearChecked: "チェック済みを消す",
    shoppingClearAll: "すべて消す",
    shoppingCopy: "リストをコピー",
    shoppingCopied: "コピーしました。",
    shoppingAddItem: "追加",
    shoppingItemPlaceholder: "手で追加…",
    backup: "バックアップ",
    backupBody: "すべてのレシピ（写真込み）をJSONファイルに書き出す・読み込みます。ログインがない代わりに、端末を替えるときやブラウザのデータが消えたときはこれで戻します。",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    exportDone: "書き出しました。",
    exportEmpty: "書き出すレシピがありません。",
    importDone: "レシピ {n} 件を読み込みました。",
    importFail: "そのファイルは読み込めません。",
    clearAll: "すべて削除",
    clearConfirmTitle: "すべてのレシピを削除しますか？",
    clearConfirmBody: "この端末のレシピと買い物リストが消えます。先にJSONを書き出してください。",
    cleared: "すべて消しました。",
    fontSizeLabel: "文字サイズ",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    chipNoWipe: "ログイン消失なし（JSON書き出し）",
    chipNoCatalog: "件数制限なし",
    chipNoAds: "支払い後の広告なし",
    chipManual: "手入力・URL・写真（IG/TikTok自動なし）",
    chipFree: "無料",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    about:
      "TikTok・Instagram・ブログ・メールに散らばったレシピを1画面にまとめます。タイトル、写真、時間、タグ、メモ、材料、手順を書いて保存すると、この端末にだけ残ります。公開レシピページのアドレスを貼ると材料と手順を取り込み、ブロックされたサイトは貼り付けで続けます。人数を変えると数字の材料が追って計算されます。",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "食谱日志",
    shortName: "食谱日志",
    tagline: "免费本地食谱库。标题、照片、时间、标签和笔记集中一处。无需账号。",
    metaDescription:
      "把散落在 TikTok、Instagram、博客和邮件里的食谱收进一处。标题、照片、烹饪时间、标签、笔记、食材和步骤只保存在此设备。粘贴网址可提取食材和步骤，可调整份数，可导出 JSON 备份。无需账号，无广告，免费。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    searchLabel: "搜索",
    searchPlaceholder: "搜索标题、标签、笔记、食材",
    searchNoMatch: "没有匹配的食谱。",
    recipesCount: "{n} 份食谱",
    emptyTitle: "还没有食谱",
    emptyBody: "点“添加食谱”手动录入，或点“从网址导入”粘贴食谱页面地址。一切都只留在此设备。",
    addRecipe: "添加食谱",
    fromUrl: "从网址导入",
    urlLabel: "食谱页面地址",
    urlPlaceholder: "https://…",
    extract: "提取",
    extracting: "提取中…",
    extractOk: "已提取食材和步骤。请检查后保存。",
    extractOkNoPhoto: "已提取。照片未能获取，请自行添加。",
    extractFailBlocked: "该网站阻止提取（NYT、AllRecipes 等）。请在下方粘贴食材和步骤，或手动输入。",
    extractFailNoRecipe: "该页面没有找到食谱数据。请粘贴食材和步骤，或手动输入。",
    extractFailBadUrl: "只支持以 http(s) 开头的公开页面地址。",
    extractFailFetch: "无法获取该页面。请检查地址，或改用粘贴。",
    extractHelp: "只有公开了食谱数据（schema.org）的页面才能提取。部分网站（NYT、AllRecipes 等）会阻止，此时改为粘贴或手动输入。",
    noSocialImport: "没有 Instagram / TikTok 自动导入。请粘贴文案，并把截图作为照片保存。",
    formNewTitle: "新食谱",
    formEditTitle: "编辑食谱",
    fieldTitle: "标题",
    titlePlaceholder: "例如：泡菜炒饭",
    titleRequired: "请填写标题。",
    fieldPhoto: "照片",
    choosePhoto: "选择照片",
    changePhoto: "更换照片",
    removePhoto: "移除照片",
    photoNote: "照片会压缩后只保存在此设备。不会识别照片里的文字，食材和步骤请以文字粘贴。",
    photoFailed: "无法打开这张图片。",
    fieldPrep: "准备",
    fieldCook: "烹饪",
    fieldTotal: "总计",
    minutesShort: "分钟",
    fieldServings: "基准份数",
    fieldTags: "标签",
    tagsPlaceholder: "逗号分隔：家常, 15分钟, 便当",
    fieldNotes: "笔记",
    notesPlaceholder: "来源、改动、下次这样做…",
    fieldIngredients: "食材（每行一项）",
    ingredientsPlaceholder: "2杯 米饭\n1/2杯 泡菜\n1大勺 香油",
    fieldSteps: "步骤（每行一步）",
    stepsPlaceholder: "热锅\n炒泡菜\n加入米饭翻炒",
    fieldSource: "来源网址（可选）",
    save: "保存",
    cancel: "取消",
    close: "关闭",
    delete: "删除",
    edit: "编辑",
    deleteConfirmTitle: "删除这份食谱？",
    deleteConfirmBody: "只从此设备删除，无法撤销。",
    saved: "已保存。",
    deleted: "已删除。",
    prepShort: "准备 {n} 分钟",
    cookShort: "烹饪 {n} 分钟",
    totalShort: "{n} 分钟",
    servingsLabel: "份数",
    servingsValue: "{n} 份",
    scaleNote: "只有以数字开头的食材会按份数换算。纯文字的食材保持原样。",
    ingredientsHeading: "食材",
    stepsHeading: "步骤",
    notesHeading: "笔记",
    openSource: "打开来源页面",
    cookMode: "烹饪模式",
    cookStep: "第 {n} / {total} 步",
    prev: "上一步",
    next: "下一步",
    finish: "完成",
    timer: "计时器",
    timerStart: "开始",
    timerPause: "暂停",
    timerReset: "重置",
    timerDone: "时间到！",
    timerMinutes: "分钟",
    shopping: "购物清单",
    shoppingBody: "在食谱页面点“加入购物清单”收集食材，逛店时边买边勾。",
    shoppingAdd: "加入购物清单",
    shoppingAdded: "已把 {n} 项食材加入购物清单。",
    shoppingEmpty: "购物清单是空的。",
    shoppingClearChecked: "移除已勾选",
    shoppingClearAll: "全部清空",
    shoppingCopy: "复制清单",
    shoppingCopied: "已复制。",
    shoppingAddItem: "添加",
    shoppingItemPlaceholder: "手动添加…",
    backup: "备份",
    backupBody: "把全部食谱（含照片）导出为 JSON 文件，或从文件导入。没有登录可丢，换设备或浏览器数据被清除时就靠它恢复。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    exportDone: "已导出。",
    exportEmpty: "没有可导出的食谱。",
    importDone: "已导入 {n} 份食谱。",
    importFail: "无法导入该文件。",
    clearAll: "全部删除",
    clearConfirmTitle: "删除所有食谱？",
    clearConfirmBody: "此设备上的食谱和购物清单都会被删除。请先导出 JSON。",
    cleared: "已全部清空。",
    fontSizeLabel: "字号",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    chipNoWipe: "不会因登录丢数据（JSON 导出）",
    chipNoCatalog: "无数量上限",
    chipNoAds: "付费后无广告",
    chipManual: "手动+网址+照片（无 IG/TikTok 自动）",
    chipFree: "免费",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    about:
      "把存在 TikTok、Instagram、博客和邮件里的食谱收进一个页面。写下标题、照片、时间、标签、笔记、食材和步骤，保存后只留在此设备。粘贴公开食谱页面地址即可提取食材和步骤，被阻止的网站改用粘贴。调整份数时，数字食材会跟着换算。",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
  },
};

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://recipelog.try-dabble.com/og-image-ko.png",
  en: "https://recipelog.try-dabble.com/og-image-en.png",
  ja: "https://recipelog.try-dabble.com/og-image-ja.png",
  zh: "https://recipelog.try-dabble.com/og-image-zh.png",
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
