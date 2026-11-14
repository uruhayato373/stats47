import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, REPORT_DIR, assertPublishable, assertSha, loadCatalog, parseTarget, sha256, validateRecipes, writeJson } from '../lib/contracts.mjs';
import { expandUrls, apiHeaders } from '../lib/expand.mjs';
import { archiveRecipe, loadSnapshot, snapshotPath } from '../lib/archive.mjs';
import { createHttpClient } from '../lib/http.mjs';
import { publishPlan } from '../lib/publish.mjs';
import { mergeSnapshots } from '../lib/merge-snapshots.mjs';
import { spawnSync } from 'node:child_process';

const dataset = loadCatalog().datasets[0];
const recipe = { datasetId: dataset.id, fetch: { type: 'http-file', urls: ['https://example.test/source.csv'] }, version: 'v1', maxBytes: 64 };
function temp(t) {
  const dir = path.join(ROOT, REPORT_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const root = fs.mkdtempSync(path.join(dir, 'test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function mockClient(bytes = Buffer.from('hello')) {
  return {
    probe: async (url) => ({ url, status: 200, reachable: true, bytes: bytes.length, contentType: 'text/csv' }),
    download: async (url, file) => { fs.writeFileSync(file, bytes); return { bytes: bytes.length, sha256: sha256(bytes), contentType: 'text/csv' }; },
  };
}

test('all five fetch types expand deterministically', async () => {
  assert.deepEqual(await expandUrls(recipe.fetch), recipe.fetch.urls);
  const html = '<a href="/z.csv">z</a><a href="/a.csv?x=1&amp;y=2">a</a><a href="/z.csv">dup</a><a href="/x.pdf">pdf</a>';
  const index = { type: 'http-index', indexUrl: 'https://example.test/index', linkPattern: '\\.csv(?:\\?|$)', maxFiles: 2 };
  assert.deepEqual(await expandUrls(index, { text: async () => html }), ['https://example.test/a.csv?x=1&y=2', 'https://example.test/z.csv']);
  await assert.rejects(expandUrls({ ...index, maxFiles: 1 }, { text: async () => html }), /maxFiles/);
  await assert.rejects(expandUrls(index, { text: async () => '' }), /No matching/);
  assert.deepEqual(await expandUrls({ type: 'ckan', baseUrl: 'https://example.test', packageId: 'a b', formats: ['csv'] }, { text: async (url) => {
    assert.equal(new URL(url).searchParams.get('id'), 'a b');
    return JSON.stringify({ success: true, result: { resources: [{ format: 'CSV', url: 'https://example.test/a.csv' }, { format: 'PDF', url: 'https://example.test/b.pdf' }] } });
  } }), ['https://example.test/a.csv']);
  assert.deepEqual(await expandUrls({ type: 'api-paged', url: 'https://example.test/api?q=x', pageParam: 'p', pageSize: 10, maxPages: 2 }), ['https://example.test/api?q=x&p=1&pageSize=10', 'https://example.test/api?q=x&p=2&pageSize=10']);
  assert.deepEqual(await expandUrls({ type: 'skip' }), []);
});
test('schema rejects malformed recipes, unknown fields, unsafe URLs, duplicates and invalid patterns', () => {
  assert.doesNotThrow(() => validateRecipes({ recipes: [recipe] }));
  for (const broken of [
    { ...recipe, maxBytes: -1 }, { ...recipe, unexpected: true }, { ...recipe, version: '../escape' },
    { ...recipe, fetch: { type: 'http-file', urls: [] } },
    { ...recipe, fetch: { type: 'http-file', urls: ['https://user:secret@example.test/'] } },
    { ...recipe, fetch: { type: 'api-paged', url: 'https://example.test/', pageParam: 'p', pageSize: 0, maxPages: 1 } },
    { ...recipe, fetch: { type: 'http-index', indexUrl: 'https://example.test/', linkPattern: '[', maxFiles: 1 } },
  ]) assert.throws(() => validateRecipes({ recipes: [broken] }));
  assert.throws(() => validateRecipes({ recipes: [recipe, recipe] }), /Duplicate/);
});
test('publication and SHA checks fail closed; credentials stay in headers', () => {
  for (const license of [undefined, { commercialUse: 'unknown' }, { commercialUse: 'restricted' }]) assert.throws(() => assertPublishable({ license }), /Publication refused/);
  assert.doesNotThrow(() => assertPublishable(dataset));
  assert.throws(() => assertSha(Buffer.from('bad'), sha256('good')), /SHA/);
  assert.throws(() => apiHeaders({ type: 'api-paged', apiKeySecret: 'TEST_KEY' }, {}), /Missing API/);
  assert.deepEqual(apiHeaders({ type: 'api-paged', apiKeySecret: 'TEST_KEY' }, { TEST_KEY: 'secret' }), { authorization: 'Bearer secret' });
  assert.throws(() => parseTarget(['--all', '--apply', '--dry-run']));
  assert.throws(() => parseTarget(['--source', 'a', '--all']));
  assert.equal(parseTarget(['--all']).apply, false);
});
test('dry run probes without downloading or writing snapshots', async (t) => {
  const root = temp(t); const client = mockClient();
  client.download = () => assert.fail('dry run downloaded source');
  const result = await archiveRecipe({ recipe, dataset, client, root });
  assert.equal(result.status, 'reachable');
  assert.equal(fs.existsSync(snapshotPath(root, dataset.id)), false);
});
test('maxBytes rejects known and streamed oversized bodies, with no snapshot or partial files', async (t) => {
  const root = temp(t); const small = { ...recipe, maxBytes: 2 };
  let client = mockClient(); client.download = () => assert.fail('oversized body was requested');
  assert.equal((await archiveRecipe({ recipe: small, dataset, client, root, apply: true })).status, 'skip-too-large');
  client = mockClient(); client.probe = async () => ({ reachable: true, bytes: null });
  assert.equal((await archiveRecipe({ recipe: small, dataset, client, root, apply: true })).status, 'skip-too-large');
  assert.equal(fs.existsSync(snapshotPath(root, dataset.id)), false);
});
test('same SHA is idempotent across versions; staged retries re-emit verified keys without HTTP', async (t) => {
  const root = temp(t); const client = mockClient();
  const first = await archiveRecipe({ recipe, dataset, client, root, apply: true });
  assert.equal(first.files.length, 2);
  const retry = await archiveRecipe({ recipe, dataset, client: {}, root, apply: true });
  assert.deepEqual(retry.files, first.files);
  const duplicate = await archiveRecipe({ recipe: { ...recipe, version: 'v2' }, dataset, client, root, apply: true });
  assert.deepEqual(duplicate.files, first.files);
  assert.equal(loadSnapshot(root, dataset.id).versions.length, 1);
  const ledger = loadSnapshot(root, dataset.id);
  ledger.versions[0].status = 'archived'; writeJson(snapshotPath(root, dataset.id), ledger);
  const archived = await archiveRecipe({ recipe, dataset, client: {}, root, apply: true });
  assert.equal(archived.status, 'already-archived'); assert.deepEqual(archived.files, []);
  const crossVersion = await archiveRecipe({ recipe: { ...recipe, version: 'v3' }, dataset, client, root, apply: true });
  assert.equal(crossVersion.status, 'already-archived'); assert.deepEqual(crossVersion.files, []);
});
test('local SHA corruption prevents retry and normalization', async (t) => {
  const root = temp(t);
  const result = await archiveRecipe({ recipe, dataset, client: mockClient(), root, apply: true });
  fs.writeFileSync(path.join(root, '.local/r2', result.files[0].key), 'corrupt');
  await assert.rejects(archiveRecipe({ recipe, dataset, client: {}, root, apply: true }), /SHA/);
});
test('private publish rejects conflicting SHA before writing and marks archived only after GET verification', async (t) => {
  const root = temp(t);
  const result = await archiveRecipe({ recipe, dataset, client: mockClient(), root, apply: true });
  const plan = { files: result.files, snapshots: [{ datasetId: dataset.id, version: recipe.version }] };
  await assert.rejects(publishPlan({ root, plan, store: { get: async () => ({ body: Buffer.from('wrong') }) }, publish: () => assert.fail('conflict wrote data') }), /SHA/);
  assert.equal(loadSnapshot(root, dataset.id).versions[0].status, 'staged');
  const objects = new Map();
  const store = { get: async (key) => objects.get(key) ?? null, put: async (o) => { assert.equal(o.ifNoneMatch, '*'); objects.set(o.key, { body: o.body }); } };
  const publish = async ({ candidates, store }) => { for (const c of candidates) await store.put(c); };
  assert.equal((await publishPlan({ root, plan, store, publish })).verified, 2);
  assert.equal(loadSnapshot(root, dataset.id).versions[0].status, 'archived');
  assert.equal((await publishPlan({ root, plan, store, publish: () => assert.fail('idempotent PUT') })).uploaded, 0);
});
test('HTTP HEAD fallback cancels bodies, respects total content-range, and keeps User-Agent generic', async () => {
  const calls = [];
  const client = createHttpClient({ intervalMs: 0, sleep: async () => {}, fetchImpl: async (url, options) => {
    calls.push(options);
    assert.equal(options.headers['user-agent'], 'stats47-open-data-archiver');
    return options.method === 'HEAD' ? new Response(null, { status: 405 }) : new Response('x', { status: 206, headers: { 'content-range': 'bytes 0-0/1234', 'content-length': '1', 'content-type': 'text/csv' } });
  } });
  const result = await client.probe('https://example.test/a');
  assert.equal(result.bytes, 1234); assert.equal(calls[1].headers.range, 'bytes=0-0');
});
test('retry after upload but before git commit preserves the first manifest without overwrite', async (t) => {
  const firstRoot = temp(t); const retryRoot = temp(t);
  const first = await archiveRecipe({ recipe, dataset, client: mockClient(), root: firstRoot, apply: true, now: () => '2026-01-01T00:00:00.000Z' });
  const retry = await archiveRecipe({ recipe, dataset, client: mockClient(), root: retryRoot, apply: true, now: () => '2026-01-02T00:00:00.000Z' });
  const objects = new Map(first.files.map((f) => [f.key, { body: fs.readFileSync(path.join(firstRoot, '.local/r2', f.key)) }]));
  const plan = { files: retry.files, snapshots: [{ datasetId: dataset.id, version: recipe.version }] };
  const result = await publishPlan({ root: retryRoot, plan, store: { get: async (key) => objects.get(key) }, publish: () => assert.fail('already uploaded') });
  assert.equal(result.uploaded, 0);
  const entry = loadSnapshot(retryRoot, dataset.id).versions[0];
  assert.equal(entry.retrievedAt, '2026-01-01T00:00:00.000Z');
  assert.equal(entry.status, 'archived');
});
test('failed read-back never marks the snapshot archived', async (t) => {
  const root = temp(t);
  const result = await archiveRecipe({ recipe, dataset, client: mockClient(), root, apply: true });
  const plan = { files: result.files, snapshots: [{ datasetId: dataset.id, version: recipe.version }] };
  await assert.rejects(publishPlan({ root, plan, store: { get: async () => null }, publish: async () => {} }), /read-back/);
  assert.equal(loadSnapshot(root, dataset.id).versions[0].status, 'staged');
});
test('HTTP streaming enforces maxBytes and removes partial staging', async (t) => {
  const root = temp(t); const file = path.join(root, 'download');
  const client = createHttpClient({ intervalMs: 0, sleep: async () => {}, fetchImpl: async () => new Response('abcdef') });
  await assert.rejects(client.download('https://example.test/a', file, 2), /skip-too-large/);
  assert.equal(fs.existsSync(file), false);
});
test('same host requests are serialized through body consumption and paced', async () => {
  const intervals = []; let active = 0; let peak = 0;
  const client = createHttpClient({ intervalMs: 1000, sleep: async (ms) => { intervals.push(ms); }, fetchImpl: async () => {
    active++; peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 5)); active--;
    return new Response('ok');
  } });
  await Promise.all([client.text('https://example.test/a'), client.text('https://example.test/b')]);
  assert.equal(peak, 1); assert.ok(intervals[1] > 900);
});
test('commit-back refuses staged records and conflicting versions, and preserves existing history', async (t) => {
  const root = temp(t); const target = temp(t);
  await archiveRecipe({ recipe, dataset, client: mockClient(), root, apply: true });
  assert.throws(() => mergeSnapshots(root, target), /Unverified/);
  const ledger = loadSnapshot(root, dataset.id);
  ledger.versions[0].status = 'archived'; writeJson(snapshotPath(root, dataset.id), ledger);
  mergeSnapshots(root, target);
  mergeSnapshots(root, target);
  assert.equal(loadSnapshot(target, dataset.id).versions.length, 1);
  ledger.versions[0].sha256 = sha256('different'); writeJson(snapshotPath(root, dataset.id), ledger);
  assert.throws(() => mergeSnapshots(root, target), /Conflicting/);
});
test('raw and normalized prefixes belong only to private R2, and local R2 writes are blocked', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const clsModule = await import('./packages/r2-storage/src/scripts/r2-key-classes.ts');
    const cls = clsModule.default ?? clsModule;
    const guardModule = await import('./packages/r2-storage/src/scripts/_assert-ci-write.ts');
    const { assertR2WriteAllowed } = guardModule.default ?? guardModule;
    for (const [key, expected] of [['open-data/raw/a/v1/source.csv', 'authoritative'], ['open-data/normalized/a/v1/table.json', 'regenerable']]) {
      const classification = cls.classifyR2Key(cls.R2_PRIVATE_BUCKET, key);
      assert.equal(classification.class, expected);
      assert.equal(classification.origin, 'ci');
      assert.equal(cls.classifyR2Key(cls.R2_PUBLIC_BUCKET, key).registered, false);
      assert.throws(() => assertR2WriteAllowed({ bucket: cls.R2_PRIVATE_BUCKET, targets: [key], env: {} }), /ローカル/);
    }
  `], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
