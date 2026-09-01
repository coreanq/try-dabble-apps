/**
 * Runs before the assets binding (run_worker_first) so the FIRST HTML already
 * carries the requested ?lang=. Crawlers never run JS, so the language cannot
 * be left to the React bundle: html lang, title, the h1, the tagline, the
 * local-only notice, the fail-fix chips and every share tag are rewritten here.
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
    chips: Record<'scan' | 'store' | 'history' | 'nologin' | 'persist', string>;
  }
> = {
  ko: {
    title: '스캔가격',
    description:
      '매대에서 바코드를 찍고 붙어 있는 가격과 가게 이름을 적어 둡니다. 다음에 같은 바코드를 다시 찍으면 언제 어디서 얼마였는지 날짜별로 보여 줍니다. 로그인 없이 이 기기에만 저장됩니다.',
    tagline: '찍고, 적고, 다시 찍으면 예전 가격. 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://scanprice.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    chips: {
      scan: '카메라 바코드 스캔',
      store: '가격마다 가게 표시',
      history: '다시 찍으면 지난 가격',
      nologin: '로그인 없음',
      persist: '탭을 닫아도 남음',
    },
  },
  en: {
    title: 'Scanprice',
    description:
      'In the aisle, scan a barcode, type the shelf price and tag the store. Scan the same code next month and your own dated price history for it comes back. No login, no account — it stays on this device.',
    tagline:
      'Scan it. Log the price. Scan again to see what you paid. On this device only.',
    locale: 'en_US',
    image: 'https://scanprice.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    chips: {
      scan: 'Camera barcode scan',
      store: 'Store tag on every price',
      history: 'Rescan shows dated history',
      nologin: 'No login',
      persist: 'Survives closing the tab',
    },
  },
  ja: {
    title: 'スキャン価格',
    description:
      '売り場でバーコードを撮り、棚に出ている値段と店の名前を書き留めます。次に同じバーコードを撮ると、いつどこでいくらだったかが日付つきで戻ってきます。ログインなし、この端末にだけ保存。',
    tagline: '撮って、書いて、もう一度撮れば前の値段。この端末だけ。',
    locale: 'ja_JP',
    image: 'https://scanprice.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    chips: {
      scan: 'カメラでバーコード読み取り',
      store: '値段ごとに店を記録',
      history: '撮り直すと日付つきの履歴',
      nologin: 'ログインなし',
      persist: 'タブを閉じても残る',
    },
  },
  zh: {
    title: '扫码记价',
    description:
      '站在货架前扫一下条码，写上货架价格并标注是哪家店。下次再扫同一个条码，就能看到自己记过的、带日期的价格记录。无需登录，只存在此设备。',
    tagline: '扫码记下价格，再扫就能看到上次多少钱。仅此设备。',
    locale: 'zh_CN',
    image: 'https://scanprice.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    chips: {
      scan: '摄像头扫条码',
      store: '每条价格都标店',
      history: '再扫显示带日期历史',
      nologin: '无需登录',
      persist: '关掉标签页也还在',
    },
  },
};

const SLUG = 'scanprice';
const ORIGIN = 'https://scanprice.try-dabble.com';
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
        .on('.sp-tagline', {
          element(el) {
            el.setInnerContent(copy.tagline);
          },
        })
        .on('#chip-scan', {
          element(el) {
            el.setInnerContent(copy.chips.scan);
          },
        })
        .on('#chip-store', {
          element(el) {
            el.setInnerContent(copy.chips.store);
          },
        })
        .on('#chip-history', {
          element(el) {
            el.setInnerContent(copy.chips.history);
          },
        })
        .on('#chip-nologin', {
          element(el) {
            el.setInnerContent(copy.chips.nologin);
          },
        })
        .on('#chip-persist', {
          element(el) {
            el.setInnerContent(copy.chips.persist);
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
