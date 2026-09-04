/**
 * Runs before the assets binding (run_worker_first) so the FIRST HTML already
 * carries the requested ?lang= — crawlers never execute the SPA's JS. Also
 * appends the shared try-dabble 의견 feedback widget to every HTML response.
 */

type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<
  Lang,
  { title: string; tagline: string; description: string; locale: string; image: string; localOnly: string }
> = {
  ko: {
    title: '선물 서랍',
    tagline: '스크린샷을 선물 아이디어로',
    description: '스크린샷을 선물 아이디어로 모으고, 사람에게 태깅하고, 생일 전에 알림을 받습니다. 데이터는 브라우저에만 저장됩니다.',
    locale: 'ko_KR',
    image: 'https://gift-stash.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Gift Stash',
    tagline: 'Turn screenshots into gift ideas',
    description: 'Local-first gift idea stash. Capture screenshots, tag them to a person, get reminded before their birthday. Data stays in your browser.',
    locale: 'en_US',
    image: 'https://gift-stash.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: 'プレゼント引き出し',
    tagline: 'スクショをプレゼント案に',
    description: 'スクリーンショットをプレゼント案として保存し、人にタグ付けして誕生日前にリマインド。データはこのブラウザだけに残ります。',
    locale: 'ja_JP',
    image: 'https://gift-stash.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    title: '礼物抽屉',
    tagline: '把截图变成礼物灵感',
    description: '本地优先的礼物灵感库。保存截图、标记给某人，生日前提醒。数据只留在浏览器。',
    locale: 'zh_CN',
    image: 'https://gift-stash.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const SLUG = 'gift-stash';
const ORIGIN = 'https://gift-stash.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

/** ?lang= wins, then the td_lang cookie shared across try-dabble subdomains.
 *  Everything else (gs_lang, the browser) only the mounted app can see. */
function pickLang(request: Request, url: URL): Lang | null {
  const q = url.searchParams.get('lang');
  if (q && LANGS.has(q)) return q as Lang;
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/);
  if (m && LANGS.has(m[1])) return m[1] as Lang;
  return null;
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
    const asset = await env.ASSETS.fetch(request);
    const ct = asset.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return asset;

    let html: Response = asset;
    const lang = isHome(url.pathname) ? pickLang(request, url) : null;
    if (lang) {
      const copy = COPY[lang];
      const shareUrl = `${ORIGIN}/?lang=${lang}`;
      html = new HTMLRewriter()
        .on('html', { element(el) { el.setAttribute('lang', lang); } })
        .on('title', { element(el) { el.setInnerContent(copy.title); } })
        .on('#local-only', { element(el) { el.setInnerContent(copy.localOnly); } })
        .on('h1#brand-title', { element(el) { el.setInnerContent(copy.title); } })
        .on('.gs-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
            if ((el.getAttribute('rel') || '').toLowerCase() === 'canonical') {
              el.setAttribute('href', shareUrl);
            }
          },
        })
        .transform(asset);
    }

    return new HTMLRewriter()
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
