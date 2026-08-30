import { useEffect, useMemo } from "react";
import { createRoute } from "@tanstack/react-router";

import { GameScreen } from "@/components/game/game-screen";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { t } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { HTML_LANG, detectLang } from "@/lib/i18n/resolve-lang";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Locale;
}

function Home() {
  const { lang } = homeRoute.useSearch();
  const locale = useMemo(() => detectLang(lang), [lang]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  return (
    <div className="sd-shell mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col">
      <LocalOnlyBanner text={t(locale, "localOnly")} />
      <Masthead sub={t(locale, "brandSub")} title={t(locale, "appTitle")} />
      <GameScreen locale={locale} />
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
