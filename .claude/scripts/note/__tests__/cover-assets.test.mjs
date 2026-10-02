import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateCoverLedger, emptyCoverArticle, coverSha, coverAssetKey, addCoverRevision, reviewCoverRevision,
  recordCoverObservation, applyCoverAudit, coverDisplayState, updateCoverLedger, readCoverLedger, approvedCoverRevision } from '../lib/cover-assets.mjs';
import { storeCoverBytes, readStoredCover, fetchCoverSource, wranglerTokenProvider } from '../lib/cover-storage.mjs';
import { buildTab } from '../../lib/gallery-collectors.mjs';
import { COVER_ROOT, assertCoverGenerationType } from '../lib/cover-assets.mjs';

const now = '2026-10-02T00:00:00.000Z';
const catalog = [{ key: 'a-kakei-aichi', noteUrl: 'https://note.com/stats47/n/n123' }];
function fixture() { return { schemaVersion: 1, account: 'stats47', updatedAt: now, articles: [emptyCoverArticle(catalog[0])] }; }
function revision(text = 'candidate', kind = 'candidate') {
  const sha = coverSha(text);
  return { id: sha, sha256: sha, kind, version: 'test-r1', createdAt: now,
    storage: { provider: 'r2-private', bucket: 'stats47-private', key: coverAssetKey(catalog[0].key, sha) },
    bytes: Buffer.byteLength(text), width: 1280, height: 670,
    ...(kind === 'candidate' ? { quality: { textBounds: 'pass', textOverlap: 'pass', evidenceSha256: coverSha('source') } } : {}),
    review: { status: kind === 'candidate' ? 'pending' : 'not-required', reason: null, reviewedAt: null },
    provenance: { renderer: null, sourceUrl: null, sourceSha256: null } };
}
function observe(ledger, url = 'https://assets.st-note.com/cover.png', observedAt = now, status = 'configured') {
  recordCoverObservation(ledger, { key: catalog[0].key, noteUrl: catalog[0].noteUrl, status, url, observedAt });
}
test('schema rejects local file paths and alternate accounts/buckets', () => {
  const ledger = fixture(); const r = revision(); addCoverRevision(ledger.articles[0], r);
  for (const mutate of [l => l.account = 'doboku-note', l => l.articles[0].revisions[0].storage.bucket = 'doboku-note',
    l => l.articles[0].revisions[0].file = 'C:/old/cover.png', l => l.articles[0].revisions[0].storage.key = '../secret']) {
    const copy = structuredClone(ledger); mutate(copy); assert.throws(() => validateCoverLedger(copy));
  }
});
test('schema and catalog checks enforce complete identity and pointers', () => {
  assert.doesNotThrow(() => validateCoverLedger(fixture(), catalog));
  for (const mutate of [l => l.articles.push(structuredClone(l.articles[0])), l => l.articles[0].candidateRevisionId = coverSha('unknown'),
    l => l.articles[0].noteUrl = 'https://note.com/stats47/n/n456', l => l.articles = []]) {
    const l = fixture(); mutate(l); assert.throws(() => validateCoverLedger(l, catalog));
  }
});
test('candidate without layout evidence cannot enter ledger', () => {
  const l = fixture(), r = revision(); delete r.quality; addCoverRevision(l.articles[0], r);
  assert.throws(() => validateCoverLedger(l), /quality evidence/);
});
test('an identical archived image can be nominated without duplicate bytes or automatic approval', () => {
  const l = fixture(), row = l.articles[0];
  addCoverRevision(row, revision('same', 'published-original'));
  addCoverRevision(row, revision('same'), { candidate: true });
  assert.equal(row.revisions.length, 1); assert.equal(row.revisions[0].kind, 'candidate');
  assert.equal(row.approvedRevisionId, null); validateCoverLedger(l);
});
test('approval needs an existing exact candidate and reason; imports remain pending', () => {
  const l = fixture(), row = l.articles[0], r = revision(); addCoverRevision(row, r, { candidate: true });
  assert.equal(row.approvedRevisionId, null); assert.equal(coverDisplayState(row).publication, 'unapproved');
  assert.throws(() => reviewCoverRevision(row, r.id, 'pass', ''), /invalid/);
  reviewCoverRevision(row, r.id, 'pass', 'Visual review at 320px', now);
  assert.equal(row.approvedRevisionId, r.id); assert.equal(coverDisplayState(row).publication, 'unpublished');
  reviewCoverRevision(row, r.id, 'needs-revision', 'Text needs correction', now);
  assert.equal(row.approvedRevisionId, null); validateCoverLedger(l);
});
test('a new candidate does not inherit old approval or publication', () => {
  const l = fixture(), row = l.articles[0], old = revision(); addCoverRevision(row, old, { candidate: true });
  reviewCoverRevision(row, old.id, 'pass', 'Reviewed', now); observe(l); row.published.revisionId = old.id;
  assert.equal(coverDisplayState(row).publication, 'published');
  const fresh = revision('new candidate'); addCoverRevision(row, fresh, { candidate: true });
  assert.equal(coverDisplayState(row).publication, 'unapproved');
  assert.throws(() => reviewCoverRevision(row, old.id, 'pass', 'Stale review'), /only/);
});
test('observations ignore unknown and older records, retain query-only identity, clear changed image', () => {
  const l = fixture(), r = revision(); addCoverRevision(l.articles[0], r); observe(l); l.articles[0].published.revisionId = r.id;
  observe(l, null, '2026-10-03T00:00:00Z', 'unknown'); assert.equal(l.articles[0].published.revisionId, r.id);
  observe(l, 'https://assets.st-note.com/old.png', '2026-09-01T00:00:00Z'); assert.equal(l.articles[0].published.revisionId, r.id);
  observe(l, 'https://assets.st-note.com/cover.png?width=1280'); assert.equal(l.articles[0].published.revisionId, r.id);
  observe(l, 'https://assets.st-note.com/changed.png'); assert.equal(l.articles[0].published.revisionId, null);
});
test('missing and unrecovered are different; archive time does not refresh observation time', () => {
  const l = fixture(), row = l.articles[0]; assert.equal(coverDisplayState(row).review, 'missing');
  row.missingVersions.push('old-r1'); assert.equal(coverDisplayState(row).review, 'unavailable');
  observe(l); assert.equal(coverDisplayState(row, Date.parse(now) + 8 * 86400000).stale, true);
});
test('incomplete portfolio audit cannot replace public evidence', () => {
  const l = fixture(); observe(l);
  assert.throws(() => applyCoverAudit(l, { account: 'stats47', coverage: { complete: false }, articles: [] }), /incomplete/);
  assert.equal(l.articles[0].published.url, 'https://assets.st-note.com/cover.png');
});
test('remote store is immutable, read-back checked and tamper detected', async () => {
  const objects = new Map(); let writes = 0;
  const store = { get: async key => objects.get(key) ?? null, put: async (key, bytes) => { writes++; objects.set(key, Buffer.from(bytes)); } };
  const bytes = Buffer.from('exact bytes'); const asset = await storeCoverBytes(catalog[0].key, bytes, store);
  await storeCoverBytes(catalog[0].key, bytes, store); assert.equal(writes, 1);
  assert.deepEqual(await readStoredCover(asset, store), bytes);
  objects.set(asset.storage.key, Buffer.from('tampered')); await assert.rejects(readStoredCover(asset, store), /SHA mismatch/);
});
test('failed remote verification never reports a registered asset', async () => {
  await assert.rejects(storeCoverBytes('a-kakei-aichi', Buffer.from('bytes'), { get: async () => null, put: async () => {} }), /verification failed/);
  await assert.rejects(fetchCoverSource('https://example.com/private'), /host not allowed/);
});

