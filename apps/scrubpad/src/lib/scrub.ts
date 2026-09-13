/**
 * The scrubber. Pure functions, no DOM, no network: the same code runs in the
 * browser and under `node --test`. Detects emails, phones, payment cards
 * (Luhn), IPs, API keys / tokens, street-ish addresses, person names and the
 * user's own custom words, then swaps every occurrence of the same entity
 * for one stable placeholder such as [NAME_1].
 */

export type EntityType = "EMAIL" | "PHONE" | "CARD" | "IP" | "KEY" | "ADDRESS" | "NAME" | "WORD";

export const ENTITY_TYPES: EntityType[] = ["WORD", "KEY", "CARD", "EMAIL", "IP", "PHONE", "ADDRESS", "NAME"];

/** Lower rank wins a tie in length. Custom words are the user's explicit intent. */
const RANK: Record<EntityType, number> = { WORD: 0, KEY: 1, CARD: 2, EMAIL: 3, IP: 4, PHONE: 5, ADDRESS: 6, NAME: 7 };

export interface Span {
  type: EntityType;
  start: number;
  end: number;
  original: string;
  normalized: string;
}

/** One row of the review list: one entity, every occurrence. */
export interface Entity {
  key: string;
  type: EntityType;
  original: string;
  normalized: string;
  token: string;
  count: number;
}

export interface Segment {
  text: string;
  type?: EntityType;
  token?: string;
}

export interface ScrubResult {
  entities: Entity[];
  /** The scrubbed text as runs: plain text and token marks. */
  segments: Segment[];
  /** The original text as runs: plain text and the spans that were (or would be) replaced. */
  originalSegments: Segment[];
  scrubbed: string;
  map: Record<string, string>;
}

export interface ScrubOptions {
  customWords?: string[];
  disabled?: Iterable<string>;
}

// ---------------------------------------------------------------------------
// Helpers

function normalizeSpace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function luhn(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= "0" && ch <= "9";
}

type Matcher = (text: string, push: (span: Span) => void) => void;

function scan(text: string, re: RegExp, type: EntityType, push: (s: Span) => void, opts: { group?: number; normalize?: (s: string) => string; accept?: (m: RegExpExecArray, text: string) => boolean } = {}) {
  const group = opts.group ?? 0;
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    if (opts.accept && !opts.accept(m, text)) continue;
    const original = m[group];
    if (!original) continue;
    const start = group === 0 ? m.index : m.index + m[0].indexOf(original);
    const end = start + original.length;
    push({ type, start, end, original, normalized: opts.normalize ? opts.normalize(original) : original });
  }
}

// ---------------------------------------------------------------------------
// Email

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

const matchEmail: Matcher = (text, push) => scan(text, EMAIL_RE, "EMAIL", push, { normalize: (s) => s.toLowerCase() });

// ---------------------------------------------------------------------------
// Phone: +cc international, KR 010-####-####, US (xxx) xxx-xxxx, IT / JP / CN.

const PHONE_RES: RegExp[] = [
  // +1 202-555-0147, +82 10-1234-5678, +39 06 1234 5678, +81 90-1234-5678, +86 138 0013 8000
  /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}/g,
  // (202) 555-0147, 202-555-0147, 202.555.0147
  /\(\d{3}\)\s?\d{3}[\s.-]\d{4}|\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/g,
  // 010-1234-5678, 02-123-4567, 031 123 4567, 03-1234-5678 (JP), 090-1234-5678
  /\b0\d{1,3}[\s.-]\d{3,4}[\s.-]\d{4}\b/g,
  // 01012345678, 09012345678 (bare KR / JP mobile)
  /\b0[19]0\d{8}\b/g,
  // CN mobile 138 0013 8000 / 13800138000
  /\b1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // IT mobile 345 123 4567 / 3451234567, IT landline 06 1234 5678
  /\b3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b0\d{1,3}[\s.-]\d{4}[\s.-]?\d{3,4}\b/g,
];

function normalizePhone(s: string): string {
  const digits = s.replace(/\D/g, "");
  return (s.trim().startsWith("+") ? "+" : "") + digits;
}

