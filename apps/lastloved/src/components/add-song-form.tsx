import { useRef, useState } from "react";

import { YearsPicker } from "@/components/years-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import { MAX_ARTIST, MAX_TITLE, todayISO } from "@/lib/songs";

/**
 * The only way a song gets on the shelf: you type a title and an artist.
 * There is no library scan, no streaming login and no 100-song requirement —
 * that is the whole point. The date defaults to today and the years default to
 * whatever you chose last time; both stay editable right here.
 */
export function AddSongForm({
  t,
  defaultYears,
  onYearsChange,
  onAdd,
}: {
  t: Translate;
  defaultYears: number;
  onYearsChange: (years: number) => void;
  onAdd: (title: string, artist: string, lastLoved: string, years: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lastLoved, setLastLoved] = useState(() => todayISO());
  const [error, setError] = useState<"title" | "artist" | null>(null);
  // Focus returns to the title box after a submit, but nothing is focused on
  // load — an autofocused field would shove the phone keyboard up on arrival.
  const titleRef = useRef<HTMLInputElement>(null);
  const artistRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanArtist = artist.trim();
    if (!cleanTitle) {
      setError("title");
      titleRef.current?.focus();
      return;
    }
    if (!cleanArtist) {
      setError("artist");
      artistRef.current?.focus();
      return;
    }
    onAdd(cleanTitle, cleanArtist, lastLoved || todayISO(), defaultYears);
    setTitle("");
    setArtist("");
    setLastLoved(todayISO());
    setError(null);
    titleRef.current?.focus();
  }

  return (
    <Card id="add-card">
      <CardHeader>
        <CardTitle id="add-title">{t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-[0.5rem]" onSubmit={submit} noValidate>
          <div>
            <label className="ll-label" htmlFor="add-song-title">
              {t("titleLabel")}
            </label>
            <input
              id="add-song-title"
              ref={titleRef}
              className="ll-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_TITLE}
              value={title}
              placeholder={t("titlePlaceholder")}
              aria-invalid={error === "title" || undefined}
              aria-describedby={error === "title" ? "add-title-error" : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error === "title") setError(null);
              }}
            />
            {error === "title" ? (
              <p
                className="mt-[0.3rem] mb-0 text-[0.72rem] font-bold text-destructive"
                id="add-title-error"
                role="alert"
              >
                {t("titleRequired")}
              </p>
            ) : null}
          </div>

          <div>
            <label className="ll-label" htmlFor="add-song-artist">
              {t("artistLabel")}
            </label>
            <input
              id="add-song-artist"
              ref={artistRef}
              className="ll-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_ARTIST}
              value={artist}
              placeholder={t("artistPlaceholder")}
              aria-invalid={error === "artist" || undefined}
              aria-describedby={error === "artist" ? "add-artist-error" : undefined}
              onChange={(e) => {
                setArtist(e.target.value);
                if (error === "artist") setError(null);
              }}
            />
            {error === "artist" ? (
              <p
                className="mt-[0.3rem] mb-0 text-[0.72rem] font-bold text-destructive"
                id="add-artist-error"
                role="alert"
              >
                {t("artistRequired")}
              </p>
            ) : null}
          </div>

          <div>
            <label className="ll-label" htmlFor="add-song-date">
              {t("lastLovedLabel")}
            </label>
            <input
              id="add-song-date"
              className="ll-field ll-date mt-[0.25rem] h-10 py-0"
              type="date"
              value={lastLoved}
              onChange={(e) => setLastLoved(e.target.value)}
            />
          </div>

          <div>
            <span className="ll-label" id="add-years-label">
              {t("yearsLabel")}
            </span>
            <div className="mt-[0.3rem]">
              <YearsPicker
                value={defaultYears}
                onChange={onYearsChange}
                t={t}
                idPrefix="add"
              />
            </div>
            <p className="mt-[0.3rem] mb-0 text-[0.7rem] leading-[1.4] text-muted-ink" id="add-years-note">
              {t("defaultYearsNote")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-[0.4rem]">
            <p className="m-0 text-[0.7rem] leading-[1.4] text-muted-ink" id="add-hint">
              {t("addHint")}
            </p>
            <Button id="add-submit" type="submit" size="sm">
              {t("addButton")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
