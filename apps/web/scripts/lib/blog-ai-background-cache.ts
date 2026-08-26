import { randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

import type { ImageObjectStore } from '@stats47/r2-storage/image-pipeline';
import sharp, { type Metadata } from 'sharp';

import {
  BLOG_AI_BACKGROUND_CONTENT_TYPE,
  BLOG_AI_BACKGROUND_HEIGHT,
  BLOG_AI_BACKGROUND_WIDTH,
} from './blog-ai-background-normalizer';
import {
  adoptLegacyAiBackgroundSha256,
  blogImageKeys,
} from './blog-image-generation';
import { canonicalJson, sha256 } from './image-generation-manifest';

const CACHE_SCHEMA_VERSION = 1;
const CACHE_KIND = 'blog-ai-background';
const CACHE_R2_PREFIX = 'staging/image-cache/blog-ai-background/v1';
const CACHE_LOCAL_ROOT = '.local/image-cache/blog-ai-background/v1';
const CACHE_CONTROL = 'private, max-age=31536000, immutable';
const SHA_PATTERN = /^[0-9a-f]{64}$/;

export interface AiBackgroundCacheIdentity {
  prompt: string;
  promptHash: string;
  model: string;
  promptVersion: string;
  normalizerHash: string;
}

export interface AiBackgroundCacheEntry {
  fingerprint: string;
  sha256: string;
  buffer: Buffer;
  source: 'local-cache' | 'r2-cache' | 'generated';
}

export interface PublishedAiBackgroundDescriptor {
  promptHash: string;
  legacyPromptHash: string | null;
}

export type PublishedBackgroundState =
  | { source: 'missing' | 'brand'; reusable: null }
  | {
      source: 'ai';
      reusable: { buffer: Buffer; sha256: string } | null;
    };

export interface AiBackgroundCache {
  read(fingerprint: string): Promise<AiBackgroundCacheEntry | null>;
  write(fingerprint: string, buffer: Buffer): Promise<AiBackgroundCacheEntry>;
}

function validateFingerprint(fingerprint: string): void {
  if (!SHA_PATTERN.test(fingerprint)) {
    throw new Error('AI背景cache fingerprintが不正です');
  }
}

export function computeAiBackgroundCacheFingerprint(
  identity: AiBackgroundCacheIdentity
): string {
  if (!identity.prompt || !identity.model || !identity.promptVersion) {
    throw new Error('AI背景cache identityが不完全です');
  }
  if (!/^sha256-[0-9a-f]{64}$/.test(identity.promptHash)) {
    throw new Error('AI背景cache promptHashが不正です');
  }
  if (!SHA_PATTERN.test(identity.normalizerHash)) {
    throw new Error('AI背景cache normalizerHashが不正です');
  }
  return sha256(
    canonicalJson({
      schemaVersion: CACHE_SCHEMA_VERSION,
      kind: CACHE_KIND,
      prompt: identity.prompt,
      promptHash: identity.promptHash,
      model: identity.model,
      promptVersion: identity.promptVersion,
      normalizerHash: identity.normalizerHash,
      output: {
        contentType: BLOG_AI_BACKGROUND_CONTENT_TYPE,
        width: BLOG_AI_BACKGROUND_WIDTH,
        height: BLOG_AI_BACKGROUND_HEIGHT,
      },
    })
  );
}

export function aiBackgroundCacheKey(fingerprint: string): string {
  validateFingerprint(fingerprint);
  return `${CACHE_R2_PREFIX}/${fingerprint}.jpg`;
}

async function validateImageContract(
  buffer: Buffer,
  label: string
): Promise<void> {
  let metadata: Metadata;
  try {
    const image = sharp(buffer, { failOn: 'error' });
    metadata = await image.metadata();
    await image.clone().raw().toBuffer();
  } catch (error) {
    throw new Error(`AI背景JPEGをdecodeできません: ${label}: ${String(error)}`);
  }
  if (
    metadata.format !== 'jpeg' ||
    metadata.width !== BLOG_AI_BACKGROUND_WIDTH ||
    metadata.height !== BLOG_AI_BACKGROUND_HEIGHT
  ) {
    throw new Error(
      `AI背景画像契約が不正です: ${label} ` +
        `(expected=jpeg ${BLOG_AI_BACKGROUND_WIDTH}x${BLOG_AI_BACKGROUND_HEIGHT}, ` +
        `actual=${metadata.format ?? '?'} ${metadata.width ?? '?'}x${metadata.height ?? '?'})`
    );
  }
}

async function validateLocalEntry(
  fingerprint: string,
  buffer: Buffer,
  source: AiBackgroundCacheEntry['source']
): Promise<AiBackgroundCacheEntry> {
  validateFingerprint(fingerprint);
  if (buffer.byteLength === 0) {
    throw new Error(`AI背景cacheが空です: ${fingerprint}`);
  }
  await validateImageContract(buffer, `local:${fingerprint}`);
  return {
    fingerprint,
    sha256: sha256(buffer),
    buffer,
    source,
  };
}

function localCachePath(projectRoot: string, fingerprint: string): string {
  validateFingerprint(fingerprint);
  const root = resolve(projectRoot, CACHE_LOCAL_ROOT);
  const path = resolve(root, `${fingerprint}.jpg`);
  // ★区切り文字を直書きした前方一致にしない。Windows では resolve() が `\` を返すため
  //   常に不一致になり、正当な cache path まで弾く (2026-08-18 に 3 テストが赤だった)。
  const rel = relative(root, path);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('AI背景local cache pathが許可範囲外です');
  }
  return path;
}

