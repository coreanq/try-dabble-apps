/**
 * The small sheets: edit a track, name a playlist, pick a playlist, the
 * equalizer, and the "…" action list for a track. All on shadcn Dialog, all
 * without autofocus (no input steals the keyboard on open).
 */
import { useEffect, useState } from "react";
import { Heart, ListPlus, ListMusic, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import type { EqBands, Playlist, Track } from "@/lib/library";

export function EditTrackDialog({
  track,
  t,
  onOpenChange,
  onSave,
}: {
  track: Track | null;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: { title: string; artist: string; album: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setArtist(track.artist);
      setAlbum(track.album);
    }
  }, [track]);

  return (
    <Dialog open={track !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <form
          className="grid gap-[0.7rem]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onSave({ title: title.trim(), artist: artist.trim(), album: album.trim() });
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-[1.05rem] font-extrabold text-ink">{t("editTrack")}</DialogTitle>
            <DialogDescription className="text-[0.78rem] text-ink-muted">
              {t("fieldFile")}: {track?.fileName}
            </DialogDescription>
          </DialogHeader>
          <label className="lp-field-label" htmlFor="edit-title">
            {t("fieldTitle")}
            <input
              id="edit-title"
              className="lp-input mt-1"
              type="text"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="lp-field-label" htmlFor="edit-artist">
            {t("fieldArtist")}
            <input
              id="edit-artist"
              className="lp-input mt-1"
              type="text"
              value={artist}
              maxLength={200}
              onChange={(e) => setArtist(e.target.value)}
            />
          </label>
          <label className="lp-field-label" htmlFor="edit-album">
            {t("fieldAlbum")}
            <input
              id="edit-album"
              className="lp-input mt-1"
              type="text"
              value={album}
              maxLength={200}
              onChange={(e) => setAlbum(e.target.value)}
            />
          </label>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!title.trim()}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NameDialog({
  open,
  title,
  initial,
  confirmLabel,
  t,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initial: string;
  confirmLabel: string;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  useEffect(() => {
    if (open) setName(initial);
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <form
          className="grid gap-[0.7rem]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onSubmit(name.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-[1.05rem] font-extrabold text-ink">{title}</DialogTitle>
          </DialogHeader>
          <label className="lp-field-label" htmlFor="playlist-name">
            {t("playlistName")}
            <input
              id="playlist-name"
              className="lp-input mt-1"
              type="text"
              value={name}
              maxLength={80}
              placeholder={t("playlistNamePlaceholder")}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim()}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddToPlaylistDialog({
  track,
  playlists,
  t,
  onOpenChange,
  onPick,
  onCreate,
}: {
  track: Track | null;
  playlists: Playlist[];
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onPick: (playlistId: string) => void;
  onCreate: () => void;
}) {
  return (
    <Dialog open={track !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-[1.05rem] font-extrabold text-ink">{t("addToPlaylistTitle")}</DialogTitle>
          <DialogDescription className="truncate text-[0.78rem] text-ink-muted">{track?.title}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-[0.4rem]">
          <button type="button" className="lp-sheet-btn" onClick={onCreate}>
            <ListPlus className="size-4 text-indigo" aria-hidden />
            {t("newPlaylist")}
          </button>
          {playlists.map((p) => {
            const has = track ? p.trackIds.includes(track.id) : false;
            return (
              <button
                key={p.id}
                type="button"
                className="lp-sheet-btn"
                disabled={has}
                onClick={() => onPick(p.id)}
              >
                <ListMusic className="size-4 text-ink-muted" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="lp-slug">{t("trackCount", { n: p.trackIds.length })}</span>
              </button>
            );
          })}
          {playlists.length === 0 && (
            <p className="m-0 text-[0.8rem] text-ink-muted">{t("noPlaylists")}</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const BAND_KEYS = ["eqLow", "eqMid", "eqHigh"] as const;
const BAND_HZ = ["200 Hz", "1 kHz", "4 kHz"];

export function EqDialog({
  open,
  bands,
  supported,
  t,
  onOpenChange,
  onChange,
}: {
  open: boolean;
  bands: EqBands;
  supported: boolean;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onChange: (bands: EqBands) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-[1.05rem] font-extrabold text-ink">{t("eqTitle")}</DialogTitle>
          <DialogDescription className="text-[0.78rem] text-ink-muted">{t("eqHint")}</DialogDescription>
        </DialogHeader>
        {!supported && <p className="lp-warn">{t("eqUnsupported")}</p>}
        <div className="grid gap-[0.55rem]">
          {BAND_KEYS.map((key, i) => (
            <div key={key} className="grid gap-[0.1rem]">
              <div className="flex items-center justify-between">
                <label className="lp-field-label mb-0" htmlFor={`eq-${i}`}>
                  {t(key)} <span className="font-semibold text-ink-muted/70">{BAND_HZ[i]}</span>
                </label>
                <span className="lp-db">
                  {bands[i] > 0 ? "+" : ""}
                  {bands[i]} dB
                </span>
              </div>
              <input
                id={`eq-${i}`}
                className="lp-slider"
                type="range"
                min={-12}
                max={12}
                step={1}
                value={bands[i]}
                onChange={(e) => {
                  const next: EqBands = [bands[0], bands[1], bands[2]];
                  next[i] = Number(e.target.value);
                  onChange(next);
                }}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onChange([0, 0, 0])}>
            {t("eqReset")}
          </Button>
          <DialogClose asChild>
            <Button type="button">{t("close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TrackActionsDialog({
  track,
  inPlaylist,
  t,
  onOpenChange,
  onQueue,
  onFavorite,
  onAddToPlaylist,
  onEdit,
  onRemoveFromPlaylist,
  onRemove,
}: {
  track: Track | null;
  inPlaylist: boolean;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onQueue: () => void;
  onFavorite: () => void;
  onAddToPlaylist: () => void;
  onEdit: () => void;
  onRemoveFromPlaylist: () => void;
  onRemove: () => void;
}) {
  return (
    <Dialog open={track !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="truncate text-[1.05rem] font-extrabold text-ink">{track?.title}</DialogTitle>
          <DialogDescription className="truncate text-[0.78rem] text-ink-muted">
            {track?.artist || t("unknownArtist")}
            {track?.album ? ` · ${track.album}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-[0.4rem]">
          <button type="button" className="lp-sheet-btn" onClick={onQueue}>
            <ListPlus className="size-4 text-indigo" aria-hidden />
            {t("addToQueue")}
          </button>
          <button type="button" className="lp-sheet-btn" onClick={onFavorite}>
            <Heart className="size-4 text-rose" fill={track?.favorite ? "currentColor" : "none"} aria-hidden />
            {track?.favorite ? t("unfavorite") : t("favorite")}
          </button>
          <button type="button" className="lp-sheet-btn" onClick={onAddToPlaylist}>
            <ListMusic className="size-4 text-indigo" aria-hidden />
            {t("addToPlaylist")}
          </button>
          <button type="button" className="lp-sheet-btn" onClick={onEdit}>
            <Pencil className="size-4 text-ink-muted" aria-hidden />
            {t("editTrack")}
          </button>
          {inPlaylist && (
            <button type="button" className="lp-sheet-btn" onClick={onRemoveFromPlaylist}>
              <X className="size-4 text-ink-muted" aria-hidden />
              {t("removeFromPlaylist")}
            </button>
          )}
          <button type="button" className="lp-sheet-btn lp-sheet-btn-danger" onClick={onRemove}>
            <Trash2 className="size-4" aria-hidden />
            {t("remove")}
          </button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
