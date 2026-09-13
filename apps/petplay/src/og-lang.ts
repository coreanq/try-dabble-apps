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
 * Nothing here talks to any image or AI service either: the Worker only
 * rewrites text.
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
    title: '펫플레이',
    description:
      '생성형 AI를 전혀 쓰지 않는 무료 로컬 디지털 펫. 강아지·고양이·토끼·새·여우 중 고르고 귀·눈·몸·꼬리·장식과 색을 마음대로 조합하거나, 내 사진을 이 기기에서 잘라 색만 입혀 스프라이트로 씁니다. 이름을 짓고 배고픔·행복·기운·청결 게이지를 보며 먹이 주기·놀아주기·쓰다듬기·씻기기로 돌봅니다. 모든 꾸미기 무료, 토큰·결제 없음, 계정 없음, 광고 없음, JSON 백업으로 재설치해도 안전. 데이터는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://petplay.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    tagline:
      '생성형 AI 없는 무료 로컬 디지털 펫. 파츠·색으로 꾸미거나 내 사진으로 스프라이트(기기에서 자르고 색만 입힘), 이름 짓고 먹이·놀아주기, JSON 백업. 계정 없음. 토큰 없음. 광고 없음.',
  },
  en: {
    title: 'PetPlay',
    description:
      'A free local digital pet that never touches generative AI. Pick a dog, cat, bunny, bird or fox and mix ears, eyes, body, tail, accessory and colours however you like, or crop your own photo on this device and tint it into a sprite. Name it, watch the fullness, happiness, energy and cleanliness meters, and care for it with Feed, Play, Pet and Clean. Every customization is free, no tokens or purchases, no account, no ads, and a JSON backup survives a reinstall. Data stays on this device.',
    locale: 'en_US',
    image: 'https://petplay.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    tagline:
      'Free local digital pet — no generative AI. Build a sprite from parts or your photo (crop & tint on this device), name it, feed and play with visible needs, JSON backup. No account. No tokens. No ads.',
  },
  ja: {
    title: 'ペットプレイ',
    description:
      '生成AIを一切使わない無料のローカルデジタルペット。犬・猫・うさぎ・鳥・きつねから選び、耳・目・体・しっぽ・アクセサリーと色を自由に組み合わせるか、自分の写真をこの端末で切り抜いて色を付けてスプライトにします。名前を付け、満腹・幸せ・元気・きれいのメーターを見ながら、ごはん・遊ぶ・なでる・洗うでお世話。カスタマイズは全部無料、トークンも課金もなし、アカウント不要、広告なし、JSONバックアップで再インストールしても安心。データはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://petplay.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    tagline:
      '生成AIなしの無料ローカルデジタルペット。パーツと色、または自分の写真（端末で切り抜き＆色付け）でスプライトを作り、名前を付けてごはんと遊び、JSONバックアップ。アカウント不要。トークンなし。広告なし。',
  },
  zh: {
    title: '宠玩',
    description:
      '完全不用生成式 AI 的免费本地电子宠物。从狗、猫、兔子、小鸟、狐狸里挑一个，随意搭配耳朵、眼睛、身体、尾巴、饰品和颜色，或者在本机裁剪自己的照片并上色做成精灵。给它起名，看着饱腹、快乐、精力、清洁四条槽，用喂食、玩耍、抚摸、洗澡来照顾它。所有装扮免费，没有代币和内购，无需账号，无广告，JSON 备份重装也不丢。数据只留在此设备。',
    locale: 'zh_CN',
    image: 'https://petplay.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    tagline:
      '无生成式 AI 的免费本地电子宠物。用部件和颜色，或用自己的照片（在本机裁剪上色）做精灵，起名并喂食玩耍，JSON 备份。无需账号。无代币。无广告。',
  },
};

const SLUG = 'petplay';
const ORIGIN = 'https://petplay.try-dabble.com';
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
 * say "PetPlay", so the Worker rewrites name / lang / start_url per request.
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
