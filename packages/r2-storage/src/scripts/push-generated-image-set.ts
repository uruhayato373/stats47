#!/usr/bin/env tsx
/**
 * 画像生成 publish plan に列挙された asset だけを R2 へ反映する。
 *
 * - prefix 走査をしない（古い staging の混入防止）
 * - ローカル asset の bytes / sha256 / MIME 契約を manifest と照合
 * - asset PUT → S3 HEAD 検証 → manifest conditional PUT の順で確定
 * - 1 件でも失敗したら manifest を更新せず非 0 終了
 */

import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

import { config } from 'dotenv';
import sharp from 'sharp';

import {
  IMAGE_GENERATION_MANIFEST_KIND,
  IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION,
  IMAGE_GENERATION_PUBLISH_PLAN_KIND,
  IMAGE_GENERATION_PUBLISH_PLAN_SCHEMA_VERSION,
  type ImageGenerationAsset,
  type ImageGenerationManifest,
  type ImageGenerationPublishPlan,
  type ImageGenerationPublishPlanItem,
} from '@stats47/types';

import {
  createS3ImageObjectStoreFromEnv,
  type ImageObjectStore,
  type StoredImageObject,
} from '../image-pipeline';
import { assertR2WriteAllowed } from './_assert-ci-write';
import { assertKsjPublicKeysAllowed } from './lib/ksj-publication-guard';

export type { ImageObjectStore } from '../image-pipeline';

const CONCURRENCY = 8;
const PUBLISH_LOCK_TTL_MS = 30 * 60 * 1000;
const PUBLISH_PLAN_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const PUBLISH_LOCK_PREFIX = 'ops/image-publish-locks';

type ManifestAsset = ImageGenerationAsset;

type ImageManifest = ImageGenerationManifest<Record<string, unknown>>;

interface ValidatedBundle {
  item: ImageGenerationPublishPlanItem;
  manifest: ImageManifest;
  manifestBody: Buffer;
  assets: Array<ManifestAsset & { body: Buffer }>;
  remoteManifestEtag: string | null;
  remoteManifest: StoredImageObject | null;
}

interface HeldPublishLock {
  key: string;
  etag: string;
}

interface AssetRollback {
  asset: ManifestAsset;
  previous: StoredImageObject | null;
  publishedEtag: string;
}

class PublishCleanupError extends Error {
  readonly operationError: unknown;
  readonly cleanupError: unknown;

  constructor(label: string, operationError: unknown, cleanupError: unknown) {
    super(
      `${label}: 元の処理失敗=${String(operationError)} / lock解放失敗=${String(cleanupError)}`
    );
    this.name = 'PublishCleanupError';
    this.operationError = operationError;
    this.cleanupError = cleanupError;
  }
}

function sha256(contents: Buffer): string {
  return createHash('sha256').update(contents).digest('hex');
}

function publishLockKey(objectKey: string): string {
  return `${PUBLISH_LOCK_PREFIX}/${sha256(Buffer.from(objectKey))}.json`;
}

async function acquirePublishLock(
  store: ImageObjectStore,
  objectKey: string
): Promise<HeldPublishLock> {
  const key = publishLockKey(objectKey);
  const token = randomUUID();
  const now = new Date();
  const existing = await store.get(key);
  let replaceEtag: string | null = null;
  if (existing) {
    let createdAt = Number.NaN;
    try {
      const value = parseJson<{ createdAt?: unknown }>(
        existing.body,
        `publish lock ${key}`
      );
      createdAt =
        typeof value.createdAt === 'string'
          ? Date.parse(value.createdAt)
          : Number.NaN;
    } catch {
      // 壊れたlockはETag CASでのみ回収する。
    }
    if (
      Number.isFinite(createdAt) &&
      now.getTime() - createdAt < PUBLISH_LOCK_TTL_MS
    ) {
      throw new Error(`画像objectは別publisherが更新中です: ${objectKey}`);
    }
    if (!existing.etag) {
      throw new Error(`画像 publish lock のETagがありません: ${objectKey}`);
    }
    replaceEtag = existing.etag;
  }

  const body = Buffer.from(
    JSON.stringify({
      kind: 'stats47-image-publish-lock',
      objectKey,
      token,
      createdAt: now.toISOString(),
    })
  );
  await store.put({
    key,
    body,
    contentType: 'application/json',
    cacheControl: 'no-store',
    metadata: { 'stats47-lock-token': token },
    ...(replaceEtag ? { ifMatch: replaceEtag } : { ifNoneMatch: '*' as const }),
  });
  const locked = await store.head(key);
  if (!locked?.etag || locked.metadata['stats47-lock-token'] !== token) {
    throw new Error(`画像 publish lock の取得確認に失敗しました: ${objectKey}`);
  }
  return { key, etag: locked.etag };
}