test('expired remote sessions renew once for concurrent image reads and reload rotated tokens', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cover-auth-test-'));
  const config = path.join(directory, 'config.toml'); let renewals = 0;
  try {
    fs.writeFileSync(config, 'oauth_token = "old-test-token"\nexpiration_time = "2000-01-01T00:00:00Z"\n');
    const renew = async () => {
      renewals++;
      await new Promise(resolve => setTimeout(resolve, 20));
      fs.writeFileSync(config, 'oauth_token = "new-test-token"\nexpiration_time = "2100-01-01T00:00:00Z"\n');
    };
    const readers = Array.from({ length: 12 }, () => wranglerTokenProvider(config, renew));
    assert.deepEqual(await Promise.all(readers.map(read => read())), Array(12).fill('new-test-token'));
    assert.equal(renewals, 1); assert.equal(await readers[0](), 'new-test-token');
    fs.writeFileSync(config, 'api_token = "rotated-test-token"\n');
    assert.equal(await readers[0](), 'rotated-test-token'); assert.equal(renewals, 1);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('failed session renewal stops reads and does not expose credential errors', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cover-auth-test-'));
  const config = path.join(directory, 'config.toml');
  try {
    fs.writeFileSync(config, 'oauth_token = "expired-test-token"\nexpiration_time = "2000-01-01T00:00:00Z"\n');
    const read = wranglerTokenProvider(config, async () => { throw Error('sensitive test credential'); });
    await assert.rejects(read(), error => /renewal failed/.test(error.message) && !error.message.includes('sensitive'));
    await assert.rejects(wranglerTokenProvider(config, async () => {})(), /expired/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('ledger update is atomic and exclusive; validation failure leaves prior data intact', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cover-ledger-test-'));
  try {
    await updateCoverLedger(l => l.articles.push(emptyCoverArticle(catalog[0])), root);
    await assert.rejects(updateCoverLedger(l => l.account = 'other', root)); assert.equal(readCoverLedger(root).account, 'stats47');
    const lock = path.join(root, 'data/note/cover-assets.json.lock'); fs.writeFileSync(lock, '');
    await assert.rejects(updateCoverLedger(() => {}, root), /EEXIST/); fs.unlinkSync(lock);
    assert.deepEqual(fs.readdirSync(path.dirname(lock)), ['cover-assets.json']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('management and static galleries use the same ledger and never guess old R2 paths', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cover-gallery-test-'));
  try {
    await updateCoverLedger(l => { l.articles.push(emptyCoverArticle(catalog[0])); observe(l); addCoverRevision(l.articles[0], revision(), { candidate: true }); }, root);
    const options = { projectRoot: root, site: 'https://stats47.jp', r2: 'https://storage.stats47.jp' };
    const publicGallery = await buildTab('note-cover', options); const admin = await buildTab('note-cover', { ...options, privateNoteCovers: true });
    assert.equal(publicGallery.entries[0].images[0].url, 'https://assets.st-note.com/cover.png');
    assert.equal(admin.entries[0].images[1].url, `/note-cover/a-kakei-aichi?revision=${revision().id}`);
    assert.equal(publicGallery.source, admin.source); assert.ok(!JSON.stringify(admin).includes('cover-1280x670.png'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('legacy generic cover writer stops before creating a publish plan or overwriting an adopted image', () => {
  assert.throws(() => assertCoverGenerationType('note-covers'), /汎用OGP生成からの上書きは終了/);
  assert.doesNotThrow(() => assertCoverGenerationType('ranking'));
  const source = fs.readFileSync(path.join(COVER_ROOT, 'apps/web/scripts/generate-ogp-images.ts'), 'utf8');
  assert.ok(source.indexOf('assertCoverGenerationType(opts.type)') < source.indexOf('const publishPlanPath'));
});
test('cover updates cannot select a pending candidate for upload', () => {
  const l = fixture(), row = l.articles[0], candidate = revision();
  addCoverRevision(row, candidate, { candidate: true });
  assert.equal(approvedCoverRevision(row), null);
  reviewCoverRevision(row, candidate.id, 'pass', 'Reviewed', now);
  assert.equal(approvedCoverRevision(row).id, candidate.id);
  row.published = { status: 'configured', url: 'https://assets.st-note.com/cover.png', observedAt: now, revisionId: candidate.id };
  assert.equal(approvedCoverRevision(row), null);
  addCoverRevision(row, revision('new unreviewed candidate'), { candidate: true });
  assert.equal(approvedCoverRevision(row), null);
});
