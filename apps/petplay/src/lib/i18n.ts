/**
 * Every visible string in ko / en / ja / zh. The Worker (src/og-lang.ts) holds
 * the same title, tagline and local-only notice for the FIRST HTML, so the two
 * must stay in step: the mounted app has to say exactly what a crawler saw.
 *
 * Nothing here promises a cloud-drawn picture, a cloud sync, a token or a purchase.
 * The pet is drawn from SVG parts or from a photo cropped on this device.
 */
export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGS: Lang[] = ["ko", "en", "ja", "zh"];
export const LANG_KEY = "petplay:lang";

export const LANG_NAMES: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export const HTML_LANG: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja", zh: "zh" };

export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP", zh: "zh-CN" };

export const OG_IMAGE: Record<Lang, string> = {
  ko: "https://petplay.try-dabble.com/og-image-ko.png",
  en: "https://petplay.try-dabble.com/og-image-en.png",
  ja: "https://petplay.try-dabble.com/og-image-ja.png",
  zh: "https://petplay.try-dabble.com/og-image-zh.png",
};

export type MsgKey =
  | "title"
  | "shortName"
  | "tagline"
  | "metaDescription"
  | "localOnly"
  | "langLabel"
  | "chipFreeCustom"
  | "chipNoAI"
  | "chipCareInTab"
  | "chipBackup"
  | "chipNoLogin"
  | "chipNoAds"
  | "chipLocal"
  | "chipLangs"
  | "moodHappy"
  | "moodOkay"
  | "moodSad"
  | "moodHungry"
  | "moodSleepy"
  | "moodDirty"
  | "moodBored"
  | "sayHappy"
  | "sayOkay"
  | "saySad"
  | "sayHungry"
  | "saySleepy"
  | "sayDirty"
  | "sayBored"
  | "stageHint"
  | "needsTitle"
  | "needHunger"
  | "needHappiness"
  | "needEnergy"
  | "needClean"
  | "needsHint"
  | "careTitle"
  | "feed"
  | "play"
  | "pet"
  | "clean"
  | "fedToast"
  | "playedToast"
  | "pettedToast"
  | "cleanedToast"
  | "fastForward"
  | "fastForwardHint"
  | "skippedToast"
  | "pauseDecay"
  | "pauseDecayHint"
  | "awayToast"
  | "nameTitle"
  | "nameLabel"
  | "namePlaceholder"
  | "nameSaved"
  | "defaultName"
  | "lookTitle"
  | "lookHint"
  | "customize"
  | "usePhoto"
  | "useParts"
  | "photoActive"
  | "customizeTitle"
  | "speciesLabel"
  | "speciesDog"
  | "speciesCat"
  | "speciesBunny"
  | "speciesBird"
  | "speciesFox"
  | "partEars"
  | "partEyes"
  | "partBody"
  | "partTail"
  | "partAccessory"
  | "earsRound"
  | "earsPointy"
  | "earsFloppy"
  | "earsLong"
  | "earsTuft"
  | "eyesDot"
  | "eyesRound"
  | "eyesHappy"
  | "eyesSleepy"
  | "eyesStar"
  | "bodyRound"
  | "bodyTall"
  | "bodyChunky"
  | "tailCurl"
  | "tailStraight"
  | "tailFluffy"
  | "tailShort"
  | "accNone"
  | "accBow"
  | "accCollar"
  | "accScarf"
  | "accHat"
  | "colorPrimary"
  | "colorSecondary"
  | "colorAccent"
  | "colorCustom"
  | "randomize"
  | "done"
  | "freeNote"
  | "photoTitle"
  | "photoPick"
  | "photoHint"
  | "photoZoom"
  | "photoX"
  | "photoY"
  | "photoTint"
  | "photoTintStrength"
  | "photoApply"
  | "photoNone"
  | "photoBad"
  | "photoApplied"
  | "tintNone"
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
  | "cancel"
  | "delete"
  | "privacy"
  | "terms"
  | "guide";

