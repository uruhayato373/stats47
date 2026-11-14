import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { datasetDir } from '../../../../config/datasets.mjs';
import { DEFAULT_MAX_BYTES, ROOT, assertSha, readJson, safeSegment, sha256, validateDocument, writeJson } from './contracts.mjs';
import { expandUrls, apiHeaders } from './expand.mjs';
import { TooLargeError } from './http.mjs';

export const snapshotPath = (root, id) => path.join(root, datasetDir('open-data.snapshots'), `${safeSegment(id)}.json`);
export const localKey = (root, key) => {
  if (!/^open-data\/(raw|normalized)\/[A-Za-z0-9._/-]+$/.test(key) || key.split('/').some((p) => !p || p === '.' || p === '..')) throw Error('Unsafe archive key');
  return path.join(root, '.local/r2', key);
};
export function loadSnapshot(root, id) {
  const file = snapshotPath(root, id);
  if (!fs.existsSync(file)) return { datasetId: id, versions: [] };
  const snapshot = validateDocument('snapshots', readJson(file));
  if (snapshot.datasetId !== id || snapshot.versions.some((v) => v.datasetId !== id)) throw Error('Snapshot dataset mismatch');
  if (new Set(snapshot.versions.map((v) => v.version)).size !== snapshot.versions.length) throw Error('Duplicate snapshot version');
  for (const v of snapshot.versions) {
    const prefix = `open-data/raw/${id}/${v.version}/`;
    if (v.manifestKey !== `${prefix}manifest.json` || v.files.some((f) => !f.key.startsWith(prefix))) throw Error('Snapshot key mismatch');
    if (new Set(v.files.map((f) => f.key)).size !== v.files.length) throw Error('Duplicate source key');
  }
  return snapshot;
}
export async function verifyFile(file, expected) {
  const hash = createHash('sha256'); let bytes = 0;
  for await (const chunk of fs.createReadStream(file)) { hash.update(chunk); bytes += chunk.length; }
  if (bytes !== expected.bytes || hash.digest('hex') !== expected.sha256) throw Error('SHA-256/bytes mismatch');
}
export function entryFiles(entry, root) {
  return [...entry.files.map(({ key, bytes, sha256: hash, contentType }) => ({ key, bytes, sha256: hash, contentType })), {
    key: entry.manifestKey, sha256: entry.manifestSha256,
    bytes: fs.statSync(localKey(root, entry.manifestKey)).size, contentType: 'application/json',
  }];
}
export async function verifyEntry(root, entry) {
  const bytes = fs.readFileSync(localKey(root, entry.manifestKey));
  assertSha(bytes, entry.manifestSha256);
  const manifest = JSON.parse(bytes);
  const { manifestKey, manifestSha256, bytes: totalBytes, status, ...expected } = entry;
  if (JSON.stringify(manifest) !== JSON.stringify(expected)) throw Error('Manifest/ledger mismatch');
  if (entry.files.reduce((n, f) => n + f.bytes, 0) !== totalBytes) throw Error('Snapshot total bytes mismatch');
  for (const f of entry.files) await verifyFile(localKey(root, f.key), f);
  return manifest;
}

export async function archiveRecipe({ recipe, dataset, client, apply = false, root = ROOT, now = () => new Date().toISOString(), env = process.env }) {
  const id = recipe.datasetId;
  if (recipe.fetch.type === 'skip') return { datasetId: id, status: 'skip', reason: recipe.fetch.reason, note: recipe.fetch.note, files: [] };
  const version = safeSegment(recipe.version === 'latest-published-at' ? dataset.latestPublishedAt : recipe.version);
  const recipeSha256 = sha256(JSON.stringify(recipe));
  const snapshot = loadSnapshot(root, id);
  const old = snapshot.versions.find((v) => v.version === version);
  if (apply && old) {
    if (old.recipeSha256 !== recipeSha256) throw Error('Existing immutable version has a different recipe; declare a new version');
    if (old.status === 'archived') return { datasetId: id, version, status: 'already-archived', files: [] };
    await verifyEntry(root, old);
    return { datasetId: id, version, status: 'staged', files: entryFiles(old, root) };
  }
  const urls = await expandUrls(recipe.fetch, client);
  const headers = apiHeaders(recipe.fetch, env);
  const maxBytes = recipe.maxBytes ?? DEFAULT_MAX_BYTES;
  const probes = [];
  for (const url of urls) probes.push({ ...await client.probe(url, headers), sourceUrl: url });
  if (probes.some((p) => !p.reachable)) return { datasetId: id, version, status: 'unreachable', probes, files: [] };
  if (probes.reduce((n, p) => n + (p.bytes ?? 0), 0) > maxBytes) return { datasetId: id, version, status: 'skip-too-large', probes, files: [] };
  if (!apply) return { datasetId: id, version, status: 'reachable', probes, files: [] };

  const prefix = `open-data/raw/${id}/${version}`;
  const finalDir = localKey(root, prefix);
  // Orphaned local files must not be overwritten after a crash.
  if (fs.existsSync(finalDir)) throw Error('Unregistered staging directory exists; inspect it before retrying');
  fs.mkdirSync(path.dirname(finalDir), { recursive: true });
  const temp = fs.mkdtempSync(`${finalDir}.staging-`);
  try {
    const files = []; let bytes = 0;
    for (let i = 0; i < urls.length; i++) {
      const extension = path.extname(new URL(urls[i]).pathname).match(/^\.[A-Za-z0-9]+$/)?.[0] ?? '.bin';
      const name = `${String(i + 1).padStart(4, '0')}${extension}`;
      const result = await client.download(urls[i], path.join(temp, name), maxBytes - bytes, headers);
      bytes += result.bytes;
      if (bytes > maxBytes) throw new TooLargeError();
      await verifyFile(path.join(temp, name), result);
      files.push({ key: `${prefix}/${name}`, url: urls[i], sha256: result.sha256, bytes: result.bytes, contentType: result.contentType, retrievedAt: now() });
    }
    const digest = sha256(JSON.stringify(files.map((f) => [f.sha256, f.bytes]).sort()));
    const duplicate = snapshot.versions.find((v) => v.sha256 === digest);
    if (duplicate) {
      if (duplicate.status === 'staged') await verifyEntry(root, duplicate);
      return { datasetId: id, version: duplicate.version, status: duplicate.status === 'archived' ? 'already-archived' : 'staged', files: duplicate.status === 'staged' ? entryFiles(duplicate, root) : [] };
    }
    const manifest = { schemaVersion: 1, datasetId: id, version, sha256: digest, recipeSha256, retrievedAt: now(), license: structuredClone(dataset.license), files };
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    fs.writeFileSync(path.join(temp, 'manifest.json'), manifestBytes);
    const entry = { ...manifest, manifestKey: `${prefix}/manifest.json`, manifestSha256: sha256(manifestBytes), bytes, status: 'staged' };
    const updated = { ...snapshot, versions: [...snapshot.versions, entry] };
    validateDocument('snapshots', updated);
    fs.renameSync(temp, finalDir);
    writeJson(snapshotPath(root, id), updated);
    return { datasetId: id, version, status: 'staged', probes, files: entryFiles(entry, root) };
  } catch (error) {
    if (error instanceof TooLargeError) return { datasetId: id, version, status: 'skip-too-large', probes, files: [] };
    throw error;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