async function releasePublishLocks(
  store: ImageObjectStore,
  locks: readonly HeldPublishLock[]
): Promise<void> {
  const results = await Promise.allSettled(
    [...locks]
      .reverse()
      .map((lock) => store.delete({ key: lock.key, ifMatch: lock.etag }))
  );
  const failed = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );
  if (failed.length > 0) {
    throw new Error(
      `画像 publish lock の解放に${failed.length}件失敗しました: ` +
        failed.map((result) => String(result.reason)).join(' / ')
    );
  }
}

function parseJson<T>(contents: Buffer, label: string): T {
  try {
    return JSON.parse(contents.toString('utf8')) as T;
  } catch {
    throw new Error(`${label} は有効な JSON ではありません`);
  }
}

function canonicalize(value: unknown): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  throw new Error(`canonical JSON に未対応の型です: ${typeof value}`);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function isValidAsset(asset: unknown): asset is ImageGenerationAsset {
  if (!asset || typeof asset !== 'object') return false;
  const value = asset as Partial<ImageGenerationAsset>;
  return (
    typeof value.key === 'string' &&
    value.key.length > 0 &&
    !value.key.startsWith('/') &&
    !value.key.includes('\\') &&
    !value.key.split('/').includes('..') &&
    typeof value.variant === 'string' &&
    value.variant.length > 0 &&
    typeof value.contentType === 'string' &&
    /^image\/[a-z0-9.+-]+$/.test(value.contentType) &&
    Number.isSafeInteger(value.width) &&
    (value.width ?? 0) > 0 &&
    Number.isSafeInteger(value.height) &&
    (value.height ?? 0) > 0 &&
    Number.isSafeInteger(value.bytes) &&
    (value.bytes ?? 0) > 0 &&
    typeof value.sha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(value.sha256)
  );
}

