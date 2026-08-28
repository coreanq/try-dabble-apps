/** Every visible string in ko/en/ja/zh. Same shape as the sibling apps. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "kinlog:lang";

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

/** zh has its own card. Never point it at the en file. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://kinlog.try-dabble.com/og-image.png",
  en: "https://kinlog.try-dabble.com/og-image-en.png",
  ja: "https://kinlog.try-dabble.com/og-image-ja.png",
  zh: "https://kinlog.try-dabble.com/og-image-zh.png",
};

/** Date formatting locale per UI language. */
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
  | "localOnly"
  | "metaDescription"
  | "about"
  | "langLabel"
  | "chipNoLogin"
  | "chipNoCard"
  | "chipNoContacts"
  | "chipNoIap"
  | "chipManual"
  | "addTitle"
  | "addHint"
  | "nameLabel"
  | "namePlaceholder"
  | "nameRequired"
  | "contextLabel"
  | "contextPlaceholder"
  | "addButton"
  | "personAdded"
  | "listTitle"
  | "peopleCount"
  | "overdueCount"
  | "searchLabel"
  | "searchPlaceholder"
  | "clearSearch"
  | "searchEmpty"
  | "sortLabel"
  | "sortNext"
  | "sortLast"
  | "sortName"
  | "sortAdded"
  | "emptyTitle"
  | "emptyBody"
  | "openCard"
  | "closeCard"
  | "notesLabel"
  | "notesPlaceholder"
  | "notesAutosave"
  | "contextCardLabel"
  | "lastContactLabel"
  | "nextContactLabel"
  | "contactedToday"
  | "plusWeek"
  | "plusMonth"
  | "plusThreeMonths"
  | "clearNext"
  | "statusOverdue"
  | "statusToday"
  | "statusInDays"
  | "statusNoNext"
  | "lastNever"
  | "lastAgo"
  | "lastToday"
  | "deletePerson"
  | "deleteConfirmTitle"
  | "deleteConfirmBody"
  | "cancel"
  | "delete"
  | "personDeleted"
  | "promiseTitle"
  | "promiseLogin"
  | "promiseCard"
  | "promiseContacts"
  | "promiseNotes"
  | "promiseSettings"
  | "promiseUnlimited"
  | "howTitle"
  | "howBody"
  | "privacy"
  | "terms";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "인연장",
    shortName: "인연장",
    tagline: "사람, 메모, 마지막 연락, 다음 연락. 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    metaDescription:
      "사람 이름을 직접 적어 두고, 그 사람 카드에 메모와 마지막 연락일·다음 연락일을 남기는 개인 인맥 수첩. 로그인도 카드 등록도 없고, 주소록 권한도 묻지 않습니다. 인원과 메모에 제한이 없고, 모든 기록은 이 기기에만 남습니다.",
    about:
      "친구·가족·거래처를 회사 CRM에 넣을 수는 없고, 머릿속에 두자니 자꾸 잊습니다. 인연장은 그 중간입니다. 이름을 직접 적고, 어떻게 알게 됐는지 한 줄을 붙이고, 그 사람 카드에 메모를 씁니다. 메모는 적는 대로 저장되고 새로고침해도 그대로 있습니다. 마지막으로 연락한 날과 다음에 연락할 날을 적어 두면 지난 사람부터 위로 올라옵니다.",
    langLabel: "언어",
    chipNoLogin: "로그인 없음",
    chipNoCard: "카드 등록 없음",
    chipNoContacts: "주소록 권한 안 물어봄",
    chipNoIap: "인원·메모 무제한",
    chipManual: "이름은 직접 입력",
    addTitle: "사람 추가",
    addHint: "이름만 있으면 됩니다. 가져오기도, 초대도 없습니다.",
    nameLabel: "이름 (필수)",
    namePlaceholder: "예: 김도현",
    nameRequired: "이름을 적어 주세요.",
    contextLabel: "어떻게 알게 됐나요 (선택)",
    contextPlaceholder: "예: 2019 회사 동기, 등산 모임",
    addButton: "수첩에 넣기",
    personAdded: "{name} 님을 넣었습니다.",
    listTitle: "인연장",
    peopleCount: "{n}명",
    overdueCount: "연락할 때 지남 {n}",
    searchLabel: "검색",
    searchPlaceholder: "이름이나 메모 속 말로 찾기",
    clearSearch: "검색 지우기",
    searchEmpty: "‘{q}’와 맞는 사람이 없습니다.",
    sortLabel: "정렬",
    sortNext: "다음 연락 순 (지난 사람 먼저)",
    sortLast: "오래 연락 안 한 순",
    sortName: "이름 순",
    sortAdded: "최근에 넣은 순",
    emptyTitle: "아직 아무도 없습니다",
    emptyBody:
      "이름을 직접 적어 첫 사람을 넣으세요. 그 사람 카드에 메모를 적고, 마지막으로 연락한 날과 다음에 연락할 날을 남길 수 있습니다. 메모는 저장 버튼 없이 적는 대로 저장되고, 새로고침해도 그대로입니다. 로그인도 카드 등록도 없고, 주소록 권한도 묻지 않습니다.",
    openCard: "카드 펼치기",
    closeCard: "카드 접기",
    notesLabel: "메모",
    notesPlaceholder: "아이 이름, 좋아하는 것, 지난번에 한 이야기…",
    notesAutosave: "저장 버튼 없음 — 적는 대로 이 카드에 남습니다.",
    contextCardLabel: "어떻게 알게 됐나",
    lastContactLabel: "마지막 연락",
    nextContactLabel: "다음 연락",
    contactedToday: "오늘 연락함",
    plusWeek: "1주 뒤",
    plusMonth: "1달 뒤",
    plusThreeMonths: "3달 뒤",
    clearNext: "다음 연락 비우기",
    statusOverdue: "{n}일 지남",
    statusToday: "오늘 연락",
    statusInDays: "{n}일 뒤",
    statusNoNext: "다음 연락 없음",
    lastNever: "아직 기록 없음",
    lastAgo: "{n}일 전",
    lastToday: "오늘",
    deletePerson: "이 사람 지우기",
    deleteConfirmTitle: "{name} 님을 지울까요?",
    deleteConfirmBody: "메모와 연락 날짜도 함께 지워집니다. 되돌릴 수 없습니다.",
    cancel: "취소",
    delete: "지우기",
    personDeleted: "지웠습니다.",
    promiseTitle: "없는 것들",
    promiseLogin: "로그인·회원가입 없음 — 열면 바로 첫 사람을 넣습니다",
    promiseCard: "카드 등록 화면 없음 — 결제 정보를 요구하지 않습니다",
    promiseContacts: "주소록 접근도, 친구 초대도 없음 — 이름은 직접 적습니다",
    promiseNotes: "메모는 그 사람 카드에 그대로 — 새로고침해도 사라지지 않습니다",
    promiseSettings: "다음 연락일과 알림 간격이 초기화되지 않습니다",
    promiseUnlimited: "사람 수·메모 길이 제한 없음, 유료 잠금 없음",
    howTitle: "어떻게 남나요",
    howBody:
      "사람, 메모, 연락 날짜, 정렬 방식은 모두 이 브라우저 안에만 저장됩니다. 시간이 지나도 지워지지 않고, 앱을 고쳐도 초기화되지 않습니다. 지워지는 건 직접 지울 때, 그리고 브라우저의 사이트 데이터를 지우거나 기기를 바꿀 때뿐입니다. 서버로는 아무것도 올라가지 않습니다.",
    privacy: "개인정보",
    terms: "이용약관",
  },
  en: {
    title: "Kinlog",
    shortName: "Kinlog",
    tagline: "People, notes, last contact, next contact. On this device only.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    metaDescription:
      "A private address book for the people you actually keep up with. Type a name, keep notes on that person's card, and record the last and next contact date. No login, no credit-card wall, no contacts permission. Unlimited people and notes, all stored on this device only.",
    about:
      "You cannot put friends and family into a work CRM, and keeping it all in your head means forgetting. Kinlog sits in between. Type a name, add one line about how you met, and write notes on that person's card. Notes save as you type and survive a reload. Record when you last spoke and when you want to speak next, and whoever is overdue rises to the top.",
    langLabel: "Language",
    chipNoLogin: "No login",
    chipNoCard: "No credit card",
    chipNoContacts: "No contacts permission",
    chipNoIap: "Unlimited people & notes",
    chipManual: "You type the names",
    addTitle: "Add a person",
    addHint: "A name is all it takes. No import, no invites.",
    nameLabel: "Name (required)",
    namePlaceholder: "e.g. Dana Whitfield",
    nameRequired: "Please type a name.",
    contextLabel: "How you met (optional)",
    contextPlaceholder: "e.g. 2019 team, climbing group",
    addButton: "Add to the book",
    personAdded: "{name} added.",
    listTitle: "Your book",
    peopleCount: "{n} people",
    overdueCount: "{n} overdue",
    searchLabel: "Search",
    searchPlaceholder: "Find by name or a word in a note",
    clearSearch: "Clear search",
    searchEmpty: "Nobody matches “{q}”.",
    sortLabel: "Sort",
    sortNext: "Next contact (overdue first)",
    sortLast: "Longest since last contact",
    sortName: "Name",
    sortAdded: "Recently added",
    emptyTitle: "Nobody in the book yet",
    emptyBody:
      "Type a name to add your first person. On their card you can keep notes and record the last and next contact date. Notes save as you type — there is no Save button — and they are still there after a reload. No login, no credit-card wall, and nothing asks for your contacts.",
    openCard: "Open card",
    closeCard: "Close card",
    notesLabel: "Notes",
    notesPlaceholder: "Kids' names, what they like, what you talked about last time…",
    notesAutosave: "No Save button — what you type stays on this card.",
    contextCardLabel: "How you met",
    lastContactLabel: "Last contact",
    nextContactLabel: "Next contact",
    contactedToday: "Talked today",
    plusWeek: "In a week",
    plusMonth: "In a month",
    plusThreeMonths: "In 3 months",
    clearNext: "Clear next contact",
    statusOverdue: "{n} days overdue",
    statusToday: "Due today",
    statusInDays: "In {n} days",
    statusNoNext: "No next contact",
    lastNever: "Not recorded yet",
    lastAgo: "{n} days ago",
    lastToday: "Today",
    deletePerson: "Delete this person",
    deleteConfirmTitle: "Delete {name}?",
    deleteConfirmBody: "The notes and the contact dates go with them. This cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    personDeleted: "Deleted.",
    promiseTitle: "What is not here",
    promiseLogin: "No login, no sign-up — open it and add the first person",
    promiseCard: "No credit-card screen — it never asks for payment details",
    promiseContacts: "No address-book access and no invite spam — you type the names",
    promiseNotes: "Notes stay on the person's card — a reload never loses them",
    promiseSettings: "Next-contact dates and reminder intervals never reset themselves",
    promiseUnlimited: "No cap on people or note length, no paid tier",
    howTitle: "How it is kept",
    howBody:
      "People, notes, contact dates and your sort choice live in this browser only. Nothing expires on a clock and an app update never resets it. It goes away only when you delete it, or when you clear the browser's site data or move to another device. Nothing is uploaded to our servers.",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "縁帳",
    shortName: "縁帳",
    tagline: "人、メモ、最後の連絡、次の連絡。この端末だけに。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    metaDescription:
      "名前を自分で書き入れて、その人のカードにメモと最後の連絡日・次の連絡日を残す個人用の人づきあい手帳。ログインもクレジットカード登録もなく、連絡先へのアクセスも求めません。人数もメモも無制限で、記録はこの端末にだけ残ります。",
    about:
      "友人や家族を仕事のCRMには入れられないし、頭の中だけだと忘れてしまいます。縁帳はその間にあります。名前を書き、どう知り合ったかを一行添え、その人のカードにメモを書きます。メモは書いたそばから保存され、再読み込みしても残ります。最後に連絡した日と次に連絡する日を入れておけば、過ぎた人から上に上がってきます。",
    langLabel: "言語",
    chipNoLogin: "ログインなし",
    chipNoCard: "カード登録なし",
    chipNoContacts: "連絡先の許可を求めない",
    chipNoIap: "人数・メモ無制限",
    chipManual: "名前は自分で入力",
    addTitle: "人を追加",
    addHint: "名前だけで足ります。取り込みも招待もありません。",
    nameLabel: "名前（必須）",
    namePlaceholder: "例: 田中 遥",
    nameRequired: "名前を書いてください。",
    contextLabel: "どう知り合ったか（任意）",
    contextPlaceholder: "例: 2019年の同期、山の会",
    addButton: "帳に入れる",
    personAdded: "{name} さんを入れました。",
    listTitle: "縁帳",
    peopleCount: "{n} 人",
    overdueCount: "連絡が過ぎた人 {n}",
    searchLabel: "検索",
    searchPlaceholder: "名前かメモの中の言葉で探す",
    clearSearch: "検索を消す",
    searchEmpty: "「{q}」に合う人はいません。",
    sortLabel: "並び",
    sortNext: "次の連絡順（過ぎた人が先）",
    sortLast: "連絡していない期間が長い順",
    sortName: "名前順",
    sortAdded: "最近入れた順",
    emptyTitle: "まだ誰もいません",
    emptyBody:
      "名前を書いて最初の一人を入れてください。その人のカードにメモを書き、最後に連絡した日と次に連絡する日を残せます。メモは保存ボタンなしで書いたそばから保存され、再読み込みしても残ります。ログインもカード登録もなく、連絡先の許可も求めません。",
    openCard: "カードを開く",
    closeCard: "カードを閉じる",
    notesLabel: "メモ",
    notesPlaceholder: "子どもの名前、好きなもの、前回話したこと…",
    notesAutosave: "保存ボタンはありません — 書いた内容はこのカードに残ります。",
    contextCardLabel: "どう知り合ったか",
    lastContactLabel: "最後の連絡",
    nextContactLabel: "次の連絡",
    contactedToday: "今日話した",
    plusWeek: "1週間後",
    plusMonth: "1か月後",
    plusThreeMonths: "3か月後",
    clearNext: "次の連絡を空にする",
    statusOverdue: "{n}日過ぎた",
    statusToday: "今日が期日",
    statusInDays: "{n}日後",
    statusNoNext: "次の連絡なし",
    lastNever: "まだ記録なし",
    lastAgo: "{n}日前",
    lastToday: "今日",
    deletePerson: "この人を消す",
    deleteConfirmTitle: "{name} さんを消しますか？",
    deleteConfirmBody: "メモと連絡日も一緒に消えます。元に戻せません。",
    cancel: "キャンセル",
    delete: "消す",
    personDeleted: "消しました。",
    promiseTitle: "ないもの",
    promiseLogin: "ログインも会員登録もなし — 開いてすぐ最初の一人を入れられます",
    promiseCard: "カード登録画面なし — 支払い情報を求めません",
    promiseContacts: "連絡先へのアクセスも招待もなし — 名前は自分で書きます",
    promiseNotes: "メモはその人のカードにそのまま — 再読み込みで消えません",
    promiseSettings: "次の連絡日や通知の間隔が勝手に初期化されません",
    promiseUnlimited: "人数もメモの長さも無制限、有料ロックなし",
    howTitle: "どう残るか",
    howBody:
      "人、メモ、連絡日、並び順はすべてこのブラウザの中だけに保存されます。時間で消えることはなく、アプリを更新しても初期化されません。なくなるのは自分で消したとき、そしてブラウザのサイトデータを消すか端末を替えたときだけです。サーバーには何も上がりません。",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    title: "亲友录",
    shortName: "亲友录",
    tagline: "人、备注、上次联系、下次联系。只在这台设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    metaDescription:
      "自己输入名字，在每个人的卡片上记备注、上次联系和下次联系日期的私人人脉本。无需登录，不要信用卡，也不申请通讯录权限。人数和备注都不限量，所有记录只留在这台设备。",
    about:
      "朋友和家人放不进公司的 CRM，只靠脑子记又会忘。亲友录处在中间。写下名字，加一句你们怎么认识的，再在这个人的卡片上写备注。备注边写边存，刷新后依然在。填上上次联系和下次联系的日期，过期的人就会排到最前面。",
    langLabel: "语言",
    chipNoLogin: "无需登录",
    chipNoCard: "不要信用卡",
    chipNoContacts: "不申请通讯录权限",
    chipNoIap: "人数、备注不限量",
    chipManual: "名字自己输入",
    addTitle: "添加一个人",
    addHint: "只要一个名字就够。不导入，不发邀请。",
    nameLabel: "姓名（必填）",
    namePlaceholder: "例：陈立",
    nameRequired: "请输入姓名。",
    contextLabel: "怎么认识的（可选）",
    contextPlaceholder: "例：2019 年同事、爬山群",
    addButton: "记进本子",
    personAdded: "已加入 {name}。",
    listTitle: "本子里的人",
    peopleCount: "{n} 人",
    overdueCount: "已过联系日 {n}",
    searchLabel: "搜索",
    searchPlaceholder: "用名字或备注里的词来找",
    clearSearch: "清除搜索",
    searchEmpty: "没有人匹配“{q}”。",
    sortLabel: "排序",
    sortNext: "按下次联系（过期的排前）",
    sortLast: "按最久没联系",
    sortName: "按姓名",
    sortAdded: "按最近添加",
    emptyTitle: "本子里还没有人",
    emptyBody:
      "输入一个名字，添加第一个人。在他的卡片上可以写备注，并记下上次联系和下次联系的日期。备注边写边存，没有保存按钮，刷新后依然在。无需登录，不要信用卡，也不会申请你的通讯录。",
    openCard: "展开卡片",
    closeCard: "收起卡片",
    notesLabel: "备注",
    notesPlaceholder: "孩子的名字、喜欢什么、上次聊了什么……",
    notesAutosave: "没有保存按钮 — 写下的内容就留在这张卡片上。",
    contextCardLabel: "怎么认识的",
    lastContactLabel: "上次联系",
    nextContactLabel: "下次联系",
    contactedToday: "今天联系过",
    plusWeek: "一周后",
    plusMonth: "一个月后",
    plusThreeMonths: "三个月后",
    clearNext: "清空下次联系",
    statusOverdue: "已过 {n} 天",
    statusToday: "今天到期",
    statusInDays: "{n} 天后",
    statusNoNext: "没有下次联系",
    lastNever: "还没有记录",
    lastAgo: "{n} 天前",
    lastToday: "今天",
    deletePerson: "删除这个人",
    deleteConfirmTitle: "删除 {name}？",
    deleteConfirmBody: "备注和联系日期会一起删除，无法撤销。",
    cancel: "取消",
    delete: "删除",
    personDeleted: "已删除。",
    promiseTitle: "这里没有的东西",
    promiseLogin: "没有登录，没有注册 — 打开就能加第一个人",
    promiseCard: "没有绑卡页面 — 不会索取支付信息",
    promiseContacts: "不读通讯录，也不发邀请 — 名字由你自己输入",
    promiseNotes: "备注就留在那个人的卡片上 — 刷新不会丢",
    promiseSettings: "下次联系日期和提醒间隔不会自己重置",
    promiseUnlimited: "人数和备注长度都不设上限，没有付费墙",
    howTitle: "怎么保存",
    howBody:
      "人、备注、联系日期和排序方式都只存在这个浏览器里。不会到期消失，更新应用也不会重置。只有你自己删除，或清除浏览器站点数据、更换设备时才会消失。什么都不会上传到服务器。",
    privacy: "隐私",
    terms: "条款",
  },
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
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value));
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
 * outrank localStorage or the first HTML and the mounted app would disagree.
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

/** Saved locally AND written to the shared td_lang cookie, so the Worker can
 *  serve the same language in the first HTML on the next request. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — language just won't stick */
  }
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `td_lang=${lang}; Domain=.try-dabble.com; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  } catch {
    /* cookies blocked — ?lang= still works */
  }
}

export type Translate = (
  key: MsgKey,
  vars?: Record<string, string | number>,
) => string;
