/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline, local-only notice and disclaimer for the FIRST
 * HTML, so the two must stay in step: the mounted app has to say exactly what
 * a crawler saw. Nothing in here recommends a dose.
 */
import type { SiteId } from "./rotation.ts";

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "peptidelog:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://peptidelog.try-dabble.com/og-image-ko.png",
  en: "https://peptidelog.try-dabble.com/og-image-en.png",
  ja: "https://peptidelog.try-dabble.com/og-image-ja.png",
  zh: "https://peptidelog.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "notMedical"
  | "langLabel"
  | "chipNoWall"
  | "chipAnyDay"
  | "chipEditDoses"
  | "chipUnlimited"
  | "chipArithmetic"
  | "chipLocal"
  | "chipLangs"
  | "quickLogTitle"
  | "compoundLabel"
  | "amountLabel"
  | "unitLabel"
  | "datetimeLabel"
  | "siteLabel"
  | "siteNone"
  | "siteSuggested"
  | "vialLabel"
  | "vialNone"
  | "notesLabel"
  | "notesPlaceholder"
  | "saveLog"
  | "logSaved"
  | "logUpdated"
  | "logDeleted"
  | "needCompound"
  | "needAmount"
  | "needDatetime"
  | "addCompoundFirst"
  | "calcTitle"
  | "calcBody"
  | "calcVialMg"
  | "calcDiluentMl"
  | "calcConcentration"
  | "calcDesiredDose"
  | "calcDoseUnit"
  | "calcSyringeUnits"
  | "calcVolume"
  | "calcDosesPerVial"
  | "calcSyringeNote"
  | "calcEmpty"
  | "compoundsTitle"
  | "addCompound"
  | "newCompoundTitle"
  | "editCompoundTitle"
  | "nameLabel"
  | "namePlaceholder"
  | "defaultUnitLabel"
  | "defaultDoseLabel"
  | "halfLifeLabel"
  | "halfLifeFieldHint"
  | "compoundNotesLabel"
  | "compoundSaved"
  | "compoundDeleted"
  | "deleteCompoundTitle"
  | "deleteCompoundBody"
  | "noCompoundsTitle"
  | "noCompoundsBody"
  | "unlimitedHint"
  | "needName"
  | "compoundCount"
  | "vialsTitle"
  | "addVial"
  | "newVialTitle"
  | "editVialTitle"
  | "vialLabelField"
  | "vialMgLabel"
  | "diluentLabel"
  | "remainingMgLabel"
  | "remainingMlLabel"
  | "lowThresholdLabel"
  | "lowThresholdHint"
  | "reconstitutedAtLabel"
  | "lowStock"
  | "inStock"
  | "noVialsTitle"
  | "noVialsBody"
  | "vialSaved"
  | "vialDeleted"
  | "deleteVialTitle"
  | "deleteVialBody"
  | "remainingLabel"
  | "needVialMg"
  | "vialAutoDeduct"
  | "schedulesTitle"
  | "addSchedule"
  | "newScheduleTitle"
  | "editScheduleTitle"
  | "scheduleNameLabel"
  | "scheduleNamePlaceholder"
  | "doseLabel"
  | "timesLabel"
  | "timesHint"
  | "repeatLabel"
  | "repeatWeekdays"
  | "repeatInterval"
  | "everyNDays"
  | "activeLabel"
  | "paused"
  | "sitePreferLabel"
  | "upcomingTitle"
  | "markDone"
  | "done"
  | "noSchedulesTitle"
  | "noSchedulesBody"
  | "noUpcoming"
  | "scheduleSaved"
  | "scheduleDeleted"
  | "deleteScheduleTitle"
  | "deleteScheduleBody"
  | "needScheduleName"
  | "needDays"
  | "needTimes"
  | "daysShort"
  | "calendarTitle"
  | "calendarBody"
  | "prevMonth"
  | "nextMonth"
  | "today"
  | "logsOn"
  | "noLogsOn"
  | "addLogForDay"
  | "editLogTitle"
  | "deleteLogTitle"
  | "deleteLogBody"
  | "edit"
  | "delete"
  | "rotationTitle"
  | "rotationBody"
  | "rotationNext"
  | "rotationUse"
  | "lastUsed"
  | "neverUsed"
  | "halfLifeTitle"
  | "halfLifeToggle"
  | "halfLifeEstimateOnly"
  | "halfLifeBody"
  | "halfLifeLine"
  | "halfLifeNoCompound"
  | "halfLifeNoLog"
  | "suppliesTitle"
  | "suppliesBody"
  | "addSupply"
  | "supplyNamePlaceholder"
  | "qtyLabel"
  | "lowAtLabel"
  | "supplyLow"
  | "noSupplies"
  | "settingsTitle"
  | "unitsPerMlLabel"
  | "unitsPerMlHint"
  | "defaultSiteLabel"
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
  | "cancel"
  | "save"
  | "close"
  | "about"
  | "privacy"
  | "terms"
  | "guide";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "펩타이드로그",
    shortName: "펩타이드로그",
    tagline: "무료 로컬 펩타이드·주사 기록. 화합물, 재구성 계산, 용량 로그, 바이알 재고, 스케줄, 부위 로테이션, JSON 백업. 계정 없음. 의료 조언 아님.",
    metaDescription:
      "계정 없는 무료 로컬 펩타이드·주사 기록 앱. 화합물을 개수 제한 없이 등록하고, 바이알 mg와 주사용수 mL로 농도와 주사기 눈금을 계산(산술만)하고, 용량·시간·부위·메모를 남기세요. 어느 날짜든 기록·수정·삭제, 바이알 재고와 부족 경고, 여러 프로토콜 스케줄, 부위 로테이션 추천, JSON 백업. 구독 함정도 광고도 없습니다. 데이터는 이 기기에만. 의료 조언이 아닙니다.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. 의료 조언이 아닙니다.",
    notMedical: "의료 조언이 아닙니다. 계산기는 산술만 제공합니다. 용량·용법은 의료 전문가와 상의하세요.",
    langLabel: "언어",
    chipNoWall: "구독 유도 벽 없음",
    chipAnyDay: "어느 날짜든 기록 (오늘에 묶이지 않음)",
    chipEditDoses: "잘못된 용량 수정·삭제",
    chipUnlimited: "화합물 무제한 무료",
    chipArithmetic: "계산기는 산술만 — 의료 조언 아님",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    quickLogTitle: "빠른 기록",
    compoundLabel: "화합물",
    amountLabel: "용량",
    unitLabel: "단위",
    datetimeLabel: "날짜·시간 (수정 가능)",
    siteLabel: "주사 부위",
    siteNone: "부위 선택 안 함",
    siteSuggested: "추천",
    vialLabel: "바이알 (선택)",
    vialNone: "바이알 연결 안 함",
    notesLabel: "메모",
    notesPlaceholder: "예: 아침 공복, 약간 따끔",
    saveLog: "기록 저장",
    logSaved: "기록을 저장했습니다",
    logUpdated: "기록을 수정했습니다",
    logDeleted: "기록을 삭제했습니다",
    needCompound: "화합물을 고르세요",
    needAmount: "0보다 큰 용량을 입력하세요",
    needDatetime: "날짜와 시간을 확인하세요",
    addCompoundFirst: "먼저 아래에서 화합물을 추가하세요.",
    calcTitle: "재구성 계산기",
    calcBody: "바이알 mg와 주사용수(BAC water) mL를 넣으면 농도가 나옵니다. 원하는 용량을 넣으면 주사기 눈금(단위)이 나옵니다. 곱셈과 나눗셈뿐입니다.",
    calcVialMg: "바이알 (mg)",
    calcDiluentMl: "주사용수 (mL)",
    calcConcentration: "농도",
    calcDesiredDose: "원하는 용량",
    calcDoseUnit: "용량 단위",
    calcSyringeUnits: "주사기 눈금",
    calcVolume: "부피",
    calcDosesPerVial: "바이알당 용량 횟수",
    calcSyringeNote: "기본 주사기: 인슐린 주사기 U-100 (100 단위 = 1 mL). 설정에서 바꿀 수 있습니다.",
    calcEmpty: "바이알 mg와 주사용수 mL를 입력하세요.",
    compoundsTitle: "화합물",
    addCompound: "화합물 추가",
    newCompoundTitle: "새 화합물",
    editCompoundTitle: "화합물 편집",
    nameLabel: "이름",
    namePlaceholder: "예: 화합물 A",
    defaultUnitLabel: "기본 단위",
    defaultDoseLabel: "기본 용량 (선택)",
    halfLifeLabel: "반감기 (시간, 선택)",
    halfLifeFieldHint: "직접 입력한 값으로만 추정 표시에 씁니다. 추정일 뿐이며 의료 조언이 아닙니다.",
    compoundNotesLabel: "메모 (선택)",
    compoundSaved: "화합물을 저장했습니다",
    compoundDeleted: "화합물을 삭제했습니다",
    deleteCompoundTitle: "‘{name}’을(를) 삭제할까요?",
    deleteCompoundBody: "이 화합물의 바이알 {vials}개, 기록 {logs}개, 스케줄 {schedules}개도 함께 삭제됩니다.",
    noCompoundsTitle: "아직 화합물이 없습니다",
    noCompoundsBody: "‘화합물 추가’로 시작하세요. 개수 제한이 없고 전부 무료입니다.",
    unlimitedHint: "개수 제한 없음 · 전부 무료",
    needName: "이름을 입력하세요",
    compoundCount: "{n}개",
    vialsTitle: "바이알 재고",
    addVial: "바이알 추가",
    newVialTitle: "새 바이알",
    editVialTitle: "바이알 편집",
    vialLabelField: "라벨 (선택)",
    vialMgLabel: "바이알 용량 (mg)",
    diluentLabel: "주사용수 (mL, 선택)",
    remainingMgLabel: "남은 양 (mg)",
    remainingMlLabel: "남은 양 (mL)",
    lowThresholdLabel: "부족 경고 기준",
    lowThresholdHint: "남은 양이 이 값 이하가 되면 ‘부족’ 표시가 뜹니다. 남은 mg가 있으면 mg, 없으면 mL 기준입니다.",
    reconstitutedAtLabel: "재구성한 날짜 (선택)",
    lowStock: "부족",
    inStock: "충분",
    noVialsTitle: "바이알이 없습니다",
    noVialsBody: "바이알을 추가하면 남은 양과 부족 경고를 볼 수 있습니다.",
    vialSaved: "바이알을 저장했습니다",
    vialDeleted: "바이알을 삭제했습니다",
    deleteVialTitle: "이 바이알을 삭제할까요?",
    deleteVialBody: "기록은 남고 바이알 연결만 사라집니다.",
    remainingLabel: "남음",
    needVialMg: "바이알 mg를 입력하세요",
    vialAutoDeduct: "기록에 바이알을 연결하면 남은 양에서 자동으로 뺍니다.",
    schedulesTitle: "스케줄 (프로토콜)",
    addSchedule: "스케줄 추가",
    newScheduleTitle: "새 스케줄",
    editScheduleTitle: "스케줄 편집",
    scheduleNameLabel: "스케줄 이름",
    scheduleNamePlaceholder: "예: A 월·수·금",
    doseLabel: "1회 용량",
    timesLabel: "시간 (HH:mm, 쉼표로 여러 개)",
    timesHint: "예: 08:00, 20:00",
    repeatLabel: "반복",
    repeatWeekdays: "요일 선택",
    repeatInterval: "N일마다",
    everyNDays: "{n}일마다",
    activeLabel: "활성",
    paused: "일시정지",
    sitePreferLabel: "선호 부위 (선택)",
    upcomingTitle: "다가오는 7일",
    markDone: "완료",
    done: "완료됨",
    noSchedulesTitle: "스케줄이 없습니다",
    noSchedulesBody: "여러 프로토콜을 각각 만들 수 있습니다. 완료를 누르면 기록이 생깁니다.",
    noUpcoming: "7일 안에 예정된 용량이 없습니다.",
    scheduleSaved: "스케줄을 저장했습니다",
    scheduleDeleted: "스케줄을 삭제했습니다",
    deleteScheduleTitle: "이 스케줄을 삭제할까요?",
    deleteScheduleBody: "이미 만들어진 기록은 그대로 남습니다.",
    needScheduleName: "스케줄 이름을 입력하세요",
    needDays: "요일을 하나 이상 고르거나 간격을 입력하세요",
    needTimes: "시간을 HH:mm 형식으로 하나 이상 입력하세요",
    daysShort: "일,월,화,수,목,금,토",
    calendarTitle: "달력",
    calendarBody: "아무 날이나 눌러 그날의 기록을 보고, 추가·수정·삭제하세요. 오늘에 묶이지 않습니다.",
    prevMonth: "이전 달",
    nextMonth: "다음 달",
    today: "오늘",
    logsOn: "{date} 기록",
    noLogsOn: "이 날에는 기록이 없습니다.",
    addLogForDay: "이 날에 기록 추가",
    editLogTitle: "기록 편집",
    deleteLogTitle: "이 기록을 삭제할까요?",
    deleteLogBody: "삭제한 기록은 되돌릴 수 없습니다.",
    edit: "편집",
    delete: "삭제",
    rotationTitle: "부위 로테이션",
    rotationBody: "최근 기록을 보고 가장 오래 쉰 부위를 제안합니다. 단순 순환일 뿐이며 언제든 다른 부위를 골라도 됩니다.",
    rotationNext: "다음 추천 부위",
    rotationUse: "빠른 기록에 넣기",
    lastUsed: "마지막",
    neverUsed: "사용 안 함",
    halfLifeTitle: "반감기 추정 (선택)",
    halfLifeToggle: "반감기 추정 보기",
    halfLifeEstimateOnly: "추정일 뿐 · 의료 조언 아님",
    halfLifeBody: "화합물에 직접 적은 반감기 시간으로 마지막 기록 이후 남은 양을 단순 감쇠식(절반씩 줄어듦)으로 계산합니다. 흡수·축적·개인차를 모르는 장난감 숫자이며 용량 판단에 쓰면 안 됩니다.",
    halfLifeLine: "{compound}: 마지막 {amount} {unit} 이후 {hours}시간 경과 → 약 {remaining} {unit} (반감기 {hl}시간)",
    halfLifeNoCompound: "반감기를 적어 둔 화합물이 없습니다. 화합물 편집에서 시간을 입력하세요.",
    halfLifeNoLog: "{compound}: 아직 기록이 없습니다.",
    suppliesTitle: "소모품 (선택)",
    suppliesBody: "알코올 솜, 주사기, 주사용수 같은 간단한 체크리스트입니다. 수량은 선택입니다.",
    addSupply: "추가",
    supplyNamePlaceholder: "예: 알코올 솜",
    qtyLabel: "수량",
    lowAtLabel: "부족 기준",
    supplyLow: "부족",
    noSupplies: "아직 소모품이 없습니다.",
    settingsTitle: "설정",
    unitsPerMlLabel: "주사기 눈금 (단위/mL)",
    unitsPerMlHint: "인슐린 주사기 U-100은 100. U-50이면 50.",
    defaultSiteLabel: "기본 부위",
    fontSize: "글자 크기",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "백업",
    backupBody: "화합물·바이알·기록·스케줄·소모품·설정을 JSON 파일 하나로 내보내고, 새 기기에서 가져오세요.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    exported: "JSON 파일을 내려받았습니다",
    importBad: "펩타이드로그 백업 파일이 아닙니다",
    importOk: "가져왔습니다: 화합물 {c}개, 기록 {l}개",
    importConfirmTitle: "현재 데이터를 바꿀까요?",
    importConfirmBody: "이 기기의 화합물·바이알·기록·스케줄이 파일 내용으로 교체됩니다.",
    clearAll: "모든 데이터 삭제",
    clearAllTitle: "모든 데이터를 삭제할까요?",
    clearAllBody: "이 기기의 화합물·바이알·기록·스케줄·소모품이 모두 지워집니다. 먼저 JSON으로 내보내 두세요.",
    cleared: "모든 데이터를 삭제했습니다",
    cancel: "취소",
    save: "저장",
    close: "닫기",
    about: "펩타이드로그는 계정 없는 무료 로컬 기록장입니다. 구독 유도 벽, 결제, 광고, AI 용량 추천이 없습니다. 모든 것은 이 기기에만 저장됩니다. 의료 조언이 아닙니다.",
    privacy: "개인정보처리방침",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "Peptidelog",
    shortName: "Peptidelog",
    tagline: "Free local peptide & injection tracker. Compounds, reconstitution calc, dose log, vial inventory, schedules, site rotation, JSON backup. No account. Not medical advice.",
    metaDescription:
      "Free local peptide and injection tracker with no account. Add unlimited compounds, turn vial mg and bacteriostatic water mL into concentration and syringe units (arithmetic only), and log dose, time, site and notes. Log, edit or delete on any day, track vial inventory with a low-stock warning, run several protocol schedules, get a site-rotation suggestion, and keep a JSON backup. No subscribe wall, no ads. Data stays on this device. Not medical advice.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers. Not medical advice.",
    notMedical: "Not medical advice. The calculator does arithmetic only. Discuss dosing with a qualified clinician.",
    langLabel: "Language",
    chipNoWall: "No subscribe wall",
    chipAnyDay: "Log any day (not locked to today)",
    chipEditDoses: "Edit/delete wrong doses",
    chipUnlimited: "Unlimited compounds free",
    chipArithmetic: "Calculator is arithmetic only — not medical advice",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    quickLogTitle: "Quick log",
    compoundLabel: "Compound",
    amountLabel: "Amount",
    unitLabel: "Unit",
    datetimeLabel: "Date & time (editable)",
    siteLabel: "Injection site",
    siteNone: "No site",
    siteSuggested: "suggested",
    vialLabel: "Vial (optional)",
    vialNone: "Not linked to a vial",
    notesLabel: "Notes",
    notesPlaceholder: "e.g. fasted, slight sting",
    saveLog: "Save log",
    logSaved: "Log saved",
    logUpdated: "Log updated",
    logDeleted: "Log deleted",
    needCompound: "Pick a compound",
    needAmount: "Enter an amount above 0",
    needDatetime: "Check the date and time",
    addCompoundFirst: "Add a compound below first.",
    calcTitle: "Reconstitution calculator",
    calcBody: "Enter the vial mg and the bacteriostatic water mL to get the concentration. Enter a desired dose to get syringe units. Nothing but multiplication and division.",
    calcVialMg: "Vial (mg)",
    calcDiluentMl: "Diluent / BAC water (mL)",
    calcConcentration: "Concentration",
    calcDesiredDose: "Desired dose",
    calcDoseUnit: "Dose unit",
    calcSyringeUnits: "Syringe units",
    calcVolume: "Volume",
    calcDosesPerVial: "Doses per vial",
    calcSyringeNote: "Default syringe: U-100 insulin syringe (100 units = 1 mL). Change it in Settings.",
    calcEmpty: "Enter the vial mg and the water mL.",
    compoundsTitle: "Compounds",
    addCompound: "Add compound",
    newCompoundTitle: "New compound",
    editCompoundTitle: "Edit compound",
    nameLabel: "Name",
    namePlaceholder: "e.g. Compound A",
    defaultUnitLabel: "Default unit",
    defaultDoseLabel: "Default dose (optional)",
    halfLifeLabel: "Half-life (hours, optional)",
    halfLifeFieldHint: "Used only for the optional estimate display, from the number you type. Estimate only, not medical advice.",
    compoundNotesLabel: "Notes (optional)",
    compoundSaved: "Compound saved",
    compoundDeleted: "Compound deleted",
    deleteCompoundTitle: "Delete “{name}”?",
    deleteCompoundBody: "Its {vials} vial(s), {logs} log(s) and {schedules} schedule(s) go with it.",
    noCompoundsTitle: "No compounds yet",
    noCompoundsBody: "Start with “Add compound”. There is no limit and nothing to pay.",
    unlimitedHint: "No limit · all free",
    needName: "Enter a name",
    compoundCount: "{n} total",
    vialsTitle: "Vial inventory",
    addVial: "Add vial",
    newVialTitle: "New vial",
    editVialTitle: "Edit vial",
    vialLabelField: "Label (optional)",
    vialMgLabel: "Vial size (mg)",
    diluentLabel: "Diluent (mL, optional)",
    remainingMgLabel: "Remaining (mg)",
    remainingMlLabel: "Remaining (mL)",
    lowThresholdLabel: "Low-stock threshold",
    lowThresholdHint: "A “Low” chip appears once the remaining amount is at or below this. Compared in mg when remaining mg is set, otherwise in mL.",
    reconstitutedAtLabel: "Reconstituted on (optional)",
    lowStock: "Low",
    inStock: "OK",
    noVialsTitle: "No vials yet",
    noVialsBody: "Add a vial to see what is left and get a low-stock warning.",
    vialSaved: "Vial saved",
    vialDeleted: "Vial deleted",
    deleteVialTitle: "Delete this vial?",
    deleteVialBody: "Logs stay; they just lose the vial link.",
    remainingLabel: "left",
    needVialMg: "Enter the vial mg",
    vialAutoDeduct: "Link a vial on a log and the remaining amount is reduced automatically.",
    schedulesTitle: "Schedules (protocols)",
    addSchedule: "Add schedule",
    newScheduleTitle: "New schedule",
    editScheduleTitle: "Edit schedule",
    scheduleNameLabel: "Schedule name",
    scheduleNamePlaceholder: "e.g. A Mon/Wed/Fri",
    doseLabel: "Dose per slot",
    timesLabel: "Times (HH:mm, comma-separated)",
    timesHint: "e.g. 08:00, 20:00",
    repeatLabel: "Repeat",
    repeatWeekdays: "Pick weekdays",
    repeatInterval: "Every N days",
    everyNDays: "every {n} days",
    activeLabel: "Active",
    paused: "Paused",
    sitePreferLabel: "Preferred site (optional)",
    upcomingTitle: "Next 7 days",
    markDone: "Done",
    done: "Done",
    noSchedulesTitle: "No schedules yet",
    noSchedulesBody: "Create one per protocol. Tapping Done on a slot writes a log.",
    noUpcoming: "Nothing scheduled in the next 7 days.",
    scheduleSaved: "Schedule saved",
    scheduleDeleted: "Schedule deleted",
    deleteScheduleTitle: "Delete this schedule?",
    deleteScheduleBody: "Logs already written stay as they are.",
    needScheduleName: "Enter a schedule name",
    needDays: "Pick at least one weekday or enter an interval",
    needTimes: "Enter at least one time as HH:mm",
    daysShort: "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    calendarTitle: "Calendar",
    calendarBody: "Tap any day to see its logs and add, edit or delete there. Never locked to today.",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    today: "Today",
    logsOn: "Logs on {date}",
    noLogsOn: "No logs on this day.",
    addLogForDay: "Add a log for this day",
    editLogTitle: "Edit log",
    deleteLogTitle: "Delete this log?",
    deleteLogBody: "A deleted log cannot be brought back.",
    edit: "Edit",
    delete: "Delete",
    rotationTitle: "Site rotation",
    rotationBody: "Suggests the site that has rested longest, from your recent logs. A plain round-robin; pick any other site whenever you like.",
    rotationNext: "Next suggested site",
    rotationUse: "Use in quick log",
    lastUsed: "last",
    neverUsed: "not used yet",
    halfLifeTitle: "Half-life estimate (optional)",
    halfLifeToggle: "Show half-life estimate",
    halfLifeEstimateOnly: "Estimate only · not medical advice",
    halfLifeBody: "Uses the half-life hours you typed on a compound and simple halving decay since the last log. A toy number that knows nothing about absorption, build-up or you; never use it to decide a dose.",
    halfLifeLine: "{compound}: {hours} h since the last {amount} {unit} → about {remaining} {unit} (half-life {hl} h)",
    halfLifeNoCompound: "No compound has a half-life yet. Enter hours under Edit compound.",
    halfLifeNoLog: "{compound}: no log yet.",
    suppliesTitle: "Supplies (optional)",
    suppliesBody: "A small checklist for alcohol swabs, syringes and water. Quantities are optional.",
    addSupply: "Add",
    supplyNamePlaceholder: "e.g. Alcohol swabs",
    qtyLabel: "Qty",
    lowAtLabel: "Low at",
    supplyLow: "Low",
    noSupplies: "No supplies yet.",
    settingsTitle: "Settings",
    unitsPerMlLabel: "Syringe scale (units per mL)",
    unitsPerMlHint: "100 for a U-100 insulin syringe, 50 for U-50.",
    defaultSiteLabel: "Default site",
    fontSize: "Text size",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "Backup",
    backupBody: "Export compounds, vials, logs, schedules, supplies and settings as one JSON file and import it on a new device.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exported: "JSON file downloaded",
    importBad: "That is not a Peptidelog backup file",
    importOk: "Imported: {c} compound(s), {l} log(s)",
    importConfirmTitle: "Replace the current data?",
    importConfirmBody: "Compounds, vials, logs and schedules on this device are replaced by the file.",
    clearAll: "Delete all data",
    clearAllTitle: "Delete all data?",
    clearAllBody: "Every compound, vial, log, schedule and supply on this device is erased. Export JSON first.",
    cleared: "All data deleted",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    about: "Peptidelog is a free local journal with no account. No subscribe wall, no payments, no ads and no AI dose suggestions. Everything stays on this device. Not medical advice.",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "ペプチドログ",
    shortName: "ペプチドログ",
    tagline: "無料のローカルペプチド・注射記録。化合物、再構成計算、用量ログ、バイアル在庫、スケジュール、部位ローテーション、JSONバックアップ。アカウント不要。医療助言ではありません。",
    metaDescription:
      "アカウント不要の無料ローカルペプチド・注射記録アプリ。化合物を数の制限なく登録し、バイアルmgと注射用水mLから濃度と注射器の目盛りを計算（算術のみ）し、用量・時刻・部位・メモを残せます。どの日でも記録・編集・削除、バイアル在庫と残量少警告、複数プロトコルのスケジュール、部位ローテーション提案、JSONバックアップ。サブスクの罠も広告もありません。データはこの端末だけ。医療助言ではありません。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。医療助言ではありません。",
    notMedical: "医療助言ではありません。計算機は算術のみです。用量・用法は医療専門家に相談してください。",
    langLabel: "言語",
    chipNoWall: "サブスク誘導の壁なし",
    chipAnyDay: "どの日でも記録（今日に固定されない）",
    chipEditDoses: "誤った用量を編集・削除",
    chipUnlimited: "化合物は無制限で無料",
    chipArithmetic: "計算機は算術のみ — 医療助言ではありません",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    quickLogTitle: "クイック記録",
    compoundLabel: "化合物",
    amountLabel: "用量",
    unitLabel: "単位",
    datetimeLabel: "日時（編集可）",
    siteLabel: "注射部位",
    siteNone: "部位を指定しない",
    siteSuggested: "おすすめ",
    vialLabel: "バイアル（任意）",
    vialNone: "バイアルに紐付けない",
    notesLabel: "メモ",
    notesPlaceholder: "例: 空腹時、少しチクッと",
    saveLog: "記録を保存",
    logSaved: "記録を保存しました",
    logUpdated: "記録を更新しました",
    logDeleted: "記録を削除しました",
    needCompound: "化合物を選んでください",
    needAmount: "0より大きい用量を入力してください",
    needDatetime: "日時を確認してください",
    addCompoundFirst: "まず下で化合物を追加してください。",
    calcTitle: "再構成計算機",
    calcBody: "バイアルmgと注射用水（BAC water）mLを入れると濃度が出ます。希望用量を入れると注射器の目盛り（単位）が出ます。掛け算と割り算だけです。",
    calcVialMg: "バイアル（mg）",
    calcDiluentMl: "注射用水（mL）",
    calcConcentration: "濃度",
    calcDesiredDose: "希望用量",
    calcDoseUnit: "用量の単位",
    calcSyringeUnits: "注射器の目盛り",
    calcVolume: "容量",
    calcDosesPerVial: "バイアルあたりの回数",
    calcSyringeNote: "既定の注射器: インスリン注射器 U-100（100単位 = 1 mL）。設定で変更できます。",
    calcEmpty: "バイアルmgと注射用水mLを入力してください。",
    compoundsTitle: "化合物",
    addCompound: "化合物を追加",
    newCompoundTitle: "新しい化合物",
    editCompoundTitle: "化合物を編集",
    nameLabel: "名前",
    namePlaceholder: "例: 化合物A",
    defaultUnitLabel: "既定の単位",
    defaultDoseLabel: "既定の用量（任意）",
    halfLifeLabel: "半減期（時間、任意）",
    halfLifeFieldHint: "入力した数値だけを使い、任意の推定表示にのみ使います。推定であり医療助言ではありません。",
    compoundNotesLabel: "メモ（任意）",
    compoundSaved: "化合物を保存しました",
    compoundDeleted: "化合物を削除しました",
    deleteCompoundTitle: "「{name}」を削除しますか？",
    deleteCompoundBody: "この化合物のバイアル{vials}件、記録{logs}件、スケジュール{schedules}件も一緒に削除されます。",
    noCompoundsTitle: "化合物はまだありません",
    noCompoundsBody: "「化合物を追加」から始めてください。数の制限はなく、すべて無料です。",
    unlimitedHint: "数の制限なし · すべて無料",
    needName: "名前を入力してください",
    compoundCount: "全{n}件",
    vialsTitle: "バイアル在庫",
    addVial: "バイアルを追加",
    newVialTitle: "新しいバイアル",
    editVialTitle: "バイアルを編集",
    vialLabelField: "ラベル（任意）",
    vialMgLabel: "バイアル容量（mg）",
    diluentLabel: "注射用水（mL、任意）",
    remainingMgLabel: "残量（mg）",
    remainingMlLabel: "残量（mL）",
    lowThresholdLabel: "残量少の基準",
    lowThresholdHint: "残量がこの値以下になると「残量少」が表示されます。残量mgがあればmg、なければmLで比べます。",
    reconstitutedAtLabel: "再構成した日（任意）",
    lowStock: "残量少",
    inStock: "十分",
    noVialsTitle: "バイアルはまだありません",
    noVialsBody: "バイアルを追加すると残量と残量少の警告が見られます。",
    vialSaved: "バイアルを保存しました",
    vialDeleted: "バイアルを削除しました",
    deleteVialTitle: "このバイアルを削除しますか？",
    deleteVialBody: "記録は残り、バイアルとの紐付けだけが外れます。",
    remainingLabel: "残り",
    needVialMg: "バイアルmgを入力してください",
    vialAutoDeduct: "記録にバイアルを紐付けると残量から自動で差し引きます。",
    schedulesTitle: "スケジュール（プロトコル）",
    addSchedule: "スケジュールを追加",
    newScheduleTitle: "新しいスケジュール",
    editScheduleTitle: "スケジュールを編集",
    scheduleNameLabel: "スケジュール名",
    scheduleNamePlaceholder: "例: A 月・水・金",
    doseLabel: "1回の用量",
    timesLabel: "時刻（HH:mm、カンマ区切りで複数可）",
    timesHint: "例: 08:00, 20:00",
    repeatLabel: "繰り返し",
    repeatWeekdays: "曜日を選ぶ",
    repeatInterval: "N日ごと",
    everyNDays: "{n}日ごと",
    activeLabel: "有効",
    paused: "一時停止",
    sitePreferLabel: "優先部位（任意）",
    upcomingTitle: "今後7日間",
    markDone: "完了",
    done: "完了済み",
    noSchedulesTitle: "スケジュールはまだありません",
    noSchedulesBody: "プロトコルごとに作れます。完了を押すと記録が作られます。",
    noUpcoming: "7日以内に予定された用量はありません。",
    scheduleSaved: "スケジュールを保存しました",
    scheduleDeleted: "スケジュールを削除しました",
    deleteScheduleTitle: "このスケジュールを削除しますか？",
    deleteScheduleBody: "すでに作られた記録はそのまま残ります。",
    needScheduleName: "スケジュール名を入力してください",
    needDays: "曜日を1つ以上選ぶか間隔を入力してください",
    needTimes: "時刻をHH:mm形式で1つ以上入力してください",
    daysShort: "日,月,火,水,木,金,土",
    calendarTitle: "カレンダー",
    calendarBody: "どの日でもタップしてその日の記録を見て、追加・編集・削除できます。今日に固定されません。",
    prevMonth: "前の月",
    nextMonth: "次の月",
    today: "今日",
    logsOn: "{date}の記録",
    noLogsOn: "この日の記録はありません。",
    addLogForDay: "この日に記録を追加",
    editLogTitle: "記録を編集",
    deleteLogTitle: "この記録を削除しますか？",
    deleteLogBody: "削除した記録は元に戻せません。",
    edit: "編集",
    delete: "削除",
    rotationTitle: "部位ローテーション",
    rotationBody: "最近の記録から、いちばん長く休ませた部位を提案します。単純な順繰りなので、いつでも別の部位を選べます。",
    rotationNext: "次のおすすめ部位",
    rotationUse: "クイック記録に入れる",
    lastUsed: "最終",
    neverUsed: "未使用",
    halfLifeTitle: "半減期の推定（任意）",
    halfLifeToggle: "半減期の推定を表示",
    halfLifeEstimateOnly: "推定のみ · 医療助言ではありません",
    halfLifeBody: "化合物に入力した半減期の時間を使い、最後の記録からの単純な半減の式で残量を計算します。吸収・蓄積・個人差を知らないおもちゃの数字で、用量の判断に使ってはいけません。",
    halfLifeLine: "{compound}: 最後の{amount} {unit}から{hours}時間経過 → 約{remaining} {unit}（半減期{hl}時間）",
    halfLifeNoCompound: "半減期を入力した化合物がありません。化合物の編集で時間を入力してください。",
    halfLifeNoLog: "{compound}: まだ記録がありません。",
    suppliesTitle: "消耗品（任意）",
    suppliesBody: "アルコール綿、注射器、注射用水などの簡単なチェックリストです。数量は任意です。",
    addSupply: "追加",
    supplyNamePlaceholder: "例: アルコール綿",
    qtyLabel: "数量",
    lowAtLabel: "残少基準",
    supplyLow: "残少",
    noSupplies: "消耗品はまだありません。",
    settingsTitle: "設定",
    unitsPerMlLabel: "注射器の目盛り（単位/mL）",
    unitsPerMlHint: "インスリン注射器U-100なら100、U-50なら50。",
    defaultSiteLabel: "既定の部位",
    fontSize: "文字サイズ",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "バックアップ",
    backupBody: "化合物・バイアル・記録・スケジュール・消耗品・設定を1つのJSONファイルに書き出し、新しい端末で読み込めます。",
    exportJson: "JSONを書き出す",
    importJson: "JSONを読み込む",
    exported: "JSONファイルをダウンロードしました",
    importBad: "ペプチドログのバックアップファイルではありません",
    importOk: "読み込みました: 化合物{c}件、記録{l}件",
    importConfirmTitle: "今のデータを置き換えますか？",
    importConfirmBody: "この端末の化合物・バイアル・記録・スケジュールがファイルの内容に置き換わります。",
    clearAll: "すべてのデータを削除",
    clearAllTitle: "すべてのデータを削除しますか？",
    clearAllBody: "この端末の化合物・バイアル・記録・スケジュール・消耗品がすべて消えます。先にJSONで書き出してください。",
    cleared: "すべてのデータを削除しました",
    cancel: "キャンセル",
    save: "保存",
    close: "閉じる",
    about: "ペプチドログはアカウント不要の無料ローカル記録帳です。サブスク誘導の壁、課金、広告、AIによる用量提案はありません。すべてこの端末にだけ保存されます。医療助言ではありません。",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "肽记录",
    shortName: "肽记录",
    tagline: "免费本地肽类与注射记录。化合物、复溶计算、剂量日志、药瓶库存、日程、部位轮换、JSON 备份。无需账号。非医疗建议。",
    metaDescription:
      "无需账号的免费本地肽类与注射记录应用。化合物数量不限，用药瓶 mg 和抑菌水 mL 算出浓度和注射器刻度（仅做算术），记录剂量、时间、部位和备注。任意日期都能记录、修改、删除，药瓶库存有低库存提醒，可同时跑多个方案日程，提供部位轮换建议，支持 JSON 备份。没有订阅墙，没有广告。数据仅保存在此设备。非医疗建议。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。非医疗建议。",
    notMedical: "非医疗建议。计算器仅做算术。剂量与用法请咨询合格医护人员。",
    langLabel: "语言",
    chipNoWall: "没有订阅墙",
    chipAnyDay: "任意日期可记录（不锁定今天）",
    chipEditDoses: "错误剂量可修改/删除",
    chipUnlimited: "化合物数量不限且免费",
    chipArithmetic: "计算器仅做算术 — 非医疗建议",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    quickLogTitle: "快速记录",
    compoundLabel: "化合物",
    amountLabel: "剂量",
    unitLabel: "单位",
    datetimeLabel: "日期与时间（可修改）",
    siteLabel: "注射部位",
    siteNone: "不选部位",
    siteSuggested: "建议",
    vialLabel: "药瓶（可选）",
    vialNone: "不关联药瓶",
    notesLabel: "备注",
    notesPlaceholder: "例如：空腹，轻微刺痛",
    saveLog: "保存记录",
    logSaved: "记录已保存",
    logUpdated: "记录已修改",
    logDeleted: "记录已删除",
    needCompound: "请选择化合物",
    needAmount: "请输入大于 0 的剂量",
    needDatetime: "请检查日期和时间",
    addCompoundFirst: "请先在下方添加化合物。",
    calcTitle: "复溶计算器",
    calcBody: "输入药瓶 mg 和抑菌水（BAC water）mL 得到浓度。输入想要的剂量得到注射器刻度（单位）。只有乘法和除法。",
    calcVialMg: "药瓶（mg）",
    calcDiluentMl: "抑菌水（mL）",
    calcConcentration: "浓度",
    calcDesiredDose: "想要的剂量",
    calcDoseUnit: "剂量单位",
    calcSyringeUnits: "注射器刻度",
    calcVolume: "体积",
    calcDosesPerVial: "每瓶可用次数",
    calcSyringeNote: "默认注射器：U-100 胰岛素注射器（100 单位 = 1 mL）。可在设置中修改。",
    calcEmpty: "请输入药瓶 mg 和抑菌水 mL。",
    compoundsTitle: "化合物",
    addCompound: "添加化合物",
    newCompoundTitle: "新化合物",
    editCompoundTitle: "编辑化合物",
    nameLabel: "名称",
    namePlaceholder: "例如：化合物 A",
    defaultUnitLabel: "默认单位",
    defaultDoseLabel: "默认剂量（可选）",
    halfLifeLabel: "半衰期（小时，可选）",
    halfLifeFieldHint: "只用你输入的数字，仅用于可选的估算显示。仅为估算，非医疗建议。",
    compoundNotesLabel: "备注（可选）",
    compoundSaved: "化合物已保存",
    compoundDeleted: "化合物已删除",
    deleteCompoundTitle: "删除“{name}”？",
    deleteCompoundBody: "它的 {vials} 个药瓶、{logs} 条记录和 {schedules} 个日程会一起删除。",
    noCompoundsTitle: "还没有化合物",
    noCompoundsBody: "从“添加化合物”开始。数量不限，无需付费。",
    unlimitedHint: "数量不限 · 全部免费",
    needName: "请输入名称",
    compoundCount: "共 {n} 个",
    vialsTitle: "药瓶库存",
    addVial: "添加药瓶",
    newVialTitle: "新药瓶",
    editVialTitle: "编辑药瓶",
    vialLabelField: "标签（可选）",
    vialMgLabel: "药瓶规格（mg）",
    diluentLabel: "抑菌水（mL，可选）",
    remainingMgLabel: "剩余（mg）",
    remainingMlLabel: "剩余（mL）",
    lowThresholdLabel: "低库存阈值",
    lowThresholdHint: "剩余量小于等于此值时显示“低库存”。填了剩余 mg 时按 mg 比较，否则按 mL。",
    reconstitutedAtLabel: "复溶日期（可选）",
    lowStock: "低库存",
    inStock: "充足",
    noVialsTitle: "还没有药瓶",
    noVialsBody: "添加药瓶即可查看剩余量并获得低库存提醒。",
    vialSaved: "药瓶已保存",
    vialDeleted: "药瓶已删除",
    deleteVialTitle: "删除这个药瓶？",
    deleteVialBody: "记录会保留，只是不再关联药瓶。",
    remainingLabel: "剩余",
    needVialMg: "请输入药瓶 mg",
    vialAutoDeduct: "记录里关联药瓶后，剩余量会自动扣减。",
    schedulesTitle: "日程（方案）",
    addSchedule: "添加日程",
    newScheduleTitle: "新日程",
    editScheduleTitle: "编辑日程",
    scheduleNameLabel: "日程名称",
    scheduleNamePlaceholder: "例如：A 周一/三/五",
    doseLabel: "每次剂量",
    timesLabel: "时间（HH:mm，逗号分隔可多个）",
    timesHint: "例如：08:00, 20:00",
    repeatLabel: "重复",
    repeatWeekdays: "选择星期",
    repeatInterval: "每 N 天",
    everyNDays: "每 {n} 天",
    activeLabel: "启用",
    paused: "已暂停",
    sitePreferLabel: "偏好部位（可选）",
    upcomingTitle: "未来 7 天",
    markDone: "完成",
    done: "已完成",
    noSchedulesTitle: "还没有日程",
    noSchedulesBody: "每个方案各建一个。点“完成”会生成一条记录。",
    noUpcoming: "未来 7 天没有安排的剂量。",
    scheduleSaved: "日程已保存",
    scheduleDeleted: "日程已删除",
    deleteScheduleTitle: "删除这个日程？",
    deleteScheduleBody: "已生成的记录会原样保留。",
    needScheduleName: "请输入日程名称",
    needDays: "至少选一个星期或输入间隔天数",
    needTimes: "至少输入一个 HH:mm 格式的时间",
    daysShort: "日,一,二,三,四,五,六",
    calendarTitle: "日历",
    calendarBody: "点任意一天查看当天记录，并在那一天添加、修改或删除。不锁定今天。",
    prevMonth: "上个月",
    nextMonth: "下个月",
    today: "今天",
    logsOn: "{date} 的记录",
    noLogsOn: "这一天没有记录。",
    addLogForDay: "在这一天添加记录",
    editLogTitle: "编辑记录",
    deleteLogTitle: "删除这条记录？",
    deleteLogBody: "删除后无法恢复。",
    edit: "编辑",
    delete: "删除",
    rotationTitle: "部位轮换",
    rotationBody: "根据最近记录建议休息最久的部位。只是简单轮流，随时可以选别的部位。",
    rotationNext: "下一个建议部位",
    rotationUse: "填入快速记录",
    lastUsed: "上次",
    neverUsed: "未用过",
    halfLifeTitle: "半衰期估算（可选）",
    halfLifeToggle: "显示半衰期估算",
    halfLifeEstimateOnly: "仅为估算 · 非医疗建议",
    halfLifeBody: "用你在化合物里填的半衰期小时数，按最后一条记录以来的简单减半公式算剩余量。这是一个不了解吸收、蓄积和个体差异的玩具数字，绝不能用来决定剂量。",
    halfLifeLine: "{compound}：距上次 {amount} {unit} 已 {hours} 小时 → 约 {remaining} {unit}（半衰期 {hl} 小时）",
    halfLifeNoCompound: "还没有化合物填写半衰期。请在编辑化合物中输入小时数。",
    halfLifeNoLog: "{compound}：还没有记录。",
    suppliesTitle: "耗材（可选）",
    suppliesBody: "酒精棉片、注射器、抑菌水之类的简单清单。数量可选。",
    addSupply: "添加",
    supplyNamePlaceholder: "例如：酒精棉片",
    qtyLabel: "数量",
    lowAtLabel: "低于",
    supplyLow: "不足",
    noSupplies: "还没有耗材。",
    settingsTitle: "设置",
    unitsPerMlLabel: "注射器刻度（单位/mL）",
    unitsPerMlHint: "U-100 胰岛素注射器填 100，U-50 填 50。",
    defaultSiteLabel: "默认部位",
    fontSize: "字号",
    fontMd: "A",
    fontLg: "A+",
    fontXl: "A++",
    backupTitle: "备份",
    backupBody: "把化合物、药瓶、记录、日程、耗材和设置导出为一个 JSON 文件，在新设备上导入。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    exported: "已下载 JSON 文件",
    importBad: "这不是肽记录的备份文件",
    importOk: "已导入：{c} 个化合物，{l} 条记录",
    importConfirmTitle: "替换当前数据？",
    importConfirmBody: "此设备上的化合物、药瓶、记录和日程将被文件内容替换。",
    clearAll: "删除全部数据",
    clearAllTitle: "删除全部数据？",
    clearAllBody: "此设备上的化合物、药瓶、记录、日程和耗材会全部清除。请先导出 JSON。",
    cleared: "已删除全部数据",
    cancel: "取消",
    save: "保存",
    close: "关闭",
    about: "肽记录是一个无需账号的免费本地记录本。没有订阅墙，没有付费，没有广告，也没有 AI 剂量建议。一切只保存在此设备。非医疗建议。",
    privacy: "隐私政策",
    terms: "使用条款",
    guide: "指南",
  },
};

