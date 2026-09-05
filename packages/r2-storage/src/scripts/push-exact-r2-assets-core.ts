import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

import type { ImageObjectStore } from '../image-pipeline';
import { assertKsjPublicAssetsAllowed } from './lib/ksj-publication-guard';

const SHA256_METADATA_KEY = 'stats47-sha256';
const SIZE_METADATA_KEY = 'stats47-size';
const CONTENT_TYPE_METADATA_KEY = 'stats47-content-type';
const CONTENT_ENCODING_METADATA_KEY = 'stats47-content-encoding';
const CACHE_CONTROL = 'public, max-age=0, must-revalidate';

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.topojson': 'application/json',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
};

export interface ExactAssetSelection {
  keys: readonly string[];
  prefix: string | null;
  extensions: readonly string[];
}

export interface ExactAssetCandidate {
  key: string;
  absolutePath: string;
  body: Buffer;
  sha256: string;
  size: number;
  contentType: string;
  contentEncoding: string | null;
}

export interface ExactAssetPublishResult {
  candidates: number;
  changed: number;
  uploaded: number;
  skipped: number;
}

function isWithinDirectory(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    rel === '' ||
    (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
  );
}

export function validateR2Key(rawKey: string): string {
  const key = rawKey.trim().replace(/\/+$/, '');
  const segments = key.split('/');
  if (
    key.length === 0 ||
    key.startsWith('/') ||
    key.includes('\\') ||
    !/^[A-Za-z0-9._~/-]+$/.test(key) ||
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..'
    )
  ) {
    throw new Error(`安全でないR2 keyです: ${rawKey}`);
  }
  return key;
}

function normalizeExtension(rawExtension: string): string {
  const extension = rawExtension.trim().toLowerCase();
  const normalized = extension.startsWith('.') ? extension : `.${extension}`;
  if (!/^\.[a-z0-9]+$/.test(normalized) || !CONTENT_TYPES[normalized]) {
    throw new Error(`未対応の拡張子です: ${rawExtension}`);
  }
  return normalized;
}

export function validateNarrowPrefix(rawPrefix: string): string {
  const prefix = validateR2Key(rawPrefix);
  const segments = prefix.split('/');
  if (
    segments.length < 3 ||
    prefix === 'app/blog' ||
    prefix === 'sns/buzz-map'
  ) {
    throw new Error(`広すぎるprefixは使用できません: ${rawPrefix}`);
  }
  return prefix;
}

export function parseExactAssetArgs(args: readonly string[]): {
  selection: ExactAssetSelection;
  dryRun: boolean;
} {
  const keys: string[] = [];
  const extensions: string[] = [];
  let prefix: string | null = null;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    const [name, inlineValue] = arg.split('=', 2);
    if (name !== '--key' && name !== '--prefix' && name !== '--extension') {
      throw new Error(`不明な引数です: ${arg}`);
    }
    const value = inlineValue ?? args[++index];
    if (!value || value.startsWith('--')) {
      throw new Error(`${name} の値がありません`);
    }
    const values = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (values.length === 0) throw new Error(`${name} の値がありません`);
    if (name === '--key') {
      keys.push(...values.map(validateR2Key));
    } else if (name === '--prefix') {
      if (values.length !== 1 || prefix) {
        throw new Error('--prefixは1回だけ指定してください');
      }
      prefix = validateNarrowPrefix(values[0]);
    } else {
      extensions.push(...values.map(normalizeExtension));
    }
  }

  if (keys.length > 0 && (prefix || extensions.length > 0)) {
    throw new Error('--key と --prefix/--extension は併用できません');
  }
  if (keys.length === 0 && (!prefix || extensions.length === 0)) {
    throw new Error('--key、または --prefix と --extension が必要です');
  }

  return {
    selection: {
      keys: [...new Set(keys)].sort(),
      prefix,
      extensions: [...new Set(extensions)].sort(),
    },
    dryRun,
  };
}

function collectPrefixKeys(
  directory: string,
  stagingRoot: string,
  extensions: ReadonlySet<string>
): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(
        `symbolic linkはstagingに使用できません: ${absolutePath}`
      );
    }
    if (entry.isDirectory()) {
      result.push(...collectPrefixKeys(absolutePath, stagingRoot, extensions));
      continue;
    }
    if (!entry.isFile() || !extensions.has(extname(entry.name).toLowerCase()))
      continue;
    result.push(relative(stagingRoot, absolutePath).split(sep).join('/'));
  }
  return result;
}

function candidateForKey(
  stagingRoot: string,
  key: string
): ExactAssetCandidate {
  const absolutePath = resolve(stagingRoot, key);
  if (!isWithinDirectory(stagingRoot, absolutePath)) {
    throw new Error(`R2 key が .local/r2 外を指しています: ${key}`);
  }
  const entry = lstatSync(absolutePath);
  if (entry.isSymbolicLink() || !entry.isFile()) {
    throw new Error(`通常ファイルではありません: ${key}`);
  }
  const realPath = realpathSync(absolutePath);
  if (!isWithinDirectory(realpathSync(stagingRoot), realPath)) {
    throw new Error(`staging外のファイルは使用できません: ${key}`);
  }
  const extension = extname(key).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) throw new Error(`MIMEを判定できないファイルです: ${key}`);
  const sourceBody = readFileSync(realPath);
  const contentEncoding = extension === '.topojson' ? 'gzip' : null;
  const body = contentEncoding
    ? gzipSync(sourceBody, { level: 9 })
    : sourceBody;
  return {
    key,
    absolutePath: realPath,
    body,
    sha256: createHash('sha256').update(body).digest('hex'),
    size: body.byteLength,
    contentType,
    contentEncoding,
  };
}

