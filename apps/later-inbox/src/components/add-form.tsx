import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import { normalizeUrl } from "@/lib/items";

export interface NewLink {
  url: string;
  why: string;
  title: string;
}

export function AddForm({
  t,
  onSave,
  onError,
}: {
  t: Translate;
  /** Called only with an already-normalized URL and a non-empty why. */
  onSave: (link: NewLink) => void;
  onError: (message: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [why, setWhy] = useState("");
  const [title, setTitle] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = url.trim();
    if (!raw) {
      onError(t("needUrl"));
      return;
    }
    const normalized = normalizeUrl(raw);
    if (!normalized) {
      onError(t("badUrl"));
      return;
    }
    if (!why.trim()) {
      onError(t("needWhy"));
      return;
    }
    onSave({ url: normalized, why: why.trim(), title: title.trim() });
    setUrl("");
    setWhy("");
    setTitle("");
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      const first = (text || "").trim().split(/\s+/)[0];
      const normalized = normalizeUrl(first);
      if (!normalized) {
        onError(t("noClipboardUrl"));
        return;
      }
      setUrl(normalized);
    } catch {
      onError(t("clipboardDenied"));
    }
  }

  return (
    <Card id="add-card">
      <CardHeader>
        <CardTitle id="add-title">{t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="add-form" className="grid gap-[0.6rem]" autoComplete="off" onSubmit={handleSubmit}>
          <label className="li-label">
            <span id="label-add-url">{t("addUrl")}</span>
            <div className="flex min-w-0 items-center gap-[0.4rem]">
              <input
                id="add-url"
                className="li-field"
                type="url"
                inputMode="url"
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                type="button"
                id="paste-url-btn"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={handlePaste}
              >
                {t("pasteUrl")}
              </Button>
            </div>
          </label>

          <label className="li-label">
            <span id="label-add-why">{t("addWhy")}</span>
            <input
              id="add-why"
              className="li-field"
              type="text"
              maxLength={200}
              placeholder={t("addWhyPh")}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
            />
          </label>

          <label className="li-label">
            <span id="label-add-title">{t("addTitleLabel")}</span>
            <input
              id="add-title-input"
              className="li-field"
              type="text"
              maxLength={160}
              placeholder={t("addTitlePh")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <Button type="submit" id="add-save" className="mt-[0.15rem] justify-self-start">
            {t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
