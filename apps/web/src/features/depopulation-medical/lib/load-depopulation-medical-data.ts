import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import {
  DEPOPULATION_MEDICAL_SUMMARY_KEY,
  depopulationMedicalPrefKey,
  type DepopulationMedicalSummary,
  type DepopulationMedicalPrefDetail,
} from "./types";

// 型・キーは ./types に集約 (client/server 共有)。ここは loader のみ。
// module-level キャッシュは持たせない (r2-storage-design.md)。

/**
 * 47 県サマリを R2 から取得する。
 * ビルド時 (NEXT_PHASE) は R2 不在のため空フォールバック。
 */
export async function loadDepopulationMedicalSummary(): Promise<DepopulationMedicalSummary> {
  const empty: DepopulationMedicalSummary = {
    generatedAt: new Date(0).toISOString(),
    prefectures: [],
  };

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return empty;
  }

  try {
    const snapshot = await fetchFromR2AsJson<DepopulationMedicalSummary>(
      DEPOPULATION_MEDICAL_SUMMARY_KEY,
    );
    return snapshot ?? empty;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "loadDepopulationMedicalSummary: snapshot fetch failed",
    );
    return empty;
  }
}

/**
 * 県別詳細を R2 から取得する。server action から呼ぶ。
 * @param prefCode2 2 桁の都道府県コード ("13" 等)
 */
export async function loadDepopulationMedicalPrefDetail(
  prefCode2: string,
): Promise<DepopulationMedicalPrefDetail | null> {
  if (!/^\d{2}$/.test(prefCode2)) return null;
  try {
    return await fetchFromR2AsJson<DepopulationMedicalPrefDetail>(
      depopulationMedicalPrefKey(prefCode2),
    );
  } catch (error) {
    logger.error(
      {
        prefCode2,
        error: error instanceof Error ? error.message : String(error),
      },
      "loadDepopulationMedicalPrefDetail: fetch failed",
    );
    return null;
  }
}
