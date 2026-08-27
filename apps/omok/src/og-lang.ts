type Lang = 'ko' | 'en' | 'ja' | 'zh';

/**
 * The Worker runs before the assets binding replies (run_worker_first), so the
 * FIRST HTML already carries the requested ?lang= — html lang, title, the
 * local-only banner, the h1, and every og/twitter tag. Crawlers never run JS,
 * so anything the React app fixes up later is too late for them.
 *
 * Copy is duplicated from src/lib/i18n.ts on purpose: the Worker is bundled
 * on its own and must not drag React-side modules in.
 */
const COPY: Record<Lang, {
  title: string;
  titleSub: string;
  description: string;
  locale: string;
  image: string;
  localOnly: string;
}> = {
  ko: {
    title: '오목',
    titleSub: '五目並べ',
    description: '온라인 오목 게임',
    locale: 'ko_KR',
    image: 'https://omok.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Gomoku',
    titleSub: '五目並べ',
    description: 'Online Gomoku (Five-in-a-Row) game',
    locale: 'en_US',
    image: 'https://omok.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: '五目並べ',
    titleSub: 'Gomoku',
    description: 'オンライン五目並べゲーム',
    locale: 'ja_JP',
    image: 'https://omok.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    title: '五子棋',
    titleSub: 'Gomoku',
    description: '在浏览器中畅玩五子棋。可与人工智能对弈，或与朋友双人对战。无需安装。',
    locale: 'zh_CN',
    image: 'https://omok.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const SLUG = 'omok';
const ORIGIN = 'https://omok.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: { fetch: (request: Request) => Promise<Response> } };

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
    const asset = await env.ASSETS.fetch(request);
    const ct = asset.headers.get('content-type') || '';
    if (!ct.includes('text/html') || !isHome(url.pathname)) return asset;

    const lang = pickLang(request, url);
    let html: Response = asset;

    if (lang) {
      const copy = COPY[lang];
      const shareUrl = `${ORIGIN}/?lang=${lang}`;
      html = new HTMLRewriter()
        .on('html', { element(el) { el.setAttribute('lang', lang); } })
        .on('title', { element(el) { el.setInnerContent(copy.title); } })
        .on('#local-only', { element(el) { el.setInnerContent(copy.localOnly); } })
        .on('h1#brand-title', { element(el) { el.setInnerContent(copy.title); } })
        .on('#brand-sub', { element(el) { el.setInnerContent(copy.titleSub); } })
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

    // The 의견 widget rides on every response, localised or not.
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
