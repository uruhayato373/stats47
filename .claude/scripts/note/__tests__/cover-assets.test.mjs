import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateCoverLedger, emptyCoverArticle, coverSha, coverAssetKey, addCoverRevision, reviewCoverRevision,
  recordCoverObservation, applyCoverAudit, coverDisplayState, updateCoverLedger, readCoverLedger, adoptedCoverRevision, approvedCoverRevision } from '../lib/cover-assets.mjs';
import { storeCoverBytes, readStoredCover, storeCoverInput, readStoredCoverInput, fetchCoverSource, wranglerTokenProvider, wranglerConfigFile, retryCoverRead } from '../lib/cover-storage.mjs';
import { buildTab } from '../../lib/gallery-collectors.mjs';
import { COVER_ROOT, COVER_LEDGER_PATH, COVER_RECORDS_DIR, coverLedgerFiles, assertCoverGenerationType } from '../lib/cover-assets.mjs';

const now = '2026-10-02T00:00:00.000Z';
test('transient read recovery is bounded and never retries an uncertain POST, write, or authentication failure', async () => {
  const reset = Object.assign(Error('aborted'), { code: 'ECONNRESET' });
  const waits = [];
  let attempts = 0;
  const recovered = await retryCoverRead(async () => { attempts++; if (attempts === 1) throw reset; return { status: attempts === 2 ? 503 : 200 }; }, 'GET', async (ms) => { waits.push(ms); });
  assert.equal(recovered.status, 200); assert.equal(attempts, 3); assert.deepEqual(waits, [300, 600]);
  for (const method of ['POST', 'PUT']) {
    attempts = 0;
    await assert.rejects(retryCoverRead(async () => { attempts++; throw reset; }, method, async () => {}), /aborted/);
    assert.equal(attempts, 1);
  }
  attempts = 0;
  assert.equal((await retryCoverRead(async () => { attempts++; return { status: 401 }; })).status, 401);
  assert.equal(attempts, 1);
  attempts = 0;
  await assert.rejects(retryCoverRead(async () => { attempts++; throw reset; }, 'GET', async () => {}), /aborted/);
  assert.equal(attempts, 3);
});
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
test('frozen cover input is stored immutably and independently verified by the ledger evidence hash', async () => {
  const objects = new Map(); let writes = 0;
  const store = { get: async key => objects.get(key) ?? null, put: async (key, bytes) => { writes++; objects.set(key, Buffer.from(bytes)); } };
  const bytes = Buffer.from(JSON.stringify({ year: 2021, data: [{ value: 42 }], palette: 'YlOrRd' }));
  const input = await storeCoverInput(catalog[0].key, bytes, store);
  await storeCoverInput(catalog[0].key, bytes, store); assert.equal(writes, 1);
  const rev = revision(); rev.quality.evidenceSha256 = input.sha256; rev.provenance.input = input;
  assert.deepEqual(await readStoredCoverInput(rev, store), bytes);
  const ledger = fixture(); addCoverRevision(ledger.articles[0], rev); validateCoverLedger(ledger);
  const crossArticle = structuredClone(ledger); crossArticle.articles[0].revisions[0].provenance.input.storage.key = input.storage.key.replace(catalog[0].key, 'other-article');
  assert.throws(() => validateCoverLedger(crossArticle), /input identity/);
  objects.set(input.storage.key, Buffer.from('corrupted'));
  await assert.rejects(readStoredCoverInput(rev, store), /SHA mismatch/);
  await assert.rejects(storeCoverInput(catalog[0].key, bytes, store), /immutable remote cover conflict/);
  await assert.rejects(storeCoverInput(catalog[0].key, Buffer.from('invalid-json'), store));
});
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

