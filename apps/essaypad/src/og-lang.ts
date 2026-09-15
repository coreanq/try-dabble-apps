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
    title: '에세이패드',
    description:
      '로그인도 구독도 없는 무료 로컬 단어 진행 기록. 에세이·논문·소설 등 어떤 글쓰기 프로젝트든 추가하고 목표 단어 수와 선택 마감일을 정합니다. 글은 Docs·Word·Notion이나 종이에 쓰고, 돌아와서 새 합계만 입력하세요. 잊었다면 지난 날짜로도 기록할 수 있습니다. 진행 막대, 퍼센트, 남은 단어 수와 함께 남은 단어 ÷ 남은 집필일로 계산한 하루 목표를 보여 주며, 모든 날 또는 평일만 셀 수 있습니다. 목표의 110%를 넘으면 경고가 뜹니다. 날짜별 달력 기록, 여러 에세이, JSON 내보내기·불러오기, 안드로이드와 모든 브라우저에서 되는 오프라인 PWA. 계정 없음, 광고 없음, 앱 내 결제 없음. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://essaypad.try-dabble.com/og-image-ko.png',
    localOnly: '에세이 데이터는 이 기기에만 저장됩니다. 로그인·광고·구독 없음. 에세이 개수 제한 없이 무료입니다.',
    tagline: '무료 로컬 에세이·프로젝트 단어 진행 기록. 목표 단어 수와 선택 마감일을 정하고, 쓴 단어 수를 직접 입력하면 진행률과 하루 목표가 보입니다. 주말 제외 옵션. JSON 백업. 계정 없음. 구독 없음.',
  },
  en: {
    title: 'Essaypad',
    description:
      'Free local word-progress tracker for essays, theses, novels and any writing project, with no login and no subscription. Add an essay, set a target word count and an optional deadline. You write in Docs, Word, Notion or on paper; come back and enter the new total, back-dated to any day if you forgot. See a progress bar, the percentage and the words still to go, plus a daily target computed from the remaining words and the write days left, counting all days or weekdays only. A warning appears when you pass 110% of the target. Per-day calendar history, several essays, JSON export and import, offline PWA that works on Android and any browser. No account, no ads, nothing to buy in the app. Data stays on this device.',
    locale: 'en_US',
    image: 'https://essaypad.try-dabble.com/og-image-en.png',
    localOnly: 'Your essays stay on this device. No login. No ads. No subscription. Unlimited essays are free.',
    tagline: 'Free local essay & project word-progress tracker. Set a target, optional deadline, update words written by hand, see progress and daily pace. Weekend-aware write days. JSON backup. No account. No subscription.',
  },
  ja: {
    title: 'エッセイパッド',
    description:
      'ログインもサブスクもいらない無料のローカル語数進捗トラッカー。エッセイ・論文・小説などどんな執筆プロジェクトでも追加し、目標語数と任意の締切を決めます。文章は Docs・Word・Notion や紙に書き、戻って新しい合計を入力するだけ。忘れた日は過去の日付でも記録できます。進捗バー、パーセント、残り語数に加え、残り語数 ÷ 残り執筆日で計算した一日の目標を表示し、全ての日か平日だけかを選べます。目標の110%を超えると警告が出ます。日ごとのカレンダー履歴、複数のエッセイ、JSONの書き出し・読み込み、Android でもどのブラウザでも動くオフラインPWA。アカウント不要、広告なし、アプリ内課金なし。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://essaypad.try-dabble.com/og-image-ja.png',
    localOnly: 'エッセイのデータはこの端末にだけ保存されます。ログイン・広告・サブスクなし。エッセイ数は無制限で無料です。',
    tagline: '無料のローカル エッセイ・プロジェクト語数進捗トラッカー。目標語数と任意の締切を決め、書いた語数を手で更新すると進捗と一日のペースが見えます。週末を除く執筆日設定。JSONバックアップ。アカウント不要。サブスクなし。',
  },
  zh: {
    title: '作文进度板',
    description:
      '不用登录、没有订阅的免费本地字数进度记录。添加作文、论文、小说等任何写作项目，设定目标字数和可选截止日。文章写在 Docs、Word、Notion 或纸上，回来只需输入新的总字数；忘了也能补记到过去的日期。显示进度条、百分比、剩余字数，以及按剩余字数 ÷ 剩余写作日算出的每日目标，可按所有日子或仅工作日计算。超过目标 110% 会出现提醒。按日日历历史、多个作文、JSON 导出与导入、在 Android 和任何浏览器都能用的离线 PWA。无需账号、无广告、无应用内购买。数据只留在此设备。',
    locale: 'zh_CN',
    image: 'https://essaypad.try-dabble.com/og-image-zh.png',
    localOnly: '作文数据仅保存在此设备。无登录、无广告、无订阅。作文数量不限，全部免费。',
    tagline: '免费本地作文/项目字数进度记录。设定目标字数和可选截止日，手动更新已写字数，查看进度和每日配额。可跳过周末的写作日。JSON 备份。无需账号。无订阅。',
  },
};

const SLUG = 'essaypad';
const ORIGIN = 'https://essaypad.try-dabble.com';
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
 * say "Essaypad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.ep-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
