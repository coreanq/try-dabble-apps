type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<Lang, { title: string; description: string; locale: string; image: string; localOnly: string }> = {
  ko: {
    title: '여행 받은편지함',
    description: '여행 스크린샷과 링크를 왜 저장했는지와 함께 모으고, 1–5 순위와 후보 여행으로 묶습니다. 데이터는 브라우저에만 남습니다.',
    locale: 'ko_KR',
    image: 'https://place-inbox.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Place Inbox',
    description: 'Local inbox for travel screenshots and links. Save why you kept a place, rank 1–5, and group into candidate trips. Data stays in your browser.',
    locale: 'en_US',
    image: 'https://place-inbox.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: '旅の受信箱',
    description: '旅のスクショとリンクを「なぜ残したか」と1–5の行きたい度、候補の旅グループで整理。データはこのブラウザだけです。',
    locale: 'ja_JP',
    image: 'https://place-inbox.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    title: '旅行收件箱',
    description: '把旅行截图和链接连同“为何收藏”、1–5 想去程度和候选行程分组。数据只留在浏览器。',
    locale: 'zh_CN',
    image: 'https://place-inbox.try-dabble.com/og-image-en.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const SLUG = "place-inbox";
const ORIGIN = 'https://place-inbox.try-dabble.com';
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
