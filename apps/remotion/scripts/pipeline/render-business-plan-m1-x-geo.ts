#!/usr/bin/env tsx
/**
 * Geo事業M1のX投稿15件を、分析snapshotと型付きGeo契約から一括生成する。
 * 数値計算・空間判定はここでは行わず、検証済みR2派生snapshotだけを描画する。
 */

import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface GeoEntry {
  rank: number;
  areaCode: string;
  areaName: string;
  value: number;
}

interface AnalysisContract {
  id: string;
  slug: string;
  title: string;
  analysisKind: 'baseline' | 'spatial-cross';
  r2Key?: string;
  sourceName: string;
  sourceLayers: Array<{
    id: string;
    label: string;
    geometry: 'prefecture' | 'mesh' | 'point' | 'polygon';
  }>;
  spatialOperations: string[];
  metricKeys: string[];
}

interface QueueItem {
  key: string;
  title: string;
  geoRole: 'baseline' | 'cross-analysis' | 'method' | 'decision';
  analysisIds: string[];
  analyses: AnalysisContract[];
  claimMetricKey: string;
  mediaPath: string;
  visual: {
    description: string;
    mapMode: 'baseline-choropleth' | 'derived-choropleth' | 'focus';
    highlightAreaCodes: string[];
    panelKind: 'selected-values' | 'statement' | 'method' | 'layers';
    panelLabel: string;
    panelItems?: string[];
  };
}

interface MetricMeta {
  key: string;
  label: string;
  unit: string;
  format: string;
}

