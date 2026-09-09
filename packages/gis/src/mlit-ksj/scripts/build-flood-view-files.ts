/** Split verified flood polygons into browser-sized files without changing geometry or attributes. */
import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { gzipSync } from 'node:zlib';
import unzipper from 'unzipper';
import {
  FLOOD_ARCHIVES,
  FLOOD_SOURCE_PAGE,
} from '../../geo-analysis/flood-inputs';
import { readFeatureJson } from '../../geo-analysis/read-feature-json';

async function main() {
  const base = process.env.R2_PUBLIC_FETCH_URL ?? 'http://127.0.0.1:4777';
  const root = path.resolve('.local/r2');
  const temp = path.join(os.tmpdir(), 'stats47-flood-view');
  mkdirSync(temp, { recursive: true });
  const manifest = await (
    await fetch(`${base}/app/geo/population-flood-risk/manifest.json`)
  ).json();
  const sourceOutputs = manifest.stages.flatMap(
    (stage: { outputs: unknown[] }) => stage.outputs
  ) as { key: string; sha256: string; recordCount: number }[];
  const assets: {
    key: string;
    label: string;
    bytes: number;
    sha256: string;
    recordCount: number;
    sourceKey: string;
    sourceSha256: string;
  }[] = [];
  async function digest(file: string) {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    return hash.digest('hex');
  }
  async function processSource(
    index: number,
    source: (typeof FLOOD_ARCHIVES)[number]
  ) {
    const expected = sourceOutputs.find((output) => output.key === source.key);
    if (!expected) throw Error(`Missing source evidence ${source.key}`);
    const cache = path.join(
      temp,
      `${source.riverClass}-${source.meshCode}.zip`
    );
    const marker = path.join(
      temp,
      `${source.riverClass}-${source.meshCode}.json`
    );
    if (existsSync(marker)) {
      const previous = JSON.parse(readFileSync(marker, 'utf8'));
      let reusable =
        previous.sourceSha256 === expected.sha256 &&
        Array.isArray(previous.assets) &&
        previous.assets.reduce(
          (sum: number, a: { recordCount: number }) => sum + a.recordCount,
          0
        ) === expected.recordCount;
      if (reusable) {
        for (const asset of previous.assets) {
          const file = path.resolve(root, asset.key);
          if (
            !file.startsWith(
              path.resolve(root, 'gis/mlit-ksj/A31b/25/display') + path.sep
            ) ||
            asset.sourceKey !== source.key ||
            asset.sourceSha256 !== expected.sha256 ||
            !existsSync(file) ||
            (await digest(file)) !== asset.sha256
          ) {
            reusable = false;
            break;
          }
        }
      }
      if (reusable) {
        assets.push(...previous.assets);
        console.log(
          `${index + 1}/${FLOOD_ARCHIVES.length} cached ${source.meshCode}`
        );
        return;
      }
    }
    if (existsSync(cache) && (await digest(cache)) !== expected.sha256) {
      if (path.dirname(path.resolve(cache)) !== path.resolve(temp))
        throw Error('Unsafe cache path');
      unlinkSync(cache);
    }
    if (!existsSync(cache)) {
      const response = await fetch(`${base}/${source.key}`);
      if (!response.ok || !response.body)
        throw Error(`Download failed ${source.key}`);
      await pipeline(
        Readable.fromWeb(
          response.body as import('node:stream/web').ReadableStream
        ),
        createWriteStream(`${cache}.partial`)
      );
      renameSync(`${cache}.partial`, cache);
    }
    if ((await digest(cache)) !== expected.sha256)
      throw Error(`Source SHA mismatch ${source.key}`);
    const zip = await unzipper.Open.file(cache);
    const entry = zip.files.find((file: { path: string }) =>
      file.path.endsWith(source.entrySuffix)
    );
    if (!entry) throw Error(`Missing entry ${source.entrySuffix}`);
    const parts: typeof assets = [];
    let values: string[] = [];
    let bytes = 0;
    let part = 0;
    const flush = () => {
      if (!values.length) return;
      part++;
      const key = `gis/mlit-ksj/A31b/25/display/${source.riverClass}/${source.meshCode}/${String(part).padStart(4, '0')}.geojson`;
      const body = Buffer.from(
        `{"type":"FeatureCollection","features":[${values.join(',')}]}`
      );
      const compressed = gzipSync(body);
      const out = path.join(root, key);
      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, compressed);
      parts.push({
        key,
        label: `1次メッシュ ${source.meshCode}・河川区分${source.riverClass}・想定最大規模・表示分割${part}`,
        bytes: compressed.length,
        sha256: createHash('sha256').update(compressed).digest('hex'),
        recordCount: values.length,
        sourceKey: source.key,
        sourceSha256: expected.sha256,
      });
      values = [];
      bytes = 0;
    };
    const count = await readFeatureJson(entry.stream(), (value) => {
      if (bytes + value.length > 2_000_000 || values.length >= 1000) flush();
      values.push(value);
      bytes += value.length;
    });
    flush();
    if (
      count !== expected.recordCount ||
      parts.reduce((sum, p) => sum + p.recordCount, 0) !== count
    )
      throw Error(`Feature conservation failed ${source.key}`);
    assets.push(...parts);
    writeFileSync(
      marker,
      JSON.stringify({ sourceSha256: expected.sha256, assets: parts })
    );
    console.log(
      `${index + 1}/${FLOOD_ARCHIVES.length} ${source.riverClass}/${source.meshCode} features=${count} parts=${parts.length}`
    );
  }
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (cursor < FLOOD_ARCHIVES.length) {
        const index = cursor++;
        await processSource(index, FLOOD_ARCHIVES[index]);
      }
    })
  );
  assets.sort((a, b) => a.key.localeCompare(b.key));
  const out = path.join(root, 'app/geo/datasets/A31b/manifest.json');
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify({
      schemaVersion: 1,
      dataId: 'A31b',
      version: '25',
      sourceUrl: FLOOD_SOURCE_PAGE,
      generatedAt: new Date().toISOString(),
      sourceCount: FLOOD_ARCHIVES.length,
      assets,
    })
  );
  console.log(`COMPLETE ${assets.length} view files; ${out}`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
