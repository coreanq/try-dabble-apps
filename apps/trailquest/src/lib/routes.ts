/**
 * Routes: the built-in long trails (static, four languages) plus the routes
 * the reader draws up. trailquest:routes:v1 holds only the custom ones; the
 * presets ship with the code so a new version can fix a milestone without
 * touching anyone's storage. Distances are miles from the start.
 */
import type { Lang } from "@/lib/i18n";

export const ROUTES_KEY = "trailquest:routes:v1";

export type Localized = Record<Lang, string>;
export type RouteKind = "preset" | "custom";

export interface Milestone {
  id: string;
  milesFromStart: number;
  name: Localized | string;
  description?: Localized | string;
}

export interface Route {
  id: string;
  kind: RouteKind;
  name: Localized | string;
  totalMiles: number;
  milestones: Milestone[];
  /** Rough "where in the world" tag for presets, shown under the name. */
  region?: Localized;
  createdAt?: string;
  updatedAt?: string;
}

export function localized(text: Localized | string, lang: Lang): string {
  if (typeof text === "string") return text;
  return text[lang] ?? text.en;
}

const L = (ko: string, en: string, ja: string, zh: string): Localized => ({ ko, en, ja, zh });

function ms(id: string, miles: number, name: Localized, description?: Localized): Milestone {
  return description ? { id, milesFromStart: miles, name, description } : { id, milesFromStart: miles, name };
}

