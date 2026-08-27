import { useCallback, useEffect, useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { GameCabinet } from "@/components/game-cabinet";
import { InfoPanels } from "@/components/info-panels";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PortraitHint } from "@/components/portrait-hint";
import { TouchPad } from "@/components/touch-pad";
import { startEngine } from "@/lib/engine";
import { setHudLang } from "@/lib/hud-i18n";
import {
  HTML_LANG,
  OG_IMAGE,
  OG_LOCALE,
  ORIGIN,
  detectLang,
  isLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch =>
    isLang(search.lang) ? { lang: search.lang } : {},
});

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey) => translate(lang, key), [lang]);

  const [ready, setReady] = useState(false);

  /* Keep ?lang= on the URL so a shared link, the Worker behind it and the
     engine's own jmLang() all agree with what the player is looking at. */
  useEffect(() => {
    if (search.lang !== lang) {
      void navigate({ search: () => ({ lang }), replace: true });
    }
  }, [lang, navigate, search.lang]);

  /* The Worker already localised the first HTML; this keeps the head — and
     documentElement.lang, which the engine reads — correct after an in-page
     language change. */
  useEffect(() => {
    const shareUrl = `${ORIGIN}/?lang=${lang}`;
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent(
      'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"], meta[property="og:image:alt"]',
      t("metaDescription"),
    );
    setMetaContent('meta[property="og:title"], meta[name="twitter:title"]', t("title"));
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
    setMetaContent('meta[property="og:url"]', shareUrl);
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    setMetaContent('meta[property="og:locale"]', OG_LOCALE[lang]);
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", shareUrl);
  }, [lang, t]);

  /* The HUD, the menu and the shop are painted inside the canvas, so their
     language is swapped at the fillText seam rather than re-rendered. This
     runs before the engine is injected, and again on every change. */
  useEffect(() => {
    setHudLang(lang);
  }, [lang]);

  /* Canvas and touch pad are on screen by now, which is the engine's whole
     contract with the page. */
  useEffect(() => {
    startEngine(() => setReady(true));
  }, []);

  const changeLang = useCallback(
    (next: Lang) => {
      void navigate({ search: () => ({ lang: next }), replace: true });
    },
    [navigate],
  );

  return (
    <div className="pj-shell">
      <LocalOnlyBanner text={t("localOnly")} lang={lang} onLangChange={changeLang} t={t} />
      <div className="pj-chrome">
        <Masthead t={t} />
      </div>
      <GameCabinet t={t} ready={ready} />
      <div className="pj-chrome">
        <InfoPanels t={t} />
      </div>
      <TouchPad t={t} />
      <PortraitHint t={t} />
    </div>
  );
}
