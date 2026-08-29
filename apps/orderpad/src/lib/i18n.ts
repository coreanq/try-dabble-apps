/** Every visible string in ko/en/ja/zh. Same shape as the sibling apps. */

export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "orderpad:lang";

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
  ko: "https://orderpad.try-dabble.com/og-image.png",
  en: "https://orderpad.try-dabble.com/og-image-en.png",
  ja: "https://orderpad.try-dabble.com/og-image-ja.png",
  zh: "https://orderpad.try-dabble.com/og-image-zh.png",
};

/** Date formatting locale for the ship-by chip. */
export const DATE_LOCALE: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-Hans-CN",
};

export type MsgKey =
  | "title"
  | "tagline"
  | "localOnly"
  | "metaDescription"
  | "about"
  | "langLabel"
  | "chipNoLogin"
  | "chipNoMeta"
  | "chipUnlimited"
  | "chipExport"
  | "chipPersist"
  | "addTitle"
  | "addHint"
  | "customerLabel"
  | "customerPlaceholder"
  | "customerRequired"
  | "itemLabel"
  | "itemPlaceholder"
  | "optionLabel"
  | "optionPlaceholder"
  | "addressLabel"
  | "addressPlaceholder"
  | "paidLabel"
  | "shipByLabel"
  | "shipByTodayHint"
  | "optional"
  | "addButton"
  | "orderAdded"
  | "listTitle"
  | "listNote"
  | "orderCount"
  | "filterAll"
  | "filterUnpaid"
  | "filterToday"
  | "filterShipped"
  | "filterLabel"
  | "filterEmpty"
  | "searchLabel"
  | "searchPlaceholder"
  | "clearSearch"
  | "searchEmpty"
  | "searchCount"
  | "emptyTitle"
  | "emptyBody"
  | "emptyBody2"
  | "docketTag"
  | "itemTag"
  | "optionTag"
  | "addressTag"
  | "noItem"
  | "noAddress"
  | "stampPaid"
  | "stampUnpaid"
  | "stampShipped"
  | "markPaid"
  | "markUnpaid"
  | "markShipped"
  | "markUnshipped"
  | "paidOn"
  | "unpaidOn"
  | "shippedOn"
  | "unshippedOn"
  | "dueLate"
  | "dueToday"
  | "dueTomorrow"
  | "dueOn"
  | "shipByTag"
  | "openEdit"
  | "closeEdit"
  | "editTitle"
  | "save"
  | "saved"
  | "deleteOrder"
  | "deleteConfirmTitle"
  | "deleteConfirmBody"
  | "cancel"
  | "delete"
  | "orderDeleted"
  | "exportTitle"
  | "exportBody"
  | "exportJson"
  | "exportCsv"
  | "importJson"
  | "exportDone"
  | "exportEmpty"
  | "importDone"
  | "importNone"
  | "importFailed"
  | "promiseTitle"
  | "promiseMeta"
  | "promiseLogin"
  | "promiseUnlimited"
  | "promiseFast"
  | "promisePersist"
  | "promiseExport"
  | "howTitle"
  | "howBody"
  | "privacy"
  | "terms";

