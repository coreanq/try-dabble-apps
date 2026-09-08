/**
 * Flags and names for every code Frankfurter serves (the ECB reference set).
 * The picker also lists any extra code that shows up in a cached snapshot,
 * falling back to the bare code with a generic banknote glyph.
 */
import type { Lang } from "@/lib/i18n";

export interface CurrencyInfo {
  code: string;
  flag: string;
  name: Record<Lang, string>;
}

const C = (code: string, flag: string, ko: string, en: string, ja: string, zh: string): CurrencyInfo => ({
  code,
  flag,
  name: { ko, en, ja, zh },
});

export const CURRENCIES: CurrencyInfo[] = [
  C("JPY", "🇯🇵", "일본 엔", "Japanese Yen", "日本円", "日元"),
  C("KRW", "🇰🇷", "대한민국 원", "South Korean Won", "韓国ウォン", "韩元"),
  C("USD", "🇺🇸", "미국 달러", "US Dollar", "米ドル", "美元"),
  C("EUR", "🇪🇺", "유로", "Euro", "ユーロ", "欧元"),
  C("CNY", "🇨🇳", "중국 위안", "Chinese Yuan", "中国人民元", "人民币"),
  C("HKD", "🇭🇰", "홍콩 달러", "Hong Kong Dollar", "香港ドル", "港元"),
  C("SGD", "🇸🇬", "싱가포르 달러", "Singapore Dollar", "シンガポールドル", "新加坡元"),
  C("THB", "🇹🇭", "태국 바트", "Thai Baht", "タイバーツ", "泰铢"),
  C("MYR", "🇲🇾", "말레이시아 링깃", "Malaysian Ringgit", "マレーシアリンギット", "马来西亚林吉特"),
  C("IDR", "🇮🇩", "인도네시아 루피아", "Indonesian Rupiah", "インドネシアルピア", "印尼盾"),
  C("PHP", "🇵🇭", "필리핀 페소", "Philippine Peso", "フィリピンペソ", "菲律宾比索"),
  C("INR", "🇮🇳", "인도 루피", "Indian Rupee", "インドルピー", "印度卢比"),
  C("AUD", "🇦🇺", "호주 달러", "Australian Dollar", "豪ドル", "澳元"),
  C("NZD", "🇳🇿", "뉴질랜드 달러", "New Zealand Dollar", "ニュージーランドドル", "新西兰元"),
  C("GBP", "🇬🇧", "영국 파운드", "British Pound", "英ポンド", "英镑"),
  C("CHF", "🇨🇭", "스위스 프랑", "Swiss Franc", "スイスフラン", "瑞士法郎"),
  C("CAD", "🇨🇦", "캐나다 달러", "Canadian Dollar", "カナダドル", "加元"),
  C("MXN", "🇲🇽", "멕시코 페소", "Mexican Peso", "メキシコペソ", "墨西哥比索"),
  C("BRL", "🇧🇷", "브라질 헤알", "Brazilian Real", "ブラジルレアル", "巴西雷亚尔"),
  C("SEK", "🇸🇪", "스웨덴 크로나", "Swedish Krona", "スウェーデンクローナ", "瑞典克朗"),
  C("NOK", "🇳🇴", "노르웨이 크로네", "Norwegian Krone", "ノルウェークローネ", "挪威克朗"),
  C("DKK", "🇩🇰", "덴마크 크로네", "Danish Krone", "デンマーククローネ", "丹麦克朗"),
  C("ISK", "🇮🇸", "아이슬란드 크로나", "Icelandic Króna", "アイスランドクローナ", "冰岛克朗"),
  C("PLN", "🇵🇱", "폴란드 즐로티", "Polish Złoty", "ポーランドズウォティ", "波兰兹罗提"),
  C("CZK", "🇨🇿", "체코 코루나", "Czech Koruna", "チェココルナ", "捷克克朗"),
  C("HUF", "🇭🇺", "헝가리 포린트", "Hungarian Forint", "ハンガリーフォリント", "匈牙利福林"),
  C("RON", "🇷🇴", "루마니아 레우", "Romanian Leu", "ルーマニアレウ", "罗马尼亚列伊"),
  C("TRY", "🇹🇷", "튀르키예 리라", "Turkish Lira", "トルコリラ", "土耳其里拉"),
  C("ILS", "🇮🇱", "이스라엘 셰켈", "Israeli New Shekel", "イスラエルシェケル", "以色列新谢克尔"),
  C("ZAR", "🇿🇦", "남아공 랜드", "South African Rand", "南アフリカランド", "南非兰特"),
];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function currencyInfo(code: string): CurrencyInfo {
  return (
    BY_CODE.get(code) ?? {
      code,
      flag: "💱",
      name: { ko: code, en: code, ja: code, zh: code },
    }
  );
}

/**
 * The picker list: known travel currencies first in the order above, then
 * any snapshot-only codes alphabetically. Codes the snapshot cannot convert
 * are still listed (before the first sync) so the picker is never empty.
 */
export function pickerList(codes: string[]): CurrencyInfo[] {
  const seen = new Set<string>();
  const out: CurrencyInfo[] = [];
  const available = new Set(codes);
  for (const c of CURRENCIES) {
    if (available.size === 0 || available.has(c.code)) {
      out.push(c);
      seen.add(c.code);
    }
  }
  for (const code of [...codes].sort()) {
    if (!seen.has(code)) {
      out.push(currencyInfo(code));
      seen.add(code);
    }
  }
  return out;
}

/** Case-insensitive match on code, flag or the name in the current language. */
export function matchesQuery(info: CurrencyInfo, lang: Lang, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    info.code.toLowerCase().includes(q) ||
    info.name[lang].toLowerCase().includes(q) ||
    info.name.en.toLowerCase().includes(q)
  );
}