const matchPhone: Matcher = (text, push) => {
  for (const re of PHONE_RES) {
    scan(text, re, "PHONE", push, {
      normalize: normalizePhone,
      accept: (m, t) => {
        const before = t[m.index - 1];
        const after = t[m.index + m[0].length];
        if (isDigit(before) || isDigit(after)) return false;
        const digits = m[0].replace(/\D/g, "");
        return digits.length >= 8 && digits.length <= 15;
      },
    });
  }
};

// ---------------------------------------------------------------------------
// Payment card: 13–19 digits with optional spaces / dashes, Luhn-valid.

const CARD_RE = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;

const matchCard: Matcher = (text, push) =>
  scan(text, CARD_RE, "CARD", push, {
    normalize: (s) => s.replace(/\D/g, ""),
    accept: (m) => luhn(m[0].replace(/\D/g, "")),
  });

// ---------------------------------------------------------------------------
// IP: dotted IPv4 and simple IPv6.

const IPV4_RE = /(?<![\d.])(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(?![\d.])/g;
const IPV6_RE = /(?<![\w:.])(?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(?![\w:.])/g;

function looksLikeIpv6(s: string): boolean {
  if (s.length < 3) return false;
  const doubles = s.split("::").length - 1;
  if (doubles > 1) return false;
  const groups = s.split(":").filter((g) => g.length > 0);
  if (groups.length === 0) return false;
  if (!groups.every((g) => /^[0-9A-Fa-f]{1,4}$/.test(g))) return false;
  const colons = s.split(":").length - 1;
  if (doubles === 0 && colons !== 7) return false;
  if (doubles === 0 && !/[A-Fa-f]/.test(s) && groups.every((g) => g.length <= 2)) return false;
  return true;
}

const matchIp: Matcher = (text, push) => {
  scan(text, IPV4_RE, "IP", push);
  scan(text, IPV6_RE, "IP", push, { normalize: (s) => s.toLowerCase(), accept: (m) => looksLikeIpv6(m[0]) });
};

// ---------------------------------------------------------------------------
// API keys / tokens.

const KEY_RES: { re: RegExp; group?: number }[] = [
  { re: /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{16,}/g },
  { re: /\bAKIA[0-9A-Z]{16}\b/g },
  { re: /\b(?:ghp|gho|ghs|ghr|ghu)_[A-Za-z0-9]{20,}\b/g },
  { re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g },
  { re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g },
  { re: /\bBearer\s+([A-Za-z0-9._\-]{20,})/g, group: 1 },
  { re: /\b(?:api[_ -]?key|apikey|secret[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|private[_ -]?key|token|secret|password|passwd|pwd|key)\s*[:=]\s*["'`]?([A-Za-z0-9+/=_.\-]{16,})/gi, group: 1 },
  { re: /\b(?:key|token|secret)\b[^\n]{0,20}?\b([0-9a-fA-F]{32,})\b/gi, group: 1 },
];

const matchKey: Matcher = (text, push) => {
  for (const { re, group } of KEY_RES) scan(text, re, "KEY", push, { group });
};

// ---------------------------------------------------------------------------
// Address-ish: street + number, Italian "Via Roma 12", KO / JA / ZH, postcodes.

const ADDRESS_RES: RegExp[] = [
  // 123 Main St, 221B Baker Street, 1600 Pennsylvania Avenue NW, Apt 4
  /\b\d{1,5}[A-Za-z]?\s+(?:[A-Z][A-Za-z.']*\s+){0,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Square|Sq|Terrace|Ter|Highway|Hwy|Parkway|Pkwy|Circle|Cir|Trail|Trl)\b(?:\.(?=,?\s+(?:Apt|Apartment|Suite|Ste|Unit|Floor|Fl|N|S|E|W|NE|NW|SE|SW)\b))?(?:\s+(?:N|S|E|W|NE|NW|SE|SW)\b)?(?:,?\s+(?:Apt|Apartment|Suite|Ste|Unit|Floor|Fl)\.?\s*#?\s*\w+)?/g,
  // Via Roma 12, Piazza del Duomo 3, Corso Vittorio Emanuele II 45
  /\b(?:Via|Viale|Piazza|Piazzale|Corso|Vicolo|Largo|Strada|Calle|Rue|Avenue|Rua|Straße|Strasse)\s+(?:[A-Za-zÀ-ÿ'.]+\s+){1,4}\d{1,4}[A-Za-z]?\b/g,
  // US state + ZIP: CA 90210, NY 10001-1234
  /\b[A-Z]{2}\s\d{5}(?:-\d{4})?\b/g,
  // UK postcode
  /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g,
  // Korean: 서울 강남구 테헤란로 152, 경기도 성남시 분당구 판교역로 235
  /(?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(?:특별시|광역시|특별자치시|특별자치도|도|시)?\s*[가-힣]+(?:시|군|구)(?:\s*[가-힣]+(?:구|읍|면|동|가|로|길))*(?:\s*\d+(?:[-–]\d+)*(?:번길|번지|호|층|동)?)*(?:\s*\d+(?:[-–]\d+)*(?:번길|번지|호|층|동)?)*/g,
  // Korean postcode label
  /(?:우편번호|우)\s*[:：]?\s*\d{5}\b/g,
  // Japanese: 東京都渋谷区神宮前1-2-3, 〒150-0001
  /(?:東京都|北海道|(?:大阪|京都)府|[一-龥]{2,3}県)[一-龥ぁ-んァ-ヶー]{1,15}\d+(?:[-−ー‐]\d+){0,3}(?:号|番地|番)?(?:[一-龥ァ-ヶー]{1,10}\d{1,4}(?:号室|階|号)?)?/g,
  /〒\s?\d{3}[-−‐]?\d{4}/g,
  // Chinese: 上海市浦东新区世纪大道100号, 北京市朝阳区建国路8号
  /(?:[一-龥]{2,3}省)?[一-龥]{2,5}(?:市|区|县)(?:[一-龥]{2,5}(?:区|县|镇|街道))?[一-龥]{1,10}(?:路|街|道|巷|大道)\d+号?(?:[一-龥\d]{0,6}(?:室|楼|层|号))?/g,
];

const matchAddress: Matcher = (text, push) => {
  for (const re of ADDRESS_RES) {
    scan(text, re, "ADDRESS", push, {
      normalize: (s) => normalizeSpace(s).toLowerCase(),
      accept: (m) => m[0].trim().length >= 5,
    });
  }
};

// ---------------------------------------------------------------------------
// Person names: heuristic per script.

const EN_STOP = new Set(
  (
    "The This That These Those There Here Then Than When Where Which While Who Whom Whose What Why How " +
    "And But Or Nor Not So Yet For From With Without Into Onto Over Under Above Below About After Before Between " +
    "Monday Tuesday Wednesday Thursday Friday Saturday Sunday " +
    "January February March April May June July August September October November December " +
    "ChatGPT Claude OpenAI Anthropic Google Microsoft Apple Amazon Meta GitHub Slack Discord Notion Gmail Outlook Zoom Teams " +
    "HTTP HTTPS JSON HTML CSS URL API SDK PDF CSV XML SQL AWS GCP Azure Linux Windows MacOS iOS Android " +
    "Email Phone Card Key Token Secret Password Address Name Subject Date Time Note Notes Re Fw Fwd Cc Bcc " +
    "Hi Hello Hey Dear Thanks Thank Best Regards Kind Sincerely Cheers Please Yes No Ok Okay " +
    "Project Team Company Inc Ltd Llc Corp Co Group Dept Department Office Manager Client Customer User Admin " +
    "Free Local Scrubpad Paste Copy Download Scrub Review Restore Map Export Import Custom Word Words " +
    "Monday Today Tomorrow Yesterday Tonight Morning Evening Night Week Month Year " +
    "I You He She It We They Me Him Her Us Them My Your His Its Our Their Mine Yours " +
    "Also Just Only Very Really Still Even Ever Never Always Sometimes Maybe Perhaps " +
    "Question Answer Summary Summarize Translate Rewrite Explain Write Read Draft Reply Meeting Invoice Order Report " +
    "Street Avenue Road Lane Drive Court Way Place Square Via Piazza Corso " +
    "New Old Big Small Good Bad Great First Last Next Previous Main North South East West Central " +
    "Dr Mr Mrs Ms Prof Sir Madam Miss Mx " +
    "Contact Call Meet Ask Tell Send Message Text Ping Invite Introduce Welcome Congratulations Attention Notice Update Reminder Regarding According Per To At In On By Of As Is Are Was Were Be Been Being Has Have Had Do Does Did Will Would Can Could Should May Might Must Shall " +
    "Our Warm Warmly Truly Yours Faithfully Respectfully Attached Attachment Below Following See Find Let Get Make Take Give Keep Put Set Use Try Help Need Want Know Think Say Said Go Come See Look Show Talk Speak Start Stop Add Remove Change Check Confirm Cancel Book Pay Buy Sell Sign Open Close Save Delete Share Post Note Print Scan Fix Run Build Test Deploy Ship Launch Plan Schedule Track Log " +
    "One Two Three Four Five Six Seven Eight Nine Ten Hundred Thousand Million Total Amount Price Cost Fee Tax Rate Number Count Item Items Page Pages Line Lines Row Rows Column Table List File Files Folder Link Links Image Photo Video Audio Doc Docs Sheet Slide Form Field " +
    "Alpha Beta Gamma Delta Version Release Sprint Ticket Issue Bug Feature Task Story Epic Backlog Board Board Card Cards Deck " +
    "Acme Example Test Demo Sample Lorem Ipsum Dolor Sit Amet " +
    "Korea Korean Japan Japanese China Chinese Italy Italian England English France French German Germany Spain Spanish America American Europe European Asia Asian Africa African Seoul Tokyo Beijing Shanghai Rome Milan London Paris Berlin Madrid York Los Angeles San Francisco Chicago Boston Toronto Sydney"
  ).split(/\s+/),
);

const EN_TITLE = "(?:Mr|Mrs|Ms|Miss|Mx|Dr|Prof|Sir|Madam|Sig|Sig\\.ra|Sigra|Herr|Frau|Mme|Mlle|M)\\.?";
const EN_WORD = "[A-Z][a-z\u00e0-\u00ff]+(?:[-'][A-Z][a-z\u00e0-\u00ff]+)?";
// Title + one to three capitalized words: "Dr. Ada Lovelace", "Mr Babbage".
const EN_TITLE_NAME_RE = new RegExp(`\\b${EN_TITLE}\\s+(${EN_WORD}(?:\\s+${EN_WORD}){0,2})`, "g");
// A run of capitalized words; stopwords are trimmed and the rest is chunked into 2–3 word names.
const EN_RUN_RE = new RegExp(`\\b${EN_WORD}(?:[ \\t]+${EN_WORD})+\\b`, "g");

function enStop(w: string): boolean {
  return EN_STOP.has(w) || EN_STOP.has(w.replace(/[-'].*$/, "")) || /^[A-Z]+$/.test(w);
}

function enNameOk(words: string[]): boolean {
  return words.length >= 1 && words.every((w) => !enStop(w));
}

function matchEnRuns(text: string, push: (s: Span) => void, norm: (s: string) => string) {
  EN_RUN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = EN_RUN_RE.exec(text)) !== null) {
    const words: { w: string; at: number }[] = [];
    const wordRe = /\S+/g;
    let wm: RegExpExecArray | null;
    while ((wm = wordRe.exec(m[0])) !== null) words.push({ w: wm[0], at: m.index + wm.index });
    let i = 0;
    while (i < words.length) {
      if (enStop(words[i].w)) {
        i++;
        continue;
      }
      let j = i;
      while (j < words.length && !enStop(words[j].w)) j++;
      const run = words.slice(i, j);
      let k = 0;
      while (run.length - k >= 2) {
        const left = run.length - k;
        const take = left === 3 || left === 5 ? 3 : 2;
        const first = run[k];
        const last = run[k + take - 1];
        const original = text.slice(first.at, last.at + last.w.length);
        push({ type: "NAME", start: first.at, end: last.at + last.w.length, original, normalized: norm(original) });
        k += take;
      }
      i = j;
    }
  }
}

const KO_SURNAMES =
  "김이박최정강조윤장임한오서신권황안송전홍유고문양손배백허남심노하곽성차주우구민류나진지엄채원천방공현함변염여추도소석선설마길연위표명기반라왕금옥육인맹제모탁국어은편용";
const KO_STOP = new Set(
  "이메일 이번에 이제는 이렇게 이것은 이것을 이곳에 이유는 이름은 이름을 이상은 이후에 이전에 이용자 이용해 이용할 이야기 이하의 김치는 김치를 박스는 박스를 정보는 정보를 정보가 전화는 전화를 전화가 전화번 조금은 조금만 조건은 한국은 한국의 한국어 오늘은 오늘의 서울은 서울의 서울시 강남구 주소는 주소를 주소가 신용카 유저는 고객은 고객의 고객님 문서는 문서를 안녕하 하지만 그리고 정리해 정리를 요약해 번역해 설명해 작성해 확인해 감사합 감사해 안녕히 여기에 여기서 저기에 다음은 다음에 다시는 처음에 마지막 마지막에 지금은 지금도 지난주 지난달 지난해 임시로 임의로 신청서 신청은 장소는 장소를 장소가 송금은 송금을 송장은 구매는 구매를 구독은 구독을 유료는 유료로 무료로 무료는 남은건 남은것 마음은 마음을 마음이 기기에 기기는 기기의 기록은 기록을 기록이 국가는 국가별 제품은 제품을 제품이 제목은 제목을 제목이 제일로 소개는 소개를 소식은 소식을 도움을 도움이 도착은 도착을 인증은 인증을 인증이 채팅은 채팅을 채팅이 지역은 지역을 지역이 연락은 연락을 연락이 연락처 여러분 여기까 하나는 하나를 하나만 하루는 하루를 하루에 하나의 한번에 한번만 한번은 한가지 한개는 한개의 어제는 어제도 어디에 어디서 어디로 어떻게 어떤것 오늘도 오늘부 오전에 오후에 오래된 오히려 우리는 우리의 우리가 우선은 우편번 서비스 서류는 서류를 서명은 서명을 신규는 신규로 신속히 안내는 안내를 안내문 안전한 안전하 양식은 양식을 양쪽에 원래는 원하는 원인은 위치는 위치를 위치가 은행은 은행을 은행에 임원은 전체는 전체를 전달해 전송은 전송을 정확히 정말로 제안은 제안을 조회는 조회를 주문은 주문을 주문이 주말에 주변에 주의는 지원은 지원을 진행은 진행을 진짜로 차량은 차량을 채용은 채용을 천천히 최근에 최고의 최대한 최소한 추가로 추가는 추가를 표시는 표시를 하단에 상단에 함께한 허용은 허용을 현재는 현재의 홍보는 홍보를 확인은 확인을 회사는 회사를 회사의 회의는 회의를 회의가 회원은 회원을 회원이 황금빛 백업은 백업을 백업이 배송은 배송을 배송이 배터리 문제는 문제를 문제가 문의는 문의를 문의가 모두가 모두를 모바일 명단은 명단을 명령어 마감은 마감을 라인은 라인을 나중에 나머지 노트북 남자는 여자는 손님은 손님을 손님이 심사는 심사를 신고는 신고를 신청을 양해를 연구는 연구를 연락드 염려는 위험은 위험을 유의해 육아는 인터넷 인원은 인원을 인쇄해 장비는 장비를 장점은 장점을 재고는 재고를 전부다 정기적 조직은 조직을 주제는 주제를 진단은 진단을 채널은 채널을 최종은 최종적 추천은 추천을 표준은 표준을 하반기 상반기 한달에 한달간 한주간 함수는 함수를 현장은 현장을 홈페이 회계는 회계를 후기는 후기를 등록은 등록을 데이터 계정은 계정을 계정이 광고는 광고를 광고가 구조는 구조를 기간은 기간을 기능은 기능을 기능이 기준은 기준을 기타는 김포시 김해시 이천시 광주시 양주시 오산시 하남시 구리시 남양주 안양시 안산시 용인시 성남시 수원시 고양시 전주시 여수시 서산시 서귀포 원주시 강릉시 강남역 강동구 강북구 강서구 서초구 송파구 노원구 도봉구 마포구 용산구 성동구 성북구 은평구 양천구 구로구 금천구 동작구 관악구 중랑구 광진구 동대문 서대문 영등포 종로구 중구는 남구는 북구는 동구는".split(/\s+/),
);
const KO_HONORIFIC = "(?:님|씨|과장님|부장님|대리님|사원님|팀장님|선생님|교수님|박사님|대표님|이사님|사장님|과장|부장|대리|팀장|선생|교수|박사|대표|이사|사장|씨는|씨가|씨를|씨의|씨에게|님이|님은|님을|님의|님께|님에게)";
const KO_PARTICLE = "(?:은|는|이|가|을|를|의|와|과|도|에게|께서|한테|이랑|랑|에서|으로|로)?";
// 김민수, 김민수님, 김민수는, 김철수 씨, 이 씨 (only with honorific)
const KO_NAME_RE = new RegExp(`(?<![가-힣])([${KO_SURNAMES}][가-힣]{1,2})(?:\\s?${KO_HONORIFIC}${KO_PARTICLE}(?![가-힣])|${KO_PARTICLE}(?![가-힣]))`, "g");
const KO_SHORT_RE = new RegExp(`(?<![가-힣])([${KO_SURNAMES}])\\s?${KO_HONORIFIC}${KO_PARTICLE}(?![가-힣])`, "g");

const JA_SURNAMES =
  "佐藤|鈴木|高橋|田中|伊藤|渡辺|山本|中村|小林|加藤|吉田|山田|佐々木|山口|松本|井上|木村|林|斎藤|清水|山崎|森|池田|橋本|阿部|石川|山下|中島|石井|小川|前田|岡田|長谷川|藤田|後藤|近藤|村上|遠藤|青木|坂本|斉藤|福田|太田|西村|藤井|岡本|藤原|三浦|金子|中野|中川|原田|松田|竹内|小野|田村|中山|和田|石田|上田|森田|原|柴田|酒井|工藤|横山|宮崎|宮本|内田|高木|安藤|谷口|大野|丸山|今井|高田|藤本|武田|村田|上野|杉山|増田|小島|平野|大塚|千葉|久保|松井|岩崎|桜井|野口|松尾|野村|木下|菊地|佐野|大西|杉本|新井|浜田|菅原|市川|水野|小松|島田|古川|小山|高野|西田|菊池|山内|西川|五十嵐|北村|安田|中田|川口|平田|関|中西|服部|川崎|飯田|久保田|東|辻|秋山|田口|永井|荒木|松岡|川上|内藤|山根|松下|星野|望月|岩田|大久保|松浦|土屋|吉川|大石|松原|渡部|岡崎|河野|篠原|森本|岡|岩本|平井|樋口|大森|片山|本田|吉村|松村|小田|高山|白石|山中|荒井|栗原|大橋|石橋|川村|坂口|河合|堀|土井|杉浦|川島|堀内|吉野|野田|川田|奥村|小池|矢野|安部|馬場";
const JA_HONORIFIC = "(?:さん|様|さま|氏|君|くん|ちゃん|先生|部長|課長|社長|係長|主任|殿)";
const JA_NAME_RE = new RegExp(`(?:${JA_SURNAMES})(?:[ 　]?[一-龥ぁ-ん]{1,3})?(?=${JA_HONORIFIC})`, "g");
const JA_KANA_NAME_RE = new RegExp(`[ァ-ヶー]{2,8}(?:[・･][ァ-ヶー]{2,8})?(?=${JA_HONORIFIC})`, "g");
const JA_CONTEXT_RE = new RegExp(`(?:私は|僕は|名前は|氏名[:：]?|担当[:：]?|担当者[:：]?)[ 　]?((?:${JA_SURNAMES})[ 　]?[一-龥ぁ-ん]{1,3})(?=[ 　、。！？で,.!?]|です|と|が|の|$)`, "g");

const ZH_SURNAMES =
  "欧阳|司马|诸葛|上官|王|李|张|刘|陈|杨|黄|赵|吴|周|徐|孙|马|朱|胡|郭|何|林|高|罗|郑|梁|谢|宋|唐|许|邓|冯|韩|曹|曾|彭|萧|蔡|潘|田|董|袁|于|余|叶|蒋|杜|苏|魏|程|吕|丁|沈|任|姚|卢|傅|钟|姜|崔|谭|廖|范|汪|陆|金|石|戴|贾|韦|夏|邱|方|侯|邹|熊|孟|秦|白|江|阎|薛|尹|段|雷|黎|史|龙|陶|贺|顾|毛|郝|龚|邵|万|钱|严|赖|覃|洪|武|莫|孔";
const ZH_HONORIFIC = "(?:先生|女士|小姐|老师|经理|总监|同学|医生|律师|主任|老板|同志|教授)";
const ZH_NAME_RE = new RegExp(`(?:${ZH_SURNAMES})[一-龥]{1,2}(?=${ZH_HONORIFIC})`, "g");
const ZH_SHORT_RE = new RegExp(`(?:小|老)(?:${ZH_SURNAMES})(?![一-龥])`, "g");
const ZH_CONTEXT_RE = new RegExp(`(?:我叫|我是|叫做|名字是|姓名[:：]?|联系人[:：]?|收件人[:：]?|客户[:：]?|同事|朋友|经理|老师)((?:${ZH_SURNAMES})[一-龥]{1,2})(?=[，。！？、,.!?:：;； ]|的|和|与|说|是|在|$)`, "g");

const matchName: Matcher = (text, push) => {
  const norm = (s: string) => normalizeSpace(s).toLowerCase();

  scan(text, EN_TITLE_NAME_RE, "NAME", push, {
    group: 1,
    normalize: norm,
    accept: (m) => enNameOk(m[1].split(/\s+/)),
  });
  matchEnRuns(text, push, norm);

  scan(text, KO_NAME_RE, "NAME", push, { group: 1, normalize: norm, accept: (m) => !KO_STOP.has(m[1]) && !(m[1].length === 2 && !/(님|씨)/.test(m[0])) });
  scan(text, KO_SHORT_RE, "NAME", push, { group: 1, normalize: norm });

  scan(text, JA_NAME_RE, "NAME", push, { normalize: norm });
  scan(text, JA_KANA_NAME_RE, "NAME", push, { normalize: norm });
  scan(text, JA_CONTEXT_RE, "NAME", push, { group: 1, normalize: norm });

  scan(text, ZH_NAME_RE, "NAME", push, { normalize: norm });
  scan(text, ZH_SHORT_RE, "NAME", push, { normalize: norm });
  scan(text, ZH_CONTEXT_RE, "NAME", push, { group: 1, normalize: norm });
};

// ---------------------------------------------------------------------------
// Custom words: case-insensitive, whole word, unicode letters.

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanWords(words: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    const v = normalizeSpace(String(w ?? ""));
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function matchWords(words: string[]): Matcher {
  const clean = cleanWords(words).sort((a, b) => b.length - a.length);
  if (!clean.length) return () => {};
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${clean.map((w) => escapeRe(w).replace(/\s+/g, "\\s+")).join("|")})(?![\\p{L}\\p{N}_])`, "giu");
  return (text, push) => scan(text, re, "WORD", push, { normalize: (s) => normalizeSpace(s).toLowerCase() });
}

// ---------------------------------------------------------------------------
// Overlap resolution: custom words first, then longest, then rank, then earliest.

function resolve(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => {
    const aw = a.type === "WORD" ? 0 : 1;
    const bw = b.type === "WORD" ? 0 : 1;
    if (aw !== bw) return aw - bw;
    const la = a.end - a.start;
    const lb = b.end - b.start;
    if (la !== lb) return lb - la;
    if (RANK[a.type] !== RANK[b.type]) return RANK[a.type] - RANK[b.type];
    return a.start - b.start;
  });
  const taken: Span[] = [];
  for (const s of sorted) {
    if (taken.some((t) => s.start < t.end && t.start < s.end)) continue;
    taken.push(s);
  }
  return taken.sort((a, b) => a.start - b.start);
}

/** Every non-overlapping span, in text order. Heuristic names still need a human review. */
export function detect(text: string, customWords: readonly string[] = []): Span[] {
  const spans: Span[] = [];
  const push = (s: Span) => {
    if (s.end > s.start) spans.push(s);
  };
  matchWords([...customWords])(text, push);
  matchKey(text, push);
  matchCard(text, push);
  matchEmail(text, push);
  matchIp(text, push);
  matchPhone(text, push);
  matchAddress(text, push);
  matchName(text, push);
  return resolve(spans);
}

export function entityKey(type: EntityType, normalized: string): string {
  return `${type}:${normalized}`;
}

/**
 * Full pass: detect, number every entity by first appearance (stable while
 * the user toggles rows), and rebuild the text. Disabled keys keep their
 * original text but keep their token number so nothing shifts.
 */
export function scrub(text: string, options: ScrubOptions = {}): ScrubResult {
  const spans = detect(text, options.customWords ?? []);
  const disabled = new Set(options.disabled ?? []);
  const counters: Partial<Record<EntityType, number>> = {};
  const entities = new Map<string, Entity>();

  for (const s of spans) {
    const key = entityKey(s.type, s.normalized);
    let e = entities.get(key);
    if (!e) {
      const n = (counters[s.type] ?? 0) + 1;
      counters[s.type] = n;
      e = { key, type: s.type, original: s.original, normalized: s.normalized, token: `[${s.type}_${n}]`, count: 0 };
      entities.set(key, e);
    }
    e.count++;
  }

  const segments: Segment[] = [];
  const originalSegments: Segment[] = [];
  const map: Record<string, string> = {};
  let cursor = 0;
  let out = "";
  for (const s of spans) {
    const e = entities.get(entityKey(s.type, s.normalized))!;
    if (disabled.has(e.key)) continue;
    if (s.start > cursor) {
      const plain = text.slice(cursor, s.start);
      segments.push({ text: plain });
      originalSegments.push({ text: plain });
      out += plain;
    }
    segments.push({ text: e.token, type: e.type, token: e.token });
    originalSegments.push({ text: s.original, type: e.type, token: e.token });
    out += e.token;
    map[e.token] = e.original;
    cursor = s.end;
  }
  if (cursor < text.length) {
    const tail = text.slice(cursor);
    segments.push({ text: tail });
    originalSegments.push({ text: tail });
    out += tail;
  }

  return { entities: [...entities.values()], segments, originalSegments, scrubbed: out, map };
}

// ---------------------------------------------------------------------------
// JSON shapes for the restore map and the custom dictionary.

export const APP_ID = "scrubpad";

export interface RestoreMapFile {
  app: typeof APP_ID;
  version: 1;
  exportedAt: string;
  map: Record<string, string>;
}

export interface DictionaryFile {
  app: typeof APP_ID;
  version: 1;
  words: string[];
}

export function buildRestoreMap(map: Record<string, string>, now = new Date()): RestoreMapFile {
  return { app: APP_ID, version: 1, exportedAt: now.toISOString(), map: { ...map } };
}

/** Put the originals back using a restore map. Longer tokens first so [NAME_10] is not eaten by [NAME_1]. */
export function restore(scrubbed: string, map: Record<string, string>): string {
  const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
  if (!tokens.length) return scrubbed;
  const re = new RegExp(tokens.map(escapeRe).join("|"), "g");
  return scrubbed.replace(re, (t) => map[t] ?? t);
}

export function parseRestoreMap(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const src = (o.map && typeof o.map === "object" ? o.map : o) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(src)) {
    if (/^\[[A-Z]+_\d+\]$/.test(k) && typeof v === "string") out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export function buildDictionary(words: readonly string[]): DictionaryFile {
  return { app: APP_ID, version: 1, words: cleanWords(words) };
}

/** Accepts {app, version, words} or {words} or a bare string array. */
export function parseDictionary(raw: unknown): string[] | null {
  let words: unknown;
  if (Array.isArray(raw)) words = raw;
  else if (raw && typeof raw === "object") words = (raw as Record<string, unknown>).words;
  if (!Array.isArray(words)) return null;
  if (!words.every((w) => typeof w === "string")) return null;
  return cleanWords(words as string[]);
}

export function toJSON(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function stampedName(base: string, ext: string, now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${base}-${y}${m}${d}.${ext}`;
}
