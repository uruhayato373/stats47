import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  IMAGE_GENERATION_MANIFEST_KIND,
  IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION,
  IMAGE_GENERATION_PUBLISH_PLAN_KIND,
  IMAGE_GENERATION_PUBLISH_PLAN_SCHEMA_VERSION,
  type ImageGenerationAsset,
  type ImageGenerationManifest,
  type ImageGenerationPublishPlan,
} from '@stats47/types';

export interface ImageAssetContract {
  key: string;
  variant: string;
  contentType: `image/${string}`;
  width: number;
  height: number;
}

export interface ImageGenerationPlan {
  generator: string;
  entityId: string;
  manifestKey: string;
  inputHash: string;
  rendererHash: string;
  fingerprint: string;
  assets: ImageAssetContract[];
}

export type ImageGenerationStatus = (
  | { isCurrent: true; reason: 'current'; remoteFingerprint: string }
  | {
      isCurrent: false;
      reason:
        | 'manifest-missing'
        | 'manifest-invalid'
        | 'fingerprint-changed'
        | 'asset-contract-changed'
        | 'asset-missing'
        | 'probe-error';
      remoteFingerprint: string | null;
    }
) & { remoteManifestSha256: string | null };

const IMAGE_REPAIR_REASON_PRIORITY: Record<
  ImageGenerationStatus['reason'],
  number
> = {
  'manifest-missing': 0,
  'asset-missing': 1,
  'manifest-invalid': 2,
  'asset-contract-changed': 3,
  'fingerprint-changed': 4,
  current: 5,
  'probe-error': 6,
};

/**
 * A bounded repair batch must restore missing public assets before migrating
 * stale legacy manifests. The entity id tie-break keeps repeated runs stable.
 */
export function prioritizeChangedImageCandidates<T extends { id: string }>(
  changed: readonly { item: T; status: ImageGenerationStatus }[]
): Array<{ item: T; status: ImageGenerationStatus }> {
  return [...changed].sort(
    (a, b) =>
      IMAGE_REPAIR_REASON_PRIORITY[a.status.reason] -
        IMAGE_REPAIR_REASON_PRIORITY[b.status.reason] ||
      a.item.id.localeCompare(b.item.id)
  );
}

function canonicalize(value: unknown, active = new WeakSet<object>()): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new Error('画像生成入力に有限でない数値は使えません');
    return value;
  }
  if (Array.isArray(value)) {
    if (active.has(value))
      throw new Error('画像生成入力に循環参照は使えません');
    active.add(value);
    const result = value.map((item) => canonicalize(item, active));
    active.delete(value);
    return result;
  }
  if (typeof value === 'object') {
    if (
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    ) {
      throw new Error('画像生成入力は plain object で指定してください');
    }
    if (active.has(value))
      throw new Error('画像生成入力に循環参照は使えません');
    active.add(value);
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .map((key) => [key, canonicalize(record[key], active)] as const);
    active.delete(value);
    return Object.fromEntries(entries);
  }
  throw new Error(`画像生成入力に未対応の型です: ${typeof value}`);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * renderer の git source / topology / font / dependency package.json をまとめて指紋化する。
 * 呼び出し側の registry が依存ファイルを SSOT として列挙する。
 */
export function calculateRendererHash(
  projectRoot: string,
  sourcePaths: readonly string[]
): string {
  const hash = createHash('sha256');
  for (const sourcePath of [...new Set(sourcePaths)].sort()) {
    const absolutePath = resolve(projectRoot, sourcePath);
    const contents = readFileSync(absolutePath);
    hash.update(sourcePath);
    hash.update('\0');
    hash.update(contents);
    hash.update('\0');
  }
  return hash.digest('hex');
}

export function createImageGenerationPlan(options: {
  generator: string;
  entityId: string;
  manifestKey: string;
  input: unknown;
  rendererHash: string;
  assets: ImageAssetContract[];
}): ImageGenerationPlan {
  const inputHash = sha256(canonicalJson(options.input));
  const assets = [...options.assets].sort((a, b) => a.key.localeCompare(b.key));
  const fingerprint = sha256(
    canonicalJson({
      schemaVersion: IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION,
      generator: options.generator,
      entityId: options.entityId,
      inputHash,
      rendererHash: options.rendererHash,
      assets,
    })
  );
  return {
    generator: options.generator,
    entityId: options.entityId,
    manifestKey: options.manifestKey,
    inputHash,
    rendererHash: options.rendererHash,
    fingerprint,
    assets,
  };
}