const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "주문수첩",
    tagline: "고객, 상품, 입금, 발송. 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    metaDescription:
      "인스타그램·왓츠앱 DM으로 받은 주문을 채팅 도중에 바로 적는 휴대폰용 주문수첩. 고객 이름, 상품, 사이즈, 주소, 입금, 발송을 한 화면에서 적고 오늘 보낼 것과 미입금만 걸러 봅니다. 메타 로그인도 회원가입도 없고, 건수 제한도 없으며, 탭을 닫아도 그대로 남습니다. JSON·CSV로 내보내고 JSON으로 되돌립니다.",
    about:
      "엑셀이 아닙니다. 밤에 앉아서 옮겨 적을 일이 없습니다. DM 창을 잠깐 빠져나와 이름과 상품만 치면 전표 한 장이 됩니다.",
    langLabel: "언어",
    chipNoLogin: "로그인 없음",
    chipNoMeta: "메타 연동 없음",
    chipUnlimited: "건수 제한 없음",
    chipExport: "JSON·CSV 내보내기",
    chipPersist: "탭을 닫아도 남음",
    addTitle: "주문 받아 적기",
    addHint: "고객 이름만 필수입니다. 나머지는 나중에 전표에서 채워도 됩니다.",
    customerLabel: "고객",
    customerPlaceholder: "예: @minji_shop 또는 김민지",
    customerRequired: "고객 이름을 적어 주세요.",
    itemLabel: "상품",
    itemPlaceholder: "예: 리넨 원피스",
    optionLabel: "사이즈 / 옵션",
    optionPlaceholder: "예: M / 아이보리",
    addressLabel: "주소",
    addressPlaceholder: "DM에서 받은 주소를 그대로 붙여 넣으세요",
    paidLabel: "입금 완료",
    shipByLabel: "발송 예정일",
    shipByTodayHint: "오늘로 맞춰져 있습니다.",
    optional: "선택",
    addButton: "전표 쓰기",
    orderAdded: "{name} — 전표 {no}번을 썼습니다.",
    listTitle: "주문 전표",
    listNote: "보낼 것이 위, 늦은 것이 맨 위입니다. 발송한 전표는 아래로 내려갑니다.",
    orderCount: "모두 {n}건",
    filterAll: "전체",
    filterUnpaid: "미입금",
    filterToday: "오늘 발송",
    filterShipped: "발송 완료",
    filterLabel: "보기",
    filterEmpty: "이 보기에 해당하는 주문이 없습니다.",
    searchLabel: "고객·상품 검색",
    searchPlaceholder: "고객, 상품, 주소로 찾기",
    clearSearch: "지우기",
    searchEmpty: "\"{q}\"와 맞는 주문이 없습니다.",
    searchCount: "{n}건 찾음",
    emptyTitle: "아직 받아 적은 주문이 없습니다",
    emptyBody:
      "DM으로 주문이 들어오면 채팅 창을 잠깐 나와 여기에 적습니다. 고객 이름, 상품, 사이즈, 받은 주소, 입금 여부, 그리고 언제 보낼지. 고객 이름만 필수라 몇 번만 눌러도 전표 한 장이 남습니다.",
    emptyBody2:
      "그러고 나면 오늘 보낼 것만, 아직 입금 안 된 것만 걸러 봅니다. 메타 로그인도 회원가입도 없고, 건수 제한도 없습니다. 밤에 엑셀에 옮겨 적을 일도 없습니다.",
    docketTag: "번호",
    itemTag: "상품",
    optionTag: "옵션",
    addressTag: "주소",
    noItem: "상품 미기재",
    noAddress: "주소 미기재",
    stampPaid: "입금완료",
    stampUnpaid: "미입금",
    stampShipped: "발송완료",
    markPaid: "입금 표시",
    markUnpaid: "입금 취소",
    markShipped: "발송 표시",
    markUnshipped: "발송 취소",
    paidOn: "입금으로 표시했습니다.",
    unpaidOn: "미입금으로 되돌렸습니다.",
    shippedOn: "발송으로 표시했습니다.",
    unshippedOn: "발송을 되돌렸습니다.",
    dueLate: "{n}일 지남",
    dueToday: "오늘 발송",
    dueTomorrow: "내일 발송",
    dueOn: "{date} 발송",
    shipByTag: "발송",
    openEdit: "펼쳐서 고치기",
    closeEdit: "접기",
    editTitle: "전표 고치기",
    save: "저장",
    saved: "고쳤습니다.",
    deleteOrder: "전표 버리기",
    deleteConfirmTitle: "{name} 전표를 버릴까요?",
    deleteConfirmBody: "이 기기에서 이 주문 기록이 지워집니다. 되돌릴 수 없습니다.",
    cancel: "그대로 두기",
    delete: "버리기",
    orderDeleted: "전표를 버렸습니다.",
    exportTitle: "내보내기 · 가져오기",
    exportBody:
      "주문 전체를 파일 하나로 내려받습니다. CSV는 엑셀이나 구글 시트에서 바로 열리고, JSON은 그대로 다시 가져올 수 있습니다. 어느 쪽도 서버를 거치지 않습니다.",
    exportJson: "JSON 내보내기",
    exportCsv: "CSV 내보내기",
    importJson: "JSON 가져오기",
    exportDone: "{file} 내려받았습니다.",
    exportEmpty: "내보낼 주문이 아직 없습니다.",
    importDone: "{n}건을 가져왔습니다.",
    importNone: "새로 가져올 주문이 없습니다.",
    importFailed: "이 파일은 읽을 수 없습니다. 주문수첩에서 내보낸 JSON인지 확인해 주세요.",
    promiseTitle: "약속",
    promiseMeta: "메타 로그인이 없습니다. 인스타그램이나 왓츠앱 계정을 연결하지 않습니다.",
    promiseLogin: "회원가입도 로그인도 없습니다. 열면 바로 첫 주문을 적습니다.",
    promiseUnlimited: "건수 제한이 없습니다. 몇 건이든 적으세요. 유료 잠금도 없습니다.",
    promiseFast: "채팅 도중에 쓰라고 만들었습니다. 이름만 치고 전표를 쓰면 끝입니다.",
    promisePersist: "탭을 닫아도, 브라우저를 닫아도 그대로 있습니다. 저절로 지워지지 않습니다.",
    promiseExport: "JSON과 CSV로 언제든 내보내고, JSON으로 다시 가져옵니다.",
    howTitle: "어디에 저장되나요",
    howBody:
      "고객 이름, 상품, 주소, 입금·발송 표시는 모두 이 기기의 브라우저에만 저장됩니다. 계정도 서버도 동기화도 없어서 여러 사람이 같이 보는 실시간 공유는 되지 않습니다. 직접 버리거나, 브라우저의 사이트 데이터를 지우거나, 기기를 바꿀 때만 사라지니 중요한 장부는 CSV나 JSON으로 내보내 두세요.",
    privacy: "개인정보",
    terms: "약관",
  },
  en: {
    title: "Orderpad",
    tagline: "Customer, item, paid, shipped. On this device only.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    metaDescription:
      "A phone-first order book for people selling through Instagram and WhatsApp DMs. Write the customer, the item, the size, the address, whether they paid and when it ships — on one screen, mid-chat. Filter to what ships today and to who has not paid. No Meta login, no sign-up, no order limit, and it survives closing the tab. Export JSON and CSV, import JSON back.",
    about:
      "This is not a spreadsheet. There is no evening spent copying DMs into Excel. Step out of the chat, type a name and an item, and a docket exists.",
    langLabel: "Language",
    chipNoLogin: "No login",
    chipNoMeta: "No Meta connect",
    chipUnlimited: "No order limit",
    chipExport: "JSON and CSV export",
    chipPersist: "Survives closing the tab",
    addTitle: "Take an order",
    addHint: "Only the customer name is required. The rest can be filled in later on the docket.",
    customerLabel: "Customer",
    customerPlaceholder: "e.g. @minji_shop or Amara O.",
    customerRequired: "Please type a customer name.",
    itemLabel: "Item",
    itemPlaceholder: "e.g. Linen dress",
    optionLabel: "Size / option",
    optionPlaceholder: "e.g. M / ivory",
    addressLabel: "Address",
    addressPlaceholder: "Paste the address exactly as they sent it in the DM",
    paidLabel: "Already paid",
    shipByLabel: "Ship by",
    shipByTodayHint: "Set to today.",
    optional: "optional",
    addButton: "Write the docket",
    orderAdded: "{name} — docket No. {no} written.",
    listTitle: "Order dockets",
    listNote: "Still to go out on top, most overdue first. Shipped dockets settle underneath.",
    orderCount: "{n} in the book",
    filterAll: "All",
    filterUnpaid: "Unpaid",
    filterToday: "Ship today",
    filterShipped: "Shipped",
    filterLabel: "View",
    filterEmpty: "No orders in this view.",
    searchLabel: "Search customer or item",
    searchPlaceholder: "Find by customer, item or address",
    clearSearch: "Clear",
    searchEmpty: "Nothing matches “{q}”.",
    searchCount: "{n} found",
    emptyTitle: "No orders written up yet",
    emptyBody:
      "When an order arrives in a DM, step out of the chat and write it here: the customer, the item, the size, the address they sent, whether they have paid, and the day it has to go out. Only the name is required, so a docket takes a few taps.",
    emptyBody2:
      "After that you filter down to what ships today and to who still owes you. No Meta login, no sign-up, no cap on how many orders you keep — and no evening spent retyping it all into a spreadsheet.",
    docketTag: "No.",
    itemTag: "Item",
    optionTag: "Option",
    addressTag: "Address",
    noItem: "No item written",
    noAddress: "No address written",
    stampPaid: "PAID",
    stampUnpaid: "UNPAID",
    stampShipped: "SHIPPED",
    markPaid: "Mark paid",
    markUnpaid: "Mark unpaid",
    markShipped: "Mark shipped",
    markUnshipped: "Undo shipped",
    paidOn: "Marked paid.",
    unpaidOn: "Back to unpaid.",
    shippedOn: "Marked shipped.",
    unshippedOn: "Back to not shipped.",
    dueLate: "{n} days late",
    dueToday: "Ships today",
    dueTomorrow: "Ships tomorrow",
    dueOn: "Ships {date}",
    shipByTag: "Ship",
    openEdit: "Open to edit",
    closeEdit: "Close",
    editTitle: "Edit docket",
    save: "Save",
    saved: "Saved.",
    deleteOrder: "Bin this docket",
    deleteConfirmTitle: "Bin {name}’s docket?",
    deleteConfirmBody: "This order is removed from this device. It cannot be undone.",
    cancel: "Keep it",
    delete: "Bin it",
    orderDeleted: "Docket binned.",
    exportTitle: "Export and import",
    exportBody:
      "Download the whole book as one file. The CSV opens straight in Excel or Google Sheets; the JSON can be imported back here. Neither one goes through a server.",
    exportJson: "Export JSON",
    exportCsv: "Export CSV",
    importJson: "Import JSON",
    exportDone: "Downloaded {file}.",
    exportEmpty: "There are no orders to export yet.",
    importDone: "Imported {n} orders.",
    importNone: "Nothing new to import.",
    importFailed: "That file could not be read. Check it is JSON exported from Orderpad.",
    promiseTitle: "Promises",
    promiseMeta:
      "No Meta login. Your Instagram or WhatsApp account is never connected to this app.",
    promiseLogin: "No sign-up and no login. Open the address and write the first order.",
    promiseUnlimited: "No order limit. Keep as many as you like, with nothing behind a paywall.",
    promiseFast: "Built to use mid-chat. Type a name, write the docket, go back to the message.",
    promisePersist:
      "Closing the tab or the browser changes nothing. Nothing expires on a timer.",
    promiseExport: "Export to JSON and CSV whenever you want, and import the JSON back.",
    howTitle: "Where this is kept",
    howBody:
      "Customer names, items, addresses and the paid and shipped marks stay in this browser on this device. There is no account, no server and no sync, so there is no live shared view for two people at once. It goes away only when you bin it, clear site data, or switch devices — so export a CSV or JSON copy of anything you cannot lose.",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    title: "注文帳",
    tagline: "顧客、商品、入金、発送。この端末だけに。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    metaDescription:
      "InstagramやWhatsAppのDMで受けた注文を、チャットの途中でそのまま書き留めるスマホ用の注文帳。顧客名、商品、サイズ、住所、入金、発送を一画面で書き、今日出す分と未入金だけを絞り込めます。Metaログインも会員登録も件数の上限もなく、タブを閉じても残ります。JSON・CSVで書き出し、JSONで読み戻せます。",
    about:
      "表計算アプリではありません。夜に座って打ち直す作業がなくなります。チャットを少し抜けて名前と商品を打てば、伝票が一枚できます。",
    langLabel: "言語",
    chipNoLogin: "ログイン不要",
    chipNoMeta: "Meta連携なし",
    chipUnlimited: "件数の上限なし",
    chipExport: "JSON・CSV書き出し",
    chipPersist: "タブを閉じても残る",
    addTitle: "注文を書き取る",
    addHint: "必須は顧客名だけです。ほかは後から伝票の上で足せます。",
    customerLabel: "顧客",
    customerPlaceholder: "例: @minji_shop または 田中さん",
    customerRequired: "顧客名を入れてください。",
    itemLabel: "商品",
    itemPlaceholder: "例: リネンワンピース",
    optionLabel: "サイズ / オプション",
    optionPlaceholder: "例: M / アイボリー",
    addressLabel: "住所",
    addressPlaceholder: "DMで届いた住所をそのまま貼り付けてください",
    paidLabel: "入金済み",
    shipByLabel: "発送予定日",
    shipByTodayHint: "今日に合わせてあります。",
    optional: "任意",
    addButton: "伝票を書く",
    orderAdded: "{name} — 伝票 {no} を書きました。",
    listTitle: "注文伝票",
    listNote: "これから出す分が上、遅れているものが一番上です。発送済みは下に下がります。",
    orderCount: "全{n}件",
    filterAll: "すべて",
    filterUnpaid: "未入金",
    filterToday: "今日発送",
    filterShipped: "発送済み",
    filterLabel: "表示",
    filterEmpty: "この表示に該当する注文はありません。",
    searchLabel: "顧客・商品を検索",
    searchPlaceholder: "顧客、商品、住所で探す",
    clearSearch: "消す",
    searchEmpty: "「{q}」に合う注文はありません。",
    searchCount: "{n}件見つかりました",
    emptyTitle: "まだ書き取った注文がありません",
    emptyBody:
      "DMで注文が来たら、チャットを少し抜けてここに書きます。顧客名、商品、サイズ、届いた住所、入金の有無、そして出す日。必須は名前だけなので、数回のタップで伝票が一枚残ります。",
    emptyBody2:
      "あとは今日出す分と、まだ入金のない分だけを絞り込みます。Metaログインも会員登録も件数の上限もありません。夜に表計算へ打ち直す時間も要りません。",
    docketTag: "番号",
    itemTag: "商品",
    optionTag: "オプション",
    addressTag: "住所",
    noItem: "商品の記入なし",
    noAddress: "住所の記入なし",
    stampPaid: "入金済",
    stampUnpaid: "未入金",
    stampShipped: "発送済",
    markPaid: "入金にする",
    markUnpaid: "入金を戻す",
    markShipped: "発送にする",
    markUnshipped: "発送を戻す",
    paidOn: "入金済みにしました。",
    unpaidOn: "未入金に戻しました。",
    shippedOn: "発送済みにしました。",
    unshippedOn: "発送を戻しました。",
    dueLate: "{n}日遅れ",
    dueToday: "今日発送",
    dueTomorrow: "明日発送",
    dueOn: "{date} 発送",
    shipByTag: "発送",
    openEdit: "開いて直す",
    closeEdit: "閉じる",
    editTitle: "伝票を直す",
    save: "保存",
    saved: "直しました。",
    deleteOrder: "伝票を捨てる",
    deleteConfirmTitle: "{name} の伝票を捨てますか？",
    deleteConfirmBody: "この端末からこの注文の記録が消えます。元に戻せません。",
    cancel: "残す",
    delete: "捨てる",
    orderDeleted: "伝票を捨てました。",
    exportTitle: "書き出しと読み込み",
    exportBody:
      "注文をまとめて一つのファイルで保存します。CSVはExcelやGoogleスプレッドシートでそのまま開け、JSONはここへ読み戻せます。どちらもサーバーを通りません。",
    exportJson: "JSONで書き出す",
    exportCsv: "CSVで書き出す",
    importJson: "JSONを読み込む",
    exportDone: "{file} を保存しました。",
    exportEmpty: "書き出す注文がまだありません。",
    importDone: "{n}件を読み込みました。",
    importNone: "新しく読み込む注文はありません。",
    importFailed: "このファイルは読めません。注文帳から書き出したJSONか確認してください。",
    promiseTitle: "約束",
    promiseMeta: "Metaログインはありません。InstagramやWhatsAppのアカウントは繋ぎません。",
    promiseLogin: "会員登録もログインもありません。開いてすぐ最初の注文を書けます。",
    promiseUnlimited: "件数の上限はありません。何件でもどうぞ。有料ロックもありません。",
    promiseFast: "チャットの途中で使うために作りました。名前を打って伝票を書けば終わりです。",
    promisePersist: "タブを閉じてもブラウザを閉じても残ります。時間で消えることもありません。",
    promiseExport: "いつでもJSONとCSVで書き出し、JSONで読み戻せます。",
    howTitle: "どこに保存されますか",
    howBody:
      "顧客名、商品、住所、入金・発送の印は、すべてこの端末のブラウザにだけ保存されます。アカウントもサーバーも同期もないので、複数人で同時に見る共有はできません。自分で捨てるか、サイトデータを消すか、端末を替えたときにだけ消えます。大事な帳面はCSVかJSONで書き出しておいてください。",
    privacy: "プライバシー",
    terms: "利用規約",
  },
  zh: {
    title: "订货本",
    tagline: "客户、商品、付款、发货。仅此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    metaDescription:
      "为用 Instagram、WhatsApp 私信接单的人做的手机订货本。客户、商品、尺码、地址、是否付款、什么时候发货，都在一屏里写完，聊天中途就能记。可以只看今天要发的和还没付款的。不用 Meta 登录，不用注册，不限条数，关掉标签页也还在。支持导出 JSON 和 CSV，并可用 JSON 导回。",
    about:
      "这不是电子表格。晚上不用再坐下来把私信抄进 Excel。退出聊天，写下名字和商品，一张单子就成了。",
    langLabel: "语言",
    chipNoLogin: "无需登录",
    chipNoMeta: "不接 Meta 账号",
    chipUnlimited: "不限条数",
    chipExport: "导出 JSON 和 CSV",
    chipPersist: "关掉标签页也还在",
    addTitle: "记一笔订单",
    addHint: "只有客户是必填。其余可以稍后在单子上补。",
    customerLabel: "客户",
    customerPlaceholder: "例：@minji_shop 或 李小姐",
    customerRequired: "请填写客户名称。",
    itemLabel: "商品",
    itemPlaceholder: "例：亚麻连衣裙",
    optionLabel: "尺码 / 选项",
    optionPlaceholder: "例：M / 米白",
    addressLabel: "地址",
    addressPlaceholder: "把私信里收到的地址原样粘贴进来",
    paidLabel: "已付款",
    shipByLabel: "发货日期",
    shipByTodayHint: "已设为今天。",
    optional: "选填",
    addButton: "写单子",
    orderAdded: "{name} — 已写第 {no} 号单。",
    listTitle: "订单单据",
    listNote: "还没发的在上面，逾期的排最前。已发货的沉到下面。",
    orderCount: "共 {n} 单",
    filterAll: "全部",
    filterUnpaid: "未付款",
    filterToday: "今天发货",
    filterShipped: "已发货",
    filterLabel: "查看",
    filterEmpty: "这个视图下没有订单。",
    searchLabel: "搜索客户或商品",
    searchPlaceholder: "按客户、商品、地址查找",
    clearSearch: "清除",
    searchEmpty: "没有和“{q}”匹配的订单。",
    searchCount: "找到 {n} 单",
    emptyTitle: "还没有记下任何订单",
    emptyBody:
      "私信来了订单，就退出聊天在这里写：客户、商品、尺码、对方发来的地址、有没有付款，还有哪天要发出去。只有名字必填，点几下就留下一张单子。",
    emptyBody2:
      "接着就只看今天要发的、还没付款的。不用 Meta 登录，不用注册，也不限条数。晚上再也不用把这些重新抄进表格。",
    docketTag: "编号",
    itemTag: "商品",
    optionTag: "选项",
    addressTag: "地址",
    noItem: "未填商品",
    noAddress: "未填地址",
    stampPaid: "已付款",
    stampUnpaid: "未付款",
    stampShipped: "已发货",
    markPaid: "标记已付款",
    markUnpaid: "取消已付款",
    markShipped: "标记已发货",
    markUnshipped: "取消已发货",
    paidOn: "已标记为已付款。",
    unpaidOn: "已改回未付款。",
    shippedOn: "已标记为已发货。",
    unshippedOn: "已改回未发货。",
    dueLate: "逾期 {n} 天",
    dueToday: "今天发货",
    dueTomorrow: "明天发货",
    dueOn: "{date} 发货",
    shipByTag: "发货",
    openEdit: "展开修改",
    closeEdit: "收起",
    editTitle: "修改单子",
    save: "保存",
    saved: "已改好。",
    deleteOrder: "扔掉这张单",
    deleteConfirmTitle: "扔掉 {name} 的单子？",
    deleteConfirmBody: "这条订单会从本设备删除，无法恢复。",
    cancel: "留着",
    delete: "扔掉",
    orderDeleted: "已扔掉这张单。",
    exportTitle: "导出与导入",
    exportBody:
      "把整本订单下载成一个文件。CSV 可以直接用 Excel 或 Google 表格打开，JSON 可以再导回这里。两者都不经过服务器。",
    exportJson: "导出 JSON",
    exportCsv: "导出 CSV",
    importJson: "导入 JSON",
    exportDone: "已下载 {file}。",
    exportEmpty: "暂时没有可导出的订单。",
    importDone: "已导入 {n} 单。",
    importNone: "没有新的订单可导入。",
    importFailed: "读不了这个文件。请确认它是订货本导出的 JSON。",
    promiseTitle: "承诺",
    promiseMeta: "没有 Meta 登录。不会连接你的 Instagram 或 WhatsApp 账号。",
    promiseLogin: "不用注册，也不用登录。打开网址就能写第一单。",
    promiseUnlimited: "不限订单条数。想记多少记多少，也没有付费解锁。",
    promiseFast: "就是为聊天中途用而做的。写个名字，写下单子，回去继续回消息。",
    promisePersist: "关掉标签页或浏览器都不影响。也不会到时间自动清空。",
    promiseExport: "随时导出 JSON 和 CSV，也能用 JSON 导回来。",
    howTitle: "保存在哪里",
    howBody:
      "客户名称、商品、地址以及付款和发货的标记，都只保存在这台设备的浏览器里。没有账号、没有服务器、也没有同步，所以做不到两个人同时看同一份。只有你自己删除、清除站点数据或更换设备时才会消失，所以重要的账目请导出一份 CSV 或 JSON。",
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