export const PRESET_ROUTES: Route[] = [
  {
    id: "pct",
    kind: "preset",
    name: L("퍼시픽 크레스트 트레일 (PCT)", "Pacific Crest Trail (PCT)", "パシフィック・クレスト・トレイル (PCT)", "太平洋屋脊步道 (PCT)"),
    region: L("미국 서부 · 멕시코→캐나다", "US West · Mexico to Canada", "アメリカ西部・メキシコ→カナダ", "美国西部 · 墨西哥到加拿大"),
    totalMiles: 2650,
    milestones: [
      ms("pct-campo", 0, L("캄포 (남쪽 시작점)", "Campo, southern terminus", "カンポ（南端の起点）", "坎波（南端起点）"), L("멕시코 국경의 기념 표지에서 출발.", "The monument on the Mexican border where it all begins.", "メキシコ国境のモニュメントから出発。", "从墨西哥边境的纪念碑出发。")),
      ms("pct-warner", 109, L("워너 스프링스", "Warner Springs", "ワーナー・スプリングス", "华纳温泉"), L("첫 보급지. 이글 록이 근처.", "First resupply town; Eagle Rock is just before it.", "最初の補給地。イーグルロックが手前に。", "第一个补给镇，鹰岩就在前面。")),
      ms("pct-km", 702, L("케네디 메도우스", "Kennedy Meadows", "ケネディ・メドウズ", "肯尼迪草甸"), L("사막이 끝나고 시에라가 시작되는 문.", "The desert ends and the Sierra begins.", "砂漠が終わり、シエラが始まる門。", "沙漠到此结束，内华达山脉开始。")),
      ms("pct-forester", 779, L("포레스터 패스", "Forester Pass", "フォレスター峠", "福雷斯特山口"), L("PCT 최고점, 4,009m.", "Highest point on the PCT, 13,153 ft.", "PCT最高地点、4,009m。", "PCT 最高点，海拔 4,009 米。")),
      ms("pct-tuolumne", 942, L("투올러미 메도우스 (요세미티)", "Tuolumne Meadows, Yosemite", "トゥオルミ・メドウズ（ヨセミテ）", "图奥勒米草甸（优胜美地）")),
      ms("pct-tahoe", 1090, L("사우스 레이크 타호", "South Lake Tahoe", "サウスレイクタホ", "南太浩湖")),
      ms("pct-sierracity", 1195, L("시에라 시티", "Sierra City", "シエラシティ", "塞拉城")),
      ms("pct-shasta", 1499, L("캐슬 크래그스 · 샤스타산 조망", "Castle Crags, Mt Shasta in view", "キャッスル・クラッグス・シャスタ山を望む", "城堡峭壁 · 远眺沙斯塔山")),
      ms("pct-oregon", 1716, L("오리건 주 경계 · 애슐랜드", "Oregon border, Ashland", "オレゴン州境・アシュランド", "俄勒冈州界 · 阿什兰"), L("캘리포니아 끝. 1,700마일을 걸었습니다.", "California is done: 1,700 miles behind you.", "カリフォルニア終了。1,700マイル歩きました。", "加州走完，身后已是 1,700 英里。")),
      ms("pct-crater", 1821, L("크레이터 레이크", "Crater Lake", "クレーターレイク", "火山口湖")),
      ms("pct-timberline", 2094, L("팀버라인 로지 (후드산)", "Timberline Lodge, Mt Hood", "ティンバーライン・ロッジ（フッド山）", "林木线小屋（胡德山）")),
      ms("pct-bridge", 2144, L("신들의 다리 · 워싱턴 진입", "Bridge of the Gods, into Washington", "ブリッジ・オブ・ザ・ゴッズ・ワシントン州へ", "众神之桥 · 进入华盛顿州")),
      ms("pct-snoqualmie", 2390, L("스노퀄미 패스", "Snoqualmie Pass", "スノコルミー峠", "斯诺夸尔米山口")),
      ms("pct-stehekin", 2569, L("스테히킨", "Stehekin", "ステヒキン", "斯特赫金"), L("마지막 보급지. 빵집으로 유명.", "Last resupply, famous for its bakery.", "最後の補給地。ベーカリーが有名。", "最后的补给点，以面包店闻名。")),
      ms("pct-canada", 2650, L("북쪽 종점 · 캐나다 국경", "Northern terminus, Canadian border", "北端の終点・カナダ国境", "北端终点 · 加拿大边境"), L("모뉴먼트 78. 완주.", "Monument 78. You made it.", "モニュメント78。完歩。", "78 号纪念碑。全程走完。")),
    ],
  },
  {
    id: "at",
    kind: "preset",
    name: L("애팔래치아 트레일 (AT)", "Appalachian Trail (AT)", "アパラチアン・トレイル (AT)", "阿巴拉契亚步道 (AT)"),
    region: L("미국 동부 · 조지아→메인", "US East · Georgia to Maine", "アメリカ東部・ジョージア→メイン", "美国东部 · 佐治亚到缅因"),
    totalMiles: 2190,
    milestones: [
      ms("at-springer", 0, L("스프링어 마운틴", "Springer Mountain", "スプリンガー山", "斯普林格山"), L("남쪽 시작점의 청동 명판.", "The bronze plaque at the southern terminus.", "南端の起点にある銅板。", "南端起点的铜牌。")),
      ms("at-neels", 31, L("닐스 갭", "Neels Gap", "ニールズ・ギャップ", "尼尔斯山口"), L("트레일이 건물 안을 지나는 유일한 곳.", "The only spot where the trail passes through a building.", "トレイルが建物の中を通る唯一の場所。", "步道唯一穿过建筑物的地方。")),
      ms("at-noc", 137, L("낸터할라 아웃도어 센터", "Nantahala Outdoor Center", "ナンタハラ・アウトドア・センター", "南塔哈拉户外中心")),
      ms("at-fontana", 166, L("폰태나 댐", "Fontana Dam", "フォンタナ・ダム", "丰塔纳水坝")),
      ms("at-clingmans", 200, L("클링먼스 돔", "Clingmans Dome", "クリングマンズ・ドーム", "克林曼斯穹顶"), L("AT 최고점, 2,025m.", "Highest point on the AT, 6,643 ft.", "AT最高地点、2,025m。", "AT 最高点，海拔 2,025 米。")),
      ms("at-hotsprings", 274, L("핫 스프링스", "Hot Springs", "ホットスプリングス", "温泉镇")),
      ms("at-damascus", 470, L("다마스커스", "Damascus", "ダマスカス", "大马士革镇"), L("‘트레일 타운 USA’.", "Trail Town USA.", "「トレイルタウンUSA」。", "“步道小镇 USA”。")),
      ms("at-mcafee", 712, L("맥아피 놉", "McAfee Knob", "マカフィー・ノブ", "麦卡菲峰"), L("AT에서 가장 많이 찍히는 바위.", "The most photographed ledge on the AT.", "ATで最も撮影される岩。", "AT 上最常被拍的岩石。")),
      ms("at-harpers", 1025, L("하퍼스 페리", "Harpers Ferry", "ハーパーズ・フェリー", "哈珀斯费里"), L("심리적 중간 지점, ATC 본부.", "The psychological halfway point and ATC headquarters.", "心理的な中間地点、ATC本部。", "心理上的中点，ATC 总部所在地。")),
      ms("at-dwg", 1296, L("델라웨어 워터 갭", "Delaware Water Gap", "デラウェア・ウォーター・ギャップ", "特拉华水峡")),
      ms("at-bear", 1405, L("베어 마운틴 (뉴욕)", "Bear Mountain, New York", "ベア・マウンテン（ニューヨーク）", "熊山（纽约）")),
      ms("at-greylock", 1596, L("그레이록산", "Mt Greylock", "グレイロック山", "格雷洛克山")),
      ms("at-hanover", 1748, L("하노버 (뉴햄프셔)", "Hanover, New Hampshire", "ハノーバー（ニューハンプシャー）", "汉诺威（新罕布什尔）")),
      ms("at-washington", 1852, L("워싱턴산", "Mt Washington", "ワシントン山", "华盛顿山"), L("화이트 마운틴의 정점, 거친 날씨로 유명.", "Top of the Whites, famous for wild weather.", "ホワイト山地の頂点、荒天で有名。", "白山之巅，以恶劣天气闻名。")),
      ms("at-katahdin", 2190, L("커타딘산 · 북쪽 종점", "Mt Katahdin, northern terminus", "カタディン山・北端の終点", "卡塔丁山 · 北端终点"), L("정상의 나무 표지판. 완주.", "The wooden sign on the summit. You made it.", "山頂の木の標識。完歩。", "山顶的木牌。全程走完。")),
    ],
  },
  {
    id: "cdt",
    kind: "preset",
    name: L("컨티넨털 디바이드 트레일 (CDT)", "Continental Divide Trail (CDT)", "コンチネンタル・ディバイド・トレイル (CDT)", "大陆分水岭步道 (CDT)"),
    region: L("미국 로키 · 멕시코→캐나다", "US Rockies · Mexico to Canada", "アメリカ・ロッキー・メキシコ→カナダ", "美国落基山 · 墨西哥到加拿大"),
    totalMiles: 3100,
    milestones: [
      ms("cdt-crazycook", 0, L("크레이지 쿡 기념비", "Crazy Cook Monument", "クレイジー・クック・モニュメント", "疯厨师纪念碑")),
      ms("cdt-lordsburg", 85, L("로즈버그", "Lordsburg", "ローズバーグ", "洛兹堡")),
      ms("cdt-silvercity", 200, L("실버 시티", "Silver City", "シルバーシティ", "银城")),
      ms("cdt-pietown", 425, L("파이 타운", "Pie Town", "パイタウン", "派镇"), L("이름 그대로 파이를 먹는 곳.", "Yes, you stop for pie.", "名前の通りパイを食べる町。", "顾名思义，停下来吃派。")),
      ms("cdt-grants", 520, L("그랜츠", "Grants", "グランツ", "格兰茨")),
      ms("cdt-ghostranch", 690, L("고스트 랜치", "Ghost Ranch", "ゴースト・ランチ", "幽灵牧场")),
      ms("cdt-chama", 790, L("차마 · 콜로라도 진입", "Chama, into Colorado", "チャマ・コロラド州へ", "查马 · 进入科罗拉多")),
      ms("cdt-wolfcreek", 900, L("울프 크릭 패스", "Wolf Creek Pass", "ウルフ・クリーク峠", "狼溪山口")),
      ms("cdt-lakecity", 1090, L("레이크 시티", "Lake City", "レイクシティ", "湖城")),
      ms("cdt-monarch", 1300, L("모나크 패스", "Monarch Pass", "モナーク峠", "君主山口")),
      ms("cdt-twinlakes", 1420, L("트윈 레이크스", "Twin Lakes", "ツインレイクス", "双湖")),
      ms("cdt-grandlake", 1670, L("그랜드 레이크", "Grand Lake", "グランドレイク", "大湖")),
      ms("cdt-rawlins", 1850, L("롤린스 · 그레이트 디바이드 분지", "Rawlins, Great Divide Basin", "ローリンズ・グレート・ディバイド盆地", "罗林斯 · 大分水岭盆地")),
      ms("cdt-southpass", 1990, L("사우스 패스 시티", "South Pass City", "サウスパス・シティ", "南山口城")),
      ms("cdt-oldfaithful", 2300, L("올드 페이스풀 (옐로스톤)", "Old Faithful, Yellowstone", "オールド・フェイスフル（イエローストーン）", "老忠实泉（黄石）")),
      ms("cdt-butte", 2650, L("뷰트", "Butte", "ビュート", "比尤特")),
      ms("cdt-glacier", 3100, L("치프 마운틴 · 캐나다 국경", "Chief Mountain, Canadian border", "チーフ・マウンテン・カナダ国境", "酋长山 · 加拿大边境"), L("글레이셔 국립공원 끝. 완주.", "The end of Glacier National Park. You made it.", "グレイシャー国立公園の端。完歩。", "冰川国家公园尽头。全程走完。")),
    ],
  },
  {
    id: "camino",
    kind: "preset",
    name: L("카미노 데 산티아고 (프랑스 길)", "Camino de Santiago (Camino Francés)", "カミーノ・デ・サンティアゴ（フランス人の道）", "圣雅各之路（法国之路）"),
    region: L("스페인 · 생장→산티아고", "Spain · Saint-Jean to Santiago", "スペイン・サン=ジャン→サンティアゴ", "西班牙 · 圣让到圣地亚哥"),
    totalMiles: 500,
    milestones: [
      ms("cam-sjpp", 0, L("생장피에드포르", "Saint-Jean-Pied-de-Port", "サン=ジャン=ピエ=ド=ポル", "圣让-皮耶德波尔")),
      ms("cam-roncesvalles", 15, L("론세스바예스", "Roncesvalles", "ロンセスバジェス", "龙塞斯瓦列斯"), L("피레네를 넘은 첫날 밤.", "First night after crossing the Pyrenees.", "ピレネーを越えた最初の夜。", "翻过比利牛斯山后的第一夜。")),
      ms("cam-pamplona", 42, L("팜플로나", "Pamplona", "パンプローナ", "潘普洛纳")),
      ms("cam-puente", 62, L("푸엔테 라 레이나", "Puente la Reina", "プエンテ・ラ・レイナ", "王后桥")),
      ms("cam-logrono", 104, L("로그로뇨", "Logroño", "ログローニョ", "洛格罗尼奥")),
      ms("cam-burgos", 178, L("부르고스", "Burgos", "ブルゴス", "布尔戈斯")),
      ms("cam-leon", 302, L("레온", "León", "レオン", "莱昂")),
      ms("cam-astorga", 331, L("아스토르가", "Astorga", "アストルガ", "阿斯托尔加")),
      ms("cam-cruz", 356, L("크루스 데 페로", "Cruz de Ferro", "クルス・デ・フェロ", "铁十字架"), L("집에서 가져온 돌을 내려놓는 곳.", "Where pilgrims leave the stone they carried from home.", "家から持ってきた石を置く場所。", "朝圣者放下从家乡带来的石头之处。")),
      ms("cam-ponferrada", 376, L("폰페라다", "Ponferrada", "ポンフェラーダ", "蓬费拉达")),
      ms("cam-cebreiro", 414, L("오 세브레이로", "O Cebreiro", "オ・セブレイロ", "奥塞夫雷罗")),
      ms("cam-sarria", 452, L("사리아", "Sarria", "サリア", "萨里亚"), L("마지막 100km가 시작되는 곳.", "Where the final 100 km begins.", "最後の100kmが始まる場所。", "最后 100 公里的起点。")),
      ms("cam-portomarin", 465, L("포르토마린", "Portomarín", "ポルトマリン", "波尔托马林")),
      ms("cam-santiago", 500, L("산티아고 데 콤포스텔라", "Santiago de Compostela", "サンティアゴ・デ・コンポステーラ", "圣地亚哥-德孔波斯特拉"), L("대성당 앞 오브라도이로 광장. 완주.", "Praza do Obradoiro in front of the cathedral. You made it.", "大聖堂前のオブラドイロ広場。完歩。", "大教堂前的奥夫拉多伊罗广场。全程走完。")),
    ],
  },
  {
    id: "jmt",
    kind: "preset",
    name: L("존 뮤어 트레일 (JMT)", "John Muir Trail (JMT)", "ジョン・ミューア・トレイル (JMT)", "约翰·缪尔步道 (JMT)"),
    region: L("미국 시에라 · 요세미티→휘트니산", "US Sierra · Yosemite to Mt Whitney", "アメリカ・シエラ・ヨセミテ→ホイットニー山", "美国内华达山 · 优胜美地到惠特尼峰"),
    totalMiles: 211,
    milestones: [
      ms("jmt-happyisles", 0, L("해피 아일스 (요세미티 밸리)", "Happy Isles, Yosemite Valley", "ハッピー・アイルズ（ヨセミテ渓谷）", "快乐岛（优胜美地谷）")),
      ms("jmt-tuolumne", 23, L("투올러미 메도우스", "Tuolumne Meadows", "トゥオルミ・メドウズ", "图奥勒米草甸")),
      ms("jmt-donohue", 36, L("도너휴 패스", "Donohue Pass", "ドナヒュー峠", "多诺休山口")),
      ms("jmt-reds", 59, L("레즈 메도우", "Reds Meadow", "レッズ・メドウ", "雷德斯草甸")),
      ms("jmt-silver", 88, L("실버 패스", "Silver Pass", "シルバー峠", "银山口")),
      ms("jmt-mtr", 108, L("뮤어 트레일 랜치", "Muir Trail Ranch", "ミューア・トレイル・ランチ", "缪尔步道牧场")),
      ms("jmt-muirpass", 137, L("뮤어 패스 · 뮤어 헛", "Muir Pass, Muir Hut", "ミューア峠・ミューア小屋", "缪尔山口 · 缪尔小屋")),
      ms("jmt-mather", 161, L("매더 패스", "Mather Pass", "マザー峠", "马瑟山口")),
      ms("jmt-forester", 190, L("포레스터 패스", "Forester Pass", "フォレスター峠", "福雷斯特山口")),
      ms("jmt-whitney", 211, L("휘트니산 정상", "Mt Whitney summit", "ホイットニー山頂", "惠特尼峰顶"), L("미국 본토 최고봉, 4,421m. 완주.", "Highest point in the lower 48, 14,505 ft. You made it.", "米本土最高峰、4,421m。完歩。", "美国本土最高峰，海拔 4,421 米。全程走完。")),
    ],
  },
  {
    id: "baekdu",
    kind: "preset",
    name: L("백두대간 (남한 구간)", "Baekdudaegan Ridge (South Korea)", "白頭大幹（韓国区間）", "白头大干（韩国段）"),
    region: L("한국 · 지리산→진부령", "Korea · Jirisan to Jinburyeong", "韓国・智異山→陳富嶺", "韩国 · 智异山到陈富岭"),
    totalMiles: 457,
    milestones: [
      ms("bd-cheonwang", 0, L("지리산 천왕봉", "Jirisan Cheonwangbong", "智異山・天王峰", "智异山天王峰"), L("남쪽 출발점, 1,915m.", "The southern start, 1,915 m.", "南の出発点、1,915m。", "南端起点，海拔 1,915 米。")),
      ms("bd-yukship", 60, L("육십령", "Yukship-ryeong Pass", "六十嶺", "六十岭")),
      ms("bd-deogyu", 90, L("덕유산 향적봉", "Deogyusan Hyangjeokbong", "徳裕山・香積峰", "德裕山香积峰")),
      ms("bd-sokri", 190, L("속리산 천왕봉", "Songnisan Cheonwangbong", "俗離山・天王峰", "俗离山天王峰")),
      ms("bd-worak", 245, L("월악산 · 하늘재", "Woraksan, Haneuljae Pass", "月岳山・ハヌルジェ", "月岳山 · 天岭")),
      ms("bd-sobaek", 275, L("소백산 비로봉", "Sobaeksan Birobong", "小白山・毘盧峰", "小白山毗卢峰")),
      ms("bd-taebaek", 340, L("태백산 · 함백산", "Taebaeksan, Hambaeksan", "太白山・咸白山", "太白山 · 咸白山")),
      ms("bd-odae", 400, L("오대산 · 대관령", "Odaesan, Daegwallyeong Pass", "五台山・大関嶺", "五台山 · 大关岭")),
      ms("bd-seorak", 440, L("설악산 대청봉", "Seoraksan Daecheongbong", "雪岳山・大青峰", "雪岳山大青峰")),
      ms("bd-jinbu", 457, L("진부령", "Jinburyeong Pass", "陳富嶺", "陈富岭"), L("남한 구간 끝. 완주.", "End of the South Korean section. You made it.", "韓国区間の終点。完歩。", "韩国段终点。全程走完。")),
    ],
  },
  {
    id: "tokaido",
    kind: "preset",
    name: L("도쿄→교토 도카이도 (가상)", "Tokyo to Kyoto, the Tōkaidō (virtual)", "東京→京都 東海道（バーチャル）", "东京到京都 东海道（虚拟）"),
    region: L("일본 · 니혼바시→산조 오하시", "Japan · Nihonbashi to Sanjō Ōhashi", "日本・日本橋→三条大橋", "日本 · 日本桥到三条大桥"),
    totalMiles: 320,
    milestones: [
      ms("tk-nihonbashi", 0, L("니혼바시 (도쿄)", "Nihonbashi, Tokyo", "日本橋（東京）", "日本桥（东京）"), L("옛 도카이도의 출발점.", "Where the old Tōkaidō began.", "旧東海道の起点。", "旧东海道的起点。")),
      ms("tk-odawara", 52, L("오다와라", "Odawara", "小田原", "小田原")),
      ms("tk-hakone", 60, L("하코네 고개", "Hakone Pass", "箱根峠", "箱根岭")),
      ms("tk-mishima", 70, L("미시마", "Mishima", "三島", "三岛")),
      ms("tk-yui", 95, L("유이 · 후지산 조망", "Yui, Mt Fuji in view", "由比・富士山を望む", "由比 · 远眺富士山")),
      ms("tk-shizuoka", 110, L("시즈오카 (후추)", "Shizuoka, Fuchū", "静岡（府中）", "静冈（府中）")),
      ms("tk-hamamatsu", 160, L("하마마쓰", "Hamamatsu", "浜松", "滨松")),
      ms("tk-okazaki", 215, L("오카자키", "Okazaki", "岡崎", "冈崎")),
      ms("tk-miya", 230, L("미야 (나고야)", "Miya, Nagoya", "宮（名古屋）", "宫（名古屋）")),
      ms("tk-seki", 270, L("세키", "Seki", "関", "关")),
      ms("tk-kusatsu", 300, L("구사쓰", "Kusatsu", "草津", "草津")),
      ms("tk-sanjo", 320, L("산조 오하시 (교토)", "Sanjō Ōhashi, Kyoto", "三条大橋（京都）", "三条大桥（京都）"), L("53개 역참의 끝. 완주.", "The end of the fifty-three stations. You made it.", "五十三次の終点。完歩。", "五十三次的终点。全程走完。")),
    ],
  },
];

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function cleanName(v: unknown): string | null {
  if (typeof v === "string") return v.trim() ? v.trim().slice(0, 60) : null;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const en = typeof o.en === "string" ? o.en.trim() : "";
    const any = Object.values(o).find((x) => typeof x === "string" && x.trim()) as string | undefined;
    const s = en || any || "";
    return s ? s.slice(0, 60) : null;
  }
  return null;
}

