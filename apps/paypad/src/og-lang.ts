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
    title: '페이패드',
    description:
      '무료 로컬 비정기 수입 봉투 예산 앱. 프리랜서·긱·부업 수입이 들어올 때마다 기록하면 %·고정 봉투(저축·부채·고정비·적립·자유)가 즉시 다시 계산됩니다. 이름 있는 급여 플랜 여러 개(이름 변경·복제·삭제), 격주·월·비정기 수입 모드, 통화별 합계(환율 지어내지 않음), 남는 돈은 버퍼로, 월·연 보기, JSON 백업. 봉투 개수 무제한, Plus 결제 없음, 계정 없음, 광고 없음. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://paypad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 봉투 개수 제한과 Plus 결제 없음.',
    tagline: '무료 로컬 비정기 수입 봉투 예산. 들어온 수입을 기록하고 %·고정 봉투로 나눕니다. 월·연 보기. 수입 추가 시 자동 재계산. JSON 백업. 계정 없음. 광고 없음.',
  },
  en: {
    title: 'Paypad',
    description:
      'Free local envelope budget for irregular income. Log freelance, gig or side earnings as they land and your % or fixed envelopes (savings, debt, bills, sinking, flexible) recompute instantly. Several named paycheck plans (rename, duplicate, delete), biweekly / monthly / irregular income modes, totals per currency with no invented FX, leftover to a buffer, monthly and annual views, JSON backup. Unlimited envelopes, no Plus paywall, no account, no ads. Data stays on this device.',
    locale: 'en_US',
    image: 'https://paypad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. No login. No ads. Unlimited envelopes — no Plus paywall.',
    tagline: 'Free local irregular-income envelope budget. Log earnings as they land, split into % or fixed envelopes, monthly and annual views. Auto-recomputes when you add income. JSON backup. No account. No ads.',
  },
  ja: {
    title: 'ペイパッド',
    description:
      '不定期収入のための無料ローカル封筒予算アプリ。フリーランス・ギグ・副業の入金をその都度記録すると、％または定額の封筒（貯蓄・返済・固定費・積立・自由）が即座に再計算されます。名前付きの給与プランを複数（名前変更・複製・削除）、隔週・月次・不定期の収入モード、通貨ごとの合計（為替は作らない）、余りはバッファへ、月次・年次表示、JSONバックアップ。封筒数無制限、Plus課金なし、アカウント不要、広告なし。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://paypad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。ログイン・広告なし。封筒数の上限もPlus課金もありません。',
    tagline: '無料のローカル不定期収入エンベロープ予算。入金を記録し％または定額で振り分け。月次・年次表示。収入追加で自動再計算。JSONバックアップ。アカウント不要。広告なし。',
  },
  zh: {
    title: '薪资信封板',
    description:
      '面向不定期收入的免费本地信封预算应用。自由职业、零工或副业收入到账就记一笔，百分比或固定额信封（储蓄、还债、账单、专项、灵活）立即重新计算。多个命名薪资计划（重命名、复制、删除），双周/月薪/不定期收入模式，按货币分开合计（不编造汇率），余额进入缓冲，月/年视图，JSON 备份。信封数量不限，无 Plus 付费墙，无需账号，无广告。数据仅在此设备。',
    locale: 'zh_CN',
    image: 'https://paypad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备。无登录、无广告。信封数量不限，无 Plus 付费墙。',
    tagline: '免费本地不定期收入信封预算。到账即记，按百分比或固定额分入信封，月/年视图。加收入自动重算。JSON 备份。无需账号。无广告。',
  },
};

const SLUG = 'paypad';
const ORIGIN = 'https://paypad.try-dabble.com';
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
 * say "Paypad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.pp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
