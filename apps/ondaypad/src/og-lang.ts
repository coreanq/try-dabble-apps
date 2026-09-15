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
    title: '온데이패드',
    description:
      '로그인도 광고도 없는 무료 로컬 향수 캘린더입니다. 원하는 달을 열어 날짜를 고르고 메모를 남기세요 — 그날의 기억, 못 찍은 사진 대신 남기는 한 줄, 날씨 이야기도 좋습니다. MM-DD(월-일)를 고르면 온데이패드가 그 날짜에 쓴 모든 해의 메모를 연도별 카드로 쌓아 보여줘서, "9월 15일에 무슨 일이 있었지"라는 질문에 짐작이 아니라 진짜 답을 줍니다. 내장된 날짜 이동으로 아무 달, 아무 해나 자유롭게 넘나들고, 하루에 메모를 여러 개 남길 수 있고, JSON으로 모두 내보내 두면 폰을 잃어버려도 기억은 사라지지 않습니다 — 어느 기기에서든 순서 상관없이 다시 불러올 수 있습니다. 안드로이드와 모든 브라우저에서 설치해 오프라인으로 쓸 수 있는 PWA입니다. 계정 없음, 광고 없음, 구독 없음. 데이터는 이 기기에만 남습니다.',
    locale: 'ko_KR',
    image: 'https://ondaypad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. JSON으로 백업하세요.',
    tagline: '무료 로컬 향수 캘린더. 월 그리드, 날짜별 메모, 같은 MM-DD의 여러 해 메모를 쌓아 보기. JSON 백업. 계정 없음. 광고 없음.',
  },
  en: {
    title: 'Ondaypad',
    description:
      "A free local nostalgia calendar app with no login and no ads. Open any month, click a day and write a note — a memory, a photo caption you didn't take, a line about the weather. Pick a MM-DD and Ondaypad stacks every note you've ever written for that calendar day, one card per year, so \"what happened on September 15th\" turns into an answer instead of a guess. Browse any month or year with the built-in date jump, keep several notes per day, and export everything to JSON so a lost phone is never the end of your memories — import it back on any device, in any order. Works offline as an installable PWA on Android and any browser. No account, no ads, no subscription. Data stays on this device.",
    locale: 'en_US',
    image: 'https://ondaypad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. No login. No ads. Export JSON so a lost phone is not the end.',
    tagline: 'Free local nostalgia calendar. Month grid, notes per day, and a "this day across years" stack for any MM-DD. JSON backup. No account. No ads.',
  },
  ja: {
    title: 'オンデイパッド',
    description:
      'ログインも広告もない、無料のローカル懐かしさカレンダーです。好きな月を開いて日付を選び、メモを残しましょう——その日の思い出、撮れなかった写真の代わりの一行、天気の話でもかまいません。MM-DD（月日）を選ぶと、オンデイパッドはその日付に書いたすべての年のメモを年ごとのカードに積み重ねて見せてくれるので、「9月15日に何があったっけ」という問いに推測ではなく本当の答えが返ってきます。内蔵の日付ジャンプで好きな月・好きな年へ自由に移動でき、一日に複数のメモを残すことができ、JSONにすべて書き出しておけば、スマホをなくしても思い出は消えません——どの端末でも順序に関係なく読み込み直せます。Androidとあらゆるブラウザでインストールしてオフラインで使えるPWAです。アカウント不要、広告なし、サブスクなし。データはこの端末だけに残ります。',
    locale: 'ja_JP',
    image: 'https://ondaypad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。ログイン・広告なし。JSONでバックアップしてください。',
    tagline: '無料のローカル懐かしさカレンダー。月グリッド、日付メモ、同じMM-DDの年ごとのメモを積み重ね表示。JSONバックアップ。アカウント不要。広告なし。',
  },
  zh: {
    title: '当日记事板',
    description:
      '无登录、无广告的免费本地怀旧日历。打开任意一个月，点选日期写下笔记——那天的回忆，一张没拍成的照片的说明，或者只是聊聊天气。选定一个 MM-DD（月-日），当日记事板就会把你在这个日期写过的所有年份的笔记按年份卡片堆叠展示，让“9 月 15 日那天发生了什么”不再是猜测，而是有据可查的答案。内置的日期跳转能让你自由穿梭任意月份和年份，一天可以写多条笔记，导出成 JSON 备份后，丢手机也不会丢掉回忆——在任何设备上都能按原样导回。支持在 Android 和任意浏览器上安装成离线可用的 PWA。无需账号、无广告、无订阅。数据只留在这台设备上。',
    locale: 'zh_CN',
    image: 'https://ondaypad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备。无登录、无广告。请用 JSON 备份，以免丢手机丢数据。',
    tagline: '免费本地怀旧日历。月网格、每日笔记，以及任意 MM-DD 的跨年笔记堆叠。JSON 备份。无需账号。无广告。',
  },
};

const SLUG = 'ondaypad';
const ORIGIN = 'https://ondaypad.try-dabble.com';
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
 * say "Ondaypad", so the Worker rewrites name / lang / start_url per
 * request. Unknown language falls back to English, not Korean.
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
        .on('.od-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
