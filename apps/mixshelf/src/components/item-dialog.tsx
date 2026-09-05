import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MEDIA_TYPES,
  type ItemStatus,
  type MediaType,
  type ShelfItem,
  uniqueTags,
} from "@/lib/items";
import { statusLabel, typeLabel, type Lang, type MsgKey } from "@/lib/i18n";

const STATUSES: ItemStatus[] = [
  "",
  "unread",
  "reading",
  "read",
  "playing",
  "finished",
  "wishlist",
];

const inputStyle = { fontSize: 16, touchAction: "manipulation" as const };

export function ItemDialog({
  open,
  lang,
  t,
  initial,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  lang: Lang;
  t: (key: MsgKey, vars?: Record<string, string | number>) => string;
  initial: ShelfItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: {
    title: string;
    type: MediaType;
    tags: string[];
    notes: string;
    status: ItemStatus;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MediaType>("book");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ItemStatus>("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setType(initial.type);
      setTags([...initial.tags]);
      setNotes(initial.notes);
      setStatus(initial.status);
    } else {
      setTitle("");
      setType("book");
      setTags([]);
      setNotes("");
      setStatus("");
    }
    setTagDraft("");
    setErr("");
  }, [open, initial]);

  function addTag() {
    const v = tagDraft.trim();
    if (!v) return;
    setTags(uniqueTags([...tags, v]));
    setTagDraft("");
  }

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setErr(t("titleRequired"));
      return;
    }
    onSave({ title: trimmed, type, tags, notes: notes.trim(), status });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="item-dialog" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle id="item-dialog-title">
            {initial ? t("editTitle") : t("addTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="ms-form grid gap-3">
          <label className="grid gap-1">
            <span>{t("titleLabel")}</span>
            <input
              id="item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              style={inputStyle}
              autoComplete="off"
            />
            {err ? <span className="ms-err">{err}</span> : null}
          </label>
          <label className="grid gap-1">
            <span>{t("typeLabel")}</span>
            <select
              id="item-type"
              value={type}
              onChange={(e) => setType(e.target.value as MediaType)}
              style={inputStyle}
            >
              {MEDIA_TYPES.map((mt) => (
                <option key={mt} value={mt}>
                  {typeLabel(lang, mt)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-1">
            <span>
              {t("tagsLabel")} <em className="ms-opt">({t("optional")})</em>
            </span>
            <div className="flex flex-wrap gap-1" id="item-tags-list">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className="ms-chip"
                  data-kind="yes"
                  style={inputStyle}
                  onClick={() => setTags(tags.filter((x) => x !== tag))}
                  title="remove"
                >
                  {tag} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                id="item-tag-input"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder={t("tagsPlaceholder")}
                style={inputStyle}
                className="flex-1"
                autoComplete="off"
              />
              <Button type="button" id="item-tag-add" size="sm" onClick={addTag} style={inputStyle}>
                {t("addTag")}
              </Button>
            </div>
            <p className="ms-hint">{t("tagsHint")}</p>
          </div>
          <label className="grid gap-1">
            <span>
              {t("statusLabel")} <em className="ms-opt">({t("optional")})</em>
            </span>
            <select
              id="item-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ItemStatus)}
              style={inputStyle}
            >
              {STATUSES.map((st) => (
                <option key={st || "none"} value={st}>
                  {statusLabel(lang, st)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span>
              {t("notesLabel")} <em className="ms-opt">({t("optional")})</em>
            </span>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              style={inputStyle}
            />
          </label>
        </div>
        <DialogFooter>
          <Button
            id="item-cancel"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            style={inputStyle}
          >
            {t("cancel")}
          </Button>
          <Button id="item-save" size="sm" onClick={submit} style={inputStyle}>
            {initial ? t("save") : t("addButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
