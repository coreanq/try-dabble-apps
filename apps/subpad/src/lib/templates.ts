/**
 * Built-in categories and service templates. Everything here is baked into
 * the bundle: names in four languages, a suggested cycle, and a brand tile
 * (initials on a colour). No logo is ever fetched from the internet.
 */
import type { Cycle } from "./money.ts";

export type Lang = "ko" | "en" | "ja" | "zh";
export type Names = Record<Lang, string>;

export interface BuiltinCategory {
  id: string;
  names: Names;
  color: string;
}

export const CATEGORIES: BuiltinCategory[] = [
  { id: "streaming", color: "#c2410c", names: { ko: "영상 스트리밍", en: "Streaming", ja: "動画配信", zh: "视频流媒体" } },
  { id: "music", color: "#7c3aed", names: { ko: "음악", en: "Music", ja: "音楽", zh: "音乐" } },
  { id: "cloud", color: "#0369a1", names: { ko: "클라우드·저장공간", en: "Cloud & storage", ja: "クラウド・ストレージ", zh: "云与存储" } },
  { id: "productivity", color: "#2f6f5e", names: { ko: "생산성", en: "Productivity", ja: "生産性", zh: "效率工具" } },
  { id: "ai", color: "#4f46e5", names: { ko: "AI", en: "AI", ja: "AI", zh: "AI" } },
  { id: "gaming", color: "#be123c", names: { ko: "게임", en: "Gaming", ja: "ゲーム", zh: "游戏" } },
  { id: "finance", color: "#b45309", names: { ko: "금융", en: "Finance", ja: "金融", zh: "金融" } },
  { id: "education", color: "#0f766e", names: { ko: "교육", en: "Education", ja: "教育", zh: "教育" } },
  { id: "domains", color: "#1d4ed8", names: { ko: "도메인·호스팅", en: "Domains & hosting", ja: "ドメイン・ホスティング", zh: "域名与主机" } },
  { id: "network", color: "#334155", names: { ko: "통신·VPN", en: "Network & VPN", ja: "通信・VPN", zh: "网络与 VPN" } },
  { id: "shopping", color: "#d97706", names: { ko: "쇼핑·멤버십", en: "Shopping", ja: "ショッピング", zh: "购物会员" } },
  { id: "social", color: "#db2777", names: { ko: "소셜", en: "Social", ja: "ソーシャル", zh: "社交" } },
  { id: "travel", color: "#0891b2", names: { ko: "여행·이동", en: "Travel", ja: "旅行・移動", zh: "旅行出行" } },
  { id: "fitness", color: "#16a34a", names: { ko: "건강·운동", en: "Health & fitness", ja: "健康・運動", zh: "健康运动" } },
  { id: "news", color: "#525252", names: { ko: "뉴스·잡지", en: "News & magazines", ja: "ニュース・雑誌", zh: "新闻杂志" } },
  { id: "utilities", color: "#65a30d", names: { ko: "공과금·생활", en: "Utilities & home", ja: "公共料金・生活", zh: "水电与生活" } },
  { id: "other", color: "#64748b", names: { ko: "기타", en: "Other", ja: "その他", zh: "其他" } },
];

export const CATEGORY_MAP: Record<string, BuiltinCategory> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function categoryColor(id: string | undefined): string {
  return (id && CATEGORY_MAP[id]?.color) || CATEGORY_MAP.other.color;
}

export interface Template {
  id: string;
  names: Names;
  /** Extra search words (brand spellings, aliases). */
  aliases?: string[];
  categoryId: string;
  cycle: Cycle;
  /** Brand tile: short label + colour. Never a remote URL. */
  tile: { label: string; color: string };
  website?: string;
}

const t = (
  id: string,
  categoryId: string,
  cycle: Cycle,
  label: string,
  color: string,
  names: Names,
  website?: string,
  aliases?: string[],
): Template => ({ id, categoryId, cycle, tile: { label, color }, names, website, aliases });