function isManifestAsset(value: unknown): value is ImageGenerationAsset {
  if (!value || typeof value !== 'object') return false;
  const asset = value as Partial<ImageGenerationAsset>;
  return (
    typeof asset.key === 'string' &&
    asset.key.length > 0 &&
    !asset.key.startsWith('/') &&
    !asset.key.split('/').includes('..') &&
    typeof asset.variant === 'string' &&
    asset.variant.length > 0 &&
    typeof asset.contentType === 'string' &&
    /^image\/[a-z0-9.+-]+$/.test(asset.contentType) &&
    Number.isSafeInteger(asset.width) &&
    (asset.width ?? 0) > 0 &&
    Number.isSafeInteger(asset.height) &&
    (asset.height ?? 0) > 0 &&
    Number.isSafeInteger(asset.bytes) &&
    (asset.bytes ?? 0) > 0 &&
    typeof asset.sha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(asset.sha256)
  );
}

function isManifest(value: unknown): value is ImageGenerationManifest<unknown> {
  if (!value || typeof value !== 'object') return false;
  const manifest = value as Partial<ImageGenerationManifest<unknown>>;
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  return (
    manifest.kind === IMAGE_GENERATION_MANIFEST_KIND &&
    manifest.schemaVersion === IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION &&
    typeof manifest.generator === 'string' &&
    manifest.generator.length > 0 &&
    typeof manifest.entityId === 'string' &&
    manifest.entityId.length > 0 &&
    typeof manifest.inputHash === 'string' &&
    /^[0-9a-f]{64}$/.test(manifest.inputHash) &&
    typeof manifest.rendererHash === 'string' &&
    /^[0-9a-f]{64}$/.test(manifest.rendererHash) &&
    typeof manifest.fingerprint === 'string' &&
    /^[0-9a-f]{64}$/.test(manifest.fingerprint) &&
    typeof manifest.generatedAt === 'string' &&
    'metadata' in manifest &&
    assets.length > 0 &&
    assets.every(isManifestAsset) &&
    new Set(assets.map((asset) => asset.key)).size === assets.length
  );
}

