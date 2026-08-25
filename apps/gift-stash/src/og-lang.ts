type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<Lang, { title: string; description: string; locale: string; image: string }> = {
  ko: {
    title: '선물 서랍',
    description: '스크린샷을 선물 아이디어로 모으고, 사람에게 태깅하고, 생일 전에 알림을 받습니다. 데이터는 브라우저에만 저장됩니다.',
    locale: 'ko_KR',
    image: 'https://gift-stash.try-dabble.com/og-image.png',
  },
  en: {
    title: 'Gift Stash',
    description: 'Local-first gift idea stash. Capture screenshots, tag them to a person, get reminded before their birthday. Data stays in your browser.',
    locale: 'en_US',
    image: 'https://gift-stash.try-dabble.com/og-image-en.png',
  },
  ja: {
    title: 'プレゼント引き出し',
    description: 'スクリーンショットをプレゼント案として保存し、人にタグ付けして誕生日前にリマインド。データはこのブラウザだけに残ります。',
    locale: 'ja_JP',
    image: 'https://gift-stash.try-dabble.com/og-image-ja.png',
  },
  zh: {
    title: '礼物抽屉',
    description: '本地优先的礼物灵感库。保存截图、标记给某人，生日前提醒。数据只留在浏览器。',
    locale: 'zh_CN',
    image: 'https://gift-stash.try-dabble.com/og-image-en.png',
  },
};

const ORIGIN = 'https://gift-stash.try-dabble.com';
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
    if (!q || !LANGS.has(q)) return asset;
    const lang = q as Lang;
    const copy = COPY[lang];
    const shareUrl = `${ORIGIN}/?lang=${lang}`;
    return new HTMLRewriter()
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
  },
};
