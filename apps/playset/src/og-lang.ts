/**
 * Runs ahead of the assets binding on every request (run_worker_first) so the
 * FIRST HTML already carries the requested language. Crawlers do not run JS:
 * ?lang=en must not hand them the Korean default, and neither must the five
 * fail-fix chips — "no login", "no 3-game lock", "no subscription" are the
 * whole reason someone clicks through, so they ship in the shell.
 *
 * Order: ?lang= wins, then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language. src/lib/i18n.ts resolves the
 * mounted app the same way, so the served HTML and React never disagree.
 */
type Lang = 'ko' | 'en' | 'ja' | 'zh';

const COPY: Record<
  Lang,
  {
    title: string;
    description: string;
    locale: string;
    image: string;
    localOnly: string;
    tagline: string;
    chips: Record<string, string>;
  }
> = {
  ko: {
    title: '놀이세트',
    description:
      '간단한 두뇌 게임 여섯 가지 중에서 원하는 것만 골라 목록으로 저장하고, 시작을 누르면 다음 게임이 저절로 이어집니다. 로그인도, 3게임 제한도, 구독도 없습니다. 목록은 탭을 닫아도 이 기기에 남습니다.',
    locale: 'ko_KR',
    image: 'https://playset.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    tagline: '고른 게임만, 이어서. 이 기기에만.',
    chips: {
      'chip-nologin': '로그인 없음',
      'chip-nolock': '3게임 제한 없음',
      'chip-nosub': '구독 없음',
      'chip-allgames': '고른 게임 전부',
      'chip-persist': '탭을 닫아도 남음',
    },
  },
  en: {
    title: 'Playset',
    description:
      'Pick only the simple brain games you want from six, save them as a playlist, and press play — the next game starts by itself. No login, no three-game lock, no subscription. The queue stays on this device even after you close the tab.',
    locale: 'en_US',
    image: 'https://playset.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    tagline: 'Only the games you pick. Then the next one. On this device only.',
    chips: {
      'chip-nologin': 'No login',
      'chip-nolock': 'No 3-game lock',
      'chip-nosub': 'No subscription',
      'chip-allgames': 'Every game you picked',
      'chip-persist': 'Survives a tab close',
    },
  },
  ja: {
    title: 'プレイセット',
    description:
      '六つのやさしい脳トレから、やりたいものだけを選んで並べて保存します。開始を押せば、次のゲームがひとりでに始まります。ログインも、一日3ゲームの制限も、サブスクもありません。並べた順番はタブを閉じてもこの端末に残ります。',
    locale: 'ja_JP',
    image: 'https://playset.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    tagline: '選んだゲームだけ、つづけて。この端末だけ。',
    chips: {
      'chip-nologin': 'ログインなし',
      'chip-nolock': '3ゲーム制限なし',
      'chip-nosub': 'サブスクなし',
      'chip-allgames': '選んだゲーム全部',
      'chip-persist': 'タブを閉じても残る',
    },
  },
  zh: {
    title: '游戏套装',
    description:
      '从六个简单的动脑小游戏里只挑你想玩的，排好顺序存成一份清单，按下开始，下一局会自己接上。不用登录，没有每天三局的限制，也不用订阅。清单和进度关掉标签页也还留在这台设备上。',
    locale: 'zh_CN',
    // zh has its own card. It must NEVER fall back to the English one.
    image: 'https://playset.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    tagline: '只玩选好的游戏，自动下一局。仅此设备。',
    chips: {
      'chip-nologin': '无需登录',
      'chip-nolock': '没有3局限制',
      'chip-nosub': '无需订阅',
      'chip-allgames': '选好的都能玩',
      'chip-persist': '关掉标签也还在',
    },
  },
};

const SLUG = 'playset';
const ORIGIN = 'https://playset.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: Fetcher };

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
        .on('html', { element(el) { el.setAttribute('lang', lang); } })
        .on('title', { element(el) { el.setInnerContent(copy.title); } })
        .on('#local-only', { element(el) { el.setInnerContent(copy.localOnly); } })
        .on('h1#brand-title', { element(el) { el.setInnerContent(copy.title); } })
        .on('.ps-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
        });

      // The fail-fix, in the shell rather than only after React mounts.
      for (const [id, text] of Object.entries(copy.chips)) {
        rewriter = rewriter.on(`#${id}`, { element(el) { el.setInnerContent(text); } });
      }

      html = rewriter.transform(asset);
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
