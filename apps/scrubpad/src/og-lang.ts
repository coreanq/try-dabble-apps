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
 * Nothing here ever sees the text a user scrubs: that never leaves the tab.
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
    title: '스크럽패드',
    description:
      '설치 없이 쓰는 무료 로컬 개인정보 가리기. 글을 붙여 넣으면 이메일, 전화번호, 주소, 카드번호, IP, API 키와 사람 이름을 찾아 [NAME_1] 같은 안정적인 자리표시로 바꿉니다. 검토 목록에서 항목을 체크 해제하면 원문이 남고, 직접 추가한 단어도 가릴 수 있습니다. 원문과 가린 글을 나란히 보고, 복사하거나 내려받고, 선택으로 복원 표를 보관합니다. 처리는 이 기기에서만. 계정 없음, 업로드 없음, 광고 없음, 구독 없음.',
    locale: 'ko_KR',
    image: 'https://scrubpad.try-dabble.com/og-image-ko.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 가리기는 이 기기에서만 이루어지며 서버로 보내지 않습니다. 구독·광고 없음.',
    tagline: '무료 로컬 개인정보 가리기. 글을 붙여 넣으면 이름과 비밀을 안정적인 자리표시로 바꾸고, 검토한 뒤 ChatGPT·Claude에 복사합니다. 복원 표는 선택. 계정 없음. 업로드 없음.',
  },
  en: {
    title: 'Scrubpad',
    description:
      'Free local PII scrubber with nothing to install. Paste text and it finds emails, phone numbers, addresses, card numbers, IPs, API keys and person names, then swaps each one for a stable placeholder like [NAME_1]. Uncheck a row in the review list to keep the original, add your own words, see original and scrubbed side by side, copy or download, and optionally keep a restore map. Processing happens on this device. No account, no upload, no ads, no subscription.',
    locale: 'en_US',
    image: 'https://scrubpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Scrubbing runs on this device — nothing is sent to our servers. No subscription. No ads.',
    tagline: 'Free local PII scrubber. Paste text, replace names and secrets with stable placeholders, review, copy for ChatGPT or Claude. Optional restore map. No account. No upload.',
  },
  ja: {
    title: 'スクラブパッド',
    description:
      'インストール不要の無料ローカル個人情報マスク。文章を貼ると、メール、電話番号、住所、カード番号、IP、APIキー、人名を見つけて [NAME_1] のような安定したプレースホルダーに置き換えます。確認リストで行のチェックを外せば原文が残り、自分の言葉も追加できます。原文とマスク後を並べて見て、コピーやダウンロードし、任意で復元表を保管。処理はこの端末だけ。アカウント不要、アップロードなし、広告なし、サブスクなし。',
    locale: 'ja_JP',
    image: 'https://scrubpad.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。マスク処理もこの端末だけで、サーバーには送りません。サブスク・広告なし。',
    tagline: '無料のローカル個人情報マスク。文章を貼ると名前と秘密を安定したプレースホルダーに替え、確認してからChatGPTやClaudeにコピー。復元表は任意。アカウント不要。アップロードなし。',
  },
  zh: {
    title: '脱敏板',
    description:
      '免安装的免费本地脱敏工具。粘贴文本，它会找出邮箱、电话、地址、卡号、IP、API 密钥和人名，并换成 [NAME_1] 这样的稳定占位符。在核对列表里取消勾选某行即可保留原文，也能添加自己的词。原文与脱敏后并排显示，可复制或下载，还可选保留一份还原表。处理只在此设备完成。无需账号，不上传，无广告，无订阅。',
    locale: 'zh_CN',
    image: 'https://scrubpad.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备。脱敏也在此设备完成，不会上传到服务器。无订阅、无广告。',
    tagline: '免费本地脱敏。粘贴文本，把姓名和秘密换成稳定占位符，核对后再复制给 ChatGPT 或 Claude。可选还原表。无需账号。不上传。',
  },
};

const SLUG = 'scrubpad';
const ORIGIN = 'https://scrubpad.try-dabble.com';
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
 * say "Scrubpad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.sp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
