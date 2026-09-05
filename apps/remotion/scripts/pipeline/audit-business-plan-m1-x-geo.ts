#!/usr/bin/env tsx

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GEO_X_CANVAS,
  GEO_X_EXCLUSIVE_REGION_PAIRS,
  GEO_X_LAYOUT,
  rectContains,
  rectsOverlap,
} from '../../src/features/geo-x/layout';

type GeoRole = 'baseline' | 'cross-analysis' | 'method' | 'decision';

interface QueueItem {
  key: string;
  geoRole: GeoRole;
  analysisIds: string[];
  analyses: Array<{
    analysisKind: 'baseline' | 'spatial-cross';
    sourceLayers: Array<{ geometry: string }>;
  }>;
  claimMetricKey: string;
  imageKind: string;
  mediaPath: string;
  canonicalUrl: string;
}

interface SourceRecord {
  kind: string;
  contentKey: string;
  geoRole: GeoRole;
  analysisIds: string[];
  claimMetricKey: string;
  observationSources: Array<{
    analysisId: string;
    path: string;
    sha256: string;
  }>;
  sourceLayers: Array<{ geometry: string }>;
  composition: string;
  output: string;
  outputSha256: string;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../../..');
const queuePath = path.join(
  repoRoot,
  '.local/r2/sns/_queue/business-plan-m1-x.json'
);
const r2Root = path.join(repoRoot, '.local/r2');
const allowedMediaRoot = path.join(r2Root, 'sns/geo');

async function sha256(filePath: string): Promise<string> {
  return createHash('sha256')
    .update(await fs.readFile(filePath))
    .digest('hex');
}

function sameStrings(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

async function pngDimensions(
  filePath: string
): Promise<{ width: number; height: number }> {
  const file = await fs.open(filePath, 'r');
  try {
    const header = Buffer.alloc(24);
    const { bytesRead } = await file.read(header, 0, header.length, 0);
    if (
      bytesRead !== header.length ||
      header.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    ) {
      throw new Error('PNGではありません');
    }
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
  } finally {
    await file.close();
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function auditLayoutContract(): void {
  const canvas = { x: 0, y: 0, ...GEO_X_CANVAS };
  for (const [name, rect] of Object.entries(GEO_X_LAYOUT)) {
    assert(rectContains(canvas, rect), `layout:${name} がcanvas外です`);
  }
  for (const [leftName, rightName] of GEO_X_EXCLUSIVE_REGION_PAIRS) {
    assert(
      !rectsOverlap(GEO_X_LAYOUT[leftName], GEO_X_LAYOUT[rightName]),
      `layout:${leftName} と ${rightName} が重なっています`
    );
  }
  assert(
    rectContains(GEO_X_LAYOUT.mapStage, GEO_X_LAYOUT.okinawaInset),
    'layout:沖縄インセットが地図領域外です'
  );
}

async function auditItem(item: QueueItem): Promise<void> {
  assert(
    item.imageKind === 'geo-insight-card',
    `${item.key}: Geo専用imageKindではありません`
  );
  assert(
    item.mediaPath.includes(`/sns/geo/${item.key}/`),
    `${item.key}: Geo専用パスではありません`
  );
  assert(
    !item.mediaPath.includes('ranking-card'),
    `${item.key}: ranking画像参照は禁止です`
  );
  const output = path.resolve(repoRoot, item.mediaPath);
  assert(
    output.startsWith(`${allowedMediaRoot}${path.sep}`),
    `${item.key}: 出力先がsns/geo外です`
  );
  const dimensions = await pngDimensions(output);
  assert(
    dimensions.width === GEO_X_CANVAS.width &&
      dimensions.height === GEO_X_CANVAS.height,
    `${item.key}: 1080x1350ではありません (${dimensions.width}x${dimensions.height})`
  );

  const sourcePath = path.join(path.dirname(output), 'source.json');
  const source = JSON.parse(
    await fs.readFile(sourcePath, 'utf8')
  ) as SourceRecord;
  assert(
    source.kind === 'geo-x-insight-card',
    `${item.key}: source.kindが不正です`
  );
  assert(
    source.composition === 'GeoX-InsightCard',
    `${item.key}: Geo専用compositionではありません`
  );
  assert(
    source.contentKey === item.key,
    `${item.key}: source contentKey不一致`
  );
  assert(source.geoRole === item.geoRole, `${item.key}: geoRole不一致`);
  assert(
    sameStrings(source.analysisIds, item.analysisIds),
    `${item.key}: analysisIds不一致`
  );
  assert(
    source.claimMetricKey === item.claimMetricKey,
    `${item.key}: claimMetricKey不一致`
  );
  assert(source.output === item.mediaPath, `${item.key}: output不一致`);
  assert(
    (await sha256(output)) === source.outputSha256,
    `${item.key}: 画像SHA不一致`
  );

  assert(
    source.observationSources.length === item.analysisIds.length,
    `${item.key}: observationSources件数不一致`
  );
  for (const [index, observation] of source.observationSources.entries()) {
    assert(
      observation.analysisId === item.analysisIds[index],
      `${item.key}: observation analysisId不一致`
    );
    const observationSource = path.resolve(repoRoot, observation.path);
    assert(
      observationSource.startsWith(`${r2Root}${path.sep}`),
      `${item.key}: 観測値sourceが.local/r2外です`
    );
    assert(
      (await sha256(observationSource)) === observation.sha256,
      `${item.key}: 観測値snapshot SHA不一致 (${observation.analysisId})`
    );
  }

  if (item.geoRole === 'cross-analysis') {
    assert(
      item.analyses.length === 1,
      `${item.key}: cross-analysisは分析1件に固定します`
    );
    assert(
      item.analyses[0].analysisKind === 'spatial-cross',
      `${item.key}: spatial-cross契約がありません`
    );
    assert(
      source.sourceLayers.length >= 2,
      `${item.key}: 空間クロスは2層以上が必要です`
    );
    assert(
      source.sourceLayers.some((layer) => layer.geometry !== 'prefecture'),
      `${item.key}: 都道府県集計だけではGeoクロスになりません`
    );
  }
  if (item.geoRole === 'baseline') {
    assert(
      item.canonicalUrl === '/ranking/future-population-change-rate-2050',
      `${item.key}: baseline landing不一致`
    );
  }
}

async function main(): Promise<void> {
  auditLayoutContract();
  const queue = JSON.parse(await fs.readFile(queuePath, 'utf8')) as QueueItem[];
  assert(
    Array.isArray(queue) && queue.length === 15,
    `Geo X queueは15件必要です: ${queue.length}`
  );
  assert(
    new Set(queue.map((item) => item.key)).size === 15,
    'contentKeyが重複しています'
  );
  const expected: Record<GeoRole, number> = {
    baseline: 3,
    'cross-analysis': 9,
    method: 2,
    decision: 1,
  };
  for (const [role, count] of Object.entries(expected) as Array<
    [GeoRole, number]
  >) {
    const actual = queue.filter((item) => item.geoRole === role).length;
    assert(actual === count, `${role}は${count}件必要です: ${actual}`);
  }
  for (const item of queue) await auditItem(item);
  console.log(
    '✅ Geo M1 asset audit: 15/15 PASS (role 3/9/2/1, PNG, source, SHA, layer contract)'
  );
}

main().catch((error: unknown) => {
  console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
