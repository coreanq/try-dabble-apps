type Lang = 'ko' | 'en' | 'ja' | 'zh';

/**
 * The Worker runs before the assets binding replies (run_worker_first), so the
 * FIRST HTML already carries the requested ?lang= — html lang, title, the
 * local-only banner, the marquee h1, the portrait hint, the noscript fallback
 * and every og/twitter tag. Crawlers never run JS, so anything the React app
 * fixes up later is too late for them.
 *
 * Copy is duplicated from src/lib/i18n.ts on purpose: the Worker is bundled on
 * its own and must not drag React-side modules in.
 */
const COPY: Record<Lang, {
  title: string;
  titleSub: string;
  description: string;
  locale: string;
  image: string;
  localOnly: string;
  portraitHint: string;
  noscriptJs: string;
  noscriptThemes: string;
  ariaLeft: string;
  ariaRight: string;
  ariaJump: string;
  ariaMenu: string;
}> = {
  ko: {
    title: '블록점퍼',
    titleSub: '네 테마 점프',
    description: '블록을 점프해 멀리 가는 사이드스크롤 플랫포머 — 4테마(지하/땅/하늘/우주)와 추락-회복 메커닉',
    locale: 'ko_KR',
    image: 'https://jump-map.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    portraitHint: '회전시켜주세요 (가로 모드 권장)',
    noscriptJs: '이 게임은 자바스크립트가 필요합니다. 브라우저의 자바스크립트를 활성화해 주세요.',
    noscriptThemes: '지하·땅·하늘·우주 4테마를 점프해 가는 픽셀 플랫포머입니다.',
    ariaLeft: '왼쪽',
    ariaRight: '오른쪽',
    ariaJump: '점프',
    ariaMenu: '메뉴',
  },
  en: {
    title: 'Block Jumper',
    titleSub: 'Four-theme jumper',
    description: 'A side-scrolling platformer where you jump across blocks — 4 themes (underground/ground/sky/space) with fall-recovery mechanic',
    locale: 'en_US',
    image: 'https://jump-map.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    portraitHint: 'Please rotate your device (landscape recommended)',
    noscriptJs: 'This game needs JavaScript. Please enable JavaScript in your browser.',
    noscriptThemes: 'Jump across four themes: underground, ground, sky, and space.',
    ariaLeft: 'Left',
    ariaRight: 'Right',
    ariaJump: 'Jump',
    ariaMenu: 'Menu',
  },
  ja: {
    title: 'ブロックジャンパー',
    titleSub: '4つのテーマ',
    description: 'ブロックをジャンプして遠くを目指す横スクロールプラットフォーマー — 4テーマ(地下/地上/空/宇宙)と落下リカバリー',
    locale: 'ja_JP',
    image: 'https://jump-map.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    portraitHint: '画面を横にしてください（横向き推奨）',
    noscriptJs: 'このゲームにはJavaScriptが必要です。ブラウザでJavaScriptを有効にしてください。',
    noscriptThemes: '地下・地上・空・宇宙の4テーマをジャンプするピクセルプラットフォーマーです。',
    ariaLeft: '左',
    ariaRight: '右',
    ariaJump: 'ジャンプ',
    ariaMenu: 'メニュー',
  },
  zh: {
    title: '方块跳跃者',
    titleSub: '四大主题跳跃',
    description: '一款横版跳跃平台游戏：穿越地下、地面、天空、宇宙四个主题，跌落后还能重新站上踏板。',
    locale: 'zh_CN',
    image: 'https://jump-map.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    portraitHint: '请旋转设备（建议横屏）',
    noscriptJs: '此游戏需要启用 JavaScript。请在浏览器中开启 JavaScript。',
    noscriptThemes: '在地下、地面、天空、宇宙四个主题间跳跃的像素平台游戏。',
    ariaLeft: '向左',
    ariaRight: '向右',
    ariaJump: '跳跃',
    ariaMenu: '菜单',
  },
};

const SLUG = 'jump-map';
const ORIGIN = 'https://jump-map.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: { fetch: (request: Request) => Promise<Response> } };

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
        .on('#brand-sub', { element(el) { el.setInnerContent(copy.titleSub); } })
        .on('#portrait-hint-text', { element(el) { el.setInnerContent(copy.portraitHint); } })
        // HTMLRewriter parses <noscript> content as raw text, so its children
        // are unreachable by selector — the whole block is replaced instead.
        .on('noscript', {
          element(el) {
            el.setInnerContent(
              `<div style="padding:2rem;color:#fff;font-family:sans-serif;text-align:center"><h2>${copy.title}</h2><p id="noscript-js">${copy.noscriptJs}</p><p id="noscript-themes">${copy.noscriptThemes}</p></div>`,
              { html: true },
            );
          },
        })
        .on('#btn-left', { element(el) { el.setAttribute('aria-label', copy.ariaLeft); } })
        .on('#btn-right', { element(el) { el.setAttribute('aria-label', copy.ariaRight); } })
        .on('#btn-jump', { element(el) { el.setAttribute('aria-label', copy.ariaJump); } })
        .on('#btn-menu', { element(el) { el.setAttribute('aria-label', copy.ariaMenu); } })
        .on('meta', {
          element(el) {
            const key = el.getAttribute('property') || el.getAttribute('name') || '';
            if (
              key === 'description' ||
              key === 'og:description' ||
              key === 'twitter:description' ||
              key === 'og:image:alt'
            ) {
              el.setAttribute('content', copy.description);
            } else if (key === 'og:title' || key === 'twitter:title') {
              el.setAttribute('content', copy.title);
            } else if (key === 'application-name' || key === 'apple-mobile-web-app-title') {
              el.setAttribute('content', copy.title);
            } else if (key === 'og:image' || key === 'twitter:image') {
              el.setAttribute('content', copy.image);
            } else if (key === 'og:url') {
              el.setAttribute('content', shareUrl);
            } else if (key === 'og:locale') {
              el.setAttribute('content', copy.locale);
            }
          },
        })
        .on('link', {
          element(el) {
            if ((el.getAttribute('rel') || '').toLowerCase() === 'canonical') {
              el.setAttribute('href', shareUrl);
            }
          },
        })
        .transform(asset);
    }

    // The 의견 widget rides on every response, localised or not.
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
