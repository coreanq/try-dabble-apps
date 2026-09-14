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
    title: '아워패드',
    description:
      '회사 시스템도 로그인도 없는 무료 로컬 근무 시간 기록. 출근 버튼으로 시작하고, 휴식은 따로 재고, 퇴근으로 끝냅니다. 세션마다 선택 작업명. 오늘의 근무·휴식 합계와 이번 주 근무 시간을 설정 가능한 주 목표(기본 40시간)와 비교합니다. 주가 끝나면 목표 대비 초과·부족분이 초과 근무 뱅크로 넘어가고, 홈에서 보고 직접 고칠 수 있습니다. 하루·주 기록, JSON 내보내기·불러오기, 오프라인 PWA. 탭을 뒤로 보내도 실제 시각으로 계산합니다. 계정 없음, 광고 없음. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://hourpad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 로그인·광고 없음. 휴식과 초과 근무 뱅크는 무료입니다.',
    tagline: '무료 로컬 근무 시간 기록. 출근·휴식·퇴근. 일·주 합계와 목표 시간. 초과 근무 뱅크가 다음 주로 넘어갑니다. JSON 백업. 계정 없음. 광고 없음.',
  },
  en: {
    title: 'Hourpad',
    description:
      "Free local work-hours tracker with no company system and no login. Check in to start, track breaks separately, check out to finish, with an optional task label per session. See today's work and break totals and this week's hours against a settable weekly target (default 40h). When a week ends, the surplus or shortfall against the target rolls into an overtime bank that is visible on the home screen and editable. Day and week history, JSON export and import, offline PWA. Totals stay honest after the tab goes to the background because elapsed time is computed from the wall clock. No account, no ads. Data stays on this device.",
    locale: 'en_US',
    image: 'https://hourpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. No login. No ads. Breaks and the overtime bank are free.',
    tagline: 'Free local work-hours tracker. Check in, take breaks, check out. Daily and weekly totals vs your target. Overtime bank rolls into next week. JSON backup. No account. No ads.',
  },
  ja: {
    title: 'アワーパッド',
    description:
      '会社のシステムもログインもいらない無料のローカル勤務時間トラッカー。出勤で開始、休憩は別に計測、退勤で終了。セッションごとに任意の作業名。今日の勤務・休憩合計と今週の勤務時間を、設定できる週目標（既定40時間）と比べます。週が終わると目標との差が残業バンクに繰り越され、ホームで見えて手で直せます。日・週の履歴、JSONの書き出し・読み込み、オフラインPWA。タブを裏に回しても実時刻で計算します。アカウント不要、広告なし。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://hourpad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。ログイン・広告なし。休憩と残業バンクは無料です。',
    tagline: '無料のローカル勤務時間トラッカー。出勤・休憩・退勤。日・週合計と目標時間。残業バンクは翌週へ繰り越し。JSONバックアップ。アカウント不要。広告なし。',
  },
  zh: {
    title: '工时板',
    description:
      '不用公司系统、不用登录的免费本地工时记录。按上班开始，休息单独计时，按下班结束，每段可选填任务名。查看今天的工作与休息合计，以及本周工时与可设置的周目标（默认 40 小时）的对比。一周结束时，相对目标的多出或不足会滚入加班库，首页可见并可手动修改。日/周历史，JSON 导出与导入，离线 PWA。标签页切到后台后合计依然按真实时间计算。无需账号，无广告。数据只留在此设备。',
    locale: 'zh_CN',
    image: 'https://hourpad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备。无登录、无广告。休息与加班库免费。',
    tagline: '免费本地工时记录。上班、休息、下班。日/周合计与目标工时。加班库滚入下周。JSON 备份。无需账号。无广告。',
  },
};

const SLUG = 'hourpad';
const ORIGIN = 'https://hourpad.try-dabble.com';
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
 * say "Hourpad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.hp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
