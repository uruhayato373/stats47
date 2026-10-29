import { INFRA_NETWORKS } from "./networks";
import type { InfraHistorySummary, InfraLengthSeries, InfraNetworkKey } from "./types";

/**
 * R2 の summary.json を厳格に読む。年の並び・系列の長さ・台帳の種別コード・47 県が揃わない
 * ものは null を返し、画面は「データを読み込めません」と表示する (欠けた県を 0 で描かない)。
 */
export function parseInfraHistorySummary(
  value: unknown,
  network: InfraNetworkKey,
): InfraHistorySummary | null {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.network !== network) return null;
  const definition = INFRA_NETWORKS.find((item) => item.key === network);
  if (!definition) return null;
  const years = value.years;
  if (!Array.isArray(years) || years.length === 0 || !years.every(Number.isInteger)) return null;
  if (years[0] !== definition.years.first || years[years.length - 1] !== definition.years.last) return null;
  const codes = definition.categories.map((category) => category.code);
  const length = years.length;

  const national = parseSeries(value.national, length, codes);
  const unassigned = parseSeries(value.unassigned, length, codes);
  const prefectures = parseSeriesMap(value.prefectures, length, codes);
  const regions = parseSeriesMap(value.regions, length, codes);
  if (!national || !unassigned || !prefectures || !regions) return null;
  if (Object.keys(prefectures).length !== 47) return null;

  return {
    schemaVersion: 1,
    network,
    years: years as number[],
    national,
    unassigned,
    prefectures,
    regions,
  };
}

function parseSeriesMap(
  value: unknown,
  length: number,
  codes: readonly string[],
): Record<string, InfraLengthSeries> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, InfraLengthSeries> = {};
  for (const [key, raw] of Object.entries(value)) {
    const series = parseSeries(raw, length, codes);
    if (!series) return null;
    out[key] = series;
  }
  return out;
}

function parseSeries(
  value: unknown,
  length: number,
  codes: readonly string[],
): InfraLengthSeries | null {
  if (!isRecord(value) || !isNumberArray(value.total, length)) return null;
  const byCategory = value.byCategory;
  if (!isRecord(byCategory)) return null;
  const keys = Object.keys(byCategory);
  if (keys.length !== codes.length || !codes.every((code) => isNumberArray(byCategory[code], length))) {
    return null;
  }
  return {
    total: value.total,
    byCategory: Object.fromEntries(codes.map((code) => [code, byCategory[code] as number[]])),
  };
}

function isNumberArray(value: unknown, length: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((item) => typeof item === "number" && Number.isFinite(item) && item >= 0)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
