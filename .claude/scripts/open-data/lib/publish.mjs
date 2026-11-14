// Run only from open-data-source-archive.yml with node --import tsx.
// Reuse the exact-key publisher core: its CLI extension allowlist excludes CSV/XLSX.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, REPORT_DIR, assertSha, readJson, sha256, validateDocument, writeJson } from './contracts.mjs';
import { entryFiles, loadSnapshot, localKey, snapshotPath, verifyEntry } from './archive.mjs';
import { R2_PRIVATE_BUCKET } from '../../lib/site-config.cjs';

export async function publishPlan({ root = ROOT, plan, store, publish }) {
  if (!Array.isArray(plan.files) || !Array.isArray(plan.snapshots)) throw Error('Invalid upload plan');
  const snapshots = [];
  const expected = [];
  for (const ref of plan.snapshots) {
    const snapshot = loadSnapshot(root, ref.datasetId);
    const entry = snapshot.versions.find((v) => v.version === ref.version);
    if (!entry) throw Error('Unknown snapshot in plan');
    await verifyEntry(root, entry);
    expected.push(...entryFiles(entry, root));
    snapshots.push({ snapshot, entry });
  }
  const sorted = (files) => [...files].sort((a, b) => a.key.localeCompare(b.key));
  if (new Set(plan.files.map((f) => f.key)).size !== plan.files.length || JSON.stringify(sorted(expected)) !== JSON.stringify(sorted(plan.files))) throw Error('Upload plan differs from verified snapshots');
  // A successful upload followed by a failed git commit must be recoverable.
  // Keep the first acquisition's timestamps when the immutable bytes and recipe agree.
  const canonicalManifests = new Map();
  const comparable = (manifest) => {
    const { retrievedAt, ...rest } = manifest;
    return { ...rest, files: manifest.files.map(({ retrievedAt, ...file }) => file) };
  };
  for (const item of snapshots) {
    const remote = await store.get(item.entry.manifestKey);
    if (!remote || sha256(remote.body) === item.entry.manifestSha256) continue;
    let manifest;
    try { manifest = JSON.parse(remote.body); }
    catch { throw Error('Remote manifest SHA/content conflict'); }
    const { manifestKey, manifestSha256, bytes, status, ...localManifest } = item.entry;
    const canonical = { ...manifest, manifestKey, manifestSha256: sha256(remote.body), bytes, status };
    validateDocument('snapshots', { datasetId: canonical.datasetId, versions: [canonical] });
    // Never accept a different source, license, recipe, or content as a retry.
    if (JSON.stringify(comparable(manifest)) !== JSON.stringify(comparable(localManifest))) throw Error('Remote manifest SHA/content conflict');
    item.entry = canonical;
    canonicalManifests.set(manifestKey, remote.body);
  }
  const files = plan.files.map((file) => canonicalManifests.has(file.key)
    ? { ...file, bytes: canonicalManifests.get(file.key).length, sha256: sha256(canonicalManifests.get(file.key)) } : file);
  // Check every remote conflict before uploading any object. Raw keys are immutable.
  const candidates = [];
  for (const file of files) {
    const body = canonicalManifests.get(file.key) ?? fs.readFileSync(localKey(root, file.key));
    assertSha(body, file.sha256);
    const remote = await store.get(file.key);
    if (remote) {
      assertSha(remote.body, file.sha256);
      if (remote.body.length !== file.bytes) throw Error('Remote byte mismatch');
      continue;
    }
    candidates.push({ ...file, size: file.bytes, body, absolutePath: localKey(root, file.key), contentEncoding: null });
  }
  const immutableStore = {
    ...store,
    put: (options) => store.put({ ...options, cacheControl: 'private, no-store', ifMatch: undefined, ifNoneMatch: '*' }),
  };
  if (candidates.length) await publish({ candidates, store: immutableStore, dryRun: false });
  for (const file of files) {
    const remote = await store.get(file.key);
    if (!remote || remote.body.length !== file.bytes) throw Error('Remote read-back missing/bytes mismatch');
    assertSha(remote.body, file.sha256);
  }
  for (const [key, body] of canonicalManifests) fs.writeFileSync(localKey(root, key), body);
  for (const { snapshot, entry } of snapshots) {
    writeJson(snapshotPath(root, snapshot.datasetId), { ...snapshot, versions: snapshot.versions.map((v) => v.version === entry.version ? { ...entry, status: 'archived' } : v) });
  }
  return { uploaded: candidates.length, verified: plan.files.length };
}

async function main() {
  const plan = readJson(path.join(ROOT, REPORT_DIR, 'upload-plan.json'));
  const guardModule = await import('../../../../packages/r2-storage/src/scripts/_assert-ci-write.ts');
  const { assertR2WriteAllowed } = guardModule.default ?? guardModule;
  assertR2WriteAllowed({ op: 'open-data-source-archive', bucket: R2_PRIVATE_BUCKET, targets: plan.files.map((f) => f.key) });
  if (process.env.CLOUDFLARE_R2_BUCKET_NAME !== R2_PRIVATE_BUCKET) throw Error('Private bucket must be explicitly selected');
  const storeModule = await import('../../../../packages/r2-storage/src/image-pipeline.ts');
  const { createS3ImageObjectStoreFromEnv } = storeModule.default ?? storeModule;
  const publisherModule = await import('../../../../packages/r2-storage/src/scripts/push-exact-r2-assets-core.ts');
  const { publishExactR2Assets } = publisherModule.default ?? publisherModule;
  const store = createS3ImageObjectStoreFromEnv();
  if (!store) throw Error('R2 S3 authentication required');
  console.log(JSON.stringify(await publishPlan({ plan, store, publish: publishExactR2Assets })));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
