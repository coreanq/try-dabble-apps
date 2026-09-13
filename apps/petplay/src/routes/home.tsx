import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";

import { BackupCard } from "@/components/backup-card";
import { CareCard } from "@/components/care-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CustomizeDialog } from "@/components/customize-dialog";
import { LocalOnlyBanner } from "@/components/local-only-banner";
import { LookCard } from "@/components/look-card";
import { Masthead } from "@/components/masthead";
import { NeedsCard } from "@/components/needs-card";
import { PetStage } from "@/components/pet-stage";
import { PhotoDialog } from "@/components/photo-dialog";
import { Toast } from "@/components/toast";
import { backupFilename, buildBackup, download, parseBackup, toJSON, type ParsedBackup } from "@/lib/backup";
import { HTML_LANG, OG_IMAGE, detectLang, isLang, rememberLang, translate, type Lang, type MsgKey } from "@/lib/i18n";
import {
  AWAY_NOTICE_MS,
  TICK_MS,
  applyAction,
  catchUp,
  clearNeeds,
  freshNeeds,
  loadNeeds,
  moodOf,
  saveNeeds,
  skipHours,
  tick,
  type CareAction,
  type Needs,
} from "@/lib/needs";
import { clearPet, cleanName, loadPet, newPet, savePet, touchPet, withPhotoSprite, type Pet, type PhotoSprite } from "@/lib/pet";
import { clearPrefs, loadPrefs, savePrefs, type Prefs } from "@/lib/prefs";
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

const CHIP_KEYS: MsgKey[] = ["chipFreeCustom", "chipNoAI", "chipCareInTab", "chipBackup", "chipNoLogin", "chipNoAds", "chipLocal", "chipLangs"];
const TOAST_MS = 2200;
const ACTION_TOAST: Record<CareAction, MsgKey> = { feed: "fedToast", play: "playedToast", pet: "pettedToast", clean: "cleanedToast" };

type Confirm = { kind: "import"; parsed: ParsedBackup } | { kind: "clearAll" };

