import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';

import {
  publishGeneratedImageSet,
  type ImageObjectStore,
} from '../push-generated-image-set';

interface FakeObject {
  body: Buffer;
  etag: string;
  contentType: string;
  metadata: Record<string, string>;
}

function sha256(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex');
}

function makeStore(
  options: {
    failKey?: string;
    failHeadAfterPutKey?: string;
    failLockDeleteCount?: number;
    failDeleteKey?: string;
  } = {}
) {
  const objects = new Map<string, FakeObject>();
  const puts: string[] = [];
  let revision = 0;
  let failNextHead = false;
  let remainingLockDeleteFailures = options.failLockDeleteCount ?? 0;
  const store: ImageObjectStore = {
    async get(key) {
      const value = objects.get(key);
      return value
        ? {
            body: value.body,
            etag: value.etag,
            contentType: value.contentType,
            contentLength: value.body.byteLength,
            metadata: value.metadata,
          }
        : null;
    },
    async head(key) {
      if (key === options.failHeadAfterPutKey && failNextHead) {
        failNextHead = false;
        throw new Error('injected HEAD failure');
      }
      const value = objects.get(key);
      return value
        ? {
            etag: value.etag,
            contentType: value.contentType,
            contentLength: value.body.byteLength,
            metadata: value.metadata,
          }
        : null;
    },
    async put(input) {
      puts.push(input.key);
      if (input.key === options.failKey)
        throw new Error('injected PUT failure');
      const current = objects.get(input.key);
      if (input.ifNoneMatch === '*' && current)
        throw new Error('precondition failed');
      if (input.ifMatch && current?.etag !== input.ifMatch)
        throw new Error('precondition failed');
      const etag = `"${++revision}"`;
      objects.set(input.key, {
        body: input.body,
        etag,
        contentType: input.contentType,
        metadata: input.metadata,
      });
      if (input.key === options.failHeadAfterPutKey) failNextHead = true;
      return { etag };
    },
    async delete(input) {
      if (
        input.key.startsWith('ops/image-publish-locks/') &&
        remainingLockDeleteFailures > 0
      ) {
        remainingLockDeleteFailures -= 1;
        throw new Error('injected lock DELETE failure');
      }
      if (input.key === options.failDeleteKey) {
        throw new Error('injected asset DELETE failure');
      }
      const current = objects.get(input.key);
      if (!current || current.etag !== input.ifMatch)
        throw new Error('precondition failed');
      objects.delete(input.key);
    },
  };
  return { store, objects, puts };
}

const roots: string[] = [];

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(canonicalValue));
  return JSON.stringify(canonicalValue(value));
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalValue(child)])
    );
  }
  return value;
}

