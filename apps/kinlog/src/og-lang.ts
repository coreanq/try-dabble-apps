/**
 * Runs before the assets binding (run_worker_first) so the FIRST HTML already
 * carries the requested ?lang=. Crawlers never run JS, so the language cannot
 * be left to the React bundle: html lang, title, the h1, the local-only notice,
 * the five promise chips and every share tag are rewritten here.
 */

type Lang = 'ko' | 'en' | 'ja' | 'zh';

type Copy = {
  title: string;
  description: string;
  tagline: string;
  locale: string;
  image: string;
  localOnly: string;
  /** The fail-fix, in the first HTML: no login, no card, no contacts, no cap. */
  chips: [string, string, string, string, string];
};

const COPY: Record<Lang, Copy> = {
  ko: {
    title: '인연장',
    description:
      '사람 이름을 직접 적어 두고, 그 사람 카드에 메모와 마지막 연락일·다음 연락일을 남기는 개인 인맥 수첩. 로그인도 카드 등록도 없고, 주소록 권한도 묻지 않습니다. 인원과 메모에 제한이 없고, 모든 기록은 이 기기에만 남습니다.',
    tagline: '사람, 메모, 마지막 연락, 다음 연락. 이 기기에만.',
    locale: 'ko_KR',
    image: 'https://kinlog.try-dabble.com/og-image.png',
    localOnly: '이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다.',
    chips: [
      '로그인 없음',
      '카드 등록 없음',
      '주소록 권한 안 물어봄',
      '인원·메모 무제한',
      '이름은 직접 입력',
    ],
  },
  en: {
    title: 'Kinlog',
    description:
      "A private address book for the people you actually keep up with. Type a name, keep notes on that person's card, and record the last and next contact date. No login, no credit-card wall, no contacts permission. Unlimited people and notes, all stored on this device only.",
    tagline: 'People, notes, last contact, next contact. On this device only.',
    locale: 'en_US',
    image: 'https://kinlog.try-dabble.com/og-image-en.png',
    localOnly: 'Your data stays on this device. Nothing is sent to our servers.',
    chips: [
      'No login',
      'No credit card',
      'No contacts permission',
      'Unlimited people & notes',
      'You type the names',
    ],
  },
  ja: {
    title: '縁帳',
    description:
      '名前を自分で書き入れて、その人のカードにメモと最後の連絡日・次の連絡日を残す個人用の人づきあい手帳。ログインもクレジットカード登録もなく、連絡先へのアクセスも求めません。人数もメモも無制限で、記録はこの端末にだけ残ります。',
    tagline: '人、メモ、最後の連絡、次の連絡。この端末だけに。',
    locale: 'ja_JP',
    image: 'https://kinlog.try-dabble.com/og-image-ja.png',
    localOnly: 'データはこの端末にだけ保存されます。サーバーには送りません。',
    chips: [
      'ログインなし',
      'カード登録なし',
      '連絡先の許可を求めない',
      '人数・メモ無制限',
      '名前は自分で入力',
    ],
  },
  zh: {
    // zh has its own card. Never point it at the English file.
    title: '亲友录',
    description:
      '自己输入名字，在每个人的卡片上记备注、上次联系和下次联系日期的私人人脉本。无需登录，不要信用卡，也不申请通讯录权限。人数和备注都不限量，所有记录只留在这台设备。',
    tagline: '人、备注、上次联系、下次联系。只在这台设备。',
    locale: 'zh_CN',
    image: 'https://kinlog.try-dabble.com/og-image-zh.png',
    localOnly: '数据仅保存在此设备，不会上传到服务器。',
    chips: [
      '无需登录',
      '不要信用卡',
      '不申请通讯录权限',
      '人数、备注不限量',
      '名字自己输入',
    ],
  },
};

const CHIP_IDS = [
  '#chip-nologin',
  '#chip-nocard',
  '#chip-nocontacts',
  '#chip-noiap',
  '#chip-manual',
] as const;

const SLUG = 'kinlog';
const ORIGIN = 'https://kinlog.try-dabble.com';
const LANGS = new Set<string>(['ko', 'en', 'ja', 'zh']);

type Env = { ASSETS: Fetcher };

function isHome(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

/** ?lang= wins over the td_lang cookie, which carries the choice across the
 *  try-dabble subdomains. localStorage is invisible here — the client resolves
 *  that tier itself, in the same order. */
function pickLang(request: Request, url: URL): Lang | null {
  const q = url.searchParams.get('lang');
  if (q && LANGS.has(q)) return q as Lang;
  const m = (request.headers.get('cookie') || '').match(
    /(?:^|;\s*)td_lang=(ko|en|ja|zh)(?:;|$)/,
  );
  if (m && LANGS.has(m[1])) return m[1] as Lang;
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const asset = await env.ASSETS.fetch(request);
    const ct = asset.headers.get('content-type') || '';
    if (!ct.includes('text/html') || !isHome(url.pathname)) return asset;

    const lang = pickLang(request, url);
    let html: Response = asset;

    if (lang) {
      const copy = COPY[lang];
      const shareUrl = `${ORIGIN}/?lang=${lang}`;
      let rewriter = new HTMLRewriter()
        .on('html', {
          element(el) {
            el.setAttribute('lang', lang);
          },
        })
        .on('title', {
          element(el) {
            el.setInnerContent(copy.title);
          },
        })
        .on('#local-only', {
          element(el) {
            el.setInnerContent(copy.localOnly);
          },
        })
        .on('h1#brand-title', {
          element(el) {
            el.setInnerContent(copy.title);
          },
        })
        .on('.kl-tagline', {
          element(el) {
            el.setInnerContent(copy.tagline);
          },
        });

      CHIP_IDS.forEach((selector, i) => {
        rewriter = rewriter.on(selector, {
          element(el) {
            el.setInnerContent(copy.chips[i]);
          },
        });
      });

      html = rewriter
        .on('meta', {
          element(el) {
            const key = el.getAttribute('property') || el.getAttribute('name') || '';
            if (
              key === 'description' ||
              key === 'og:description' ||
              key === 'twitter:description'
            ) {
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
            if ((el.getAttribute('rel') || '').toLowerCase() === 'canonical') {
              el.setAttribute('href', shareUrl);
            }
          },
        })
        .transform(asset);
    }

    // Shared try-dabble 의견 widget. Appended for every language, including the
    // untouched default, so the feedback button never depends on ?lang=.
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
