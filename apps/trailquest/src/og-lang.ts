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
    title: '트레일퀘스트',
    description:
      '계정 없는 무료 가상 장거리 트레일 트래커. 오늘 실제로 걷거나 달린 거리(또는 폰의 걸음 수)를 적으면 퍼시픽 크레스트 트레일, 애팔래치아 트레일, 카미노 같은 루트 위에서 진행률이 올라가고 마일스톤이 하나씩 열립니다. 여러 루트를 오가도 진행이 지워지지 않고, 기록은 수정·삭제할 수 있으며, JSON 백업으로 새 폰에서도 그대로. 자동 추적 없음, 멤버십 없음, 생성형 AI 풍경 없음. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://trailquest.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. AI 생성 풍경 없음.',
    tagline: '무료 로컬 가상 장거리 트레일 트래커. 실제 마일/걸음을 기록해 PCT·AT급 루트를 진행. 마일스톤·스트릭·JSON 백업. 계정 없음. AI 아트 없음.',
  },
  en: {
    title: 'Trailquest',
    description:
      "Free virtual long-trail tracker with no account. Type in the distance you actually walked or ran today (or paste your phone's step count) and watch your progress climb along the Pacific Crest Trail, the Appalachian Trail, the Camino and more, unlocking milestones as you go. Switch between routes without losing anything, edit or delete any entry, and carry it all to a new phone with a JSON backup. No auto-tracking, no membership, no generative AI landscapes. Data stays on this device.",
    locale: 'en_US',
    image: 'https://trailquest.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers. No generative AI landscapes.',
    tagline: 'Free local virtual trail tracker. Log real miles toward PCT/AT-class routes. Milestones, streaks, JSON backup. No account. No AI art.',
  },
  ja: {
    title: 'トレイルクエスト',
    description:
      'アカウント不要の無料仮想ロングトレイル記録。今日実際に歩いたり走ったりした距離（またはスマホの歩数）を入れると、パシフィック・クレスト・トレイルやアパラチアン・トレイル、カミーノなどのルート上で進捗が伸び、マイルストーンが順に開きます。ルートを切り替えても進捗は消えず、記録はいつでも編集・削除でき、JSONバックアップで新しい端末にもそのまま。自動トラッキングなし、会員制なし、生成AIの風景なし。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://trailquest.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。生成AIの風景画像はありません。',
    tagline: '無料のローカル仮想ロングトレイル記録。実際のマイルや歩数をPCT・AT級ルートの進捗に。マイルストーン、連続記録、JSONバックアップ。アカウント不要。AIアートなし。',
  },
  zh: {
    title: '步道征途',
    description:
      '无需账号的免费虚拟长途步道追踪。把今天真实走过或跑过的距离（或手机的步数）记进来，进度就会沿着太平洋屋脊步道、阿巴拉契亚步道、朝圣之路等路线向前，一个个里程碑随之解锁。切换路线不会丢进度，任何记录都能修改或删除，JSON 备份带到新手机照样恢复。无自动追踪，无会员制，无生成式 AI 风景。数据仅保存在此设备。',
    locale: 'zh_CN',
    image: 'https://trailquest.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。无生成式 AI 风景图。',
    tagline: '免费本地虚拟长途步道追踪。把真实里程/步数记到 PCT/AT 级路线进度。里程碑、连续打卡、JSON 备份。无需账号。无 AI 绘图。',
  },
};

const SLUG = 'trailquest';
const ORIGIN = 'https://trailquest.try-dabble.com';
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
 * say "Trailquest", so the Worker rewrites name / lang / start_url per request.
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
        .on('.tq-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
      .on('head', {
        element(el) {
          // Shared Naver Search Advisor verification (packages/seo).
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
