import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MsgKey, Translate } from "@/lib/i18n";
import { PROFILE_FIELDS, type Profile, type ProfileField } from "@/lib/spec";

/** A cheat-sheet the applicant copies into a form by hand. Explicitly NOT
 *  autofill of any government or exam site. */
const FIELD_META: Record<
  ProfileField,
  { label: MsgKey; autoComplete?: string; maxLength: number; type?: string; multiline?: boolean }
> = {
  name: { label: "name", autoComplete: "name", maxLength: 120 },
  dob: { label: "dob", autoComplete: "bday", maxLength: 40 },
  phone: { label: "phone", autoComplete: "tel", maxLength: 40, type: "tel" },
  email: { label: "email", autoComplete: "email", maxLength: 120, type: "email" },
  address: { label: "address", autoComplete: "street-address", maxLength: 400, multiline: true },
  father: { label: "father", maxLength: 120 },
  mother: { label: "mother", maxLength: 120 },
  nid: { label: "nid", maxLength: 160 },
};

export function ProfileCard({
  t,
  profile,
  onChange,
  onCopy,
}: {
  t: Translate;
  profile: Profile;
  onChange: (field: ProfileField, value: string) => void;
  onCopy: (field: ProfileField) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        <p className="ps-hint">{t("profileHint")}</p>
        {PROFILE_FIELDS.map((field) => {
          const meta = FIELD_META[field];
          return (
            <div className="ps-row" key={field}>
              <label className="ps-label">
                <span>{t(meta.label)}</span>
                {meta.multiline ? (
                  <textarea
                    id={`pf-${field}`}
                    className="ps-field"
                    rows={2}
                    maxLength={meta.maxLength}
                    autoComplete={meta.autoComplete}
                    value={profile[field]}
                    onChange={(e) => onChange(field, e.target.value)}
                  />
                ) : (
                  <input
                    id={`pf-${field}`}
                    className="ps-field"
                    type={meta.type ?? "text"}
                    maxLength={meta.maxLength}
                    autoComplete={meta.autoComplete}
                    placeholder={field === "dob" ? "1994-03-21" : undefined}
                    value={profile[field]}
                    onChange={(e) => onChange(field, e.target.value)}
                  />
                )}
              </label>
              <Button variant="outline" size="sm" onClick={() => onCopy(field)}>
                {t("copy")}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
