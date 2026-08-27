/**
 * Presets, storage and the pure crop maths, ported 1:1 from the pre-Vite
 * public/app.js. Everything here is browser-API-free except the load/save
 * helpers, so the crop and fit rules can be tested under node.
 */

import type { MsgKey } from "@/lib/i18n";

export type Format = "jpeg" | "png";

export type PresetId =
  | "in-ibps-photo"
  | "in-ssc-photo"
  | "in-upsc-photo"
  | "in-exam-sign"
  | "passport-2x2"
  | "kr-resume"
  | "custom";

export interface Spec {
  w: number;
  h: number;
  minKB: number;
  maxKB: number;
  format: Format;
  /** UPSC prints the applicant's name and today's date under the photo. */
  caption?: boolean;
}

export interface Preset extends Spec {
  labelKey: MsgKey;
}

export const PRESETS: Record<PresetId, Preset> = {
  "in-ibps-photo": { w: 200, h: 230, minKB: 20, maxKB: 50, format: "jpeg", labelKey: "presetInIbps" },
  "in-ssc-photo": { w: 413, h: 531, minKB: 20, maxKB: 50, format: "jpeg", labelKey: "presetInSsc" },
  "in-upsc-photo": {
    w: 472,
    h: 591,
    minKB: 20,
    maxKB: 300,
    format: "jpeg",
    labelKey: "presetInUpsc",
    caption: true,
  },
  "in-exam-sign": { w: 140, h: 60, minKB: 10, maxKB: 20, format: "jpeg", labelKey: "presetInSign" },
  "passport-2x2": { w: 600, h: 600, minKB: 50, maxKB: 200, format: "jpeg", labelKey: "presetPassport" },
  "kr-resume": { w: 300, h: 400, minKB: 30, maxKB: 100, format: "jpeg", labelKey: "presetKrResume" },
  custom: { w: 200, h: 230, minKB: 20, maxKB: 50, format: "jpeg", labelKey: "presetCustom" },
};

export const PRESET_ORDER: PresetId[] = [
  "in-ibps-photo",
  "in-ssc-photo",
  "in-upsc-photo",
  "in-exam-sign",
  "passport-2x2",
  "kr-resume",
  "custom",
];

export const PROFILE_FIELDS = [
  "name",
  "dob",
  "phone",
  "email",
  "address",
  "father",
  "mother",
  "nid",
] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type Profile = Record<ProfileField, string>;

/** Unchanged from the pre-Vite app so saved notes and specs survive the rewrite. */
export const PROFILE_KEY = "photo-spec:profile:v1";
export const SETTINGS_KEY = "photo-spec:settings:v1";

export interface CustomSpec {
  w: number;
  h: number;
  minKB: number;
  maxKB: number;
  format: Format;
}

export interface Settings {
  preset: PresetId;
  custom: CustomSpec;
}

export const DEFAULT_CUSTOM: CustomSpec = { w: 200, h: 230, minKB: 20, maxKB: 50, format: "jpeg" };
export const DEFAULT_SETTINGS: Settings = { preset: "in-ibps-photo", custom: { ...DEFAULT_CUSTOM } };

export const EMPTY_PROFILE: Profile = {
  name: "",
  dob: "",
  phone: "",
  email: "",
  address: "",
  father: "",
  mother: "",
  nid: "",
};

export function clampInt(value: unknown, lo: number, hi: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function isPresetId(value: unknown): value is PresetId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PRESETS, value);
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function normalizeSettings(raw: unknown): Settings {
  const value = (raw ?? {}) as Partial<Settings>;
  // v1 shipped a single "in-exam-photo" preset; it is the IBPS one.
  const presetRaw = (value.preset as string) === "in-exam-photo" ? "in-ibps-photo" : value.preset;
  const custom = (value.custom ?? {}) as Partial<CustomSpec>;
  return {
    preset: isPresetId(presetRaw) ? presetRaw : DEFAULT_SETTINGS.preset,
    custom: {
      w: clampInt(custom.w, 20, 4000, DEFAULT_CUSTOM.w),
      h: clampInt(custom.h, 20, 4000, DEFAULT_CUSTOM.h),
      minKB: clampInt(custom.minKB, 1, 5000, DEFAULT_CUSTOM.minKB),
      maxKB: clampInt(custom.maxKB, 1, 5000, DEFAULT_CUSTOM.maxKB),
      format: custom.format === "png" ? "png" : "jpeg",
    },
  };
}

