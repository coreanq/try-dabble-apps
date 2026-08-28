import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n";
import { MAX_CONTEXT, MAX_NAME } from "@/lib/people";

/**
 * The only way people get into the book: you type a name. There is no contacts
 * import, no permission prompt and no invite step — that is the whole point.
 * Name is required; the "how you met" line is optional and never blocks.
 */
export function AddPersonForm({
  t,
  onAdd,
}: {
  t: Translate;
  onAdd: (name: string, context: string) => void;
}) {
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [error, setError] = useState(false);
  // Focus returns to the name box after a submit, but nothing is focused on
  // load — an autofocused field would shove the phone keyboard up on arrival.
  const nameRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(true);
      nameRef.current?.focus();
      return;
    }
    onAdd(trimmed, context.trim());
    setName("");
    setContext("");
    setError(false);
    nameRef.current?.focus();
  }

  return (
    <Card id="add-card">
      <CardHeader>
        <CardTitle id="add-title">{t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-[0.5rem]" onSubmit={submit} noValidate>
          <div>
            <label className="kl-label" htmlFor="add-name">
              {t("nameLabel")}
            </label>
            <input
              id="add-name"
              ref={nameRef}
              className="kl-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_NAME}
              value={name}
              placeholder={t("namePlaceholder")}
              aria-invalid={error || undefined}
              aria-describedby={error ? "add-name-error" : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(false);
              }}
            />
            {error ? (
              <p
                className="mt-[0.3rem] mb-0 text-[0.72rem] font-bold text-destructive"
                id="add-name-error"
                role="alert"
              >
                {t("nameRequired")}
              </p>
            ) : null}
          </div>

          <div>
            <label className="kl-label" htmlFor="add-context">
              {t("contextLabel")}
            </label>
            <input
              id="add-context"
              className="kl-field mt-[0.25rem]"
              type="text"
              autoComplete="off"
              maxLength={MAX_CONTEXT}
              value={context}
              placeholder={t("contextPlaceholder")}
              onChange={(e) => setContext(e.target.value)}
            />
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
