/** Rebuild the bounded source-page repairs from official ZIPs. */
import { createHash } from 'node:crypto';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import unzipper from 'unzipper';

import {
  convertGeoJsonFilesToTopoJson,
  parseKsjGeoJsonText,
} from '../converter';
import { GIS_DATASETS_BY_ID } from '../datasets';
import { cleanupTempFiles, extractGeoJson } from '../downloader';
import {
  discoverOfficialKsjArchives,
  type KsjOfficialArchive,
} from '../official-download-discovery';
import { PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS } from '../official-policy';
import { getCodeConfig } from '../registry';
import { getKsjLicensePolicy } from '../license-policy';

const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
export const SOURCE_REPAIR_VERSIONS: Readonly<Record<string, string>> = {
  L01: '26',
  L02: '25',
  W09: '05',
  A03: '03',
  A30a5: '11',
  A42: '18',
  A43: '18',
  A44: '18',
  P04: '20',
  C28: '07',
  N08: '21',
};

/** Only official HTTPS archives are accepted; local callers may provide already downloaded ZIPs. */
export async function downloadSourceArchive(
  url: string,
  destination: string
): Promise<void> {
  const parsed = new URL(url);
  if (
    parsed.origin !== 'https://nlftp.mlit.go.jp' ||
    !parsed.pathname.startsWith('/ksj/gml/data/') ||
    !parsed.pathname.endsWith('.zip')
  )
    throw new Error('Not an official KSJ archive URL');
  const response = await fetch(url, { signal: AbortSignal.timeout(600_000) });
  if (!response.ok || !response.body)
    throw new Error(`Official download failed: ${response.status} ${url}`);
  mkdirSync(path.dirname(destination), { recursive: true });
  await pipeline(
    Readable.fromWeb(response.body as import('node:stream/web').ReadableStream),
    createWriteStream(destination)
  );
}

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

