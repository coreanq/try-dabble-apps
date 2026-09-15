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
    title: '딕트패드',
    description:
      '로그인 없는 무료 로컬 음성 받아쓰기 메모장. 녹음 버튼을 누르고 말하면 브라우저 음성 인식(Web Speech API)이 실시간으로 받아써서 바로 고칠 수 있는 메모장에 넣습니다. “마침표”·“쉼표”·“줄바꿈”·“단락” 같은 구두점 음성 명령, 한국어·영어·일본어·중국어 등 인식 언어 선택, 여러 개의 이름 있는 노트, 자동 저장, 복사·TXT 다운로드, JSON 내보내기·불러오기, 오프라인 PWA 셸. 시스템 키보드가 아니라 브라우저 안 메모장입니다. 계정 없음, 광고 없음, 유료 구독 없음. 노트는 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://dictpad.try-dabble.com/og-image-ko.png',
    localOnly: '노트는 이 기기에만 저장됩니다. 로그인·광고·유료 구독 없음. 시스템 키보드가 아니라 브라우저 메모장입니다.',
    tagline: '무료 로컬 음성 받아쓰기 메모장. 녹음 버튼으로 실시간 받아쓰기, 구두점 음성 명령, 언어 선택, JSON 백업. 계정 없음. 구독 없음.',
  },
  en: {
    title: 'Dictpad',
    description:
      "Free local talk-to-text notepad with no login. Tap record and speak: the browser's speech recognition (Web Speech API) dictates live into a notepad you can edit at any time. Voice punctuation commands like “period”, “comma”, “new line” and “new paragraph”, a recognition-language picker for Korean, English, Japanese, Chinese and more, several named notes, autosave, copy and TXT download, JSON export and import, offline PWA shell. An in-browser notepad, not a system keyboard. No account, no ads, no paid subscription. Notes stay on this device.",
    locale: 'en_US',
    image: 'https://dictpad.try-dabble.com/og-image-en.png',
    localOnly: 'Your notes stay on this device. No login. No ads. No paid subscription. This is an in-browser notepad — not a system keyboard.',
    tagline: 'Free local talk-to-text notepad. Tap record for live dictation into editable notes. Voice punctuation, language picker, JSON backup. No account. No subscription.',
  },
  ja: {
    title: 'ディクトパッド',
    description:
      'ログイン不要の無料ローカル音声入力メモ帳。録音ボタンを押して話すと、ブラウザの音声認識（Web Speech API）がリアルタイムで書き取り、いつでも編集できるメモ帳に入れます。「句点」「読点」「改行」「段落」などの句読点音声コマンド、韓国語・英語・日本語・中国語ほかの認識言語の選択、名前付きノートを複数、自動保存、コピー・TXTダウンロード、JSONの書き出し・読み込み、オフラインPWAシェル。システムキーボードではなく、ブラウザの中のメモ帳です。アカウント不要、広告なし、有料サブスクなし。ノートはこの端末だけ。',
    locale: 'ja_JP',
    image: 'https://dictpad.try-dabble.com/og-image-ja.png',
    localOnly: 'ノートはこの端末にだけ保存されます。ログイン・広告・有料サブスクなし。システムキーボードではなく、ブラウザのメモ帳です。',
    tagline: '無料のローカル音声入力メモ帳。録音ボタンでリアルタイム書き取り、句読点の音声コマンド、言語選択、JSONバックアップ。アカウント不要。サブスクなし。',
  },
  zh: {
    title: '听写板',
    description:
      '无需登录的免费本地听写记事本。点录音开口说话，浏览器的语音识别（Web Speech API）实时听写进一个随时可编辑的记事本。“句号”“逗号”“换行”“段落”等语音标点命令，韩语、英语、日语、中文等识别语言选择，多个命名笔记，自动保存，复制和 TXT 下载，JSON 导出与导入，离线 PWA 外壳。这是浏览器里的记事本，不是系统输入法。无需账号，无广告，无付费订阅。笔记仅保存在此设备。',
    locale: 'zh_CN',
    image: 'https://dictpad.try-dabble.com/og-image-zh.png',
    localOnly: '笔记仅保存在此设备。无登录、无广告、无付费订阅。这是浏览器记事本，不是系统输入法。',
    tagline: '免费本地听写记事本。点录音即可实时听写到可编辑笔记。语音标点、语言选择、JSON 备份。无需账号。无订阅。',
  },
};

const SLUG = 'dictpad';
const ORIGIN = 'https://dictpad.try-dabble.com';
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
 * say "Dictpad", so the Worker rewrites name / lang / start_url per request.
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
        .on('.dp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
