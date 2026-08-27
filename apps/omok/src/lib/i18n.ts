/**
 * Every string on the board, ported from the pre-Vite src/app/page.tsx UI
 * table and src/og-lang.ts — same wording, now one sheet shared by the app
 * and (in copy) by the Worker that localises the first HTML.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
/** Unchanged from the Next app, so a returning player keeps their pick. */
export const LANG_KEY = "omok_lang";

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
  ko: "https://omok.try-dabble.com/og-image.png",
  en: "https://omok.try-dabble.com/og-image-en.png",
  ja: "https://omok.try-dabble.com/og-image-ja.png",
  zh: "https://omok.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "titleSub"
  | "localOnly"
  | "metaDescription"
  | "langLabel"
  | "modeSubtitle"
  | "vsAi"
  | "vsAiDesc"
  | "vsPvp"
  | "vsPvpDesc"
  | "undo"
  | "restart"
  | "mode"
  | "changeMode"
  | "blackTurn"
  | "whiteTurn"
  | "blackTurnP1"
  | "whiteTurnP2"
  | "easy"
  | "medium"
  | "hard"
  | "difficulty"
  | "thinking"
  | "draw"
  | "blackWins"
  | "whiteWins"
  | "blackWinShort"
  | "whiteWinShort"
  | "reviewBoard"
  | "showResult"
  | "moves"
  | "totalMoves"
  | "congratulations"
  | "tryNextTime"
  | "goodGame"
  | "soundOff"
  | "soundOn"
  | "howToTitle"
  | "howToLi1"
  | "howToLi2"
  | "howToLi3"
  | "howToLi4"
  | "howToLi5"
  | "howToLi6"
  | "rulesTitle"
  | "rulesBody"
  | "freeBadge"
  | "close";

type Sheet = Record<MsgKey, string>;

const ko: Sheet = {
  title: "오목",
  titleSub: "五目並べ",
  localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
  metaDescription: "온라인 오목 게임",
  langLabel: "언어",
  modeSubtitle: "게임 모드를 선택하세요",
  vsAi: "AI 대결",
  vsAiDesc: "인공지능과 대결합니다",
  vsPvp: "2인 대결",
  vsPvpDesc: "친구와 번갈아 둡니다",
  undo: "무르기",
  restart: "다시하기",
  mode: "모드",
  changeMode: "모드 변경",
  blackTurn: "흑 차례",
  whiteTurn: "백 차례",
  blackTurnP1: "흑 차례 (1P)",
  whiteTurnP2: "백 차례 (2P)",
  easy: "초급",
  medium: "중급",
  hard: "고급",
  difficulty: "난이도",
  thinking: "AI 생각중...",
  draw: "무승부",
  blackWins: "흑의 승리",
  whiteWins: "백의 승리",
  blackWinShort: "흑 승리",
  whiteWinShort: "백 승리",
  reviewBoard: "기보 검토",
  showResult: "결과 보기",
  moves: "수순",
  totalMoves: "총 {n}수",
  congratulations: "축하합니다!",
  tryNextTime: "다음에는 이겨보세요",
  goodGame: "좋은 대국이었습니다",
  soundOff: "소리 끄기",
  soundOn: "소리 켜기",
  howToTitle: "게임 특징",
  howToLi1: "AI 대결 모드: 초급, 중급, 고급 3단계 난이도의 인공지능과 대결",
  howToLi2: "2인 대결 모드: 한 기기에서 친구와 함께 오목 대결",
  howToLi3: "무르기 기능: 실수한 수를 되돌릴 수 있는 무르기 지원",
  howToLi4: "기보 검토: 게임 종료 후 기보를 다시 확인",
  howToLi5: "반응형 디자인: PC, 태블릿, 스마트폰 모든 기기에서 최적화",
  howToLi6: "설치 불필요: 웹 브라우저에서 바로 플레이",
  rulesTitle: "오목 규칙",
  rulesBody:
    "흑이 먼저 둡니다. 두 사람이 번갈아 15×15 바둑판의 교차점에 돌을 놓고, 가로·세로·대각선 어느 방향이든 자기 돌 5개를 먼저 나란히 이으면 이깁니다.",
  freeBadge: "무료 · 설치 없음",
  close: "닫기",
};

const en: Sheet = {
  title: "Gomoku",
  titleSub: "五目並べ",
  localOnly: "Your data stays on this device. Nothing is sent to our servers.",
  metaDescription: "Online Gomoku (Five-in-a-Row) game",
  langLabel: "Language",
  modeSubtitle: "Choose a game mode",
  vsAi: "vs AI",
  vsAiDesc: "Play against the computer",
  vsPvp: "2-Player",
  vsPvpDesc: "Take turns with a friend",
  undo: "Undo",
  restart: "Restart",
  mode: "Mode",
  changeMode: "Change mode",
  blackTurn: "Black turn",
  whiteTurn: "White turn",
  blackTurnP1: "Black turn (1P)",
  whiteTurnP2: "White turn (2P)",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  difficulty: "Difficulty",
  thinking: "AI thinking",
  draw: "Draw",
  blackWins: "Black wins",
  whiteWins: "White wins",
  blackWinShort: "Black wins",
  whiteWinShort: "White wins",
  reviewBoard: "Review board",
  showResult: "Show result",
  moves: "Moves",
  totalMoves: "{n} moves",
  congratulations: "Congratulations!",
  tryNextTime: "Try again next time",
  goodGame: "A fine game",
  soundOff: "Mute",
  soundOn: "Sound on",
  howToTitle: "What you get",
  howToLi1: "vs AI: three difficulty levels (easy, medium, hard)",
  howToLi2: "2-player mode: play with a friend on one device",
  howToLi3: "Undo a mistaken move",
  howToLi4: "Review the board after the game",
  howToLi5: "Responsive layout for PC, tablet, and phone",
  howToLi6: "No install: play in the browser",
  rulesTitle: "Rules",
  rulesBody:
    "Black moves first. Players take turns placing a stone on an intersection of the 15×15 board; the first to line up five of their own stones — across, down or diagonally — wins.",
  freeBadge: "Free · no install",
  close: "Close",
};

