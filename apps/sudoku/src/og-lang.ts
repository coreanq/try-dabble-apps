/**
 * Runs ahead of the assets binding on every request (run_worker_first) so the
 * FIRST HTML already carries the requested language. Crawlers do not run JS:
 * ?lang=en must not hand them the Korean default.
 *
 * Order: ?lang= wins, then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language. src/lib/i18n/resolve-lang.ts
 * resolves the mounted app the same way, so the served HTML and React never
 * disagree.
 */
type Lang = 'ko' | 'en' | 'ja';

const COPY: Record<
  Lang,
  {
    title: string;
    description: string;
    locale: string;
    image: string;
    localOnly: string;
    sub: string;
  }
> = {
  ko: {
    title: '스도쿠 3D',
    description:
      '따뜻한 원목 보드와 세라믹 숫자 타일로 즐기는 3D 스도쿠입니다. 다섯 단계 난이도, 메모, 실행 취소, 정답 확인을 지원하며 손가락·마우스·Apple Pencil로 플레이할 수 있습니다.',
    locale: 'ko_KR',
    image: 'https://sudoku.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    sub: '원목 보드와 세라믹 타일',
  },
  en: {
    title: '3D Sudoku',
    description:
      'Play tactile 3D Sudoku on a warm wooden board with ceramic tiles, five rated difficulty levels, notes, undo, answer checking, and Pencil or finger controls.',
    locale: 'en_US',
    image: 'https://sudoku.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    sub: 'A wooden board, ceramic tiles',
  },
  ja: {
    title: '3D数独',
    description:
      '温かな木製ボードとセラミックの数字タイルで楽しむ3D数独です。5段階の難易度、メモ、取り消し、答え合わせに対応し、指・マウス・Apple Pencilのどれでも遊べます。',
    locale: 'ja_JP',
    image: 'https://sudoku.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    sub: '木製ボードとセラミックタイル',
  },
};

const SLUG = 'sudoku';
const ORIGIN = 'https://sudoku.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja']);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

function pickLang(request: Request, url: URL): Lang | null {
  const q = url.searchParams.get('lang');
  if (q && LANGS.has(q)) return q as Lang;
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)td_lang=(ko|en|ja)(?:;|$)/);
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
        .on('#brand-sub', { element(el) { el.setInnerContent(copy.sub); } })
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

    // Shared try-dabble feedback widget, appended server-side so it is present
    // no matter what the client bundle does to the shell.
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
