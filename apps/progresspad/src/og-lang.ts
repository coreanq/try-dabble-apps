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
    title: '프로그레스패드',
    description:
      '로그인도 광고도 없는 무료 로컬 장기 과제 진행 기록. 논문, 자격증 공부, 사이드 프로젝트처럼 며칠·몇 주 걸리는 과제를 추가하고 목표를 시간(예: 40시간) 또는 퍼센트로 정합니다. 집중한 시간은 나중에 날짜와 분으로 직접 기록하면 됩니다. 실시간 타이머를 켜 둘 필요가 없고, 하루 빠져도 아무것도 시들거나 죽지 않습니다. 진행 막대와 합계, 선택적 식물·블록 스테이지, 과제별 기록 목록(수정·삭제), 선택적 간단 타이머, 여러 과제, JSON 내보내기·불러오기, 안드로이드와 모든 브라우저에서 되는 오프라인 PWA. 계정 없음, 광고 없음, 구독 없음. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://progresspad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 강제 타이머 없이 손으로 기록하면 됩니다.',
    tagline: '무료 로컬 장기 과제 진행 기록. 시간 또는 % 목표, 날짜별 집중 분 기록, 진행 막대. 선택적 식물·블록 스테이지 — 강제 타이머·시드는 나무 없음. 여러 과제, JSON 백업. 계정 없음. 광고 없음.',
  },
  en: {
    title: 'Progresspad',
    description:
      'A free local progress pad for tasks that take days or weeks, with no login and no ads. Add a thesis, an exam prep, a side project, and set the target in hours (say 40h) or in percent. Log the focus time afterwards by hand: a date and a number of minutes. No live timer has to run, and a missed day never wilts or resets anything. Progress bar and totals, an optional plant or blocks stage that only grows, a per-task log list you can edit or delete, an optional simple timer, several tasks, JSON export and import, and an offline PWA that works on Android and any browser. No account, no ads, no subscription. Data stays on this device.',
    locale: 'en_US',
    image: 'https://progresspad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. No login. No ads. Log by hand — no forced timer required.',
    tagline: 'Free local long-task progress pad. Set a target in hours or percent, log focus minutes by date, watch the bar fill. Optional gentle plant or blocks stage — no forced timer, no dying tree. Multi-task list, JSON backup. No account. No ads.',
  },
  ja: {
    title: 'プログレスパッド',
    description:
      'ログインも広告もない、数日・数週間かかるタスクのための無料ローカル進捗パッド。論文、試験勉強、サイドプロジェクトを追加し、目標を時間（例：40時間）またはパーセントで決めます。集中した時間は後から日付と分を手で記録するだけ。ライブタイマーを回す必要はなく、一日空いても何も枯れず、リセットもされません。進捗バーと合計、育つだけの任意の植物・ブロック演出、編集・削除できるタスクごとの記録一覧、任意の簡単タイマー、複数タスク、JSONのエクスポート・インポート、Androidとあらゆるブラウザで動くオフラインPWA。アカウント不要、広告なし、サブスクなし。データはこの端末だけに。',
    locale: 'ja_JP',
    image: 'https://progresspad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。ログイン・広告なし。強制タイマーなしで手入力で記録できます。',
    tagline: '無料のローカル長期タスク進捗パッド。時間または％の目標、日付ごとの集中分を記録、進捗バー。任意の植物・ブロック演出 — 強制タイマーも枯れる木もなし。複数タスク、JSONバックアップ。アカウント不要。広告なし。',
  },
  zh: {
    title: '进度板',
    description:
      '无登录、无广告的免费本地进度板，专为要花几天或几周的任务而做。添加论文、备考、副业项目，目标按小时（如 40 小时）或百分比设定。专注时间事后手动记录：一个日期加多少分钟。不必开着实时计时器，漏掉一天也不会枯萎或重置任何东西。进度条与合计、只会生长的可选植物/方块阶段、可编辑删除的每任务记录列表、可选简易计时器、多任务、JSON 导出导入，以及在 Android 和任何浏览器都能用的离线 PWA。无需账号、无广告、无订阅。数据仅保存在此设备。',
    locale: 'zh_CN',
    image: 'https://progresspad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备。无登录、无广告。可手记，无需强制计时器。',
    tagline: '免费本地长期任务进度板。按小时或百分比设目标，按日期记录专注分钟，进度条填充。可选温和植物/方块阶段 — 无强制计时器、无枯死树。多任务、JSON 备份。无需账号。无广告。',
  },
};

const SLUG = 'progresspad';
const ORIGIN = 'https://progresspad.try-dabble.com';
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
 * say "Progresspad", so the Worker rewrites name / lang / start_url per
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
