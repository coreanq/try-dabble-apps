/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the handful of these that also have to be in the FIRST HTML, and resolves
 * the language the same way this file does, so the served shell and the
 * mounted app never disagree.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "playset:lang";

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
  | "localOnly"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "langLabel"
  | "about"
  | "chipNoLogin"
  | "chipNoLock"
  | "chipNoSub"
  | "chipAllGames"
  | "chipPersist"
  | "gamePair"
  | "gameSequence"
  | "gameOdd"
  | "gameAdd"
  | "gameSort"
  | "gameTap"
  | "gamePairHow"
  | "gameSequenceHow"
  | "gameOddHow"
  | "gameAddHow"
  | "gameSortHow"
  | "gameTapHow"
  | "emptyTitle"
  | "emptyBody"
  | "emptyBody2"
  | "emptyCta"
  | "playlistsTitle"
  | "playlistsCount"
  | "newPlaylist"
  | "editorNewTitle"
  | "editorEditTitle"
  | "nameLabel"
  | "namePh"
  | "pickLabel"
  | "pickHint"
  | "queueLabel"
  | "queueEmpty"
  | "queueHint"
  | "stepsCount"
  | "aboutMinutes"
  | "loopLabel"
  | "loopHint"
  | "moveUp"
  | "moveDown"
  | "removeStep"
  | "clearQueue"
  | "save"
  | "cancel"
  | "edit"
  | "delete"
  | "play"
  | "deleteTitle"
  | "deleteBody"
  | "needName"
  | "needGame"
  | "saved"
  | "deletedMsg"
  | "resumeTitle"
  | "resumeBody"
  | "resume"
  | "startOver"
  | "stop"
  | "stopTitle"
  | "stopBody"
  | "keepPlaying"
  | "quit"
  | "next"
  | "wellDone"
  | "upNext"
  | "autoNext"
  | "finishedTitle"
  | "finishedBody"
  | "playAgain"
  | "backHome"
  | "position"
  | "readyTitle"
  | "readyBody"
  | "startNow"
  | "pairPrompt"
  | "sequenceWatch"
  | "sequenceGo"
  | "oddPrompt"
  | "addPrompt"
  | "sortByColor"
  | "sortByShape"
  | "tapPrompt"
  | "howTitle"
  | "howStep1"
  | "howStep2"
  | "howStep3"
  | "promiseTitle"
  | "promiseLogin"
  | "promiseLock"
  | "promiseSub"
  | "promiseAll"
  | "promisePersist"
  | "promiseCalm"
  | "privacy"
  | "terms";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "놀이세트",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    shortName: "놀이세트",
    tagline: "고른 게임만, 이어서. 이 기기에만.",
    metaDescription:
      "간단한 두뇌 게임 여섯 가지 중에서 원하는 것만 골라 목록으로 저장하고, 시작을 누르면 다음 게임이 저절로 이어집니다. 로그인도, 3게임 제한도, 구독도 없습니다. 목록은 탭을 닫아도 이 기기에 남습니다.",
    langLabel: "언어",
    about:
      "루모시티·픽·엘리베이트·뉴로네이션은 오늘의 훈련을 정해 주고, 하기 싫은 게임은 건너뛸 수 없습니다. 놀이세트는 반대입니다. 여섯 가지 중 원하는 것만 골라 순서대로 담아 두면, 시작을 누른 다음부터는 옆에 앉아 다음 게임을 눌러 줄 필요가 없습니다.",

    chipNoLogin: "로그인 없음",
    chipNoLock: "3게임 제한 없음",
    chipNoSub: "구독 없음",
    chipAllGames: "고른 게임 전부",
    chipPersist: "탭을 닫아도 남음",

    gamePair: "짝맞추기",
    gameSequence: "순서기억",
    gameOdd: "다른 것 찾기",
    gameAdd: "쉬운 덧셈",
    gameSort: "색·모양 분류",
    gameTap: "목표 탭",
    gamePairHow: "같은 그림 두 장을 찾습니다",
    gameSequenceHow: "불이 켜진 순서대로 누릅니다",
    gameOddHow: "하나만 다른 것을 누릅니다",
    gameAddHow: "더한 값을 고릅니다",
    gameSortHow: "맞는 상자에 넣습니다",
    gameTapHow: "나타나는 동그라미를 누릅니다",

    emptyTitle: "이렇게 씁니다",
    emptyBody:
      "아래 여섯 가지 중에서 같이 할 게임만 고릅니다. 하나만 골라도 되고, 같은 게임을 두 번 넣어도 됩니다.",
    emptyBody2:
      "이름을 붙여 저장하고 시작을 누르면, 한 게임이 끝날 때 다음 게임이 저절로 시작됩니다. 옆에 앉아 다음 것을 눌러 줄 필요가 없습니다.",
    emptyCta: "첫 목록 만들기",

    playlistsTitle: "내 목록",
    playlistsCount: "{n}개",
    newPlaylist: "새 목록 만들기",
    editorNewTitle: "새 목록",
    editorEditTitle: "목록 고치기",
    nameLabel: "목록 이름",
    namePh: "아침에 하는 것",
    pickLabel: "게임 고르기",
    pickHint: "누르면 목록 맨 뒤에 담깁니다. 같은 게임을 여러 번 담아도 됩니다.",
    queueLabel: "담은 순서",
    queueEmpty: "아직 담은 게임이 없습니다. 위에서 눌러 담으세요.",
    queueHint: "위에서부터 이 순서대로 저절로 이어집니다.",
    stepsCount: "{n}개",
    aboutMinutes: "약 {m}분",
    loopLabel: "끝나면 처음부터 다시",
    loopHint: "켜 두면 마지막 게임 다음에 첫 게임으로 돌아갑니다.",
    moveUp: "위로",
    moveDown: "아래로",
    removeStep: "빼기",
    clearQueue: "모두 비우기",
    save: "저장",
    cancel: "취소",
    edit: "고치기",
    delete: "삭제",
    play: "시작",
    deleteTitle: "‘{name}’을(를) 지울까요?",
    deleteBody: "이 목록만 지웁니다. 되돌릴 수 없습니다.",
    needName: "목록 이름을 적어 주세요.",
    needGame: "게임을 하나 이상 담아 주세요.",
    saved: "저장했습니다",
    deletedMsg: "지웠습니다",

    resumeTitle: "하던 것이 남아 있습니다",
    resumeBody: "‘{name}’ {i}번째 게임에서 멈췄습니다.",
    resume: "이어서 하기",
    startOver: "처음부터",

    stop: "그만",
    stopTitle: "그만할까요?",
    stopBody: "지금 목록을 닫습니다. 목록 자체는 그대로 남습니다.",
    keepPlaying: "계속하기",
    quit: "그만하기",

    next: "다음",
    wellDone: "잘했어요",
    upNext: "다음은 {name}",
    autoNext: "잠시 뒤에 저절로 시작합니다",
    finishedTitle: "다 했어요",
    finishedBody: "‘{name}’을(를) 끝까지 했습니다.",
    playAgain: "한 번 더",
    backHome: "목록으로",
    position: "{i} / {n}",
    readyTitle: "준비되면 시작하세요",
    readyBody: "‘{name}’ — 게임 {n}개",
    startNow: "지금 시작",

    pairPrompt: "같은 그림 두 장을 찾으세요",
    sequenceWatch: "잘 보세요",
    sequenceGo: "본 순서대로 누르세요",
    oddPrompt: "하나만 다릅니다. 다른 것을 누르세요",
    addPrompt: "더하면 얼마일까요?",
    sortByColor: "같은 색 상자에 넣으세요",
    sortByShape: "같은 모양 상자에 넣으세요",
    tapPrompt: "동그라미를 누르세요",

    howTitle: "쓰는 법",
    howStep1: "1. 하고 싶은 게임만 눌러서 담습니다.",
    howStep2: "2. 이름을 붙여 저장합니다. 목록은 몇 개든 만들 수 있습니다.",
    howStep3: "3. 시작을 누릅니다. 다음 게임은 저절로 이어집니다.",

    promiseTitle: "이 앱이 하지 않는 것",
    promiseLogin: "로그인도 회원가입도 없습니다. 열면 바로 고릅니다.",
    promiseLock: "하루 3게임 제한이 없습니다. 담은 만큼 다 합니다.",
    promiseSub: "유료 잠금이 없습니다. 여섯 가지 모두 그냥 열립니다.",
    promiseAll: "고른 게임은 하나도 빠짐없이 나옵니다. 다른 것을 대신 넣지 않습니다.",
    promisePersist: "탭을 닫아도 목록과 하던 위치가 이 기기에 남습니다.",
    promiseCalm: "빨간 실패 화면도, 점수 순위표도 없습니다.",

    privacy: "개인정보",
    terms: "이용약관",
  },

  en: {
    title: "Playset",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    shortName: "Playset",
    tagline: "Only the games you pick. Then the next one. On this device only.",
    metaDescription:
      "Pick only the simple brain games you want from six, save them as a playlist, and press play — the next game starts by itself. No login, no three-game lock, no subscription. The queue stays on this device even after you close the tab.",
    langLabel: "Language",
    about:
      "Lumosity, Peak, Elevate and NeuroNation hand you a daily set and will not let you skip the games you do not want. Playset is the other way round: pick only what you want from six, put them in order, and once you press play nobody has to sit there loading the next one by hand.",

    chipNoLogin: "No login",
    chipNoLock: "No 3-game lock",
    chipNoSub: "No subscription",
    chipAllGames: "Every game you picked",
    chipPersist: "Survives a tab close",

    gamePair: "Pair matching",
    gameSequence: "Sequence memory",
    gameOdd: "Find the different one",
    gameAdd: "Easy addition",
    gameSort: "Colour & shape sort",
    gameTap: "Target tap",
    gamePairHow: "Find the two that match",
    gameSequenceHow: "Tap them back in order",
    gameOddHow: "Tap the one that is different",
    gameAddHow: "Pick the total",
    gameSortHow: "Drop it in the right box",
    gameTapHow: "Tap the circle when it appears",

    emptyTitle: "How this works",
    emptyBody:
      "Pick only the games you actually want from the six below. One is fine. The same game twice is fine.",
    emptyBody2:
      "Give the list a name, save it, and press play. When one game ends the next one starts on its own — nobody has to sit beside them and load it by hand.",
    emptyCta: "Make your first list",

    playlistsTitle: "Your lists",
    playlistsCount: "{n}",
    newPlaylist: "New list",
    editorNewTitle: "New list",
    editorEditTitle: "Edit list",
    nameLabel: "List name",
    namePh: "Morning ones",
    pickLabel: "Pick games",
    pickHint: "Tapping one adds it to the end. Add the same game as often as you like.",
    queueLabel: "In this order",
    queueEmpty: "Nothing added yet. Tap a game above to add it.",
    queueHint: "They run top to bottom, one straight after the other.",
    stepsCount: "{n}",
    aboutMinutes: "about {m} min",
    loopLabel: "Start again at the end",
    loopHint: "Leave this on and the last game rolls back round to the first.",
    moveUp: "Up",
    moveDown: "Down",
    removeStep: "Remove",
    clearQueue: "Clear all",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    play: "Play",
    deleteTitle: "Delete “{name}”?",
    deleteBody: "This removes the list only. It cannot be undone.",
    needName: "Give the list a name.",
    needGame: "Add at least one game.",
    saved: "Saved",
    deletedMsg: "Deleted",

    resumeTitle: "You were part-way through",
    resumeBody: "“{name}”, stopped at game {i}.",
    resume: "Carry on",
    startOver: "Start over",

    stop: "Stop",
    stopTitle: "Stop for now?",
    stopBody: "This closes the list. The list itself stays where it is.",
    keepPlaying: "Keep playing",
    quit: "Stop",

    next: "Next",
    wellDone: "Well done",
    upNext: "Next: {name}",
    autoNext: "The next one starts in a moment",
    finishedTitle: "All done",
    finishedBody: "You went all the way through “{name}”.",
    playAgain: "Once more",
    backHome: "Back to lists",
    position: "{i} / {n}",
    readyTitle: "Start when you are ready",
    readyBody: "“{name}” — {n} games",
    startNow: "Start now",

    pairPrompt: "Find the two that match",
    sequenceWatch: "Watch",
    sequenceGo: "Now tap them in that order",
    oddPrompt: "One is different. Tap that one",
    addPrompt: "What do they add up to?",
    sortByColor: "Put it in the box of the same colour",
    sortByShape: "Put it in the box of the same shape",
    tapPrompt: "Tap the circle",

    howTitle: "How to use it",
    howStep1: "1. Tap only the games you want. They go into the list.",
    howStep2: "2. Name it and save. Make as many lists as you like.",
    howStep3: "3. Press play. The next game starts by itself.",

    promiseTitle: "What this app does not do",
    promiseLogin: "No login and no sign-up. Open it and start picking.",
    promiseLock: "No three-games-a-day lock. Everything you added is played.",
    promiseSub: "No paid tier. All six games simply open.",
    promiseAll: "Every game you picked shows up. Nothing is swapped for something else.",
    promisePersist: "Close the tab and the list — and your place in it — is still on this device.",
    promiseCalm: "No red fail screens and no score leaderboard.",

    privacy: "Privacy",
    terms: "Terms",
  },

  ja: {
    title: "プレイセット",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    shortName: "プレイセット",
    tagline: "選んだゲームだけ、つづけて。この端末だけ。",
    metaDescription:
      "六つのやさしい脳トレから、やりたいものだけを選んで並べて保存します。開始を押せば、次のゲームがひとりでに始まります。ログインも、一日3ゲームの制限も、サブスクもありません。並べた順番はタブを閉じてもこの端末に残ります。",
    langLabel: "言語",
    about:
      "Lumosity・Peak・Elevate・NeuroNationは今日のメニューを決めてきて、やりたくないゲームを飛ばせません。プレイセットは逆です。六つの中からやりたいものだけを選んで並べておけば、開始を押したあとは、隣に座って次のゲームを読み込んであげる必要がありません。",

    chipNoLogin: "ログインなし",
    chipNoLock: "3ゲーム制限なし",
    chipNoSub: "サブスクなし",
    chipAllGames: "選んだゲーム全部",
    chipPersist: "タブを閉じても残る",

    gamePair: "ペア合わせ",
    gameSequence: "順番おぼえ",
    gameOdd: "ちがうもの探し",
    gameAdd: "かんたんな足し算",
    gameSort: "色・形わけ",
    gameTap: "まとタップ",
    gamePairHow: "同じ絵を二枚さがします",
    gameSequenceHow: "光った順に押します",
    gameOddHow: "一つだけちがうものを押します",
    gameAddHow: "合計をえらびます",
    gameSortHow: "合う箱に入れます",
    gameTapHow: "出てきた丸を押します",

    emptyTitle: "つかい方",
    emptyBody:
      "下の六つから、いっしょにやるゲームだけを選びます。一つでも、同じゲームを二回入れてもかまいません。",
    emptyBody2:
      "名前をつけて保存し、開始を押します。一つ終わると次がひとりでに始まるので、隣で次を押してあげる必要はありません。",
    emptyCta: "はじめの一覧をつくる",

    playlistsTitle: "わたしの一覧",
    playlistsCount: "{n}件",
    newPlaylist: "新しい一覧",
    editorNewTitle: "新しい一覧",
    editorEditTitle: "一覧を直す",
    nameLabel: "一覧の名前",
    namePh: "朝にやるもの",
    pickLabel: "ゲームを選ぶ",
    pickHint: "押すと一番うしろに入ります。同じゲームを何回入れても大丈夫です。",
    queueLabel: "この順番で",
    queueEmpty: "まだ何も入っていません。上のゲームを押して入れてください。",
    queueHint: "上から順に、そのままつづけて進みます。",
    stepsCount: "{n}件",
    aboutMinutes: "およそ{m}分",
    loopLabel: "終わったら最初から",
    loopHint: "入れておくと、最後のゲームのあと最初にもどります。",
    moveUp: "上へ",
    moveDown: "下へ",
    removeStep: "はずす",
    clearQueue: "ぜんぶ消す",
    save: "保存",
    cancel: "キャンセル",
    edit: "直す",
    delete: "削除",
    play: "開始",
    deleteTitle: "「{name}」を消しますか？",
    deleteBody: "この一覧だけを消します。もとには戻せません。",
    needName: "一覧の名前を書いてください。",
    needGame: "ゲームを一つ以上入れてください。",
    saved: "保存しました",
    deletedMsg: "消しました",

    resumeTitle: "途中のものが残っています",
    resumeBody: "「{name}」の{i}番目で止まっています。",
    resume: "つづきから",
    startOver: "最初から",

    stop: "やめる",
    stopTitle: "やめますか？",
    stopBody: "いまの一覧を閉じます。一覧そのものは残ります。",
    keepPlaying: "つづける",
    quit: "やめる",

    next: "つぎ",
    wellDone: "よくできました",
    upNext: "つぎは{name}",
    autoNext: "少ししたらひとりでに始まります",
    finishedTitle: "ぜんぶ できました",
    finishedBody: "「{name}」を最後までやりました。",
    playAgain: "もう一回",
    backHome: "一覧へ",
    position: "{i} / {n}",
    readyTitle: "用意ができたら始めてください",
    readyBody: "「{name}」 — ゲーム{n}個",
    startNow: "いま始める",

    pairPrompt: "同じ絵を二枚さがしてください",
    sequenceWatch: "よく見てください",
    sequenceGo: "見た順に押してください",
    oddPrompt: "一つだけちがいます。ちがうものを押してください",
    addPrompt: "合わせるといくつ？",
    sortByColor: "同じ色の箱に入れてください",
    sortByShape: "同じ形の箱に入れてください",
    tapPrompt: "丸を押してください",

    howTitle: "使い方",
    howStep1: "1. やりたいゲームだけを押して入れます。",
    howStep2: "2. 名前をつけて保存します。一覧はいくつでも作れます。",
    howStep3: "3. 開始を押します。つぎのゲームはひとりでに始まります。",

    promiseTitle: "このアプリがしないこと",
    promiseLogin: "ログインも会員登録もありません。開いたらすぐ選べます。",
    promiseLock: "一日3ゲームの制限はありません。入れた分だけ全部やります。",
    promiseSub: "有料のロックがありません。六つとも、そのまま開きます。",
    promiseAll: "選んだゲームは一つ残らず出ます。別のものに差し替えません。",
    promisePersist: "タブを閉じても、一覧も途中の位置もこの端末に残ります。",
    promiseCalm: "赤い失敗画面も、点数の順位表もありません。",

    privacy: "プライバシー",
    terms: "利用規約",
  },

  zh: {
    title: "游戏套装",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    shortName: "游戏套装",
    tagline: "只玩选好的游戏，自动下一局。仅此设备。",
    metaDescription:
      "从六个简单的动脑小游戏里只挑你想玩的，排好顺序存成一份清单，按下开始，下一局会自己接上。不用登录，没有每天三局的限制，也不用订阅。清单和进度关掉标签页也还留在这台设备上。",
    langLabel: "语言",
    about:
      "Lumosity、Peak、Elevate、NeuroNation 会替你排好今天的训练，不想玩的也跳不过去。游戏套装反过来：六个里只挑想玩的，排好顺序，按下开始之后就不用有人坐在旁边一局一局地点开下一个。",

    chipNoLogin: "无需登录",
    chipNoLock: "没有3局限制",
    chipNoSub: "无需订阅",
    chipAllGames: "选好的都能玩",
    chipPersist: "关掉标签也还在",

    gamePair: "配对",
    gameSequence: "记顺序",
    gameOdd: "找不同",
    gameAdd: "简单加法",
    gameSort: "颜色·形状分类",
    gameTap: "点目标",
    gamePairHow: "找出一样的两张",
    gameSequenceHow: "按亮起的顺序点",
    gameOddHow: "点那个不一样的",
    gameAddHow: "选出得数",
    gameSortHow: "放进对的盒子",
    gameTapHow: "点出现的圆点",

    emptyTitle: "怎么用",
    emptyBody:
      "从下面六个里，只挑要一起玩的。挑一个也行，同一个放两次也行。",
    emptyBody2:
      "起个名字存下来，按开始。一局结束后下一局自己就开始了，不用有人坐在旁边点开下一个。",
    emptyCta: "建第一份清单",

    playlistsTitle: "我的清单",
    playlistsCount: "{n}份",
    newPlaylist: "新建清单",
    editorNewTitle: "新清单",
    editorEditTitle: "修改清单",
    nameLabel: "清单名字",
    namePh: "早上玩的",
    pickLabel: "挑游戏",
    pickHint: "点一下就加到最后。同一个游戏可以加很多次。",
    queueLabel: "按这个顺序",
    queueEmpty: "还没有加游戏。点上面的游戏加进来。",
    queueHint: "从上往下，一局接着一局。",
    stepsCount: "{n}局",
    aboutMinutes: "约{m}分钟",
    loopLabel: "玩完再从头开始",
    loopHint: "开着的话，最后一局之后会回到第一局。",
    moveUp: "上移",
    moveDown: "下移",
    removeStep: "移除",
    clearQueue: "全部清空",
    save: "保存",
    cancel: "取消",
    edit: "修改",
    delete: "删除",
    play: "开始",
    deleteTitle: "删除「{name}」吗？",
    deleteBody: "只删掉这份清单，无法撤销。",
    needName: "请给清单起个名字。",
    needGame: "请至少加一个游戏。",
    saved: "已保存",
    deletedMsg: "已删除",

    resumeTitle: "上次还没玩完",
    resumeBody: "「{name}」停在第 {i} 局。",
    resume: "接着玩",
    startOver: "从头开始",

    stop: "停止",
    stopTitle: "先停下吗？",
    stopBody: "这会关掉当前清单。清单本身还留着。",
    keepPlaying: "继续玩",
    quit: "停下",

    next: "下一局",
    wellDone: "做得好",
    upNext: "下一局：{name}",
    autoNext: "过一会儿会自己开始",
    finishedTitle: "全部完成",
    finishedBody: "「{name}」已经从头玩到尾。",
    playAgain: "再来一遍",
    backHome: "回到清单",
    position: "{i} / {n}",
    readyTitle: "准备好就开始",
    readyBody: "「{name}」 — {n} 个游戏",
    startNow: "现在开始",

    pairPrompt: "找出一样的两张",
    sequenceWatch: "看清楚",
    sequenceGo: "按刚才的顺序点",
    oddPrompt: "有一个不一样，点那个",
    addPrompt: "加起来是多少？",
    sortByColor: "放进同颜色的盒子",
    sortByShape: "放进同形状的盒子",
    tapPrompt: "点那个圆点",

    howTitle: "使用方法",
    howStep1: "1. 只点你想玩的游戏，加到清单里。",
    howStep2: "2. 起名保存。清单想建几份都行。",
    howStep3: "3. 按开始。下一局会自己接上。",

    promiseTitle: "这个应用不做的事",
    promiseLogin: "不用登录也不用注册。打开就能挑。",
    promiseLock: "没有每天三局的限制。加了多少就玩多少。",
    promiseSub: "没有付费解锁。六个游戏全都直接打开。",
    promiseAll: "挑好的游戏一个都不会少，也不会换成别的。",
    promisePersist: "关掉标签页，清单和玩到哪儿都还在这台设备上。",
    promiseCalm: "没有红色的失败画面，也没有分数排行榜。",

    privacy: "隐私",
    terms: "条款",
  },
};

/**
 * Per-language OG card. zh has its own card and must never be handed the
 * English one — the Worker mirrors this exact mapping.
 */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://playset.try-dabble.com/og-image.png",
  en: "https://playset.try-dabble.com/og-image-en.png",
  ja: "https://playset.try-dabble.com/og-image-ja.png",
  zh: "https://playset.try-dabble.com/og-image-zh.png",
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
 * ?lang= wins, then the shared td_lang cookie (so hops between try-dabble
 * subdomains keep the chosen language), then the language saved by this app,
 * then the browser. The Worker only sees the query and the cookie, so those
 * two must outrank localStorage or the first HTML and the mounted app would
 * disagree.
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

/** Saved locally AND written to the cookie the sibling apps read. */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode — the language just will not stick */
  }
  try {
    document.cookie = `td_lang=${lang}; Domain=.try-dabble.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  } catch {
    /* not on the real domain (local dev) — the cookie is simply skipped */
  }
}

export type Translate = (
  key: MsgKey,
  vars?: Record<string, string | number>,
) => string;