/** Injection-site names, kept apart from Messages so the key list stays readable. */
export const SITE_NAMES: Record<Lang, Record<SiteId, string>> = {
  ko: {
    "abdomen-ul": "복부 좌상",
    "abdomen-ur": "복부 우상",
    "abdomen-ll": "복부 좌하",
    "abdomen-lr": "복부 우하",
    "thigh-l": "왼쪽 허벅지",
    "thigh-r": "오른쪽 허벅지",
    "deltoid-l": "왼쪽 어깨(삼각근)",
    "deltoid-r": "오른쪽 어깨(삼각근)",
    "glute-l": "왼쪽 둔부",
    "glute-r": "오른쪽 둔부",
  },
  en: {
    "abdomen-ul": "Abdomen upper left",
    "abdomen-ur": "Abdomen upper right",
    "abdomen-ll": "Abdomen lower left",
    "abdomen-lr": "Abdomen lower right",
    "thigh-l": "Left thigh",
    "thigh-r": "Right thigh",
    "deltoid-l": "Left deltoid",
    "deltoid-r": "Right deltoid",
    "glute-l": "Left glute",
    "glute-r": "Right glute",
  },
  ja: {
    "abdomen-ul": "腹部 左上",
    "abdomen-ur": "腹部 右上",
    "abdomen-ll": "腹部 左下",
    "abdomen-lr": "腹部 右下",
    "thigh-l": "左太もも",
    "thigh-r": "右太もも",
    "deltoid-l": "左三角筋",
    "deltoid-r": "右三角筋",
    "glute-l": "左臀部",
    "glute-r": "右臀部",
  },
  zh: {
    "abdomen-ul": "腹部左上",
    "abdomen-ur": "腹部右上",
    "abdomen-ll": "腹部左下",
    "abdomen-lr": "腹部右下",
    "thigh-l": "左大腿",
    "thigh-r": "右大腿",
    "deltoid-l": "左三角肌",
    "deltoid-r": "右三角肌",
    "glute-l": "左臀",
    "glute-r": "右臀",
  },
};

export function siteName(lang: Lang, site: string | undefined): string {
  if (!site) return "";
  const table = SITE_NAMES[lang] as Record<string, string>;
  return table[site] ?? site;
}

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
