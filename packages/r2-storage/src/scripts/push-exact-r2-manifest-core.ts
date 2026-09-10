import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

import type { ImageObjectStore } from '../image-pipeline';
import { assertBlogPublicAssetsAllowed } from './lib/blog-publication-guard';
import { assertKsjPublicAssetsAllowed } from './lib/ksj-publication-guard';
import {
  isScopedGeoSourceKey,
  scopedGeoSourcePin,
} from './lib/scoped-geo-source-publication';
import {
  publishExactR2Assets,
  resolveExactAssetCandidates,
  validateR2Key,
} from './push-exact-r2-assets-core';

interface ManifestFile {
  key: string;
  bytes: number;
  sha256: string;
}

export interface ExactR2Manifest {
  sha256: string;
  files: readonly ManifestFile[];
}

const sha256 = (body: Buffer) =>
  createHash('sha256').update(body).digest('hex');

export function parseExactManifestArgs(args: readonly string[]): {
  manifestPath: string;
  manifestSha256: string;
  dryRun: boolean;
  verifyOnly: boolean;
} {
  let manifestPath = '';
  let manifestSha256 = '';
  let dryRun = false;
  let verifyOnly = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--verify-only' && !verifyOnly && !dryRun) {
      verifyOnly = true;
      continue;
    }
    if (arg === '--dry-run' && !dryRun && !verifyOnly) {
      dryRun = true;
      continue;
    }
    const [name, inline] = arg.split('=', 2);
    const value = inline ?? args[++index];
    if (!value || value.startsWith('--')) throw new Error('manifest引数不足');
    if (name === '--manifest' && !manifestPath) manifestPath = value;
    else if (name === '--manifest-sha256' && !manifestSha256)
      manifestSha256 = value;
    else throw new Error(`不明・重複・併用できないmanifest引数: ${name}`);
  }
  if (!manifestPath || !/^[a-f0-9]{64}$/.test(manifestSha256))
    throw new Error('--manifest と固定 --manifest-sha256 が必要です');
  return { manifestPath, manifestSha256, dryRun, verifyOnly };
}

export function readExactR2Manifest(
  projectRoot: string,
  manifestPath: string,
  expectedSha256: string
): ExactR2Manifest {
  const body = readFileSync(resolve(projectRoot, manifestPath));
  if (!/^[a-f0-9]{64}$/.test(expectedSha256) || sha256(body) !== expectedSha256)
    throw new Error('承認対象manifestのSHA不一致');
  const input = JSON.parse(body.toString('utf8'));
  if (
    input.schemaVersion !== 1 ||
    input.status !== 'staged-unpublished' ||
    !Array.isArray(input.files) ||
    !input.files.length
  )
    throw new Error('未検証・空のrelease manifest');
  const keys = new Set<string>();
  const files: ManifestFile[] = input.files.map((file: ManifestFile) => {
    if (
      !file ||
      typeof file.key !== 'string' ||
      validateR2Key(file.key) !== file.key ||
      keys.has(file.key) ||
      !Number.isSafeInteger(file.bytes) ||
      file.bytes < 0 ||
      typeof file.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(file.sha256) ||
      !['.json', '.geojson', '.zip'].includes(extname(file.key))
    )
      throw new Error('release manifestのkey/重複/byte/SHA/拡張子不正');
    keys.add(file.key);
    return { key: file.key, bytes: file.bytes, sha256: file.sha256 };
  });
  return { sha256: expectedSha256, files };
}

/** Sources first; manifests and user-facing references follow their leaves. */
export function exactManifestPublishPhase(key: string): number {
  if (key.startsWith('gis/')) return 0;
  if (key.startsWith('app/stats/')) return 1;
  if (key.startsWith('app/page-components/')) return 7;
  if (key.startsWith('app/ranking-items/') || key.startsWith('app/survey/'))
    return 6;
  if (key.startsWith('app/geo/')) {
    // Snow's verification pins the completed manifest and county source indexes.
    if (key === 'app/geo/population-snow-designation/verification.json') return 6;
    if (key.endsWith('/manifest.json')) return 5;
    if (key.endsWith('/item.json')) return 4;
    if (/\/source\/(?:\d{2}|index)\.json$/.test(key)) return 3;
  }
  if (key.endsWith('/source-manifest.json')) return 4;
  if (key.startsWith('app/ranking/') && key.endsWith('/item.json')) return 4;
  return 2;
}

function pinnedCandidate(projectRoot: string, file: ManifestFile) {
  const [candidate] = resolveExactAssetCandidates(projectRoot, {
    keys: [file.key],
    prefix: null,
    extensions: [],
  });
  if (candidate.sha256 !== file.sha256 || candidate.size !== file.bytes)
    throw new Error(`release manifestとlocal bytesが不一致: ${file.key}`);
  return candidate;
}

/** No network. Verify every byte and policy before exposing the first object. */
export function preflightExactR2Manifest(
  projectRoot: string,
  manifest: ExactR2Manifest
): void {
  for (const file of manifest.files) pinnedCandidate(projectRoot, file);
  const files = new Map(manifest.files.map((file) => [file.key, file]));
  const readBody = (key: string) => {
    const file = files.get(key);
    if (!file) throw new Error(`manifest外のbody参照: ${key}`);
    return pinnedCandidate(projectRoot, file).body;
  };
  assertKsjPublicAssetsAllowed([...files.keys()], readBody);
  assertBlogPublicAssetsAllowed([...files.keys()], readBody);
}

/** One release invocation; existing per-object CAS/HEAD is retained. */
export async function publishExactR2Manifest(options: {
  projectRoot: string;
  manifest: ExactR2Manifest;
  store: ImageObjectStore;
  dryRun: boolean;
}) {
  preflightExactR2Manifest(options.projectRoot, options.manifest);
  const files = [...options.manifest.files].sort(
    (a, b) =>
      exactManifestPublishPhase(a.key) - exactManifestPublishPhase(b.key) ||
      a.key.localeCompare(b.key)
  );
  const totals = {
    candidates: files.length,
    changed: 0,
    uploaded: 0,
    skipped: 0,
  };
  for (const file of files) {
    // Re-read and re-pin immediately before publishing. Never retain a 2GB batch.
    const candidate = pinnedCandidate(options.projectRoot, file);
    const result = await publishExactR2Assets({
      candidates: [candidate],
      store: options.store,
      dryRun: options.dryRun,
    });
    totals.changed += result.changed;
    totals.uploaded += result.uploaded;
    totals.skipped += result.skipped;
  }
  return {
    ...totals,
    manifestSha256: options.manifest.sha256,
    dryRun: options.dryRun,
    sourcePermissions: files
      .filter((file) => isScopedGeoSourceKey(file.key))
      .map((file) => scopedGeoSourcePin(file.key)),
  };
}
