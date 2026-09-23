import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import {
  type CorrelationByThemeSnapshot,
  correlationByThemePath,
  parseCorrelationByThemeSnapshot,
  type ThemeCorrelatedMetric,
} from "../types/snapshot";

/**
 * テーマページ「このテーマと関連の深い指標」の R2 snapshot を読む。
 * 不在・build 時は空配列 (セクション非表示)。取得失敗・schema 不正は err。
 */
export async function readThemeCorrelatedMetricsFromR2(
  themeKey: string,
): Promise<Result<ThemeCorrelatedMetric[], Error>> {
  if (process.env.NEXT_PHASE === "phase-production-build") return ok([]);

  try {
    const path = correlationByThemePath(themeKey);
    const result = await createSnapshotReader<CorrelationByThemeSnapshot, CorrelationByThemeSnapshot>({
      key: path,
      label: `correlation-by-theme:${themeKey}`,
      parse: parseCorrelationByThemeSnapshot,
      select: (value) => value,
    }).readResult();

    if (result.status === "no-data") return ok([]);
    if (result.status === "source-unavailable" || result.status === "schema-invalid") {
      return err(result.error);
    }
    return ok(result.data.items);
  } catch (error) {
    logger.error(
      { themeKey, error: error instanceof Error ? error.message : String(error) },
      "readThemeCorrelatedMetricsFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
