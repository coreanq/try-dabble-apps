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
    notMedical: string;
  }
> = {
  ko: {
    title: '펩타이드로그',
    description:
      '계정 없는 무료 로컬 펩타이드·주사 기록 앱. 화합물을 개수 제한 없이 등록하고, 바이알 mg와 주사용수 mL로 농도와 주사기 눈금을 계산(산술만)하고, 용량·시간·부위·메모를 남기세요. 어느 날짜든 기록·수정·삭제, 바이알 재고와 부족 경고, 여러 프로토콜 스케줄, 부위 로테이션 추천, JSON 백업. 구독 함정도 광고도 없습니다. 데이터는 이 기기에만. 의료 조언이 아닙니다.',
    locale: 'ko_KR',
    image: 'https://peptidelog.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다. 의료 조언이 아닙니다.',
    tagline: '무료 로컬 펩타이드·주사 기록. 화합물, 재구성 계산, 용량 로그, 바이알 재고, 스케줄, 부위 로테이션, JSON 백업. 계정 없음. 의료 조언 아님.',
    notMedical: '의료 조언이 아닙니다. 계산기는 산술만 제공합니다. 용량·용법은 의료 전문가와 상의하세요.',
  },
  en: {
    title: 'Peptidelog',
    description:
      'Free local peptide and injection tracker with no account. Add unlimited compounds, turn vial mg and bacteriostatic water mL into concentration and syringe units (arithmetic only), and log dose, time, site and notes. Log, edit or delete on any day, track vial inventory with a low-stock warning, run several protocol schedules, get a site-rotation suggestion, and keep a JSON backup. No subscribe wall, no ads. Data stays on this device. Not medical advice.',
    locale: 'en_US',
    image: 'https://peptidelog.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers. Not medical advice.',
    tagline: 'Free local peptide & injection tracker. Compounds, reconstitution calc, dose log, vial inventory, schedules, site rotation, JSON backup. No account. Not medical advice.',
    notMedical: 'Not medical advice. The calculator does arithmetic only. Discuss dosing with a qualified clinician.',
  },
  ja: {
    title: 'ペプチドログ',
    description:
      'アカウント不要の無料ローカルペプチド・注射記録アプリ。化合物を数の制限なく登録し、バイアルmgと注射用水mLから濃度と注射器の目盛りを計算（算術のみ）し、用量・時刻・部位・メモを残せます。どの日でも記録・編集・削除、バイアル在庫と残量少警告、複数プロトコルのスケジュール、部位ローテーション提案、JSONバックアップ。サブスクの罠も広告もありません。データはこの端末だけ。医療助言ではありません。',
    locale: 'ja_JP',
    image: 'https://peptidelog.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。医療助言ではありません。',
    tagline: '無料のローカルペプチド・注射記録。化合物、再構成計算、用量ログ、バイアル在庫、スケジュール、部位ローテーション、JSONバックアップ。アカウント不要。医療助言ではありません。',
    notMedical: '医療助言ではありません。計算機は算術のみです。用量・用法は医療専門家に相談してください。',
  },
  zh: {
    title: '肽记录',
    description:
      '无需账号的免费本地肽类与注射记录应用。化合物数量不限，用药瓶 mg 和抑菌水 mL 算出浓度和注射器刻度（仅做算术），记录剂量、时间、部位和备注。任意日期都能记录、修改、删除，药瓶库存有低库存提醒，可同时跑多个方案日程，提供部位轮换建议，支持 JSON 备份。没有订阅墙，没有广告。数据仅保存在此设备。非医疗建议。',
    locale: 'zh_CN',
    image: 'https://peptidelog.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。非医疗建议。',
    tagline: '免费本地肽类与注射记录。化合物、复溶计算、剂量日志、药瓶库存、日程、部位轮换、JSON 备份。无需账号。非医疗建议。',
    notMedical: '非医疗建议。计算器仅做算术。剂量与用法请咨询合格医护人员。',
  },
};

const SLUG = 'peptidelog';
const ORIGIN = 'https://peptidelog.try-dabble.com';
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
 * say "Peptidelog", so the Worker rewrites name / lang / start_url per request.
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
        .on('#not-medical', { element(el) { el.setInnerContent(copy.notMedical); } })
        .on('h1#brand-title', { element(el) { el.setInnerContent(copy.title); } })
        .on('.pl-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
