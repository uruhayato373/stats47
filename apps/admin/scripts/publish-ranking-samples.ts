/* eslint-disable no-console -- This publishing command reports the exact saved object references. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { assertR2WriteAllowed } from '../../../packages/r2-storage/src/scripts/_assert-ci-write';
import {
  RANKING_SAMPLE_SOURCE,
  rankingInputFromStats,
} from '../lib/template-ranking-data';
import { renderRankingBars } from '../lib/template-ranking-bars';
import { renderRankingTable } from '../lib/template-ranking-table';
import { renderRankingTileMap } from '../lib/template-ranking-tile-map';
import { CHANGE_SAMPLE_SOURCES, renderTileChangeSample } from '../lib/template-tile-change';
import { TREND_SAMPLE_SOURCE, renderTrendLine } from '../lib/template-trend-line';
import { COMPOSITION_SAMPLE_SOURCE, COMPOSITION_SAMPLE_PROVENANCE, renderCompositionStacked } from '../lib/template-composition-stacked';
import { RELATIONSHIP_SAMPLE_SOURCES, renderRelationshipScatter } from '../lib/template-relationship-scatter';
import { renderDistributionMap } from '../lib/template-distribution-map';

/** Explicit publishing only. GET requests never generate or upload samples. */
async function main() {
  // Preserve native ESM loading for the storage client's ESM-only proxy dependency.
  const { readVerified, mediaStore } = await import('../../../.claude/scripts/media/lib/storage.mjs');
  const { candidateKey, inputKey, sha, storeVerified } = await import('../../../.claude/scripts/media/lib/workspace.mjs');
  const { assertMinimalChartCopy } = await import('../../../.claude/scripts/media/lib/image-copy.mjs');
  const { datasetDir } = await import('../../../config/datasets.mjs');
  const args = process.argv.slice(2);
  const flags = ['--trend', '--composition', '--relationship', '--distribution', '--change'];
  if (args.some((arg) => arg !== '--apply' && !flags.includes(arg))) throw Error('Usage: publish-ranking-samples.ts [--trend | --composition | --relationship | --distribution | --change] [--apply]');
  const apply = args.includes('--apply');
  const trend = args.includes('--trend');
  const composition = args.includes('--composition');
  const relationship = args.includes('--relationship');
  const distribution = args.includes('--distribution');
  const change = args.includes('--change');
  if (flags.filter((flag) => args.includes(flag)).length > 1) throw Error('Choose one sample collection.');
  const collection = trend ? 'trend' : composition ? 'composition' : relationship ? 'relationship' : distribution ? 'distribution' : change ? 'change' : 'ranking';
  const root = path.resolve(__dirname, '../../..');
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const sourceFiles = trend ? ['apps/admin/lib/template-trend-line.ts', `${datasetDir('metrics.definitions')}/engel-coefficient.ts`, `${datasetDir('metrics.definitions')}/food-expenditure-total.ts`] : composition ? ['apps/admin/lib/template-composition-stacked.ts'] : relationship ? [
    'apps/admin/lib/template-relationship-scatter.ts', 'apps/admin/lib/template-ranking-bars.ts', 'packages/svg-builder/src/shared/regression.ts',
    `${datasetDir('metrics.definitions')}/average-temperature.ts`, `${datasetDir('metrics.definitions')}/kerosene-consumption-quantity.ts`,
  ] : distribution ? [
    'apps/admin/lib/template-distribution-map.ts', 'apps/admin/lib/template-ranking-data.ts', 'apps/admin/lib/template-ranking-bars.ts',
    'apps/remotion/src/features/buzz-map/geo.ts', 'apps/remotion/src/features/buzz-map/tokens.ts',
    'apps/remotion/public/prefecture.topojson', 'apps/remotion/src/features/data-cards/tile-scale.ts',
  ] : change ? [
    'apps/admin/lib/template-tile-change.ts', '.claude/scripts/sns/lib/data-card-input.ts',
    'apps/remotion/src/features/data-cards/TileChange.tsx', 'apps/remotion/src/features/data-cards/all47-svg.ts',
    'apps/remotion/src/features/data-cards/tile-layout.ts', `${datasetDir('metrics.definitions')}/total-population.ts`,
  ] : [
    'apps/admin/lib/template-ranking-data.ts', 'apps/admin/lib/template-ranking-bars.ts',
    'apps/admin/lib/template-ranking-table.ts', 'apps/admin/lib/template-ranking-tile-map.ts',
    'apps/remotion/src/features/data-cards/all47-svg.ts', 'apps/remotion/src/features/data-cards/tile-layout.ts',
    'apps/remotion/src/features/data-cards/tile-scale.ts',
  ];
  sourceFiles.push(
    'apps/admin/scripts/publish-ranking-samples.ts',
    'packages/types/src/metric-presentation.ts', 'packages/types/src/numeric-domain.ts',
    'packages/types/src/color-classification.ts', 'packages/types/src/numeric-ticks.ts', 'packages/types/src/color-encoding.ts',
    'packages/types/src/color-scheme.ts', `${datasetDir('metrics.definitions')}/defaults/presentation.ts`,
    'packages/svg-builder/src/shared/axis.ts', 'packages/svg-builder/src/charts/choropleth.ts',
    'packages/svg-builder/src/charts/line.ts', 'packages/svg-builder/src/charts/stacked-bar.ts',
    'packages/svg-builder/src/tables/ranking-table.ts', 'packages/svg-builder/src/shared/text-metrics.ts',
    'packages/svg-builder/src/shared/stats-schema.ts', 'packages/svg-builder/src/shared/theme.ts',
    'packages/svg-builder/src/shared/color.ts', 'packages/svg-builder/src/shared/layout.ts',
    'packages/visualization/src/d3/utils/color-scale/resolve-choropleth-scale.ts',
    'packages/visualization/src/d3/utils/color-scale/create-color-schemes.ts',
    `${datasetDir('metrics.definitions')}/maximum-temperature.ts`, 'apps/web/src/features/ogp/brand.ts'
  );
  const sources = [...new Set(sourceFiles)].map((file) => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    return { path: file, sha256: sha(Buffer.from(source)), source };
  });
  const modifiedSources = execFileSync('git', ['status', '--porcelain', '--', ...sourceFiles], { cwd: root, encoding: 'utf8' }).trim().length > 0;
  // A relationship sample joins two fixed snapshots; every other collection reads one.
  const sourceReferences = relationship ? [RELATIONSHIP_SAMPLE_SOURCES.x, RELATIONSHIP_SAMPLE_SOURCES.y]
    : change ? [CHANGE_SAMPLE_SOURCES.item, CHANGE_SAMPLE_SOURCES.values]
    : [trend ? TREND_SAMPLE_SOURCE : composition ? COMPOSITION_SAMPLE_SOURCE : RANKING_SAMPLE_SOURCE];
  // A public snapshot can be refreshed after a sample was pinned; the exact pinned bytes stay in the
  // private input copy saved by the previous publish, verified by the same SHA-256.
  const readPinned = async (reference: { key: string; sha256: string; bytes: number }) => {
    try { return await readVerified(reference); } catch (error) {
      const copy = await mediaStore().get(inputKey(reference.sha256));
      if (!copy || copy.length !== reference.bytes || sha(copy) !== reference.sha256) throw error;
      console.log(JSON.stringify({ pinnedInputFrom: inputKey(reference.sha256), publicKey: reference.key }));
      return copy;
    }
  };
  const snapshots = await Promise.all(sourceReferences.map((reference) => readPinned(reference)));
  const raws = snapshots.map((snapshot) => JSON.parse(snapshot.toString('utf8')));
  const sourceEvidence = composition ? await readPinned(COMPOSITION_SAMPLE_PROVENANCE) : undefined;
  const input = relationship ? { x: raws[0], y: raws[1] } : change ? { item: raws[0], values: raws[1] } : trend || composition ? raws[0] : rankingInputFromStats(raws[0]);
  const renderers = trend ? { 'engel-trend': renderTrendLine } : composition ? { 'liquor-breakdown': renderCompositionStacked }
    : relationship ? { 'temperature-kerosene': renderRelationshipScatter } : distribution ? { 'maximum-temperature-map': renderDistributionMap }
    : change ? { 'population-change': renderTileChangeSample }
    : { bars: renderRankingBars, table: renderRankingTable, 'tile-map': renderRankingTileMap };
  // Validate every image before writing any object or changing the active references.
  const outputs = [];
  for (const [kind, render] of Object.entries(renderers)) {
    if (!render) continue;
    const svg = await render(input);
    assertMinimalChartCopy(svg);
    const svgBytes = Buffer.from(svg);
    const png = await sharp(svgBytes, { limitInputPixels: 40_000_000 }).png().toBuffer();
    const metadata = await sharp(png).metadata();
    if (metadata.width !== 1080 || metadata.height !== 1350) throw Error('見本の固定サイズが不正です。');
    outputs.push({ kind, svg: svgBytes, png });
    console.log(JSON.stringify({ kind, bytes: png.length, sha256: sha(png), apply }));
  }
  if (!apply) return;
  assertR2WriteAllowed({ op: `${collection} samples: PNGs, SVGs and provenance (immutable exact keys)` });
  const store = mediaStore();
  // Also retain a private copy of the exact input so later public snapshot refreshes cannot lose it.
  const savedInputs = [];
  for (const snapshot of snapshots) savedInputs.push(await storeVerified(store, inputKey(sha(snapshot)), snapshot));
  const savedEvidence = sourceEvidence ? await storeVerified(store, inputKey(sha(sourceEvidence)), sourceEvidence) : undefined;
  const assets: Record<string, unknown> = {};
  for (const output of outputs) {
    const svg = await storeVerified(store, candidateKey(sha(output.svg), 'svg'), output.svg);
    const png = await storeVerified(store, candidateKey(sha(output.png), 'png'), output.png);
    const provenance = Buffer.from(JSON.stringify({
      schemaVersion: 1, sampleId: collection === 'ranking' ? 'maximum-temperature-' + output.kind : output.kind,
      input: relationship || change ? savedInputs : savedInputs[0], source: relationship || change ? sourceReferences : sourceReferences[0],
      sourceEvidence: savedEvidence, svg, png,
      width: 1080, height: 1350, media: ['note', 'web', 'x', 'instagram'],
      renderer: { commit, modifiedSources, sources, versions: sharp.versions, platform: process.platform },
    }));
    const manifest = await storeVerified(store, inputKey(sha(provenance)), provenance);
    assets[output.kind] = { png, manifest };
    console.log(JSON.stringify({ saved: output.kind, png: png.key, provenance: manifest.key }));
  }
  // Update the Git pointer only after every R2 object passed read-back verification.
  const target = path.join(root, `apps/admin/lib/template-${collection}-assets.ts`);
  const content = `// Generated by scripts/publish-ranking-samples.ts ${collection === 'ranking' ? '' : '--' + collection + ' '}--apply after verified R2 upload.\n`
    + '// Four media share each immutable 1080 × 1350 PNG. Provenance retains the input and SVG.\n'
    + "import type { StoredObject } from '../../../.claude/scripts/media/lib/workspace.mjs';\n\n"
    + `export const ${collection.toUpperCase()}_SAMPLE_ASSETS = ` + JSON.stringify(assets, null, 2)
    + ' as const satisfies Record<string, { png: StoredObject; manifest: StoredObject }>;\n';
  const temporary = target + '.pending';
  fs.writeFileSync(temporary, content);
  fs.renameSync(temporary, target);
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
