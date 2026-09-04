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
  /** The fail-fix, in the first HTML: no login, no 100-record lock, no
   *  spreadsheet, JSON and CSV export, survives a tab close. */
  chips: [string, string, string, string, string];
};

const COPY: Record<Lang, Copy> = {
  ko: {
    title: '가게록',
    description:
      '가게 이름과 매장 번호, 그리고 짧은 메모만 적어 두는 휴대폰용 가게 명단. 스프레드시트를 열 필요가 없고, 가나다순으로 저절로 정렬되며, 이름·번호·메모를 한 칸으로 검색합니다. 로그인도 100건 잠금도 유료 잠금도 없고, 탭을 닫아도 그대로 남습니다. JSON과 CSV로 내보낼 수 있습니다.',
    tagline: '가게 이름, 매장 번호, 메모. 가나다순. 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://storelog.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    chips: [
      '로그인 없음',
      '100건 잠금 없음',
      '스프레드시트 없음',
      'JSON·CSV 내보내기',
      '탭을 닫아도 남음',
    ],
  },
  en: {
    title: 'Storelog',
    description:
      'A phone-first store directory: store name, store number and a short note. No spreadsheet to open, sorted A–Z by itself, and one search box across name, number and notes. No login, no 100-record lock, no PRO catalog lock, and it survives closing the tab. Export to JSON and CSV whenever you want.',
    tagline: 'Store name, store number, notes. A–Z. On this device only.',
    locale: 'en_US',
    image: 'https://storelog.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    chips: [
      'No login',
      'No 100-store lock',
      'No spreadsheet',
      'JSON and CSV export',
      'Survives closing the tab',
    ],
  },
  ja: {
    title: '店舗帳',
    description:
      '店名と店舗番号、それに短いメモだけを書いておくスマホ向けの店舗一覧。表計算アプリを開く必要がなく、あいうえお順に自動で並び、名前・番号・メモを一つの検索欄で探せます。ログインも100件の上限も有料ロックもなく、タブを閉じても残ります。JSONとCSVで書き出せます。',
    tagline: '店名、店舗番号、メモ。あいうえお順。この端末だけ。',
    locale: 'ja_JP',
    image: 'https://storelog.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    chips: [
      'ログインなし',
      '100件の上限なし',
      '表計算アプリ不要',
      'JSON・CSV書き出し',
      'タブを閉じても残る',
    ],
  },
  zh: {
    // zh has its own card. Never point it at the English file.
    title: '店录',
    description:
      '为手机准备的门店名录：店名、门店号，再加一句备注。不用打开电子表格，自动按字母顺序排列，一个搜索框同时找名字、号码和备注。无需登录，没有 100 条上限，也没有 PRO 解锁，关掉标签页也还在。随时导出 JSON 和 CSV。',
    tagline: '店名、门店号、备注。按字母排序。仅此设备。',
    locale: 'zh_CN',
    image: 'https://storelog.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    chips: [
      '无需登录',
      '不限门店数量',
      '不用电子表格',
      '导出 JSON 和 CSV',
      '关掉标签页也还在',
    ],
  },
};

const CHIP_IDS = [
  '#chip-nologin',
  '#chip-nolock',
  '#chip-nosheet',
  '#chip-export',
  '#chip-persist',
] as const;

const SLUG = 'storelog';
const ORIGIN = 'https://storelog.try-dabble.com';
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
        .on('.sl-tagline', {
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