async function writeLocalAtomically(
  projectRoot: string,
  fingerprint: string,
  buffer: Buffer
): Promise<AiBackgroundCacheEntry> {
  const path = localCachePath(projectRoot, fingerprint);
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) {
    return validateLocalEntry(fingerprint, readFileSync(path), 'local-cache');
  }
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  let descriptor: number | null = null;
  try {
    descriptor = openSync(temporaryPath, 'wx', 0o600);
    writeFileSync(descriptor, buffer);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    try {
      linkSync(temporaryPath, path);
    } catch (error) {
      if (!existsSync(path)) throw error;
    }
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
  return validateLocalEntry(fingerprint, readFileSync(path), 'local-cache');
}

async function validateRemoteCacheEntry(
  fingerprint: string,
  object: Awaited<ReturnType<ImageObjectStore['get']>>
): Promise<AiBackgroundCacheEntry | null> {
  if (!object) return null;
  const digest = sha256(object.body);
  if (
    object.contentType !== BLOG_AI_BACKGROUND_CONTENT_TYPE ||
    object.contentLength !== object.body.byteLength ||
    object.metadata['stats47-cache-kind'] !== CACHE_KIND ||
    object.metadata['stats47-cache-fingerprint'] !== fingerprint ||
    object.metadata['stats47-sha256'] !== digest
  ) {
    throw new Error(`R2 AI背景cache契約が不正です: ${fingerprint}`);
  }
  await validateImageContract(object.body, `r2-cache:${fingerprint}`);
  return {
    fingerprint,
    sha256: digest,
    buffer: object.body,
    source: 'r2-cache',
  };
}

