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
    title: '타이머패드',
    description:
      '계정 없는 무료 로컬 타이머. 카운트다운, 포모도로 라운드, HIIT·타바타 인터벌, 스톱워치와 랩을 한 화면에서. 프리셋은 모두 편집할 수 있고, 루틴을 저장하고, 운동 중간에 멈추거나 리셋할 수 있습니다. 전체화면과 화면 켜짐, 짧은 알림음, 백그라운드에서도 드리프트를 보정한 시각. JSON 백업. 광고 없음, 결제 없음. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://timerpad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    tagline: '무료 로컬 HIIT·포모도로·스톱워치. 편집 가능한 프리셋, 랩, 루틴 저장, 전체화면·화면 켜짐, 소리, JSON 백업. 계정 없음. 광고 없음.',
  },
  en: {
    title: 'Timerpad',
    description:
      'Free local timer with no account. Countdown, Pomodoro rounds, HIIT and Tabata intervals, and a stopwatch with laps in one place. Every preset is editable, you can save routines, and you can stop or reset mid-workout. Fullscreen and wake lock, short cue sounds, drift-corrected time that keeps ticking when the tab is in the background as much as the browser allows. JSON backup. No ads, no payments. Data stays on this device.',
    locale: 'en_US',
    image: 'https://timerpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    tagline: 'Free local HIIT, Pomodoro and stopwatch. Editable presets, laps, saved routines, fullscreen and wake lock, sounds, JSON backup. No account. No ads.',
  },
  ja: {
    title: 'タイマーパッド',
    description:
      'アカウント不要の無料ローカルタイマー。カウントダウン、ポモドーロのラウンド、HIIT・タバタのインターバル、ラップ付きストップウォッチを一つの画面で。プリセットはすべて編集でき、ルーティンを保存でき、ワークアウトの途中でも停止やリセットができます。全画面と画面点灯、短い合図音、タブを裏に回してもブラウザが許す限り進む補正済みの時刻。JSONバックアップ。広告なし、課金なし。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://timerpad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    tagline: '無料のローカルHIIT・ポモドーロ・ストップウォッチ。編集できるプリセット、ラップ、ルーティン保存、全画面・画面点灯、音、JSONバックアップ。アカウント不要。広告なし。',
  },
  zh: {
    title: '计时板',
    description:
      '无需账号的免费本地计时器。倒计时、番茄钟轮次、HIIT 与 Tabata 间歇、带计圈的秒表都在同一屏。每个预设都能改，套路可以保存，训练中途也能停止或重置。全屏与保持亮屏、短提示音、标签页在后台时也会尽量按真实时间走。JSON 备份。无广告，无付费。数据只留在此设备。',
    locale: 'zh_CN',
    image: 'https://timerpad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    tagline: '免费本地 HIIT、番茄钟与秒表。可编辑预设、计圈、保存套路、全屏与保持亮屏、提示音、JSON 备份。无需账号。无广告。',
  },
};

const SLUG = 'timerpad';
const ORIGIN = 'https://timerpad.try-dabble.com';
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
 * say "Timerpad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.tp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
