#!/usr/bin/env node
/** Render opt-in article candidates from media:prepare output. Never publish or approve. */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { z } from 'zod';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { interpolateBlues } from 'd3-scale-chromatic';
import { generateBarChartSvg, generateMobileMapSvg, generateMobileScatterSvg } from '../../../packages/svg-builder/src';
import { computeChoroplethPaths } from '../../../apps/remotion/src/shared/utils/choropleth';

const sampleSchema = z.object({
  id: z.string().regex(/^IMG-[a-f0-9]{24}$/), directory: z.string(),
  kind: z.enum(['ranking', 'map', 'scatter']), dataFile: z.string(),
  title: z.string(), subtitle: z.string(), unit: z.string().optional(),
  xLabel: z.string().optional(), yLabel: z.string().optional(), focusNames: z.array(z.string()).optional(),
  changes: z.string(),
});
const rankingSchema = z.object({ data: z.array(z.object({ rank: z.number().int(), area_code: z.string(), area_name: z.string(), value: z.number().finite(), year: z.string() })) });
const scatterSchema = z.object({ points: z.array(z.object({ code: z.string(), label: z.string(), x: z.number().finite(), y: z.number().finite() })) });
const args = process.argv.slice(2), file = args[args.indexOf('--spec') + 1];
if (!args.includes('--spec') || !file) throw Error('Usage: tsx .claude/scripts/media/render-article-pilot.ts --spec <scratch/spec.json> [--register --admin http://127.0.0.1:4757]');
const samples = z.array(sampleSchema).min(1).max(9).parse(JSON.parse(fs.readFileSync(file, 'utf8')));
const register = args.includes('--register');
const admin = new URL(args.includes('--admin') ? args[args.indexOf('--admin') + 1] : 'http://127.0.0.1:4757');
if (admin.protocol !== 'http:' || admin.hostname !== '127.0.0.1' || admin.username || admin.password) throw Error('Use the local admin only.');
const rendererFiles = [
  '.claude/scripts/media/render-article-pilot.ts', 'packages/svg-builder/src/charts/article-mobile.ts',
  'packages/svg-builder/src/charts/bar-chart.ts', 'packages/svg-builder/src/shared/axis.ts',
  'packages/svg-builder/src/shared/color.ts', 'packages/svg-builder/src/shared/regression.ts',
  'packages/svg-builder/src/shared/theme.ts', 'apps/remotion/src/shared/utils/choropleth.ts',
];

