import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { ArrowLeftRight, RefreshCw, WifiOff } from "lucide-react";

import { CurrencyPicker } from "@/components/currency-picker";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { Toast } from "@/components/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currencyInfo, pickerList } from "@/lib/currencies";
import {
  HTML_LANG,
  NUM_LOCALE,
  OG_IMAGE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import { FONT_SIZES, loadPrefs, savePrefs, type FontSize, type Prefs } from "@/lib/prefs";
import {
  codesOf,
  convert,
  decimalsFor,
  fetchSnapshot,
  formatNumber,
  loadSnapshot,
  parseAmount,
  saveSnapshot,
  unitRate,
  type RatesSnapshot,
} from "@/lib/rates";
import { rootRoute } from "@/routes/root";

interface HomeSearch {
  lang?: Lang;
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const next: HomeSearch = {};
    if (isLang(search.lang)) next.lang = search.lang;
    return next;
  },
});

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

const CHIP_KEYS: MsgKey[] = ["chipNoAds", "chipOffline", "chipCache", "chipNoLogin", "chipJpy", "chipLangs"];
const FONT_LABEL: Record<FontSize, MsgKey> = { md: "fontMd", lg: "fontLg", xl: "fontXl" };
const TOAST_MS = 2200;

/** Where the rates on screen came from this session. */
type Source = "live" | "cached" | "none";

function readOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [snap, setSnap] = useState<RatesSnapshot | null>(() => loadSnapshot());
  const [source, setSource] = useState<Source>(() => (loadSnapshot() ? "cached" : "none"));
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(lang));
  const [online, setOnline] = useState<boolean>(readOnline);
  const [syncing, setSyncing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Keep ?lang= on the URL so a reload, a share or a crawler hit resolves the
  // same language the Worker already baked into the first HTML.
  useEffect(() => {
    if (search.lang !== lang) {
      navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
    }
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    // Manifest fetches omit cookies, so the language has to ride on the URL.
    document
      .querySelector('link[rel="manifest"]')
      ?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);

  /**
   * One pull from Frankfurter. Success replaces the snapshot and persists it;
   * failure keeps whatever was cached and only shows the error card when
   * there is nothing to fall back on.
   */
  const sync = useCallback(
    async (manual: boolean) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setSyncing(true);
      try {
        const fresh = await fetchSnapshot(ctrl.signal);
        if (ctrl.signal.aborted) return;
        saveSnapshot(fresh);
        setSnap(fresh);
        setSource("live");
        setFailed(false);
        if (manual) showToast(translate(lang, "syncOk"));
      } catch {
        if (ctrl.signal.aborted) return;
        setFailed(true);
        setSnap((cur) => {
          if (cur && manual) showToast(translate(lang, "syncFailedCached"));
          return cur;
        });
      } finally {
        if (!ctrl.signal.aborted) setSyncing(false);
      }
    },
    [lang, showToast],
  );

  // Network-first on open: refresh quietly when online, otherwise stay on the
  // cache. A failed background pull is silent unless there is no cache at all.
  useEffect(() => {
    if (readOnline()) void sync(false);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const codes = useMemo(() => codesOf(snap), [snap]);
  const list = useMemo(() => pickerList(codes), [codes]);
  const locale = NUM_LOCALE[lang];

  const amount = parseAmount(prefs.amount);
  const hasAmount = !Number.isNaN(amount);
  const rate = unitRate(snap, prefs.from, prefs.to);
  const back = unitRate(snap, prefs.to, prefs.from);
  const result = hasAmount ? convert(snap, amount, prefs.from, prefs.to) : null;

  const fromInfo = currencyInfo(prefs.from);
  const toInfo = currencyInfo(prefs.to);

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    [locale],
  );
  const fetchedLabel = useMemo(() => {
    if (!snap) return null;
    const d = new Date(snap.fetchedAt);
    return Number.isNaN(d.getTime()) ? snap.fetchedAt : timeFmt.format(d);
  }, [snap, timeFmt]);

  const showError = failed && !snap;

  function handleSwap() {
    commitPrefs({ ...prefs, from: prefs.to, to: prefs.from });
  }

  function handlePick(code: string) {
    if (picker === "from") commitPrefs({ ...prefs, from: code });
    else if (picker === "to") commitPrefs({ ...prefs, to: code });
  }

  return (
    <div className="fx-app" data-size={prefs.fontSize}>
      <LocalOnlyBanner text={t("localOnly")} />

      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={(nextLang) => {
          rememberLang(nextLang);
          navigate({ search: (prev) => ({ ...prev, lang: nextLang }), replace: true });
        }}
      />

      <Card id="converter">
        <CardHeader>
          <CardTitle className="sr-only">{t("title")}</CardTitle>
          <div className="fx-status" id="status">
            <span
              id="status-online"
              className={"fx-pill " + (online ? "fx-pill-online" : "fx-pill-offline")}
              data-online={online ? "true" : "false"}
            >
              {online ? t("statusOnline") : t("statusOffline")}
            </span>
            <span
              id="status-source"
              className={"fx-source " + (source === "live" ? "" : "fx-source-cached")}
              data-source={source}
            >
              {source === "live" ? t("sourceLive") : source === "cached" ? t("sourceCached") : t("sourceNone")}
            </span>
          </div>
          <p className="fx-status fx-updated col-span-full m-0" id="last-updated">
            {snap && fetchedLabel ? (
              <>
                <span>{t("updatedAt", { time: fetchedLabel })}</span>
                <span aria-hidden>·</span>
                <span>{t("ratesDate", { date: snap.date })}</span>
              </>
            ) : (
              <span>{t("neverSynced")}</span>
            )}
          </p>
        </CardHeader>

        <CardContent className="grid gap-[0.7rem]">
          {showError && (
            <div className="fx-error" id="rates-error" role="alert">
              <p className="fx-error-title">{t("errorTitle")}</p>
              <p className="fx-error-body">{online ? t("errorBody") : t("errorOffline")}</p>
            </div>
          )}

          <div>
            <label className="fx-field-label" htmlFor="amount">
              {t("amountLabel")}
            </label>
            <input
              id="amount"
              className="fx-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
              placeholder={t("amountPlaceholder")}
              aria-label={t("amountLabel")}
              value={prefs.amount}
              onChange={(e) => commitPrefs({ ...prefs, amount: e.target.value })}
            />
          </div>

          <div className="fx-pair">
            <div className="min-w-0">
              <span className="fx-field-label">{t("fromLabel")}</span>
              <button
                type="button"
                id="pick-from"
                className="fx-chip"
                aria-haspopup="dialog"
                data-code={prefs.from}
                onClick={() => setPicker("from")}
              >
                <span className="fx-flag" aria-hidden>
                  {fromInfo.flag}
                </span>
                <span className="fx-chip-text">
                  <span className="fx-code">{fromInfo.code}</span>
                  <span className="fx-name">{fromInfo.name[lang]}</span>
                </span>
              </button>
            </div>
            <button type="button" id="swap" className="fx-swap" aria-label={t("swap")} title={t("swap")} onClick={handleSwap}>
              <ArrowLeftRight className="size-5" aria-hidden />
            </button>
            <div className="min-w-0">
              <span className="fx-field-label">{t("toLabel")}</span>
              <button
                type="button"
                id="pick-to"
                className="fx-chip fx-chip-to"
                aria-haspopup="dialog"
                data-code={prefs.to}
                onClick={() => setPicker("to")}
              >
                <span className="fx-flag" aria-hidden>
                  {toInfo.flag}
                </span>
                <span className="fx-chip-text">
                  <span className="fx-code">{toInfo.code}</span>
                  <span className="fx-name">{toInfo.name[lang]}</span>
                </span>
              </button>
            </div>
          </div>

          <div className="fx-result" id="result" aria-live="polite">
            <span className="fx-result-label">{t("resultLabel")}</span>
            {result !== null ? (
              <p className="fx-result-value" id="result-value">
                {formatNumber(result, locale)}
                <span className="fx-result-code">{prefs.to}</span>
              </p>
            ) : (
              <p className="fx-hint" id="result-empty">
                {!snap ? t("sourceNone") : rate === null ? t("noRateForPair") : t("enterAmount")}
              </p>
            )}
            {rate !== null && back !== null && (
              <>
                <p className="fx-unit" id="unit-rate">
                  {t("unitRate", { from: prefs.from, rate: formatNumber(rate, locale, decimalsFor(rate)), to: prefs.to })}
                </p>
                <p className="fx-unit" id="unit-rate-back">
                  {t("unitRate", { from: prefs.to, rate: formatNumber(back, locale, decimalsFor(back)), to: prefs.from })}
                </p>
              </>
            )}
          </div>

          <button type="button" id="refresh" className="fx-refresh" disabled={syncing} onClick={() => void sync(true)}>
            {online ? (
              <RefreshCw className={"size-5 " + (syncing ? "animate-spin" : "")} aria-hidden />
            ) : (
              <WifiOff className="size-5" aria-hidden />
            )}
            {syncing ? t("refreshing") : t("refresh")}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="fx-field-label m-0" id="font-size-label">
              {t("fontSizeLabel")}
            </span>
            <div className="fx-sizes" role="group" aria-labelledby="font-size-label" id="font-sizes">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className="fx-size"
                  id={`font-${size}`}
                  aria-pressed={prefs.fontSize === size}
                  onClick={() => commitPrefs({ ...prefs, fontSize: size })}
                >
                  {t(FONT_LABEL[size])}
                </button>
              ))}
            </div>
          </div>

          <p className="m-0 text-[0.78em] leading-5 text-ink-muted" id="about-text">
            {t("about")}
          </p>
          <p className="m-0 text-[0.72em] leading-5 text-ink-muted" id="source-note">
            {t("sourceNote")}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="fx-promise">
            {t(key)}
          </span>
        ))}
      </div>

      <footer className="flex flex-wrap justify-center gap-3 px-0 pt-1 pb-2 text-[0.8em] text-ink-muted">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/fxpad`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />

      <CurrencyPicker
        open={picker !== null}
        title={picker === "to" ? t("pickTo") : t("pickFrom")}
        lang={lang}
        list={list}
        selected={picker === "to" ? prefs.to : prefs.from}
        t={t}
        onOpenChange={(open) => {
          if (!open) setPicker(null);
        }}
        onPick={handlePick}
      />
    </div>
  );
}
