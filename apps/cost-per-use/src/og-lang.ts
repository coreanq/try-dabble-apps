type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<Lang, { title: string; description: string; locale: string; image: string }> = {
  ko: {
    title: '사용단가 계산기',
    description: '구매 가격, 구매일, 예상 사용 기간으로 하루·1회 사용 비용을 계산하는 무료 사용단가 계산기. 데이터는 브라우저에만 저장됩니다.',
    locale: 'ko_KR',
    image: 'https://cost-per-use.try-dabble.com/og-image.png',
  },
  en: {
    title: 'Cost-per-use Calculator',
    description: 'Free cost-per-use and cost-per-day calculator. Enter price, purchase date, and expected lifespan to learn the true daily and per-use cost of anything you buy.',
    locale: 'en_US',
    image: 'https://cost-per-use.try-dabble.com/og-image-en.png',
  },
  ja: {
    title: '1回あたり費用計算機',
    description: '購入価格・購入日・想定使用期間で1日あたり・1回あたりの費用を計算する無料ツール。データはこの端末にのみ保存されます。',
    locale: 'ja_JP',
    image: 'https://cost-per-use.try-dabble.com/og-image-ja.png',
  },
  zh: {
    title: '单次使用成本计算器',
    description: '免费的单次使用成本与每日成本计算器。输入价格、购买日期与预期使用寿命，了解物品的真实日均与单次成本。',
    locale: 'zh_CN',
    image: 'https://cost-per-use.try-dabble.com/og-image-en.png',
  },
};

const SLUG = "cost-per-use";
const ORIGIN = 'https://cost-per-use.try-dabble.com';
const LANGS = new Set<string>(["ko", "en", "ja", "zh"]);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const asset = await env.ASSETS.fetch(request);
    const ct = asset.headers.get('content-type') || '';
    if (!ct.includes('text/html') || !isHome(url.pathname)) return asset;
    const q = url.searchParams.get('lang');
    let html: Response = asset;
    if (q && LANGS.has(q)) {
    const lang = q as Lang;
    const copy = COPY[lang];
    const shareUrl = `${ORIGIN}/?lang=${lang}`;
    html = new HTMLRewriter()
      .on('html', { element(el) { el.setAttribute('lang', lang === 'zh' ? 'zh' : lang); } })
      .on('title', { element(el) { el.setInnerContent(copy.title); } })
      .on('meta', {
        element(el) {
          const key = el.getAttribute('property') || el.getAttribute('name') || '';
          if (key === 'description' || key === 'og:description' || key === 'twitter:description') {
            el.setAttribute('content', copy.description);
          } else if (key === 'og:title' || key === 'twitter:title') {
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
    } // lang rewrite

    const withWidget = new HTMLRewriter()
      .on('body', {
        element(el) {
          el.append(`<script src="https://try-dabble.com/widget/feedback.js" data-app="${SLUG}" defer></script>`, { html: true });
        },
      })
      .transform(html);
    return withWidget;
  },
};
