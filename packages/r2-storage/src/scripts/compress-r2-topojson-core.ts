import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';

import type { ImageObjectStore } from '../image-pipeline';

const CACHE_CONTROL = 'public, max-age=0, must-revalidate';
const CONTENT_TYPE = 'application/json';
const SHA256_METADATA_KEY = 'stats47-sha256';
const SIZE_METADATA_KEY = 'stats47-size';
const CONTENT_TYPE_METADATA_KEY = 'stats47-content-type';
const CONTENT_ENCODING_METADATA_KEY = 'stats47-content-encoding';

export interface TopoJsonCompressionResult {
  key: string;
  status: 'compressed' | 'would-compress' | 'skipped';
  beforeBytes: number;
  afterBytes: number;
}

function assertTopoJsonKey(key: string): void {
  if (!key.startsWith('gis/mlit-ksj/') || !key.endsWith('.topojson')) {
    throw new Error(`KSJ TopoJSON以外は圧縮できません: ${key}`);
  }
}

function assertTopology(body: Buffer, key: string): void {
  const prefix = body.subarray(0, Math.min(body.byteLength, 1024)).toString('utf8');
  if (!/^\s*\{/.test(prefix) || !/"type"\s*:\s*"Topology"/.test(prefix)) {
    throw new Error(`TopoJSONとして検証できません: ${key}`);
  }
}

function metadataFor(
  previous: Record<string, string>,
  compressed: Buffer
): Record<string, string> {
  return {
    ...previous,
    [SHA256_METADATA_KEY]: createHash('sha256').update(compressed).digest('hex'),
    [SIZE_METADATA_KEY]: String(compressed.byteLength),
    [CONTENT_TYPE_METADATA_KEY]: CONTENT_TYPE,
    [CONTENT_ENCODING_METADATA_KEY]: 'gzip',
  };
}

function isVerifiedCompressed(
  remote: Awaited<ReturnType<ImageObjectStore['head']>>,
  compressed: Buffer,
  metadata: Record<string, string>
): boolean {
  return (
    remote?.contentEncoding?.toLowerCase() === 'gzip' &&
    remote.contentLength === compressed.byteLength &&
    remote.contentType?.toLowerCase() === CONTENT_TYPE &&
    remote.metadata[SHA256_METADATA_KEY] === metadata[SHA256_METADATA_KEY] &&
    remote.metadata[SIZE_METADATA_KEY] === metadata[SIZE_METADATA_KEY] &&
    remote.metadata[CONTENT_ENCODING_METADATA_KEY] === 'gzip'
  );
}

export async function compressR2TopoJsonObject(options: {
  key: string;
  store: ImageObjectStore;
  dryRun: boolean;
}): Promise<TopoJsonCompressionResult> {
  const { key, store, dryRun } = options;
  assertTopoJsonKey(key);
  const before = await store.head(key);
  if (!before) throw new Error(`R2 objectが見つかりません: ${key}`);
  if (before.contentEncoding?.toLowerCase() === 'gzip') {
    return {
      key,
      status: 'skipped',
      beforeBytes: before.contentLength ?? 0,
      afterBytes: before.contentLength ?? 0,
    };
  }
  if (before.contentEncoding && before.contentEncoding !== 'identity') {
    throw new Error(`未対応のContent-Encodingです: ${key} (${before.contentEncoding})`);
  }
  if (!before.etag) throw new Error(`R2 HEADにETagがありません: ${key}`);

  const source = await store.get(key);
  if (!source) throw new Error(`R2 objectが取得できません: ${key}`);
  if (source.etag !== before.etag) {
    throw new Error(`取得中にR2 objectが更新されました: ${key}`);
  }
  assertTopology(source.body, key);
  const compressed = gzipSync(source.body, { level: 9 });
  gunzipSync(compressed);
  const metadata = metadataFor(before.metadata, compressed);

  if (dryRun) {
    return {
      key,
      status: 'would-compress',
      beforeBytes: source.body.byteLength,
      afterBytes: compressed.byteLength,
    };
  }

  await store.put({
    key,
    body: compressed,
    contentType: CONTENT_TYPE,
    contentEncoding: 'gzip',
    cacheControl: CACHE_CONTROL,
    metadata,
    ifMatch: before.etag,
  });
  const after = await store.head(key);
  if (!isVerifiedCompressed(after, compressed, metadata)) {
    throw new Error(`圧縮後のHEAD検証に失敗しました: ${key}`);
  }
  return {
    key,
    status: 'compressed',
    beforeBytes: source.body.byteLength,
    afterBytes: compressed.byteLength,
  };
}
