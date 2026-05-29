import "server-only";

import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";

/**
 * 「サイト全体で最も新しい年」を返す。
 * Phase 6 以降は D1 stats_* に SQL MAX をかける代わりに、
 * 主要 metric (japanese-population) の R2 payload の meta.yearRange[1] を参照する。
 */
export async function findLatestYear(
  _areaType: AreaType,
): Promise<Result<string | null, Error>> {
  try {
    const payload = await readStatsValues("japanese-population", "prefecture");
    if (!payload?.meta.yearRange) return ok(null);
    return ok(payload.meta.yearRange[1]);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
