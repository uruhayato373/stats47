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
import { TREND_SAMPLE_SOURCE, renderTrendLine } from '../lib/template-trend-line';
import { COMPOSITION_SAMPLE_SOURCE, COMPOSITION_SAMPLE_PROVENANCE, renderCompositionStacked } from '../lib/template-composition-stacked';

/** Explicit publishing only. GET requests never generate or upload samples. */
async function main() {
  // Preserve native ESM loading for the storage client's ESM-only proxy dependency.
  const { readVerified, mediaStore } = await import('../../../.claude/scripts/media/lib/storage.mjs');
  const { candidateKey, inputKey, sha, storeVerified } = await import('../../../.claude/scripts/media/lib/workspace.mjs');
  const { assertMinimalChartCopy } = await import('../../../.claude/scripts/media/lib/image-copy.mjs');
  const { datasetDir } = await import('../../../config/datasets.mjs');
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--trend', '--composition'].includes(arg))) throw Error('Usage: publish-ranking-samples.ts [--trend | --composition] [--apply]');
  const apply = args.includes('--apply');
  const trend = args.includes('--trend');
  const composition = args.includes('--composition');
  if (trend && composition) throw Error('Choose one sample collection.');
  const collection = trend ? 'trend' : composition ? 'composition' : 'ranking';
  const root = path.resolve(__dirname, '../../..');
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const sourceFiles = trend ? ['apps/admin/lib/template-trend-line.ts', `${datasetDir('metrics.definitions')}/engel-coefficient.ts`, `${datasetDir('metrics.definitions')}/food-expenditure-total.ts`] : composition ? ['apps/admin/lib/template-composition-stacked.ts'] : [
    'apps/admin/lib/template-ranking-data.ts', 'apps/admin/lib/template-ranking-bars.ts',
    'apps/admin/lib/template-ranking-table.ts', 'apps/admin/lib/template-ranking-tile-map.ts',
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
  const sourceReference = trend ? TREND_SAMPLE_SOURCE : composition ? COMPOSITION_SAMPLE_SOURCE : RANKING_SAMPLE_SOURCE;
  const snapshot = await readVerified(sourceReference);
  const raw = JSON.parse(snapshot.toString('utf8'));
  const sourceEvidence = composition ? await readVerified(COMPOSITION_SAMPLE_PROVENANCE) : undefined;
  const input = trend || composition ? raw : rankingInputFromStats(raw);
  const renderers = trend ? { 'engel-trend': renderTrendLine } : composition ? { 'liquor-breakdown': renderCompositionStacked } : { bars: renderRankingBars, table: renderRankingTable, 'tile-map': renderRankingTileMap };
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
  const savedInput = await storeVerified(store, inputKey(sha(snapshot)), snapshot);
  const savedEvidence = sourceEvidence ? await storeVerified(store, inputKey(sha(sourceEvidence)), sourceEvidence) : undefined;
  const assets: Record<string, unknown> = {};
  for (const output of outputs) {
    const svg = await storeVerified(store, candidateKey(sha(output.svg), 'svg'), output.svg);
    const png = await storeVerified(store, candidateKey(sha(output.png), 'png'), output.png);
    const provenance = Buffer.from(JSON.stringify({
      schemaVersion: 1, sampleId: trend || composition ? output.kind : 'maximum-temperature-' + output.kind,
      input: savedInput, source: sourceReference, sourceEvidence: savedEvidence, svg, png,
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
