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
    title: '자이맥',
    description:
      '계정 없는 무료 로컬 헬스 운동 기록 + 매크로 앱. 운동별 세트(중량×횟수)를 남기고, 개인 기록(최고 중량·추정 1RM)을 자동으로 찾고, Mifflin-St Jeor로 하루 칼로리와 단백질·탄수화물·지방 목표를 계산하고, 커스텀 음식으로 하루 매크로를 기록하고, 체중을 남기세요. 루틴·기록 무제한, 구독 벽 없음, 광고 없음, JSON 백업으로 재설치해도 안전. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://gymac.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    tagline: '무료 로컬 헬스·매크로 기록. 운동(세트×횟수×중량), 하루 칼로리·P/C/F, 체중, PR, 커스텀 음식, JSON 백업. 계정 없음. 광고 없음.',
  },
  en: {
    title: 'Gymac',
    description:
      'Free local gym workout log and macro tracker with no account. Log each exercise as sets of weight × reps, get personal records (heaviest set and estimated 1RM) found for you, compute daily calorie and protein / carb / fat targets with Mifflin–St Jeor, track daily macros with your own custom foods, and log weigh-ins. Unlimited routines and history, no subscribe wall, no ads, and a JSON backup that survives a reinstall. Data stays on this device.',
    locale: 'en_US',
    image: 'https://gymac.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    tagline: 'Free local gym + macro tracker. Log exercises (sets×reps×weight), daily calories and P/C/F, weigh-ins, PR history, custom foods, JSON backup. No account. No ads.',
  },
  ja: {
    title: 'ジャイマック',
    description:
      'アカウント不要の無料ローカルジム記録＆マクロ管理アプリ。種目ごとに重量×回数のセットを記録し、自己記録（最重量セットと推定1RM）を自動で検出、Mifflin–St Jeor式で1日のカロリーとタンパク質・炭水化物・脂質の目標を計算、自分で作った食品で1日のマクロを記録、体重も記録。ルーティンと履歴は無制限、サブスクの壁なし、広告なし、JSONバックアップで再インストールしても安心。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://gymac.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    tagline: '無料のローカルジム＆マクロ記録。種目（セット×回数×重量）、1日カロリーとP/C/F、体重、PR、カスタム食品、JSONバックアップ。アカウント不要。広告なし。',
  },
  zh: {
    title: '健身记',
    description:
      '无需账号的免费本地健身训练日志 + 宏量营养记录。按动作记录重量×次数的每一组，自动找出个人纪录（最重一组与估算 1RM），用 Mifflin–St Jeor 公式算出每日热量与蛋白质/碳水/脂肪目标，用自定义食物记录每日宏量，并记录体重。训练计划与历史不限，没有订阅墙，没有广告，JSON 备份重装也不丢。数据只留在此设备。',
    locale: 'zh_CN',
    image: 'https://gymac.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    tagline: '免费本地健身与宏量营养记录。记录动作（组×次数×重量）、每日热量与蛋白/碳/脂、体重、PR、自定义食物、JSON 备份。无需账号。无广告。',
  },
};

const SLUG = 'gymac';
const ORIGIN = 'https://gymac.try-dabble.com';
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
 * say "Gymac", so the Worker rewrites name / lang / start_url per request.
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
        .on('.gm-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