function fingerprintForManifest(manifest: ImageManifest): string {
  const assets = manifest.assets
    .map(({ key, variant, contentType, width, height }) => ({
      key,
      variant,
      contentType,
      width,
      height,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
  return sha256(
    Buffer.from(
      canonicalJson({
        schemaVersion: IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION,
        generator: manifest.generator,
        entityId: manifest.entityId,
        inputHash: manifest.inputHash,
        rendererHash: manifest.rendererHash,
        assets,
      })
    )
  );
}

function localPathFor(stageRoot: string, key: string): string {
  const absolute = resolve(stageRoot, key);
  // ★上の stageRoot 検査と同じ理由で relative() を使う (区切り文字直書きは Windows で常に不一致)
  const rel = relative(resolve(stageRoot), absolute);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel))
    throw new Error(`R2 key が staging 外を指しています: ${key}`);
  return absolute;
}

function readPublishPlan(planPath: string): ImageGenerationPublishPlan {
  const plan = parseJson<ImageGenerationPublishPlan>(
    readFileSync(planPath),
    'publish plan'
  );
  if (
    plan.kind !== IMAGE_GENERATION_PUBLISH_PLAN_KIND ||
    plan.schemaVersion !== IMAGE_GENERATION_PUBLISH_PLAN_SCHEMA_VERSION ||
    typeof plan.generator !== 'string' ||
    typeof plan.stageRoot !== 'string' ||
    !/^\.local\/image-staging\/[a-z0-9-]+$/.test(plan.stageRoot) ||
    typeof plan.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(plan.createdAt)) ||
    !Array.isArray(plan.items)
  ) {
    throw new Error('publish plan の schema が不正です');
  }
  const createdAt = Date.parse(plan.createdAt);
  const age = Date.now() - createdAt;
  if (age > PUBLISH_PLAN_TTL_MS || age < -MAX_CLOCK_SKEW_MS) {
    throw new Error(
      `publish plan の有効期限外です: createdAt=${plan.createdAt}`
    );
  }
  const manifestKeys = new Set<string>();
  for (const item of plan.items) {
    if (
      !item ||
      typeof item.entityId !== 'string' ||
      typeof item.manifestKey !== 'string' ||
      typeof item.fingerprint !== 'string' ||
      !/^[0-9a-f]{64}$/.test(item.fingerprint) ||
      typeof item.manifestSha256 !== 'string' ||
      !/^[0-9a-f]{64}$/.test(item.manifestSha256) ||
      !Array.isArray(item.assets) ||
      item.assets.length === 0 ||
      !item.assets.every(isValidAsset) ||
      new Set(item.assets.map((asset) => asset.key)).size !==
        item.assets.length ||
      !(
        item.expectedRemoteFingerprint === null ||
        typeof item.expectedRemoteFingerprint === 'string'
      ) ||
      !(
        item.expectedRemoteManifestSha256 === null ||
        (typeof item.expectedRemoteManifestSha256 === 'string' &&
          /^[0-9a-f]{64}$/.test(item.expectedRemoteManifestSha256))
      )
    ) {
      throw new Error('publish plan item の schema が不正です');
    }
    if (manifestKeys.has(item.manifestKey)) {
      throw new Error(
        `publish plan の manifest key が重複しています: ${item.manifestKey}`
      );
    }
    manifestKeys.add(item.manifestKey);
  }
  return plan;
}

async function pMap<T>(
  items: readonly T[],
  worker: (item: T) => Promise<void>,
  concurrency = CONCURRENCY
): Promise<void> {
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const item = items[cursor++];
      await worker(item);
    }
  }
  const results = await Promise.allSettled(
    Array.from({ length: Math.min(concurrency, items.length) }, run)
  );
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );
  if (failures.length === 1) throw failures[0].reason;
  if (failures.length > 1) {
    throw new Error(
      `${failures.length} image publish workers failed: ` +
        failures.map((failure) => String(failure.reason)).join(' / ')
    );
  }
}

