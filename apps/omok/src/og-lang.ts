type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<Lang, { title: string; description: string; locale: string; image: string }> = {
  ko: {
    title: '오목',
    description: '온라인 오목 게임',
    locale: 'ko_KR',
    image: 'https://omok.try-dabble.com/og-image.png',
  },
  en: {
    title: 'Gomoku',
    description: 'Online Gomoku (Five-in-a-Row) game',
    locale: 'en_US',
    image: 'https://omok.try-dabble.com/og-image-en.png',
  },
  ja: {
    title: '五目並べ',
    description: 'オンライン五目並べゲーム',
    locale: 'ja_JP',
    image: 'https://omok.try-dabble.com/og-image-ja.png',
  },
  zh: {
    title: 'Gomoku',
    description: 'Online Gomoku (Five-in-a-Row) game',
    locale: 'zh_CN',
    image: 'https://omok.try-dabble.com/og-image-en.png',
  },
};

const ORIGIN = 'https://omok.try-dabble.com';
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
    if (q && LANGS.has(q)) {
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
    }
    return asset;
  },
};
