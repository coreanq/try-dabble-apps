/**
 * Runs ahead of the assets binding on every request (run_worker_first) so the
 * FIRST HTML already carries the requested language. Crawlers do not run JS:
 * ?lang=en must not hand them the Korean default.
 *
 * Order: ?lang= wins, then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language. src/lib/i18n.ts resolves the
 * mounted app the same way, so the served HTML and React never disagree.
 *
 * Ad-free: no AdSense script is ever injected here or in index.html. The
 * /ads.txt and /app-ads.txt answers only keep the try-dabble property
 * consistent across subdomains.
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
  }
> = {
  ko: {
    title: '로컬플레이',
    description:
      '기기 안의 MP3·오디오 파일을 골라 넣는 로컬 음악 플레이어. 곡·앨범·아티스트 보기, 재생목록, 대기열, 즐겨찾기, 셔플·반복, 이퀄라이저와 재생 속도. 오프라인 재생, 계정 없음, 구독 없음, 재생 중 광고 없음, 곡 수 제한 없음, 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://localplay.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    tagline: '내 MP3를 골라 라이브러리로. 재생목록·셔플·반복. 로그인·구독·광고 없음.',
  },
  en: {
    title: 'Localplay',
    description:
      'An on-device music player for the MP3 and audio files you already own. Tracks, albums and artists views, playlists, a queue, favorites, shuffle and repeat, an equalizer and playback speed. Plays offline, no account, no subscription, no ads during playback, no track cap, data on this device only.',
    locale: 'en_US',
    image: 'https://localplay.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    tagline: 'Pick local MP3s into a library. Playlists, shuffle, repeat. No login, no subscription, no ads.',
  },
  ja: {
    title: 'ローカルプレイ',
    description:
      '端末内のMP3・音声ファイルを選んで入れるローカル音楽プレイヤー。曲・アルバム・アーティスト表示、プレイリスト、キュー、お気に入り、シャッフル・リピート、イコライザーと再生速度。オフライン再生、アカウントなし、サブスクなし、再生中の広告なし、曲数制限なし、データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://localplay.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    tagline: '端末のMP3を選んでライブラリに。プレイリスト・シャッフル・リピート。ログインも課金も広告もなし。',
  },
  zh: {
    title: '本地播放',
    description:
      '把设备里的 MP3 和音频文件选进来的本地音乐播放器。曲目、专辑、歌手视图，播放列表，队列，收藏，随机和循环，均衡器和播放速度。离线播放，无账号，无订阅，播放时无广告，曲目不限，数据仅在此设备。',
    locale: 'zh_CN',
    image: 'https://localplay.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    tagline: '把手机里的 MP3 选进曲库。播放列表、随机、循环。无需登录，无订阅，无广告。',
  },
};

const SLUG = 'localplay';
const ORIGIN = 'https://localplay.try-dabble.com';
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

/**
 * The shipped manifest is Korean. Installed as a PWA from ?lang=en it must
 * say "Localplay", so the Worker rewrites name / lang / start_url per request.
 * Unknown language falls back to English, not Korean.
 */
export function localizeManifest(manifest: Record<string, unknown>, lang: Lang): Record<string, unknown> {
  const copy = COPY[lang];
  return {
    ...manifest,
    name: copy.title,
    short_name: copy.title,
    description: copy.tagline,
    lang,
    start_url: `/?lang=${lang}`,
  };
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

    if (url.pathname === '/manifest.webmanifest') {
      const lang = pickLang(request, url) ?? 'en';
      const raw = await env.ASSETS.fetch(new Request(`${url.origin}/manifest.webmanifest`, { method: 'GET' }));
      if (!raw.ok) return raw;
      let manifest: Record<string, unknown>;
      try {
        manifest = (await raw.json()) as Record<string, unknown>;
      } catch {
        return raw;
      }
      return new Response(JSON.stringify(localizeManifest(manifest, lang), null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'public, max-age=0, must-revalidate',
          Vary: 'Cookie',
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
      html = new HTMLRewriter()
        .on('html', { element(el) { el.setAttribute('lang', lang); } })
        .on('title', { element(el) { el.setInnerContent(copy.title); } })
        .on('#local-only', { element(el) { el.setInnerContent(copy.localOnly); } })
        .on('h1#brand-title', { element(el) { el.setInnerContent(copy.title); } })
        .on('.lp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
            const rel = (el.getAttribute('rel') || '').toLowerCase();
            if (rel === 'canonical') {
              el.setAttribute('href', shareUrl);
            } else if (rel === 'manifest') {
              // Manifest fetches omit cookies, so the language rides on the URL.
              el.setAttribute('href', `/manifest.webmanifest?lang=${lang}`);
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
