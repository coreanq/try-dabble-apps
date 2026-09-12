/**
 * Runs ahead of the assets binding on every request (run_worker_first) so the
 * FIRST HTML already carries the requested language. Crawlers do not run JS:
 * ?lang=en must not hand them the Korean default.
 *
 * Order: ?lang= wins, then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language. src/lib/i18n.ts resolves the
 * mounted app the same way, so the served HTML and React never disagree.
 *
 * Ad-free on purpose: nothing here injects AdSense. /ads.txt and /app-ads.txt
 * are still served so the publisher id is consistent across the property.
 */
import { NAVER_META_HTML } from '../../../packages/seo/naver.ts';
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
    title: '어펌패드',
    description:
      '계정 없는 무료 확언 연습 패드. 나만의 확언과 주제를 적고, 전체화면으로 한 문장을 크게 띄운 채 탭으로 반복 횟수를 세세요. 실수는 되돌리기, 마음에 드는 문장은 즐겨찾기, 밤에는 다크 모드. 무료 체험 후 연 $47 같은 함정도, 해지 장벽도, 광고도 없습니다. JSON 백업. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://affirmpad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. 구독·광고 없음.',
    tagline: '무료 로컬 확언 연습. 맞춤 주제, 전체화면 탭 카운트, 즐겨찾기, 다크 모드, JSON 백업. 계정 없음. 구독 없음.',
  },
  en: {
    title: 'Affirmpad',
    description:
      'Free affirmation practice pad with no account. Write your own affirmations and topics, put one sentence up fullscreen and tap once per repetition. Undo a slip, star the lines you love, switch to dark mode at night. No free-trial-then-$47-a-year trap, no cancel wall, no ads. JSON backup. Data stays on this device.',
    locale: 'en_US',
    image: 'https://affirmpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers. No subscription. No ads.',
    tagline: 'Free local affirmation practice. Custom topics, fullscreen tap count, favorites, dark mode, JSON backup. No account. No subscription.',
  },
  ja: {
    title: 'アファームパッド',
    description:
      'アカウント不要の無料アファメーション練習パッド。自分の言葉でアファメーションとトピックを書き、一文を全画面に大きく出して、唱えるたびにタップして回数を数えます。間違えたら取り消し、好きな文はお気に入り、夜はダークモード。無料トライアル後に年$47の罠も、解約の壁も、広告もありません。JSONバックアップ。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://affirmpad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。サブスク・広告なし。',
    tagline: '無料のローカルアファメーション練習。カスタムトピック、全画面タップカウント、お気に入り、ダークモード、JSONバックアップ。アカウント不要。サブスクなし。',
  },
  zh: {
    title: '肯定练习板',
    description:
      '无需账号的免费肯定语练习板。用自己的话写下肯定语和主题，把一句话全屏放大，每念一遍点按一次计数。按错了可撤销，喜欢的句子加收藏，晚上切深色模式。没有“免费试用后每年 $47”的陷阱，没有取消壁垒，没有广告。JSON 备份。数据仅保存在此设备。',
    locale: 'zh_CN',
    image: 'https://affirmpad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。无订阅、无广告。',
    tagline: '免费本地肯定语练习。自定义主题、全屏点按计数、收藏、深色模式、JSON 备份。无需账号。无订阅。',
  },
};

const SLUG = 'affirmpad';
const ORIGIN = 'https://affirmpad.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

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
 * say "Affirmpad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.ap-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
