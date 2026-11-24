import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { datasetPath } from '../../../../../config/datasets.mjs';
import { restoreRecipe, main } from '../restore-source.mjs';
import { localKey, snapshotPath, verifyEntry } from '../lib/archive.mjs';
import { REPORT_DIR, sha256, writeJson } from '../lib/contracts.mjs';
import { archivedFixture, httpClient } from './fixtures.mjs';

test('restore reuses source URLs and exact manifest serialization without changing the ledger', async (t) => {
  const fixture = await archivedFixture(t);
  const { root, dataset, entry, objects } = fixture;
  const before = fs.readFileSync(snapshotPath(root, dataset.id));
  assert.equal((await restoreRecipe(fixture))[0].status, 'restored');
  for (const [key, object] of objects) assert.deepEqual(fs.readFileSync(localKey(root, key)), object.body);
  await verifyEntry(root, entry);
  assert.deepEqual(fs.readFileSync(snapshotPath(root, dataset.id)), before);
  assert.equal((await restoreRecipe(fixture))[0].status, 'restored');
});

for (const kind of ['sha', 'bytes', 'manifest']) test(`restore ${kind} mismatch leaves no version or staging files`, async (t) => {
  const fixture = await archivedFixture(t, { files: { 'first.csv': Buffer.from('good'), 'second.csv': Buffer.from('original') } });
  const { root, dataset, entry, urls } = fixture;
  if (kind === 'manifest') {
    entry.manifestSha256 = sha256('wrong manifest');
    writeJson(snapshotPath(root, dataset.id), { datasetId: dataset.id, versions: [entry] });
  } else urls.set('https://example.test/second.csv', Buffer.from(kind === 'sha' ? 'changed!' : 'longer than original'));
  const result = await restoreRecipe({ ...fixture, client: httpClient(urls) });
  assert.equal(result[0].status, 'mismatch');
  assert.equal(fs.existsSync(path.join(root, '.local/r2')), false);
});

test('failed restore preserves existing local files', async (t) => {
  const fixture = await archivedFixture(t);
  await restoreRecipe(fixture);
  fixture.urls.set(fixture.entry.files[0].url, Buffer.from('changed'));
  assert.equal((await restoreRecipe(fixture))[0].status, 'mismatch');
  for (const [key, object] of fixture.objects) assert.deepEqual(fs.readFileSync(localKey(fixture.root, key)), object.body);
});

test('restore processes every version, including a later version after a mismatch', async (t) => {
  const fixture = await archivedFixture(t);
  const { entry, root, dataset } = fixture;
  const later = structuredClone(entry);
  later.version = 'v2';
  later.manifestKey = later.manifestKey.replace('/v1/', '/v2/');
  for (const file of later.files) file.key = file.key.replace('/v1/', '/v2/');
  const { entryManifest, serializeManifest } = await import('../lib/archive.mjs');
  later.manifestSha256 = sha256(serializeManifest(entryManifest(later)));
  entry.manifestSha256 = sha256('wrong');
  writeJson(snapshotPath(root, dataset.id), { datasetId: dataset.id, versions: [entry, later] });
  assert.deepEqual((await restoreRecipe(fixture)).map((r) => r.status), ['mismatch', 'restored']);
  assert.equal(fs.existsSync(localKey(root, entry.manifestKey)), false);
  await verifyEntry(root, later);
});

for (const target of ['dataset', 'source', 'all']) test(`restore --${target} reports restoration even without a current recipe`, async (t) => {
  const fixture = await archivedFixture(t);
  writeJson(path.join(fixture.root, datasetPath('open-data.fetch-recipes')), { recipes: [] });
  const args = target === 'all' ? ['--all'] : [`--${target}`, target === 'source' ? fixture.dataset.sourceId : fixture.dataset.id];
  const report = await main(args, fixture);
  assert.equal(report.ok, true);
  assert.equal(report.results[0].status, 'restored');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(fixture.root, REPORT_DIR, 'restore.json'))), JSON.parse(JSON.stringify(report)));
});
