import {
  createSnapshotReader,
  type SnapshotReadResult,
} from "@stats47/r2-storage/server";
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
  return unwrapNullable(await readStatsValuesResult(metricKey, entityKind));
}

export async function readStatsValuesResult(
  metricKey: string,
  entityKind: Exclude<EntityKind, "migration-flow">,
): Promise<SnapshotReadResult<StatsValuesPayload>> {
  return createStatsReader(
    statsR2Key(metricKey, entityKind),
    `stats:${metricKey}:${entityKind}`,
    parseStatsValuesPayload,
  ).readResult();
}

export async function readMigrationFlow(
  metricKey: string,
  year: number,
): Promise<MigrationFlowPayload | null> {
  return unwrapNullable(await readMigrationFlowResult(metricKey, year));
}

export async function readMigrationFlowResult(
  metricKey: string,
  year: number,
): Promise<SnapshotReadResult<MigrationFlowPayload>> {
  return createStatsReader(
    statsR2Key(metricKey, "migration-flow", year),
    `migration-flow:${metricKey}:${year}`,
    parseMigrationFlowPayload,
  ).readResult();
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
  return unwrapNullable(await readJapanSeriesResult(metricKey));
}

export async function readJapanSeriesResult(
  metricKey: string,
): Promise<SnapshotReadResult<JapanSeriesArtifact>> {
  return createStatsReader(
    japanR2Key(metricKey),
    `japan-series:${metricKey}`,
    parseJapanSeriesArtifact,
  ).readResult();
}

function createStatsReader<T>(
  key: string,
  label: string,
  parse: (value: unknown) => T,
) {
  return createSnapshotReader<T, T>({
    key,
    label,
    parse,
    select: (snapshot) => snapshot,
    generatedAt: (snapshot) => {
      const meta = (snapshot as { meta?: { generatedAt?: unknown } }).meta;
      return typeof meta?.generatedAt === "string" ? meta.generatedAt : undefined;
    },
  });
}

function unwrapNullable<T>(result: SnapshotReadResult<T>): T | null {
  if (result.status === "ok" || result.status === "stale") return result.data;
  if (result.status === "no-data") return null;
  throw result.error;
}
