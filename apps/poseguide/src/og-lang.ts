/**
 * Runs ahead of the assets binding on every request (run_worker_first) so the
 * FIRST HTML already carries the requested language. Crawlers do not run JS:
 * ?lang=en must not hand them the Korean default.
 *
 * Order: ?lang= wins, then the shared td_lang cookie so hops between
 * try-dabble subdomains keep the chosen language. src/lib/i18n.ts resolves the
 * mounted app the same way, so the served HTML and React never disagree.
 *
 * Ad-free on purpose: nothing here injects AdSense. /ads.txt and /app-ads.txt
 * are still served so the publisher id is consistent across the property.
 */
type Lang = 'ko' | 'en' | 'ja' | 'zh';

export const COPY: Record<
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
    title: '포즈가이드',
    description:
      '설치 없는 포즈 코치. 포즈 라이브러리에서 고르면 카메라 위에 실루엣이 겹쳐지고, 매치 점수와 음성 팁이 자세를 잡아 줍니다. 전·후면 카메라, 촬영은 이 기기에만 저장. 핵심 포즈 전부 무료, 구독 없음, 계정 없음.',
    locale: 'ko_KR',
    image: 'https://poseguide.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. 클라우드 AI·장면 인식 없음.',
    tagline: '설치 없는 포즈 코치. 포즈 라이브러리, 실루엣 오버레이, 매치 점수, 음성 팁, 촬영. 전·후면. 핵심 포즈 무료. 계정 없음.',
  },
  en: {
    title: 'Poseguide',
    description:
      'Free no-install pose coach. Pick a pose from the library, a silhouette floats over your camera, and a match score plus voice tips line you up. Front and rear camera, captures stay on this device. All core poses free, no subscription, no account.',
    locale: 'en_US',
    image: 'https://poseguide.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers. No cloud AI or scene detection.',
    tagline: 'Free no-install pose coach. Library, silhouette overlay, match score, voice tips, capture. Front & rear. Core poses free. No account.',
  },
  ja: {
    title: 'ポーズガイド',
    description:
      'インストール不要のポーズコーチ。ライブラリからポーズを選ぶとカメラにシルエットが重なり、マッチ得点と音声ヒントが姿勢を合わせてくれます。前後カメラ、撮影はこの端末にだけ保存。基本ポーズはすべて無料、サブスクなし、アカウント不要。',
    locale: 'ja_JP',
    image: 'https://poseguide.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。クラウドAI・シーン認識なし。',
    tagline: 'インストール不要のポーズコーチ。ライブラリ、シルエット重ね、マッチ得点、音声ヒント、撮影。前後カメラ。基本ポーズ無料。アカウント不要。',
  },
  zh: {
    title: '姿势指南',
    description:
      '免安装姿势教练。从姿势库里挑一个，轮廓就叠在取景画面上，匹配分数和语音提示帮你摆好。前后摄像头，拍下的照片只留在此设备。核心姿势全部免费，无订阅，无需账号。',
    locale: 'zh_CN',
    image: 'https://poseguide.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。无云端 AI，无场景识别。',
    tagline: '免安装姿势教练。姿势库、轮廓叠加、匹配分数、语音提示、拍照。前后摄像头。核心姿势免费。无需账号。',
  },
};

const SLUG = 'poseguide';
const ORIGIN = 'https://poseguide.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

export function pickLang(request: Request, url: URL): Lang | null {
  const q = url.searchParams.get('lang');
  if (q && LANGS.has(q)) return q as Lang;
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/);
  if (m && LANGS.has(m[1])) return m[1] as Lang;
  return null;
}

/**
 * The shipped manifest is Korean. Installed as a PWA from ?lang=en it must
 * say "Poseguide", so the Worker rewrites name / lang / start_url per request.
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
        .on('.pg-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
    // no matter what the client bundle does to the shell. Link only: the app
    // ships no in-page feedback panel of its own.
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
