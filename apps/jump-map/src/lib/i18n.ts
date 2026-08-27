/**
 * Every string the shell shows, in the four languages the app has always
 * shipped. The Worker (src/og-lang.ts) keeps its own copy of the head-facing
 * subset — it is bundled alone and must not drag React modules in — so any
 * edit to title / description / localOnly / portraitHint / noscript* here has
 * to be mirrored there.
 *
 * The HUD painted inside the canvas is translated separately, by
 * src/lib/hud-i18n.ts, because those strings live in the game engine.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];

/** Unchanged from the pre-Vite build, so a returning player keeps their pick. */
export const LANG_KEY = "jm_lang";

export const ORIGIN = "https://jump-map.try-dabble.com";

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

export const OG_LOCALE: Record<Lang, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
  zh: "zh_CN",
};

export const OG_IMAGE: Record<Lang, string> = {
  ko: `${ORIGIN}/og-image.png`,
  en: `${ORIGIN}/og-image-en.png`,
  ja: `${ORIGIN}/og-image-ja.png`,
  zh: `${ORIGIN}/og-image-zh.png`,
};

export type MsgKey =
  | "title"
  | "titleSub"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "portraitHint"
  | "noscriptJs"
  | "noscriptThemes"
  | "ariaLeft"
  | "ariaRight"
  | "ariaJump"
  | "ariaMenu"
  | "loading"
  | "howTo"
  | "howToGoal"
  | "howToKeys"
  | "howToTouch"
  | "howToMenu"
  | "close"
  | "themesTitle"
  | "themeUnder"
  | "themeUnderDesc"
  | "themeGround"
  | "themeGroundDesc"
  | "themeSky"
  | "themeSkyDesc"
  | "themeSpace"
  | "themeSpaceDesc"
  | "hazardsTitle"
  | "hazardSpike"
  | "hazardSpikeDesc"
  | "hazardFake"
  | "hazardFakeDesc"
  | "hazardFall"
  | "hazardFallDesc"
  | "keyMove"
  | "keyJump"
  | "keyMenu"
  | "keyShop"
  | "seoTitle"
  | "seoBody"
  | "installTitle"
  | "installBody";

type Sheet = Record<MsgKey, string>;

const ko: Sheet = {
  title: "블록점퍼",
  titleSub: "네 테마 점프",
  metaDescription:
    "블록을 점프해 멀리 가는 사이드스크롤 플랫포머 — 4테마(지하/땅/하늘/우주)와 추락-회복 메커닉",
  localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
  langLabel: "언어",
  portraitHint: "회전시켜주세요 (가로 모드 권장)",
  noscriptJs: "이 게임은 자바스크립트가 필요합니다. 브라우저의 자바스크립트를 활성화해 주세요.",
  noscriptThemes: "지하·땅·하늘·우주 4테마를 점프해 가는 픽셀 플랫포머입니다.",
  ariaLeft: "왼쪽",
  ariaRight: "오른쪽",
  ariaJump: "점프",
  ariaMenu: "메뉴",
  loading: "불러오는 중…",
  howTo: "플레이 방법",
  howToGoal:
    "발판을 건너 최대한 멀리 가세요. 가시와 가짜 발판을 조심하고, 떨어져도 추락 회복으로 한 번 더 기회가 있습니다.",
  howToKeys: "키보드: ← → 이동 · SPACE 점프 · Q/E 캐릭터 · S 상점 · M 메뉴",
  howToTouch: "터치: ◀ ▶ 로 이동, ⤴ 로 점프, ☰ 로 메뉴. 메뉴·상점은 항목을 탭하세요.",
  howToMenu: "메뉴에서 난이도 1~4와 타임 어택을 고를 수 있습니다.",
  close: "닫기",
  themesTitle: "4가지 테마",
  themeUnder: "지하",
  themeUnderDesc: "좁은 동굴과 벽돌 발판",
  themeGround: "땅",
  themeGroundDesc: "풀밭과 넓은 지면",
  themeSky: "하늘",
  themeSkyDesc: "구름 사이 떠 있는 발판",
  themeSpace: "우주",
  themeSpaceDesc: "저중력 별밭 구간",
  hazardsTitle: "함정과 회복",
  hazardSpike: "가시",
  hazardSpikeDesc: "주기적으로 솟는 가시. 타이밍을 보고 넘으세요.",
  hazardFake: "가짜 발판",
  hazardFakeDesc: "밟으면 무너집니다. 색을 잘 보세요.",
  hazardFall: "추락 회복",
  hazardFallDesc: "떨어져도 마지막 발판으로 되돌아옵니다.",
  keyMove: "이동",
  keyJump: "점프",
  keyMenu: "메뉴",
  keyShop: "상점",
  seoTitle: "설치 없이 바로 하는 픽셀 점프 게임",
  seoBody:
    "블록점퍼는 브라우저에서 바로 실행되는 무료 사이드스크롤 픽셀 플랫포머입니다. 지하·땅·하늘·우주 네 테마를 지나며 가시와 가짜 발판을 피하고, 코인을 모아 캐릭터와 업그레이드를 해금하세요. 기록은 이 기기에만 저장됩니다.",
  installTitle: "앱으로 설치",
  installBody:
    "브라우저 메뉴에서 홈 화면에 추가하면 전체 화면으로 실행되고, 오프라인에서도 열립니다.",
};

