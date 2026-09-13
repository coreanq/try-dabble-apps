/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "gymac:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://gymac.try-dabble.com/og-image-ko.png",
  en: "https://gymac.try-dabble.com/og-image-en.png",
  ja: "https://gymac.try-dabble.com/og-image-ja.png",
  zh: "https://gymac.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipNoLogin"
  | "chipNoLock"
  | "chipHistoryFree"
  | "chipBackup"
  | "chipNoAds"
  | "chipLocal"
  | "chipLangs"
  | "prevDay"
  | "nextDay"
  | "today"
  | "workoutTitle"
  | "startWorkout"
  | "workoutNamePlaceholder"
  | "noWorkoutYet"
  | "noWorkoutHint"
  | "addExercise"
  | "exerciseNamePlaceholder"
  | "setLabel"
  | "weightLabel"
  | "repsLabel"
  | "addSet"
  | "deleteSet"
  | "deleteExercise"
  | "deleteWorkout"
  | "restBtn"
  | "fromRoutine"
  | "workoutStarted"
  | "exerciseAdded"
  | "workoutDeleted"
  | "exerciseDeleted"
  | "deleteWorkoutTitle"
  | "deleteWorkoutBody"
  | "deleteExerciseTitle"
  | "deleteExerciseBody"
  | "exercisesCount"
  | "setsCount"
  | "volumeLabel"
  | "noSetsHint"
  | "notesLabel"
  | "notesPlaceholder"
  | "restTitle"
  | "restStart"
  | "restStop"
  | "restCustom"
  | "restDone"
  | "restRunning"
  | "restHint"
  | "secondsUnit"
  | "macrosTitle"
  | "kcal"
  | "protein"
  | "carbs"
  | "fat"
  | "ofTarget"
  | "remaining"
  | "over"
  | "noTargets"
  | "logFoodTitle"
  | "pickFood"
  | "quickAdd"
  | "fromCatalog"
  | "servingsLabel"
  | "logFood"
  | "mealsOnDay"
  | "noMeals"
  | "mealLogged"
  | "mealDeleted"
  | "deleteMeal"
  | "quickName"
  | "noFoodsHint"
  | "needServings"
  | "targetsTitle"
  | "profileTitle"
  | "sexLabel"
  | "sexUnset"
  | "male"
  | "female"
  | "ageLabel"
  | "heightLabel"
  | "bodyWeightLabel"
  | "activityLabel"
  | "activitySedentary"
  | "activityLight"
  | "activityModerate"
  | "activityActive"
  | "activityVery"
  | "bmrLabel"
  | "tdeeLabel"
  | "suggestedTitle"
  | "useSuggested"
  | "targetsSaved"
  | "customTargetsTitle"
  | "formulaNote"
  | "kcalTarget"
  | "proteinTarget"
  | "carbsTarget"
  | "fatTarget"
  | "macroKcalNote"
  | "fillProfileHint"
  | "useLatestWeighIn"
  | "unitLabel"
  | "kg"
  | "lb"
  | "weighInTitle"
  | "weighInDate"
  | "weighInWeight"
  | "logWeighIn"
  | "noWeighIns"
  | "weighInSaved"
  | "weighInDeleted"
  | "deleteWeighIn"
  | "weighInNote"
  | "latestLabel"
  | "needWeight"
  | "strengthTitle"
  | "noPRs"
  | "noPRsHint"
  | "heaviest"
  | "e1rm"
  | "e1rmNote"
  | "sessionsCount"
  | "showHistory"
  | "hideHistory"
  | "foodsTitle"
  | "addFood"
  | "editFoodTitle"
  | "newFoodTitle"
  | "foodName"
  | "foodNamePlaceholder"
  | "servingLabelField"
  | "servingPlaceholder"
  | "perServing"
  | "noFoods"
  | "foodSaved"
  | "foodDeleted"
  | "deleteFoodTitle"
  | "deleteFoodBody"
  | "needName"
  | "needKcal"
  | "foodsHint"
  | "routinesTitle"
  | "addRoutine"
  | "routineName"
  | "routineExercises"
  | "routineExercisesPlaceholder"
  | "routineHint"
  | "noRoutines"
  | "startRoutine"
  | "routineSaved"
  | "routineDeleted"
  | "deleteRoutine"
  | "needExercises"
  | "settingsTitle"
  | "fontSizeLabel"
  | "fontMd"
  | "fontLg"
  | "fontXl"
  | "unitPref"
  | "restDefault"
  | "backupTitle"
  | "backupBody"
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
  | "save"
  | "cancel"
  | "delete"
  | "edit"
  | "add"
  | "privacy"
  | "terms"
  | "guide";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "자이맥",
    shortName: "자이맥",
    tagline: "무료 로컬 헬스·매크로 기록. 운동(세트×횟수×중량), 하루 칼로리·P/C/F, 체중, PR, 커스텀 음식, JSON 백업. 계정 없음. 광고 없음.",
    metaDescription:
      "계정 없는 무료 로컬 헬스 운동 기록 + 매크로 앱. 운동별 세트(중량×횟수)를 남기고, 개인 기록(최고 중량·추정 1RM)을 자동으로 찾고, Mifflin-St Jeor로 하루 칼로리와 단백질·탄수화물·지방 목표를 계산하고, 커스텀 음식으로 하루 매크로를 기록하고, 체중을 남기세요. 루틴·기록 무제한, 구독 벽 없음, 광고 없음, JSON 백업으로 재설치해도 안전. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    chipNoLogin: "로그인 없음",
    chipNoLock: "루틴·기록 잠금 없음",
    chipHistoryFree: "전체 기록 무료",
    chipBackup: "JSON 백업",
    chipNoAds: "광고 없음",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    prevDay: "이전 날",
    nextDay: "다음 날",
    today: "오늘",
    workoutTitle: "운동",
    startWorkout: "운동 시작",
    workoutNamePlaceholder: "세션 이름 (선택, 예: 가슴·삼두)",
    noWorkoutYet: "이 날은 아직 운동이 없어요.",
    noWorkoutHint: "운동 시작을 누르고 종목을 추가하세요. 세션·종목·세트 수 모두 제한 없음.",
    addExercise: "종목 추가",
    exerciseNamePlaceholder: "종목 이름 (예: 벤치프레스)",
    setLabel: "세트",
    weightLabel: "중량",
    repsLabel: "횟수",
    addSet: "세트 추가",
    deleteSet: "세트 삭제",
    deleteExercise: "종목 삭제",
    deleteWorkout: "세션 삭제",
    restBtn: "휴식",
    fromRoutine: "루틴에서 시작",
    workoutStarted: "세션을 만들었어요",
    exerciseAdded: "종목을 추가했어요",
    workoutDeleted: "세션을 삭제했어요",
    exerciseDeleted: "종목을 삭제했어요",
    deleteWorkoutTitle: "이 세션을 삭제할까요?",
    deleteWorkoutBody: "세션의 모든 종목과 세트가 지워집니다. 되돌릴 수 없어요.",
    deleteExerciseTitle: "이 종목을 세션에서 뺄까요?",
    deleteExerciseBody: "이 세션의 해당 세트만 지워집니다. 다른 날 기록은 그대로예요.",
    exercisesCount: "종목 {n}",
    setsCount: "세트 {n}",
    volumeLabel: "볼륨 {v} {u}",
    noSetsHint: "세트 추가를 눌러 중량과 횟수를 적으세요.",
    notesLabel: "메모",
    notesPlaceholder: "컨디션, 통증, 다음에 올릴 중량…",
    restTitle: "휴식 타이머",
    restStart: "시작",
    restStop: "정지",
    restCustom: "직접 입력(초)",
    restDone: "휴식 끝! 다음 세트.",
    restRunning: "남은 시간",
    restHint: "화면이 켜져 있을 때만 셉니다. 백그라운드 알림은 없어요.",
    secondsUnit: "초",
    macrosTitle: "하루 매크로",
    kcal: "칼로리",
    protein: "단백질",
    carbs: "탄수화물",
    fat: "지방",
    ofTarget: "{value} / {target}",
    remaining: "남음 {n}",
    over: "초과 {n}",
    noTargets: "목표가 아직 없어요. 아래 목표 카드에서 계산하거나 직접 적으세요.",
    logFoodTitle: "음식 기록",
    pickFood: "내 음식에서 고르기",
    quickAdd: "빠른 입력",
    fromCatalog: "내 음식",
    servingsLabel: "인분",
    logFood: "기록",
    mealsOnDay: "이 날 먹은 것",
    noMeals: "아직 기록한 음식이 없어요.",
    mealLogged: "음식을 기록했어요",
    mealDeleted: "기록을 삭제했어요",
    deleteMeal: "기록 삭제",
    quickName: "이름 (예: 닭가슴살 100g)",
    noFoodsHint: "내 음식 카드에서 음식을 먼저 만들면 여기서 골라 기록할 수 있어요.",
    needServings: "인분을 0보다 크게 적어 주세요.",
    targetsTitle: "목표 · Mifflin–St Jeor",
    profileTitle: "내 정보",
    sexLabel: "성별",
    sexUnset: "선택",
    male: "남성",
    female: "여성",
    ageLabel: "나이",
    heightLabel: "키 (cm)",
    bodyWeightLabel: "체중",
    activityLabel: "활동량",
    activitySedentary: "거의 안 움직임 (1.2)",
    activityLight: "가벼운 활동 (1.375)",
    activityModerate: "보통 (1.55)",
    activityActive: "활발 (1.725)",
    activityVery: "매우 활발 (1.9)",
    bmrLabel: "기초대사량",
    tdeeLabel: "하루 소모(TDEE)",
    suggestedTitle: "추천 목표",
    useSuggested: "추천값 사용",
    targetsSaved: "목표를 저장했어요",
    customTargetsTitle: "내 목표 (직접 수정 가능)",
    formulaNote: "Mifflin–St Jeor 공식으로 계산. 단백질 2.0 g/kg, 지방 25 %, 나머지 탄수화물. 숫자는 언제든 직접 고칠 수 있어요.",
    kcalTarget: "칼로리 목표",
    proteinTarget: "단백질 g",
    carbsTarget: "탄수화물 g",
    fatTarget: "지방 g",
    macroKcalNote: "매크로 합계 ≈ {kcal} kcal",
    fillProfileHint: "성별·나이·키·체중·활동량을 채우면 기초대사량과 하루 소모량이 나와요.",
    useLatestWeighIn: "최근 체중 사용",
    unitLabel: "단위",
    kg: "kg",
    lb: "lb",
    weighInTitle: "체중",
    weighInDate: "날짜",
    weighInWeight: "체중",
    logWeighIn: "체중 기록",
    noWeighIns: "아직 체중 기록이 없어요.",
    weighInSaved: "체중을 기록했어요",
    weighInDeleted: "체중 기록을 삭제했어요",
    deleteWeighIn: "체중 기록 삭제",
    weighInNote: "메모 (선택)",
    latestLabel: "최근",
    needWeight: "체중을 0보다 크게 적어 주세요.",
    strengthTitle: "근력 · PR",
    noPRs: "아직 PR이 없어요.",
    noPRsHint: "운동 카드에서 세트를 기록하면 종목별 최고 중량과 추정 1RM이 자동으로 나와요.",
    heaviest: "최고 중량",
    e1rm: "추정 1RM",
    e1rmNote: "추정 1RM은 Epley 공식(중량 × (1 + 횟수/30)). 참고용이에요.",
    sessionsCount: "세션 {n}",
    showHistory: "기록 보기",
    hideHistory: "기록 닫기",
    foodsTitle: "내 음식",
    addFood: "음식 추가",
    editFoodTitle: "음식 수정",
    newFoodTitle: "새 음식",
    foodName: "이름",
    foodNamePlaceholder: "예: 닭가슴살 100g",
    servingLabelField: "1인분 설명 (선택)",
    servingPlaceholder: "예: 100 g, 1컵",
    perServing: "1인분 기준",
    noFoods: "아직 음식이 없어요. 직접 만든 음식만 씁니다 — 유료 DB 없음.",
    foodSaved: "음식을 저장했어요",
    foodDeleted: "음식을 삭제했어요",
    deleteFoodTitle: "이 음식을 삭제할까요?",
    deleteFoodBody: "이미 기록한 식사는 그대로 남아요.",
    needName: "이름을 적어 주세요.",
    needKcal: "칼로리를 0 이상으로 적어 주세요.",
    foodsHint: "kcal과 P/C/F는 1인분 기준. 무제한, 무료.",
    routinesTitle: "루틴",
    addRoutine: "루틴 추가",
    routineName: "루틴 이름",
    routineExercises: "종목 (한 줄에 하나)",
    routineExercisesPlaceholder: "벤치프레스\n스쿼트\n데드리프트",
    routineHint: "루틴 개수 제한 없음. 세션을 시작할 때 종목을 미리 채워요.",
    noRoutines: "아직 루틴이 없어요.",
    startRoutine: "이 루틴으로 시작",
    routineSaved: "루틴을 저장했어요",
    routineDeleted: "루틴을 삭제했어요",
    deleteRoutine: "루틴 삭제",
    needExercises: "종목을 하나 이상 적어 주세요.",
    settingsTitle: "설정",
    fontSizeLabel: "글자 크기",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    unitPref: "중량 단위",
    restDefault: "기본 휴식(초)",
    backupTitle: "백업",
    backupBody: "운동·매크로·체중·음식·루틴·설정 전부를 JSON 한 파일로. 재설치나 기기 변경 전에 내보내고, 새 기기에서 가져오세요. 계정도 서버도 없습니다.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    clearAll: "전체 삭제",
    exported: "JSON을 내보냈어요",
    importBad: "자이맥 백업 파일이 아니에요",
    importOk: "가져왔어요 — 운동 {w}, 식사 {m}",
    importConfirmTitle: "지금 데이터를 바꿀까요?",
    importConfirmBody: "이 기기의 기록이 백업 파일 내용으로 바뀝니다.",
    clearAllTitle: "전체 삭제할까요?",
    clearAllBody: "이 기기의 모든 기록·설정이 지워집니다. 먼저 JSON으로 내보내 두세요.",
    cleared: "모두 지웠어요",
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    edit: "수정",
    add: "추가",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Gymac",
    shortName: "Gymac",
    tagline: "Free local gym + macro tracker. Log exercises (sets×reps×weight), daily calories and P/C/F, weigh-ins, PR history, custom foods, JSON backup. No account. No ads.",
    metaDescription:
      "Free local gym workout log and macro tracker with no account. Log each exercise as sets of weight × reps, get personal records (heaviest set and estimated 1RM) found for you, compute daily calorie and protein / carb / fat targets with Mifflin–St Jeor, track daily macros with your own custom foods, and log weigh-ins. Unlimited routines and history, no subscribe wall, no ads, and a JSON backup that survives a reinstall. Data stays on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    chipNoLogin: "No login",
    chipNoLock: "No catalog lock",
    chipHistoryFree: "Full history free",
    chipBackup: "JSON backup",
    chipNoAds: "No ads",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    prevDay: "Previous day",
    nextDay: "Next day",
    today: "Today",
    workoutTitle: "Workout",
    startWorkout: "Start workout",
    workoutNamePlaceholder: "Session name (optional, e.g. Push day)",
    noWorkoutYet: "No workout on this day yet.",
    noWorkoutHint: "Tap Start workout, then add exercises. Sessions, exercises and sets are unlimited.",
    addExercise: "Add exercise",
    exerciseNamePlaceholder: "Exercise name (e.g. Bench Press)",
    setLabel: "Set",
    weightLabel: "Weight",
    repsLabel: "Reps",
    addSet: "Add set",
    deleteSet: "Delete set",
    deleteExercise: "Remove exercise",
    deleteWorkout: "Delete session",
    restBtn: "Rest",
    fromRoutine: "Start from routine",
    workoutStarted: "Session created",
    exerciseAdded: "Exercise added",
    workoutDeleted: "Session deleted",
    exerciseDeleted: "Exercise removed",
    deleteWorkoutTitle: "Delete this session?",
    deleteWorkoutBody: "Every exercise and set in it goes too. This cannot be undone.",
    deleteExerciseTitle: "Remove this exercise from the session?",
    deleteExerciseBody: "Only its sets in this session are deleted. Other days stay as they are.",
    exercisesCount: "{n} exercises",
    setsCount: "{n} sets",
    volumeLabel: "Volume {v} {u}",
    noSetsHint: "Tap Add set and type the weight and reps.",
    notesLabel: "Notes",
    notesPlaceholder: "How it felt, aches, weight to try next time…",
    restTitle: "Rest timer",
    restStart: "Start",
    restStop: "Stop",
    restCustom: "Custom (seconds)",
    restDone: "Rest over — next set.",
    restRunning: "Remaining",
    restHint: "Counts while the screen is on. No background notifications.",
    secondsUnit: "s",
    macrosTitle: "Daily macros",
    kcal: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    ofTarget: "{value} / {target}",
    remaining: "{n} left",
    over: "{n} over",
    noTargets: "No targets yet. Compute them in the Targets card below or type your own.",
    logFoodTitle: "Log food",
    pickFood: "Pick from my foods",
    quickAdd: "Quick add",
    fromCatalog: "My foods",
    servingsLabel: "Servings",
    logFood: "Log",
    mealsOnDay: "Eaten on this day",
    noMeals: "Nothing logged yet.",
    mealLogged: "Food logged",
    mealDeleted: "Entry deleted",
    deleteMeal: "Delete entry",
    quickName: "Name (e.g. Chicken 100g)",
    noFoodsHint: "Create foods in the My foods card first, then pick them here.",
    needServings: "Servings must be more than 0.",
    targetsTitle: "Targets · Mifflin–St Jeor",
    profileTitle: "Profile",
    sexLabel: "Sex",
    sexUnset: "Choose",
    male: "Male",
    female: "Female",
    ageLabel: "Age",
    heightLabel: "Height (cm)",
    bodyWeightLabel: "Body weight",
    activityLabel: "Activity",
    activitySedentary: "Sedentary (1.2)",
    activityLight: "Light (1.375)",
    activityModerate: "Moderate (1.55)",
    activityActive: "Active (1.725)",
    activityVery: "Very active (1.9)",
    bmrLabel: "BMR",
    tdeeLabel: "TDEE",
    suggestedTitle: "Suggested targets",
    useSuggested: "Use suggested",
    targetsSaved: "Targets saved",
    customTargetsTitle: "My targets (editable)",
    formulaNote: "Mifflin–St Jeor for BMR × activity factor. Protein 2.0 g/kg, fat 25 % of calories, carbs the rest. Overwrite any number you like.",
    kcalTarget: "Calorie target",
    proteinTarget: "Protein g",
    carbsTarget: "Carbs g",
    fatTarget: "Fat g",
    macroKcalNote: "Macros add up to ≈ {kcal} kcal",
    fillProfileHint: "Fill in sex, age, height, weight and activity to see BMR and TDEE.",
    useLatestWeighIn: "Use latest weigh-in",
    unitLabel: "Unit",
    kg: "kg",
    lb: "lb",
    weighInTitle: "Weigh-ins",
    weighInDate: "Date",
    weighInWeight: "Weight",
    logWeighIn: "Log weigh-in",
    noWeighIns: "No weigh-ins yet.",
    weighInSaved: "Weigh-in saved",
    weighInDeleted: "Weigh-in deleted",
    deleteWeighIn: "Delete weigh-in",
    weighInNote: "Note (optional)",
    latestLabel: "Latest",
    needWeight: "Weight must be more than 0.",
    strengthTitle: "Strength · PRs",
    noPRs: "No PRs yet.",
    noPRsHint: "Log sets in the Workout card and each exercise's heaviest set and estimated 1RM appear here.",
    heaviest: "Heaviest",
    e1rm: "Est. 1RM",
    e1rmNote: "Estimated 1RM uses Epley: weight × (1 + reps / 30). A guide, not a test.",
    sessionsCount: "{n} sessions",
    showHistory: "Show history",
    hideHistory: "Hide history",
    foodsTitle: "My foods",
    addFood: "Add food",
    editFoodTitle: "Edit food",
    newFoodTitle: "New food",
    foodName: "Name",
    foodNamePlaceholder: "e.g. Chicken 100g",
    servingLabelField: "Serving description (optional)",
    servingPlaceholder: "e.g. 100 g, 1 cup",
    perServing: "Per serving",
    noFoods: "No foods yet. Only your own custom foods — no paid database.",
    foodSaved: "Food saved",
    foodDeleted: "Food deleted",
    deleteFoodTitle: "Delete this food?",
    deleteFoodBody: "Meals already logged with it stay as they are.",
    needName: "Please enter a name.",
    needKcal: "Calories must be 0 or more.",
    foodsHint: "kcal and P/C/F are per serving. Unlimited, free.",
    routinesTitle: "Routines",
    addRoutine: "Add routine",
    routineName: "Routine name",
    routineExercises: "Exercises (one per line)",
    routineExercisesPlaceholder: "Bench Press\nSquat\nDeadlift",
    routineHint: "No routine limit. Starting a session from a routine pre-fills its exercises.",
    noRoutines: "No routines yet.",
    startRoutine: "Start with this routine",
    routineSaved: "Routine saved",
    routineDeleted: "Routine deleted",
    deleteRoutine: "Delete routine",
    needExercises: "Add at least one exercise.",
    settingsTitle: "Settings",
    fontSizeLabel: "Text size",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    unitPref: "Weight unit",
    restDefault: "Default rest (s)",
    backupTitle: "Backup",
    backupBody: "Every workout, meal, weigh-in, food, routine and setting in one JSON file. Export before a reinstall or a new phone, then import there. No account, no server.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    clearAll: "Delete all data",
    exported: "JSON exported",
    importBad: "That is not a Gymac backup file",
    importOk: "Imported — {w} workouts, {m} meals",
    importConfirmTitle: "Replace the current data?",
    importConfirmBody: "Everything on this device is replaced by the backup file.",
    clearAllTitle: "Delete everything?",
    clearAllBody: "Every record and setting on this device is erased. Export JSON first.",
    cleared: "All data deleted",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "ジャイマック",
    shortName: "ジャイマック",
    tagline: "無料のローカルジム＆マクロ記録。種目（セット×回数×重量）、1日カロリーとP/C/F、体重、PR、カスタム食品、JSONバックアップ。アカウント不要。広告なし。",
    metaDescription:
      "アカウント不要の無料ローカルジム記録＆マクロ管理アプリ。種目ごとに重量×回数のセットを記録し、自己記録（最重量セットと推定1RM）を自動で検出、Mifflin–St Jeor式で1日のカロリーとタンパク質・炭水化物・脂質の目標を計算、自分で作った食品で1日のマクロを記録、体重も記録。ルーティンと履歴は無制限、サブスクの壁なし、広告なし、JSONバックアップで再インストールしても安心。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    chipNoLogin: "ログイン不要",
    chipNoLock: "ルーティン・履歴ロックなし",
    chipHistoryFree: "全履歴が無料",
    chipBackup: "JSONバックアップ",
    chipNoAds: "広告なし",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    prevDay: "前の日",
    nextDay: "次の日",
    today: "今日",
    workoutTitle: "ワークアウト",
    startWorkout: "ワークアウト開始",
    workoutNamePlaceholder: "セッション名（任意、例: 胸・三頭）",
    noWorkoutYet: "この日はまだワークアウトがありません。",
    noWorkoutHint: "ワークアウト開始を押して種目を追加。セッション・種目・セット数に制限はありません。",
    addExercise: "種目を追加",
    exerciseNamePlaceholder: "種目名（例: ベンチプレス）",
    setLabel: "セット",
    weightLabel: "重量",
    repsLabel: "回数",
    addSet: "セット追加",
    deleteSet: "セット削除",
    deleteExercise: "種目を外す",
    deleteWorkout: "セッション削除",
    restBtn: "休憩",
    fromRoutine: "ルーティンから開始",
    workoutStarted: "セッションを作成しました",
    exerciseAdded: "種目を追加しました",
    workoutDeleted: "セッションを削除しました",
    exerciseDeleted: "種目を外しました",
    deleteWorkoutTitle: "このセッションを削除しますか？",
    deleteWorkoutBody: "中の種目とセットもすべて消えます。元に戻せません。",
    deleteExerciseTitle: "この種目をセッションから外しますか？",
    deleteExerciseBody: "このセッションのセットだけ消えます。他の日の記録はそのままです。",
    exercisesCount: "種目 {n}",
    setsCount: "セット {n}",
    volumeLabel: "ボリューム {v} {u}",
    noSetsHint: "セット追加を押して重量と回数を入力してください。",
    notesLabel: "メモ",
    notesPlaceholder: "調子、痛み、次に上げる重量…",
    restTitle: "休憩タイマー",
    restStart: "開始",
    restStop: "停止",
    restCustom: "任意（秒）",
    restDone: "休憩終了。次のセットへ。",
    restRunning: "残り",
    restHint: "画面が点いている間だけ数えます。バックグラウンド通知はありません。",
    secondsUnit: "秒",
    macrosTitle: "1日のマクロ",
    kcal: "カロリー",
    protein: "タンパク質",
    carbs: "炭水化物",
    fat: "脂質",
    ofTarget: "{value} / {target}",
    remaining: "残り {n}",
    over: "超過 {n}",
    noTargets: "目標がまだありません。下の目標カードで計算するか直接入力してください。",
    logFoodTitle: "食品を記録",
    pickFood: "マイ食品から選ぶ",
    quickAdd: "クイック入力",
    fromCatalog: "マイ食品",
    servingsLabel: "人前",
    logFood: "記録",
    mealsOnDay: "この日に食べたもの",
    noMeals: "まだ記録がありません。",
    mealLogged: "食品を記録しました",
    mealDeleted: "記録を削除しました",
    deleteMeal: "記録を削除",
    quickName: "名前（例: 鶏むね 100g）",
    noFoodsHint: "先にマイ食品カードで食品を作ると、ここで選んで記録できます。",
    needServings: "人前は0より大きく入力してください。",
    targetsTitle: "目標 · Mifflin–St Jeor",
    profileTitle: "プロフィール",
    sexLabel: "性別",
    sexUnset: "選択",
    male: "男性",
    female: "女性",
    ageLabel: "年齢",
    heightLabel: "身長 (cm)",
    bodyWeightLabel: "体重",
    activityLabel: "活動量",
    activitySedentary: "ほぼ座位 (1.2)",
    activityLight: "軽い (1.375)",
    activityModerate: "普通 (1.55)",
    activityActive: "活発 (1.725)",
    activityVery: "非常に活発 (1.9)",
    bmrLabel: "基礎代謝",
    tdeeLabel: "1日消費 (TDEE)",
    suggestedTitle: "おすすめ目標",
    useSuggested: "おすすめを使う",
    targetsSaved: "目標を保存しました",
    customTargetsTitle: "マイ目標（編集可）",
    formulaNote: "Mifflin–St Jeor式で基礎代謝 × 活動係数。タンパク質 2.0 g/kg、脂質 25 %、残りが炭水化物。どの数字も自由に上書きできます。",
    kcalTarget: "カロリー目標",
    proteinTarget: "タンパク質 g",
    carbsTarget: "炭水化物 g",
    fatTarget: "脂質 g",
    macroKcalNote: "マクロ合計 ≈ {kcal} kcal",
    fillProfileHint: "性別・年齢・身長・体重・活動量を入れると基礎代謝と1日消費が出ます。",
    useLatestWeighIn: "最新の体重を使う",
    unitLabel: "単位",
    kg: "kg",
    lb: "lb",
    weighInTitle: "体重",
    weighInDate: "日付",
    weighInWeight: "体重",
    logWeighIn: "体重を記録",
    noWeighIns: "まだ体重の記録がありません。",
    weighInSaved: "体重を記録しました",
    weighInDeleted: "体重の記録を削除しました",
    deleteWeighIn: "体重の記録を削除",
    weighInNote: "メモ（任意）",
    latestLabel: "最新",
    needWeight: "体重は0より大きく入力してください。",
    strengthTitle: "筋力 · PR",
    noPRs: "まだPRがありません。",
    noPRsHint: "ワークアウトカードでセットを記録すると、種目ごとの最重量セットと推定1RMがここに出ます。",
    heaviest: "最重量",
    e1rm: "推定1RM",
    e1rmNote: "推定1RMはEpley式（重量 × (1 + 回数/30)）。目安です。",
    sessionsCount: "セッション {n}",
    showHistory: "履歴を見る",
    hideHistory: "履歴を閉じる",
    foodsTitle: "マイ食品",
    addFood: "食品を追加",
    editFoodTitle: "食品を編集",
    newFoodTitle: "新しい食品",
    foodName: "名前",
    foodNamePlaceholder: "例: 鶏むね 100g",
    servingLabelField: "1人前の説明（任意）",
    servingPlaceholder: "例: 100 g、1カップ",
    perServing: "1人前あたり",
    noFoods: "まだ食品がありません。自分で作った食品だけを使います。有料DBはありません。",
    foodSaved: "食品を保存しました",
    foodDeleted: "食品を削除しました",
    deleteFoodTitle: "この食品を削除しますか？",
    deleteFoodBody: "すでに記録した食事はそのまま残ります。",
    needName: "名前を入力してください。",
    needKcal: "カロリーは0以上で入力してください。",
    foodsHint: "kcalとP/C/Fは1人前あたり。無制限、無料。",
    routinesTitle: "ルーティン",
    addRoutine: "ルーティンを追加",
    routineName: "ルーティン名",
    routineExercises: "種目（1行に1つ）",
    routineExercisesPlaceholder: "ベンチプレス\nスクワット\nデッドリフト",
    routineHint: "ルーティン数に制限なし。セッション開始時に種目を先に埋めます。",
    noRoutines: "まだルーティンがありません。",
    startRoutine: "このルーティンで開始",
    routineSaved: "ルーティンを保存しました",
    routineDeleted: "ルーティンを削除しました",
    deleteRoutine: "ルーティンを削除",
    needExercises: "種目を1つ以上入力してください。",
    settingsTitle: "設定",
    fontSizeLabel: "文字サイズ",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    unitPref: "重量の単位",
    restDefault: "既定の休憩（秒）",
    backupTitle: "バックアップ",
    backupBody: "ワークアウト・食事・体重・食品・ルーティン・設定をJSON 1ファイルに。再インストールや機種変更の前に書き出し、新しい端末で読み込んでください。アカウントもサーバーもありません。",
    exportJson: "JSON書き出し",
    importJson: "JSON読み込み",
    clearAll: "全データ削除",
    exported: "JSONを書き出しました",
    importBad: "ジャイマックのバックアップファイルではありません",
    importOk: "読み込みました — ワークアウト {w}、食事 {m}",
    importConfirmTitle: "今のデータを置き換えますか？",
    importConfirmBody: "この端末の記録がバックアップファイルの内容に置き換わります。",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "この端末のすべての記録と設定が消えます。先にJSONを書き出してください。",
    cleared: "すべて削除しました",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    edit: "編集",
    add: "追加",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "健身记",
    shortName: "健身记",
    tagline: "免费本地健身与宏量营养记录。记录动作（组×次数×重量）、每日热量与蛋白/碳/脂、体重、PR、自定义食物、JSON 备份。无需账号。无广告。",
    metaDescription:
      "无需账号的免费本地健身训练日志 + 宏量营养记录。按动作记录重量×次数的每一组，自动找出个人纪录（最重一组与估算 1RM），用 Mifflin–St Jeor 公式算出每日热量与蛋白质/碳水/脂肪目标，用自定义食物记录每日宏量，并记录体重。训练计划与历史不限，没有订阅墙，没有广告，JSON 备份重装也不丢。数据只留在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    chipNoLogin: "无需登录",
    chipNoLock: "计划/历史不锁定",
    chipHistoryFree: "完整历史免费",
    chipBackup: "JSON 备份",
    chipNoAds: "无广告",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    prevDay: "前一天",
    nextDay: "后一天",
    today: "今天",
    workoutTitle: "训练",
    startWorkout: "开始训练",
    workoutNamePlaceholder: "训练名称（可选，如：推日）",
    noWorkoutYet: "这一天还没有训练。",
    noWorkoutHint: "点开始训练，再添加动作。训练、动作、组数都不限。",
    addExercise: "添加动作",
    exerciseNamePlaceholder: "动作名称（如：卧推）",
    setLabel: "组",
    weightLabel: "重量",
    repsLabel: "次数",
    addSet: "加一组",
    deleteSet: "删除该组",
    deleteExercise: "移除动作",
    deleteWorkout: "删除训练",
    restBtn: "休息",
    fromRoutine: "从计划开始",
    workoutStarted: "已创建训练",
    exerciseAdded: "已添加动作",
    workoutDeleted: "已删除训练",
    exerciseDeleted: "已移除动作",
    deleteWorkoutTitle: "删除这次训练？",
    deleteWorkoutBody: "其中所有动作和组都会删除，无法撤销。",
    deleteExerciseTitle: "把这个动作从训练里移除？",
    deleteExerciseBody: "只删除这次训练中的组，其他日期的记录不变。",
    exercisesCount: "{n} 个动作",
    setsCount: "{n} 组",
    volumeLabel: "总量 {v} {u}",
    noSetsHint: "点加一组，填重量和次数。",
    notesLabel: "备注",
    notesPlaceholder: "状态、酸痛、下次要上的重量…",
    restTitle: "休息计时",
    restStart: "开始",
    restStop: "停止",
    restCustom: "自定义（秒）",
    restDone: "休息结束，下一组。",
    restRunning: "剩余",
    restHint: "仅在屏幕亮着时计时，没有后台通知。",
    secondsUnit: "秒",
    macrosTitle: "每日宏量",
    kcal: "热量",
    protein: "蛋白质",
    carbs: "碳水",
    fat: "脂肪",
    ofTarget: "{value} / {target}",
    remaining: "还差 {n}",
    over: "超出 {n}",
    noTargets: "还没有目标。在下方目标卡片里计算，或直接填写。",
    logFoodTitle: "记录食物",
    pickFood: "从我的食物选",
    quickAdd: "快速添加",
    fromCatalog: "我的食物",
    servingsLabel: "份数",
    logFood: "记录",
    mealsOnDay: "这一天吃了",
    noMeals: "还没有记录。",
    mealLogged: "已记录食物",
    mealDeleted: "已删除记录",
    deleteMeal: "删除记录",
    quickName: "名称（如：鸡胸 100g）",
    noFoodsHint: "先在我的食物卡片里创建食物，然后在这里选择记录。",
    needServings: "份数必须大于 0。",
    targetsTitle: "目标 · Mifflin–St Jeor",
    profileTitle: "个人资料",
    sexLabel: "性别",
    sexUnset: "选择",
    male: "男",
    female: "女",
    ageLabel: "年龄",
    heightLabel: "身高 (cm)",
    bodyWeightLabel: "体重",
    activityLabel: "活动量",
    activitySedentary: "久坐 (1.2)",
    activityLight: "轻度 (1.375)",
    activityModerate: "中等 (1.55)",
    activityActive: "活跃 (1.725)",
    activityVery: "非常活跃 (1.9)",
    bmrLabel: "基础代谢",
    tdeeLabel: "每日消耗 (TDEE)",
    suggestedTitle: "建议目标",
    useSuggested: "使用建议值",
    targetsSaved: "已保存目标",
    customTargetsTitle: "我的目标（可修改）",
    formulaNote: "按 Mifflin–St Jeor 公式算基础代谢 × 活动系数。蛋白质 2.0 g/kg，脂肪 25 %，其余为碳水。任何数字都可以自己改。",
    kcalTarget: "热量目标",
    proteinTarget: "蛋白质 g",
    carbsTarget: "碳水 g",
    fatTarget: "脂肪 g",
    macroKcalNote: "宏量合计 ≈ {kcal} kcal",
    fillProfileHint: "填好性别、年龄、身高、体重和活动量，就能看到基础代谢和每日消耗。",
    useLatestWeighIn: "使用最近体重",
    unitLabel: "单位",
    kg: "kg",
    lb: "lb",
    weighInTitle: "体重",
    weighInDate: "日期",
    weighInWeight: "体重",
    logWeighIn: "记录体重",
    noWeighIns: "还没有体重记录。",
    weighInSaved: "已记录体重",
    weighInDeleted: "已删除体重记录",
    deleteWeighIn: "删除体重记录",
    weighInNote: "备注（可选）",
    latestLabel: "最近",
    needWeight: "体重必须大于 0。",
    strengthTitle: "力量 · PR",
    noPRs: "还没有 PR。",
    noPRsHint: "在训练卡片里记录组数后，每个动作的最重一组和估算 1RM 会显示在这里。",
    heaviest: "最重",
    e1rm: "估算 1RM",
    e1rmNote: "估算 1RM 用 Epley 公式：重量 × (1 + 次数/30)。仅供参考。",
    sessionsCount: "{n} 次训练",
    showHistory: "查看历史",
    hideHistory: "收起历史",
    foodsTitle: "我的食物",
    addFood: "添加食物",
    editFoodTitle: "编辑食物",
    newFoodTitle: "新食物",
    foodName: "名称",
    foodNamePlaceholder: "如：鸡胸 100g",
    servingLabelField: "每份说明（可选）",
    servingPlaceholder: "如：100 g、1 杯",
    perServing: "每份",
    noFoods: "还没有食物。只用你自己创建的食物，没有付费数据库。",
    foodSaved: "已保存食物",
    foodDeleted: "已删除食物",
    deleteFoodTitle: "删除这个食物？",
    deleteFoodBody: "已经记录的餐食保持不变。",
    needName: "请填写名称。",
    needKcal: "热量必须大于等于 0。",
    foodsHint: "kcal 和蛋白/碳/脂按每份计。不限数量，免费。",
    routinesTitle: "训练计划",
    addRoutine: "添加计划",
    routineName: "计划名称",
    routineExercises: "动作（每行一个）",
    routineExercisesPlaceholder: "卧推\n深蹲\n硬拉",
    routineHint: "计划数量不限。从计划开始训练会预填动作。",
    noRoutines: "还没有计划。",
    startRoutine: "用这个计划开始",
    routineSaved: "已保存计划",
    routineDeleted: "已删除计划",
    deleteRoutine: "删除计划",
    needExercises: "至少填一个动作。",
    settingsTitle: "设置",
    fontSizeLabel: "字号",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    unitPref: "重量单位",
    restDefault: "默认休息（秒）",
    backupTitle: "备份",
    backupBody: "训练、餐食、体重、食物、计划和设置全部放进一个 JSON 文件。重装或换手机前导出，在新设备导入。没有账号，没有服务器。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    clearAll: "删除全部数据",
    exported: "已导出 JSON",
    importBad: "这不是健身记的备份文件",
    importOk: "已导入 — {w} 次训练，{m} 条餐食",
    importConfirmTitle: "替换当前数据？",
    importConfirmBody: "此设备上的所有记录将被备份文件的内容替换。",
    clearAllTitle: "删除全部？",
    clearAllBody: "此设备上的所有记录和设置都会清除。请先导出 JSON。",
    cleared: "已全部删除",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    add: "添加",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
  },
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as string[]).includes(value);
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