export const I18N: Record<Lang, Record<MsgKey, string>> = {
  ko: {
    title: "펫플레이",
    shortName: "펫플레이",
    tagline:
      "생성형 AI 없는 무료 로컬 디지털 펫. 파츠·색으로 꾸미거나 내 사진으로 스프라이트(기기에서 자르고 색만 입힘), 이름 짓고 먹이·놀아주기, JSON 백업. 계정 없음. 토큰 없음. 광고 없음.",
    metaDescription:
      "생성형 AI를 전혀 쓰지 않는 무료 로컬 디지털 펫. 강아지·고양이·토끼·새·여우 중 고르고 귀·눈·몸·꼬리·장식과 색을 마음대로 조합하거나, 내 사진을 이 기기에서 잘라 색만 입혀 스프라이트로 씁니다. 이름을 짓고 배고픔·행복·기운·청결 게이지를 보며 먹이 주기·놀아주기·쓰다듬기·씻기기로 돌봅니다. 모든 꾸미기 무료, 토큰·결제 없음, 계정 없음, 광고 없음, JSON 백업으로 재설치해도 안전. 데이터는 이 기기에만.",
    localOnly: "이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
    langLabel: "언어",
    chipFreeCustom: "꾸미기 전부 무료",
    chipNoAI: "생성형 AI 없음",
    chipCareInTab: "탭 안에서 돌보기 완결",
    chipBackup: "JSON 백업",
    chipNoLogin: "로그인 없음",
    chipNoAds: "광고 없음",
    chipLocal: "데이터는 이 기기에만",
    chipLangs: "ko/en/ja/zh",
    moodHappy: "행복해요",
    moodOkay: "괜찮아요",
    moodSad: "시무룩해요",
    moodHungry: "배고파요",
    moodSleepy: "졸려요",
    moodDirty: "씻고 싶어요",
    moodBored: "심심해요",
    sayHappy: "최고의 하루예요!",
    sayOkay: "오늘도 잘 지내고 있어요.",
    saySad: "조금만 더 신경 써 주세요…",
    sayHungry: "배에서 꼬르륵 소리가 나요.",
    saySleepy: "하품… 조금 쉬고 싶어요.",
    sayDirty: "털이 꼬질꼬질해요.",
    sayBored: "같이 놀아요!",
    stageHint: "게이지는 탭이 열려 있는 동안 천천히 줄어요. 다시 열면 떠나 있던 시간만큼(상한 있음) 줄어든 채 돌아옵니다.",
    needsTitle: "상태",
    needHunger: "배부름",
    needHappiness: "행복",
    needEnergy: "기운",
    needClean: "청결",
    needsHint: "먹이 주기는 배부름, 놀아주기는 행복(기운을 조금 씀), 쓰다듬기는 기운과 행복, 씻기기는 청결을 채워요.",
    careTitle: "돌보기",
    feed: "먹이 주기",
    play: "놀아주기",
    pet: "쓰다듬기",
    clean: "씻기기",
    fedToast: "{name}이(가) 맛있게 먹었어요",
    playedToast: "{name}이(가) 신나게 놀았어요",
    pettedToast: "{name}이(가) 기분 좋아해요",
    cleanedToast: "{name}이(가) 뽀송해졌어요",
    fastForward: "1시간 건너뛰기",
    fastForwardHint: "기다리지 않고 시간이 흐른 걸 보고 싶을 때. 게이지가 한 시간치 줄어요.",
    skippedToast: "한 시간이 지났어요",
    pauseDecay: "게이지 감소 멈춤",
    pauseDecayHint: "켜 두면 시간이 지나도 게이지가 줄지 않아요.",
    awayToast: "{name}이(가) 기다렸어요! 떠나 있는 동안 게이지가 조금 줄었어요.",
    nameTitle: "이름",
    nameLabel: "펫 이름",
    namePlaceholder: "예: 모찌",
    nameSaved: "이름을 저장했어요",
    defaultName: "모찌",
    lookTitle: "모습",
    lookHint: "종·귀·눈·몸·꼬리·장식·색을 마음대로. 전부 무료, 토큰 없음. 또는 내 사진을 이 기기에서 잘라 색만 입혀 씁니다. 생성형 AI는 쓰지 않아요.",
    customize: "파츠로 꾸미기",
    usePhoto: "내 사진 쓰기",
    useParts: "파츠 스프라이트로 돌아가기",
    photoActive: "지금은 내 사진 스프라이트를 쓰고 있어요. 사진은 이 기기 밖으로 나가지 않아요.",
    customizeTitle: "파츠로 꾸미기",
    speciesLabel: "종",
    speciesDog: "강아지",
    speciesCat: "고양이",
    speciesBunny: "토끼",
    speciesBird: "새",
    speciesFox: "여우",
    partEars: "귀",
    partEyes: "눈",
    partBody: "몸",
    partTail: "꼬리",
    partAccessory: "장식",
    earsRound: "동글",
    earsPointy: "뾰족",
    earsFloppy: "늘어진",
    earsLong: "긴 귀",
    earsTuft: "깃털 머리",
    eyesDot: "점눈",
    eyesRound: "동그란 눈",
    eyesHappy: "웃는 눈",
    eyesSleepy: "졸린 눈",
    eyesStar: "별눈",
    bodyRound: "동글",
    bodyTall: "길쭉",
    bodyChunky: "통통",
    tailCurl: "말린",
    tailStraight: "곧은",
    tailFluffy: "복슬",
    tailShort: "짧은",
    accNone: "없음",
    accBow: "리본",
    accCollar: "목걸이",
    accScarf: "목도리",
    accHat: "모자",
    colorPrimary: "몸 색",
    colorSecondary: "배·무늬 색",
    colorAccent: "포인트 색",
    colorCustom: "직접 고르기",
    randomize: "랜덤",
    done: "완료",
    freeNote: "모든 파츠와 색은 영원히 무료예요. 토큰도, 결제도, 잠금도 없어요.",
    photoTitle: "내 사진으로 스프라이트",
    photoPick: "사진 고르기",
    photoHint: "사진은 이 기기의 브라우저 안에서만 잘리고 색이 입혀져요. 어디에도 올리지 않고, 생성형 AI는 쓰지 않아요.",
    photoZoom: "확대",
    photoX: "좌우",
    photoY: "위아래",
    photoTint: "색 입히기",
    photoTintStrength: "색 세기",
    photoApply: "이 스프라이트 쓰기",
    photoNone: "아직 고른 사진이 없어요.",
    photoBad: "이 파일은 이미지로 열 수 없어요.",
    photoApplied: "사진 스프라이트를 적용했어요",
    tintNone: "원본 색",
    backupTitle: "백업",
    backupBody: "펫 모습·이름·상태·설정을 JSON 한 파일로. 재설치하거나 폰을 바꿔도 가져오기로 그대로 돌아와요.",
    exportJson: "JSON 내보내기",
    importJson: "JSON 가져오기",
    clearAll: "전체 삭제",
    exported: "JSON을 내보냈어요",
    importBad: "펫플레이 백업 파일이 아니에요",
    importOk: "{name}이(가) 돌아왔어요",
    importConfirmTitle: "백업으로 덮어쓸까요?",
    importConfirmBody: "지금 펫과 상태가 백업 파일 내용으로 바뀝니다. 먼저 내보내기를 해 두면 안전해요.",
    clearAllTitle: "전부 지울까요?",
    clearAllBody: "펫·이름·상태·사진 스프라이트가 이 기기에서 지워지고 새 펫이 시작돼요. 되돌릴 수 없어요.",
    cleared: "새 펫이 태어났어요",
    cancel: "취소",
    delete: "삭제",
    privacy: "개인정보",
    terms: "이용약관",
    guide: "가이드",
  },
  en: {
    title: "PetPlay",
    shortName: "PetPlay",
    tagline:
      "Free local digital pet — no generative AI. Build a sprite from parts or your photo (crop & tint on this device), name it, feed and play with visible needs, JSON backup. No account. No tokens. No ads.",
    metaDescription:
      "A free local digital pet that never touches generative AI. Pick a dog, cat, bunny, bird or fox and mix ears, eyes, body, tail, accessory and colours however you like, or crop your own photo on this device and tint it into a sprite. Name it, watch the fullness, happiness, energy and cleanliness meters, and care for it with Feed, Play, Pet and Clean. Every customization is free, no tokens or purchases, no account, no ads, and a JSON backup survives a reinstall. Data stays on this device.",
    localOnly: "Your data stays on this device. Nothing is sent to our servers.",
    langLabel: "Language",
    chipFreeCustom: "Free custom",
    chipNoAI: "No generative AI",
    chipCareInTab: "Care loop in-tab",
    chipBackup: "JSON backup",
    chipNoLogin: "No login",
    chipNoAds: "No ads",
    chipLocal: "Data this device only",
    chipLangs: "ko/en/ja/zh",
    moodHappy: "Happy",
    moodOkay: "Doing fine",
    moodSad: "Down",
    moodHungry: "Hungry",
    moodSleepy: "Sleepy",
    moodDirty: "Needs a wash",
    moodBored: "Bored",
    sayHappy: "Best day ever!",
    sayOkay: "Just hanging out.",
    saySad: "A little more care, please…",
    sayHungry: "My tummy is rumbling.",
    saySleepy: "Yawn… I could use a rest.",
    sayDirty: "My fur feels grubby.",
    sayBored: "Let's play!",
    stageHint: "Meters drift down slowly while the tab is open. Reopen later and they come back lowered by the time you were away (capped).",
    needsTitle: "Needs",
    needHunger: "Fullness",
    needHappiness: "Happiness",
    needEnergy: "Energy",
    needClean: "Clean",
    needsHint: "Feed fills fullness, Play raises happiness (and uses a little energy), Pet restores energy and happiness, Clean restores cleanliness.",
    careTitle: "Care",
    feed: "Feed",
    play: "Play",
    pet: "Pet",
    clean: "Clean",
    fedToast: "{name} ate happily",
    playedToast: "{name} had a blast",
    pettedToast: "{name} is purring with joy",
    cleanedToast: "{name} is squeaky clean",
    fastForward: "Skip 1 hour",
    fastForwardHint: "See time pass without waiting: meters drop by one hour's worth.",
    skippedToast: "An hour went by",
    pauseDecay: "Pause meter drift",
    pauseDecayHint: "While on, meters do not drop over time.",
    awayToast: "{name} missed you! Needs dropped a bit while you were away.",
    nameTitle: "Name",
    nameLabel: "Pet name",
    namePlaceholder: "e.g. Mochi",
    nameSaved: "Name saved",
    defaultName: "Mochi",
    lookTitle: "Look",
    lookHint: "Species, ears, eyes, body, tail, accessory and colours, any way you like. All free, no tokens. Or crop your own photo on this device and tint it. No generative AI, ever.",
    customize: "Build from parts",
    usePhoto: "Use my photo",
    useParts: "Back to the parts sprite",
    photoActive: "Your photo sprite is in use. The picture never leaves this device.",
    customizeTitle: "Build from parts",
    speciesLabel: "Species",
    speciesDog: "Dog",
    speciesCat: "Cat",
    speciesBunny: "Bunny",
    speciesBird: "Bird",
    speciesFox: "Fox",
    partEars: "Ears",
    partEyes: "Eyes",
    partBody: "Body",
    partTail: "Tail",
    partAccessory: "Accessory",
    earsRound: "Round",
    earsPointy: "Pointy",
    earsFloppy: "Floppy",
    earsLong: "Long",
    earsTuft: "Tuft",
    eyesDot: "Dots",
    eyesRound: "Round",
    eyesHappy: "Smiling",
    eyesSleepy: "Sleepy",
    eyesStar: "Stars",
    bodyRound: "Round",
    bodyTall: "Tall",
    bodyChunky: "Chunky",
    tailCurl: "Curly",
    tailStraight: "Straight",
    tailFluffy: "Fluffy",
    tailShort: "Stubby",
    accNone: "None",
    accBow: "Bow",
    accCollar: "Collar",
    accScarf: "Scarf",
    accHat: "Hat",
    colorPrimary: "Body colour",
    colorSecondary: "Belly / markings",
    colorAccent: "Accent",
    colorCustom: "Pick any colour",
    randomize: "Surprise me",
    done: "Done",
    freeNote: "Every part and colour is free forever. No tokens, no purchases, no locks.",
    photoTitle: "Sprite from my photo",
    photoPick: "Choose a photo",
    photoHint: "The photo is cropped and tinted inside this browser on this device. It is never uploaded anywhere and no generative AI is involved.",
    photoZoom: "Zoom",
    photoX: "Left / right",
    photoY: "Up / down",
    photoTint: "Tint",
    photoTintStrength: "Tint strength",
    photoApply: "Use this sprite",
    photoNone: "No photo chosen yet.",
    photoBad: "That file could not be opened as an image.",
    photoApplied: "Photo sprite applied",
    tintNone: "Original",
    backupTitle: "Backup",
    backupBody: "One JSON file with the pet's look, name, needs and settings. Reinstall or switch phones, import it, and everything is back.",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    clearAll: "Delete all",
    exported: "JSON exported",
    importBad: "That is not a PetPlay backup",
    importOk: "{name} is back",
    importConfirmTitle: "Replace with the backup?",
    importConfirmBody: "Your current pet and its needs will be replaced by the file. Export first to be safe.",
    clearAllTitle: "Delete everything?",
    clearAllBody: "The pet, its name, needs and photo sprite are erased from this device and a new pet starts. This cannot be undone.",
    cleared: "A new pet is born",
    cancel: "Cancel",
    delete: "Delete",
    privacy: "Privacy",
    terms: "Terms",
    guide: "Guide",
  },
  ja: {
    title: "ペットプレイ",
    shortName: "ペットプレイ",
    tagline:
      "生成AIなしの無料ローカルデジタルペット。パーツと色、または自分の写真（端末で切り抜き＆色付け）でスプライトを作り、名前を付けてごはんと遊び、JSONバックアップ。アカウント不要。トークンなし。広告なし。",
    metaDescription:
      "生成AIを一切使わない無料のローカルデジタルペット。犬・猫・うさぎ・鳥・きつねから選び、耳・目・体・しっぽ・アクセサリーと色を自由に組み合わせるか、自分の写真をこの端末で切り抜いて色を付けてスプライトにします。名前を付け、満腹・幸せ・元気・きれいのメーターを見ながら、ごはん・遊ぶ・なでる・洗うでお世話。カスタマイズは全部無料、トークンも課金もなし、アカウント不要、広告なし、JSONバックアップで再インストールしても安心。データはこの端末だけ。",
    localOnly: "データはこの端末にだけ保存されます。サーバーには送りません。",
    langLabel: "言語",
    chipFreeCustom: "カスタマイズ全部無料",
    chipNoAI: "生成AIなし",
    chipCareInTab: "お世話はタブ内で完結",
    chipBackup: "JSONバックアップ",
    chipNoLogin: "ログイン不要",
    chipNoAds: "広告なし",
    chipLocal: "データはこの端末だけ",
    chipLangs: "ko/en/ja/zh",
    moodHappy: "ごきげん",
    moodOkay: "元気です",
    moodSad: "しょんぼり",
    moodHungry: "おなかすいた",
    moodSleepy: "ねむい",
    moodDirty: "洗ってほしい",
    moodBored: "たいくつ",
    sayHappy: "最高の一日！",
    sayOkay: "のんびりしてるよ。",
    saySad: "もう少しかまってほしいな…",
    sayHungry: "おなかがぐうぐう鳴ってる。",
    saySleepy: "ふぁ…ちょっと休みたい。",
    sayDirty: "毛がべたべたする。",
    sayBored: "遊ぼうよ！",
    stageHint: "メーターはタブを開いている間ゆっくり減ります。あとで開き直すと、離れていた時間ぶん（上限あり）減った状態で戻ります。",
    needsTitle: "ステータス",
    needHunger: "満腹",
    needHappiness: "幸せ",
    needEnergy: "元気",
    needClean: "きれい",
    needsHint: "ごはんは満腹、遊ぶは幸せ（元気を少し使う）、なでるは元気と幸せ、洗うはきれいを回復します。",
    careTitle: "お世話",
    feed: "ごはん",
    play: "遊ぶ",
    pet: "なでる",
    clean: "洗う",
    fedToast: "{name}はおいしく食べました",
    playedToast: "{name}は楽しく遊びました",
    pettedToast: "{name}はうれしそう",
    cleanedToast: "{name}はぴかぴかになりました",
    fastForward: "1時間スキップ",
    fastForwardHint: "待たずに時間が経つのを見たいとき。メーターが1時間ぶん減ります。",
    skippedToast: "1時間が経ちました",
    pauseDecay: "メーター減少を止める",
    pauseDecayHint: "オンの間は時間が経ってもメーターが減りません。",
    awayToast: "{name}が待っていました！離れている間にメーターが少し減りました。",
    nameTitle: "名前",
    nameLabel: "ペットの名前",
    namePlaceholder: "例: もち",
    nameSaved: "名前を保存しました",
    defaultName: "もち",
    lookTitle: "見た目",
    lookHint: "種類・耳・目・体・しっぽ・アクセサリー・色を自由に。全部無料、トークンなし。または自分の写真をこの端末で切り抜いて色を付けます。生成AIは使いません。",
    customize: "パーツで作る",
    usePhoto: "自分の写真を使う",
    useParts: "パーツのスプライトに戻す",
    photoActive: "いま写真スプライトを使っています。写真はこの端末の外に出ません。",
    customizeTitle: "パーツで作る",
    speciesLabel: "種類",
    speciesDog: "犬",
    speciesCat: "猫",
    speciesBunny: "うさぎ",
    speciesBird: "鳥",
    speciesFox: "きつね",
    partEars: "耳",
    partEyes: "目",
    partBody: "体",
    partTail: "しっぽ",
    partAccessory: "アクセサリー",
    earsRound: "まる",
    earsPointy: "とがり",
    earsFloppy: "たれ耳",
    earsLong: "長い耳",
    earsTuft: "羽かざり",
    eyesDot: "点目",
    eyesRound: "まる目",
    eyesHappy: "にこにこ",
    eyesSleepy: "ねむい目",
    eyesStar: "星目",
    bodyRound: "まる",
    bodyTall: "のっぽ",
    bodyChunky: "ぽっちゃり",
    tailCurl: "くるん",
    tailStraight: "まっすぐ",
    tailFluffy: "ふわふわ",
    tailShort: "短い",
    accNone: "なし",
    accBow: "リボン",
    accCollar: "首輪",
    accScarf: "マフラー",
    accHat: "帽子",
    colorPrimary: "体の色",
    colorSecondary: "おなか・模様の色",
    colorAccent: "アクセント",
    colorCustom: "好きな色を選ぶ",
    randomize: "おまかせ",
    done: "完了",
    freeNote: "パーツも色もずっと無料。トークンも課金もロックもありません。",
    photoTitle: "写真からスプライト",
    photoPick: "写真を選ぶ",
    photoHint: "写真はこの端末のブラウザの中だけで切り抜きと色付けをします。どこにもアップロードせず、生成AIも使いません。",
    photoZoom: "ズーム",
    photoX: "左右",
    photoY: "上下",
    photoTint: "色付け",
    photoTintStrength: "色の強さ",
    photoApply: "このスプライトを使う",
    photoNone: "まだ写真を選んでいません。",
    photoBad: "このファイルは画像として開けませんでした。",
    photoApplied: "写真スプライトを適用しました",
    tintNone: "元の色",
    backupTitle: "バックアップ",
    backupBody: "ペットの見た目・名前・ステータス・設定をJSON1ファイルに。再インストールや機種変更でも読み込めば元どおりです。",
    exportJson: "JSON書き出し",
    importJson: "JSON読み込み",
    clearAll: "全データ削除",
    exported: "JSONを書き出しました",
    importBad: "ペットプレイのバックアップではありません",
    importOk: "{name}が戻ってきました",
    importConfirmTitle: "バックアップで置き換えますか？",
    importConfirmBody: "いまのペットとステータスがファイルの内容に置き換わります。先に書き出しておくと安心です。",
    clearAllTitle: "すべて削除しますか？",
    clearAllBody: "ペット・名前・ステータス・写真スプライトがこの端末から消え、新しいペットが始まります。元に戻せません。",
    cleared: "新しいペットが生まれました",
    cancel: "キャンセル",
    delete: "削除",
    privacy: "プライバシー",
    terms: "利用規約",
    guide: "ガイド",
  },
  zh: {
    title: "宠玩",
    shortName: "宠玩",
    tagline:
      "无生成式 AI 的免费本地电子宠物。用部件和颜色，或用自己的照片（在本机裁剪上色）做精灵，起名并喂食玩耍，JSON 备份。无需账号。无代币。无广告。",
    metaDescription:
      "完全不用生成式 AI 的免费本地电子宠物。从狗、猫、兔子、小鸟、狐狸里挑一个，随意搭配耳朵、眼睛、身体、尾巴、饰品和颜色，或者在本机裁剪自己的照片并上色做成精灵。给它起名，看着饱腹、快乐、精力、清洁四条槽，用喂食、玩耍、抚摸、洗澡来照顾它。所有装扮免费，没有代币和内购，无需账号，无广告，JSON 备份重装也不丢。数据只留在此设备。",
    localOnly: "数据仅保存在此设备，不会上传到服务器。",
    langLabel: "语言",
    chipFreeCustom: "装扮全部免费",
    chipNoAI: "无生成式 AI",
    chipCareInTab: "照顾循环在标签页内完成",
    chipBackup: "JSON 备份",
    chipNoLogin: "无需登录",
    chipNoAds: "无广告",
    chipLocal: "数据仅在此设备",
    chipLangs: "ko/en/ja/zh",
    moodHappy: "开心",
    moodOkay: "还不错",
    moodSad: "有点低落",
    moodHungry: "饿了",
    moodSleepy: "困了",
    moodDirty: "想洗澡",
    moodBored: "无聊",
    sayHappy: "今天太棒了！",
    sayOkay: "正在悠闲地待着。",
    saySad: "再多照顾我一点吧……",
    sayHungry: "肚子咕咕叫了。",
    saySleepy: "哈欠……想休息一下。",
    sayDirty: "毛毛脏兮兮的。",
    sayBored: "一起玩吧！",
    stageHint: "标签页打开时，槽会慢慢下降。之后再打开，会按离开的时间（有上限）下降后回来。",
    needsTitle: "状态",
    needHunger: "饱腹",
    needHappiness: "快乐",
    needEnergy: "精力",
    needClean: "清洁",
    needsHint: "喂食补饱腹，玩耍加快乐（消耗一点精力），抚摸恢复精力和快乐，洗澡恢复清洁。",
    careTitle: "照顾",
    feed: "喂食",
    play: "玩耍",
    pet: "抚摸",
    clean: "洗澡",
    fedToast: "{name}吃得很开心",
    playedToast: "{name}玩得很尽兴",
    pettedToast: "{name}心情很好",
    cleanedToast: "{name}变得干干净净",
    fastForward: "跳过 1 小时",
    fastForwardHint: "不想等待时用它看时间流逝：槽会下降一小时的量。",
    skippedToast: "过去了一小时",
    pauseDecay: "暂停槽下降",
    pauseDecayHint: "开启后，槽不会随时间下降。",
    awayToast: "{name}一直在等你！离开期间槽下降了一些。",
    nameTitle: "名字",
    nameLabel: "宠物名字",
    namePlaceholder: "例如：麻薯",
    nameSaved: "名字已保存",
    defaultName: "麻薯",
    lookTitle: "外观",
    lookHint: "物种、耳朵、眼睛、身体、尾巴、饰品和颜色随你搭配。全部免费，无代币。或者在本机裁剪自己的照片再上色。从不使用生成式 AI。",
    customize: "用部件搭配",
    usePhoto: "用我的照片",
    useParts: "换回部件精灵",
    photoActive: "当前使用的是照片精灵。照片不会离开此设备。",
    customizeTitle: "用部件搭配",
    speciesLabel: "物种",
    speciesDog: "狗",
    speciesCat: "猫",
    speciesBunny: "兔子",
    speciesBird: "小鸟",
    speciesFox: "狐狸",
    partEars: "耳朵",
    partEyes: "眼睛",
    partBody: "身体",
    partTail: "尾巴",
    partAccessory: "饰品",
    earsRound: "圆耳",
    earsPointy: "尖耳",
    earsFloppy: "垂耳",
    earsLong: "长耳",
    earsTuft: "羽冠",
    eyesDot: "点点眼",
    eyesRound: "圆眼",
    eyesHappy: "笑眼",
    eyesSleepy: "困眼",
    eyesStar: "星星眼",
    bodyRound: "圆润",
    bodyTall: "高挑",
    bodyChunky: "胖乎乎",
    tailCurl: "卷尾",
    tailStraight: "直尾",
    tailFluffy: "蓬松",
    tailShort: "短尾",
    accNone: "无",
    accBow: "蝴蝶结",
    accCollar: "项圈",
    accScarf: "围巾",
    accHat: "帽子",
    colorPrimary: "身体颜色",
    colorSecondary: "肚皮 / 花纹",
    colorAccent: "点缀色",
    colorCustom: "任选颜色",
    randomize: "随机一下",
    done: "完成",
    freeNote: "所有部件和颜色永久免费。没有代币、没有内购、没有锁定。",
    photoTitle: "用我的照片做精灵",
    photoPick: "选择照片",
    photoHint: "照片只在此设备的浏览器里裁剪和上色，不会上传到任何地方，也不涉及生成式 AI。",
    photoZoom: "缩放",
    photoX: "左右",
    photoY: "上下",
    photoTint: "上色",
    photoTintStrength: "上色强度",
    photoApply: "使用这个精灵",
    photoNone: "还没有选择照片。",
    photoBad: "这个文件无法作为图片打开。",
    photoApplied: "已应用照片精灵",
    tintNone: "原色",
    backupTitle: "备份",
    backupBody: "宠物外观、名字、状态和设置打包成一个 JSON 文件。重装或换手机后导入，一切照旧。",
    exportJson: "导出 JSON",
    importJson: "导入 JSON",
    clearAll: "删除全部",
    exported: "已导出 JSON",
    importBad: "这不是宠玩的备份文件",
    importOk: "{name}回来了",
    importConfirmTitle: "用备份覆盖吗？",
    importConfirmBody: "当前宠物和状态会被文件内容替换。先导出一份更安全。",
    clearAllTitle: "删除全部内容？",
    clearAllBody: "宠物、名字、状态和照片精灵会从此设备删除，并开始一只新宠物。无法撤销。",
    cleared: "新宠物诞生了",
    cancel: "取消",
    delete: "删除",
    privacy: "隐私",
    terms: "条款",
    guide: "指南",
  },
};

export function isLang(value: unknown): value is Lang {
  return value === "ko" || value === "en" || value === "ja" || value === "zh";
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
