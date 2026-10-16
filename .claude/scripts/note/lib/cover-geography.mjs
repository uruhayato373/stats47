/** Verified geographic reference inputs, never a generated final cover. */
import fs from 'node:fs';
import path from 'node:path';
import { geoArea, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import sharp from 'sharp';
import { COVER_ROOT, coverSha } from './cover-assets.mjs';

const SOURCE = 'apps/remotion/public/prefecture.topojson';
const PREFECTURES = 'packages/area/src/data/prefectures.json';
let cached;
function sourceData(root) {
  const file = path.join(root, SOURCE), stat = fs.statSync(file), prefFile = path.join(root, PREFECTURES), prefStat = fs.statSync(prefFile);
  const identity = `${file}:${stat.mtimeMs}:${stat.size}:${prefStat.mtimeMs}:${prefStat.size}`;
  if (cached?.identity === identity) return cached;
  const bytes = fs.readFileSync(file), topology = JSON.parse(bytes);
  const collection = feature(topology, topology.objects.pref);
  if (collection.features.length !== 47 || new Set(collection.features.map(f => f.properties.N03_007)).size !== 47)
    throw Error('prefecture reference requires 47 unique geometries');
  cached = { identity, collection, sourceSha256: coverSha(bytes), prefectures: JSON.parse(fs.readFileSync(path.join(root, PREFECTURES), 'utf8')) };
  return cached;
}

export function prefectureCoverReference(articleKey, root = COVER_ROOT) {
  const data = sourceData(root);
  const prefecture = data.prefectures.find(p => articleKey === `a-kakei-${p.romaji}`);
  if (!prefecture) throw Error('household article has no verified prefecture identity');
  const code = prefecture.prefCode.slice(0, 2);
  const original = data.collection.features.find(f => f.properties.N03_007 === code);
  if (!original || original.properties.N03_001 !== prefecture.prefName) throw Error('prefecture reference identity mismatch');
  const parts = original.geometry.type === 'MultiPolygon' ? original.geometry.coordinates : [original.geometry.coordinates];
  const coordinates = parts.reduce((best, part) => geoArea({ type: 'Polygon', coordinates: part }) > geoArea({ type: 'Polygon', coordinates: best }) ? part : best);
  const geometry = { type: 'Polygon', coordinates };
  const projected = geoPath(geoMercator().fitExtent([[32, 32], [480, 480]], geometry))(geometry);
  if (!projected || /NaN|Infinity/.test(projected)) throw Error('invalid prefecture reference projection');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#fffdf7"/><path d="${projected}" fill="#0f172a"/></svg>`;
  return { reference: { kind: 'prefecture-mainland', code, name: prefecture.prefName, sourcePath: SOURCE,
    sourceSha256: data.sourceSha256, geometrySha256: coverSha(JSON.stringify(geometry)), svgSha256: coverSha(svg),
    extent: 'largest-polygon; remote islands omitted; regional identifier only' }, svg };
}

export async function renderCoverReference(plan, root = COVER_ROOT) {
  if (!plan.mapReference) return null;
  const { reference, svg } = prefectureCoverReference(plan.articleKey, root);
  if (JSON.stringify(reference) !== JSON.stringify(plan.mapReference)) throw Error('geographic reference is stale or mismatched');
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function assertCoverReference(plan, bytes) {
  if (!plan.mapReference) {
    if (bytes) throw Error('unexpected geographic reference');
    return;
  }
  const expected = await renderCoverReference(plan);
  if (!bytes || coverSha(bytes) !== coverSha(expected)) throw Error('exact verified prefecture reference required');
}
