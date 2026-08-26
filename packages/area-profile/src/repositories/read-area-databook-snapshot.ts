import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";

import {
  areaDatabookKeyPath,
  parseAreaDatabookSnapshot,
  type AreaDatabookSnapshot,
} from "../types/databook-snapshot";

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
  const result = await createSnapshotReader({
    key: areaDatabookKeyPath(areaCode),
    label: `area-databook:${areaCode}`,
    parse: parseAreaDatabookSnapshot,
    select: (snapshot) => snapshot,
  }).readResult();
  if (result.status === "ok" || result.status === "stale") return result.data;
  if (result.status === "no-data") return null;
  logger.error({ areaCode, status: result.status, error: result.error.message }, "readAreaDatabookFromR2: failed");
  throw result.error;
}