export function compareImageGenerationManifest(
  value: unknown,
  plan: ImageGenerationPlan,
  remoteManifestSha256: string | null = null
): ImageGenerationStatus {
  const remoteFingerprint =
    value &&
    typeof value === 'object' &&
    typeof (value as { fingerprint?: unknown }).fingerprint === 'string'
      ? (value as { fingerprint: string }).fingerprint
      : null;
  if (!isManifest(value)) {
    return {
      isCurrent: false,
      reason: 'manifest-invalid',
      remoteFingerprint,
      remoteManifestSha256,
    };
  }
  if (
    value.generator !== plan.generator ||
    value.entityId !== plan.entityId ||
    value.inputHash !== plan.inputHash ||
    value.rendererHash !== plan.rendererHash
  ) {
    return {
      isCurrent: false,
      reason: 'manifest-invalid',
      remoteFingerprint: value.fingerprint,
      remoteManifestSha256,
    };
  }
  if (value.fingerprint !== plan.fingerprint) {
    return {
      isCurrent: false,
      reason: 'fingerprint-changed',
      remoteFingerprint: value.fingerprint,
      remoteManifestSha256,
    };
  }
  const actual = value.assets
    .map(({ key, variant, contentType, width, height }) => ({
      key,
      variant,
      contentType,
      width,
      height,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
  if (canonicalJson(actual) !== canonicalJson(plan.assets)) {
    return {
      isCurrent: false,
      reason: 'asset-contract-changed',
      remoteFingerprint: value.fingerprint,
      remoteManifestSha256,
    };
  }
  return {
    isCurrent: true,
    reason: 'current',
    remoteFingerprint: value.fingerprint,
    remoteManifestSha256,
  };
}

export async function inspectRemoteImageGeneration(
  publicUrl: string,
  plan: ImageGenerationPlan,
  fetchImpl: typeof fetch = fetch
): Promise<ImageGenerationStatus> {
  let response: Response;
  try {
    const manifestUrl = new URL(`${publicUrl}/${plan.manifestKey}`);
    manifestUrl.searchParams.set('stats47-fingerprint', plan.fingerprint);
    response = await fetchImpl(manifestUrl, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return {
      isCurrent: false,
      reason: 'probe-error',
      remoteFingerprint: null,
      remoteManifestSha256: null,
    };
  }
  if (response.status === 404) {
    return {
      isCurrent: false,
      reason: 'manifest-missing',
      remoteFingerprint: null,
      remoteManifestSha256: null,
    };
  }
  if (!response.ok) {
    return {
      isCurrent: false,
      reason: 'probe-error',
      remoteFingerprint: null,
      remoteManifestSha256: null,
    };
  }

  let manifestBody: Buffer;
  let manifest: unknown;
  try {
    manifestBody = Buffer.from(await response.arrayBuffer());
    manifest = JSON.parse(manifestBody.toString('utf8')) as unknown;
  } catch {
    return {
      isCurrent: false,
      reason: 'manifest-invalid',
      remoteFingerprint: null,
      remoteManifestSha256: null,
    };
  }
  const remoteManifestSha256 = sha256(manifestBody);
  const compared = compareImageGenerationManifest(
    manifest,
    plan,
    remoteManifestSha256
  );
  if (!compared.isCurrent) return compared;

  const typedManifest = manifest as ImageGenerationManifest<unknown>;
  const manifestAssets = new Map(
    typedManifest.assets.map((asset) => [asset.key, asset])
  );
  const checks = await Promise.all(
    plan.assets.map(async (asset): Promise<'ok' | 'missing' | 'error'> => {
      try {
        const assetUrl = new URL(`${publicUrl}/${asset.key}`);
        const declaredAsset = manifestAssets.get(asset.key);
        if (!declaredAsset) return 'missing';
        assetUrl.searchParams.set('stats47-sha256', declaredAsset.sha256);
        const head = await fetchImpl(assetUrl, {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(15_000),
        });
        if (head.status === 404) return 'missing';
        if (!head.ok) return 'error';
        const contentType = (head.headers.get('content-type') ?? '').split(
          ';'
        )[0];
        if (contentType !== asset.contentType) return 'missing';
        const contentLength = head.headers.get('content-length');
        const expectedBytes = declaredAsset.bytes;
        if (contentLength === null || expectedBytes !== Number(contentLength))
          return 'missing';
        const remoteSha256 = head.headers.get('x-amz-meta-stats47-sha256');
        if (remoteSha256 !== null) {
          return remoteSha256 === declaredAsset.sha256 ? 'ok' : 'missing';
        }

        // R2 custom domains do not consistently expose x-amz-meta-* headers.
        // In that case, verify the public bytes instead of treating every
        // otherwise-current asset as stale.
        const assetResponse = await fetchImpl(assetUrl, {
          headers: { accept: asset.contentType },
          cache: 'no-store',
          signal: AbortSignal.timeout(15_000),
        });
        if (assetResponse.status === 404) return 'missing';
        if (!assetResponse.ok) return 'error';
        const responseContentType = (
          assetResponse.headers.get('content-type') ?? ''
        ).split(';')[0];
        if (responseContentType !== asset.contentType) return 'missing';
        const body = Buffer.from(await assetResponse.arrayBuffer());
        if (
          body.byteLength !== expectedBytes ||
          sha256(body) !== declaredAsset.sha256
        ) {
          return 'missing';
        }
        return 'ok';
      } catch {
        return 'error';
      }
    })
  );
  if (checks.some((status) => status === 'error')) {
    return {
      isCurrent: false,
      reason: 'probe-error',
      remoteFingerprint: typedManifest.fingerprint,
      remoteManifestSha256,
    };
  }
  return checks.every((status) => status === 'ok')
    ? {
        isCurrent: true,
        reason: 'current',
        remoteFingerprint: typedManifest.fingerprint,
        remoteManifestSha256,
      }
    : {
        isCurrent: false,
        reason: 'asset-missing',
        remoteFingerprint: typedManifest.fingerprint,
        remoteManifestSha256,
      };
}

export function buildImageGenerationManifest<TMetadata>(options: {
  plan: ImageGenerationPlan;
  assetFiles: ReadonlyMap<string, string>;
  metadata: TMetadata;
  generatedAt?: string;
}): ImageGenerationManifest<TMetadata> {
  const assets: ImageGenerationAsset[] = options.plan.assets.map((asset) => {
    const filePath = options.assetFiles.get(asset.key);
    if (!filePath)
      throw new Error(`生成画像のローカルパスがありません: ${asset.key}`);
    const contents = readFileSync(filePath);
    return {
      ...asset,
      bytes: contents.byteLength,
      sha256: sha256(contents),
    };
  });
  return {
    kind: IMAGE_GENERATION_MANIFEST_KIND,
    schemaVersion: IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION,
    generator: options.plan.generator,
    entityId: options.plan.entityId,
    inputHash: options.plan.inputHash,
    rendererHash: options.plan.rendererHash,
    fingerprint: options.plan.fingerprint,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    assets,
    metadata: options.metadata,
  };
}

export function serializeImageGenerationManifest(
  manifest: ImageGenerationManifest<unknown>
): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function createImageGenerationPublishPlan(options: {
  generator: string;
  stageRoot: string;
  items: Array<{
    plan: ImageGenerationPlan;
    manifest: ImageGenerationManifest<unknown>;
    expectedRemoteFingerprint: string | null;
    expectedRemoteManifestSha256: string | null;
  }>;
  createdAt?: string;
}): ImageGenerationPublishPlan {
  if (!/^\.local\/image-staging\/[a-z0-9-]+$/.test(options.stageRoot)) {
    throw new Error(`画像 staging root が許可範囲外です: ${options.stageRoot}`);
  }
  return {
    kind: IMAGE_GENERATION_PUBLISH_PLAN_KIND,
    schemaVersion: IMAGE_GENERATION_PUBLISH_PLAN_SCHEMA_VERSION,
    generator: options.generator,
    stageRoot: options.stageRoot,
    createdAt: options.createdAt ?? new Date().toISOString(),
    items: options.items.map(
      ({
        plan,
        manifest,
        expectedRemoteFingerprint,
        expectedRemoteManifestSha256,
      }) => {
        if (
          plan.generator !== options.generator ||
          manifest.generator !== options.generator
        ) {
          throw new Error(
            `publish plan のgeneratorが一致しません: ${plan.manifestKey}`
          );
        }
        const compared = compareImageGenerationManifest(manifest, plan);
        if (!compared.isCurrent) {
          throw new Error(
            `publish plan の manifest が生成計画と一致しません: ${plan.manifestKey}`
          );
        }
        return {
          entityId: plan.entityId,
          manifestKey: plan.manifestKey,
          fingerprint: plan.fingerprint,
          manifestSha256: sha256(serializeImageGenerationManifest(manifest)),
          assets: [...manifest.assets].sort((a, b) =>
            a.key.localeCompare(b.key)
          ),
          expectedRemoteManifestSha256,
          expectedRemoteFingerprint,
        };
      }
    ),
  };
}

/**
 * changed 候補にだけ limit を適用する。候補列挙前に limit しないため、
 * 反映済み bundle が次回 current になれば後続 batch が必ず前へ進む。
 */
export function selectChangedImageBatch<T>(
  changed: readonly T[],
  options: { limit: number | null; maxGenerate: number | null }
): { targets: T[]; remaining: number } {
  const targets = changed.slice(0, options.limit ?? changed.length);
  if (options.maxGenerate !== null && targets.length > options.maxGenerate) {
    throw new Error(
      `生成対象 ${targets.length} 件が安全上限 ${options.maxGenerate} 件を超えています。` +
        ' 一部だけ暗黙反映せず、--limit または明示 key で分割してください。'
    );
  }
  return {
    targets,
    remaining: changed.length - targets.length,
  };
}