export const TEMPLATES: Template[] = [
  t("netflix", "streaming", "monthly", "N", "#e50914", { ko: "넷플릭스", en: "Netflix", ja: "Netflix", zh: "Netflix" }, "https://www.netflix.com", ["netflix"]),
  t("disney-plus", "streaming", "monthly", "D+", "#0f3d8c", { ko: "디즈니+", en: "Disney+", ja: "Disney+", zh: "Disney+" }, "https://www.disneyplus.com", ["disney"]),
  t("youtube-premium", "streaming", "monthly", "YT", "#ff0000", { ko: "유튜브 프리미엄", en: "YouTube Premium", ja: "YouTube Premium", zh: "YouTube Premium" }, "https://www.youtube.com/premium", ["youtube"]),
  t("amazon-prime", "shopping", "monthly", "a", "#ff9900", { ko: "아마존 프라임", en: "Amazon Prime", ja: "Amazonプライム", zh: "Amazon Prime" }, "https://www.amazon.com/prime", ["amazon", "prime video"]),
  t("apple-tv", "streaming", "monthly", "TV", "#1c1c1e", { ko: "Apple TV+", en: "Apple TV+", ja: "Apple TV+", zh: "Apple TV+" }, "https://tv.apple.com", ["apple"]),
  t("coupang-play", "streaming", "monthly", "C", "#e11d48", { ko: "쿠팡 와우·플레이", en: "Coupang Wow / Play", ja: "Coupang Play", zh: "Coupang Play" }, "https://www.coupangplay.com", ["coupang", "쿠팡"]),
  t("tving", "streaming", "monthly", "T", "#ff153c", { ko: "티빙", en: "TVING", ja: "TVING", zh: "TVING" }, "https://www.tving.com", ["tving", "티빙"]),
  t("wavve", "streaming", "monthly", "W", "#1351f9", { ko: "웨이브", en: "Wavve", ja: "Wavve", zh: "Wavve" }, "https://www.wavve.com", ["wavve", "웨이브"]),
  t("u-next", "streaming", "monthly", "U", "#0d0d0d", { ko: "U-NEXT", en: "U-NEXT", ja: "U-NEXT", zh: "U-NEXT" }, "https://video.unext.jp", ["unext"]),
  t("iqiyi", "streaming", "monthly", "iQ", "#00be06", { ko: "iQIYI", en: "iQIYI", ja: "iQIYI", zh: "爱奇艺" }, "https://www.iq.com", ["iqiyi", "爱奇艺"]),
  t("spotify", "music", "monthly", "S", "#1db954", { ko: "스포티파이", en: "Spotify", ja: "Spotify", zh: "Spotify" }, "https://www.spotify.com", ["spotify"]),
  t("apple-music", "music", "monthly", "♪", "#fa243c", { ko: "애플 뮤직", en: "Apple Music", ja: "Apple Music", zh: "Apple Music" }, "https://music.apple.com", ["apple", "music"]),
  t("youtube-music", "music", "monthly", "YM", "#ff0000", { ko: "유튜브 뮤직", en: "YouTube Music", ja: "YouTube Music", zh: "YouTube Music" }, "https://music.youtube.com", ["youtube"]),
  t("melon", "music", "monthly", "M", "#00cd3c", { ko: "멜론", en: "Melon", ja: "Melon", zh: "Melon" }, "https://www.melon.com", ["melon", "멜론"]),
  t("icloud", "cloud", "monthly", "iC", "#3b82f6", { ko: "iCloud+", en: "iCloud+", ja: "iCloud+", zh: "iCloud+" }, "https://www.icloud.com", ["apple", "icloud"]),
  t("google-one", "cloud", "monthly", "G1", "#4285f4", { ko: "Google One", en: "Google One", ja: "Google One", zh: "Google One" }, "https://one.google.com", ["google", "drive"]),
  t("dropbox", "cloud", "yearly", "Db", "#0061ff", { ko: "드롭박스", en: "Dropbox", ja: "Dropbox", zh: "Dropbox" }, "https://www.dropbox.com", ["dropbox"]),
  t("naver-mybox", "cloud", "monthly", "NB", "#03c75a", { ko: "네이버 MYBOX", en: "Naver MYBOX", ja: "Naver MYBOX", zh: "Naver MYBOX" }, "https://mybox.naver.com", ["naver", "네이버"]),
  t("microsoft-365", "productivity", "yearly", "M365", "#d83b01", { ko: "Microsoft 365", en: "Microsoft 365", ja: "Microsoft 365", zh: "Microsoft 365" }, "https://www.microsoft.com/microsoft-365", ["office", "microsoft"]),
  t("adobe-cc", "productivity", "monthly", "Ai", "#ff0000", { ko: "Adobe Creative Cloud", en: "Adobe Creative Cloud", ja: "Adobe Creative Cloud", zh: "Adobe Creative Cloud" }, "https://www.adobe.com/creativecloud", ["adobe", "photoshop"]),
  t("notion", "productivity", "monthly", "N", "#1e293b", { ko: "노션", en: "Notion", ja: "Notion", zh: "Notion" }, "https://www.notion.so", ["notion"]),
  t("figma", "productivity", "monthly", "F", "#a259ff", { ko: "피그마", en: "Figma", ja: "Figma", zh: "Figma" }, "https://www.figma.com", ["figma"]),
  t("canva", "productivity", "yearly", "Cv", "#00c4cc", { ko: "캔바", en: "Canva", ja: "Canva", zh: "Canva" }, "https://www.canva.com", ["canva"]),
  t("slack", "productivity", "monthly", "Sl", "#4a154b", { ko: "슬랙", en: "Slack", ja: "Slack", zh: "Slack" }, "https://slack.com", ["slack"]),
  t("zoom", "productivity", "monthly", "Z", "#0b5cff", { ko: "줌", en: "Zoom", ja: "Zoom", zh: "Zoom" }, "https://zoom.us", ["zoom"]),
  t("chatgpt-plus", "ai", "monthly", "GPT", "#10a37f", { ko: "ChatGPT Plus", en: "ChatGPT Plus", ja: "ChatGPT Plus", zh: "ChatGPT Plus" }, "https://chatgpt.com", ["openai", "chatgpt"]),
  t("claude-pro", "ai", "monthly", "Cl", "#d97757", { ko: "Claude Pro", en: "Claude Pro", ja: "Claude Pro", zh: "Claude Pro" }, "https://claude.ai", ["anthropic", "claude"]),
  t("gemini-advanced", "ai", "monthly", "Ge", "#1a73e8", { ko: "Gemini", en: "Google AI Pro (Gemini)", ja: "Gemini", zh: "Gemini" }, "https://gemini.google.com", ["google", "gemini"]),
  t("github-copilot", "ai", "monthly", "Co", "#24292f", { ko: "GitHub Copilot", en: "GitHub Copilot", ja: "GitHub Copilot", zh: "GitHub Copilot" }, "https://github.com/features/copilot", ["github", "copilot"]),
  t("cursor", "ai", "monthly", "Cu", "#111111", { ko: "Cursor", en: "Cursor", ja: "Cursor", zh: "Cursor" }, "https://cursor.com", ["cursor"]),
  t("steam", "gaming", "monthly", "St", "#171a21", { ko: "스팀", en: "Steam", ja: "Steam", zh: "Steam" }, "https://store.steampowered.com", ["steam"]),
  t("nintendo-online", "gaming", "yearly", "NSO", "#e60012", { ko: "닌텐도 스위치 온라인", en: "Nintendo Switch Online", ja: "Nintendo Switch Online", zh: "Nintendo Switch Online" }, "https://www.nintendo.com", ["nintendo", "switch"]),
  t("playstation-plus", "gaming", "yearly", "PS+", "#0070d1", { ko: "PlayStation Plus", en: "PlayStation Plus", ja: "PlayStation Plus", zh: "PlayStation Plus" }, "https://www.playstation.com", ["playstation", "sony"]),
  t("xbox-game-pass", "gaming", "monthly", "XB", "#107c10", { ko: "Xbox Game Pass", en: "Xbox Game Pass", ja: "Xbox Game Pass", zh: "Xbox Game Pass" }, "https://www.xbox.com/game-pass", ["xbox", "game pass"]),
  t("nordvpn", "network", "yearly", "VPN", "#4687ff", { ko: "NordVPN", en: "NordVPN", ja: "NordVPN", zh: "NordVPN" }, "https://nordvpn.com", ["vpn", "nord"]),
  t("vpn", "network", "monthly", "VPN", "#334155", { ko: "VPN", en: "VPN", ja: "VPN", zh: "VPN" }, undefined, ["vpn"]),
  t("mobile-plan", "network", "monthly", "📱", "#334155", { ko: "휴대폰 요금제", en: "Mobile plan", ja: "携帯料金", zh: "手机套餐" }, undefined, ["phone", "sim", "carrier", "통신"]),
  t("broadband", "network", "monthly", "🌐", "#334155", { ko: "인터넷 회선", en: "Home broadband", ja: "自宅インターネット", zh: "家庭宽带" }, undefined, ["internet", "wifi", "fiber"]),
  t("domain", "domains", "yearly", ".com", "#1d4ed8", { ko: "도메인 갱신", en: "Domain renewal", ja: "ドメイン更新", zh: "域名续费" }, undefined, ["domain", "dns", "namecheap", "cloudflare"]),
  t("web-hosting", "domains", "monthly", "Ho", "#1d4ed8", { ko: "웹 호스팅", en: "Web hosting", ja: "ウェブホスティング", zh: "网站托管" }, undefined, ["hosting", "server"]),
  t("aws", "cloud", "monthly", "AWS", "#ff9900", { ko: "AWS", en: "AWS", ja: "AWS", zh: "AWS" }, "https://aws.amazon.com", ["amazon", "aws"]),
  t("vercel", "cloud", "monthly", "▲", "#000000", { ko: "Vercel", en: "Vercel", ja: "Vercel", zh: "Vercel" }, "https://vercel.com", ["vercel"]),
  t("gym", "fitness", "monthly", "🏋", "#16a34a", { ko: "헬스장", en: "Gym membership", ja: "ジム", zh: "健身房" }, undefined, ["gym", "fitness", "헬스"]),
  t("strava", "fitness", "yearly", "Sv", "#fc4c02", { ko: "Strava", en: "Strava", ja: "Strava", zh: "Strava" }, "https://www.strava.com", ["strava", "running"]),
  t("duolingo", "education", "yearly", "Du", "#58cc02", { ko: "듀오링고", en: "Duolingo", ja: "Duolingo", zh: "Duolingo" }, "https://www.duolingo.com", ["duolingo", "language"]),
  t("coursera", "education", "monthly", "Co", "#0056d2", { ko: "코세라", en: "Coursera", ja: "Coursera", zh: "Coursera" }, "https://www.coursera.org", ["coursera", "course"]),
  t("newspaper", "news", "monthly", "📰", "#525252", { ko: "신문·잡지 구독", en: "Newspaper / magazine", ja: "新聞・雑誌", zh: "报纸杂志" }, undefined, ["news", "times", "magazine"]),
  t("kindle-unlimited", "news", "monthly", "K", "#ff9900", { ko: "Kindle Unlimited", en: "Kindle Unlimited", ja: "Kindle Unlimited", zh: "Kindle Unlimited" }, "https://www.amazon.com/kindle-dbs/hz/subscribe/ku", ["kindle", "amazon", "books"]),
  t("millie", "news", "monthly", "밀", "#ffd400", { ko: "밀리의 서재", en: "Millie's Library", ja: "Millie", zh: "Millie" }, "https://www.millie.co.kr", ["millie", "밀리", "ebook"]),
  t("insurance", "finance", "monthly", "🛡", "#b45309", { ko: "보험료", en: "Insurance", ja: "保険料", zh: "保险费" }, undefined, ["insurance", "보험"]),
  t("credit-card-fee", "finance", "yearly", "💳", "#b45309", { ko: "카드 연회비", en: "Card annual fee", ja: "カード年会費", zh: "信用卡年费" }, undefined, ["card", "annual fee"]),
  t("rent", "utilities", "monthly", "🏠", "#65a30d", { ko: "월세·관리비", en: "Rent / HOA", ja: "家賃・管理費", zh: "房租物业" }, undefined, ["rent", "housing"]),
  t("electricity", "utilities", "monthly", "⚡", "#65a30d", { ko: "전기·가스·수도", en: "Electricity / gas / water", ja: "電気・ガス・水道", zh: "水电燃气" }, undefined, ["utility", "power", "gas", "water"]),
  t("linkedin-premium", "social", "monthly", "in", "#0a66c2", { ko: "LinkedIn Premium", en: "LinkedIn Premium", ja: "LinkedIn Premium", zh: "LinkedIn Premium" }, "https://www.linkedin.com", ["linkedin"]),
  t("x-premium", "social", "monthly", "X", "#000000", { ko: "X Premium", en: "X Premium", ja: "X Premium", zh: "X Premium" }, "https://x.com", ["twitter", "x"]),
  t("costco", "shopping", "yearly", "Co", "#e31837", { ko: "코스트코 멤버십", en: "Costco membership", ja: "コストコ会員", zh: "Costco 会员" }, "https://www.costco.com", ["costco", "membership"]),
  t("uber-one", "travel", "monthly", "Ub", "#000000", { ko: "Uber One", en: "Uber One", ja: "Uber One", zh: "Uber One" }, "https://www.uber.com", ["uber", "ride"]),
  t("transit-pass", "travel", "monthly", "🚇", "#0891b2", { ko: "교통 정기권", en: "Transit pass", ja: "定期券", zh: "交通月票" }, undefined, ["transit", "commute", "subway", "bus"]),
];

