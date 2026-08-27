import { MapPin } from "lucide-react";

import { usePhotoUrl } from "@/lib/use-photo-url";
import type { Translate } from "@/lib/i18n";
import type { Place } from "@/lib/places";

const TAG_LABEL = {
  food: "tagFood",
  hike: "tagHike",
  city: "tagCity",
  beach: "tagBeach",
  stay: "tagStay",
} as const;

function ExtraLink({ href, label }: { href: string; label: string }) {
  if (!href) return null;
  return (
    <a className="pi-link" href={href} target="_blank" rel="noreferrer noopener">
      {label}
    </a>
  );
}

/**
 * One saved place, mounted like a stamp in an album: the photo sits in a
 * perforated frame, the want-to-go rank is struck over it as a postmark, and
 * the why-note is written on the ruled line underneath.
 */
export function PlaceStamp({
  place,
  tripLabel,
  t,
  onEdit,
}: {
  place: Place;
  tripLabel: string;
  t: Translate;
  onEdit: (place: Place) => void;
}) {
  const photo = usePhotoUrl(place.photoId);
  const title = place.name || place.url || "…";
  const pinned = place.lat != null && place.lng != null;

  return (
    <li className="relative rounded-[4px] border border-sand-edge bg-[#fffdf7] p-2.5 shadow-[1px_2px_0_rgba(21,56,76,0.06)]">
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          className="pi-stamp size-[74px] shrink-0 [--perf-bg:#fffdf7]"
          onClick={() => onEdit(place)}
          aria-label={`${t("placeEdit")}: ${title}`}
        >
          <span className="pi-stamp-inner size-full">
            {photo ? (
              <img src={photo} alt="" />
            ) : (
              <MapPin className="size-6 text-marine" aria-hidden="true" />
            )}
          </span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start gap-2">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onEdit(place)}
            >
              <span className="block truncate font-heading text-[0.95rem] font-bold text-ink">
                {title}
              </span>
              <span className="mt-0.5 block truncate text-[0.68rem] font-semibold text-muted-ink">
                {tripLabel}
                {!pinned && ` · ${t("unmapped")}`}
              </span>
            </button>
            <span className="pi-postmark mt-0.5 mr-5" aria-label={t("stars", { n: place.rank })}>
              <em>{place.rank}</em>
              <small>/5</small>
            </span>
          </div>

          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {place.tags.map((tag) => (
                <span key={tag} className="pi-tag">
                  {t(TAG_LABEL[tag])}
                </span>
              ))}
            </div>
          )}

          {place.why && (
            <p className="pi-ruled m-0 line-clamp-3 text-[0.78rem] leading-5 text-ink">
              {place.why}
            </p>
          )}

          {(place.url || place.mapsUrl || place.igUrl || place.pinterestUrl) && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              <ExtraLink href={place.url} label={t("open")} />
              <ExtraLink href={place.mapsUrl} label={t("mapsUrl")} />
              <ExtraLink href={place.igUrl} label={t("igUrl")} />
              <ExtraLink href={place.pinterestUrl} label={t("pinterestUrl")} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
