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
  /** The fail-fix, in the first HTML: no login, no song-count lock, no
   *  streaming account, title and artist is enough, survives a tab close. */
  chips: [string, string, string, string, string];
};

const COPY: Record<Lang, Copy> = {
  ko: {
    title: '그때그곡',
    description:
      '지금 아끼는 노래의 제목과 가수, 마지막으로 들은 날, 그리고 몇 년 뒤에 다시 만날지를 적어 두는 개인 기록장. 로그인도, 100곡 라이브러리 조건도, 스트리밍 연결도 없습니다. 제목과 가수만 있으면 되고, 탭을 닫아도 그대로 남습니다.',
    tagline: '제목과 가수만. N년 뒤에 다시 만난다.',
    locale: 'ko_KR',
    image: 'https://lastloved.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    chips: [
      '로그인 없음',
      '곡 수 잠금 없음',
      '스트리밍 연결 없음',
      '제목과 가수면 충분',
      '탭을 닫아도 남음',
    ],
  },
  en: {
    title: 'Lastloved',
    description:
      'A private log for the song you are wearing out right now: title, artist, the day you last loved it, and how many years until it comes back to you. No login, no 100-song library requirement, no streaming account. Title and artist is enough, and it survives closing the tab.',
    tagline: 'Title and artist. It comes back in N years.',
    locale: 'en_US',
    image: 'https://lastloved.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    chips: [
      'No login',
      'No song-count lock',
      'No streaming account',
      'Title and artist is enough',
      'Survives closing the tab',
    ],
  },
  ja: {
    title: 'あの頃の曲',
    description:
      '今いちばん聴いている曲のタイトルと歌手、最後に愛した日、そして何年後にまた会うかを書いておく個人の記録帳。ログインも、100曲のライブラリ条件も、ストリーミング連携もありません。タイトルと歌手だけで足り、タブを閉じても残ります。',
    tagline: 'タイトルと歌手だけ。N年後にまた会える。',
    locale: 'ja_JP',
    image: 'https://lastloved.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    chips: [
      'ログインなし',
      '曲数の制限なし',
      'ストリーミング連携なし',
      'タイトルと歌手だけでいい',
      'タブを閉じても残る',
    ],
  },
  zh: {
    // zh has its own card. Never point it at the English file.
    title: '当年那首歌',
    description:
      '把你现在最爱的那首歌记下来：歌名、歌手、上次深爱的日期，以及多少年后再相见。无需登录，没有 100 首歌的曲库门槛，也不绑定流媒体。只要歌名和歌手，关掉标签页也还在。',
    tagline: '只要歌名和歌手。N 年后它会回来。',
    locale: 'zh_CN',
    image: 'https://lastloved.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    chips: [
      '无需登录',
      '不限歌曲数量',
      '不绑定流媒体',
      '只要歌名和歌手',
      '关掉标签页也还在',
    ],
  },
};

const CHIP_IDS = [
  '#chip-nologin',
  '#chip-nolock',
  '#chip-nostream',
  '#chip-titleonly',
  '#chip-persist',
] as const;

const SLUG = 'lastloved';
const ORIGIN = 'https://lastloved.try-dabble.com';
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
        .on('.ll-tagline', {
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
