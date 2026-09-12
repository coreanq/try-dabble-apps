/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "affirmpad:lang";

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

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "darkMode"
  | "lightMode"
  | "soundOn"
  | "soundOff"
  | "vibeOn"
  | "vibeOff"
  | "practiceTitle"
  | "practiceEmptyTitle"
  | "practiceEmptyBody"
  | "tap"
  | "undo"
  | "resetCount"
  | "countLabel"
  | "goalOf"
  | "goalReached"
  | "fullscreen"
  | "exitFullscreen"
  | "prevAffirmation"
  | "nextAffirmation"
  | "practicedTimes"
  | "filterAll"
  | "filterFavorites"
  | "listTitle"
  | "noAffirmationsTitle"
  | "noAffirmationsBody"
  | "noFavoritesTitle"
  | "noFavoritesBody"
  | "noInCategory"
  | "addAffirmation"
  | "newAffirmationTitle"
  | "editAffirmationTitle"
  | "textLabel"
  | "textPlaceholder"
  | "categoryLabel"
  | "noCategory"
  | "favorite"
  | "unfavorite"
  | "practiceThis"
  | "edit"
  | "delete"
  | "cancel"
  | "save"
  | "affirmationSaved"
  | "affirmationDeleted"
  | "deleteAffirmationTitle"
  | "deleteAffirmationBody"
  | "needText"
  | "categoriesTitle"
  | "manageCategories"
  | "addCategory"
  | "newCategoryTitle"
  | "editCategoryTitle"
  | "nameLabel"
  | "namePlaceholder"
  | "categorySaved"
  | "categoryDeleted"
  | "deleteCategory"
  | "deleteCategoryTitle"
  | "deleteCategoryBody"
  | "noCategories"
  | "categoriesFreeHint"
  | "settingsTitle"
  | "dailyGoalLabel"
  | "dailyGoalHint"
  | "fontSize"
  | "fontMd"
  | "fontLg"
  | "fontXl"
  | "backupTitle"
  | "backupBody"
  | "exportJson"
  | "importJson"
  | "exported"
  | "importBad"
  | "importOk"
  | "importConfirmTitle"
  | "importConfirmBody"
  | "clearAll"
  | "clearAllTitle"
  | "clearAllBody"
  | "cleared"
  | "chipNoTrap"
  | "chipNoCancelWall"
  | "chipCategoriesFree"
  | "chipNoAdsPractice"
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
    title: "어펌패드",
    shortName: "어펌패드",
    tagline: "무료 로컬 확언 연습. 맞춤 주제, 전체화면 탭 카운트, 즐겨찾기, 다크 모드, JSON 백업. 계정 없음. 구독 없음.",
    metaDescription:
      "계정 없는 무료 확언 연습 패드. 나만의 확언과 주제를 적고, 전체화면으로 한 문장을 크게 띄운 채 탭으로 반복 횟수를 세세요. 실수는 되돌리기, 마음에 드는 문장은 즐겨찾기, 밤에는 다크 모드. 무료 체험 후 연 $47 같은 함정도, 해지 장벽도, 광고도 없습니다. JSON 백업. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. 구독·광고 없음.",
    langLabel: "언어",
    darkMode: "다크 모드",
    lightMode: "라이트 모드",
    soundOn: "소리 켜짐",
    soundOff: "소리 꺼짐",
    vibeOn: "진동 켜짐",
    vibeOff: "진동 꺼짐",
    practiceTitle: "연습",
    practiceEmptyTitle: "연습할 확언을 고르세요",
    practiceEmptyBody: "아래 목록에서 문장을 누르거나 새 확언을 추가하세요.",
    tap: "탭",
    undo: "되돌리기",
    resetCount: "0으로",
    countLabel: "반복",
    goalOf: "목표 {goal}회",
    goalReached: "오늘 목표 달성!",
    fullscreen: "전체화면",
    exitFullscreen: "나가기",
    prevAffirmation: "이전 확언",
    nextAffirmation: "다음 확언",
    practicedTimes: "누적 {n}회",
    filterAll: "전체",
    filterFavorites: "즐겨찾기",
    listTitle: "내 확언",
    noAffirmationsTitle: "아직 확언이 없습니다",
    noAffirmationsBody: "‘확언 추가’로 나만의 문장을 적어 보세요. 짧고 현재형이면 좋습니다.",
    noFavoritesTitle: "즐겨찾기가 비어 있습니다",
    noFavoritesBody: "문장 옆의 별을 눌러 즐겨찾기에 담으세요.",
    noInCategory: "이 주제에는 아직 확언이 없습니다.",
    addAffirmation: "확언 추가",
    newAffirmationTitle: "새 확언",
    editAffirmationTitle: "확언 편집",
    textLabel: "문장",
    textPlaceholder: "예: 나는 오늘 충분히 잘하고 있다.",
    categoryLabel: "주제",
    noCategory: "주제 없음",
    favorite: "즐겨찾기에 추가",
    unfavorite: "즐겨찾기 해제",
    practiceThis: "연습하기",
    edit: "편집",
    delete: "삭제",
    cancel: "취소",
    save: "저장",
    affirmationSaved: "확언을 저장했습니다",
    affirmationDeleted: "확언을 삭제했습니다",
    deleteAffirmationTitle: "이 확언을 삭제할까요?",
    deleteAffirmationBody: "삭제한 문장은 되돌릴 수 없습니다.",
    needText: "문장을 입력하세요",
    categoriesTitle: "주제",
    manageCategories: "주제 관리",
    addCategory: "주제 추가",
    newCategoryTitle: "새 주제",
    editCategoryTitle: "주제 편집",
    nameLabel: "이름",
    namePlaceholder: "예: 자신감, 감사, 평온",
    categorySaved: "주제를 저장했습니다",
    categoryDeleted: "주제를 삭제했습니다",
    deleteCategory: "주제 삭제",
    deleteCategoryTitle: "‘{name}’ 주제를 삭제할까요?",
    deleteCategoryBody: "이 주제의 확언 {count}개는 ‘주제 없음’으로 남습니다.",
    noCategories: "아직 주제가 없습니다. 원하는 만큼 만들 수 있고 전부 무료입니다.",
    categoriesFreeHint: "주제는 개수 제한 없이 무료입니다. 결제 후 열리는 항목이 없습니다.",
    settingsTitle: "설정",
    dailyGoalLabel: "세션 목표",
    dailyGoalHint: "한 확언을 몇 번 반복할지. 진행 바에만 쓰입니다.",
    fontSize: "글자 크기",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "백업",
    backupBody: "확언, 주제, 설정을 JSON 한 파일로. 재설치나 새 폰에서도 ‘JSON 가져오기’로 그대로 돌아옵니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    exported: "파일을 내보냈습니다",
    importBad: "어펌패드 백업 파일이 아닙니다",
    importOk: "확언 {a}개, 주제 {c}개를 가져왔습니다",
    importConfirmTitle: "가져온 내용으로 바꿀까요?",
    importConfirmBody: "지금 있는 확언과 주제가 파일 내용으로 교체됩니다.",
    clearAll: "모든 데이터 삭제",
    clearAllTitle: "모든 데이터를 지울까요?",
    clearAllBody: "확언, 주제, 연습 기록이 이 기기에서 지워집니다. 먼저 JSON으로 내보내 두세요.",
    cleared: "모두 삭제했습니다",
    chipNoTrap: "연 $47 함정 없음",
    chipNoCancelWall: "해지 장벽 없음",
    chipCategoriesFree: "모든 주제 무료",
    chipNoAdsPractice: "연습 중 광고 없음",
    chipFree: "영원히 무료",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    about:
      "어펌패드는 확언을 소리 내어 반복하는 연습을 위한 작은 패드입니다. 문장을 적고, 전체화면으로 띄운 채 한 번 말할 때마다 탭하세요. 계정도 구독도 없고, 잠긴 기능도 없습니다.",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Affirmpad",
    shortName: "Affirmpad",
    tagline: "Free local affirmation practice. Custom topics, fullscreen tap count, favorites, dark mode, JSON backup. No account. No subscription.",
    metaDescription:
      "Free affirmation practice pad with no account. Write your own affirmations and topics, put one sentence up fullscreen and tap once per repetition. Undo a slip, star the lines you love, switch to dark mode at night. No free-trial-then-$47-a-year trap, no cancel wall, no ads. JSON backup. Data stays on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers. No subscription. No ads.",
    langLabel: "Language",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    soundOn: "Sound on",
    soundOff: "Sound off",
    vibeOn: "Vibration on",
    vibeOff: "Vibration off",
    practiceTitle: "Practice",
    practiceEmptyTitle: "Pick an affirmation to practice",
    practiceEmptyBody: "Tap a line in the list below, or add a new one.",
    tap: "Tap",
    undo: "Undo",
    resetCount: "Reset",
    countLabel: "reps",
    goalOf: "Goal {goal}",
    goalReached: "Goal reached!",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit",
    prevAffirmation: "Previous affirmation",
    nextAffirmation: "Next affirmation",
    practicedTimes: "{n} total",
    filterAll: "All",
    filterFavorites: "Favorites",
    listTitle: "My affirmations",
    noAffirmationsTitle: "No affirmations yet",
    noAffirmationsBody: "Tap “Add affirmation” and write one in your own words. Short and present tense works best.",
    noFavoritesTitle: "No favorites yet",
    noFavoritesBody: "Tap the star next to a line to keep it here.",
    noInCategory: "No affirmations in this topic yet.",
    addAffirmation: "Add affirmation",
    newAffirmationTitle: "New affirmation",
    editAffirmationTitle: "Edit affirmation",
    textLabel: "Text",
    textPlaceholder: "e.g. I am doing enough today.",
    categoryLabel: "Topic",
    noCategory: "No topic",
    favorite: "Add to favorites",
    unfavorite: "Remove from favorites",
    practiceThis: "Practice",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    affirmationSaved: "Affirmation saved",
    affirmationDeleted: "Affirmation deleted",
    deleteAffirmationTitle: "Delete this affirmation?",
    deleteAffirmationBody: "A deleted line cannot be brought back.",
    needText: "Write a sentence first",
    categoriesTitle: "Topics",
    manageCategories: "Manage topics",
    addCategory: "Add topic",
    newCategoryTitle: "New topic",
    editCategoryTitle: "Edit topic",
    nameLabel: "Name",
    namePlaceholder: "e.g. Confidence, Gratitude, Calm",
    categorySaved: "Topic saved",
    categoryDeleted: "Topic deleted",
    deleteCategory: "Delete topic",
    deleteCategoryTitle: "Delete the “{name}” topic?",
    deleteCategoryBody: "Its {count} affirmations stay, filed under “No topic”.",
    noCategories: "No topics yet. Make as many as you like; they are all free.",
    categoriesFreeHint: "Unlimited topics, all free. Nothing unlocks after a payment.",
    settingsTitle: "Settings",
    dailyGoalLabel: "Session goal",
    dailyGoalHint: "How many repetitions of one affirmation. Only drives the progress bar.",
    fontSize: "Text size",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "Backup",
    backupBody: "One JSON file with every affirmation, topic and setting. After a reinstall or on a new phone, “Import JSON” brings it all back.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exported: "File exported",
    importBad: "That is not an Affirmpad backup file",
    importOk: "Imported {a} affirmations and {c} topics",
    importConfirmTitle: "Replace with the imported data?",
    importConfirmBody: "Your current affirmations and topics will be replaced by the file.",
    clearAll: "Delete all data",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Affirmations, topics and practice counts are removed from this device. Export JSON first if you want to keep them.",
    cleared: "Everything deleted",
    chipNoTrap: "No $47/yr trap",
    chipNoCancelWall: "No cancel wall",
    chipCategoriesFree: "All categories free",
    chipNoAdsPractice: "No ads in practice",
    chipFree: "Free forever",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    about:
      "Affirmpad is a small pad for repeating affirmations out loud. Write a line, put it up fullscreen and tap once each time you say it. There is no account, no subscription and nothing locked.",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "アファームパッド",
    shortName: "アファームパッド",
    tagline: "無料のローカルアファメーション練習。カスタムトピック、全画面タップカウント、お気に入り、ダークモード、JSONバックアップ。アカウント不要。サブスクなし。",
    metaDescription:
      "アカウント不要の無料アファメーション練習パッド。自分の言葉でアファメーションとトピックを書き、一文を全画面に大きく出して、唱えるたびにタップして回数を数えます。間違えたら取り消し、好きな文はお気に入り、夜はダークモード。無料トライアル後に年$47の罠も、解約の壁も、広告もありません。JSONバックアップ。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。サブスク・広告なし。",
    langLabel: "言語",
    darkMode: "ダークモード",
    lightMode: "ライトモード",
    soundOn: "サウンドON",
    soundOff: "サウンドOFF",
    vibeOn: "バイブON",
    vibeOff: "バイブOFF",
    practiceTitle: "練習",
    practiceEmptyTitle: "練習するアファメーションを選んでください",
    practiceEmptyBody: "下の一覧から文をタップするか、新しく追加してください。",
    tap: "タップ",
    undo: "取り消し",
    resetCount: "リセット",
    countLabel: "回",
    goalOf: "目標 {goal}回",
    goalReached: "目標達成！",
    fullscreen: "全画面",
    exitFullscreen: "終了",
    prevAffirmation: "前のアファメーション",
    nextAffirmation: "次のアファメーション",
    practicedTimes: "累計 {n}回",
    filterAll: "すべて",
    filterFavorites: "お気に入り",
    listTitle: "マイアファメーション",
    noAffirmationsTitle: "まだアファメーションがありません",
    noAffirmationsBody: "「アファメーションを追加」から自分の言葉で書いてみましょう。短く現在形がおすすめです。",
    noFavoritesTitle: "お気に入りはまだありません",
    noFavoritesBody: "文の横の星をタップするとここに残ります。",
    noInCategory: "このトピックにはまだアファメーションがありません。",
    addAffirmation: "アファメーションを追加",
    newAffirmationTitle: "新しいアファメーション",
    editAffirmationTitle: "アファメーションを編集",
    textLabel: "文",
    textPlaceholder: "例: 私は今日、十分にやれている。",
    categoryLabel: "トピック",
    noCategory: "トピックなし",
    favorite: "お気に入りに追加",
    unfavorite: "お気に入りから外す",
    practiceThis: "練習する",
    edit: "編集",
    delete: "削除",
    cancel: "キャンセル",
    save: "保存",
    affirmationSaved: "アファメーションを保存しました",
    affirmationDeleted: "アファメーションを削除しました",
    deleteAffirmationTitle: "このアファメーションを削除しますか？",
    deleteAffirmationBody: "削除した文は元に戻せません。",
    needText: "文を入力してください",
    categoriesTitle: "トピック",
    manageCategories: "トピックを管理",
    addCategory: "トピックを追加",
    newCategoryTitle: "新しいトピック",
    editCategoryTitle: "トピックを編集",
    nameLabel: "名前",
    namePlaceholder: "例: 自信、感謝、落ち着き",
    categorySaved: "トピックを保存しました",
    categoryDeleted: "トピックを削除しました",
    deleteCategory: "トピックを削除",
    deleteCategoryTitle: "トピック「{name}」を削除しますか？",
    deleteCategoryBody: "このトピックの{count}件のアファメーションは「トピックなし」として残ります。",
    noCategories: "まだトピックがありません。いくつでも作れて、すべて無料です。",
    categoriesFreeHint: "トピックは数に制限なく無料。支払い後に開くものはありません。",
    settingsTitle: "設定",
    dailyGoalLabel: "セッション目標",
    dailyGoalHint: "一つのアファメーションを何回繰り返すか。進捗バーにだけ使います。",
    fontSize: "文字サイズ",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "バックアップ",
    backupBody: "アファメーション・トピック・設定をJSON一つに。再インストールや新しい端末でも「JSONを読み込む」でそのまま戻ります。",
    exportJson: "JSON書き出し",
    importJson: "JSONを読み込む",
    exported: "ファイルを書き出しました",
    importBad: "アファームパッドのバックアップファイルではありません",
    importOk: "アファメーション{a}件、トピック{c}件を読み込みました",
    importConfirmTitle: "読み込んだ内容に置き換えますか？",
    importConfirmBody: "今あるアファメーションとトピックがファイルの内容に置き換わります。",
    clearAll: "すべてのデータを削除",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "アファメーション、トピック、練習回数がこの端末から消えます。残したい場合は先にJSONで書き出してください。",
    cleared: "すべて削除しました",
    chipNoTrap: "年$47の罠なし",
    chipNoCancelWall: "解約の壁なし",
    chipCategoriesFree: "全カテゴリ無料",
    chipNoAdsPractice: "練習中の広告なし",
    chipFree: "ずっと無料",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    about:
      "アファームパッドは、アファメーションを声に出して繰り返す練習のための小さなパッドです。文を書き、全画面に出して、唱えるたびにタップしてください。アカウントもサブスクもなく、ロックされた機能もありません。",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "肯定练习板",
    shortName: "肯定练习板",
    tagline: "免费本地肯定语练习。自定义主题、全屏点按计数、收藏、深色模式、JSON 备份。无需账号。无订阅。",
    metaDescription:
      "无需账号的免费肯定语练习板。用自己的话写下肯定语和主题，把一句话全屏放大，每念一遍点按一次计数。按错了可撤销，喜欢的句子加收藏，晚上切深色模式。没有“免费试用后每年 $47”的陷阱，没有取消壁垒，没有广告。JSON 备份。数据仅保存在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。无订阅、无广告。",
    langLabel: "语言",
    darkMode: "深色模式",
    lightMode: "浅色模式",
    soundOn: "声音开",
    soundOff: "声音关",
    vibeOn: "震动开",
    vibeOff: "震动关",
    practiceTitle: "练习",
    practiceEmptyTitle: "选一句肯定语开始练习",
    practiceEmptyBody: "点下方列表里的句子，或添加一句新的。",
    tap: "点按",
    undo: "撤销",
    resetCount: "归零",
    countLabel: "次",
    goalOf: "目标 {goal} 次",
    goalReached: "达成目标！",
    fullscreen: "全屏",
    exitFullscreen: "退出",
    prevAffirmation: "上一句",
    nextAffirmation: "下一句",
    practicedTimes: "累计 {n} 次",
    filterAll: "全部",
    filterFavorites: "收藏",
    listTitle: "我的肯定语",
    noAffirmationsTitle: "还没有肯定语",
    noAffirmationsBody: "点“添加肯定语”，用自己的话写一句。简短、现在时最好。",
    noFavoritesTitle: "还没有收藏",
    noFavoritesBody: "点句子旁的星星，就会留在这里。",
    noInCategory: "这个主题下还没有肯定语。",
    addAffirmation: "添加肯定语",
    newAffirmationTitle: "新肯定语",
    editAffirmationTitle: "编辑肯定语",
    textLabel: "句子",
    textPlaceholder: "例如：我今天已经做得足够好。",
    categoryLabel: "主题",
    noCategory: "无主题",
    favorite: "加入收藏",
    unfavorite: "取消收藏",
    practiceThis: "练习",
    edit: "编辑",
    delete: "删除",
    cancel: "取消",
    save: "保存",
    affirmationSaved: "已保存肯定语",
    affirmationDeleted: "已删除肯定语",
    deleteAffirmationTitle: "删除这句肯定语？",
    deleteAffirmationBody: "删除后无法恢复。",
    needText: "请先写一句话",
    categoriesTitle: "主题",
    manageCategories: "管理主题",
    addCategory: "添加主题",
    newCategoryTitle: "新主题",
    editCategoryTitle: "编辑主题",
    nameLabel: "名称",
    namePlaceholder: "例如：自信、感恩、平静",
    categorySaved: "已保存主题",
    categoryDeleted: "已删除主题",
    deleteCategory: "删除主题",
    deleteCategoryTitle: "删除“{name}”主题？",
    deleteCategoryBody: "该主题下的 {count} 句肯定语会保留，归入“无主题”。",
    noCategories: "还没有主题。想建多少建多少，全部免费。",
    categoriesFreeHint: "主题数量不限，全部免费。没有付费后才解锁的内容。",
    settingsTitle: "设置",
    dailyGoalLabel: "每轮目标",
    dailyGoalHint: "一句肯定语重复多少次。只用于进度条。",
    fontSize: "字号",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "备份",
    backupBody: "把所有肯定语、主题和设置存成一个 JSON 文件。重装或换新手机后，“导入 JSON”即可全部找回。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    exported: "文件已导出",
    importBad: "这不是肯定练习板的备份文件",
    importOk: "已导入 {a} 句肯定语、{c} 个主题",
    importConfirmTitle: "用导入的数据替换？",
    importConfirmBody: "当前的肯定语和主题将被文件内容替换。",
    clearAll: "删除全部数据",
    clearAllTitle: "删除全部？",
    clearAllBody: "肯定语、主题和练习次数将从此设备删除。想保留请先导出 JSON。",
    cleared: "已全部删除",
    chipNoTrap: "无每年 $47 陷阱",
    chipNoCancelWall: "无取消壁垒",
    chipCategoriesFree: "所有分类免费",
    chipNoAdsPractice: "练习中无广告",
    chipFree: "永久免费",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    about:
      "肯定练习板是一个用来大声重复肯定语的小工具。写下一句话，全屏放大，每念一遍点按一次。没有账号，没有订阅，没有任何锁定的功能。",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
  },
};

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://affirmpad.try-dabble.com/og-image-ko.png",
  en: "https://affirmpad.try-dabble.com/og-image-en.png",
  ja: "https://affirmpad.try-dabble.com/og-image-ja.png",
  zh: "https://affirmpad.try-dabble.com/og-image-zh.png",
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