test('production inputs retain the generated original and reject missing or tampered backgrounds', async () => {
  const objects = new Map();
  const store = { get: async key => objects.get(key), put: async (key, bytes) => objects.set(key, bytes) };
  const key = 'pinned-intro';
  const original = await storeCoverBytes(key, Buffer.from('generated-original'), store);
  const evidence = { background: original, backgroundSha256: original.sha256 };
  const input = await storeCoverInput(key, Buffer.from(JSON.stringify(evidence)), store);
  const image = await storeCoverBytes(key, Buffer.from('composed-image'), store);
  const revision = { ...image, quality: { evidenceSha256: input.sha256 }, provenance: { input, production: {} } };
  assert.deepEqual(JSON.parse((await readStoredCoverInput(revision, store)).toString()), evidence);
  objects.set(original.storage.key, Buffer.from('tampered'));
  await assert.rejects(readStoredCoverInput(revision, store), /background missing or SHA/);
  objects.delete(original.storage.key);
  await assert.rejects(readStoredCoverInput(revision, store), /background missing or SHA/);
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

test('wrangler login file follows wrangler per OS, so macOS reads ~/Library/Preferences', () => {
  const at = (platform, env = {}, legacy = false) => wranglerConfigFile({ platform, env, home: '/h', isDirectory: () => legacy })
    .split(path.sep).join('/');
  assert.equal(at('darwin'), '/h/Library/Preferences/.wrangler/config/default.toml');
  assert.equal(at('linux'), '/h/.config/.wrangler/config/default.toml');
  assert.equal(at('win32', { APPDATA: '/h/AppData/Roaming' }), '/h/AppData/Roaming/xdg.config/.wrangler/config/default.toml');
  assert.equal(at('darwin', { XDG_CONFIG_HOME: '/x' }), '/x/.wrangler/config/default.toml');
  assert.equal(at('darwin', {}, true), '/h/.wrangler/config/default.toml');
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
const production = { id: 'NCI-00001', policyId: 'NCP-001', policyVersion: 1, brief: null };
test('the main ledger file holds pointers only; each article keeps production and revisions in its own record and reading joins them', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cover-ledger-split-test-'));
  const stored = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  try {
    const first = revision(), second = revision('archived copy', 'published-original');
    const record = `${COVER_RECORDS_DIR}/${catalog[0].key}.json`, briefOnly = `${COVER_RECORDS_DIR}/brief-only.json`;
    await updateCoverLedger(l => {
      l.articles.push(emptyCoverArticle(catalog[0]), emptyCoverArticle({ key: 'brief-only' }), emptyCoverArticle({ key: 'nothing-yet' }));
      addCoverRevision(l.articles[0], first, { candidate: true }); addCoverRevision(l.articles[0], second);
      l.articles[1].production = production;
    }, root);
    assert.deepEqual(stored(COVER_LEDGER_PATH).articles.map(a => Object.keys(a)),
      Array(3).fill(['articleKey', 'noteUrl', 'candidateRevisionId', 'approvedRevisionId', 'published', 'missingVersions']));
    assert.equal(stored(COVER_LEDGER_PATH).articles[0].candidateRevisionId, first.id);
    assert.deepEqual(fs.readdirSync(path.join(root, COVER_RECORDS_DIR)), [`${catalog[0].key}.json`, 'brief-only.json']);
    assert.deepEqual(stored(record), { schemaVersion: 1, articleKey: catalog[0].key, revisions: [first, second] });
    assert.deepEqual(stored(briefOnly), { schemaVersion: 1, articleKey: 'brief-only', production, revisions: [] });
    const joined = readCoverLedger(root);
    assert.deepEqual(joined.articles.map(a => a.revisions.map(r => r.id)), [[first.id, second.id], [], []]);
    assert.deepEqual(joined.articles.map(a => a.production), [undefined, production, undefined]);
    assert.deepEqual(Object.keys(joined.articles[1]), ['articleKey', 'noteUrl', 'revisions', 'candidateRevisionId', 'approvedRevisionId', 'published', 'missingVersions', 'production']);
    // A pointer-only update rewrites the main file and leaves the untouched records alone.
    const stamps = () => [record, briefOnly].map(relative => fs.statSync(path.join(root, relative)).mtimeMs), before = stamps();
    await updateCoverLedger(l => observe(l), root);
    assert.deepEqual(stamps(), before);
    assert.equal(readCoverLedger(root).articles[0].published.status, 'configured');
    // A review edits a revision, so it lands in that article's record; the approval pointer lands in the main file.
    await updateCoverLedger(l => reviewCoverRevision(l.articles[0], first.id, 'pass', 'Reviewed', now), root);
    assert.equal(stored(record).revisions[0].review.status, 'pass');
    assert.equal(stored(COVER_LEDGER_PATH).articles[0].approvedRevisionId, first.id);
    assert.equal(stamps()[1], before[1]);
    // Dropping an article in an edit removes its record with it.
    await updateCoverLedger(l => { l.articles = l.articles.filter(a => a.articleKey !== catalog[0].key); }, root);
    assert.deepEqual(fs.readdirSync(path.join(root, COVER_RECORDS_DIR)), ['brief-only.json']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('the pre-split single file, an orphan record and a record under another key stop reads and writes', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cover-ledger-split-guard-test-'));
  const write = (files) => { for (const [relative, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true }); fs.writeFileSync(path.join(root, relative), text); } };
  try {
    const ledger = fixture(); addCoverRevision(ledger.articles[0], revision(), { candidate: true });
    const files = coverLedgerFiles(ledger), record = `${COVER_RECORDS_DIR}/${catalog[0].key}.json`;
    assert.deepEqual(Object.keys(files), [record, COVER_LEDGER_PATH]);
    write(files); assert.equal(readCoverLedger(root).articles[0].revisions.length, 1);
    // The pre-split layout (revisions or production inline in the main file) is refused, not read as an empty history.
    write({ [COVER_LEDGER_PATH]: JSON.stringify(ledger) });
    assert.throws(() => readCoverLedger(root), /cover ledger schema/);
    await assert.rejects(updateCoverLedger(() => {}, root), /cover ledger schema/);
    const mainOnly = JSON.parse(files[COVER_LEDGER_PATH]);
    write({ [COVER_LEDGER_PATH]: JSON.stringify({ ...mainOnly, articles: [{ ...mainOnly.articles[0], production }] }) });
    assert.throws(() => readCoverLedger(root), /cover ledger schema/);
    write(files);
    write({ [`${COVER_RECORDS_DIR}/removed-article.json`]: files[record].replace(catalog[0].key, 'removed-article') });
    assert.throws(() => readCoverLedger(root), /cover record file without ledger article: removed-article/);
    await assert.rejects(updateCoverLedger(() => {}, root), /without ledger article/);
    assert.equal(fs.existsSync(path.join(root, COVER_RECORDS_DIR, 'removed-article.json')), true);
    fs.rmSync(path.join(root, COVER_RECORDS_DIR, 'removed-article.json'));
    write({ [record]: files[record].replace(`"articleKey": "${catalog[0].key}"`, '"articleKey": "other-article"') });
    assert.throws(() => readCoverLedger(root), /cover record file identity/);
    // A pointer whose record is gone is a broken reference, not an article without revisions.
    fs.rmSync(path.join(root, record));
    assert.throws(() => readCoverLedger(root), /cover revision reference/);
    // Records without the main file are a broken checkout, not a fresh ledger.
    write(files); fs.rmSync(path.join(root, COVER_LEDGER_PATH));
    await assert.rejects(updateCoverLedger(() => {}, root), /without the main ledger/);
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
  assert.equal(adoptedCoverRevision(row).id, candidate.id);
  row.published = { status: 'configured', url: 'https://assets.st-note.com/cover.png', observedAt: now, revisionId: candidate.id };
  assert.equal(approvedCoverRevision(row), null);
  assert.equal(adoptedCoverRevision(row).id, candidate.id);
  addCoverRevision(row, revision('new unreviewed candidate'), { candidate: true });
  assert.equal(approvedCoverRevision(row), null);
  assert.equal(adoptedCoverRevision(row), null);
});
test('a temporary Windows reader lock cannot lose a verified publication or delete the old ledger', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cover-ledger-reader-test-'));
  try {
    await updateCoverLedger(l => l.articles.push(emptyCoverArticle(catalog[0])), root);
    const file = path.join(root, 'data/note/cover-assets.json'), before = fs.readFileSync(file, 'utf8');
    const rename = fs.renameSync;
    let attempts = 0;
    t.mock.method(fs, 'renameSync', (from, to) => {
      attempts++;
      if (attempts < 3) {
        assert.equal(fs.readFileSync(file, 'utf8'), before);
        assert.equal(fs.existsSync(file + '.lock'), true);
        throw Object.assign(Error('destination held by reader'), { code: 'EPERM' });
      }
      return rename(from, to);
    });
    await updateCoverLedger(l => l.articles[0].missingVersions.push('reader-lock-test'), root);
    assert.equal(attempts, 3);
    assert.deepEqual(readCoverLedger(root).articles[0].missingVersions, ['reader-lock-test']);
    assert.deepEqual(fs.readdirSync(path.dirname(file)), ['cover-assets.json']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