const en: Sheet = {
  title: "Block Jumper",
  titleSub: "Four-theme jumper",
  metaDescription:
    "A side-scrolling platformer where you jump across blocks — 4 themes (underground/ground/sky/space) with fall-recovery mechanic",
  localOnly: "Your data stays on this device. Nothing is sent to our servers.",
  langLabel: "Language",
  portraitHint: "Please rotate your device (landscape recommended)",
  noscriptJs: "This game needs JavaScript. Please enable JavaScript in your browser.",
  noscriptThemes: "Jump across four themes: underground, ground, sky, and space.",
  ariaLeft: "Left",
  ariaRight: "Right",
  ariaJump: "Jump",
  ariaMenu: "Menu",
  loading: "Loading…",
  howTo: "How to play",
  howToGoal:
    "Jump from platform to platform and get as far as you can. Watch for spikes and fake platforms — and if you fall, fall-recovery puts you back for one more try.",
  howToKeys: "Keyboard: ← → move · SPACE jump · Q/E character · S shop · M menu",
  howToTouch: "Touch: ◀ ▶ to move, ⤴ to jump, ☰ for the menu. Tap items in the menu and shop.",
  howToMenu: "The menu picks difficulty 1–4 and the time-attack mode.",
  close: "Close",
  themesTitle: "Four themes",
  themeUnder: "Underground",
  themeUnderDesc: "Tight caves and brick ledges",
  themeGround: "Ground",
  themeGroundDesc: "Grass and wide footing",
  themeSky: "Sky",
  themeSkyDesc: "Platforms floating between clouds",
  themeSpace: "Space",
  themeSpaceDesc: "Low-gravity starfield run",
  hazardsTitle: "Hazards and recovery",
  hazardSpike: "Spikes",
  hazardSpikeDesc: "They rise on a cycle. Time your jump.",
  hazardFake: "Fake platforms",
  hazardFakeDesc: "They collapse underfoot. Read the colour.",
  hazardFall: "Fall recovery",
  hazardFallDesc: "A fall returns you to the last solid platform.",
  keyMove: "Move",
  keyJump: "Jump",
  keyMenu: "Menu",
  keyShop: "Shop",
  seoTitle: "A pixel jump game with nothing to install",
  seoBody:
    "Block Jumper is a free side-scrolling pixel platformer that runs straight in the browser. Cross four themes — underground, ground, sky and space — dodge spikes and fake platforms, and spend the coins you collect on characters and upgrades. Your records stay on this device.",
  installTitle: "Install as an app",
  installBody:
    "Add it to your home screen from the browser menu: it opens full screen and works offline.",
};

const ja: Sheet = {
  title: "ブロックジャンパー",
  titleSub: "4つのテーマ",
  metaDescription:
    "ブロックをジャンプして遠くを目指す横スクロールプラットフォーマー — 4テーマ(地下/地上/空/宇宙)と落下リカバリー",
  localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
  langLabel: "言語",
  portraitHint: "画面を横にしてください（横向き推奨）",
  noscriptJs: "このゲームにはJavaScriptが必要です。ブラウザでJavaScriptを有効にしてください。",
  noscriptThemes: "地下・地上・空・宇宙の4テーマをジャンプするピクセルプラットフォーマーです。",
  ariaLeft: "左",
  ariaRight: "右",
  ariaJump: "ジャンプ",
  ariaMenu: "メニュー",
  loading: "読み込み中…",
  howTo: "遊び方",
  howToGoal:
    "足場を渡ってできるだけ遠くへ。トゲと偽物の足場に注意。落ちても落下リカバリーでもう一度チャンスがあります。",
  howToKeys: "キーボード: ← → 移動 · SPACE ジャンプ · Q/E キャラクター · S ショップ · M メニュー",
  howToTouch: "タッチ: ◀ ▶ で移動、⤴ でジャンプ、☰ でメニュー。メニューとショップは項目をタップ。",
  howToMenu: "メニューで難易度1〜4とタイムアタックを選べます。",
  close: "閉じる",
  themesTitle: "4つのテーマ",
  themeUnder: "地下",
  themeUnderDesc: "狭い洞窟とレンガの足場",
  themeGround: "地上",
  themeGroundDesc: "草原と広い地面",
  themeSky: "空",
  themeSkyDesc: "雲の間に浮かぶ足場",
  themeSpace: "宇宙",
  themeSpaceDesc: "低重力の星空ステージ",
  hazardsTitle: "罠とリカバリー",
  hazardSpike: "トゲ",
  hazardSpikeDesc: "周期的に出るトゲ。タイミングを見て跳ぼう。",
  hazardFake: "偽物の足場",
  hazardFakeDesc: "踏むと崩れます。色をよく見て。",
  hazardFall: "落下リカバリー",
  hazardFallDesc: "落ちても最後の足場に戻れます。",
  keyMove: "移動",
  keyJump: "ジャンプ",
  keyMenu: "メニュー",
  keyShop: "ショップ",
  seoTitle: "インストール不要のピクセルジャンプゲーム",
  seoBody:
    "ブロックジャンパーはブラウザだけで遊べる無料の横スクロールピクセルプラットフォーマーです。地下・地上・空・宇宙の4テーマを進み、トゲと偽物の足場をかわし、集めたコインでキャラクターやアップグレードを解放しましょう。記録はこの端末にだけ保存されます。",
  installTitle: "アプリとしてインストール",
  installBody:
    "ブラウザのメニューからホーム画面に追加すると、全画面で起動しオフラインでも開けます。",
};