export function loadSettings(): Settings {
  return normalizeSettings(readJson(SETTINGS_KEY));
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* private mode — the pick just won't stick */
  }
}

export function normalizeProfile(raw: unknown): Profile {
  const value = (raw ?? {}) as Partial<Record<ProfileField, unknown>>;
  const out: Profile = { ...EMPTY_PROFILE };
  for (const field of PROFILE_FIELDS) {
    const v = value[field];
    if (typeof v === "string") out[field] = v;
  }
  return out;
}

export function loadProfile(): Profile {
  return normalizeProfile(readJson(PROFILE_KEY));
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode — notes just won't stick */
  }
}

/** The spec the app is currently fitting to: a preset, or the custom numbers. */
export function specFor(settings: Settings): Spec {
  if (settings.preset === "custom") {
    const c = settings.custom;
    let minKB = clampInt(c.minKB, 1, 5000, DEFAULT_CUSTOM.minKB);
    let maxKB = clampInt(c.maxKB, 1, 5000, DEFAULT_CUSTOM.maxKB);
    if (maxKB < minKB) [minKB, maxKB] = [maxKB, minKB];
    return {
      w: clampInt(c.w, 20, 4000, DEFAULT_CUSTOM.w),
      h: clampInt(c.h, 20, 4000, DEFAULT_CUSTOM.h),
      minKB,
      maxKB,
      format: c.format === "png" ? "png" : "jpeg",
    };
  }
  const p = PRESETS[settings.preset] ?? PRESETS["in-ibps-photo"];
  return { w: p.w, h: p.h, minKB: p.minKB, maxKB: p.maxKB, format: p.format, caption: !!p.caption };
}

export interface Crop {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
}

/** Cover-crop: fill the target aspect from the centre, then shift by the drag. */
export function coverCrop(
  sw: number,
  sh: number,
  tw: number,
  th: number,
  ox: number,
  oy: number,
): Crop {
  const targetAspect = tw / th;
  const sourceAspect = sw / sh;
  let cropW: number;
  let cropH: number;
  let cropX: number;
  let cropY: number;
  if (sourceAspect > targetAspect) {
    cropH = sh;
    cropW = sh * targetAspect;
    cropX = (sw - cropW) / 2 + ox;
    cropY = oy;
  } else {
    cropW = sw;
    cropH = sw / targetAspect;
    cropX = ox;
    cropY = (sh - cropH) / 2 + oy;
  }
  cropX = Math.max(0, Math.min(sw - cropW, cropX));
  cropY = Math.max(0, Math.min(sh - cropH, cropY));
  return { cropX, cropY, cropW, cropH };
}

/** Keep the drag offset inside what the source image can actually cover. */
export function clampOffset(
  sourceW: number,
  sourceH: number,
  spec: Spec,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  const { cropW, cropH } = coverCrop(sourceW, sourceH, spec.w, spec.h, 0, 0);
  const maxX = Math.max(0, (sourceW - cropW) / 2);
  const maxY = Math.max(0, (sourceH - cropH) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, offsetX)),
    y: Math.max(-maxY, Math.min(maxY, offsetY)),
  };
}

export function isInRange(kb: number, spec: Spec): boolean {
  return kb >= spec.minKB - 0.01 && kb <= spec.maxKB + 0.01;
}

export function downloadName(w: number, h: number, kb: number, format: Format): string {
  const ext = format === "png" ? "png" : "jpg";
  return `photo-${w}x${h}-${Math.max(1, Math.round(kb))}kb.${ext}`;
}

/** DD-MM-YYYY, the shape Indian exam forms print under the photo. */
export function captionDate(now: Date = new Date()): string {
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${now.getFullYear()}`;
}

export function captionLine(name: string, now: Date = new Date()): string {
  const trimmed = name.trim();
  return trimmed ? `${trimmed}  ${captionDate(now)}` : captionDate(now);
}
