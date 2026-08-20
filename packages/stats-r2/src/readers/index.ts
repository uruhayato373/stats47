import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import type { EntityKind } from "@stats47/data-configs";
import {
  parseJapanSeriesArtifact,
  parseMigrationFlowPayload,
  parseStatsValuesPayload,
} from "../schemas";
import {
  japanR2Key,
  statsR2Key,
  type JapanSeriesArtifact,
  type MigrationFlowPayload,
  type StatsValuesPayload,
} from "../types";

/**
 * Read stats values for a metric and entity kind from R2.
 *
 * - prefecture / city / port: single payload (全年)
 * - migration-flow: 年指定必須
 *
 * Returns null when no data exists (NoSuchKey 404).
 */
export async function readStatsValues(
  metricKey: string,
  entityKind: Exclude<EntityKind, "migration-flow">,
): Promise<StatsValuesPayload | null> {
  const key = statsR2Key(metricKey, entityKind);
  const data = await fetchFromR2AsJson<unknown>(key);
  return data ? parseStatsValuesPayload(data) : null;
}

export async function readMigrationFlow(
  metricKey: string,
  year: number,
): Promise<MigrationFlowPayload | null> {
  const key = statsR2Key(metricKey, "migration-flow", year);
  const data = await fetchFromR2AsJson<unknown>(key);
  return data ? parseMigrationFlowPayload(data) : null;
}

/**
 * Convenience: get only a slice of rows matching given year_code (memory filter).
 */
export async function readStatsValuesForYear(
  metricKey: string,
  entityKind: Exclude<EntityKind, "migration-flow">,
  yearCode: string,
): Promise<StatsValuesPayload | null> {
  const all = await readStatsValues(metricKey, entityKind);
  if (!all) return null;
  return {
    ...all,
    rows: all.rows.filter((r) => r.yearCode === yearCode),
  };
}

/**
 * Read Japan-wide series for a metric from R2 (`app/japan/<metric>/series.json`).
 *
 * 独立 namespace (GEO-SCOPE-SEPARATION-01 WP3)。`readStatsValues` (47都道府県) とは
 * 混ぜない。Returns null when no artifact exists (metric が Japan catalog 未採用、または404)。
 */
export async function readJapanSeries(
  metricKey: string,
): Promise<JapanSeriesArtifact | null> {
  const key = japanR2Key(metricKey);
  const data = await fetchFromR2AsJson<unknown>(key);
  return data ? parseJapanSeriesArtifact(data) : null;
}