export function createAiBackgroundCache(options: {
  projectRoot: string;
  store: ImageObjectStore | null;
}): AiBackgroundCache {
  const { projectRoot, store } = options;
  return {
    async read(fingerprint) {
      const path = localCachePath(projectRoot, fingerprint);
      if (existsSync(path)) {
        const local = await validateLocalEntry(
          fingerprint,
          readFileSync(path),
          'local-cache'
        );
        if (!store) return local;
        const key = aiBackgroundCacheKey(fingerprint);
        const remote = await validateRemoteCacheEntry(
          fingerprint,
          await store.get(key)
        );
        if (remote) {
          if (remote.sha256 !== local.sha256) {
            throw new Error(
              `local/R2 AI背景cacheのSHAが一致しません: ${fingerprint}`
            );
          }
          return local;
        }
        try {
          await store.put({
            key,
            body: local.buffer,
            contentType: BLOG_AI_BACKGROUND_CONTENT_TYPE,
            cacheControl: CACHE_CONTROL,
            metadata: {
              'stats47-cache-kind': CACHE_KIND,
              'stats47-cache-fingerprint': fingerprint,
              'stats47-sha256': local.sha256,
            },
            ifNoneMatch: '*',
          });
        } catch (error) {
          const raced = await validateRemoteCacheEntry(
            fingerprint,
            await store.get(key)
          );
          if (!raced) throw error;
          if (raced.sha256 !== local.sha256) {
            throw new Error(
              `local/R2 AI背景cacheの競合SHAが一致しません: ${fingerprint}`
            );
          }
        }
        const verified = await validateRemoteCacheEntry(
          fingerprint,
          await store.get(key)
        );
        if (!verified || verified.sha256 !== local.sha256) {
          throw new Error(`R2 AI背景cacheの移行確認に失敗しました: ${key}`);
        }
        return local;
      }
      if (!store) return null;
      const remote = await validateRemoteCacheEntry(
        fingerprint,
        await store.get(aiBackgroundCacheKey(fingerprint))
      );
      if (!remote) return null;
      const local = await writeLocalAtomically(
        projectRoot,
        fingerprint,
        remote.buffer
      );
      if (local.sha256 !== remote.sha256) {
        throw new Error(
          `local/R2 AI背景cacheのSHAが一致しません: ${fingerprint}`
        );
      }
      return remote;
    },

    async write(fingerprint, buffer) {
      validateFingerprint(fingerprint);
      const generated = await validateLocalEntry(
        fingerprint,
        buffer,
        'generated'
      );
      if (store) {
        const key = aiBackgroundCacheKey(fingerprint);
        try {
          await store.put({
            key,
            body: buffer,
            contentType: BLOG_AI_BACKGROUND_CONTENT_TYPE,
            cacheControl: CACHE_CONTROL,
            metadata: {
              'stats47-cache-kind': CACHE_KIND,
              'stats47-cache-fingerprint': fingerprint,
              'stats47-sha256': generated.sha256,
            },
            ifNoneMatch: '*',
          });
        } catch (error) {
          const existing = await validateRemoteCacheEntry(
            fingerprint,
            await store.get(key)
          );
          if (!existing) throw error;
          const local = await writeLocalAtomically(
            projectRoot,
            fingerprint,
            existing.buffer
          );
          if (local.sha256 !== existing.sha256) {
            throw new Error(
              `local/R2 AI背景cacheのSHAが一致しません: ${fingerprint}`
            );
          }
          return existing;
        }
        const verified = await validateRemoteCacheEntry(
          fingerprint,
          await store.get(key)
        );
        if (!verified) {
          throw new Error(`R2 AI背景cacheの保存確認に失敗しました: ${key}`);
        }
        const local = await writeLocalAtomically(
          projectRoot,
          fingerprint,
          verified.buffer
        );
        if (local.sha256 !== verified.sha256) {
          throw new Error(
            `local/R2 AI背景cacheのSHAが一致しません: ${fingerprint}`
          );
        }
        return { ...verified, source: 'generated' };
      }
      const local = await writeLocalAtomically(
        projectRoot,
        fingerprint,
        buffer
      );
      return { ...local, source: 'generated' };
    },
  };
}

export async function resolveCachedAiBackground(options: {
  cache: AiBackgroundCache;
  fingerprint: string;
  generate: () => Promise<Buffer>;
  normalize: (input: Buffer) => Promise<Buffer>;
}): Promise<AiBackgroundCacheEntry> {
  const cached = await options.cache.read(options.fingerprint);
  if (cached) return cached;
  const generated = await options.generate();
  const normalized = await options.normalize(generated);
  return options.cache.write(options.fingerprint, normalized);
}

function parseJsonObject(
  key: string,
  object: NonNullable<Awaited<ReturnType<ImageObjectStore['get']>>>,
  requireCommittedMetadata: boolean
): Record<string, unknown> {
  const digest = sha256(object.body);
  if (
    object.contentType !== 'application/json' ||
    object.contentLength !== object.body.byteLength ||
    (requireCommittedMetadata && object.metadata['stats47-sha256'] !== digest)
  ) {
    throw new Error(`R2 blog画像metadata契約が不正です: ${key}`);
  }
  try {
    const value = JSON.parse(object.body.toString('utf8')) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('JSON root is not an object');
    }
    return value as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `R2 blog画像metadata JSONが不正です: ${key}: ${String(error)}`
    );
  }
}

