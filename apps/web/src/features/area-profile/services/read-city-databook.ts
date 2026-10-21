import "server-only";

import { cache } from "react";

import { readCityDatabook as readCityDatabookFromR2 } from "@stats47/ranking/server";

/**
 * 市区町村データブック (`databook.json`) の読み込み (型・R2 パス・schema は @stats47/ranking に一本化)。
 * generateMetadata とページ本体の重複 fetch を避けるため request scope で dedupe する。
 */
export const readCityDatabook = cache(readCityDatabookFromR2);
