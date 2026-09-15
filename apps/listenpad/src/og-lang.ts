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
    title: '리슨패드',
    description:
      '로그인 없는 무료 로컬 언어 듣기 연습 플레이어. 이 기기의 오디오 파일을 하나 골라 재생하고, 1·2·3·4초 짧은 되감기 버튼 한 번으로 방금 지나간 문장을 다시 듣고, A–B 구간 반복으로 같은 부분을 반복하고, 0.5×부터 1.5×까지 배속을 바꾸고, 슬라이더로 위치를 옮깁니다. 파일 이름별 듣기 메모, 설정 자동 저장, JSON 백업, 오프라인 PWA 셸. 폰 화면에 맞춘 큰 버튼. 음악 라이브러리가 아니라 한 파일을 파고드는 연습용 플레이어입니다. 오디오는 업로드하지 않습니다. 계정 없음, 광고 없음, 유료 구독 없음.',
    locale: 'ko_KR',
    image: 'https://listenpad.try-dabble.com/og-image-ko.png',
    localOnly: '오디오와 메모는 이 기기에만 둡니다. 업로드·로그인·광고 없음. 되감기·구간반복·배속 모두 무료.',
    tagline: '무료 로컬 언어 듣기 플레이어. 한 탭 짧은 되감기, A–B 구간 반복, 배속. 이 기기에서 파일 선택. 계정 없음. 구독 없음.',
  },
  en: {
    title: 'Listenpad',
    description:
      'Free local language-listening practice player with no login. Pick one audio file on this device, then drill it: one-tap 1, 2, 3 or 4 second rewind to hear the phrase you just missed, A–B loop to repeat one passage, playback speed from 0.5× to 1.5×, and a scrubber with time labels. Listening notes per file name, settings saved automatically, JSON backup, offline PWA shell. Big buttons sized for a phone. A drill player for one file at a time, not a music library. Audio is never uploaded. No account, no ads, no paid subscription.',
    locale: 'en_US',
    image: 'https://listenpad.try-dabble.com/og-image-en.png',
    localOnly: 'Audio and notes stay on this device. No upload. No login. No ads. Rewind, A–B loop, and speed are free.',
    tagline: 'Free local language-listening player. One-tap short rewind, A–B loop, speed control. Pick a file on this device. No account. No subscription.',
  },
  ja: {
    title: 'リッスンパッド',
    description:
      'ログイン不要の無料ローカル語学リスニング練習プレーヤー。この端末の音声ファイルを一つ選び、1・2・3・4秒の短戻しボタンをワンタップして聞き逃した一文をもう一度、A–Bループで同じ箇所を繰り返し、0.5×から1.5×まで速度を変え、スライダーで位置を動かします。ファイル名ごとのリスニングメモ、設定の自動保存、JSONバックアップ、オフラインPWAシェル。スマホ画面に合わせた大きなボタン。音楽ライブラリではなく、一つのファイルを掘り下げる練習用プレーヤーです。音声はアップロードしません。アカウント不要、広告なし、有料サブスクなし。',
    locale: 'ja_JP',
    image: 'https://listenpad.try-dabble.com/og-image-ja.png',
    localOnly: '音声とメモはこの端末にだけ残ります。アップロード・ログイン・広告なし。戻し・A–Bループ・速度はすべて無料。',
    tagline: '無料のローカル語学リスニングプレーヤー。ワンタップ短戻し、A–Bループ、速度調整。この端末でファイルを選ぶだけ。アカウント不要。サブスクなし。',
  },
  zh: {
    title: '听力练习板',
    description:
      '无需登录的免费本地听力练习播放器。在本机选一个音频文件，然后反复练：一键回退 1、2、3 或 4 秒重听刚错过的那句，A–B 循环重复同一段，0.5× 到 1.5× 变速，带时间标签的进度条。按文件名保存听力笔记，设置自动保存，JSON 备份，离线 PWA 外壳。为手机屏幕设计的大按钮。这是一次专注一个文件的练习播放器，不是音乐库。音频绝不上传。无需账号，无广告，无付费订阅。',
    locale: 'zh_CN',
    image: 'https://listenpad.try-dabble.com/og-image-zh.png',
    localOnly: '音频和笔记仅留在此设备。无上传、无登录、无广告。回退、A–B 循环和变速全部免费。',
    tagline: '免费本地听力练习播放器。一键短回退、A–B 循环、变速。在本机选择文件。无需账号。无订阅。',
  },
};

const SLUG = 'listenpad';
const ORIGIN = 'https://listenpad.try-dabble.com';
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
 * say "Listenpad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.lnp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
