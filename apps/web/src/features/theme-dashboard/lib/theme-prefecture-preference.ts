import { lookupArea } from "@stats47/area";

export const THEME_PREFECTURE_COOKIE_NAME = "preferred-prefecture";
export const THEME_PREFECTURE_SET_VALUE = "all";
export const DEFAULT_THEME_PREFECTURE = {
  areaCode: "28000",
  areaName: "兵庫県",
} as const;

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface ThemePrefectureSelection {
  areaCode: string;
  areaName: string;
}

export function resolveThemePrefectureCode(
  value: string | undefined
): ThemePrefectureSelection | null {
  if (!value || value === "00000" || !/^\d{2}000$/.test(value)) return null;
  const area = lookupArea(value);
  if (!area) return null;
  return { areaCode: value, areaName: area.areaName };
}

export function resolveInitialThemePrefecture({
  urlPreference,
  cookiePreference,
}: {
  urlPreference?: string | string[];
  cookiePreference?: string;
}): ThemePrefectureSelection | null {
  const urlValue = Array.isArray(urlPreference) ? urlPreference[0] : urlPreference;

  if (urlValue === THEME_PREFECTURE_SET_VALUE) return null;
  const urlSelection = resolveThemePrefectureCode(urlValue);
  if (urlSelection) return urlSelection;

  if (cookiePreference === THEME_PREFECTURE_SET_VALUE) return null;
  const cookieSelection = resolveThemePrefectureCode(cookiePreference);
  if (cookieSelection) return cookieSelection;

  return DEFAULT_THEME_PREFECTURE;
}

export function writeThemePrefecturePreference(areaCode: string | null): void {
  const value = areaCode ?? THEME_PREFECTURE_SET_VALUE;
  document.cookie = `${THEME_PREFECTURE_COOKIE_NAME}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE_SECONDS};SameSite=Lax`;
}
