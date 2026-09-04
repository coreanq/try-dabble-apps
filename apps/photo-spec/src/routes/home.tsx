import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createRoute } from "@tanstack/react-router";

import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { PreviewCard, type Readout } from "@/components/preview-card";
import { ProfileCard } from "@/components/profile-card";
import { SourceCard } from "@/components/source-card";
import { SpecCard } from "@/components/spec-card";
import { Toast } from "@/components/toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  HTML_LANG,
  OG_IMAGE,
  detectLang,
  isLang,
  rememberLang,
  translate,
  type Lang,
  type MsgKey,
} from "@/lib/i18n";
import { closeImage, drawToCanvas, fitToSpec, loadImage, type ImageSource } from "@/lib/encode";
import {
  clampOffset,
  downloadName,
  isInRange,
  loadProfile,
  loadSettings,
  saveProfile,
  saveSettings,
  specFor,
  type CustomSpec,
  type PresetId,
  type Profile,
  type ProfileField,
} from "@/lib/spec";
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

const TOAST_MS = 1600;
/** Re-encoding is cheap at these sizes; 40ms is enough to coalesce typing. */
const ENCODE_DEBOUNCE_MS = 40;

interface Loaded {
  img: ImageSource;
  w: number;
  h: number;
}

function setMetaContent(selector: string, value: string) {
  document.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => {
    el.setAttribute("content", value);
  });
}

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const [settings, setSettings] = useState(loadSettings);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [readout, setReadout] = useState<Readout | null>(null);
  const [dragging, setDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const spec = useMemo(() => specFor(settings), [settings]);
  const captionName = spec.caption ? profile.name : "";

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
    setMetaContent(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
      t("title"),
    );
    setMetaContent('meta[property="og:title"], meta[name="twitter:title"]', t("title"));
    setMetaContent(
      'meta[property="og:description"], meta[name="twitter:description"]',
      t("metaDescription"),
    );
  }, [lang, t]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const timer = window.setTimeout(() => saveProfile(profile), 200);
    return () => window.clearTimeout(timer);
  }, [profile]);

  // Re-fit whenever the spec, the crop or the printed caption changes.
  useEffect(() => {
    if (!loaded) {
      blobRef.current = null;
      setReadout(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const clamped = clampOffset(
        loaded.w,
        loaded.h,
        spec,
        offsetRef.current.x,
        offsetRef.current.y,
      );
      offsetRef.current = clamped;
      fitToSpec(loaded.img, loaded.w, loaded.h, spec, clamped.x, clamped.y, captionName)
        .then((result) => {
          if (cancelled || !result) return;
          blobRef.current = result.blob;
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = result.w;
            canvas.height = result.h;
            canvas.getContext("2d")?.drawImage(result.canvas, 0, 0);
          }
          setReadout({
            w: result.w,
            h: result.h,
            kb: result.kb,
            inRange: isInRange(result.kb, spec),
            spec,
          });
        })
        .catch(() => {
          /* an unreadable frame — the last good preview stays put */
        });
    }, ENCODE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loaded, spec, offset, captionName]);

  const pickFile = useCallback(async (file: Blob) => {
    if (!String(file.type || "").startsWith("image/")) return;
    try {
      const img = await loadImage(file);
      setLoaded((prev) => {
        if (prev) closeImage(prev.img);
        return { img, w: img.width, h: img.height };
      });
      offsetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
    } catch {
      /* not an image this browser can decode */
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setLoaded((prev) => {
      if (prev) closeImage(prev.img);
      return null;
    });
    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
    blobRef.current = null;
    setReadout(null);
  }, []);

  // Ctrl+V anywhere on the page drops a clipboard image onto the bench.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void pickFile(file);
          }
          return;
        }
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [pickFile]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!loaded || !readout) return;
      if ((e.target as HTMLElement).closest("button")) return;
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [loaded, readout],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const start = dragRef.current;
      const canvas = canvasRef.current;
      if (!start || !loaded || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = loaded.w / Math.max(1, rect.width);
      const scaleY = loaded.h / Math.max(1, rect.height);
      const next = clampOffset(
        loaded.w,
        loaded.h,
        spec,
        start.ox - (e.clientX - start.x) * scaleX,
        start.oy - (e.clientY - start.y) * scaleY,
      );
      offsetRef.current = next;
      // Redraw straight to the light box while the finger is down; the KB
      // re-fit waits for the release so dragging never stutters.
      const tmp = drawToCanvas(
        loaded.img,
        loaded.w,
        loaded.h,
        canvas.width,
        canvas.height,
        spec,
        next.x,
        next.y,
        captionName,
      );
      canvas.getContext("2d")?.drawImage(tmp, 0, 0);
    },
    [loaded, spec, captionName],
  );

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    setOffset({ ...offsetRef.current });
  }, []);

  const download = useCallback(() => {
    const blob = blobRef.current;
    if (!blob || !readout) return;
    const name = downloadName(readout.w, readout.h, readout.kb, readout.spec.format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, [readout]);

  const copyField = useCallback(
    async (field: ProfileField) => {
      const value = (profile[field] || "").trim();
      if (!value) {
        showToast(t("emptyCopy"));
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const el = document.getElementById(`pf-${field}`);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.focus();
          el.select();
        }
      }
      showToast(t("copied"));
    },
    [profile, showToast, t],
  );

  const setLang = useCallback(
    (next: Lang) => {
      rememberLang(next);
      navigate({ search: (prev) => ({ ...prev, lang: next }), replace: true });
    },
    [navigate],
  );

  const selectPreset = useCallback((preset: PresetId) => {
    setSettings((prev) => ({ ...prev, preset }));
  }, []);

  const changeCustom = useCallback((patch: Partial<CustomSpec>) => {
    setSettings((prev) => ({ ...prev, preset: "custom", custom: { ...prev.custom, ...patch } }));
  }, []);

  const changeProfile = useCallback((field: ProfileField, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="ps-shell">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        title={t("title")}
        tagline={t("tagline")}
        langLabel={t("langLabel")}
        lang={lang}
        onLangChange={setLang}
      />

      <Card size="sm">
        <CardContent>
          <p className="ps-hint">{t("about")}</p>
        </CardContent>
      </Card>

      <SpecCard settings={settings} onSelect={selectPreset} onCustomChange={changeCustom} t={t} />

      <SourceCard t={t} hasPhoto={!!loaded} onPick={pickFile} onClear={clearPhoto} />

      <PreviewCard
        t={t}
        canvasRef={canvasRef}
        ready={!!loaded}
        dragging={dragging}
        readout={readout}
        onDownload={download}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />


      <ProfileCard t={t} profile={profile} onChange={changeProfile} onCopy={copyField} />

      <footer className="ps-footer">
        <a href={`https://try-dabble.com/privacy?lang=${lang}`}>{t("privacy")}</a>
        <a href={`https://try-dabble.com/terms?lang=${lang}`}>{t("terms")}</a>
        <span>try-dabble.com</span>
      </footer>

      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
