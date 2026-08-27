type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<Lang, { title: string; description: string; locale: string; image: string; localOnly: string }> = {
  ko: {
    title: '나중함',
    description: '링크와 한 줄 이유를 남기고, 이번 주 최대 3개만 고릅니다. 핀하지 않으면 30일 후 만료됩니다. 데이터는 브라우저에만 남습니다.',
    locale: 'ko_KR',
    image: 'https://later-inbox.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Later Inbox',
    description: 'Save a link with a required one-line why. Keep at most 3 for this week. Unpinned inbox items expire after 30 days. Data stays in your browser.',
    locale: 'en_US',
    image: 'https://later-inbox.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: 'あとで読む',
    description: 'リンクと一行の理由を残し、今週は最大3件。ピンなしは30日で期限切れ。データはこのブラウザだけです。',
    locale: 'ja_JP',
    image: 'https://later-inbox.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    title: '稍后再读',
    description: '保存链接并写下一句理由。本周最多 3 条。未钉选超过 30 天会过期。数据只留在浏览器。',
    locale: 'zh_CN',
    image: 'https://later-inbox.try-dabble.com/og-image-en.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const SLUG = "later-inbox";
const ORIGIN = 'https://later-inbox.try-dabble.com';
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
