import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { AreaProfileData } from "../types";
import { areaProfileKeyPath } from "../types/snapshot";

const cache = new Map<string, AreaProfileData | null>();

/**
 * R2 上の area-profile/{areaCode}.json から取得。
 *
 * 旧: area-profile/all.json (3.8MB) を全件 fetch → areaCode でフィルタ
 * 新: area-profile/{areaCode}.json (~85KB) を 1 fetch → そのまま返す
 *
 * build 時 (NEXT_PHASE=phase-production-build) は null を返す。
 */
export async function readAreaProfileFromR2(
  areaCode: string,
): Promise<AreaProfileData | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  if (cache.has(areaCode)) return cache.get(areaCode) ?? null;

  try {
    const data = await fetchFromR2AsJson<AreaProfileData>(areaProfileKeyPath(areaCode));
    cache.set(areaCode, data ?? null);
    if (!data) {
      logger.warn({ areaCode }, "area-profile snapshot が R2 に存在しません");
    }
    return data ?? null;
  } catch (error) {
    logger.error(
      { areaCode, error: error instanceof Error ? error.message : String(error) },
      "readAreaProfileFromR2: failed",
    );
    return null;
  }
}
