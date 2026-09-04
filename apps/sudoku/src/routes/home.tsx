import { useEffect, useMemo } from "react";
import { createRoute } from "@tanstack/react-router";

import { GameScreen } from "@/components/game/game-screen";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { SeoCopy } from "@/components/seo-copy";
import { t } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { HTML_LANG, OG_IMAGE, OG_LOCALE, SHARE_URL, detectLang } from "@/lib/i18n/resolve-lang";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Locale;
}

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

function Home() {
  const { lang } = homeRoute.useSearch();
  const locale = useMemo(() => detectLang(lang), [lang]);

  // The language picker navigates client-side, so the Worker never re-renders
  // and every tag src/og-lang.ts wrote would otherwise keep the previous
  // language for the rest of the session. Same tags, same strings, same tables.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
    document.title = t(locale, "appTitle");
    setMetaContent(
      'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]',
      t(locale, "metaDescription"),
    );
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"], meta[property="og:title"], meta[name="twitter:title"]',
      t(locale, "appTitle"),
    );
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[locale]);
    setMetaContent('meta[property="og:locale"]', OG_LOCALE[locale]);
    // og:url and canonical move only when the URL itself carries ?lang=, which
    // is NARROWER than the Worker: src/og-lang.ts rewrites them for the td_lang
    // cookie too. That is deliberate, not an oversight. The client only has to
    // move these when it changed the URL out from under the served document; on
    // the cookie path the Worker already wrote the right value into the very
    // page this effect is running in, so touching them would be a no-op at
    // best. Every URL shape ends up agreeing with its own first HTML.
    if (lang) {
      setMetaContent('meta[property="og:url"]', SHARE_URL[lang]);
      document
        .querySelector<HTMLLinkElement>('link[rel="canonical"]')
        ?.setAttribute("href", SHARE_URL[lang]);
    }
  }, [lang, locale]);

  return (
    <div className="sd-shell mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col">
      <LocalOnlyBanner text={t(locale, "localOnly")} />
      <Masthead sub={t(locale, "brandSub")} title={t(locale, "appTitle")} />
      <GameScreen locale={locale} />
      {/* Below the whole play area — never between the board and the keypad. */}
      <footer className="flex flex-wrap items-center justify-center gap-3 px-4 py-3 text-xs opacity-70">
        <a href={`https://try-dabble.com/privacy?lang=${locale}`}>Privacy</a>
        <a href={`https://try-dabble.com/terms?lang=${locale}`}>Terms</a>
        <span>try-dabble.com</span>
      </footer>
      <SeoCopy heading={t(locale, "faq")} locale={locale} />
    </div>
  );
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch =>
    typeof search.lang === "string" && isLocale(search.lang) ? { lang: search.lang } : {},
});
