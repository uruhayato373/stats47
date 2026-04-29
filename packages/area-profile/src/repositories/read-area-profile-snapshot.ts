import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { AreaProfileData } from "../types";
import {
  AREA_PROFILE_SNAPSHOT_KEY,
  type AreaProfileSnapshot,
} from "../types/snapshot";

const STALE_AFTER_DAYS = 60;

let cached: AreaProfileSnapshot | null = null;

function warnIfStale(generatedAt: string): void {
  const ageDays =
    (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { generatedAt, ageDays: Math.round(ageDays) },
      `area-profile snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadSnapshot(): Promise<AreaProfileSnapshot> {
  if (cached) return cached;
  const snapshot = await fetchFromR2AsJson<AreaProfileSnapshot>(
    AREA_PROFILE_SNAPSHOT_KEY,
  );
  if (!snapshot) {
    logger.warn(
      { key: AREA_PROFILE_SNAPSHOT_KEY },
      "area-profile snapshot が R2 に存在しません。空 Map を返します",
    );
    cached = { generatedAt: new Date(0).toISOString(), byAreaCode: {} };
    return cached;
  }
  warnIfStale(snapshot.generatedAt);
  cached = snapshot;
  return snapshot;
}

/**
 * R2 上の area-profile snapshot から areaCode で取得。
 *
 * getAreaProfileByCode (D1) のドロップイン代替。
 * 全 47 都道府県 × 平均 376 行 = ~17K 行 / ~4MB を 1 fetch で in-memory cache。
 *
 * build 時 (NEXT_PHASE=phase-production-build) は null を返し ISR で初回 fetch。
 */
export async function readAreaProfileFromR2(
  areaCode: string,
): Promise<AreaProfileData | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  try {
    const snapshot = await loadSnapshot();
    return snapshot.byAreaCode[areaCode] ?? null;
  } catch (error) {
    logger.error(
      {
        areaCode,
        error: error instanceof Error ? error.message : String(error),
      },
      "readAreaProfileFromR2: failed",
    );
    return null;
  }
}
