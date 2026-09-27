import "server-only";

import { cache } from "react";

import { readCityProfileFromR2 } from "@stats47/area-profile/server";

/**
 * 市区町村 profile.json の読み込み (型・R2 パスは @stats47/area-profile に一本化)。
 * generateMetadata とページ本体の重複 fetch を避けるため request scope で dedupe する。
 */
export const readCityProfile = cache(readCityProfileFromR2);