const zh: Sheet = {
  title: "方块跳跃者",
  titleSub: "四大主题跳跃",
  metaDescription:
    "一款横版跳跃平台游戏：穿越地下、地面、天空、宇宙四个主题，跌落后还能重新站上踏板。",
  localOnly: "数据仅保存在此设备，不会上传到服务器。",
  langLabel: "语言",
  portraitHint: "请旋转设备（建议横屏）",
  noscriptJs: "此游戏需要启用 JavaScript。请在浏览器中开启 JavaScript。",
  noscriptThemes: "在地下、地面、天空、宇宙四个主题间跳跃的像素平台游戏。",
  ariaLeft: "向左",
  ariaRight: "向右",
  ariaJump: "跳跃",
  ariaMenu: "菜单",
  loading: "加载中…",
  howTo: "玩法说明",
  howToGoal:
    "在踏板之间跳跃，走得越远越好。小心尖刺和假踏板；即使跌落，也能靠跌落恢复再来一次。",
  howToKeys: "键盘：← → 移动 · SPACE 跳跃 · Q/E 角色 · S 商店 · M 菜单",
  howToTouch: "触屏：◀ ▶ 移动，⤴ 跳跃，☰ 打开菜单。菜单与商店直接点选项目。",
  howToMenu: "在菜单中可以选择难度 1~4 和限时挑战。",
  close: "关闭",
  themesTitle: "四个主题",
  themeUnder: "地下",
  themeUnderDesc: "狭窄洞穴与砖块踏板",
  themeGround: "地面",
  themeGroundDesc: "草地与宽阔的落脚点",
  themeSky: "天空",
  themeSkyDesc: "漂浮在云间的踏板",
  themeSpace: "宇宙",
  themeSpaceDesc: "低重力的星空关卡",
  hazardsTitle: "陷阱与恢复",
  hazardSpike: "尖刺",
  hazardSpikeDesc: "按节奏升起，看准时机再跳。",
  hazardFake: "假踏板",
  hazardFakeDesc: "踩上去就会塌，注意颜色。",
  hazardFall: "跌落恢复",
  hazardFallDesc: "跌落后会回到最后一块踏板。",
  keyMove: "移动",
  keyJump: "跳跃",
  keyMenu: "菜单",
  keyShop: "商店",
  seoTitle: "无需安装的像素跳跃游戏",
  seoBody:
    "方块跳跃者是一款直接在浏览器中运行的免费横版像素平台游戏。穿越地下、地面、天空与宇宙四个主题，躲开尖刺和假踏板，用收集到的金币解锁角色与强化。记录仅保存在此设备。",
  installTitle: "安装为应用",
  installBody: "在浏览器菜单中添加到主屏幕，即可全屏启动，离线也能打开。",
};

const SHEETS: Record<Lang, Sheet> = { ko, en, ja, zh };

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as string[]).includes(value);
}

export function translate(lang: Lang, key: MsgKey): string {
  return SHEETS[lang][key] ?? en[key] ?? key;
}

export type Translate = (key: MsgKey) => string;

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

/**
 * ?lang= wins — the language combo navigates there, so an in-page pick beats
 * everything below — then the td_lang cookie (so hops between try-dabble
 * subdomains keep the chosen language), then this app's saved jm_lang, and
 * Korean last, exactly like the pre-Vite langNow(). The Worker only ever sees
 * the query and the cookie, so those two must outrank localStorage or the
 * first HTML and the mounted app would disagree.
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
  return readStoredLang() ?? "ko";
}

/** The game engine reads jm_lang too, so this key must not drift. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — language just won't stick */
  }
}