/** Shown as quick-add chips when the list is empty. */
export const STARTER_TEMPLATE_IDS = ["netflix", "spotify", "youtube-premium", "icloud", "adobe-cc", "chatgpt-plus", "domain", "mobile-plan"];

export const TEMPLATE_MAP: Record<string, Template> = Object.fromEntries(TEMPLATES.map((x) => [x.id, x]));

function norm(s: string): string {
  return s.toLowerCase().normalize("NFKC").replace(/\s+/g, "");
}

export function searchTemplates(query: string, lang: Lang, categoryId?: string): Template[] {
  const q = norm(query.trim());
  return TEMPLATES.filter((tpl) => {
    if (categoryId && tpl.categoryId !== categoryId) return false;
    if (!q) return true;
    const hay = [tpl.id, ...Object.values(tpl.names), ...(tpl.aliases ?? []), CATEGORY_MAP[tpl.categoryId]?.names[lang] ?? ""].map(norm);
    return hay.some((h) => h.includes(q));
  });
}

export function templateName(tpl: Template, lang: Lang): string {
  return tpl.names[lang] || tpl.names.en;
}

/** Initials for a free-typed name: "YouTube Premium" → "YP", "넷플릭스" → "넷". */
export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = [...words[0]][0] ?? "?";
  if (first.codePointAt(0)! > 0x2e80) return first;
  const second = words.length > 1 ? [...words[1]][0] ?? "" : "";
  return (first + second).toUpperCase();
}

/** Deterministic colour for a name without a template: same name, same tile. */
export function colorFor(name: string, categoryId?: string): string {
  if (categoryId && CATEGORY_MAP[categoryId]) return CATEGORY_MAP[categoryId].color;
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  const palette = ["#2f6f5e", "#c2410c", "#7c3aed", "#0369a1", "#be123c", "#b45309", "#0f766e", "#1d4ed8", "#db2777", "#0891b2"];
  return palette[h % palette.length];
}
