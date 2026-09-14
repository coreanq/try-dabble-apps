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
 * Nothing here ever hears a recording: audio never leaves the tab.
 */
import { NAVER_META_HTML } from '../../../packages/seo/naver.ts';
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
    title: '렉패드',
    description:
      '설치 없이 쓰는 무료 로컬 연습 녹음기. 마이크로 기타·연습 테이크를 녹음하고 파형을 보며 구간을 선택해 자르거나 삭제하고, 노이즈 정리와 게인·노멀라이즈를 적용하고, 되돌리기로 실수를 되돌립니다. WAV와 MP3로 내려받고, 초안은 이 기기에만 저장됩니다. 녹음·처리·내보내기 모두 이 기기에서만. 계정 없음, 업로드 없음, 광고 없음, 구독 없음.',
    locale: 'ko_KR',
    image: 'https://recpad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 녹음과 처리는 이 기기에서만 이루어지며 서버로 보내지 않습니다. 구독·광고 없음.',
    tagline: '무료 로컬 연습 녹음. 마이크 녹음, 노이즈 정리, 자르기, 게인, WAV·MP3 내보내기. 초안은 이 기기에만. 계정 없음. 업로드 없음.',
  },
  en: {
    title: 'Recpad',
    description:
      'Free local practice recorder with nothing to install. Record guitar or practice takes from the mic, see the waveform, select a region to trim or cut, clean noise, apply gain or normalize, and undo mistakes. Download as WAV or MP3 and keep drafts on this device. Recording, processing and export all happen on this device. No account, no upload, no ads, no subscription.',
    locale: 'en_US',
    image: 'https://recpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your recordings stay on this device. Noise clean and export run here — nothing is sent to our servers. No subscription. No ads.',
    tagline: 'Free local practice recorder. Mic record, noise clean, trim, gain, export WAV or MP3. Drafts stay on this device. No account. No upload.',
  },
  ja: {
    title: 'レックパッド',
    description:
      'インストール不要の無料ローカル練習レコーダー。マイクでギターや練習テイクを録音し、波形を見ながら範囲を選んでトリムやカット、ノイズ除去、ゲインやノーマライズを適用し、失敗は元に戻せます。WAVやMP3でダウンロードし、下書きはこの端末にだけ保存。録音・処理・書き出しはすべてこの端末だけ。アカウント不要、アップロードなし、広告なし、サブスクなし。',
    locale: 'ja_JP',
    image: 'https://recpad.try-dabble.com/og-image-ja.png',
    localOnly: '録音と処理はこの端末だけで、サーバーには送りません。サブスク・広告なし。',
    tagline: '無料のローカル練習レコーダー。マイク録音、ノイズ除去、トリム、ゲイン、WAV/MP3書き出し。下書きはこの端末だけ。アカウント不要。アップロードなし。',
  },
  zh: {
    title: '录音板',
    description:
      '免安装的免费本地练习录音机。用麦克风录下吉他或练习片段，看着波形选中区域裁剪或删除，做降噪、增益或标准化，出错可撤销。导出为 WAV 或 MP3，草稿只留在本机。录制、处理、导出都只在此设备完成。无需账号，不上传，无广告，无订阅。',
    locale: 'zh_CN',
    image: 'https://recpad.try-dabble.com/og-image-zh.png',
    localOnly: '录音与处理仅在此设备完成，不会上传到服务器。无订阅、无广告。',
    tagline: '免费本地练习录音。麦克风录制、降噪、裁剪、增益，导出 WAV 或 MP3。草稿只留在本机。无需账号。不上传。',
  },
};

const SLUG = 'recpad';
const ORIGIN = 'https://recpad.try-dabble.com';
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
 * say "Recpad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.rp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
              el.setAttribute('href', `/manifest.webmanifest?lang=${lang}`);
            }
          },
        })
        .transform(asset);
    }

    return new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append(NAVER_META_HTML, { html: true });
        },
      })
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