interface LoadedAnalysis {
  entries: GeoEntry[];
  metric: MetricMeta;
  sourcePath: string;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const remotionRoot = path.resolve(scriptDir, '../..');
const repoRoot = path.resolve(remotionRoot, '../..');
const queuePath = path.join(repoRoot, '.local/r2/sns/_queue/business-plan-m1-x.json');
const populationCandidates = [
  path.join(
    repoRoot,
    '.local/r2/app/ranking/future-population-change-rate-2050/values.json'
  ),
  path.join(
    repoRoot,
    '.local/r2/app/blog/future-population-disappearing-prefectures/data/change-rate-2050-ranking.json'
  ),
];

function parseTargetKey(): string | undefined {
  const index = process.argv.indexOf('--key');
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function extractRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  for (const key of ['data', 'entries', 'values', 'rows']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    for (const key of ['entries', 'values', 'rows']) {
      if (Array.isArray(nested[key])) return nested[key] as unknown[];
    }
  }
  return [];
}

function normalizeBaselineEntry(row: unknown): GeoEntry | null {
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  const rank = Number(record.rank);
  const value = Number(record.value);
  const areaCode = String(record.areaCode ?? record.area_code ?? '');
  const areaName = String(record.areaName ?? record.area_name ?? record.pref ?? '');
  if (
    !Number.isFinite(rank) ||
    !Number.isFinite(value) ||
    !/^\d{5}$/.test(areaCode) ||
    !areaName
  ) {
    return null;
  }
  return { rank, value, areaCode, areaName };
}

function assertCoverage(entries: GeoEntry[], label: string): GeoEntry[] {
  if (
    entries.length !== 47 ||
    new Set(entries.map((entry) => entry.areaCode)).size !== 47
  ) {
    throw new Error(`${label} は47都道府県coverageが必要です: ${entries.length}`);
  }
  return entries;
}

async function loadBaseline(): Promise<LoadedAnalysis> {
  for (const candidate of populationCandidates) {
    try {
      const parsed = JSON.parse(await fs.readFile(candidate, 'utf8')) as unknown;
      const entries = extractRows(parsed)
        .map(normalizeBaselineEntry)
        .filter((entry): entry is GeoEntry => entry !== null)
        .sort((a, b) => b.value - a.value)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      assertCoverage(entries, '将来人口増減率');
      return {
        entries,
        metric: {
          key: 'future-population-change-rate-2050',
          label: '2050年人口増減率',
          unit: '%',
          format: 'signedPercent2',
        },
        sourcePath: path.relative(repoRoot, candidate),
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  throw new Error('将来人口増減率の47都道府県snapshotが見つかりません');
}

async function loadSpatialAnalysis(
  analysis: AnalysisContract,
  metricKey: string
): Promise<LoadedAnalysis> {
  if (!analysis.r2Key) throw new Error(`${analysis.id} にr2Keyがありません`);
  const snapshotPath = path.join(repoRoot, '.local/r2', analysis.r2Key);
  const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8')) as {
    metrics?: MetricMeta[];
    rows?: Array<{
      areaCode?: string;
      areaName?: string;
      values?: Record<string, number>;
    }>;
  };
  const metric = snapshot.metrics?.find((item) => item.key === metricKey);
  if (!metric) throw new Error(`${analysis.id} にmetric ${metricKey} がありません`);
  const entries = (snapshot.rows ?? [])
    .map((row) => ({
      areaCode: String(row.areaCode ?? ''),
      areaName: String(row.areaName ?? ''),
      value: Number(row.values?.[metricKey]),
    }))
    .filter(
      (row) =>
        /^\d{5}$/.test(row.areaCode) &&
        row.areaName.length > 0 &&
        Number.isFinite(row.value)
    )
    .sort((a, b) => b.value - a.value)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  assertCoverage(entries, `${analysis.id}/${metricKey}`);
  return {
    entries,
    metric,
    sourcePath: path.relative(repoRoot, snapshotPath),
  };
}

async function loadAnalysis(item: QueueItem): Promise<LoadedAnalysis> {
  const primary = item.analyses[0];
  if (!primary) throw new Error(`${item.key} に分析契約がありません`);
  if (!primary.metricKeys.includes(item.claimMetricKey)) {
    throw new Error(`${item.key} のclaimMetricKeyが分析契約外です`);
  }
  return primary.analysisKind === 'baseline'
    ? loadBaseline()
    : loadSpatialAnalysis(primary, item.claimMetricKey);
}

async function loadAllAnalysisSources(
  item: QueueItem
): Promise<Array<{ analysisId: string; loaded: LoadedAnalysis }>> {
  return Promise.all(
    item.analyses.map(async (analysis) => {
      const metricKey = analysis.metricKeys.includes(item.claimMetricKey)
        ? item.claimMetricKey
        : analysis.metricKeys[0];
      if (!metricKey) throw new Error(`${analysis.id} にmetricKeysがありません`);
      return {
        analysisId: analysis.id,
        loaded:
          analysis.analysisKind === 'baseline'
            ? await loadBaseline()
            : await loadSpatialAnalysis(analysis, metricKey),
      };
    })
  );
}

async function loadQueue(): Promise<QueueItem[]> {
  const parsed = JSON.parse(await fs.readFile(queuePath, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error('M1 X queueが配列ではありません');
  const items = parsed as QueueItem[];
  if (items.length !== 15) throw new Error(`M1 X queueは15件必要です: ${items.length}`);
  for (const item of items) {
    if (
      !item.key ||
      !item.mediaPath ||
      !item.geoRole ||
      !item.claimMetricKey ||
      item.analyses.length === 0 ||
      !item.visual
    ) {
      throw new Error(`M1 X queueのGeo契約が不完全です: ${item.key ?? '?'}`);
    }
    const absoluteOutput = path.resolve(repoRoot, item.mediaPath);
    const allowedRoot = path.join(repoRoot, '.local/r2/sns/geo');
    if (!absoluteOutput.startsWith(`${allowedRoot}${path.sep}`)) {
      throw new Error(`出力先がsns/geo配下ではありません: ${item.mediaPath}`);
    }
  }
  return items;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

async function sha256(filePath: string): Promise<string> {
  return createHash('sha256').update(await fs.readFile(filePath)).digest('hex');
}

async function main(): Promise<void> {
  const targetKey = parseTargetKey();
  const queue = await loadQueue();
  const targets = targetKey ? queue.filter((item) => item.key === targetKey) : queue;
  if (targets.length === 0) throw new Error(`対象content keyがありません: ${targetKey}`);

  console.log(`Geo X image render: ${targets.length}件`);
  console.log('Remotionをbundle中...');
  const srcPath = path.join(remotionRoot, 'src');
  const bundleUrl = await bundle({
    entryPoint: path.join(srcPath, 'index.ts'),
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: { ...(config.resolve?.alias ?? {}), '@': srcPath },
      },
    }),
  });
  const browser = await openBrowser('chrome');

  try {
    for (const item of targets) {
      const loaded = await loadAnalysis(item);
      const allAnalysisSources = await loadAllAnalysisSources(item);
      const layerLabels = unique(
        item.analyses.flatMap((analysis) =>
          analysis.sourceLayers.map((layer) => `${layer.label}［${layer.geometry}］`)
        )
      );
      const operationLabels = unique(
        item.analyses.flatMap((analysis) => analysis.spatialOperations)
      );
      const sourceLabels = unique(item.analyses.map((analysis) => analysis.sourceName));
      const inputProps = {
        title: item.title,
        description: item.visual.description,
        geoRole: item.geoRole,
        analysisLabel:
          item.analyses.length === 1
            ? item.analyses[0].title
            : `${item.analyses.length}分析を横断`,
        layerLabels,
        operationLabels,
        sourceLabels,
        metricLabel: loaded.metric.label,
        metricUnit: loaded.metric.unit,
        metricFormat: loaded.metric.format,
        mapMode: item.visual.mapMode,
        highlightAreaCodes: item.visual.highlightAreaCodes,
        panelKind: item.visual.panelKind,
        panelLabel: item.visual.panelLabel,
        panelItems: item.visual.panelItems,
        allEntries: loaded.entries,
      };
      const output = path.resolve(repoRoot, item.mediaPath);
      await fs.mkdir(path.dirname(output), { recursive: true });
      const composition = await selectComposition({
        serveUrl: bundleUrl,
        id: 'GeoX-InsightCard',
        inputProps,
        puppeteerInstance: browser,
      });
      await renderStill({
        serveUrl: bundleUrl,
        composition,
        output,
        inputProps,
        imageFormat: 'png',
        puppeteerInstance: browser,
      });
      const sourcePath = path.join(path.dirname(output), 'source.json');
      await fs.writeFile(
        sourcePath,
        `${JSON.stringify(
          {
            kind: 'geo-x-insight-card',
            contentKey: item.key,
            geoRole: item.geoRole,
            analysisIds: item.analysisIds,
            claimMetricKey: item.claimMetricKey,
            observationSources: await Promise.all(
              allAnalysisSources.map(async ({ analysisId, loaded: source }) => ({
                analysisId,
                path: source.sourcePath,
                sha256: await sha256(path.resolve(repoRoot, source.sourcePath)),
              }))
            ),
            sourceLayers: item.analyses.flatMap((analysis) => analysis.sourceLayers),
            spatialOperations: operationLabels,
            visualSource: 'packages/data-configs/src/business-plan/m1.ts',
            composition: 'GeoX-InsightCard',
            output: item.mediaPath,
            outputSha256: await sha256(output),
          },
          null,
          2
        )}\n`,
        'utf8'
      );
      console.log(`✅ ${item.key}: ${item.mediaPath}`);
    }
  } finally {
    await browser.close({ silent: true });
  }
}

main().catch((error) => {
  console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
