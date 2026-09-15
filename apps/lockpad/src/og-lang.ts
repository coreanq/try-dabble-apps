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
    title: "락패드",
    description:
      "삼성 노트처럼 메모 하나하나에 잠금을 걸 수 있는, 로그인도 광고도 인앱 결제도 없는 무료 로컬 메모장입니다. 메모를 만들고, 골라서 PIN이나 비밀번호로 잠그면 본문은 이 기기에서 Web Crypto(PBKDF2 + AES-GCM)로 암호화되어 암호문으로만 저장됩니다. 잠긴 메모를 열 때는 잠금 해제 모달이 뜨고, PIN을 틀릴수록 대기 시간이 1초·2초·4초로 늘어납니다. 원하면 일정 시간 손대지 않거나 탭을 숨길 때 열린 메모를 모두 다시 잠그는 자동 잠금을 켤 수 있습니다. 검색은 제목과 태그만 봅니다 — 잠긴 본문은 절대 복호화하지 않습니다. 태그와 색상은 선택입니다. JSON 백업에는 잠긴 메모가 암호문·솔트·KDF 파라미터 그대로 들어가서 새 브라우저나 새 기기에서 불러와도 그대로 잠긴 채 복원되고, 같은 PIN으로 열립니다. 잠긴 메모를 평문으로 몰래 풀어 내보내는 일은 없습니다. 사진·음성 첨부 유료 벽 없음, 전체 삭제 버튼 없음(있어도 타이핑 확인 뒤), 사용 중 광고 없음. 안드로이드와 모든 브라우저에서 설치해 오프라인으로 쓰는 PWA입니다. 데이터는 이 기기에만 남습니다.",
    locale: "ko_KR",
    image: "https://lockpad.try-dabble.com/og-image-ko.png",
    localOnly: "메모는 이 기기에만 저장됩니다. 잠긴 메모는 암호문으로만 남습니다. 로그인·광고 없음. JSON으로 백업하세요.",
    tagline: "메모별 PIN 잠금이 있는 심플 로컬 메모장. 잠금 해제 모달, 유휴 자동 잠금, 제목 검색(잠긴 본문은 암호문 그대로), 태그·색상, 잠긴 블롭까지 담는 JSON 백업. 계정 없음. 광고 없음. 인앱 결제 없음.",
  },
  en: {
    title: "Lockpad",
    description:
      "A free local notepad with a Samsung Notes–style lock on any note you choose — no login, no ads, no in-app purchases. Write notes like any notepad, then lock the ones that matter behind a PIN or password: the body is encrypted on this device with Web Crypto (PBKDF2 + AES-GCM) and stored only as ciphertext. Opening a locked note brings up an unlock modal, and every wrong PIN makes the next try wait longer (1s, 2s, 4s…). Optional app-wide auto-lock re-locks every open note after idle time or when the tab is hidden. Search looks at titles and tags only — locked bodies are never decrypted for search. Tags and colors are optional. The JSON backup carries locked notes as ciphertext + salt + KDF params, so importing on a new browser or device restores them still locked and still opening with the same PIN. Nothing ever dumps a locked note as plaintext. No photo or voice attachment paywall, no wipe button without a typed confirm, no mid-use ads. Works offline as an installable PWA on Android and any browser. Data stays on this device.",
    locale: "en_US",
    image: "https://lockpad.try-dabble.com/og-image-en.png",
    localOnly: "Your notes stay on this device. Locked notes are stored as ciphertext only. No login. No ads. Export JSON to keep a copy.",
    tagline: "Simple local notepad with per-note PIN lock. Unlock modal, idle auto-lock, title search (locked bodies stay ciphertext), tags & colors, portable JSON backup of locked blobs. No account. No ads. No IAP.",
  },
  ja: {
    title: "ロックパッド",
    description:
      "Samsung Notes のように好きなメモだけをロックできる、ログインも広告もアプリ内課金もない無料のローカルメモ帳です。普通のメモ帳のように書いて、大事なメモだけ PIN やパスワードでロックすると、本文はこの端末の Web Crypto（PBKDF2 + AES-GCM）で暗号化され、暗号文としてだけ保存されます。ロック済みメモを開くときは解除モーダルが出て、PIN を間違えるたびに次の試行までの待ち時間が 1秒・2秒・4秒…と伸びます。任意で、一定時間触らないときやタブが隠れたときに開いているメモをすべてロックし直す自動ロックも使えます。検索はタイトルとタグだけを見ます——ロック済み本文は検索のために復号されません。タグと色は任意です。JSON バックアップにはロック済みメモが暗号文・ソルト・KDF パラメータのまま入るので、新しいブラウザや端末で読み込んでもロックされたまま復元され、同じ PIN で開きます。ロック済みメモを平文で書き出すことは決してありません。写真・音声添付の課金壁なし、入力確認なしの全消去ボタンなし、使用中の広告なし。Android とあらゆるブラウザでインストールしてオフラインで使える PWA です。データはこの端末だけに残ります。",
    locale: "ja_JP",
    image: "https://lockpad.try-dabble.com/og-image-ja.png",
    localOnly: "メモはこの端末にだけ保存されます。ロック済みメモは暗号文のみ。ログイン・広告なし。JSONでバックアップしてください。",
    tagline: "メモごとにPINロックできるシンプルなローカルメモ帳。解除モーダル、アイドル自動ロック、タイトル検索（ロック済み本文は暗号文のまま）、タグと色、ロック済みブロブごと持ち運べるJSONバックアップ。アカウント不要。広告なし。アプリ内課金なし。",
  },
  zh: {
    title: "加锁便签",
    description:
      "像三星备忘录一样可以给任意一条笔记加锁的免费本地记事本——无登录、无广告、无内购。像普通记事本一样写笔记，再把重要的那几条用 PIN 或密码锁起来：正文在此设备上用 Web Crypto（PBKDF2 + AES-GCM）加密，只以密文保存。打开已锁笔记时会弹出解锁窗口，每输错一次 PIN，下一次尝试都要多等一会儿（1 秒、2 秒、4 秒……）。可选的全局自动上锁会在闲置一段时间或标签页隐藏时把所有已打开的笔记重新锁上。搜索只看标题和标签——已锁正文绝不会为了搜索而被解密。标签和颜色可选。JSON 备份中的已锁笔记以密文 + 盐 + KDF 参数原样导出，在新浏览器或新设备导入后仍保持锁定，并能用同一 PIN 打开。绝不会把已锁笔记以明文导出。没有照片/语音附件付费墙，没有不经输入确认的清空按钮，使用中没有广告。可在 Android 和任意浏览器上安装为离线 PWA。数据只留在此设备。",
    locale: "zh_CN",
    image: "https://lockpad.try-dabble.com/og-image-zh.png",
    localOnly: "笔记只保存在此设备。已锁笔记仅以密文保存。无登录、无广告。请用 JSON 备份。",
    tagline: "可按条加 PIN 锁的简洁本地记事本。解锁弹窗、闲置自动上锁、标题搜索（已锁正文保持密文）、标签与颜色、可携带已锁数据块的 JSON 备份。无需账号。无广告。无内购。",
  },
};

const SLUG = 'lockpad';
const ORIGIN = 'https://lockpad.try-dabble.com';
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
 * say "Lockpad", so the Worker rewrites name / lang / start_url per
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
        .on('.lp-tagline', { element(el) { el.setInnerContent(copy.tagline); } })
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
