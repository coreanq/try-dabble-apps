type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<Lang, { title: string; description: string; locale: string; image: string }> = {
  ko: {
    title: '반찬함',
    description: '남은 반찬 이름과 먹을 날짜만 적습니다. 오래된 것부터 먹습니다. 데이터는 이 기기에만 남습니다.',
    locale: 'ko_KR',
    image: 'https://leftover-box.try-dabble.com/og-image.png',
  },
  en: {
    title: 'Leftover Box',
    description: 'Log leftover dishes and eat-by dates. Eat the oldest first. Data stays on this device.',
    locale: 'en_US',
    image: 'https://leftover-box.try-dabble.com/og-image-en.png',
  },
  ja: {
    title: '残りもの箱',
    description: '残りものの名前と食べる期限だけ残します。古いものから食べます。データはこの端末だけです。',
    locale: 'ja_JP',
    image: 'https://leftover-box.try-dabble.com/og-image-ja.png',
  },
  zh: {
    title: '剩菜盒',
    description: '记下剩菜名字和食用日期。先吃最早的。数据只留在此设备。',
    locale: 'zh_CN',
    image: 'https://leftover-box.try-dabble.com/og-image-en.png',
  },
};

const SLUG = "leftover-box";
const ORIGIN = 'https://leftover-box.try-dabble.com';
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
