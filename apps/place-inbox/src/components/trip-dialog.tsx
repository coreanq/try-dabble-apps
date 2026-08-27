import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Translate } from "@/lib/i18n";
import type { Trip } from "@/lib/places";

/** A candidate trip is only a name — the bucket places get filed into. */
export function TripDialog({
  open,
  trip,
  t,
  onOpenChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  trip: Trip | null;
  t: Translate;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string | null, name: string) => boolean;
  onDelete: (trip: Trip) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(trip?.name ?? "");
  }, [open, trip]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (onSubmit(trip?.id ?? null, name.trim())) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="trip-dialog" className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle id="trip-form-title">{trip ? t("tripEdit") : t("tripAdd")}</DialogTitle>
        </DialogHeader>
        <form id="trip-form" className="grid gap-3" autoComplete="off" onSubmit={handleSubmit}>
          <label className="pi-label">
            <span>{t("tripName")}</span>
            <input
              id="trip-name"
              className="pi-field"
              type="text"
              maxLength={80}
              required
              autoFocus
              placeholder={t("tripNamePh")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <DialogFooter>
            {trip && (
              <Button
                type="button"
                id="trip-delete"
                variant="destructive"
                size="sm"
                className="mr-auto"
                onClick={() => onDelete(trip)}
              >
                {t("delete")}
              </Button>
            )}
            <Button
              type="button"
              id="trip-cancel"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" id="trip-save" size="sm">
              {trip ? t("update") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
