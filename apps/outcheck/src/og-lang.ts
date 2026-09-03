/**
 * Runs ahead of the assets binding on every request (run_worker_first) so the
 * FIRST HTML already carries the requested language. Crawlers do not run JS:
 * ?lang=en must not hand them the Korean default.
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
  }
> = {
  ko: {
    title: '나갔어체크',
    description:
      '외출 전 문·가스·차고 확인 체크리스트. 한 번 누르면 오늘 확인한 시각이 남고, 자정에 모두 리셋됩니다. 계정 없음, 광고 없음, 항목 무제한, 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://outcheck.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    tagline: '문·가스·차고를 원탭으로 확인하고 자정에 리셋. 계정·광고 없음.',
  },
  en: {
    title: 'Outcheck',
    description:
      "A leave-home checklist for door, gas and garage. One tap stamps today's time on an item, and everything clears at midnight. No account, no ads, unlimited items, data on this device only.",
    locale: 'en_US',
    image: 'https://outcheck.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    tagline: 'One-tap door, gas, and garage checks that reset at midnight. No account, no ads.',
  },
  ja: {
    title: '外出チェック',
    description:
      '外出前のドア・ガス・ガレージ確認リスト。1回タップで今日の確認時刻が残り、0時にすべてリセットされます。アカウントなし、広告なし、項目は無制限、データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://outcheck.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    tagline: 'ドア・ガス・ガレージをワンタップ。毎日0時にリセット。アカウントも広告もなし。',
  },
  zh: {
    title: '出门核对',
    description:
      '出门前的门锁、燃气、车库核对清单。点一下就记下今天的确认时间，零点全部清零。无账号，无广告，条目不限，数据仅在此设备。',
    locale: 'zh_CN',
    image: 'https://outcheck.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    tagline: '一键确认门锁、燃气、车库，每天零点清零。无账号，无广告。',
  },
};

const SLUG = 'outcheck';
const ORIGIN = 'https://outcheck.try-dabble.com';
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
 * say "Outcheck", so the Worker rewrites name / lang / start_url per request.
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
        .on('.oc-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
