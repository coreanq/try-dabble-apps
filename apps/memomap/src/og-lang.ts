/**
 * Runs before the assets binding (run_worker_first) so the FIRST HTML already
 * carries the requested ?lang=. Crawlers never run JS, so the language cannot
 * be left to the React bundle: html lang, title, the h1, the local-only notice
 * and every share tag are rewritten here.
 */

type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<
  Lang,
  {
    title: string;
    description: string;
    tagline: string;
    locale: string;
    image: string;
    localOnly: string;
  }
> = {
  ko: {
    title: '기억지도',
    description:
      '다녀온 곳을 지도에 핀으로 남기는 개인 기억 지도. 탭해서 핀을 꽂고 한 줄 메모와 사진을 붙입니다. 로그인도, 스태미나도, 사진 개수 제한도, 구독도 없습니다. 핀은 이 기기에만 남습니다.',
    tagline: '다녀온 곳에 핀과 한 줄, 이 기기에만',
    locale: 'ko_KR',
    image: 'https://memomap.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Memomap',
    description:
      'A private map of the places you have already been. Tap to drop a pin, add a short memo and a photo. No login, no stamina, no photo limit, no subscription. Pins stay on this device.',
    tagline: 'Pins, a short note, a photo. Private, on this device.',
    locale: 'en_US',
    image: 'https://memomap.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: '視える記憶',
    description:
      '行ったことのある場所をピンで残す、自分だけの記憶地図。タップでピンを置き、一行のメモと写真を添えます。ログインもスタミナも写真枚数の制限も定額課金もありません。ピンはこの端末にだけ残ります。',
    tagline: '行った場所にピンと一行。この端末だけに。',
    locale: 'ja_JP',
    image: 'https://memomap.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    // zh has its own card. Never point it at the English file.
    title: '记忆地图',
    description:
      '记录你去过的地方的私人记忆地图。点一下就能放针，再写一句话、配一张照片。无需登录，没有体力值，不限照片数量，没有订阅。所有针只留在这台设备。',
    tagline: '去过的地方，一枚针一句话，只留在这台设备。',
    locale: 'zh_CN',
    image: 'https://memomap.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const SLUG = 'memomap';
const ORIGIN = 'https://memomap.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

/** ?lang= wins over the td_lang cookie, which carries the choice across the
 *  try-dabble subdomains. localStorage is invisible here — the client resolves
 *  that tier itself, in the same order. */
function pickLang(request: Request, url: URL): Lang | null {
  const q = url.searchParams.get('lang');
  if (q && LANGS.has(q)) return q as Lang;
  const m = (request.headers.get('cookie') || '').match(
    /(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/,
  );
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
        .on('html', {
          element(el) {
            el.setAttribute('lang', lang);
          },
        })
        .on('title', {
          element(el) {
            el.setInnerContent(copy.title);
          },
        })
        .on('#local-only', {
          element(el) {
            el.setInnerContent(copy.localOnly);
          },
        })
        .on('h1#brand-title', {
          element(el) {
            el.setInnerContent(copy.title);
          },
        })
        .on('.mm-tagline', {
          element(el) {
            el.setInnerContent(copy.tagline);
          },
        })
        .on('meta', {
          element(el) {
            const key = el.getAttribute('property') || el.getAttribute('name') || '';
            if (
              key === 'description' ||
              key === 'og:description' ||
              key === 'twitter:description'
            ) {
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

    // Shared try-dabble 의견 widget. Appended for every language, including the
    // untouched default, so the feedback button never depends on ?lang=.
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
