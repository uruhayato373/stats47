import type { ImageGenerationManifest } from '@stats47/types';
import {
  createS3ImageObjectStoreFromEnv,
  type ImageObjectStore,
} from '@stats47/r2-storage/image-pipeline';

import {
  compareImageGenerationManifest,
  inspectRemoteImageGeneration,
  sha256,
  type ImageGenerationPlan,
  type ImageGenerationStatus,
} from './image-generation-manifest';

export async function inspectR2ImageGeneration(
  plan: ImageGenerationPlan,
  store: ImageObjectStore
): Promise<ImageGenerationStatus> {
  try {
    const remoteManifest = await store.get(plan.manifestKey);
    if (!remoteManifest) {
      return {
        isCurrent: false,
        reason: 'manifest-missing',
        remoteFingerprint: null,
        remoteManifestSha256: null,
      };
    }
    const remoteManifestSha256 = sha256(remoteManifest.body);
    let value: unknown;
    try {
      value = JSON.parse(remoteManifest.body.toString('utf8')) as unknown;
    } catch {
      return {
        isCurrent: false,
        reason: 'manifest-invalid',
        remoteFingerprint: null,
        remoteManifestSha256,
      };
    }
    const compared = compareImageGenerationManifest(
      value,
      plan,
      remoteManifestSha256
    );
    if (!compared.isCurrent) return compared;
    const manifest = value as ImageGenerationManifest<unknown>;
    if (
      remoteManifest.contentType !== 'application/json' ||
      remoteManifest.contentLength !== remoteManifest.body.byteLength ||
      remoteManifest.metadata['stats47-fingerprint'] !== manifest.fingerprint ||
      remoteManifest.metadata['stats47-sha256'] !== sha256(remoteManifest.body)
    ) {
      return {
        isCurrent: false,
        reason: 'manifest-invalid',
        remoteFingerprint: manifest.fingerprint,
        remoteManifestSha256,
      };
    }

    const remoteAssets = await Promise.all(
      manifest.assets.map(async (asset) => ({
        asset,
        remote: await store.head(asset.key),
      }))
    );
    const complete = remoteAssets.every(
      ({ asset, remote }) =>
        remote !== null &&
        remote.contentType === asset.contentType &&
        remote.contentLength === asset.bytes &&
        remote.metadata['stats47-sha256'] === asset.sha256 &&
        remote.metadata['stats47-manifest'] === plan.manifestKey
    );
    return complete
      ? {
          isCurrent: true,
          reason: 'current',
          remoteFingerprint: manifest.fingerprint,
          remoteManifestSha256,
        }
      : {
          isCurrent: false,
          reason: 'asset-missing',
          remoteFingerprint: manifest.fingerprint,
          remoteManifestSha256,
        };
  } catch {
    return {
      isCurrent: false,
      reason: 'probe-error',
      remoteFingerprint: null,
      remoteManifestSha256: null,
    };
  }
}

export function createImageGenerationInspector(publicUrl: string): {
  mode: 's3' | 'public';
  inspect: (plan: ImageGenerationPlan) => Promise<ImageGenerationStatus>;
} {
  const store = createS3ImageObjectStoreFromEnv();
  return store
    ? {
        mode: 's3',
        inspect: (plan) => inspectR2ImageGeneration(plan, store),
      }
    : {
        mode: 'public',
        inspect: (plan) => inspectRemoteImageGeneration(publicUrl, plan),
      };
}
