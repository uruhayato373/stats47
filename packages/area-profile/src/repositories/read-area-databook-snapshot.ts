import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { AreaDatabookSnapshot } from "../types/databook-snapshot";
import { areaDatabookKeyPath } from "../types/databook-snapshot";

/**
 * R2 `app/areas/<code>/databook.json` から県データブックの値+全国順位を取得。
 *
 * 未生成の県では null を返す (ページは databook セクションをフォールバックで隠す)。
 * build 時 (NEXT_PHASE=phase-production-build) は null。
 * module-level cache は持たない (.claude/rules/r2-storage-design.md)。
 */
export async function readAreaDatabookFromR2(
  areaCode: string,
): Promise<AreaDatabookSnapshot | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }
  try {
    const data = await fetchFromR2AsJson<AreaDatabookSnapshot>(
      areaDatabookKeyPath(areaCode),
    );
    return data ?? null;
  } catch (error) {
    logger.error(
      { areaCode, error: error instanceof Error ? error.message : String(error) },
      "readAreaDatabookFromR2: failed",
    );
    return null;
  }
}