async function validateBundle(options: {
  item: ImageGenerationPublishPlanItem;
  generator: string;
  stageRoot: string;
  store: ImageObjectStore;
}): Promise<ValidatedBundle> {
  const { item, generator, stageRoot, store } = options;
  const manifestBody = readFileSync(localPathFor(stageRoot, item.manifestKey));
  if (sha256(manifestBody) !== item.manifestSha256) {
    throw new Error(
      `staging manifest が publish plan 作成後に変更されました: ${item.manifestKey}`
    );
  }
  const manifest = parseJson<ImageManifest>(manifestBody, item.manifestKey);
  if (
    manifest.kind !== IMAGE_GENERATION_MANIFEST_KIND ||
    manifest.schemaVersion !== IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION ||
    manifest.generator !== generator ||
    manifest.entityId !== item.entityId ||
    manifest.fingerprint !== item.fingerprint ||
    fingerprintForManifest(manifest) !== manifest.fingerprint ||
    !/^[0-9a-f]{64}$/.test(manifest.inputHash) ||
    !/^[0-9a-f]{64}$/.test(manifest.rendererHash) ||
    !Number.isFinite(Date.parse(manifest.generatedAt)) ||
    !('metadata' in manifest) ||
    !Array.isArray(manifest.assets) ||
    manifest.assets.length === 0
  ) {
    throw new Error(
      `画像 manifest 契約が publish plan と一致しません: ${item.manifestKey}`
    );
  }
  const plannedAssets = [...item.assets].sort((left, right) =>
    left.key.localeCompare(right.key)
  );
  const manifestAssets = [...manifest.assets].sort((left, right) =>
    left.key.localeCompare(right.key)
  );
  if (canonicalJson(plannedAssets) !== canonicalJson(manifestAssets)) {
    throw new Error(
      `画像 manifest の asset が publish plan と一致しません: ${item.manifestKey}`
    );
  }

  const assetKeys = new Set<string>();
  const assets = await Promise.all(
    manifest.assets.map(async (asset) => {
      if (
        typeof asset.key !== 'string' ||
        typeof asset.variant !== 'string' ||
        typeof asset.contentType !== 'string' ||
        !asset.contentType.startsWith('image/') ||
        !Number.isSafeInteger(asset.width) ||
        asset.width <= 0 ||
        !Number.isSafeInteger(asset.height) ||
        asset.height <= 0 ||
        !Number.isSafeInteger(asset.bytes) ||
        asset.bytes <= 0 ||
        !/^[0-9a-f]{64}$/.test(asset.sha256) ||
        assetKeys.has(asset.key)
      ) {
        throw new Error(`画像 asset 契約が不正です: ${item.manifestKey}`);
      }
      assetKeys.add(asset.key);
      const body = readFileSync(localPathFor(stageRoot, asset.key));
      if (body.byteLength !== asset.bytes || sha256(body) !== asset.sha256) {
        throw new Error(
          `staging asset が manifest と一致しません: ${asset.key}`
        );
      }
      const image = await sharp(body).metadata();
      const expectedFormat =
        asset.contentType === 'image/jpeg'
          ? 'jpeg'
          : asset.contentType.replace('image/', '');
      if (
        image.width !== asset.width ||
        image.height !== asset.height ||
        image.format !== expectedFormat
      ) {
        throw new Error(
          `staging asset の画像契約が不正です: ${asset.key} ` +
            `(expected=${asset.width}x${asset.height} ${expectedFormat}, ` +
            `actual=${image.width ?? '?'}x${image.height ?? '?'} ${image.format ?? '?'})`
        );
      }
      return { ...asset, body };
    })
  );

  const remoteManifest = await store.get(item.manifestKey);
  let remoteFingerprint: string | null = null;
  const remoteManifestSha256 = remoteManifest
    ? sha256(remoteManifest.body)
    : null;
  if (remoteManifest) {
    try {
      const remote = parseJson<{ fingerprint?: unknown }>(
        remoteManifest.body,
        `remote ${item.manifestKey}`
      );
      remoteFingerprint =
        typeof remote.fingerprint === 'string' ? remote.fingerprint : null;
    } catch {
      // invalid manifest も ETag 条件付きで自己修復できるよう、fingerprint不在として扱う。
      remoteFingerprint = null;
    }
  }
  if (remoteFingerprint !== item.expectedRemoteFingerprint) {
    throw new Error(
      `画像 manifest が plan 作成後に更新されました: ${item.manifestKey} ` +
        `(expected=${item.expectedRemoteFingerprint ?? 'missing'}, actual=${remoteFingerprint ?? 'missing'})`
    );
  }
  if (remoteManifestSha256 !== item.expectedRemoteManifestSha256) {
    throw new Error(
      `画像 manifest bytes が plan 作成後に更新されました: ${item.manifestKey} ` +
        `(expected=${item.expectedRemoteManifestSha256 ?? 'missing'}, actual=${remoteManifestSha256 ?? 'missing'})`
    );
  }
  if (remoteManifest && !remoteManifest.etag) {
    throw new Error(
      `remote manifest の ETag を取得できません: ${item.manifestKey}`
    );
  }

  return {
    item,
    manifest,
    manifestBody,
    assets,
    remoteManifestEtag: remoteManifest?.etag ?? null,
    remoteManifest,
  };
}