export function normalizeMilestone(raw: unknown, totalMiles: number): Milestone | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  const miles = typeof o.milesFromStart === "string" ? Number(o.milesFromStart) : o.milesFromStart;
  if (!isFiniteNumber(miles) || miles < 0 || miles > totalMiles) return null;
  const name = cleanName(o.name);
  if (!name) return null;
  const m: Milestone = { id: o.id, milesFromStart: Math.round(miles * 1000) / 1000, name };
  const description = cleanName(o.description);
  if (description) m.description = description.slice(0, 140);
  return m;
}

/** Custom routes only. Presets in a backup are ignored: the code ships them. */
export function normalizeRoute(raw: unknown): Route | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (o.kind === "preset") return null;
  const name = cleanName(o.name);
  if (!name) return null;
  const total = typeof o.totalMiles === "string" ? Number(o.totalMiles) : o.totalMiles;
  if (!isFiniteNumber(total) || total <= 0) return null;
  const totalMiles = Math.round(total * 1000) / 1000;
  const milestones = Array.isArray(o.milestones)
    ? (o.milestones.map((m) => normalizeMilestone(m, totalMiles)).filter(Boolean) as Milestone[])
    : [];
  const seen = new Set<string>();
  const unique = milestones.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  unique.sort((a, b) => a.milesFromStart - b.milesFromStart);
  const route: Route = { id: o.id, kind: "custom", name, totalMiles, milestones: unique };
  if (typeof o.createdAt === "string" && o.createdAt) route.createdAt = o.createdAt;
  if (typeof o.updatedAt === "string" && o.updatedAt) route.updatedAt = o.updatedAt;
  return route;
}

export function normalizeRoutes(raw: unknown): Route[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>(PRESET_ROUTES.map((r) => r.id));
  const out: Route[] = [];
  for (const item of raw) {
    const r = normalizeRoute(item);
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}

export function loadCustomRoutes(): Route[] {
  try {
    const raw = localStorage.getItem(ROUTES_KEY);
    return raw ? normalizeRoutes(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveCustomRoutes(routes: Route[]): void {
  try {
    localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  } catch {
    /* private mode */
  }
}

/** Presets first, then the reader's routes in creation order. */
export function allRoutes(custom: Route[]): Route[] {
  return [...PRESET_ROUTES, ...custom];
}

export function findRoute(routes: Route[], id: string | undefined | null): Route | null {
  if (!id) return null;
  return routes.find((r) => r.id === id) ?? null;
}
