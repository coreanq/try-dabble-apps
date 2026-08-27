type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<Lang, { title: string; description: string; locale: string; image: string; localOnly: string }> = {
  ko: {
    title: '블록점퍼',
    description: '블록을 점프해 멀리 가는 사이드스크롤 플랫포머 — 4테마(지하/땅/하늘/우주)와 추락-회복 메커닉',
    locale: 'ko_KR',
    image: 'https://jump-map.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Block Jumper',
    description: 'A side-scrolling platformer where you jump across blocks — 4 themes (underground/ground/sky/space) with fall-recovery mechanic',
    locale: 'en_US',
    image: 'https://jump-map.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: 'ブロックジャンパー',
    description: 'ブロックをジャンプして遠くを目指す横スクロールプラットフォーマー — 4テーマ(地下/地上/空/宇宙)と落下リカバリー',
    locale: 'ja_JP',
    image: 'https://jump-map.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    title: 'Block Jumper',
    description: 'A side-scrolling platformer where you jump across blocks — 4 themes (underground/ground/sky/space) with fall-recovery mechanic',
    locale: 'zh_CN',
    image: 'https://jump-map.try-dabble.com/og-image-en.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const ORIGIN = 'https://jump-map.try-dabble.com';
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
        .on('#local-only', { element(el) { el.setInnerContent(copy.localOnly); } })
        .on('h1', { element(el) { el.setInnerContent(copy.title); } })
        .on('meta', {
          element(el) {
            const key = el.getAttribute('property') || el.getAttribute('name') || '';
            if (key === 'description' || key === 'og:description' || key === 'twitter:description') {
              el.setAttribute('content', copy.description);
            } else if (key === 'og:title' || key === 'twitter:title') {
              el.setAttribute('content', copy.title);
            } else if (key === 'application-name' || key === 'apple-mobile-web-app-title') {
              el.setAttribute('content', copy.title);
            } else if (key === 'og:image' || key === 'twitter:image') {
              el.setAttribute('content', copy.image);
            } else if (key === 'og:url') {
              el.setAttribute('content', shareUrl);
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
