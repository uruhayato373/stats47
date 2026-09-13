/** Restore A38 from the official ZIP, preserving Japanese attributes and small islands.
 * Run from the repository root with --source-zip <A38-20_GML.zip>.
 * Writes only the local R2 mirror; does not upload anything.
 */
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { gzipSync } from 'node:zlib';

import * as shapefile from 'shapefile';
import unzipper from 'unzipper';

import {
  convertGeoJsonFeatureCollectionToTopoJson,
  type GeoJSONFeatureCollection,
} from '../converter';
import { GIS_DATASETS_BY_ID } from '../datasets';
import { getKsjLicensePolicy } from '../license-policy';
import { PREF_NAME_BY_CODE } from '../prefecture-assign';

const SOURCE_SHA256 =
  '40a0be3688cd129dfd86fef7508e563b1f34259b5b37a521ebf7a01295013b5d';
const EXPECTED_COUNTS: Record<string, number> = {
  '1': 118119,
  '2': 116365,
  '3': 116037,
};
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

async function main() {
  const index = process.argv.indexOf('--source-zip');
  if (index < 0 || !process.argv[index + 1])
    throw Error('--source-zip is required');
  const sourceZip = path.resolve(process.argv[index + 1]);
  const root = process.cwd();
  if (!fs.existsSync(path.join(root, 'packages/gis/src/mlit-ksj/datasets.ts')))
    throw Error('Run from the stats47 repository root');
  const meta = GIS_DATASETS_BY_ID.get('A38')!;
  if (
    meta.latestVersion !== '20' ||
    getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
  )
    throw Error('Revalidate the source edition and publication policy first');
  const hash = createHash('sha256');
  for await (const bytes of fs.createReadStream(sourceZip)) hash.update(bytes);
  if (hash.digest('hex') !== SOURCE_SHA256)
    throw Error('Official ZIP SHA256 does not match the verified source');
  const temp = fs.mkdtempSync(path.join(tmpdir(), 'stats47-a38-'));
  const outputs: {
    key: string;
    featureCount: number;
    outputSha256: string;
    bytes: number;
  }[] = [];
  const sourceCounts: Record<string, number> = {};
  try {
    const zip = await unzipper.Open.file(sourceZip);
    for (const level of [1, 2, 3]) {
      for (const ext of ['shp', 'dbf']) {
        const name = `A38-20_${level}.${ext}`;
        const entry = zip.files.find(
          (file: { path: string }) =>
            path.posix.basename(file.path.replace(/\\/g, '/')) === name
        );
        if (!entry) throw Error(`Original archive is missing ${name}`);
        await pipeline(
          entry.stream(),
          fs.createWriteStream(path.join(temp, name))
        );
      }
      const dir = path.join(temp, String(level));
      fs.mkdirSync(dir);
      const streams = new Map<string, fs.WriteStream>();
      const counts = new Map<string, number>();
      const source = await shapefile.open(
        path.join(temp, `A38-20_${level}.shp`),
        path.join(temp, `A38-20_${level}.dbf`),
        { encoding: 'shift-jis' }
      );
      try {
        while (true) {
          const record = await source.read();
          if (record.done) break;
          const properties = record.value.properties ?? {};
          const code =
            level === 3
              ? Object.keys(PREF_NAME_BY_CODE).find(
                  (key) => PREF_NAME_BY_CODE[key] === properties.A38c_001
                )
              : String(properties[level === 1 ? 'A38a_001' : 'A38b_001']).slice(
                  0,
                  2
                );
          if (!code || !PREF_NAME_BY_CODE[code])
            throw Error('Original prefecture code/name is unresolved');
          if (JSON.stringify(properties).includes('\ufffd'))
            throw Error('Original attributes contain replacement characters');
          let output = streams.get(code);
          if (!output) {
            output = fs.createWriteStream(path.join(dir, `${code}.jsonl`));
            streams.set(code, output);
          }
          if (!output.write(JSON.stringify(record.value) + '\n'))
            await once(output, 'drain');
          counts.set(code, (counts.get(code) ?? 0) + 1);
        }
        await Promise.all(
          [...streams.values()].map(
            (output) =>
              new Promise<void>((resolve, reject) => {
                output.on('error', reject);
                output.end(() => resolve());
              })
          )
        );
      } finally {
        for (const output of streams.values()) output.destroy();
        await source.cancel();
      }
      sourceCounts[String(level)] = [...counts.values()].reduce(
        (a, b) => a + b,
        0
      );
      if (
        sourceCounts[String(level)] !== EXPECTED_COUNTS[String(level)] ||
        counts.size !== 47
      )
        throw Error(
          `Source conservation / prefecture coverage failed for level ${level}`
        );
      for (const [code, count] of counts) {
        const features = fs
          .readFileSync(path.join(dir, `${code}.jsonl`), 'utf8')
          .trim()
          .split('\n')
          .map((line) =>
            JSON.parse(line)
          ) as GeoJSONFeatureCollection['features'];
        const result = convertGeoJsonFeatureCollectionToTopoJson(
          { type: 'FeatureCollection', features },
          'A38',
          { quantize: 0, simplifyQuantile: 0 }
        );
        if (result.featureCount !== count)
          throw Error('Output feature conservation failed');
        const key = `gis/mlit-ksj/A38/20/A38-20_${level}.${code}.topojson`;
        const bytes = gzipSync(Buffer.from(JSON.stringify(result.topology)));
        const destination = path.join(root, '.local/r2', key);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, bytes);
        outputs.push({
          key,
          featureCount: count,
          outputSha256: sha(bytes),
          bytes: bytes.length,
        });
        console.log(`A38 level=${level} prefecture=${code} features=${count}`);
      }
    }
    const manifest = path.join(
      root,
      '.local/r2/app/geo/datasets/A38/repair.json'
    );
    fs.mkdirSync(path.dirname(manifest), { recursive: true });
    fs.writeFileSync(
      manifest,
      JSON.stringify(
        {
          dataId: 'A38',
          version: '20',
          sourceUrl:
            'https://nlftp.mlit.go.jp/ksj/gml/data/A38/A38-20/A38-20_GML.zip',
          sourceSha256: SOURCE_SHA256,
          sourceCounts,
          method:
            'Original Shapefile CP932; prefectures assigned only by original administrative code / prefecture name. No coordinate quantization or simplification. Feature count conserved per level and prefecture.',
          outputs,
        },
        null,
        2
      )
    );
  } finally {
    const resolved = path.resolve(temp);
    if (
      path.dirname(resolved) !== path.resolve(tmpdir()) ||
      !path.basename(resolved).startsWith('stats47-a38-')
    )
      throw Error('Unexpected temporary directory');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
