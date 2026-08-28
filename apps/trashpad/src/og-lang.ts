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
    title: '휴지패드',
    description:
      '저장 버튼 없는 메모장. 적는 순간 남고, 마지막으로 고친 뒤 24시간이 지나면 스스로 지워집니다. 타이머는 1시간·6시간·24시간·48시간·7일 중에 고릅니다. 계정도 구독도 없고, 탭을 닫아도 남습니다.',
    tagline: '적으면 남고, 시간이 지나면 지워집니다',
    locale: 'ko_KR',
    image: 'https://trashpad.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
  },
  en: {
    title: 'Trashpad',
    description:
      'A scratch pad with no Save button. Type and it stays, then deletes itself 24 hours after your last edit. Pick the timer: 1h, 6h, 24h, 48h, or 7 days. No account, no subscription, and it survives closing the tab.',
    tagline: 'Type it. It stays. Then it disappears.',
    locale: 'en_US',
    image: 'https://trashpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
  },
  ja: {
    title: '消えるメモ',
    description:
      '保存ボタンのないメモ帳。書けばそのまま残り、最後に直してから24時間で自動的に消えます。タイマーは1時間・6時間・24時間・48時間・7日から選べます。アカウントも定額課金もなく、タブを閉じても残ります。',
    tagline: '書けば残る。時間が来たら消える。',
    locale: 'ja_JP',
    image: 'https://trashpad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
  },
  zh: {
    // zh has its own card. Never point it at the English file.
    title: '废纸便签',
    description:
      '没有保存按钮的便签本。写下就留住，最后一次修改 24 小时后自动删除。计时可选 1 小时、6 小时、24 小时、48 小时或 7 天。无需账户，没有订阅，关掉标签页也还在。',
    tagline: '写下来会留下，时间到了就消失。',
    locale: 'zh_CN',
    image: 'https://trashpad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
  },
};

const SLUG = 'trashpad';
const ORIGIN = 'https://trashpad.try-dabble.com';
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
        .on('.tp-tagline', {
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