export async function rebuildSourcePageData(options: {
  id: string;
  sourceDir: string;
  download?: boolean;
}) {
  const { id, sourceDir } = options;
  const version = SOURCE_REPAIR_VERSIONS[id];
  const meta = GIS_DATASETS_BY_ID.get(id);
  if (
    !version ||
    !meta ||
    meta.latestVersion !== version ||
    getKsjLicensePolicy(meta.license).sourcePublication !== 'public-r2-eligible'
  )
    throw new Error(
      'Source version or publication policy changed; review before rebuilding'
    );
  const localRoot = path.resolve('.local/r2');
  const outputs: Output[] = [];
  const sources: {
    url: string;
    sha256: string;
    scope: string;
    datum: string;
    featureCount: number;
  }[] = [];
  let archives: Pick<
    KsjOfficialArchive,
    'filename' | 'url' | 'scope' | 'datum' | 'version'
  >[];
  if (['A03', 'A30a5', 'A42', 'A43', 'A44'].includes(id)) {
    if (!meta.sourcePageUrl) throw new Error('Missing official source page');
    archives = await discoverOfficialKsjArchives({
      dataId: id,
      sourcePageUrl: meta.sourcePageUrl,
    });
    if (
      archives.length !== PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.get(id) ||
      archives.some((a) => a.version !== version)
    )
      throw new Error(`Official archive count/edition changed: ${id}`);
  } else {
    const scopes =
      id === 'P04'
        ? Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0'))
        : ['national'];
    archives = scopes.map((scope) => {
      const filename = `${id}-${version}${scope === 'national' ? '' : `_${scope}`}_GML.zip`;
      return {
        filename,
        scope,
        datum: 'jgd',
        version,
        url: `https://nlftp.mlit.go.jp/ksj/gml/data/${id}/${id}-${version}/${filename}`,
      };
    });
  }
  if (new Set(archives.map((a) => a.scope)).size !== archives.length)
    throw new Error('Duplicate official scopes');
  for (const archive of archives) {
    const { scope, url: sourceUrl } = archive;
    if (path.basename(archive.filename) !== archive.filename)
      throw new Error('Unsafe archive filename');
    const zipFile = path.resolve(sourceDir, archive.filename);
    if (options.download) await downloadSourceArchive(sourceUrl, zipFile);
    if (!existsSync(zipFile))
      throw new Error(`Missing official ZIP: ${zipFile}`);
    const sourceSha256 = sha(readFileSync(zipFile));
    const files = await extractGeoJson(
      zipFile,
      'UTF-8/',
      ['C28', 'W09', 'A03', 'A30a5', 'A42', 'A43', 'A44'].includes(id)
        ? 'shift-jis'
        : id === 'N08'
          ? 'utf-8'
          : undefined
    );
    if (id === 'N08') await restoreAirportNote(zipFile, files);
    const groups = ['C28', 'A03', 'A42'].includes(id)
      ? files.map((file) => [file])
      : [files];
    let sourceCount = 0;
    for (const inputs of groups) {
      const expected = inputs.reduce(
        (n, file) =>
          n + parseKsjGeoJsonText(readFileSync(file, 'utf8')).features.length,
        0
      );
      sourceCount += expected;
      const simplifyOptions = getCodeConfig(id)?.simplifyOptions ?? {
        quantize: meta.geometryType === 'mesh' ? 10000 : 100000,
        simplifyQuantile: meta.geometryType === 'mesh' ? 0.02 : 0.01,
      };
      const result = convertGeoJsonFilesToTopoJson(
        inputs,
        id,
        ['P04', 'C28', 'N08'].includes(id)
          ? { quantize: 1000000, simplifyQuantile: 0 }
          : simplifyOptions,
        archive.datum
      );
      if (
        result.featureCount !== expected ||
        JSON.stringify(result.topology.objects).includes('\ufffd')
      )
        throw new Error(`Source integrity failed: ${id}/${scope}`);
      const basename = path.basename(inputs[0], '.geojson');
      const filename =
        id === 'C28'
          ? basename
          : ['A03', 'A42'].includes(id)
            ? `${scope}/${basename}`
            : id === 'P04'
              ? scope
              : ['L01', 'L02', 'W09'].includes(id)
                ? 'national'
                : `${scope}/data`;
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
    const knownCount: Record<string, number> = {
      L01: 25565,
      L02: 21431,
      W09: 556,
    };
    if (knownCount[id] !== undefined && sourceCount !== knownCount[id])
      throw new Error(`Original feature count changed: ${id}`);
    sources.push({
      url: sourceUrl,
      sha256: sourceSha256,
      scope,
      datum: archive.datum,
      featureCount: sourceCount,
    });
    if (options.download) cleanupTempFiles(zipFile);
  }
  if (new Set(outputs.map((o) => o.key)).size !== outputs.length)
    throw new Error('Duplicate repair keys');
  const manifest = path.join(localRoot, `app/geo/datasets/${id}/repair.json`);
  mkdirSync(path.dirname(manifest), { recursive: true });
  writeFileSync(
    manifest,
    JSON.stringify(
      {
        schemaVersion: 1,
        dataId: id,
        version,
        sources,
        method:
          id === 'N08'
            ? 'Original UTF-8 Shapefile; one truncated note restored from same ZIP GML by unique identity'
            : id === 'C28'
              ? 'Original CP932 Shapefile; all four layers retained'
              : 'Official GeoJSON or explicit CP932 Shapefile; source datum converted to WGS84; all source features retained; registry property mapping and simplification',
        sourceFeatureCount: sources.reduce(
          (n, source) => n + source.featureCount,
          0
        ),
        outputs,
      },
      null,
      2
    ) + '\n'
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const arg = (name: string) => process.argv[process.argv.indexOf(name) + 1];
  if (
    !process.argv.includes('--data-id') ||
    !process.argv.includes('--source-dir')
  )
    throw new Error('--data-id and --source-dir are required');
  rebuildSourcePageData({
    id: arg('--data-id'),
    sourceDir: arg('--source-dir'),
    download: process.argv.includes('--download'),
  }).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
