/** Every visible string in ko/en/ja/zh. Same shape as the sibling apps. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "lastloved:lang";

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
  ko: "https://lastloved.try-dabble.com/og-image.png",
  en: "https://lastloved.try-dabble.com/og-image-en.png",
  ja: "https://lastloved.try-dabble.com/og-image-ja.png",
  zh: "https://lastloved.try-dabble.com/og-image-zh.png",
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
  | "tagline"
  | "localOnly"
  | "metaDescription"
  | "about"
  | "langLabel"
  | "chipNoLogin"
  | "chipNoLock"
  | "chipNoStream"
  | "chipTitleOnly"
  | "chipPersist"
  | "addTitle"
  | "addHint"
  | "titleLabel"
  | "titlePlaceholder"
  | "titleRequired"
  | "artistLabel"
  | "artistPlaceholder"
  | "artistRequired"
  | "lastLovedLabel"
  | "yearsLabel"
  | "yearsOption"
  | "addButton"
  | "songAdded"
  | "defaultYearsNote"
  | "dueTitle"
  | "dueSub"
  | "dueCount"
  | "waitingTitle"
  | "waitingSub"
  | "waitingCount"
  | "shelfTitle"
  | "songCount"
  | "searchLabel"
  | "searchPlaceholder"
  | "clearSearch"
  | "searchEmpty"
  | "emptyTitle"
  | "emptyBody"
  | "emptyBody2"
  | "stampBack"
  | "stampReturns"
  | "lastLovedOn"
  | "backSince"
  | "backToday"
  | "waitYearsDays"
  | "waitDays"
  | "returnsCount"
  | "lovedAgain"
  | "lovedAgainDone"
  | "editTitle"
  | "closeEdit"
  | "openEdit"
  | "deleteSong"
  | "deleteConfirmTitle"
  | "deleteConfirmBody"
  | "cancel"
  | "delete"
  | "songDeleted"
  | "promiseTitle"
  | "promiseLogin"
  | "promiseLock"
  | "promiseStream"
  | "promiseTitleOnly"
  | "promisePersist"
  | "promiseFree"
  | "howTitle"
  | "howBody"
  | "privacy"
  | "terms";

const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "그때그곡",
    tagline: "제목과 가수만. N년 뒤에 다시 만난다.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    metaDescription:
      "지금 아끼는 노래의 제목과 가수, 마지막으로 들은 날, 그리고 몇 년 뒤에 다시 만날지를 적어 두는 개인 기록장. 로그인도, 100곡 라이브러리 조건도, 스트리밍 연결도 없습니다. 제목과 가수만 있으면 되고, 탭을 닫아도 그대로 남습니다.",
    about:
      "음악을 재생하지 않습니다. 파일도, 스트리밍 계정도 필요 없습니다. 제목과 가수, 마지막으로 사랑한 날, 그리고 N년이라는 약속만 적습니다.",
    langLabel: "언어",
    chipNoLogin: "로그인 없음",
    chipNoLock: "곡 수 잠금 없음",
    chipNoStream: "스트리밍 연결 없음",
    chipTitleOnly: "제목과 가수면 충분",
    chipPersist: "탭을 닫아도 남음",
    addTitle: "지금 아끼는 곡 넣기",
    addHint: "제목과 가수는 필수입니다. 나머지는 그대로 둬도 됩니다.",
    titleLabel: "곡 제목",
    titlePlaceholder: "예: 밤편지",
    titleRequired: "곡 제목을 적어 주세요.",
    artistLabel: "가수",
    artistPlaceholder: "예: 아이유",
    artistRequired: "가수를 적어 주세요.",
    lastLovedLabel: "마지막으로 사랑한 날",
    yearsLabel: "몇 년 뒤에 다시 만날까요",
    yearsOption: "{n}년 뒤",
    addButton: "봉인하기",
    songAdded: "{title} — {n}년 뒤에 다시 만납니다.",
    defaultYearsNote: "여기서 고른 년수는 다음에 넣을 곡의 기본값이 됩니다.",
    dueTitle: "돌아온 곡",
    dueSub: "약속한 시간이 지났습니다. 다시 들어 보세요.",
    dueCount: "{n}곡",
    waitingTitle: "기다리는 중",
    waitingSub: "아직 봉인되어 있습니다.",
    waitingCount: "{n}곡",
    shelfTitle: "내 선반",
    songCount: "모두 {n}곡",
    searchLabel: "제목·가수 검색",
    searchPlaceholder: "제목이나 가수로 찾기",
    clearSearch: "지우기",
    searchEmpty: "\"{q}\"와 맞는 곡이 없습니다.",
    emptyTitle: "선반이 비어 있습니다",
    emptyBody:
      "요즘 계속 듣는 노래가 있나요? 제목과 가수만 적어 두고, 몇 년 뒤에 다시 만날지 고르세요. 그날이 오면 이 앱이 그 곡을 맨 위로 꺼내 놓습니다.",
    emptyBody2:
      "음악을 틀지는 않습니다. 파일도 스트리밍 계정도 없고, 로그인이나 100곡 조건도 없습니다.",
    stampBack: "돌아옴",
    stampReturns: "{y}년 귀환",
    lastLovedOn: "마지막",
    backSince: "{n}일 지남",
    backToday: "오늘 돌아왔어요",
    waitYearsDays: "{y}년 {d}일 남음",
    waitDays: "{d}일 남음",
    returnsCount: "{n}번째 재회",
    lovedAgain: "다시 들었어요",
    lovedAgainDone: "{title} — 오늘부터 다시 {n}년.",
    editTitle: "고치기",
    closeEdit: "접기",
    openEdit: "펼쳐서 고치기",
    deleteSong: "선반에서 빼기",
    deleteConfirmTitle: "{title}을(를) 뺄까요?",
    deleteConfirmBody: "이 기기에서 이 곡의 기록이 지워집니다. 되돌릴 수 없습니다.",
    cancel: "그대로 두기",
    delete: "빼기",
    songDeleted: "선반에서 뺐습니다.",
    promiseTitle: "약속",
    promiseLogin: "로그인도 회원가입도 없습니다. 열면 바로 첫 곡을 넣습니다.",
    promiseLock: "10곡, 100곡 같은 잠금이 없습니다. 몇 곡이든 넣으세요.",
    promiseStream: "스트리밍 계정 연결이 없습니다. 재생 버튼도, 오디오 파일도 없습니다.",
    promiseTitleOnly: "제목과 가수만 적으면 됩니다. 앨범도 커버도 필요 없습니다.",
    promisePersist: "탭을 닫아도, 브라우저를 닫아도 그대로 있습니다. 시간이 지나 지워지지 않습니다.",
    promiseFree: "구독도 결제도 없습니다. 곡 수 제한도 없습니다.",
    howTitle: "어디에 저장되나요",
    howBody:
      "곡, 날짜, 년수는 모두 이 브라우저에만 저장됩니다. 계정도 서버도 없습니다. 시간이 지나 저절로 지워지는 규칙도 없고, N년은 '다시 만나는 날'이지 '지워지는 날'이 아닙니다. 직접 빼거나, 브라우저의 사이트 데이터를 지우거나, 기기를 바꿀 때만 사라집니다.",
    privacy: "개인정보",
    terms: "약관",
  },
  en: {
    title: "Lastloved",
    tagline: "Title and artist. It comes back in N years.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    metaDescription:
      "A private log for the song you are wearing out right now: title, artist, the day you last loved it, and how many years until it comes back to you. No login, no 100-song library requirement, no streaming account. Title and artist is enough, and it survives closing the tab.",
    about:
      "It never plays anything. No audio files and no streaming account — just the title, the artist, the day you last loved it, and a promise measured in years.",
    langLabel: "Language",
    chipNoLogin: "No login",
    chipNoLock: "No song-count lock",
    chipNoStream: "No streaming account",
    chipTitleOnly: "Title and artist is enough",
    chipPersist: "Survives closing the tab",
    addTitle: "Seal a song you love right now",
    addHint: "Title and artist are required. Leave the rest as it is if you like.",
    titleLabel: "Song title",
    titlePlaceholder: "e.g. Wildflower",
    titleRequired: "Please type the song title.",
    artistLabel: "Artist",
    artistPlaceholder: "e.g. The Avalanches",
    artistRequired: "Please type the artist.",
    lastLovedLabel: "Date last loved",
    yearsLabel: "Years until it comes back",
    yearsOption: "in {n} years",
    addButton: "Seal it",
    songAdded: "{title} — sealed for {n} years.",
    defaultYearsNote: "The number you pick here becomes the default for the next song.",
    dueTitle: "Back now",
    dueSub: "The wait is over. Go and play them again.",
    dueCount: "{n} songs",
    waitingTitle: "Still waiting",
    waitingSub: "Sealed until their year comes round.",
    waitingCount: "{n} songs",
    shelfTitle: "Your shelf",
    songCount: "{n} songs in all",
    searchLabel: "Search title or artist",
    searchPlaceholder: "Search by title or artist",
    clearSearch: "Clear",
    searchEmpty: "Nothing matches “{q}”.",
    emptyTitle: "The shelf is empty",
    emptyBody:
      "Is there a song you have had on repeat lately? Write down the title and the artist, then choose how many years until you meet it again. When that day arrives, this app puts it back on top for you.",
    emptyBody2:
      "It does not play music. No files, no streaming account, no login and no 100-song requirement.",
    stampBack: "BACK",
    stampReturns: "RETURNS {y}",
    lastLovedOn: "Last loved",
    backSince: "{n} days ago",
    backToday: "Back today",
    waitYearsDays: "{y}y {d}d left",
    waitDays: "{d} days left",
    returnsCount: "reunion #{n}",
    lovedAgain: "Heard it again",
    lovedAgainDone: "{title} — another {n} years from today.",
    editTitle: "Edit",
    closeEdit: "Close",
    openEdit: "Open to edit",
    deleteSong: "Take off the shelf",
    deleteConfirmTitle: "Take “{title}” off the shelf?",
    deleteConfirmBody: "This removes the song from this device. It cannot be undone.",
    cancel: "Keep it",
    delete: "Remove",
    songDeleted: "Taken off the shelf.",
    promiseTitle: "The promise",
    promiseLogin: "No login and no sign-up. Open it and add the first song straight away.",
    promiseLock: "No 10-song or 100-song lock. Put as many on the shelf as you want.",
    promiseStream: "No streaming account to connect. No play button and no audio files.",
    promiseTitleOnly: "Title and artist is all you write. No album, no artwork, no metadata hunt.",
    promisePersist: "Close the tab, close the browser — it is all still here. Nothing expires on a clock.",
    promiseFree: "No subscription and no payment step. No cap on how many songs.",
    howTitle: "Where it is kept",
    howBody:
      "Songs, dates and year counts are kept in this browser only. There is no account and no server. Nothing expires on a timer: the N years is when a song comes BACK, not when it is deleted. A song leaves only when you remove it, when you clear the browser's site data, or when you switch devices.",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "あの頃の曲",
    tagline: "タイトルと歌手だけ。N年後にまた会える。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    metaDescription:
      "今いちばん聴いている曲のタイトルと歌手、最後に愛した日、そして何年後にまた会うかを書いておく個人の記録帳。ログインも、100曲のライブラリ条件も、ストリーミング連携もありません。タイトルと歌手だけで足り、タブを閉じても残ります。",
    about:
      "音楽は再生しません。音源もストリーミングのアカウントも要りません。タイトルと歌手、最後に愛した日、そして「N年」という約束だけを書きます。",
    langLabel: "言語",
    chipNoLogin: "ログインなし",
    chipNoLock: "曲数の制限なし",
    chipNoStream: "ストリーミング連携なし",
    chipTitleOnly: "タイトルと歌手だけでいい",
    chipPersist: "タブを閉じても残る",
    addTitle: "今好きな曲を封じる",
    addHint: "タイトルと歌手は必須です。あとはそのままでも構いません。",
    titleLabel: "曲名",
    titlePlaceholder: "例: 打上花火",
    titleRequired: "曲名を書いてください。",
    artistLabel: "歌手",
    artistPlaceholder: "例: DAOKO",
    artistRequired: "歌手を書いてください。",
    lastLovedLabel: "最後に愛した日",
    yearsLabel: "何年後にまた会いますか",
    yearsOption: "{n}年後",
    addButton: "封をする",
    songAdded: "{title} — {n}年後にまた会います。",
    defaultYearsNote: "ここで選んだ年数が、次に入れる曲の初期値になります。",
    dueTitle: "帰ってきた曲",
    dueSub: "約束の時間が過ぎました。もう一度どうぞ。",
    dueCount: "{n}曲",
    waitingTitle: "待っている曲",
    waitingSub: "まだ封じられています。",
    waitingCount: "{n}曲",
    shelfTitle: "自分の棚",
    songCount: "全部で{n}曲",
    searchLabel: "曲名・歌手で検索",
    searchPlaceholder: "曲名か歌手で探す",
    clearSearch: "消す",
    searchEmpty: "「{q}」に合う曲がありません。",
    emptyTitle: "棚が空です",
    emptyBody:
      "最近ずっと聴いている曲はありますか。タイトルと歌手だけ書いて、何年後にまた会うかを選んでください。その日が来たら、このアプリが一番上に出してくれます。",
    emptyBody2:
      "音楽は流しません。音源もストリーミングのアカウントもなく、ログインも100曲の条件もありません。",
    stampBack: "帰還",
    stampReturns: "{y}年に帰還",
    lastLovedOn: "最後",
    backSince: "{n}日過ぎた",
    backToday: "今日帰ってきた",
    waitYearsDays: "あと{y}年{d}日",
    waitDays: "あと{d}日",
    returnsCount: "{n}回目の再会",
    lovedAgain: "また聴いた",
    lovedAgainDone: "{title} — 今日からまた{n}年。",
    editTitle: "直す",
    closeEdit: "閉じる",
    openEdit: "開いて直す",
    deleteSong: "棚から外す",
    deleteConfirmTitle: "「{title}」を棚から外しますか？",
    deleteConfirmBody: "この端末からこの曲の記録が消えます。元に戻せません。",
    cancel: "そのままにする",
    delete: "外す",
    songDeleted: "棚から外しました。",
    promiseTitle: "約束",
    promiseLogin: "ログインも会員登録もありません。開いてすぐ最初の一曲を入れられます。",
    promiseLock: "10曲や100曲といったロックはありません。何曲でも置けます。",
    promiseStream: "ストリーミングの連携はありません。再生ボタンも音源もありません。",
    promiseTitleOnly: "書くのはタイトルと歌手だけ。アルバムもジャケットも要りません。",
    promisePersist: "タブを閉じてもブラウザを閉じても残ります。時間で消える仕組みはありません。",
    promiseFree: "定額課金も支払いもありません。曲数の上限もありません。",
    howTitle: "どこに保存されますか",
    howBody:
      "曲、日付、年数はこのブラウザにだけ保存されます。アカウントもサーバーもありません。時間で勝手に消える仕組みはなく、N年は「また会う日」であって「消える日」ではありません。自分で外すか、ブラウザのサイトデータを消すか、端末を替えたときだけ消えます。",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    title: "当年那首歌",
    tagline: "只要歌名和歌手。N 年后它会回来。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    metaDescription:
      "把你现在最爱的那首歌记下来：歌名、歌手、上次深爱的日期，以及多少年后再相见。无需登录，没有 100 首歌的曲库门槛，也不绑定流媒体。只要歌名和歌手，关掉标签页也还在。",
    about:
      "它不播放音乐，不需要音频文件，也不需要流媒体账号。只写歌名、歌手、上次深爱的日期，以及一个用年数写下的约定。",
    langLabel: "语言",
    chipNoLogin: "无需登录",
    chipNoLock: "不限歌曲数量",
    chipNoStream: "不绑定流媒体",
    chipTitleOnly: "只要歌名和歌手",
    chipPersist: "关掉标签页也还在",
    addTitle: "封存一首现在爱的歌",
    addHint: "歌名和歌手是必填的，其余保持原样也可以。",
    titleLabel: "歌名",
    titlePlaceholder: "例：晴天",
    titleRequired: "请写下歌名。",
    artistLabel: "歌手",
    artistPlaceholder: "例：周杰伦",
    artistRequired: "请写下歌手。",
    lastLovedLabel: "上次深爱的日期",
    yearsLabel: "几年后再相见",
    yearsOption: "{n} 年后",
    addButton: "封存",
    songAdded: "{title} — {n} 年后再相见。",
    defaultYearsNote: "这里选的年数会成为下一首歌的默认值。",
    dueTitle: "已经回来的歌",
    dueSub: "约定的时间到了，再听一遍吧。",
    dueCount: "{n} 首",
    waitingTitle: "还在等待",
    waitingSub: "仍然封存着。",
    waitingCount: "{n} 首",
    shelfTitle: "我的架子",
    songCount: "共 {n} 首",
    searchLabel: "搜索歌名或歌手",
    searchPlaceholder: "按歌名或歌手查找",
    clearSearch: "清除",
    searchEmpty: "没有和“{q}”相符的歌。",
    emptyTitle: "架子还是空的",
    emptyBody:
      "最近有没有一首一直在循环的歌？写下歌名和歌手，再选几年后重逢。那一天到了，这个应用会把它放回最上面。",
    emptyBody2:
      "它不播放音乐。没有音频文件，不绑定流媒体，也没有登录或 100 首歌的门槛。",
    stampBack: "已回来",
    stampReturns: "{y} 年归来",
    lastLovedOn: "上次",
    backSince: "已过 {n} 天",
    backToday: "今天回来了",
    waitYearsDays: "还有 {y} 年 {d} 天",
    waitDays: "还有 {d} 天",
    returnsCount: "第 {n} 次重逢",
    lovedAgain: "又听了一次",
    lovedAgainDone: "{title} — 从今天起再等 {n} 年。",
    editTitle: "修改",
    closeEdit: "收起",
    openEdit: "展开修改",
    deleteSong: "从架子上拿走",
    deleteConfirmTitle: "要把“{title}”拿走吗？",
    deleteConfirmBody: "这会从此设备删除这首歌的记录，无法恢复。",
    cancel: "先留着",
    delete: "拿走",
    songDeleted: "已从架子上拿走。",
    promiseTitle: "承诺",
    promiseLogin: "没有登录也没有注册。打开就能加第一首歌。",
    promiseLock: "没有 10 首或 100 首的锁。想放多少首都行。",
    promiseStream: "不需要连接流媒体账号。没有播放键，也没有音频文件。",
    promiseTitleOnly: "只写歌名和歌手。不用专辑，不用封面，不用找元数据。",
    promisePersist: "关掉标签页、关掉浏览器，它都还在。不会到时间自动消失。",
    promiseFree: "没有订阅，没有付费步骤，也不限歌曲数量。",
    howTitle: "保存在哪里",
    howBody:
      "歌曲、日期和年数只保存在这个浏览器里。没有账号，也没有服务器。没有到期自动删除的规则：N 年是“再相见的日子”，不是“被删除的日子”。只有你自己拿走、清除浏览器站点数据，或者换设备时才会消失。",
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
