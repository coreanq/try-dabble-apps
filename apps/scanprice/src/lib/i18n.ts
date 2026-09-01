/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "scanprice:lang";

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

export const DATE_LOCALE: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-GB",
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
  | "about"
  | "chipScan"
  | "chipStore"
  | "chipHistory"
  | "chipNoLogin"
  | "chipPersist"
  | "scanPanelTitle"
  | "scanBtn"
  | "scanAgain"
  | "scanDialogTitle"
  | "scanAim"
  | "scanStarting"
  | "scanDenied"
  | "scanUnsupported"
  | "scanPhotoBtn"
  | "scanPhotoHint"
  | "scanPhotoReading"
  | "scanNoRead"
  | "scanFormats"
  | "codeLabel"
  | "codePh"
  | "codeUse"
  | "codeBad"
  | "close"
  | "cancel"
  | "seenTitle"
  | "seenLast"
  | "seenCount"
  | "addToday"
  | "newTitle"
  | "newHint"
  | "nameLabel"
  | "namePh"
  | "optional"
  | "priceLabel"
  | "pricePh"
  | "storeLabel"
  | "storePh"
  | "storeRecent"
  | "savePrice"
  | "saveCode"
  | "listTitle"
  | "itemCount"
  | "searchPh"
  | "searchLabel"
  | "searchCount"
  | "searchEmpty"
  | "emptyTitle"
  | "emptyBody"
  | "emptyStep1"
  | "emptyStep2"
  | "emptyStep3"
  | "historyTitle"
  | "historyOpen"
  | "historyClose"
  | "priceCount"
  | "firstPrice"
  | "deltaUp"
  | "deltaDown"
  | "deltaSame"
  | "atStore"
  | "noStore"
  | "unnamed"
  | "codeCap"
  | "lastCap"
  | "deleteRow"
  | "deleteItem"
  | "deleteRowTitle"
  | "deleteRowBody"
  | "deleteItemTitle"
  | "deleteItemBody"
  | "delete"
  | "exportTitle"
  | "exportJson"
  | "exportCsv"
  | "importJson"
  | "exportHint"
  | "exportEmpty"
  | "exportDone"
  | "importDone"
  | "importNone"
  | "importFailed"
  | "priceAdded"
  | "itemAdded"
  | "itemDeleted"
  | "rowDeleted"
  | "needPrice"
  | "howTitle"
  | "howBody"
  | "privacy"
  | "terms";

export type Messages = Record<MsgKey, string>;

