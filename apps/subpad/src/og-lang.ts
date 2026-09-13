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
    title: '섭패드',
    description:
      '은행 연동 없는 무료 로컬 구독·청구 기록. 구독마다 가격, 통화, 다음 갱신일, 결제 주기를 적으면 남은 날짜와 월·연 합계를 통화별로 보여 줍니다. 환율은 지어내지 않습니다. 넷플릭스·스포티파이·iCloud+·ChatGPT 같은 검색 가능한 템플릿과 카테고리, 앱에 내장된 브랜드 타일, 결제 완료·건너뛰기 기록, 검색·필터, JSON 백업, OS 알림용 달력(.ics) 내보내기. 목록 무제한. 계정 없음, 광고 없음. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://subpad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 은행 연동·로그인·광고 없음. 환율을 지어내지 않습니다.',
    tagline: '무료 로컬 구독·청구 기록. 가격과 다음 갱신일, 월·연 합계, 템플릿, 결제 기록, JSON 백업, 달력보내기. 은행 연동 없음. 계정 없음. 광고 없음.',
  },
  en: {
    title: 'Subpad',
    description:
      'Free local subscription and bill tracker with no bank link. Give each subscription a price, currency, next renewal and billing cycle and see days until renewal plus monthly and yearly totals per currency. No invented exchange rates. Searchable templates and categories for Netflix, Spotify, iCloud+, ChatGPT and more, brand tiles baked into the app, paid and skipped history, search and filters, JSON backup, and a calendar (.ics) export for OS reminders. Unlimited list. No account, no ads. Data stays on this device.',
    locale: 'en_US',
    image: 'https://subpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. No bank link. No login. No ads. We do not invent exchange rates.',
    tagline: 'Free local subscription tracker. Price, next renewal, monthly and yearly totals, templates, payment history, JSON backup, calendar export. No bank link. No account. No ads.',
  },
  ja: {
    title: 'サブパッド',
    description:
      '銀行連携のない無料ローカルサブスク・請求トラッカー。サブスクごとに料金、通貨、次回更新日、支払い周期を入れると、残り日数と通貨ごとの月・年合計が見えます。為替レートは作りません。Netflix・Spotify・iCloud+・ChatGPT などの検索できるテンプレとカテゴリ、アプリ内蔵のブランドタイル、支払い済み・スキップの履歴、検索とフィルタ、JSONバックアップ、OS のリマインダー向けカレンダー（.ics）出力。件数無制限。アカウント不要、広告なし。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://subpad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。銀行連携・ログイン・広告なし。為替レートは作りません。',
    tagline: '無料のローカルサブスク・請求トラッカー。料金と次回更新、月・年合計、テンプレ、支払い履歴、JSONバックアップ、カレンダー出力。銀行連携なし。アカウント不要。広告なし。',
  },
  zh: {
    title: '续费板',
    description:
      '无需银行连接的免费本地订阅/账单记录。为每个订阅填上价格、货币、下次续费日和付款周期，就能看到剩余天数以及按货币分开的月/年合计。不编造汇率。Netflix、Spotify、iCloud+、ChatGPT 等可搜索模板与分类，内置品牌图标，已付/跳过记录，搜索与筛选，JSON 备份，以及用于系统提醒的日历（.ics）导出。列表不限数量。无需账号，无广告。数据只留在此设备。',
    locale: 'zh_CN',
    image: 'https://subpad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备。无银行连接、无登录、无广告。我们不编造汇率。',
    tagline: '免费本地订阅/账单记录。价格与下次续费、月/年合计、模板、付款记录、JSON 备份、日历导出。无银行连接。无需账号。无广告。',
  },
};

const SLUG = 'subpad';
const ORIGIN = 'https://subpad.try-dabble.com';
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
 * say "Subpad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.sb-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