const ja: Sheet = {
  title: "五目並べ",
  titleSub: "Gomoku",
  localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
  metaDescription: "オンライン五目並べゲーム",
  langLabel: "言語",
  modeSubtitle: "ゲームモードを選んでください",
  vsAi: "AI対戦",
  vsAiDesc: "コンピュータと対戦します",
  vsPvp: "2人対戦",
  vsPvpDesc: "友達と交互に打ちます",
  undo: "待った",
  restart: "もう一度",
  mode: "モード",
  changeMode: "モード変更",
  blackTurn: "黒の番",
  whiteTurn: "白の番",
  blackTurnP1: "黒の番 (1P)",
  whiteTurnP2: "白の番 (2P)",
  easy: "初級",
  medium: "中級",
  hard: "上級",
  difficulty: "難易度",
  thinking: "AI思考中...",
  draw: "引き分け",
  blackWins: "黒の勝ち",
  whiteWins: "白の勝ち",
  blackWinShort: "黒の勝ち",
  whiteWinShort: "白の勝ち",
  reviewBoard: "棋譜を見る",
  showResult: "結果を見る",
  moves: "手数",
  totalMoves: "計{n}手",
  congratulations: "おめでとうございます！",
  tryNextTime: "次は勝ちましょう",
  goodGame: "良い対局でした",
  soundOff: "音を消す",
  soundOn: "音を出す",
  howToTitle: "ゲームの特徴",
  howToLi1: "AI対戦: 初級・中級・上級の3段階",
  howToLi2: "2人対戦: 1台の端末で友達と対局",
  howToLi3: "待った: 打ち直しができます",
  howToLi4: "対局後に棋譜を確認",
  howToLi5: "PC・タブレット・スマホに対応",
  howToLi6: "インストール不要。ブラウザですぐ遊べます",
  rulesTitle: "五目並べのルール",
  rulesBody:
    "黒が先手です。15×15の盤の交点に交互に石を置き、縦・横・斜めのいずれかで自分の石を先に5つ並べた方が勝ちです。",
  freeBadge: "無料 · インストール不要",
  close: "閉じる",
};

const zh: Sheet = {
  title: "五子棋",
  titleSub: "Gomoku",
  localOnly: "数据仅保存在此设备，不会上传到服务器。",
  metaDescription: "在浏览器中畅玩五子棋。可与人工智能对弈，或与朋友双人对战。无需安装。",
  langLabel: "语言",
  modeSubtitle: "请选择游戏模式",
  vsAi: "AI对战",
  vsAiDesc: "与人工智能对战",
  vsPvp: "双人对战",
  vsPvpDesc: "与朋友轮流落子",
  undo: "悔棋",
  restart: "再来一局",
  mode: "模式",
  changeMode: "更换模式",
  blackTurn: "黑棋回合",
  whiteTurn: "白棋回合",
  blackTurnP1: "黑棋回合 (1P)",
  whiteTurnP2: "白棋回合 (2P)",
  easy: "初级",
  medium: "中级",
  hard: "高级",
  difficulty: "难度",
  thinking: "AI思考中...",
  draw: "平局",
  blackWins: "黑棋获胜",
  whiteWins: "白棋获胜",
  blackWinShort: "黑棋获胜",
  whiteWinShort: "白棋获胜",
  reviewBoard: "查看棋谱",
  showResult: "查看结果",
  moves: "手数",
  totalMoves: "共{n}手",
  congratulations: "恭喜！",
  tryNextTime: "下次再赢回来",
  goodGame: "这是一盘好棋",
  soundOff: "关闭声音",
  soundOn: "打开声音",
  howToTitle: "游戏特点",
  howToLi1: "AI对战：初级、中级、高级三档难度",
  howToLi2: "双人对战：同一设备上与朋友对弈",
  howToLi3: "悔棋：可以撤回走错的一步",
  howToLi4: "对局结束后可查看棋谱",
  howToLi5: "适配电脑、平板和手机",
  howToLi6: "无需安装，浏览器即可游玩",
  rulesTitle: "五子棋规则",
  rulesBody:
    "黑棋先行。双方轮流在 15×15 棋盘的交叉点落子，先在横、竖或斜任一方向连成五子的一方获胜。",
  freeBadge: "免费 · 无需安装",
  close: "关闭",
};

const SHEETS: Record<Lang, Sheet> = { ko, en, ja, zh };

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as string[]).includes(value);
}

export function translate(
  lang: Lang,
  key: MsgKey,
  vars?: Record<string, string | number>,
): string {
  let out = SHEETS[lang][key] ?? en[key] ?? key;
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

/**
 * ?lang= wins — the language combo navigates there, so an in-page pick beats
 * everything below — then the td_lang cookie (so hops between try-dabble
 * subdomains keep the chosen language), then this app's saved omok_lang, and
 * Korean last, exactly like the pre-Vite readUiLang(). The Worker only ever
 * sees the query and the cookie, so those two must outrank localStorage or
 * the first HTML and the mounted app would disagree.
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

export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — language just won't stick */
  }
}

export type Translate = (key: MsgKey, vars?: Record<string, string | number>) => string;
