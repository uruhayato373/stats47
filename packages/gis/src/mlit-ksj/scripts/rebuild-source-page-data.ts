/** Rebuild the bounded P04/20, C28/07 and N08/21 source-page repairs from official ZIPs. */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import unzipper from 'unzipper';

import {
  convertGeoJsonFilesToTopoJson,
  parseKsjGeoJsonText,
} from '../converter';
import { GIS_DATASETS_BY_ID } from '../datasets';
import { extractGeoJson } from '../downloader';
import { getKsjLicensePolicy } from '../license-policy';

const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const arg = (name: string) => process.argv[process.argv.indexOf(name) + 1];
const versions: Record<string, string> = { P04: '20', C28: '07', N08: '21' };
const id = arg('--data-id');
const sourceDir = arg('--source-dir');
if (
  !process.argv.includes('--data-id') ||
  !process.argv.includes('--source-dir') ||
  !versions[id]
)
  throw new Error(
    'Required: --data-id P04|C28|N08 --source-dir <official ZIP directory>'
  );
const version = versions[id];
const meta = GIS_DATASETS_BY_ID.get(id);
if (
  !meta ||
  meta.latestVersion !== version ||
  getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
)
  throw new Error(
    'Source version or publication policy changed; review before rebuilding'
  );
const localRoot = path.resolve('.local/r2');

type Output = {
  key: string;
  sourceUrl: string;
  sourceSha256: string;
  outputSha256: string;
  featureCount: number;
  bytes: number;
};

async function restoreAirportNote(
  zipFile: string,
  files: string[]
): Promise<void> {
  // The official UTF-8 GeoJSON and DBF truncate this note mid-character. Its GML is intact.
  // Pin the archive and all identifying fields; do not guess the missing text from an airport name.
  if (
    sha(readFileSync(zipFile)) !==
    '52e2a850ce28f100979c67592c42e6e527fd7d9c7a3ba53c281527d39555e811'
  )
    throw new Error('N08 original changed; review the GML repair');
  const zip = await unzipper.Open.file(zipFile);
  const entry = zip.files.find(
    (file: { path: string; buffer(): Promise<Buffer> }) =>
      file.path === 'UTF-8/N08-21.xml'
  );
  if (!entry) throw new Error('N08 UTF-8 GML missing');
  const xml = new TextDecoder('utf-8', { fatal: true }).decode(
    await entry.buffer()
  );
  const records = [
    ...xml.matchAll(/<ksj:Airport\s[^>]*>[\s\S]*?<\/ksj:Airport>/g),
  ]
    .map((match) => match[0])
    .filter(
      (record) =>
        record.includes('<ksj:rfid>CF02_057</ksj:rfid>') &&
        record.includes('<gml:beginPosition>1988</gml:beginPosition>') &&
        record.includes('<gml:endPosition>1992</gml:endPosition>') &&
        record.includes('<ksj:trid>1</ksj:trid>')
    );
  if (records.length !== 1) throw new Error('N08 GML identity is not unique');
  const note = records[0].match(/<ksj:trrm>([^<]+)<\/ksj:trrm>/)?.[1];
  if (note !== '新岡山空港') throw new Error('N08 GML note differs');
  let repaired = 0;
  for (const file of files) {
    const data = parseKsjGeoJsonText(readFileSync(file, 'utf8'));
    for (const feature of data.features) {
      const properties = feature.properties;
      if (
        properties?.N08_016 !== 'CF02_057' ||
        properties.N08_014 !== 1988 ||
        properties.N08_015 !== 1992 ||
        String(properties.N08_017) !== '1'
      )
        continue;
      if (properties.N08_018 !== '新岡山\ufffd')
        throw new Error('N08 damaged note differs');
      feature.properties = { ...properties, N08_018: note };
      repaired += 1;
    }
    writeFileSync(file, JSON.stringify(data));
  }
  if (repaired !== 1) throw new Error('N08 repair count differs');
}

async function main() {
  const outputs: Output[] = [];
  const scopes =
    id === 'P04'
      ? Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0'))
      : ['national'];
  for (const scope of scopes) {
    const name = `${id}-${version}${scope === 'national' ? '' : `_${scope}`}_GML.zip`;
    const zipFile = path.resolve(sourceDir, name);
    const sourceSha256 = sha(readFileSync(zipFile));
    const sourceUrl = `https://nlftp.mlit.go.jp/ksj/gml/data/${id}/${id}-${version}/${name}`;
    const files = await extractGeoJson(
      zipFile,
      'UTF-8/',
      id === 'C28' ? 'shift-jis' : id === 'N08' ? 'utf-8' : undefined
    );
    if (id === 'N08') await restoreAirportNote(zipFile, files);
    const groups = id === 'C28' ? files.map((file) => [file]) : [files];
    for (const inputs of groups) {
      const expected = inputs.reduce(
        (count, file) =>
          count +
          parseKsjGeoJsonText(readFileSync(file, 'utf8')).features.length,
        0
      );
      const result = convertGeoJsonFilesToTopoJson(inputs, id, {
        quantize: 1000000,
        simplifyQuantile: 0,
      });
      if (
        result.featureCount !== expected ||
        JSON.stringify(result.topology.objects).includes('\ufffd')
      )
        throw new Error(`Source integrity failed: ${id}/${scope}`);
      const filename =
        id === 'C28'
          ? path.basename(inputs[0], '.geojson')
          : id === 'N08'
            ? 'national/data'
            : scope;
      const key = `gis/mlit-ksj/${id}/${version}/${filename}.topojson`;
      const target = path.resolve(localRoot, key);
      if (!target.startsWith(localRoot + path.sep))
        throw new Error('Output outside local R2');
      const bytes = gzipSync(Buffer.from(JSON.stringify(result.topology)));
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, bytes);
      outputs.push({
        key,
        sourceUrl,
        sourceSha256,
        outputSha256: sha(bytes),
        featureCount: expected,
        bytes: bytes.length,
      });
      console.log(`REBUILT ${key}: ${expected} features`);
    }
  }
  const manifest = path.join(localRoot, `app/geo/datasets/${id}/repair.json`);
  mkdirSync(path.dirname(manifest), { recursive: true });
  writeFileSync(
    manifest,
    JSON.stringify(
      {
        dataId: id,
        version,
        method:
          id === 'N08'
            ? 'Original UTF-8 Shapefile; one truncated note restored from same ZIP GML by unique identity'
            : id === 'C28'
              ? 'Original CP932 Shapefile; all four layers retained'
              : 'Original UTF-8 GeoJSON; official P04 property mapping; all 47 prefectures',
        sourceFeatureCount: outputs.reduce(
          (n, output) => n + output.featureCount,
          0
        ),
        outputs,
      },
      null,
      2
    ) + '\n'
  );
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