async function makeFixture(
  options: {
    entityId?: string;
    assetKey?: string;
    manifestKey?: string;
    color?: { r: number; g: number; b: number };
  } = {}
) {
  const root = mkdtempSync(join(tmpdir(), 'stats47-image-publisher-'));
  roots.push(root);
  const stageRoot = '.local/image-staging/test';
  const stage = join(root, stageRoot);
  const entityId = options.entityId ?? 'metric-a';
  const assetKey =
    options.assetKey ?? 'app/ranking/metric-a/thumbnail-light.webp';
  const manifestKey =
    options.manifestKey ?? 'app/ranking/metric-a/thumbnail.json';
  const inputHash = 'b'.repeat(64);
  const rendererHash = 'c'.repeat(64);
  const assetContract = {
    key: assetKey,
    variant: 'light',
    contentType: 'image/webp',
    width: 2,
    height: 1,
  } as const;
  const fingerprint = sha256(
    Buffer.from(
      canonicalJson({
        schemaVersion: 1,
        generator: 'ranking-card',
        entityId,
        inputHash,
        rendererHash,
        assets: [assetContract],
      })
    )
  );
  const assetBody = await sharp({
    create: {
      width: 2,
      height: 1,
      channels: 4,
      background: {
        ...(options.color ?? { r: 48, g: 72, b: 204 }),
        alpha: 1,
      },
    },
  })
    .webp()
    .toBuffer();
  const assetPath = join(stage, assetKey);
  mkdirSync(join(assetPath, '..'), { recursive: true });
  writeFileSync(assetPath, assetBody);
  const manifest = {
    kind: 'stats47-image-generation',
    schemaVersion: 1,
    generator: 'ranking-card',
    entityId,
    inputHash,
    rendererHash,
    fingerprint,
    generatedAt: '2026-07-26T00:00:00.000Z',
    assets: [
      {
        ...assetContract,
        bytes: assetBody.byteLength,
        sha256: sha256(assetBody),
      },
    ],
    metadata: {},
  };
  const manifestPath = join(stage, manifestKey);
  const manifestBody = Buffer.from(JSON.stringify(manifest));
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, manifestBody);
  // plan 外の staging は publisher が絶対に触らない。
  const stalePath = join(stage, 'app/ranking/metric-a/stale.webp');
  mkdirSync(dirname(stalePath), { recursive: true });
  writeFileSync(stalePath, 'stale');
  const planPath = join(root, '.local/image-plan.json');
  writeFileSync(
    planPath,
    JSON.stringify({
      kind: 'stats47-image-publish-plan',
      schemaVersion: 1,
      generator: 'ranking-card',
      stageRoot,
      createdAt: new Date().toISOString(),
      items: [
        {
          entityId,
          manifestKey,
          fingerprint,
          manifestSha256: sha256(manifestBody),
          assets: manifest.assets,
          expectedRemoteManifestSha256: null,
          expectedRemoteFingerprint: null,
        },
      ],
    })
  );
  return {
    root,
    stageRoot,
    planPath,
    assetKey,
    manifestKey,
    fingerprint,
  };
}

function mergeFixtureItem(
  target: Awaited<ReturnType<typeof makeFixture>>,
  source: Awaited<ReturnType<typeof makeFixture>>
): void {
  const targetStage = join(target.root, target.stageRoot);
  const sourceStage = join(source.root, source.stageRoot);
  for (const key of [source.assetKey, source.manifestKey]) {
    const destination = join(targetStage, key);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(sourceStage, key), destination);
  }
  const targetPlan = JSON.parse(readFileSync(target.planPath, 'utf8')) as {
    items: unknown[];
  };
  const sourcePlan = JSON.parse(readFileSync(source.planPath, 'utf8')) as {
    items: unknown[];
  };
  targetPlan.items.push(...sourcePlan.items);
  writeFileSync(target.planPath, JSON.stringify(targetPlan));
}