function backgroundRecord(value: Record<string, unknown>) {
  const metadata =
    value.metadata &&
    typeof value.metadata === 'object' &&
    !Array.isArray(value.metadata)
      ? (value.metadata as Record<string, unknown>)
      : value;
  const background = metadata.background;
  return background &&
    typeof background === 'object' &&
    !Array.isArray(background)
    ? (background as Record<string, unknown>)
    : null;
}

/**
 * 公開custom domainのHEAD metadataに依存せず、S3 GETが返すbody/metadata/ETagだけで
 * committed manifestと既存AI背景の再利用可否を検証する。
 */
export async function readPublishedBackgroundState(options: {
  store: ImageObjectStore;
  slug: string;
  descriptor: PublishedAiBackgroundDescriptor;
}): Promise<PublishedBackgroundState> {
  const keys = blogImageKeys(options.slug);
  const commonObject = await options.store.get(keys.manifest);
  let background: Record<string, unknown> | null;
  let source: 'common' | 'legacy';
  let backgroundAssetSha: string | null = null;

  if (commonObject) {
    const common = parseJsonObject(keys.manifest, commonObject, true);
    background = backgroundRecord(common);
    if (!background) {
      throw new Error(`${options.slug}: 共通manifestにbackgroundがありません`);
    }
    source = 'common';
    const assets = Array.isArray(common.assets) ? common.assets : [];
    const asset = assets.find(
      (candidate) =>
        candidate &&
        typeof candidate === 'object' &&
        (candidate as { key?: unknown }).key === keys.background
    ) as { sha256?: unknown } | undefined;
    backgroundAssetSha =
      typeof asset?.sha256 === 'string' ? asset.sha256 : null;
  } else {
    const legacyKey = `app/blog/${options.slug}/ogp/ogp.json`;
    const legacyObject = await options.store.get(legacyKey);
    if (!legacyObject) return { source: 'missing', reusable: null };
    background = backgroundRecord(
      parseJsonObject(legacyKey, legacyObject, false)
    );
    if (!background) return { source: 'brand', reusable: null };
    source = 'legacy';
  }

  if (background.source !== 'ai') {
    if (
      source === 'common' &&
      background.source !== 'brand' &&
      background.source !== 'shared'
    ) {
      throw new Error(
        `${options.slug}: 共通manifestのbackground sourceが不正です`
      );
    }
    return { source: 'brand', reusable: null };
  }
  if (typeof background.promptHash !== 'string') {
    throw new Error(`${options.slug}: AI背景のpromptHashがありません`);
  }
  if (
    source === 'common' &&
    (typeof background.sha256 !== 'string' ||
      !SHA_PATTERN.test(background.sha256) ||
      backgroundAssetSha !== background.sha256)
  ) {
    throw new Error(
      `${options.slug}: AI背景SHAが共通manifestのasset契約と一致しません`
    );
  }
  if (
    background.promptHash !== options.descriptor.promptHash &&
    background.promptHash !== options.descriptor.legacyPromptHash
  ) {
    return { source: 'ai', reusable: null };
  }

  const object = await options.store.get(keys.background);
  if (!object) {
    throw new Error(`${options.slug}: R2 AI背景画像がありません`);
  }
  const digest = sha256(object.body);
  const declaredSha =
    typeof background.sha256 === 'string'
      ? background.sha256
      : source === 'legacy'
        ? adoptLegacyAiBackgroundSha256(object.body, object.etag)
        : null;
  if (
    object.contentType !== BLOG_AI_BACKGROUND_CONTENT_TYPE ||
    object.contentLength !== object.body.byteLength ||
    declaredSha !== digest ||
    (source === 'common' &&
      (object.metadata['stats47-sha256'] !== digest ||
        object.metadata['stats47-manifest'] !== keys.manifest)) ||
    (object.metadata['stats47-sha256'] !== undefined &&
      object.metadata['stats47-sha256'] !== digest)
  ) {
    throw new Error(
      `${options.slug}: R2 AI背景画像契約がmanifestと一致しません`
    );
  }
  await validateImageContract(object.body, `published:${keys.background}`);
  return {
    source: 'ai',
    reusable: { buffer: object.body, sha256: digest },
  };
}
