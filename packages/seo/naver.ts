/**
 * Shared Naver Search Advisor site verification for every *.try-dabble.com app.
 * Hub (try-dabble.com) uses the same content — keep them identical.
 *
 * Ship checklist: every app index.html <head> AND Worker HTMLRewriter head
 * inject (og-lang.ts) must include this meta. Prefer importing
 * NAVER_META_HTML / attachNaverVerification from here when wiring a new Worker.
 */
export const NAVER_SITE_VERIFICATION =
  'cb50b4906a09539a5c0ede24022028167b4f7751';

export const NAVER_META_HTML =
  `<meta name="naver-site-verification" content="${NAVER_SITE_VERIFICATION}" />`;

/** Append the verification meta to <head>. Same content twice is fine for crawlers. */
export function attachNaverVerification(rewriter: HTMLRewriter): HTMLRewriter {
  return rewriter.on('head', {
    element(el) {
      el.append(NAVER_META_HTML, { html: true });
    },
  });
}
