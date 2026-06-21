import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import type { EntityKind } from "@stats47/data-configs";
import {
  parseMigrationFlowPayload,
  parseStatsValuesPayload,
} from "../schemas";
import {
  statsR2Key,
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