function Home() {
  const search = homeRoute.useSearch();
  const navigate = homeRoute.useNavigate();

  const lang = useMemo(() => detectLang(search.lang ?? null), [search.lang]);
  const t = useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [pet, setPet] = useState<Pet>(() => loadPet(translate(lang, "defaultName")) ?? newPet(translate(lang, "defaultName")));
  const [needs, setNeeds] = useState<Needs>(() => loadNeeds());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [bounce, setBounce] = useState(0);
  const booted = useRef(false);

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

  // Keep ?lang= on the URL so a reload, a share or a crawler hit resolves the
  // same language the Worker already baked into the first HTML.
  useEffect(() => {
    if (search.lang !== lang) navigate({ search: (prev) => ({ ...prev, lang }), replace: true });
  }, [lang, search.lang, navigate]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.title = t("title");
    setMetaContent('meta[name="description"]', t("metaDescription"));
    setMetaContent('meta[property="og:image"], meta[name="twitter:image"]', OG_IMAGE[lang]);
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", `/manifest.webmanifest?lang=${lang}`);
  }, [lang, t]);

  const commitPet = useCallback((next: Pet) => {
    setPet(next);
    savePet(next);
  }, []);
  const commitNeeds = useCallback((next: Needs) => {
    setNeeds(next);
    saveNeeds(next);
  }, []);
  const commitPrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);

  // First mount: apply the time away once (capped), persist the pet if it was
  // just born, and say hello if the pet waited a while.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    savePet(pet);
    const { needs: caught, awayMs } = catchUp(needs, Date.now(), prefs.decayPaused);
    commitNeeds(caught);
    if (awayMs >= AWAY_NOTICE_MS && !prefs.decayPaused) showToast(t("awayToast", { name: pet.name }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The in-tab clock: every TICK_MS apply the drift since the last tick.
  // Also on visibility return, so a backgrounded tab catches up at once.
  useEffect(() => {
    const run = () => setNeeds((cur) => {
      const next = tick(cur, Date.now(), prefs.decayPaused);
      saveNeeds(next);
      return next;
    });
    const id = window.setInterval(run, TICK_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [prefs.decayPaused]);

  const mood = useMemo(() => moodOf(needs), [needs]);

  // ---- care ---------------------------------------------------------------
  function care(action: CareAction) {
    commitNeeds(applyAction(tick(needs, Date.now(), prefs.decayPaused), action));
    setBounce((n) => n + 1);
    showToast(t(ACTION_TOAST[action], { name: pet.name }));
  }
  function skipHour() {
    commitNeeds({ ...skipHours(needs, 1), lastTickAt: Date.now() });
    showToast(t("skippedToast"));
  }

  // ---- name / look --------------------------------------------------------------
  function rename(name: string) {
    commitPet(touchPet({ ...pet, name: cleanName(name, pet.name) }));
    showToast(t("nameSaved"));
  }
  function applyPhoto(sprite: PhotoSprite) {
    commitPet(withPhotoSprite(pet, sprite));
    showToast(t("photoApplied"));
  }
  function useParts() {
    commitPet(withPhotoSprite(pet, null));
  }

  // ---- backup ----------------------------------------------------------------------
  function exportJson() {
    download(toJSON(buildBackup(pet, needs, prefs)), backupFilename(), "application/json");
    showToast(t("exported"));
  }
  async function importFile(file: File) {
    let parsed: ParsedBackup;
    try {
      parsed = parseBackup(await file.text());
    } catch {
      showToast(t("importBad"));
      return;
    }
    setConfirm({ kind: "import", parsed });
  }
  function applyImport(parsed: ParsedBackup) {
    commitPet(parsed.pet);
    commitNeeds({ ...parsed.needs, lastTickAt: Date.now() });
    if (parsed.prefs) commitPrefs(parsed.prefs);
    showToast(t("importOk", { name: parsed.pet.name }));
  }
  function clearAll() {
    clearPet();
    clearNeeds();
    clearPrefs();
    const born = newPet(t("defaultName"));
    commitPet(born);
    commitNeeds(freshNeeds());
    commitPrefs({ decayPaused: false });
    showToast(t("cleared"));
  }

  const confirmText = (() => {
    if (!confirm) return { title: "", body: "", ok: "" };
    switch (confirm.kind) {
      case "import":
        return { title: t("importConfirmTitle"), body: t("importConfirmBody"), ok: t("importJson") };
      case "clearAll":
        return { title: t("clearAllTitle"), body: t("clearAllBody"), ok: t("delete") };
    }
  })();

  return (
    <div className="pp-app">
      <LocalOnlyBanner text={t("localOnly")} />
      <Masthead
        t={t}
        lang={lang}
        onLangChange={(nextLang) => {
          rememberLang(nextLang);
          navigate({ search: (prev) => ({ ...prev, lang: nextLang }), replace: true });
        }}
      />

      {/* 3. Pet stage */}
      <PetStage pet={pet} mood={mood} t={t} bounce={bounce} />

      {/* 4. Needs meters */}
      <NeedsCard t={t} needs={needs} />

      {/* 5. Care actions */}
      <CareCard t={t} decayPaused={prefs.decayPaused} onAction={care} onSkipHour={skipHour} onTogglePause={(paused) => commitPrefs({ ...prefs, decayPaused: paused })} />

      {/* 6/7. Name + look */}
      <LookCard t={t} pet={pet} onRename={rename} onCustomize={() => setCustomizeOpen(true)} onUsePhoto={() => setPhotoOpen(true)} onUseParts={useParts} />

      {/* 9. Backup */}
      <BackupCard t={t} onExportJson={exportJson} onImportFile={importFile} onClearAll={() => setConfirm({ kind: "clearAll" })} />

      {/* 8. Fail-case chips */}
      <div className="flex flex-wrap gap-[0.3rem]" id="promise-chips">
        {CHIP_KEYS.map((key) => (
          <span key={key} className="pp-promise">
            {t(key)}
          </span>
        ))}
      </div>

      {/* 10. Footer */}
      <footer className="pp-footer">
        <a id="link-privacy" href={`https://try-dabble.com/${lang}/privacy`}>
          {t("privacy")}
        </a>
        <a id="link-terms" href={`https://try-dabble.com/${lang}/terms`}>
          {t("terms")}
        </a>
        <a id="link-guide" href={`https://try-dabble.com/${lang}/guides/petplay`}>
          {t("guide")}
        </a>
        <a id="link-hub" href={`https://try-dabble.com/${lang}`}>
          try-dabble.com
        </a>
      </footer>

      <CustomizeDialog open={customizeOpen} pet={pet} mood={mood} t={t} onOpenChange={setCustomizeOpen} onChange={commitPet} />
      <PhotoDialog open={photoOpen} t={t} onOpenChange={setPhotoOpen} onApply={applyPhoto} onError={showToast} />
      <ConfirmDialog
        open={confirm !== null}
        title={confirmText.title}
        body={confirmText.body}
        confirmLabel={confirmText.ok}
        cancelLabel={t("cancel")}
        destructive={confirm?.kind !== "import"}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        onConfirm={() => {
          if (!confirm) return;
          switch (confirm.kind) {
            case "import":
              applyImport(confirm.parsed);
              break;
            case "clearAll":
              clearAll();
              break;
          }
        }}
      />
      <Toast message={toastMsg} visible={toastOn} />
    </div>
  );
}
