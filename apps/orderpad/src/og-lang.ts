/**
 * Runs before the assets binding (run_worker_first) so the FIRST HTML already
 * carries the requested ?lang=. Crawlers never run JS, so the language cannot
 * be left to the React bundle: html lang, title, the h1, the local-only notice,
 * the five promise chips and every share tag are rewritten here.
 */

type Lang = 'ko' | 'en' | 'ja' | 'zh';

type Copy = {
  title: string;
  description: string;
  tagline: string;
  locale: string;
  image: string;
  localOnly: string;
  /** The fail-fix, in the first HTML: no Meta connect, no login, no order
   *  limit, JSON and CSV export, survives a tab close. */
  chips: [string, string, string, string, string];
};

const COPY: Record<Lang, Copy> = {
  ko: {
    title: '주문수첩',
    description:
      '인스타그램·왓츠앱 DM으로 받은 주문을 채팅 도중에 바로 적는 휴대폰용 주문수첩. 고객 이름, 상품, 사이즈, 주소, 입금, 발송을 한 화면에서 적고 오늘 보낼 것과 미입금만 걸러 봅니다. 메타 로그인도 회원가입도 없고, 건수 제한도 없으며, 탭을 닫아도 그대로 남습니다. JSON·CSV로 내보내고 JSON으로 되돌립니다.',
    tagline: '고객, 상품, 입금, 발송. 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://orderpad.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    chips: [
      '메타 연동 없음',
      '로그인 없음',
      '건수 제한 없음',
      'JSON·CSV 내보내기',
      '탭을 닫아도 남음',
    ],
  },
  en: {
    title: 'Orderpad',
    description:
      'A phone-first order book for people selling through Instagram and WhatsApp DMs. Write the customer, the item, the size, the address, whether they paid and when it ships — on one screen, mid-chat. Filter to what ships today and to who has not paid. No Meta login, no sign-up, no order limit, and it survives closing the tab. Export JSON and CSV, import JSON back.',
    tagline: 'Customer, item, paid, shipped. On this device only.',
    locale: 'en_US',
    image: 'https://orderpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    chips: [
      'No Meta connect',
      'No login',
      'No order limit',
      'JSON and CSV export',
      'Survives closing the tab',
    ],
  },
  ja: {
    title: '注文帳',
    description:
      'InstagramやWhatsAppのDMで受けた注文を、チャットの途中でそのまま書き留めるスマホ用の注文帳。顧客名、商品、サイズ、住所、入金、発送を一画面で書き、今日出す分と未入金だけを絞り込めます。Metaログインも会員登録も件数の上限もなく、タブを閉じても残ります。JSON・CSVで書き出し、JSONで読み戻せます。',
    tagline: '顧客、商品、入金、発送。この端末だけに。',
    locale: 'ja_JP',
    image: 'https://orderpad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    chips: [
      'Meta連携なし',
      'ログイン不要',
      '件数の上限なし',
      'JSON・CSV書き出し',
      'タブを閉じても残る',
    ],
  },
  zh: {
    title: '订货本',
    description:
      '为用 Instagram、WhatsApp 私信接单的人做的手机订货本。客户、商品、尺码、地址、是否付款、什么时候发货，都在一屏里写完，聊天中途就能记。可以只看今天要发的和还没付款的。不用 Meta 登录，不用注册，不限条数，关掉标签页也还在。支持导出 JSON 和 CSV，并可用 JSON 导回。',
    tagline: '客户、商品、付款、发货。仅此设备。',
    locale: 'zh_CN',
    image: 'https://orderpad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    chips: [
      '不接 Meta 账号',
      '无需登录',
      '不限条数',
      '导出 JSON 和 CSV',
      '关掉标签页也还在',
    ],
  },
};

/** Same order as CHIPS in src/components/promise-chips.tsx. */
const CHIP_IDS = [
  '#chip-nometa',
  '#chip-nologin',
  '#chip-unlimited',
  '#chip-export',
  '#chip-persist',
] as const;

const SLUG = 'orderpad';
const ORIGIN = 'https://orderpad.try-dabble.com';
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
      let rewriter = new HTMLRewriter()
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
        .on('.op-tagline', {
          element(el) {
            el.setInnerContent(copy.tagline);
          },
        });

      CHIP_IDS.forEach((selector, i) => {
        rewriter = rewriter.on(selector, {
          element(el) {
            el.setInnerContent(copy.chips[i]);
          },
        });
      });

      html = rewriter
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