async function uploadAndVerifyAsset(options: {
  asset: ManifestAsset & { body: Buffer };
  fingerprint: string;
  manifestKey: string;
  store: ImageObjectStore;
}): Promise<AssetRollback | null> {
  const { asset, fingerprint, manifestKey, store } = options;
  const existing = await store.head(asset.key);
  const existingOwner = existing?.metadata['stats47-manifest'];
  if (existingOwner && existingOwner !== manifestKey) {
    throw new Error(
      `R2 asset は別manifestに所有されています: ${asset.key} (${existingOwner})`
    );
  }
  const isSame =
    existing?.metadata['stats47-sha256'] === asset.sha256 &&
    existingOwner === manifestKey &&
    existing.contentLength === asset.bytes &&
    existing.contentType === asset.contentType;
  if (isSame) return null;

  const previous = await store.get(asset.key);
  if (
    (existing === null) !== (previous === null) ||
    (existing?.etag && previous?.etag !== existing.etag)
  ) {
    throw new Error(`R2 asset が検証中に更新されました: ${asset.key}`);
  }
  const previousOwner = previous?.metadata['stats47-manifest'];
  if (previousOwner && previousOwner !== manifestKey) {
    throw new Error(
      `R2 asset は別manifestに所有されています: ${asset.key} (${previousOwner})`
    );
  }
  if (previous && !previous.etag) {
    throw new Error(`R2 asset のETagがありません: ${asset.key}`);
  }

  const putResult = await store.put({
    key: asset.key,
    body: asset.body,
    contentType: asset.contentType,
    // key は fingerprint revision ではなく stable URL。長期 immutable cache にすると
    // 正常な差分更新後も旧画像が残るため、ETag revalidation を必須にする。
    cacheControl: 'public, max-age=0, must-revalidate',
    metadata: {
      'stats47-sha256': asset.sha256,
      'stats47-fingerprint': fingerprint,
      'stats47-manifest': manifestKey,
    },
    ...(previous?.etag
      ? { ifMatch: previous.etag }
      : { ifNoneMatch: '*' as const }),
  });
  let rollback: AssetRollback | null =
    putResult && putResult.etag
      ? {
          asset,
          previous,
          publishedEtag: putResult.etag,
        }
      : null;
  try {
    const published = await store.head(asset.key);
    if (!published?.etag) {
      throw new Error(`R2 asset のETag検証に失敗しました: ${asset.key}`);
    }
    rollback ??= {
      asset,
      previous,
      publishedEtag: published.etag,
    };
    if (
      published.etag !== rollback.publishedEtag ||
      published.contentLength !== asset.bytes ||
      published.contentType !== asset.contentType ||
      published.metadata['stats47-sha256'] !== asset.sha256 ||
      published.metadata['stats47-manifest'] !== manifestKey
    ) {
      throw new Error(`R2 asset 検証に失敗しました: ${asset.key}`);
    }
    return rollback;
  } catch (error) {
    if (!rollback) {
      throw new Error(
        `R2 asset検証失敗後のrollbackに必要なETagを取得できません: ${asset.key} / ${String(error)}`
      );
    }
    try {
      await rollbackAsset(store, rollback);
    } catch (rollbackError) {
      throw new Error(
        `R2 asset検証失敗後のrollbackにも失敗しました: ${asset.key} / ` +
          `${String(error)} / ${String(rollbackError)}`
      );
    }
    throw error;
  }
}

async function rollbackAsset(
  store: ImageObjectStore,
  rollback: AssetRollback
): Promise<void> {
  if (!rollback.previous) {
    await store.delete({
      key: rollback.asset.key,
      ifMatch: rollback.publishedEtag,
    });
    return;
  }
  await store.put({
    key: rollback.asset.key,
    body: rollback.previous.body,
    contentType: rollback.previous.contentType ?? rollback.asset.contentType,
    cacheControl: 'public, max-age=0, must-revalidate',
    metadata: rollback.previous.metadata,
    ifMatch: rollback.publishedEtag,
  });
}

