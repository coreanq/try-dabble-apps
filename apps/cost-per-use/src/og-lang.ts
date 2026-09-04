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
    title: '사용단가 계산기',
    tagline: '하루·1회 사용 비용을 바로 확인',
    description: '구매 가격, 구매일, 예상 사용 기간으로 하루·1회 사용 비용을 계산하는 무료 사용단가 계산기. 데이터는 브라우저에만 저장됩니다.',
    locale: 'ko_KR',
    image: 'https://cost-per-use.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Cost-per-use Calculator',
    tagline: 'See what each day and each use really costs',
    description: 'Free cost-per-use and cost-per-day calculator. Enter price, purchase date, and expected lifespan to learn the true daily and per-use cost of anything you buy.',
    locale: 'en_US',
    image: 'https://cost-per-use.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: '1回あたり費用計算機',
    tagline: '1日・1回あたりの本当のコストを確認',
    description: '購入価格・購入日・想定使用期間で1日あたり・1回あたりの費用を計算する無料ツール。データはこの端末にのみ保存されます。',
    locale: 'ja_JP',
    image: 'https://cost-per-use.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    title: '单次使用成本计算器',
    tagline: '查看每天和每次使用的真实成本',
    description: '免费的单次使用成本与每日成本计算器。输入价格、购买日期与预期使用寿命，了解物品的真实日均与单次成本。',
    locale: 'zh_CN',
    image: 'https://cost-per-use.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const SLUG = 'cost-per-use';
const ORIGIN = 'https://cost-per-use.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

/** ?lang= wins, then the td_lang cookie shared across try-dabble subdomains.
 *  Everything else (cpu_lang, the browser) only the mounted app can see. */
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
        .on('#brand-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
