/** Generate the complete source viewer index from git metadata and an exact, observed inventory. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { GEO_SOURCE_PAGES } from '../../../packages/data-configs/src/business-plan/geo-source-pages';
import {
  GEO_SOURCE_CATALOG_KEY,
  parseGeoSourceCatalog,
  parseGeoSourceItem,
  type GeoSourceCatalog,
  type GeoSourceItem,
} from '../src/features/geo-analysis/lib/geo-source-catalog';
import {
  assertPublicDataset,
  assertSafeKey,
  validateRepairManifest,
  validateFloodManifest,
  validateLocalOutput,
  type RepairManifest,
  type FloodManifest,
} from './geo-source-publish-core';

export type SourceInventoryRow = { key: string; bytes: number; label?: string };
type SourceMetadata = { items: { dataId: string; sourcePageUrl?: string }[] };
export const SOURCE_PAGE_IDS = GEO_SOURCE_PAGES.map(
  (page) => page.dataId
).sort();

export function buildGeoSourceCatalog(options: {
  rows: SourceInventoryRow[];
  metadata: SourceMetadata;
  generatedAt: string;
}): { catalog: GeoSourceCatalog; items: GeoSourceItem[] } {
  if (SOURCE_PAGE_IDS.length !== 50 || new Set(SOURCE_PAGE_IDS).size !== 50)
    throw Error('The reviewed 50-source release scope changed');
  if (new Set(options.rows.map((row) => row.key)).size !== options.rows.length)
    throw Error('Duplicate inventory keys');
  const items = GEO_SOURCE_PAGES.map((page) => {
    const meta = assertPublicDataset(page.dataId, page.version);
    const prefix = `gis/mlit-ksj/${page.dataId}/${page.version}/`;
    const assets = options.rows
      .filter(
        (row) =>
          row.key.startsWith(prefix) &&
          (page.dataId === 'A31b'
            ? row.key.startsWith(prefix + 'display/') &&
              row.key.endsWith('.geojson')
            : row.key.endsWith('.topojson'))
      )
      .map((row) => {
        assertSafeKey(row.key);
        if (!Number.isSafeInteger(row.bytes) || row.bytes <= 0)
          throw Error(`Invalid exact inventory size: ${row.key}`);
        const suffix = row.key.slice(prefix.length);
        const medical =
          page.dataId === 'A38'
            ? suffix.match(/^A38-20_([123])\.(\d{2})\.topojson$/)
            : null;
        const pref =
          medical?.[2] ?? suffix.match(/^(\d{2})(?:\.topojson|\/)/)?.[1];
        const name = PREFECTURE_LIST_2DIGIT.find((p) => p.code === pref)?.name;
        return {
          key: row.key,
          bytes: row.bytes,
          label:
            row.label ??
            (medical && name
              ? `${name}・${['一次', '二次', '三次'][Number(medical[1]) - 1]}医療圏 · ${suffix}`
              : name
                ? `${name} · ${suffix}`
                : suffix === 'national.topojson'
                  ? '全国'
                  : `配布区画 ${suffix}`),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'));
    const sourceUrl =
      meta.sourcePageUrl ??
      options.metadata.items.find((item) => item.dataId === page.dataId)
        ?.sourcePageUrl;
    const item = parseGeoSourceItem({
      dataId: page.dataId,
      version: page.version,
      sourceUrl,
      assets,
    });
    if (!item || !assets.length)
      throw Error(`Missing/invalid source item: ${page.dataId}`);
    return item;
  }).sort((a, b) => a.dataId.localeCompare(b.dataId));
  const catalog = parseGeoSourceCatalog({
    schemaVersion: 1,
    generatedAt: options.generatedAt,
    items: items.map(({ assets, ...meta }) => ({
      ...meta,
      assetCount: assets.length,
    })),
  });
  if (!catalog) throw Error('Generated catalog failed validation');
  return { catalog, items };
}

export function writeGeoSourceCatalog(
  root: string,
  data: ReturnType<typeof buildGeoSourceCatalog>
): string[] {
  const outputs = [
    ...data.items.map((item) => ({
      key: `app/geo/datasets/${item.dataId}/item.json`,
      value: item,
    })),
    { key: GEO_SOURCE_CATALOG_KEY, value: data.catalog },
  ];
  for (const { key, value } of outputs) {
    const file = path.resolve(root, key);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(value));
  }
  return outputs.map((o) => o.key);
}

export function sourceMetadataFromGit(): SourceMetadata {
  const candidates = JSON.parse(
    readFileSync('packages/database/seed/ksj-catalog.json', 'utf8')
  ) as { id: string; source_url: string }[];
  return {
    items: candidates.map((candidate) => ({
      dataId: candidate.id,
      sourcePageUrl: candidate.source_url,
    })),
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const arg = (name: string) => process.argv[process.argv.indexOf(name) + 1];
  const root = path.resolve('.local/r2');
  if (!process.argv.includes('--inventory-json'))
    throw Error(
      '--inventory-json <[{key,bytes}]> is required; rounded du logs are not an exact inventory'
    );
  let rows = JSON.parse(
    readFileSync(arg('--inventory-json'), 'utf8')
  ) as SourceInventoryRow[];
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] !== '--source-manifest') continue;
    const manifest = JSON.parse(
      readFileSync(process.argv[++i], 'utf8')
    ) as RepairManifest;
    const outputs = validateRepairManifest(manifest);
    for (const output of outputs) validateLocalOutput(root, output);
    rows = rows
      .filter(
        (row) =>
          !row.key.startsWith(
            `gis/mlit-ksj/${manifest.dataId}/${manifest.version}/`
          )
      )
      .concat(outputs.map(({ key, bytes }) => ({ key, bytes })));
  }
  if (process.argv.includes('--flood-manifest')) {
    const flood = JSON.parse(
      readFileSync(arg('--flood-manifest'), 'utf8')
    ) as FloodManifest;
    for (const output of validateFloodManifest(flood))
      if (existsSync(path.resolve(root, output.key)))
        validateLocalOutput(root, output);
    rows = rows
      .filter((row) => !row.key.startsWith('gis/mlit-ksj/A31b/25/'))
      .concat(flood.assets);
  }
  const metadata = process.argv.includes('--metadata')
    ? (JSON.parse(
        readFileSync(arg('--metadata'), 'utf8').replace(/^\uFEFF/, '')
      ) as SourceMetadata)
    : sourceMetadataFromGit();
  const result = buildGeoSourceCatalog({
    rows,
    metadata,
    generatedAt: new Date().toISOString(),
  });
  console.log(
    JSON.stringify({
      keys: writeGeoSourceCatalog(root, result),
      datasets: result.items.length,
    })
  );
}
