/**
 * Runs before the assets binding (run_worker_first) so the FIRST HTML already
 * carries the requested ?lang=. Crawlers never run JS.
 */

type Lang = 'ko' | 'en' | 'ja' | 'zh';

type Copy = {
  title: string;
  description: string;
  tagline: string;
  locale: string;
  image: string;
  localOnly: string;
  chips: [string, string, string, string, string, string, string, string];
};

const COPY: Record<Lang, Copy> = {
  ko: {
    title: '믹선반',
    description:
      '책·게임·영화·TV를 한 선반에 모아 두고, 내가 만든 태그로 골라 보는 개인 도서관. 바코드도 카탈로그 계정도 없고, 제목을 직접 적습니다. 로그인·구독·유형별 무료 한도 없이 이 기기에만 저장되며 JSON으로 내보내기와 가져오기가 됩니다.',
    tagline: '책·게임·영화·TV를 한 선반에. 내가 만든 태그로 골라 본다. 계정 없음.',
    locale: 'ko_KR',
    image: 'https://mixshelf.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    chips: [
      '로그인 없음',
      '구독/캡 없음',
      '책·게임·영화·TV 한 선반',
      '커스텀 다중 태그',
      '태그·유형 필터',
      '수동 제목',
      '이 기기 저장',
      'JSON 내보내기/가져오기',
    ],
  },
  en: {
    title: 'Mixshelf',
    description:
      'A personal library for books, games, movies and TV on one shelf, with your own multi-tags and smooth filters. Manual titles — no barcode or catalog login. No subscription, no per-type free-tier lock. Stays on this device; export and import JSON anytime.',
    tagline: 'Books, games, movies, and TV on one shelf. Filter by your own tags. No account.',
    locale: 'en_US',
    image: 'https://mixshelf.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    chips: [
      'No login',
      'No sub/cap',
      'Books+games+movies+TV',
      'Custom multi-tags',
      'Filter by tag & type',
      'Manual titles',
      'On this device',
      'JSON export/import',
    ],
  },
  ja: {
    title: 'ミックス棚',
    description:
      '本・ゲーム・映画・テレビを一つの棚にまとめ、自分で付けたタグで絞り込む個人ライブラリ。バーコードもカタログ用アカウントも不要で、タイトルは手入力。ログイン・定額・種類ごとの無料上限なし。この端末だけに残り、JSONで書き出し・読み込みできます。',
    tagline: '本・ゲーム・映画・テレビを一つの棚に。自分のタグで絞り込み。アカウント不要。',
    locale: 'ja_JP',
    image: 'https://mixshelf.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    chips: [
      'ログインなし',
      '定額・上限なし',
      '本・ゲーム・映画・TV',
      '自由な複数タグ',
      'タグ・種類フィルタ',
      '手入力タイトル',
      'この端末に保存',
      'JSON書き出し/読み込み',
    ],
  },
  zh: {
    title: '混架',
    description:
      '把书、游戏、电影和剧集放在同一层架，用自己创建的多标签轻松筛选。手动输入标题，无需条码或目录账号。无订阅、无按类型的免费上限。数据留在此设备，可随时导出/导入 JSON。',
    tagline: '书、游戏、电影、剧集放在同一层架。用自己的标签筛选。无需账号。',
    locale: 'zh_CN',
    image: 'https://mixshelf.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    chips: [
      '无需登录',
      '无订阅/上限',
      '书·游戏·电影·剧集',
      '自定义多标签',
      '按标签与类型筛选',
      '手动标题',
      '仅此设备',
      'JSON 导出/导入',
    ],
  },
};

const CHIP_IDS = [
  '#chip-nologin',
  '#chip-nocap',
  '#chip-multitype',
  '#chip-tags',
  '#chip-filter',
  '#chip-manual',
  '#chip-persist',
  '#chip-json',
] as const;

const SLUG = 'mixshelf';
const ORIGIN = 'https://mixshelf.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

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

    // Lang-aware web manifest name
    if (url.pathname === '/manifest.webmanifest' || url.pathname === '/manifest.json') {
      const lang = pickLang(request, url) || 'ko';
      const copy = COPY[lang];
      const manifest = {
        name: copy.title,
        short_name: copy.title,
        description: copy.tagline,
        start_url: `/?lang=${lang}`,
        display: 'standalone',
        background_color: '#f6f0e6',
        theme_color: '#6b4f3a',
        lang,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      };
      return new Response(JSON.stringify(manifest), {
        headers: {
          'content-type': 'application/manifest+json; charset=utf-8',
          'cache-control': 'public, max-age=3600',
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
        .on('.ms-tagline', {
          element(el) {
            el.setInnerContent(copy.tagline);
          },
        })
        .on('#link-privacy', { element(el) { el.setAttribute('href', `https://try-dabble.com/privacy?lang=${lang}`); } })
        .on('#link-terms', { element(el) { el.setAttribute('href', `https://try-dabble.com/terms?lang=${lang}`); } });

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
