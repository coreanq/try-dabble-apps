/**
 * Runs ahead of the assets binding on every request (run_worker_first) so the
 * FIRST HTML already carries the requested language. Crawlers do not run JS:
 * ?lang=en must not hand them the Korean default.
 *
 * Order: ?lang= wins, then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language. src/lib/i18n.ts resolves the
 * mounted app the same way, so the served HTML and React never disagree.
 *
 * Also hosts the two tiny APIs the vault needs and a browser cannot do alone:
 *   POST /api/extract  { url }  → schema.org/Recipe from a public page
 *   GET  /api/image?url=        → same-origin proxy for that recipe's photo
 * Neither stores anything. Instagram / TikTok are refused up front.
 *
 * Ad-free on purpose: nothing here injects AdSense. /ads.txt and /app-ads.txt
 * are still served so the publisher id is consistent across the property.
 */
import { NAVER_META_HTML } from '../../../packages/seo/naver';
import { checkExtractUrl, extractRecipe } from "./lib/extract-parse.ts";

type Lang = 'ko' | 'en' | 'ja' | 'zh';

export const COPY: Record<
  Lang,
  {
    title: string;
    description: string;
    locale: string;
    image: string;
    localOnly: string;
    tagline: string;
  }
> = {
  ko: {
    title: '레시피로그',
    description:
      '틱톡·인스타·블로그·메일에 흩어진 레시피를 한곳에. 제목, 사진, 조리 시간, 태그, 메모, 재료, 순서를 이 기기에만 저장합니다. URL 붙여넣기로 재료·순서 가져오기, 인분 조절, JSON 백업. 계정 없음, 광고 없음, 무료.',
    locale: 'ko_KR',
    image: 'https://recipelog.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    tagline: '무료 로컬 레시피 보관함. 제목·사진·시간·태그와 메모를 한곳에. 계정 없음.',
  },
  en: {
    title: 'Recipelog',
    description:
      'Recipes scattered across TikTok, Instagram, blogs and email, gathered in one place. Title, photo, cook time, tags, notes, ingredients and steps stay on this device only. Paste a URL to pull ingredients and steps, scale servings, back up to JSON. No account, no ads, free.',
    locale: 'en_US',
    image: 'https://recipelog.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    tagline: 'Free local recipe vault. Title, photo, time, tags and notes in one place. No account.',
  },
  ja: {
    title: 'レシピログ',
    description:
      'TikTok・Instagram・ブログ・メールに散らばったレシピをひとつに。タイトル、写真、調理時間、タグ、メモ、材料、手順をこの端末だけに保存。URLを貼って材料と手順を取り込み、人数を調整、JSONでバックアップ。アカウント不要、広告なし、無料。',
    locale: 'ja_JP',
    image: 'https://recipelog.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    tagline: '無料のローカルレシピ保管庫。タイトル・写真・時間・タグとメモをひとつに。アカウント不要。',
  },
  zh: {
    title: '食谱日志',
    description:
      '把散落在 TikTok、Instagram、博客和邮件里的食谱收进一处。标题、照片、烹饪时间、标签、笔记、食材和步骤只保存在此设备。粘贴网址可提取食材和步骤，可调整份数，可导出 JSON 备份。无需账号，无广告，免费。',
    locale: 'zh_CN',
    image: 'https://recipelog.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    tagline: '免费本地食谱库。标题、照片、时间、标签和笔记集中一处。无需账号。',
  },
};

const SLUG = 'recipelog';
const ORIGIN = 'https://recipelog.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 2_500_000;
const MAX_IMAGE_BYTES = 8_000_000;
const UA = 'RecipelogBot/1.0 (+https://recipelog.try-dabble.com)';
/** Never scraped, by design: the UI tells people to paste the caption instead. */
const SOCIAL_HOSTS = /(^|\.)(instagram\.com|tiktok\.com|facebook\.com|fb\.com|threads\.net|x\.com|twitter\.com|youtube\.com|youtu\.be)$/i;

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

