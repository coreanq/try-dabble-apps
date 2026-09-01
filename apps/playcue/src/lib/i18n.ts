/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "playcue:lang";

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
  | "about"
  | "chipStop"
  | "chipTap"
  | "chipNoAuto"
  | "chipNoLogin"
  | "chipLocal"
  | "howTitle"
  | "how1"
  | "how2"
  | "how3"
  | "how4"
  | "howWho"
  | "close"
  | "deckTitle"
  | "lampStandby"
  | "lampOnAir"
  | "lampHeld"
  | "lampStopped"
  | "nowLabel"
  | "nextLabel"
  | "noneLoaded"
  | "endOfList"
  | "position"
  | "remaining"
  | "goStart"
  | "goPause"
  | "goResume"
  | "goNext"
  | "subStart"
  | "subPause"
  | "subResume"
  | "subNext"
  | "subEnd"
  | "subEmpty"
  | "stopBtn"
  | "backToFirst"
  | "loopOne"
  | "loopOneHint"
  | "cueListTitle"
  | "addBtn"
  | "addMore"
  | "addHint"
  | "formats"
  | "emptyTitle"
  | "emptyStep1"
  | "emptyStep2"
  | "emptyStep3"
  | "emptyStep4"
  | "moveUp"
  | "moveDown"
  | "removeCue"
  | "makeCurrent"
  | "cueNo"
  | "missingFile"
  | "clearAll"
  | "clearAllConfirm"
  | "removeConfirm"
  | "cancel"
  | "remove"
  | "toastAdded"
  | "toastRemoved"
  | "toastCleared"
  | "toastSkipped"
  | "toastStoreFail"
  | "toastPlayFail"
  | "privacy"
  | "terms";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "플레이큐",
    shortName: "플레이큐",
    tagline: "한 곡이 끝나면 멈춥니다. 누르면 다음. 이 기기에만.",
    metaDescription:
      "공연·수업용 큐 목록. 한 곡이 끝나면 멈춥니다. 다음 곡은 큰 GO 버튼을 눌러야 시작합니다. 자동 넘김 없음, 로그인 없음, 이 기기의 파일만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    about:
      "한 곡이 끝나면 정지하고 조용해집니다. 다음 곡은 큰 GO 버튼을 눌러야 시작합니다. MusicPlay·notevibes처럼 다음 곡으로 자동으로 넘어가지 않습니다.",
    chipStop: "끝나면 정지",
    chipTap: "눌러야 다음",
    chipNoAuto: "자동 넘김 없음",
    chipNoLogin: "로그인 없음",
    chipLocal: "이 기기 파일만",
    howTitle: "쓰는 법",
    how1: "1. 이 기기의 음악 파일을 넣습니다. 여러 개를 한 번에 넣어도 됩니다.",
    how2: "2. GO를 누르면 지금 큐가 재생됩니다.",
    how3: "3. 곡이 끝나면 멈춥니다. 조용합니다. 다음 곡은 시작하지 않습니다.",
    how4: "4. 다시 GO를 누르면 다음 큐가 시작됩니다.",
    howWho: "무대 뒤·교실에서 휴대폰을 들고 있는 진행자를 위한 화면입니다.",
    close: "닫기",
    deckTitle: "재생 중",
    lampStandby: "대기",
    lampOnAir: "재생 중",
    lampHeld: "일시정지",
    lampStopped: "정지",
    nowLabel: "지금",
    nextLabel: "다음",
    noneLoaded: "큐가 없습니다",
    endOfList: "목록 끝입니다",
    position: "{i} / {n}",
    remaining: "남은 곡 {n}",
    goStart: "GO",
    goPause: "일시정지",
    goResume: "이어서",
    goNext: "GO",
    subStart: "{name} 재생",
    subPause: "{name} 재생 중",
    subResume: "{time}부터 이어서",
    subNext: "다음: {name}",
    subEnd: "마지막 큐가 끝났습니다",
    subEmpty: "먼저 음악 파일을 넣으세요",
    stopBtn: "정지",
    backToFirst: "첫 큐로",
    loopOne: "이 곡 반복",
    loopOneHint: "기본은 꺼짐. 켜면 지금 큐만 반복합니다.",
    cueListTitle: "큐 목록",
    addBtn: "음악 넣기",
    addMore: "더 넣기",
    addHint: "이 기기에 있는 파일만 씁니다. 업로드하지 않습니다.",
    formats: "mp3 · m4a · wav · ogg",
    emptyTitle: "큐가 비었습니다",
    emptyStep1: "음악 파일을 넣습니다.",
    emptyStep2: "GO를 눌러 한 곡을 재생합니다.",
    emptyStep3: "곡이 끝나면 멈춥니다.",
    emptyStep4: "다음 곡은 GO를 눌러야 시작합니다.",
    moveUp: "위로",
    moveDown: "아래로",
    removeCue: "빼기",
    makeCurrent: "이 큐로",
    cueNo: "Q{n}",
    missingFile: "파일을 찾을 수 없습니다. 다시 넣어 주세요.",
    clearAll: "전체 비우기",
    clearAllConfirm: "큐 목록을 모두 비울까요?",
    removeConfirm: "이 큐를 목록에서 뺄까요?",
    cancel: "취소",
    remove: "빼기",
    toastAdded: "{n}곡 넣었습니다",
    toastRemoved: "뺐습니다",
    toastCleared: "비웠습니다",
    toastSkipped: "오디오가 아닌 파일 {n}개는 건너뛰었습니다",
    toastStoreFail: "이 브라우저에는 파일을 남길 수 없습니다. 이번만 재생됩니다.",
    toastPlayFail: "이 파일은 재생할 수 없습니다.",
    privacy: "개인정보",
    terms: "이용약관",
  },
  en: {
    title: "Playcue",
    shortName: "Playcue",
    tagline: "It stops when the track ends. Tap for the next. On this device only.",
    metaDescription:
      "A cue list for a show or a class. The track ends and it STOPS. The next cue only starts when you tap the giant GO. No auto-advance, no login, local files only.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    about:
      "When a track ends it stops and goes quiet. The next cue only starts when you tap the giant GO. Unlike MusicPlay or notevibes, it never rolls into the next song on its own.",
    chipStop: "Stops at the end",
    chipTap: "Tap for the next",
    chipNoAuto: "No auto-advance",
    chipNoLogin: "No login",
    chipLocal: "Local files only",
    howTitle: "How it works",
    how1: "1. Add audio files from this device. Several at once is fine.",
    how2: "2. Tap GO and the current cue plays.",
    how3: "3. The track ends and it stops. Silence. Nothing starts by itself.",
    how4: "4. Tap GO again and the next cue starts.",
    howWho: "Built for a host or a teacher holding a phone backstage or in a classroom.",
    close: "Close",
    deckTitle: "Now playing",
    lampStandby: "STANDBY",
    lampOnAir: "PLAYING",
    lampHeld: "HELD",
    lampStopped: "STOPPED",
    nowLabel: "NOW",
    nextLabel: "NEXT",
    noneLoaded: "No cues yet",
    endOfList: "End of the list",
    position: "{i} / {n}",
    remaining: "{n} left",
    goStart: "GO",
    goPause: "PAUSE",
    goResume: "RESUME",
    goNext: "GO",
    subStart: "Play {name}",
    subPause: "Playing {name}",
    subResume: "Resume at {time}",
    subNext: "Next: {name}",
    subEnd: "The last cue has finished",
    subEmpty: "Add audio files first",
    stopBtn: "Stop",
    backToFirst: "Back to first",
    loopOne: "Loop this cue",
    loopOneHint: "Off by default. On, it repeats the current cue only.",
    cueListTitle: "Cue list",
    addBtn: "Add audio",
    addMore: "Add more",
    addHint: "Uses files already on this device. Nothing is uploaded.",
    formats: "mp3 · m4a · wav · ogg",
    emptyTitle: "The cue list is empty",
    emptyStep1: "Add your audio files.",
    emptyStep2: "Tap GO to play one.",
    emptyStep3: "When it ends, it stops.",
    emptyStep4: "Tap GO for the next one.",
    moveUp: "Move up",
    moveDown: "Move down",
    removeCue: "Remove",
    makeCurrent: "Make current",
    cueNo: "Q{n}",
    missingFile: "File is not available here. Add it again.",
    clearAll: "Clear all",
    clearAllConfirm: "Clear the whole cue list?",
    removeConfirm: "Remove this cue from the list?",
    cancel: "Cancel",
    remove: "Remove",
    toastAdded: "Added {n}",
    toastRemoved: "Removed",
    toastCleared: "Cleared",
    toastSkipped: "Skipped {n} non-audio file(s)",
    toastStoreFail: "This browser cannot keep the files. They play for this session only.",
    toastPlayFail: "This file will not play.",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "プレイキュー",
    shortName: "プレイキュー",
    tagline: "曲が終わると止まります。押せば次。この端末だけ。",
    metaDescription:
      "本番・授業用のキューリスト。曲が終わると止まります。次のキューは大きなGOを押したときだけ始まります。自動送りなし、ログインなし、この端末のファイルだけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    about:
      "曲が終わると停止して静かになります。次のキューは大きなGOを押したときだけ始まります。MusicPlayやnotevibesのように勝手に次の曲へ進みません。",
    chipStop: "終わったら停止",
    chipTap: "押して次へ",
    chipNoAuto: "自動送りなし",
    chipNoLogin: "ログインなし",
    chipLocal: "この端末のファイルだけ",
    howTitle: "使い方",
    how1: "1. この端末の音声ファイルを入れます。まとめて入れられます。",
    how2: "2. GOを押すと今のキューが再生されます。",
    how3: "3. 曲が終わると止まります。静かなままです。次は始まりません。",
    how4: "4. もう一度GOを押すと次のキューが始まります。",
    howWho: "舞台裏や教室でスマホを持つ進行役のための画面です。",
    close: "閉じる",
    deckTitle: "再生中",
    lampStandby: "待機",
    lampOnAir: "再生中",
    lampHeld: "一時停止",
    lampStopped: "停止",
    nowLabel: "いま",
    nextLabel: "つぎ",
    noneLoaded: "キューがありません",
    endOfList: "リストの終わりです",
    position: "{i} / {n}",
    remaining: "残り {n}",
    goStart: "GO",
    goPause: "一時停止",
    goResume: "再開",
    goNext: "GO",
    subStart: "{name} を再生",
    subPause: "{name} を再生中",
    subResume: "{time} から再開",
    subNext: "つぎ: {name}",
    subEnd: "最後のキューが終わりました",
    subEmpty: "先に音声ファイルを入れてください",
    stopBtn: "停止",
    backToFirst: "最初のキューへ",
    loopOne: "この曲をくり返す",
    loopOneHint: "初期値はオフ。オンにすると今のキューだけくり返します。",
    cueListTitle: "キューリスト",
    addBtn: "音声を入れる",
    addMore: "追加する",
    addHint: "この端末にあるファイルだけを使います。アップロードしません。",
    formats: "mp3 · m4a · wav · ogg",
    emptyTitle: "キューリストは空です",
    emptyStep1: "音声ファイルを入れます。",
    emptyStep2: "GOを押して1曲を再生します。",
    emptyStep3: "終わると止まります。",
    emptyStep4: "次の曲はGOを押してから始まります。",
    moveUp: "上へ",
    moveDown: "下へ",
    removeCue: "外す",
    makeCurrent: "このキューに",
    cueNo: "Q{n}",
    missingFile: "ファイルが見つかりません。もう一度入れてください。",
    clearAll: "全部消す",
    clearAllConfirm: "キューリストを全部消しますか？",
    removeConfirm: "このキューをリストから外しますか？",
    cancel: "キャンセル",
    remove: "外す",
    toastAdded: "{n}曲入れました",
    toastRemoved: "外しました",
    toastCleared: "消しました",
    toastSkipped: "音声でないファイル{n}件は飛ばしました",
    toastStoreFail: "このブラウザではファイルを残せません。今回だけ再生します。",
    toastPlayFail: "このファイルは再生できません。",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    title: "点播下曲",
    shortName: "点播下曲",
    tagline: "播完就停，点一下才下一首。仅此设备。",
    metaDescription:
      "演出和课堂用的提示单。一首播完就停。下一首只有按下大大的 GO 才开始。不自动续播，无需登录，仅用本机文件。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    about:
      "一首播完就停下来，保持安静。下一首只有按下大大的 GO 才开始。不像 MusicPlay 或 notevibes 那样自己接着播下一首。",
    chipStop: "播完即停",
    chipTap: "点一下才下一首",
    chipNoAuto: "不自动续播",
    chipNoLogin: "无需登录",
    chipLocal: "仅本机文件",
    howTitle: "怎么用",
    how1: "1. 加入本机的音频文件，可以一次多选。",
    how2: "2. 按 GO，当前这一条就播放。",
    how3: "3. 播完停下来，安静，不会自己开始下一首。",
    how4: "4. 再按一次 GO，下一条才开始。",
    howWho: "为在后台或教室里拿着手机的主持人和老师做的。",
    close: "关闭",
    deckTitle: "正在播放",
    lampStandby: "待命",
    lampOnAir: "播放中",
    lampHeld: "暂停",
    lampStopped: "已停止",
    nowLabel: "当前",
    nextLabel: "下一首",
    noneLoaded: "还没有曲目",
    endOfList: "已到列表末尾",
    position: "{i} / {n}",
    remaining: "还剩 {n}",
    goStart: "GO",
    goPause: "暂停",
    goResume: "继续",
    goNext: "GO",
    subStart: "播放 {name}",
    subPause: "正在播放 {name}",
    subResume: "从 {time} 继续",
    subNext: "下一首：{name}",
    subEnd: "最后一条已播完",
    subEmpty: "请先加入音频文件",
    stopBtn: "停止",
    backToFirst: "回到第一条",
    loopOne: "单曲循环",
    loopOneHint: "默认关闭。打开后只重复当前这一条。",
    cueListTitle: "提示单",
    addBtn: "加入音频",
    addMore: "继续加入",
    addHint: "只用此设备上已有的文件，不会上传。",
    formats: "mp3 · m4a · wav · ogg",
    emptyTitle: "提示单是空的",
    emptyStep1: "加入音频文件。",
    emptyStep2: "按 GO 播放一首。",
    emptyStep3: "播完就停下。",
    emptyStep4: "再按 GO 才播下一首。",
    moveUp: "上移",
    moveDown: "下移",
    removeCue: "移除",
    makeCurrent: "设为当前",
    cueNo: "Q{n}",
    missingFile: "找不到文件，请重新加入。",
    clearAll: "全部清空",
    clearAllConfirm: "清空整个提示单？",
    removeConfirm: "把这一条从提示单移除？",
    cancel: "取消",
    remove: "移除",
    toastAdded: "已加入 {n} 首",
    toastRemoved: "已移除",
    toastCleared: "已清空",
    toastSkipped: "跳过 {n} 个非音频文件",
    toastStoreFail: "此浏览器无法保存文件，本次会话内可播放。",
    toastPlayFail: "这个文件无法播放。",
    privacy: "隐私",
    terms: "条款",
  },
};

/** Same mapping as the Worker. zh has its own card — never the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://playcue.try-dabble.com/og-image-ko.png",
  en: "https://playcue.try-dabble.com/og-image-en.png",
  ja: "https://playcue.try-dabble.com/og-image-ja.png",
  zh: "https://playcue.try-dabble.com/og-image-zh.png",
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