export const I18N: Record<Lang, Messages> = {
  ko: {
    title: "스캔가격",
    shortName: "스캔가격",
    tagline: "찍고, 적고, 다시 찍으면 예전 가격. 이 기기에만.",
    metaDescription:
      "매대에서 바코드를 찍고 붙어 있는 가격과 가게 이름을 적어 둡니다. 다음에 같은 바코드를 다시 찍으면 언제 어디서 얼마였는지 날짜별로 보여 줍니다. 로그인 없이 이 기기에만 저장됩니다.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    about:
      "Price Memory나 pricebook은 숫자를 손으로 치는 앱이라 바코드를 읽지 못하고, 같은 바코드를 다시 찍었을 때 지난 가격을 보여 주지도 않습니다. 스캔가격은 카메라로 바코드를 읽고, 가격마다 가게를 붙이고, 다시 찍으면 날짜가 붙은 내 기록을 꺼내 줍니다. 대형마트 가격 앱과 달리 남의 가격은 없습니다. 내가 매대에서 본 값만 남습니다.",
    chipScan: "카메라 바코드 스캔",
    chipStore: "가격마다 가게 표시",
    chipHistory: "다시 찍으면 지난 가격",
    chipNoLogin: "로그인 없음",
    chipPersist: "탭을 닫아도 남음",
    scanPanelTitle: "매대에서",
    scanBtn: "바코드 찍기",
    scanAgain: "다시 찍기",
    scanDialogTitle: "바코드 찍기",
    scanAim: "뒷면 카메라를 바코드에 맞춰 주세요. 읽으면 자동으로 닫힙니다.",
    scanStarting: "카메라 켜는 중…",
    scanDenied: "카메라를 쓸 수 없습니다. 사진을 쓰거나 바 밑의 숫자를 직접 입력하세요.",
    scanUnsupported:
      "이 브라우저는 실시간 바코드 읽기를 지원하지 않습니다. 사진을 찍거나 바 밑의 숫자를 입력하세요.",
    scanPhotoBtn: "사진으로 읽기",
    scanPhotoHint: "바코드가 크게 나오도록 가까이 찍으세요.",
    scanPhotoReading: "사진 읽는 중…",
    scanNoRead: "사진에서 바코드를 찾지 못했습니다. 바 밑의 숫자를 입력하세요.",
    scanFormats: "EAN-13 · UPC-A · EAN-8",
    codeLabel: "바코드 숫자",
    codePh: "8801234567893",
    codeUse: "이 번호 쓰기",
    codeBad: "EAN-13 · UPC-A · EAN-8 번호가 아닙니다.",
    close: "닫기",
    cancel: "취소",
    seenTitle: "전에 찍은 바코드",
    seenLast: "지난번 {price} · {store} · {date}",
    seenCount: "가격 {n}개 기록됨",
    addToday: "오늘 가격 넣기",
    newTitle: "처음 보는 바코드",
    newHint: "이름은 안 적어도 됩니다. 가격과 가게만 있으면 충분합니다.",
    nameLabel: "이름",
    namePh: "우유 2L",
    optional: "선택",
    priceLabel: "매대 가격",
    pricePh: "3900",
    storeLabel: "가게",
    storePh: "동네마트",
    storeRecent: "최근 가게",
    savePrice: "가격 저장",
    saveCode: "저장",
    listTitle: "내가 찍은 바코드",
    itemCount: "{n}개",
    searchPh: "이름이나 바코드 번호",
    searchLabel: "검색",
    searchCount: "{n}개 찾음",
    searchEmpty: "“{q}”와 맞는 것이 없습니다.",
    emptyTitle: "아직 찍은 게 없습니다",
    emptyBody:
      "장 보는 중에 매대 앞에서 씁니다. 바코드를 한 번 찍고, 매대에 붙은 가격과 가게 이름을 적습니다. 다음 달에 같은 물건 앞에서 다시 찍으면, 지난번에 얼마였는지 그 자리에서 나옵니다.",
    emptyStep1: "1. 바코드 찍기를 누르고 매대의 바코드를 비춥니다.",
    emptyStep2: "2. 붙어 있는 가격과 가게 이름을 적습니다.",
    emptyStep3: "3. 다음에 같은 바코드를 찍으면 지난 가격이 나옵니다.",
    historyTitle: "가격 기록",
    historyOpen: "기록 보기",
    historyClose: "기록 접기",
    priceCount: "가격 {n}개",
    firstPrice: "첫 기록",
    deltaUp: "{d} 오름",
    deltaDown: "{d} 내림",
    deltaSame: "그대로",
    atStore: "{store}",
    noStore: "가게 없음",
    unnamed: "이름 없음",
    codeCap: "바코드",
    lastCap: "지난번",
    deleteRow: "이 가격 지우기",
    deleteItem: "이 바코드 지우기",
    deleteRowTitle: "이 가격을 지울까요?",
    deleteRowBody: "{price} · {date} 기록 한 줄만 지워집니다. 나머지 기록은 남습니다.",
    deleteItemTitle: "이 바코드를 지울까요?",
    deleteItemBody: "{name} 바코드와 가격 기록 {n}개가 함께 지워집니다. 되돌릴 수 없습니다.",
    delete: "지우기",
    exportTitle: "내보내기",
    exportJson: "JSON",
    exportCsv: "CSV",
    importJson: "JSON 가져오기",
    exportHint: "기기를 바꿀 때 파일로 가져가세요. 서버에는 올라가지 않습니다.",
    exportEmpty: "내보낼 기록이 없습니다.",
    exportDone: "{file} 내려받음",
    importDone: "{n}개 가져옴",
    importNone: "새로 가져올 것이 없습니다.",
    importFailed: "파일을 읽을 수 없습니다.",
    priceAdded: "{price} 저장됨",
    itemAdded: "바코드 추가됨",
    itemDeleted: "바코드 지움",
    rowDeleted: "가격 한 줄 지움",
    needPrice: "가격을 적어 주세요.",
    howTitle: "어떻게 쓰나요",
    howBody:
      "가격은 숫자만 적습니다. 통화도 단위 계산도 없습니다. 가게는 짧게 쓰는 이름표입니다 — 한 번 쓰면 다음부터는 눌러서 고를 수 있습니다. 같은 바코드에 가격을 여러 번 넣으면 날짜순으로 쌓이고, 바로 위 기록과의 차이가 함께 표시됩니다.",
    privacy: "개인정보",
    terms: "이용약관",
  },
  en: {
    title: "Scanprice",
    shortName: "Scanprice",
    tagline: "Scan it. Log the price. Scan again to see what you paid. On this device only.",
    metaDescription:
      "In the aisle, scan a barcode, type the shelf price and tag the store. Scan the same code next month and your own dated price history for it comes back. No login, no account — it stays on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    about:
      "Price Memory and pricebook are type-only: neither reads a barcode, and neither shows you a history for a code when you scan it again. Scanprice reads the barcode with the camera, tags every price with a store, and hands back your own dated rows the next time you scan it. Unlike a supermarket's own app, there are no crowd prices here — only what you saw on the shelf.",
    chipScan: "Camera barcode scan",
    chipStore: "Store tag on every price",
    chipHistory: "Rescan shows dated history",
    chipNoLogin: "No login",
    chipPersist: "Survives closing the tab",
    scanPanelTitle: "In the aisle",
    scanBtn: "Scan a barcode",
    scanAgain: "Scan again",
    scanDialogTitle: "Scan a barcode",
    scanAim: "Hold the back camera over the barcode. It closes itself once it reads.",
    scanStarting: "Starting the camera…",
    scanDenied: "The camera is not available. Use a photo, or type the numbers under the bars.",
    scanUnsupported:
      "This browser cannot read barcodes live. Take a photo of it, or type the numbers under the bars.",
    scanPhotoBtn: "Read from a photo",
    scanPhotoHint: "Get close so the bars fill the frame.",
    scanPhotoReading: "Reading the photo…",
    scanNoRead: "No barcode in that photo. Type the numbers under the bars instead.",
    scanFormats: "EAN-13 · UPC-A · EAN-8",
    codeLabel: "Barcode number",
    codePh: "5012345678900",
    codeUse: "Use this code",
    codeBad: "That is not an EAN-13, UPC-A or EAN-8 number.",
    close: "Close",
    cancel: "Cancel",
    seenTitle: "You have scanned this before",
    seenLast: "Last {price} · {store} · {date}",
    seenCount: "{n} prices on file",
    addToday: "Add today's price",
    newTitle: "New code",
    newHint: "The name is optional. A price and a store are enough.",
    nameLabel: "Name",
    namePh: "2L milk",
    optional: "optional",
    priceLabel: "Shelf price",
    pricePh: "3.90",
    storeLabel: "Store",
    storePh: "Corner Mart",
    storeRecent: "Recent stores",
    savePrice: "Save price",
    saveCode: "Save",
    listTitle: "Codes you have scanned",
    itemCount: "{n} codes",
    searchPh: "A name or a barcode number",
    searchLabel: "Search",
    searchCount: "{n} found",
    searchEmpty: "Nothing matches “{q}”.",
    emptyTitle: "Nothing scanned yet",
    emptyBody:
      "This is for standing in the aisle. Scan the barcode once, then write down the price on the shelf edge and which shop you are in. Next month, in front of the same product, scan it again and what you paid last time is right there.",
    emptyStep1: "1. Tap Scan a barcode and hold the camera over the bars.",
    emptyStep2: "2. Type the price on the shelf and tag the store.",
    emptyStep3: "3. Scan the same code later to see the old price.",
    historyTitle: "Price history",
    historyOpen: "Show history",
    historyClose: "Hide history",
    priceCount: "{n} prices",
    firstPrice: "first price",
    deltaUp: "up {d}",
    deltaDown: "down {d}",
    deltaSame: "unchanged",
    atStore: "{store}",
    noStore: "no store",
    unnamed: "Unnamed",
    codeCap: "code",
    lastCap: "latest",
    deleteRow: "Delete this price",
    deleteItem: "Delete this code",
    deleteRowTitle: "Delete this price row?",
    deleteRowBody: "Only the {price} row from {date} goes. The rest of the history stays.",
    deleteItemTitle: "Delete this code?",
    deleteItemBody: "{name} and its {n} price rows all go. This cannot be undone.",
    delete: "Delete",
    exportTitle: "Take it with you",
    exportJson: "JSON",
    exportCsv: "CSV",
    importJson: "Import JSON",
    exportHint: "Grab a file when you change devices. Nothing is uploaded.",
    exportEmpty: "There is nothing to export yet.",
    exportDone: "Downloaded {file}",
    importDone: "Imported {n}",
    importNone: "Nothing new to import.",
    importFailed: "Could not read that file.",
    priceAdded: "Saved {price}",
    itemAdded: "Code added",
    itemDeleted: "Code deleted",
    rowDeleted: "Price row deleted",
    needPrice: "A price is required.",
    howTitle: "How it works",
    howBody:
      "The price is just a number — no currency picker and no unit maths. The store is a short tag you type once and then pick from the recent list. Add a price to the same code more than once and the rows stack up by date, each showing how far it moved from the row above it.",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "スキャン価格",
    shortName: "スキャン価格",
    tagline: "撮って、書いて、もう一度撮れば前の値段。この端末だけ。",
    metaDescription:
      "売り場でバーコードを撮り、棚に出ている値段と店の名前を書き留めます。次に同じバーコードを撮ると、いつどこでいくらだったかが日付つきで戻ってきます。ログインなし、この端末にだけ保存。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    about:
      "Price Memoryやpricebookは数字を手で打つだけのアプリで、バーコードを読まず、同じコードをもう一度撮ったときに前の値段を出すこともしません。スキャン価格はカメラでバーコードを読み、値段ごとに店を付け、次に撮ったときに日付つきの自分の記録を返します。スーパーの公式アプリと違い、他人の値段はありません。自分が売り場で見た値段だけが残ります。",
    chipScan: "カメラでバーコード読み取り",
    chipStore: "値段ごとに店を記録",
    chipHistory: "撮り直すと日付つきの履歴",
    chipNoLogin: "ログインなし",
    chipPersist: "タブを閉じても残る",
    scanPanelTitle: "売り場で",
    scanBtn: "バーコードを撮る",
    scanAgain: "もう一度撮る",
    scanDialogTitle: "バーコードを撮る",
    scanAim: "背面カメラをバーコードに合わせてください。読み取ると自動で閉じます。",
    scanStarting: "カメラを起動しています…",
    scanDenied: "カメラが使えません。写真を使うか、バーの下の数字を入力してください。",
    scanUnsupported:
      "このブラウザはライブでのバーコード読み取りに対応していません。写真を撮るか、バーの下の数字を入力してください。",
    scanPhotoBtn: "写真から読む",
    scanPhotoHint: "バーが画面いっぱいになるまで近づけて撮ってください。",
    scanPhotoReading: "写真を読んでいます…",
    scanNoRead: "その写真にバーコードが見つかりません。バーの下の数字を入力してください。",
    scanFormats: "EAN-13 · UPC-A · EAN-8",
    codeLabel: "バーコードの数字",
    codePh: "4901234567894",
    codeUse: "この番号を使う",
    codeBad: "EAN-13・UPC-A・EAN-8の番号ではありません。",
    close: "閉じる",
    cancel: "キャンセル",
    seenTitle: "前に撮ったバーコードです",
    seenLast: "前回 {price} · {store} · {date}",
    seenCount: "値段の記録 {n}件",
    addToday: "今日の値段を入れる",
    newTitle: "はじめてのバーコード",
    newHint: "名前は書かなくても大丈夫です。値段と店だけで足ります。",
    nameLabel: "名前",
    namePh: "牛乳 1L",
    optional: "任意",
    priceLabel: "棚の値段",
    pricePh: "298",
    storeLabel: "店",
    storePh: "駅前スーパー",
    storeRecent: "最近の店",
    savePrice: "値段を保存",
    saveCode: "保存",
    listTitle: "撮ったバーコード",
    itemCount: "{n}件",
    searchPh: "名前かバーコードの数字",
    searchLabel: "検索",
    searchCount: "{n}件",
    searchEmpty: "「{q}」に合うものがありません。",
    emptyTitle: "まだ何も撮っていません",
    emptyBody:
      "売り場に立ったまま使います。バーコードを一度撮って、棚に出ている値段と、いまいる店の名前を書きます。来月、同じ商品の前でもう一度撮れば、前回いくらだったかがその場で出ます。",
    emptyStep1: "1.「バーコードを撮る」を押して、棚のバーコードに合わせます。",
    emptyStep2: "2. 出ている値段を書き、店の名前を付けます。",
    emptyStep3: "3. 次に同じバーコードを撮ると、前の値段が出ます。",
    historyTitle: "値段の記録",
    historyOpen: "記録を見る",
    historyClose: "記録を閉じる",
    priceCount: "値段 {n}件",
    firstPrice: "最初の記録",
    deltaUp: "{d} 上がった",
    deltaDown: "{d} 下がった",
    deltaSame: "変わらず",
    atStore: "{store}",
    noStore: "店なし",
    unnamed: "名前なし",
    codeCap: "バーコード",
    lastCap: "前回",
    deleteRow: "この値段を消す",
    deleteItem: "このバーコードを消す",
    deleteRowTitle: "この値段を消しますか？",
    deleteRowBody: "{date} の {price} の一行だけが消えます。ほかの記録は残ります。",
    deleteItemTitle: "このバーコードを消しますか？",
    deleteItemBody: "{name} と、値段の記録 {n}件がまとめて消えます。元に戻せません。",
    delete: "消す",
    exportTitle: "持ち出す",
    exportJson: "JSON",
    exportCsv: "CSV",
    importJson: "JSONを読み込む",
    exportHint: "端末を替えるときはファイルで持っていってください。サーバーには上がりません。",
    exportEmpty: "書き出す記録がありません。",
    exportDone: "{file} を保存しました",
    importDone: "{n}件を読み込みました",
    importNone: "新しく読み込むものがありません。",
    importFailed: "そのファイルは読めません。",
    priceAdded: "{price} を保存しました",
    itemAdded: "バーコードを追加しました",
    itemDeleted: "バーコードを消しました",
    rowDeleted: "値段を一行消しました",
    needPrice: "値段を書いてください。",
    howTitle: "使い方",
    howBody:
      "値段は数字だけを書きます。通貨の選択も単価の計算もありません。店は短く付ける名札で、一度書けば次からは押して選べます。同じバーコードに何度も値段を入れると日付順に積み上がり、すぐ上の記録との差も一緒に出ます。",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    title: "扫码记价",
    shortName: "扫码记价",
    tagline: "扫码记下价格，再扫就能看到上次多少钱。仅此设备。",
    metaDescription:
      "站在货架前扫一下条码，写上货架价格并标注是哪家店。下次再扫同一个条码，就能看到自己记过的、带日期的价格记录。无需登录，只存在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    about:
      "Price Memory 和 pricebook 都只能手打数字：既不扫条码，再扫同一个码时也不会给出历史价格。扫码记价用摄像头读条码，每条价格都带上店名，下次扫到同一个码时把你自己的带日期记录调出来。和超市自家的应用不同，这里没有别人报的价，只有你在货架上看到的。",
    chipScan: "摄像头扫条码",
    chipStore: "每条价格都标店",
    chipHistory: "再扫显示带日期历史",
    chipNoLogin: "无需登录",
    chipPersist: "关掉标签页也还在",
    scanPanelTitle: "在货架前",
    scanBtn: "扫描条码",
    scanAgain: "再扫一次",
    scanDialogTitle: "扫描条码",
    scanAim: "把后置摄像头对准条码，读到后会自动关闭。",
    scanStarting: "正在打开摄像头…",
    scanDenied: "无法使用摄像头。请改用照片，或直接输入条码下方的数字。",
    scanUnsupported: "此浏览器不支持实时读取条码。请拍一张照片，或输入条码下方的数字。",
    scanPhotoBtn: "从照片读取",
    scanPhotoHint: "靠近一点，让条码占满画面。",
    scanPhotoReading: "正在读取照片…",
    scanNoRead: "这张照片里没找到条码。请输入条码下方的数字。",
    scanFormats: "EAN-13 · UPC-A · EAN-8",
    codeLabel: "条码数字",
    codePh: "6901234567892",
    codeUse: "使用这个条码",
    codeBad: "这不是 EAN-13、UPC-A 或 EAN-8 号码。",
    close: "关闭",
    cancel: "取消",
    seenTitle: "这个条码你扫过",
    seenLast: "上次 {price} · {store} · {date}",
    seenCount: "已记 {n} 条价格",
    addToday: "记下今天的价格",
    newTitle: "新条码",
    newHint: "名字可以不写，有价格和店名就够了。",
    nameLabel: "名字",
    namePh: "牛奶 1L",
    optional: "可选",
    priceLabel: "货架价格",
    pricePh: "9.9",
    storeLabel: "店",
    storePh: "小区超市",
    storeRecent: "最近的店",
    savePrice: "保存价格",
    saveCode: "保存",
    listTitle: "你扫过的条码",
    itemCount: "{n} 个",
    searchPh: "名字或条码数字",
    searchLabel: "搜索",
    searchCount: "找到 {n} 个",
    searchEmpty: "没有和“{q}”相符的。",
    emptyTitle: "还没扫过东西",
    emptyBody:
      "这是站在货架前用的。先扫一下条码，再写下货架上的价格和你在哪家店。下个月站在同样的商品前再扫一次，上次多少钱当场就出来。",
    emptyStep1: "1. 点“扫描条码”，把摄像头对准货架上的条码。",
    emptyStep2: "2. 写下标着的价格，并标上店名。",
    emptyStep3: "3. 以后再扫同一个条码，就会看到旧价格。",
    historyTitle: "价格记录",
    historyOpen: "查看记录",
    historyClose: "收起记录",
    priceCount: "{n} 条价格",
    firstPrice: "第一条",
    deltaUp: "涨 {d}",
    deltaDown: "降 {d}",
    deltaSame: "没变",
    atStore: "{store}",
    noStore: "未记店名",
    unnamed: "未命名",
    codeCap: "条码",
    lastCap: "最近",
    deleteRow: "删掉这条价格",
    deleteItem: "删掉这个条码",
    deleteRowTitle: "删掉这条价格？",
    deleteRowBody: "只删掉 {date} 的 {price} 这一行，其余记录保留。",
    deleteItemTitle: "删掉这个条码？",
    deleteItemBody: "{name} 和它的 {n} 条价格记录会一起删掉，无法撤销。",
    delete: "删掉",
    exportTitle: "带走",
    exportJson: "JSON",
    exportCsv: "CSV",
    importJson: "导入 JSON",
    exportHint: "换设备时带走文件。不会上传到服务器。",
    exportEmpty: "还没有可以导出的记录。",
    exportDone: "已下载 {file}",
    importDone: "已导入 {n} 条",
    importNone: "没有新的可导入。",
    importFailed: "无法读取该文件。",
    priceAdded: "已保存 {price}",
    itemAdded: "已添加条码",
    itemDeleted: "已删掉条码",
    rowDeleted: "已删掉一条价格",
    needPrice: "请写上价格。",
    howTitle: "怎么用",
    howBody:
      "价格只写数字，不用选货币，也不算单价。店是一个短标签，写过一次以后就能点着选。同一个条码多次记价会按日期叠起来，每一条还会显示比上一条涨了还是降了。",
    privacy: "隐私",
    terms: "条款",
  },
};

/** The Worker maps ?lang= to these same files. zh has its own card — it never
 *  falls back to the English one. */
export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://scanprice.try-dabble.com/og-image-ko.png",
  en: "https://scanprice.try-dabble.com/og-image-en.png",
  ja: "https://scanprice.try-dabble.com/og-image-ja.png",
  zh: "https://scanprice.try-dabble.com/og-image-zh.png",
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
 * ?lang= wins, then the td_lang cookie (so a hop between try-dabble
 * subdomains keeps the chosen language), then the language this app saved,
 * then the browser. The Worker only sees the query and the cookie, so those
 * two must outrank localStorage — otherwise the first HTML and the mounted
 * app would disagree.
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
