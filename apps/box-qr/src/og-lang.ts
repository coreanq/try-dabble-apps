type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<Lang, { title: string; description: string; locale: string; image: string; localOnly: string }> = {
  ko: {
    title: '상자QR',
    description: '이사 상자에 QR을 붙이고 사진과 내용물을 적습니다. 나중에 ‘레고’로 어느 상자인지 찾습니다. 계정 없이 이 기기에만 저장됩니다.',
    locale: 'ko_KR',
    image: 'https://box-qr.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Box QR',
    description: 'Stick a QR on a moving box, add photos and a short list, then search “Lego” to find which box. No account. Data stays on this device.',
    locale: 'en_US',
    image: 'https://box-qr.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: '箱QR',
    description: '引越し箱にQRを貼り、写真と中身を残します。あとで「レゴ」でどの箱か探せます。アカウントなし、この端末だけです。',
    locale: 'ja_JP',
    image: 'https://box-qr.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    title: '箱子QR',
    description: '把二维码贴在搬家箱上，加上照片和物品清单，之后搜“乐高”就能找到哪一箱。无需账户，数据只留在此设备。',
    locale: 'zh_CN',
    image: 'https://box-qr.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const SLUG = "box-qr";
const ORIGIN = 'https://box-qr.try-dabble.com';
const LANGS = new Set<string>(["ko", "en", "ja", "zh"]);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

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
    if (!ct.includes('text/html') || !isHome(url.pathname)) return asset;
    const lang = pickLang(request, url);
    let html: Response = asset;
    if (lang) {
    const copy = COPY[lang];
    const shareUrl = `${ORIGIN}/?lang=${lang}`;
    html = new HTMLRewriter()
      .on('html', { element(el) { el.setAttribute('lang', lang === 'zh' ? 'zh' : lang); } })
      .on('title', { element(el) { el.setInnerContent(copy.title); } })
      .on('#local-only', { element(el) { el.setInnerContent(copy.localOnly); } })
      .on('h1#brand-title', { element(el) { el.setInnerContent(copy.title); } })
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