export function pickLang(request: Request, url: URL): Lang | null {
  const q = url.searchParams.get('lang');
  if (q && LANGS.has(q)) return q as Lang;
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/);
  if (m && LANGS.has(m[1])) return m[1] as Lang;
  return null;
}

/**
 * The shipped manifest is Korean. Installed as a PWA from ?lang=en it must
 * say "Recipelog", so the Worker rewrites name / lang / start_url per request.
 * Unknown language falls back to English, not Korean.
 */
export function localizeManifest(manifest: Record<string, unknown>, lang: Lang): Record<string, unknown> {
  const copy = COPY[lang];
  return {
    ...manifest,
    name: copy.title,
    short_name: copy.title,
    description: copy.tagline,
    lang,
    start_url: `/?lang=${lang}`,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function readCapped(res: Response, cap: number): Promise<ArrayBuffer | null> {
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > cap) return null;
  const reader = res.body?.getReader();
  if (!reader) return new ArrayBuffer(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > cap) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out.buffer;
}

async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: accept,
        'Accept-Language': 'en,ko;q=0.9,ja;q=0.8,zh;q=0.7',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** POST { url } → { ok:true, recipe } | { ok:false, reason, detail? } */
async function handleExtract(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad-url', detail: 'body must be JSON { url }' }, 400);
  }
  const target = body && typeof body === 'object' ? (body as { url?: unknown }).url : undefined;
  const check = checkExtractUrl(target);
  if (!check.ok) return json({ ok: false, reason: 'bad-url' }, 400);
  if (SOCIAL_HOSTS.test(check.url.hostname)) {
    return json({ ok: false, reason: 'blocked', detail: 'social video/photo apps are not imported; paste the caption instead' });
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(check.url.href, 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5');
  } catch (e) {
    const detail = e instanceof Error && e.name === 'AbortError' ? 'timeout' : 'network';
    return json({ ok: false, reason: 'fetch-failed', detail });
  }

  // Paywalls and bot walls answer 401/403/429/451 or bounce to a login page.
  if (res.status === 401 || res.status === 403 || res.status === 429 || res.status === 451) {
    return json({ ok: false, reason: 'blocked', detail: `http ${res.status}` });
  }
  if (!res.ok) return json({ ok: false, reason: 'fetch-failed', detail: `http ${res.status}` });

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct && !ct.includes('html') && !ct.includes('xml') && !ct.includes('text/plain')) {
    return json({ ok: false, reason: 'no-recipe', detail: `content-type ${ct.split(';')[0]}` });
  }

  const buf = await readCapped(res, MAX_HTML_BYTES);
  if (!buf) return json({ ok: false, reason: 'fetch-failed', detail: 'page too large' });
  const html = new TextDecoder('utf-8').decode(buf);

  const recipe = extractRecipe(html, check.url.href);
  if (!recipe) {
    const looksBlocked = /captcha|access denied|are you a robot|enable javascript and cookies|subscribe to continue|log in to continue/i.test(html);
    return json({ ok: false, reason: looksBlocked ? 'blocked' : 'no-recipe' });
  }
  return json({ ok: true, recipe });
}

