import 'server-only';

import { FLOOD_ARCHIVES } from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import {
  GEO_CROSS_ANALYSIS_CONFIGS,
  type GeoAnalysisSnapshot,
  type GeoCrossAnalysisSlug,
} from './geo-cross-analysis';
import { loadGeoAnalysisManifest } from './load-geo-analysis-evidence';


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseGeoAnalysisSnapshot(
  value: unknown,
  expectedSlug: GeoCrossAnalysisSlug
): GeoAnalysisSnapshot | null {
  if (!isRecord(value)) return null;
  if (
    value.schemaVersion !== 1 ||
    value.slug !== expectedSlug ||
    value.geography !== 'prefecture' ||
    typeof value.generatedAt !== 'string' ||
    typeof value.dataVersion !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.question !== 'string' ||
    typeof value.primaryMetricKey !== 'string' ||
    !Array.isArray(value.metrics) ||
    !Array.isArray(value.rows) ||
    value.rows.length !== 47 ||
    !Array.isArray(value.method) ||
    !Array.isArray(value.sources) ||
    !isStringArray(value.caveats) ||
    !isRecord(value.summary) ||
    !isRecord(value.dataQuality)
  ) {
    return null;
  }

  const metricsValid = value.metrics.every(
    (metric) =>
      isRecord(metric) &&
      typeof metric.key === 'string' &&
      typeof metric.label === 'string' &&
      typeof metric.unit === 'string' &&
      ['integer', 'decimal1', 'percent1', 'signedPercent1'].includes(
        String(metric.format)
      ) &&
      typeof metric.description === 'string'
  );
  const metricKeys = new Set(
    value.metrics
      .filter(isRecord)
      .map((metric) => metric.key)
      .filter((key): key is string => typeof key === 'string')
  );
  const areaCodes = new Set<string>();
  const rowsValid = value.rows.every((row) => {
    if (
      !isRecord(row) ||
      typeof row.areaCode !== 'string' ||
      !/^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(row.areaCode) ||
      typeof row.areaName !== 'string' ||
      typeof row.rank !== 'number' ||
      !isRecord(row.values) ||
      areaCodes.has(row.areaCode)
    ) {
      return false;
    }
    areaCodes.add(row.areaCode);
    const rowValues = row.values;
    return [...metricKeys].every((key) => {
      const metricValue = rowValues[key];
      return metricValue === null || typeof metricValue === 'number' && Number.isFinite(metricValue);
    });
  });
  const sourcesValid = value.sources.every(
    (source) =>
      isRecord(source) &&
      typeof source.name === 'string' &&
      typeof source.url === 'string' &&
      typeof source.datasetId === 'string' &&
      typeof source.version === 'string' &&
      typeof source.license === 'string'
  );

  if (
    !metricsValid ||
    !metricKeys.has(value.primaryMetricKey) ||
    !rowsValid ||
    !sourcesValid ||
    value.summary.observationCount !== 47 ||
    value.dataQuality.expectedAreas !== 47 ||
    value.dataQuality.actualAreas !== 47 ||
    !Array.isArray(value.dataQuality.missingAreaCodes) ||
    value.dataQuality.missingAreaCodes.length !== 0
  ) {
    return null;
  }

  // 旧県別併置snapshotを新しい空間分析の説明と混ぜない。
  if (expectedSlug === 'population-land-price' && value.primaryMetricKey !== 'risingDecliningPointShare') return null;
  // 旧94件は河川区分10が欠落。manifestを使わない比較・area/themeにも配信しない。
  if (expectedSlug === 'population-flood-risk' && (
    !isRecord(value.dataQuality.inputCounts) ||
    value.dataQuality.inputCounts.floodZipFiles !== FLOOD_ARCHIVES.length
  )) return null;

  return value as unknown as GeoAnalysisSnapshot;
}

export async function loadGeoAnalysisSnapshot(
  slug: GeoCrossAnalysisSlug
): Promise<GeoAnalysisSnapshot | null> {
  const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
  try {
    const value = await fetchFromR2AsJson<unknown>(
      `app/geo/${config.slug}/item.json`
    );
    const snapshot = parseGeoAnalysisSnapshot(value, slug);
    if (slug === 'population-flood-risk') {
      const manifest = await loadGeoAnalysisManifest(slug);
      if (!manifest || snapshot?.generatedAt !== manifest.generatedAt) return null;
    }
    return snapshot;
  } catch {
    return null;
  }
}