export function resolveExactAssetCandidates(
  projectRoot: string,
  selection: ExactAssetSelection
): ExactAssetCandidate[] {
  const stagingRoot = resolve(projectRoot, '.local/r2');
  const stagingStat = lstatSync(stagingRoot);
  if (stagingStat.isSymbolicLink() || !stagingStat.isDirectory()) {
    throw new Error('.local/r2 は通常ディレクトリである必要があります');
  }

  let keys: string[];
  if (selection.keys.length > 0) {
    keys = [...selection.keys];
  } else {
    if (!selection.prefix || selection.extensions.length === 0) {
      throw new Error('prefix選択にはextensionが必要です');
    }
    const prefix = validateNarrowPrefix(selection.prefix);
    const directory = resolve(stagingRoot, prefix);
    if (!isWithinDirectory(stagingRoot, directory)) {
      throw new Error(`prefix が .local/r2 外を指しています: ${prefix}`);
    }
    const directoryStat = lstatSync(directory);
    if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
      throw new Error(`prefixがディレクトリではありません: ${prefix}`);
    }
    keys = collectPrefixKeys(
      directory,
      stagingRoot,
      new Set(selection.extensions.map(normalizeExtension))
    );
  }

  const candidates = [...new Set(keys)]
    .sort()
    .map((key) => candidateForKey(stagingRoot, validateR2Key(key)));
  if (candidates.length === 0) {
    throw new Error('publish対象ファイルが0件です');
  }
  return candidates;
}

function metadataFor(candidate: ExactAssetCandidate): Record<string, string> {
  return {
    [SHA256_METADATA_KEY]: candidate.sha256,
    [SIZE_METADATA_KEY]: String(candidate.size),
    [CONTENT_TYPE_METADATA_KEY]: candidate.contentType,
    [CONTENT_ENCODING_METADATA_KEY]: candidate.contentEncoding ?? 'identity',
  };
}

function remoteMatches(
  candidate: ExactAssetCandidate,
  remote: Awaited<ReturnType<ImageObjectStore['head']>>
): boolean {
  return (
    remote?.contentLength === candidate.size &&
    remote.contentType?.toLowerCase() === candidate.contentType.toLowerCase() &&
    (remote.contentEncoding?.toLowerCase() ?? null) ===
      candidate.contentEncoding &&
    remote.metadata[SHA256_METADATA_KEY] === candidate.sha256 &&
    remote.metadata[SIZE_METADATA_KEY] === String(candidate.size) &&
    remote.metadata[CONTENT_TYPE_METADATA_KEY]?.toLowerCase() ===
      candidate.contentType.toLowerCase() &&
    remote.metadata[CONTENT_ENCODING_METADATA_KEY] ===
      (candidate.contentEncoding ?? 'identity')
  );
}

export async function publishExactR2Assets(options: {
  candidates: readonly ExactAssetCandidate[];
  store: ImageObjectStore;
  dryRun: boolean;
}): Promise<ExactAssetPublishResult> {
  if (options.candidates.length === 0) {
    throw new Error('publish対象ファイルが0件です');
  }
  // 全候補を先に検査し、混在バッチの途中までPUTされることを防ぐ。
  const candidatesByKey = new Map(options.candidates.map((candidate) => [candidate.key, candidate]));
  assertKsjPublicAssetsAllowed([...candidatesByKey.keys()], (key) => {
    const candidate = candidatesByKey.get(key)!;
    return candidate.contentEncoding === 'gzip' ? gunzipSync(candidate.body) : candidate.body;
  });

  let uploaded = 0;
  let skipped = 0;
  let changed = 0;
  for (const candidate of options.candidates) {
    const before = await options.store.head(candidate.key);
    if (remoteMatches(candidate, before)) {
      skipped += 1;
      continue;
    }
    changed += 1;
    if (options.dryRun) continue;
    if (before && !before.etag) {
      throw new Error(`R2 HEADにETagがありません: ${candidate.key}`);
    }
    await options.store.put({
      key: candidate.key,
      body: candidate.body,
      contentType: candidate.contentType,
      ...(candidate.contentEncoding
        ? { contentEncoding: candidate.contentEncoding }
        : {}),
      cacheControl: CACHE_CONTROL,
      metadata: metadataFor(candidate),
      ...(before?.etag
        ? { ifMatch: before.etag }
        : { ifNoneMatch: '*' as const }),
    });
    const after = await options.store.head(candidate.key);
    if (!remoteMatches(candidate, after)) {
      throw new Error(`R2 PUT後のHEAD検証に失敗しました: ${candidate.key}`);
    }
    uploaded += 1;
  }

  return {
    candidates: options.candidates.length,
    changed,
    uploaded,
    skipped,
  };
}
