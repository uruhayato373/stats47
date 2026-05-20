import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { type SunshineMapMeta } from "./types";

export const SUNSHINE_MAP_META_KEY = "app/gis-cross/sunshine-map/meta.json";

export { SUNSHINE_MAP_RASTER_PATH } from "./types";
export type { SunshineMapMeta } from "./types";

export async function loadSunshineMapMeta(): Promise<SunshineMapMeta | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }
  try {
    return await fetchFromR2AsJson<SunshineMapMeta>(SUNSHINE_MAP_META_KEY);
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "loadSunshineMapMeta: fetch failed",
    );
    return null;
  }
}
