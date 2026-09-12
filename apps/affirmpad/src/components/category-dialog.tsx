import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import { NAME_MAX, type Category } from "@/lib/store";

/**
 * Manage topics in one sheet: the list with an edit pencil per row, and a
 * single name field that either adds a new topic or renames the one being
 * edited. Deleting asks the parent to confirm. Every topic is free.
 */
export function CategoryDialog({
  open,
  categories,
  counts,
  t,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  categories: Category[];
  counts: Map<string, number>;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: { id: string | null; name: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setEditingId(null);
    setName("");
    setError("");
  }, [open]);

  function startEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setError("");
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("nameLabel"));
      return;
    }
    onSave({ id: editingId, name: trimmed.slice(0, NAME_MAX) });
    setEditingId(null);
    setName("");
    setError("");
  }

  const editing = editingId ? categories.find((c) => c.id === editingId) ?? null : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="category-dialog" className="gap-3">
        <DialogTitle className="ap-sheet-title pr-8">{t("manageCategories")}</DialogTitle>
        <DialogDescription className="ap-hint">{t("categoriesFreeHint")}</DialogDescription>
        {categories.length === 0 ? (
          <p className="ap-hint" id="categories-empty">
            {t("noCategories")}
          </p>
        ) : (
          <ul className="ap-list" id="category-list">
            {categories.map((c) => (
              <li key={c.id} className="ap-row items-center" style={{ ["--ap-cat-color" as string]: c.color ?? "#a78bfa" }} data-active={editingId === c.id ? "true" : "false"}>
                <span className="ap-badge-dot" aria-hidden />
                <span className="ap-row-main" style={{ cursor: "default" }}>
                  <span className="ap-row-text">{c.name}</span>
                  <span className="ap-row-meta">{counts.get(c.id) ?? 0}</span>
                </span>
                <button type="button" className="ap-btn ap-btn-icon" aria-label={`${t("edit")}: ${c.name}`} data-role="edit-category" onClick={() => startEdit(c)}>
                  <Pencil className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="ap-field-label" htmlFor="cat-name">
              {editing ? t("editCategoryTitle") : t("newCategoryTitle")}
            </label>
            <input
              id="cat-name"
              className="ap-input"
              type="text"
              autoComplete="off"
              enterKeyHint="done"
              maxLength={NAME_MAX}
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
            />
          </div>
          {error && (
            <p className="ap-error" role="alert" id="cat-error">
              {error}
            </p>
          )}
          <div className="ap-actions">
            {editing ? (
              <button
                type="button"
                className="ap-btn ap-btn-quiet"
                id="cat-cancel"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setError("");
                }}
              >
                {t("cancel")}
              </button>
            ) : (
              <button type="button" className="ap-btn ap-btn-quiet" id="cat-close" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </button>
            )}
            <button type="submit" className="ap-btn ap-btn-primary" id="cat-save">
              {editing ? <Pencil className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {editing ? t("save") : t("addCategory")}
            </button>
            {editing && (
              <button type="button" className="ap-btn ap-btn-danger col-span-2" id="cat-delete" onClick={() => onDelete(editing.id)}>
                {t("deleteCategory")} ({counts.get(editing.id) ?? 0})
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
