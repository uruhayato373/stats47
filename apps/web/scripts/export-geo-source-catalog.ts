/** Generate the public viewer index from git metadata and an observed R2 inventory. */
import { createHash } from 'node:crypto';
import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  statSync,
} from 'node:fs';
import path from 'node:path';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { FLOOD_ARCHIVES } from '@stats47/gis';
import { GIS_DATASETS, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';

import {
  GEO_SOURCE_CATALOG_KEY,
  parseGeoSourceCatalog,
  parseGeoSourceItem,
} from '../src/features/geo-analysis/lib/geo-source-catalog';

const arg = (name: string) => process.argv[process.argv.indexOf(name) + 1];
if (!process.argv.includes('--du-log') || !process.argv.includes('--metadata'))
  throw Error('--du-log and --metadata are required');
let rows = readFileSync(arg('--du-log'), 'utf8')
  .split(/\r?\n/)
  .flatMap((line) => {
    const match = line.match(
      /([\d.]+) (Bytes|KB|MB|GB)\s+1\s+(gis\/mlit-ksj\/[^\s]+)\/$/
    );
    return match
      ? [
          {
            key: match[3],
            bytes: Math.round(
              Number(match[1]) *
                1024 ** ['Bytes', 'KB', 'MB', 'GB'].indexOf(match[2])
            ),
          },
        ]
      : [];
  });
if (!rows.length)
  throw Error(
    'No object-level R2 inventory; use successful du workflow depth=20'
  );
// Local regenerations may restore files absent from the remote inventory (A38/20).
// Replace that dataset's inventory only after validating every declared output.
if (process.argv.includes('--source-manifest')) {
  const manifest = JSON.parse(
    readFileSync(arg('--source-manifest'), 'utf8')
  ) as {
    dataId: string;
    version: string;
    sourceSha256: string;
    sourceCounts: Record<string, number>;
    outputs: {
      key: string;
      bytes: number;
      outputSha256: string;
      featureCount: number;
    }[];
  };
  const meta = GIS_DATASETS.find(
    (candidate) => candidate.dataId === manifest.dataId
  );
  if (
    !meta ||
    meta.latestVersion !== manifest.version ||
    getKsjLicensePolicy(meta.license).sourcePublication !==
      'public-r2-eligible' ||
    !/^[a-f0-9]{64}$/.test(manifest.sourceSha256) ||
    !manifest.outputs?.length
  )
    throw Error('Invalid local source manifest');
  const prefix = `gis/mlit-ksj/${meta.dataId}/${manifest.version}/`;
  const keys = new Set<string>();
  for (const output of manifest.outputs) {
    if (
      !output.key.startsWith(prefix) ||
      output.key.includes('..') ||
      output.key.includes('\\') ||
      !output.key.endsWith('.topojson') ||
      keys.has(output.key)
    )
      throw Error('Invalid or duplicate local output key');
    keys.add(output.key);
    const bytes = readFileSync(path.resolve('.local/r2', output.key));
    if (
      bytes.length !== output.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== output.outputSha256
    )
      throw Error(`Local output does not match its manifest: ${output.key}`);
  }
  if (
    !manifest.sourceCounts ||
    Object.values(manifest.sourceCounts).reduce((a, b) => a + b, 0) !==
      manifest.outputs.reduce((total, output) => total + output.featureCount, 0)
  )
    throw Error('Local source feature conservation failed');
  rows = rows
    .filter((row) => !row.key.startsWith(prefix))
    .concat(manifest.outputs.map(({ key, bytes }) => ({ key, bytes })));
}
const metadata = JSON.parse(
  readFileSync(arg('--metadata'), 'utf8').replace(/^\uFEFF/, '')
);
const items = [];
const missing = [];
for (const meta of GIS_DATASETS) {
  if (
    getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
  )
    continue;
  const version = meta.latestVersion;
  if (!version) throw Error(`Missing version: ${meta.dataId}`);
  const prefix = `gis/mlit-ksj/${meta.dataId}/${version}/`;
  const assets = rows
    .filter(
      (row) => row.key.startsWith(prefix) && row.key.endsWith('.topojson')
    )
    .map((row) => {
      const suffix = row.key.slice(prefix.length);
      const medical =
        meta.dataId === 'A38'
          ? suffix.match(/^A38-20_([123])\.(\d{2})\.topojson$/)
          : null;
      const pref =
        medical?.[2] ?? suffix.match(/^(\d{2})(?:\.topojson|\/)/)?.[1];
      const name = PREFECTURE_LIST_2DIGIT.find((p) => p.code === pref)?.name;
      return {
        ...row,
        bytes: existsSync(path.resolve('.local/r2', row.key))
          ? statSync(path.resolve('.local/r2', row.key)).size
          : row.bytes,
        label:
          medical && name
            ? `${name}・${['一次', '二次', '三次'][Number(medical[1]) - 1]}医療圏 · ${suffix}`
            : name
              ? `${name} · ${suffix}`
              : suffix === 'national.topojson'
                ? '全国'
                : `配布区画 ${suffix}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  if (!assets.length) {
    missing.push(meta.dataId);
    continue;
  }
  const sourceUrl =
    meta.sourcePageUrl ??
    metadata.items.find(
      (item: { dataId: string }) => item.dataId === meta.dataId
    )?.sourcePageUrl;
  items.push({ dataId: meta.dataId, version, sourceUrl, assets });
}
if (process.argv.includes('--flood-manifest')) {
  const flood = JSON.parse(readFileSync(arg('--flood-manifest'), 'utf8'));
  if (flood.dataId !== 'A31b' || flood.sourceCount !== FLOOD_ARCHIVES.length)
    throw Error('Incomplete flood source set');
  items.push({
    dataId: 'A31b',
    version: '25',
    sourceUrl: flood.sourceUrl,
    assets: flood.assets.map(
      ({
        key,
        label,
        bytes,
      }: {
        key: string;
        label: string;
        bytes: number;
      }) => ({ key, label, bytes })
    ),
  });
  missing.splice(missing.indexOf('A31b'), 1);
}
for (const item of items) {
  if (!parseGeoSourceItem(item)) throw Error(`Invalid item ${item.dataId}`);
  const itemPath = path.resolve(
    '.local/r2',
    `app/geo/datasets/${item.dataId}/item.json`
  );
  mkdirSync(path.dirname(itemPath), { recursive: true });
  writeFileSync(itemPath, JSON.stringify(item));
}
const catalog = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  items: items.map(({ assets, ...meta }) => ({
    ...meta,
    assetCount: assets.length,
  })),
};
if (!parseGeoSourceCatalog(catalog))
  throw Error('Generated catalog failed validation');
const output = path.resolve('.local/r2', GEO_SOURCE_CATALOG_KEY);
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(catalog));
console.log(
  JSON.stringify({
    datasets: items.length,
    assets: items.reduce((n, item) => n + item.assets.length, 0),
    missing,
    output,
  })
);