/** GET /api/image?url= → the image bytes, same-origin, so the canvas can read them. */
async function handleImage(url: URL): Promise<Response> {
  const check = checkExtractUrl(url.searchParams.get('url'));
  if (!check.ok) return new Response('bad url', { status: 400 });
  let res: Response;
  try {
    res = await fetchWithTimeout(check.url.href, 'image/*');
  } catch {
    return new Response('fetch failed', { status: 502 });
  }
  if (!res.ok) return new Response('upstream ' + res.status, { status: 502 });
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.startsWith('image/')) return new Response('not an image', { status: 415 });
  const buf = await readCapped(res, MAX_IMAGE_BYTES);
  if (!buf) return new Response('too large', { status: 413 });
  return new Response(buf, {
    status: 200,
    headers: { 'content-type': ct, 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ads.txt' || url.pathname === '/app-ads.txt') {
      return new Response('google.com, pub-1343411537040925, DIRECT, f08c47fec0942fa0\n', {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=86400',
        },
      });
    }

    if (url.pathname === '/api/extract') {
      if (request.method !== 'POST') return json({ ok: false, reason: 'bad-url', detail: 'POST only' }, 405);
      return handleExtract(request);
    }
    if (url.pathname === '/api/image') {
      if (request.method !== 'GET') return new Response('GET only', { status: 405 });
      return handleImage(url);
    }
    if (url.pathname.startsWith('/api/')) return json({ ok: false, reason: 'bad-url' }, 404);

    if (url.pathname === '/manifest.webmanifest') {
      const lang = pickLang(request, url) ?? 'en';
      const raw = await env.ASSETS.fetch(new Request(`${url.origin}/manifest.webmanifest`, { method: 'GET' }));
      if (!raw.ok) return raw;
      let manifest: Record<string, unknown>;
      try {
        manifest = (await raw.json()) as Record<string, unknown>;
      } catch {
        return raw;
      }
      return new Response(JSON.stringify(localizeManifest(manifest, lang), null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'public, max-age=0, must-revalidate',
          Vary: 'Cookie',
        },
      });
    }

    const asset = await env.ASSETS.fetch(request);
    const ct = asset.headers.get('content-type') || '';
    if (!ct.includes('text/html') || !isHome(url.pathname)) return asset;

    const lang = pickLang(request, url);
    let html: Response = asset;

    if (lang) {
      const copy = COPY[lang];
      const shareUrl = `${ORIGIN}/?lang=${lang}`;
      html = new HTMLRewriter()
        .on('html', { element(el) { el.setAttribute('lang', lang); } })
        .on('title', { element(el) { el.setInnerContent(copy.title); } })
        .on('#local-only', { element(el) { el.setInnerContent(copy.localOnly); } })
        .on('h1#brand-title', { element(el) { el.setInnerContent(copy.title); } })
        .on('.rl-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
        .on('meta', {
          element(el) {
            const key = el.getAttribute('property') || el.getAttribute('name') || '';
            if (key === 'description' || key === 'og:description' || key === 'twitter:description') {
              el.setAttribute('content', copy.description);
            } else if (key === 'og:title' || key === 'twitter:title') {
              el.setAttribute('content', copy.title);
            } else if (key === 'application-name' || key === 'apple-mobile-web-app-title') {
              el.setAttribute('content', copy.title);
            } else if (key === 'og:url') {
              el.setAttribute('content', shareUrl);
            } else if (key === 'og:image' || key === 'twitter:image') {
              el.setAttribute('content', copy.image);
            } else if (key === 'og:locale') {
              el.setAttribute('content', copy.locale);
            }
          },
        })
        .on('link', {
          element(el) {
            const rel = (el.getAttribute('rel') || '').toLowerCase();
            if (rel === 'canonical') {
              el.setAttribute('href', shareUrl);
            } else if (rel === 'manifest') {
              // Manifest fetches omit cookies, so the language rides on the URL.
              el.setAttribute('href', `/manifest.webmanifest?lang=${lang}`);
            }
          },
        })
        .transform(asset);
    }

    // Shared try-dabble feedback widget, appended server-side so it is present
    // no matter what the client bundle does to the shell. Link only: the app
    // ships no in-page feedback panel of its own.
    return new HTMLRewriter()
      .on('head', {
        element(el) {
          // Shared Naver Search Advisor verification (packages/seo).
          el.append(NAVER_META_HTML, { html: true });
        },
      })
      .on('body', {
        element(el) {
          el.append(
            `<script src="https://try-dabble.com/widget/feedback.js" data-app="${SLUG}" defer></script>`,
            { html: true },
          );
        },
      })
      .transform(html);
  },
};