async function main() {
  const { ROOT, sha, imageById, inputKey, candidateKey, storeVerified, safeName } = await import('./lib/workspace.mjs');
  const { mediaStore } = await import('./lib/storage.mjs');
  const { assertStaticSvg } = await import('./lib/svg-safety.mjs');
  for (const sample of samples) {
    const current = imageById(ROOT, sample.id);
    if (current.kind === 'cover') throw Error('Cover images use their dedicated workflow.');
    const prepared = JSON.parse(fs.readFileSync(path.join(sample.directory, 'request.json'), 'utf8'));
    if (prepared.imageId !== sample.id || prepared.owner !== current.owner) throw Error('Prepared image ownership mismatch.');
    const inputs: { name: string; sha256: string; text: string }[] = [];
    for (const entry of prepared.restored as { file: string; sha256: string; bytes: number }[]) {
      const relative = entry.file.replaceAll('\\', '/');
      if (!safeName(relative)) throw Error('Unsafe prepared path.');
      const bytes = fs.readFileSync(path.join(sample.directory, relative));
      if (sha(bytes) !== entry.sha256 || bytes.length !== entry.bytes) throw Error('Prepared file changed: ' + relative);
      if (relative.startsWith('inputs/')) {
        const name = relative.slice('inputs/'.length), original = current.inputFiles.find(f => f.name === name);
        if (!original || original.sha256 !== entry.sha256) throw Error('Source inventory changed: ' + name);
        inputs.push({ name, sha256: entry.sha256, text: bytes.toString('utf8') });
      } else if (entry.sha256 !== current.original?.sha256) throw Error('Original image changed.');
    }
    const raw = inputs.find(i => i.name === sample.dataFile);
    if (!raw) throw Error('Fixed numeric data is absent.');
    const frozen = JSON.parse(raw.text);
    let svg: string;
    let geometry: { path: string; sha256: string; json: unknown } | undefined;
    if (sample.kind === 'scatter') {
      const { points } = scatterSchema.parse(frozen);
      if (!sample.xLabel || !sample.yLabel) throw Error('Both axis labels are required.');
      svg = generateMobileScatterSvg(points.map(p => ({ ...p, name: p.label })), { title: sample.title, subtitle: sample.subtitle, xLabel: sample.xLabel, yLabel: sample.yLabel, focusNames: sample.focusNames ?? [] });
    } else {
      const rows = rankingSchema.parse(frozen).data;
      const codes = rows.map(r => r.area_code);
      if (rows.length !== 47 || new Set(codes).size !== 47 || rows.some(r => !/^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(r.area_code)) || new Set(rows.map(r => r.year)).size !== 1) throw Error('Expected 47 unique prefectures in one observation year.');
      if (!sample.subtitle.includes(rows[0].year) || !sample.unit) throw Error('Observation year and unit are required.');
      if ('unit' in frozen && frozen.unit !== sample.unit) throw Error('Unit differs from fixed data.');
      const ordered = [...rows].sort((a, b) => b.value - a.value || a.rank - b.rank);
      if (sample.kind === 'ranking') {
        const asItem = (r: typeof rows[number]) => ({ label: r.area_name, name: r.area_name, rank: r.rank, value: r.value });
        svg = generateBarChartSvg([...ordered.slice(0, 5).map(asItem), { label: '', value: 0, isSeparator: true }, ...ordered.slice(-5).map(asItem)], { title: sample.title, subtitle: sample.subtitle, unit: sample.unit, layout: 'mobile', palette: 'blue', rightPalette: 'blue' });
      } else {
        const geoPath = 'apps/remotion/public/prefecture.topojson', geoBytes = fs.readFileSync(path.join(ROOT, geoPath));
        const topology: Topology<{ pref: GeometryCollection<{ N03_007: string }> }> = JSON.parse(geoBytes.toString('utf8'));
        geometry = { path: geoPath, sha256: sha(geoBytes), json: topology };
        const values = rows.map(r => ({ areaCode: r.area_code, value: r.value }));
        const part = (okinawa: boolean) => ({ ...topology, objects: { pref: { ...topology.objects.pref, geometries: topology.objects.pref.geometries.filter(g => (g.properties && 'N03_007' in g.properties && g.properties.N03_007 === '47') === okinawa) } } });
        const paths = [
          ...computeChoroplethPaths(part(false), values, { width: 592, height: 500, padding: 6, offsetX: 24, offsetY: 144 }),
          ...computeChoroplethPaths(part(true), values, { width: 164, height: 80, padding: 4, offsetX: 32, offsetY: 560 }),
        ];
        svg = generateMobileMapSvg(paths.map(p => ({ code: p.prefCode, name: p.prefName, path: p.path, fill: p.fill, value: rows.find(r => r.area_code === p.prefCode)!.value })), {
          title: sample.title, subtitle: sample.subtitle, unit: sample.unit,
          legend: { min: ordered.at(-1)!.value, max: ordered[0].value, colors: Array.from({ length: 21 }, (_, i) => interpolateBlues(i / 20)) },
          focusCodes: [ordered[0].area_code, ordered.at(-1)!.area_code],
        });
      }
    }
    assertStaticSvg(Buffer.from(svg));
    if (/NaN|Infinity|undefined/.test(svg)) throw Error('Non-finite or missing chart output.');
    const png = await sharp(Buffer.from(svg), { density: 144 }).flatten({ background: 'white' }).png({ compressionLevel: 9 }).toBuffer();
    if (png.length > 200 * 1024) throw Error('Note chart exceeds the 200 KiB budget.');
    fs.writeFileSync(path.join(sample.directory, 'candidate.svg'), svg);
    fs.writeFileSync(path.join(sample.directory, 'candidate.png'), png);
    await sharp(png).resize(320).png().toFile(path.join(sample.directory, 'candidate-mobile.png'));
    const { directory: _directory, ...portableSample } = sample;
    const evidence = { schemaVersion: 1, imageId: sample.id, basis: current.basis, original: current.original, sample: portableSample, inputs, geometry, renderer: rendererFiles.map(file => { const source = fs.readFileSync(path.join(ROOT, file), 'utf8'); return { file, sha256: sha(source), source }; }), numericInputSha256: raw.sha256, validation: { prefectures: 47, numericInputUnchanged: true, originalAndInputHashesVerified: true, pngBytes: png.length }, svgSha256: sha(svg), pngSha256: sha(png) };
    const evidenceBytes = Buffer.from(JSON.stringify(evidence));
    fs.writeFileSync(path.join(sample.directory, 'candidate-evidence.json'), evidenceBytes);
    if (register) {
      if (imageById(ROOT, sample.id).revision !== current.revision) throw Error('The image plan changed during rendering.');
      const store = mediaStore();
      const bundle = await storeVerified(store, inputKey(sha(evidenceBytes)), evidenceBytes);
      const vector = await storeVerified(store, candidateKey(sha(svg), 'svg'), Buffer.from(svg));
      const form = new FormData();
      form.set('file', new File([new Uint8Array(png)], 'candidate.png', { type: 'image/png' }));
      form.set('revision', current.revision);
      form.set('evidence', JSON.stringify({ renderer: rendererFiles[0] + ' (fixed-input mobile prototype)', sourceData: JSON.stringify({ frozenBundle: bundle, vector, numericInputSha256: raw.sha256 }), changes: sample.changes }));
      const response = await fetch(new URL('/api/media-library/' + sample.id + '/candidate', admin), { method: 'POST', headers: { Origin: admin.origin }, body: form });
      if (!response.ok) throw Error('Candidate registration failed: ' + response.status + ' ' + await response.text());
      const saved = await response.json();
      if (saved.candidate?.storage.sha256 !== sha(png) || !saved.candidateMatches || saved.approved) throw Error('Candidate readback mismatch.');
      console.log(JSON.stringify({ id: sample.id, registered: true, candidate: saved.candidate.id, pngBytes: png.length, bundle: bundle.key }));
    } else console.log(JSON.stringify({ id: sample.id, directory: sample.directory, pngBytes: png.length, registered: false }));
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