async function rollbackManifestIfCommitted(
  store: ImageObjectStore,
  bundle: ValidatedBundle
): Promise<void> {
  const current = await store.head(bundle.item.manifestKey);
  if (
    !current?.etag ||
    current.metadata['stats47-sha256'] !== sha256(bundle.manifestBody)
  ) {
    return;
  }
  if (!bundle.remoteManifest) {
    await store.delete({
      key: bundle.item.manifestKey,
      ifMatch: current.etag,
    });
    return;
  }
  await store.put({
    key: bundle.item.manifestKey,
    body: bundle.remoteManifest.body,
    contentType: bundle.remoteManifest.contentType ?? 'application/json',
    cacheControl: 'no-cache',
    metadata: bundle.remoteManifest.metadata,
    ifMatch: current.etag,
  });
}

export async function publishGeneratedImageSet(options: {
  planPath: string;
  projectRoot: string;
  store: ImageObjectStore;
  dryRun?: boolean;
}): Promise<{ bundles: number; assets: number }> {
  const plan = readPublishPlan(options.planPath);
  assertKsjPublicKeysAllowed(plan.items.flatMap((item) => [
    item.manifestKey, ...item.assets.map((asset) => asset.key),
  ]));
  const stageRoot = resolve(options.projectRoot, plan.stageRoot);
  // ★区切り文字を直書きした前方一致にしない (2026-08-18)。`${dir}/` を付けて startsWith すると
  //   Windows では resolve() が `\` を返すため常に不一致になり、正当な stage まで弾く
  //   (この環境で 19 テストが赤だった)。relative() の包含判定は区切り文字に依存しない。
  const allowedStageRoot = resolve(options.projectRoot, '.local/image-staging');
  const stageRel = relative(allowedStageRoot, stageRoot);
  if (stageRel === '' || stageRel.startsWith('..') || isAbsolute(stageRel)) {
    throw new Error(
      `publish plan の stageRoot が許可範囲外です: ${plan.stageRoot}`
    );
  }
  const locks: HeldPublishLock[] = [];
  let publishFailed = false;
  let publishError: unknown;
  try {
    if (!options.dryRun) {
      for (const item of [...plan.items].sort((a, b) =>
        a.manifestKey.localeCompare(b.manifestKey)
      )) {
        locks.push(await acquirePublishLock(options.store, item.manifestKey));
      }
    }

    // remote manifest はdistributed lock取得後に読む。plan後に完了した別publishを
    // 古いETagで上書きしたり、stable assetだけ競合更新したりするのを防ぐ。
    const bundles: ValidatedBundle[] = [];
    for (const item of plan.items) {
      bundles.push(
        await validateBundle({
          item,
          generator: plan.generator,
          stageRoot,
          store: options.store,
        })
      );
    }
    const objectKeys = new Set(plan.items.map((item) => item.manifestKey));
    for (const bundle of bundles) {
      for (const asset of bundle.assets) {
        if (objectKeys.has(asset.key)) {
          throw new Error(
            `publish plan 内でR2 keyが重複しています: ${asset.key}`
          );
        }
        objectKeys.add(asset.key);
      }
    }
    const assetCount = bundles.reduce(
      (sum, bundle) => sum + bundle.assets.length,
      0
    );
    if (options.dryRun) return { bundles: bundles.length, assets: assetCount };

    // bundleごとに assetを先に確定し、manifestを最後のcommit markerとしてCASする。
    await pMap(bundles, async (bundle) => {
      const rollbacks: AssetRollback[] = [];
      const assetLocks: HeldPublishLock[] = [];
      let bundleFailed = false;
      let bundleError: unknown;
      try {
        // asset keyも分散lockし、別manifestの誤ったkey共有をCASと所有者で拒否する。
        // key順を固定して複数assetのlock順序を決定的にする。
        for (const asset of [...bundle.assets].sort((left, right) =>
          left.key.localeCompare(right.key)
        )) {
          assetLocks.push(await acquirePublishLock(options.store, asset.key));
          const rollback = await uploadAndVerifyAsset({
            asset,
            fingerprint: bundle.manifest.fingerprint,
            manifestKey: bundle.item.manifestKey,
            store: options.store,
          });
          if (rollback) rollbacks.push(rollback);
        }
        await options.store.put({
          key: bundle.item.manifestKey,
          body: bundle.manifestBody,
          contentType: 'application/json',
          cacheControl: 'no-cache',
          metadata: {
            'stats47-fingerprint': bundle.manifest.fingerprint,
            'stats47-sha256': sha256(bundle.manifestBody),
          },
          ...(bundle.remoteManifestEtag
            ? { ifMatch: bundle.remoteManifestEtag }
            : { ifNoneMatch: '*' as const }),
        });
        const verified = await options.store.head(bundle.item.manifestKey);
        if (
          !verified ||
          verified.contentLength !== bundle.manifestBody.byteLength ||
          verified.contentType !== 'application/json' ||
          verified.metadata['stats47-fingerprint'] !==
            bundle.manifest.fingerprint ||
          verified.metadata['stats47-sha256'] !== sha256(bundle.manifestBody)
        ) {
          throw new Error(
            `R2 manifest 検証に失敗しました: ${bundle.item.manifestKey}`
          );
        }
      } catch (error) {
        const rollbackFailures: unknown[] = [];
        try {
          await rollbackManifestIfCommitted(options.store, bundle);
        } catch (rollbackError) {
          rollbackFailures.push(rollbackError);
        }
        for (const rollback of [...rollbacks].reverse()) {
          try {
            await rollbackAsset(options.store, rollback);
          } catch (rollbackError) {
            rollbackFailures.push(rollbackError);
          }
        }
        if (rollbackFailures.length > 0) {
          bundleError = new Error(
            `画像bundle公開失敗後のrollbackにも失敗しました: ` +
              `${String(error)} / ${rollbackFailures.map(String).join(' / ')}`
          );
        } else {
          bundleError = error;
        }
        bundleFailed = true;
        throw bundleError;
      } finally {
        if (assetLocks.length > 0) {
          try {
            await releasePublishLocks(options.store, assetLocks);
          } catch (cleanupError) {
            if (bundleFailed) {
              throw new PublishCleanupError(
                `画像bundle ${bundle.item.manifestKey}`,
                bundleError,
                cleanupError
              );
            }
            throw cleanupError;
          }
        }
      }
    });
    return { bundles: bundles.length, assets: assetCount };
  } catch (error) {
    publishFailed = true;
    publishError = error;
    throw error;
  } finally {
    if (locks.length > 0) {
      try {
        await releasePublishLocks(options.store, locks);
      } catch (cleanupError) {
        if (publishFailed) {
          throw new PublishCleanupError(
            '画像publish plan',
            publishError,
            cleanupError
          );
        }
        throw cleanupError;
      }
    }
  }
}

async function main(): Promise<void> {
  const projectRoot = resolve(import.meta.dirname ?? __dirname, '../../../..');
  config({ path: resolve(projectRoot, '.env.local') });
  const args = process.argv.slice(2);
  const planIndex = args.indexOf('--plan');
  const planArg = planIndex >= 0 ? args[planIndex + 1] : null;
  if (!planArg) throw new Error('--plan <path> が必要です');
  const planPath = resolve(projectRoot, planArg);
  const dryRun = args.includes('--dry-run');
  assertR2WriteAllowed({ op: 'push generated image set', dryRun });

  const store = createS3ImageObjectStoreFromEnv();
  if (!store) {
    throw new Error(
      'R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY が必要です'
    );
  }
  const result = await publishGeneratedImageSet({
    planPath,
    projectRoot,
    store,
    dryRun,
  });
  console.log(
    `${dryRun ? 'DRY RUN' : 'R2反映完了'}: bundle=${result.bundles} asset=${result.assets}`
  );
}

if (process.argv[1]?.includes('push-generated-image-set')) {
  main().catch((error) => {
    console.error(
      `Fatal: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  });
}