function updatePlan(
  planPath: string,
  mutate: (plan: Record<string, unknown>) => void
): void {
  const plan = JSON.parse(readFileSync(planPath, 'utf8')) as Record<
    string,
    unknown
  >;
  mutate(plan);
  writeFileSync(planPath, JSON.stringify(plan));
}

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe('publishGeneratedImageSet', () => {
  const publishedObjectPuts = (puts: string[]) =>
    puts.filter((key) => !key.startsWith('ops/image-publish-locks/'));

  it('rejects a mixed plan containing retired KSJ images before any lock or asset PUT', async () => {
    const fixture = await makeFixture();
    const retired = await makeFixture({
      entityId: 'dam-count',
      assetKey: 'app/ranking/dam-count/thumbnail-light.webp',
      manifestKey: 'app/ranking/dam-count/thumbnail.json',
    });
    mergeFixtureItem(fixture, retired);
    const fake = makeStore();
    await expect(publishGeneratedImageSet({
      planPath: fixture.planPath, projectRoot: fixture.root, store: fake.store,
    })).rejects.toThrow('KSJ公開構造化データ禁止');
    expect(fake.puts).toEqual([]);
  });

  it('uploads and verifies exact-plan assets before the manifest', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).resolves.toEqual({ bundles: 1, assets: 1 });

    expect(publishedObjectPuts(fake.puts)).toEqual([
      fixture.assetKey,
      fixture.manifestKey,
    ]);
    expect(fake.objects.has('app/ranking/metric-a/stale.webp')).toBe(false);
    expect(
      fake.objects.get(fixture.assetKey)?.metadata['stats47-sha256']
    ).toMatch(/^[0-9a-f]{64}$/);
  });

  it('does not publish the manifest when an asset upload fails', async () => {
    const fixture = await makeFixture();
    const fake = makeStore({ failKey: fixture.assetKey });

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).rejects.toThrow('injected PUT failure');

    expect(publishedObjectPuts(fake.puts)).toEqual([fixture.assetKey]);
    expect(fake.objects.has(fixture.manifestKey)).toBe(false);
  });

  it('does not publish the manifest when its own conditional PUT fails', async () => {
    const fixture = await makeFixture();
    const fake = makeStore({ failKey: fixture.manifestKey });

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).rejects.toThrow('injected PUT failure');

    expect(publishedObjectPuts(fake.puts)).toEqual([
      fixture.assetKey,
      fixture.manifestKey,
    ]);
    expect(fake.objects.has(fixture.assetKey)).toBe(false);
    expect(fake.objects.has(fixture.manifestKey)).toBe(false);
  });

  it('restores the previous stable asset when manifest commit fails', async () => {
    const fixture = await makeFixture();
    const fake = makeStore({ failKey: fixture.manifestKey });
    const oldBody = await sharp({
      create: {
        width: 2,
        height: 1,
        channels: 4,
        background: { r: 1, g: 2, b: 3, alpha: 1 },
      },
    })
      .webp()
      .toBuffer();
    fake.objects.set(fixture.assetKey, {
      body: oldBody,
      etag: '"old-asset"',
      contentType: 'image/webp',
      metadata: {
        'stats47-sha256': sha256(oldBody),
        'stats47-manifest': fixture.manifestKey,
      },
    });

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).rejects.toThrow('injected PUT failure');

    expect(fake.objects.get(fixture.assetKey)?.body).toEqual(oldBody);
    expect(fake.objects.get(fixture.assetKey)?.metadata['stats47-sha256']).toBe(
      sha256(oldBody)
    );
    expect(fake.objects.has(fixture.manifestKey)).toBe(false);
  });

  it('restores the previous stable asset when post-PUT HEAD fails', async () => {
    const fixture = await makeFixture();
    const fake = makeStore({ failHeadAfterPutKey: fixture.assetKey });
    const oldBody = await sharp({
      create: {
        width: 2,
        height: 1,
        channels: 4,
        background: { r: 9, g: 8, b: 7, alpha: 1 },
      },
    })
      .webp()
      .toBuffer();
    fake.objects.set(fixture.assetKey, {
      body: oldBody,
      etag: '"old-asset"',
      contentType: 'image/webp',
      metadata: {
        'stats47-sha256': sha256(oldBody),
        'stats47-manifest': fixture.manifestKey,
      },
    });

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).rejects.toThrow('injected HEAD failure');

    expect(fake.objects.get(fixture.assetKey)?.body).toEqual(oldBody);
    expect(fake.objects.get(fixture.assetKey)?.metadata['stats47-sha256']).toBe(
      sha256(oldBody)
    );
    expect(fake.objects.has(fixture.manifestKey)).toBe(false);
    expect(
      [...fake.objects].some(([key]) =>
        key.startsWith('ops/image-publish-locks/')
      )
    ).toBe(false);
  });

  it('skips an asset PUT only when bytes, contract, and ownership metadata match', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    const assetBody = Buffer.from(
      readFileSync(
        join(fixture.root, '.local/image-staging/test', fixture.assetKey)
      )
    );
    fake.objects.set(fixture.assetKey, {
      body: assetBody,
      etag: '"asset-existing"',
      contentType: 'image/webp',
      metadata: {
        'stats47-sha256': sha256(assetBody),
        'stats47-fingerprint': fixture.fingerprint,
        'stats47-manifest': fixture.manifestKey,
      },
    });

    await publishGeneratedImageSet({
      planPath: fixture.planPath,
      projectRoot: fixture.root,
      store: fake.store,
    });

    expect(publishedObjectPuts(fake.puts)).toEqual([fixture.manifestKey]);
  });

  it('republishes matching bytes when legacy ownership metadata is absent', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    const assetBody = Buffer.from(
      readFileSync(
        join(fixture.root, '.local/image-staging/test', fixture.assetKey)
      )
    );
    fake.objects.set(fixture.assetKey, {
      body: assetBody,
      etag: '"asset-existing"',
      contentType: 'image/webp',
      metadata: { 'stats47-sha256': sha256(assetBody) },
    });

    await publishGeneratedImageSet({
      planPath: fixture.planPath,
      projectRoot: fixture.root,
      store: fake.store,
    });

    expect(publishedObjectPuts(fake.puts)).toEqual([
      fixture.assetKey,
      fixture.manifestKey,
    ]);
    expect(fake.objects.get(fixture.assetKey)?.metadata).toMatchObject({
      'stats47-fingerprint': fixture.fingerprint,
      'stats47-manifest': fixture.manifestKey,
    });
  });

  it('does not reupload identical image bytes only to refresh fingerprint metadata', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    const assetBody = Buffer.from(
      readFileSync(
        join(fixture.root, '.local/image-staging/test', fixture.assetKey)
      )
    );
    fake.objects.set(fixture.assetKey, {
      body: assetBody,
      etag: '"asset-existing"',
      contentType: 'image/webp',
      metadata: {
        'stats47-sha256': sha256(assetBody),
        'stats47-fingerprint': '0'.repeat(64),
        'stats47-manifest': fixture.manifestKey,
      },
    });

    await publishGeneratedImageSet({
      planPath: fixture.planPath,
      projectRoot: fixture.root,
      store: fake.store,
    });

    expect(publishedObjectPuts(fake.puts)).toEqual([fixture.manifestKey]);
  });

  it('rejects a manifest changed after planning before uploading assets', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    fake.objects.set(fixture.manifestKey, {
      body: Buffer.from(JSON.stringify({ fingerprint: 'newer' })),
      etag: '"existing"',
      contentType: 'application/json',
      metadata: {},
    });

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).rejects.toThrow('plan 作成後に更新');

    expect(publishedObjectPuts(fake.puts)).toHaveLength(0);
  });

  it('repairs an invalid remote manifest with an ETag-guarded replacement', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    const invalidBody = Buffer.from('{invalid');
    fake.objects.set(fixture.manifestKey, {
      body: invalidBody,
      etag: '"invalid-existing"',
      contentType: 'application/json',
      metadata: {},
    });
    updatePlan(fixture.planPath, (plan) => {
      const [item] = plan.items as Array<Record<string, unknown>>;
      item.expectedRemoteManifestSha256 = sha256(invalidBody);
    });

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).resolves.toEqual({ bundles: 1, assets: 1 });

    expect(publishedObjectPuts(fake.puts)).toEqual([
      fixture.assetKey,
      fixture.manifestKey,
    ]);
    expect(
      JSON.parse(fake.objects.get(fixture.manifestKey)!.body.toString('utf8'))
    ).toMatchObject({ fingerprint: fixture.fingerprint });
  });

  it('rejects replaying a plan after its manifest has already committed', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    await publishGeneratedImageSet({
      planPath: fixture.planPath,
      projectRoot: fixture.root,
      store: fake.store,
    });

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).rejects.toThrow(/plan 作成後|manifest bytes/);
  });

  it('rejects an expired publish plan before acquiring locks or uploading', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    updatePlan(fixture.planPath, (plan) => {
      plan.createdAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    });

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).rejects.toThrow('有効期限外');
    expect(fake.puts).toHaveLength(0);
  });

  it('uses a distributed bundle lock so concurrent publishers cannot race stable assets', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();

    const results = await Promise.allSettled([
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      }),
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled')
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected')
    ).toHaveLength(1);
    expect(fake.objects.has(fixture.assetKey)).toBe(true);
    expect(fake.objects.has(fixture.manifestKey)).toBe(true);
    expect(
      [...fake.objects].some(([key]) =>
        key.startsWith('ops/image-publish-locks/')
      )
    ).toBe(false);
  });

  it('rejects concurrent manifests that claim the same stable asset key', async () => {
    const sharedAssetKey = 'app/ranking/shared/thumbnail-light.webp';
    const first = await makeFixture({
      entityId: 'metric-a',
      assetKey: sharedAssetKey,
      manifestKey: 'app/ranking/metric-a/thumbnail.json',
      color: { r: 200, g: 20, b: 20 },
    });
    const second = await makeFixture({
      entityId: 'metric-b',
      assetKey: sharedAssetKey,
      manifestKey: 'app/ranking/metric-b/thumbnail.json',
      color: { r: 20, g: 20, b: 200 },
    });
    const fake = makeStore();

    const results = await Promise.allSettled([
      publishGeneratedImageSet({
        planPath: first.planPath,
        projectRoot: first.root,
        store: fake.store,
      }),
      publishGeneratedImageSet({
        planPath: second.planPath,
        projectRoot: second.root,
        store: fake.store,
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled')
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected')
    ).toHaveLength(1);
    const owner =
      fake.objects.get(sharedAssetKey)?.metadata['stats47-manifest'];
    expect([first.manifestKey, second.manifestKey]).toContain(owner);
    expect(fake.objects.has(owner!)).toBe(true);
    const losingManifest =
      owner === first.manifestKey ? second.manifestKey : first.manifestKey;
    expect(fake.objects.has(losingManifest)).toBe(false);
    expect(
      [...fake.objects].some(([key]) =>
        key.startsWith('ops/image-publish-locks/')
      )
    ).toBe(false);
  });

  it('does not overwrite a stable asset owned by another manifest', async () => {
    const sharedAssetKey = 'app/ranking/shared/thumbnail-light.webp';
    const owner = await makeFixture({
      entityId: 'metric-owner',
      assetKey: sharedAssetKey,
      manifestKey: 'app/ranking/metric-owner/thumbnail.json',
      color: { r: 200, g: 20, b: 20 },
    });
    const contender = await makeFixture({
      entityId: 'metric-contender',
      assetKey: sharedAssetKey,
      manifestKey: 'app/ranking/metric-contender/thumbnail.json',
      color: { r: 20, g: 20, b: 200 },
    });
    const fake = makeStore();
    await publishGeneratedImageSet({
      planPath: owner.planPath,
      projectRoot: owner.root,
      store: fake.store,
    });
    const ownedBody = Buffer.from(fake.objects.get(sharedAssetKey)!.body);

    await expect(
      publishGeneratedImageSet({
        planPath: contender.planPath,
        projectRoot: contender.root,
        store: fake.store,
      })
    ).rejects.toThrow('別manifestに所有');

    expect(fake.objects.get(sharedAssetKey)?.body).toEqual(ownedBody);
    expect(fake.objects.get(sharedAssetKey)?.metadata['stats47-manifest']).toBe(
      owner.manifestKey
    );
    expect(fake.objects.has(owner.manifestKey)).toBe(true);
    expect(fake.objects.has(contender.manifestKey)).toBe(false);
  });

  it('rejects duplicate stable asset keys across manifests in one plan before publishing', async () => {
    const sharedAssetKey = 'app/ranking/shared/thumbnail-light.webp';
    const first = await makeFixture({
      entityId: 'metric-a',
      assetKey: sharedAssetKey,
      manifestKey: 'app/ranking/metric-a/thumbnail.json',
    });
    const second = await makeFixture({
      entityId: 'metric-b',
      assetKey: sharedAssetKey,
      manifestKey: 'app/ranking/metric-b/thumbnail.json',
    });
    mergeFixtureItem(first, second);
    const fake = makeStore();

    await expect(
      publishGeneratedImageSet({
        planPath: first.planPath,
        projectRoot: first.root,
        store: fake.store,
      })
    ).rejects.toThrow('R2 keyが重複');

    expect(publishedObjectPuts(fake.puts)).toHaveLength(0);
    expect(fake.objects.has(sharedAssetKey)).toBe(false);
    expect(
      [...fake.objects].some(([key]) =>
        key.startsWith('ops/image-publish-locks/')
      )
    ).toBe(false);
  });

  it('waits for every active worker before releasing plan locks on failure', async () => {
    const failed = await makeFixture({
      entityId: 'metric-failed',
      assetKey: 'app/ranking/metric-failed/thumbnail-light.webp',
      manifestKey: 'app/ranking/metric-failed/thumbnail.json',
    });
    const slow = await makeFixture({
      entityId: 'metric-slow',
      assetKey: 'app/ranking/metric-slow/thumbnail-light.webp',
      manifestKey: 'app/ranking/metric-slow/thumbnail.json',
    });
    mergeFixtureItem(failed, slow);
    const fake = makeStore({ failKey: failed.assetKey });
    const originalPut = fake.store.put.bind(fake.store);
    let releaseSlow!: () => void;
    let markSlowStarted!: () => void;
    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    const slowStarted = new Promise<void>((resolve) => {
      markSlowStarted = resolve;
    });
    fake.store.put = async (input) => {
      if (input.key === slow.assetKey) {
        markSlowStarted();
        await slowGate;
      }
      return originalPut(input);
    };

    let settled = false;
    const publishing = publishGeneratedImageSet({
      planPath: failed.planPath,
      projectRoot: failed.root,
      store: fake.store,
    }).then(
      (value) => {
        settled = true;
        return value;
      },
      (error) => {
        settled = true;
        throw error;
      }
    );

    await slowStarted;
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(
      [...fake.objects].some(([key]) =>
        key.startsWith('ops/image-publish-locks/')
      )
    ).toBe(true);

    releaseSlow();
    await expect(publishing).rejects.toThrow('injected PUT failure');
    expect(fake.objects.has(slow.manifestKey)).toBe(true);
    expect(
      [...fake.objects].some(([key]) =>
        key.startsWith('ops/image-publish-locks/')
      )
    ).toBe(false);
  });

  it('preserves publish, rollback, asset-lock, and plan-lock failures together', async () => {
    const fixture = await makeFixture();
    const fake = makeStore({
      failKey: fixture.manifestKey,
      failDeleteKey: fixture.assetKey,
      failLockDeleteCount: 2,
    });

    const error = await publishGeneratedImageSet({
      planPath: fixture.planPath,
      projectRoot: fixture.root,
      store: fake.store,
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(Error);
    const message = String(error);
    expect(message).toContain('injected PUT failure');
    expect(message).toContain('injected asset DELETE failure');
    expect(message).toContain('injected lock DELETE failure');
    expect(message).toContain('元の処理失敗');
    expect(message).toContain('lock解放失敗');
  });

  it('reports only cleanup failure when publication itself succeeded', async () => {
    const fixture = await makeFixture();
    const fake = makeStore({ failLockDeleteCount: 1 });

    const error = await publishGeneratedImageSet({
      planPath: fixture.planPath,
      projectRoot: fixture.root,
      store: fake.store,
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain('injected lock DELETE failure');
    expect(String(error)).not.toContain('元の処理失敗');
    expect(fake.objects.has(fixture.assetKey)).toBe(true);
    expect(fake.objects.has(fixture.manifestKey)).toBe(true);
  });

  it('rejects an asset injected into the staged manifest but absent from the exact plan', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    const stage = join(fixture.root, '.local/image-staging/test');
    const manifestPath = join(stage, fixture.manifestKey);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      assets: Array<Record<string, unknown>>;
    };
    const injectedKey = 'app/ranking/metric-a/injected.webp';
    const injectedBody = await sharp({
      create: {
        width: 2,
        height: 1,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .webp()
      .toBuffer();
    mkdirSync(join(stage, injectedKey, '..'), { recursive: true });
    writeFileSync(join(stage, injectedKey), injectedBody);
    manifest.assets.push({
      key: injectedKey,
      variant: 'injected',
      contentType: 'image/webp',
      width: 2,
      height: 1,
      bytes: injectedBody.byteLength,
      sha256: sha256(injectedBody),
    });
    writeFileSync(manifestPath, JSON.stringify(manifest));

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).rejects.toThrow(/manifest|fingerprint|publish plan/);
    expect(publishedObjectPuts(fake.puts)).toHaveLength(0);
  });

  it('accepts an explicit empty plan as a successful no-op', async () => {
    const fixture = await makeFixture();
    const fake = makeStore();
    const plan = JSON.parse(readFileSync(fixture.planPath, 'utf8')) as {
      items: unknown[];
    };
    plan.items = [];
    writeFileSync(fixture.planPath, JSON.stringify(plan));

    await expect(
      publishGeneratedImageSet({
        planPath: fixture.planPath,
        projectRoot: fixture.root,
        store: fake.store,
      })
    ).resolves.toEqual({ bundles: 0, assets: 0 });
    expect(fake.puts).toHaveLength(0);
  });
});
