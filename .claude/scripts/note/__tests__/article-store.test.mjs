import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import {
  blobKey, bodyBucket, buildManifest, loadArticleFiles, manifestKey, saveArticleFiles, sha256, verifyArticleStorage,
} from '../lib/article-store.mjs';

const require = createRequire(import.meta.url);
const { R2_BUCKET, R2_PRIVATE_BUCKET } = require('../../lib/site-config.cjs');

function fakeStore(bucket, { writeOnce = false } = {}) {
  const objects = new Map();
  return {
    bucket, objects,
    async get(key) { return objects.has(key) ? Buffer.from(objects.get(key)) : null; },
    async put(key, bytes) {
      if (writeOnce && objects.has(key)) throw Error('exists');
      objects.set(key, Buffer.from(bytes));
    },
    async delete(key) { objects.delete(key); },
    async list(prefix) { return [...objects].filter(([k]) => k.startsWith(prefix)).map(([key, v]) => ({ key, size: v.length })); },
  };
}
function stores(article) {
  const pub = fakeStore(R2_BUCKET);
  const priv = fakeStore(R2_PRIVATE_BUCKET);
  const archive = fakeStore(R2_PRIVATE_BUCKET, { writeOnce: true });
  return { body: article.isPaid ? priv : pub, public: pub, archive };
}
const file = (name, text) => ({ name, bytes: Buffer.from(text) });
const freeArticle = () => ({ key: 'a-test', isPaid: false, r2Path: 'note/stats47-note/a-test', body: { store: 'r2-public', manifest: null } });

test('first save uploads every file, records the manifest and reads back the same files', async () => {
  const article = freeArticle();
  const s = stores(article);
  const { record, uploaded } = await saveArticleFiles(article, [file('draft.md', 'v1'), file('images/a.svg', '<svg/>')], s);
  assert.equal(uploaded, 2);
  assert.equal(record.files, 2);
  assert.ok(s.archive.objects.has(manifestKey('a-test', record.sha256)));
  article.body.manifest = record;
  const files = await loadArticleFiles(article, s);
  assert.deepEqual(files.map((f) => [f.name, f.bytes.toString()]), [['draft.md', 'v1'], ['images/a.svg', '<svg/>']]);
  assert.deepEqual(await verifyArticleStorage(article, s, { deep: true }), []);
});

test('saving a change archives the replaced and removed files before changing R2', async () => {
  const article = freeArticle();
  const s = stores(article);
  article.body.manifest = (await saveArticleFiles(article, [file('draft.md', 'v1'), file('old.png', 'png')], s)).record;
  const { record, uploaded, removed } = await saveArticleFiles(article, [file('draft.md', 'v2')], s);
  assert.equal(uploaded, 1);
  assert.equal(removed, 1);
  assert.ok(s.archive.objects.has(blobKey(sha256(Buffer.from('v1')))), 'old draft.md is archived');
  assert.ok(s.archive.objects.has(blobKey(sha256(Buffer.from('png')))), 'removed file is archived');
  assert.equal(s.body.objects.has('note/stats47-note/a-test/old.png'), false);
  article.body.manifest = record;
  assert.deepEqual(await verifyArticleStorage(article, s), []);
});

test('a remote change made elsewhere stops the save without overwriting it', async () => {
  const article = freeArticle();
  const s = stores(article);
  article.body.manifest = (await saveArticleFiles(article, [file('draft.md', 'v1')], s)).record;
  s.body.objects.set('note/stats47-note/a-test/draft.md', Buffer.from('saved on another machine'));
  await assert.rejects(saveArticleFiles(article, [file('draft.md', 'v2')], s), /別の端末/);
  assert.equal(s.body.objects.get('note/stats47-note/a-test/draft.md').toString(), 'saved on another machine');
});

test('an interrupted save resumes exact already-written bytes without accepting other remote changes', async () => {
  const article = freeArticle();
  const s = stores(article);
  article.body.manifest = (await saveArticleFiles(article, [file('draft.md', 'v1'), file('images/a.svg', 'old')], s)).record;
  const put = s.body.put.bind(s.body);
  s.body.put = async (key, bytes) => {
    if (key.endsWith('images/a.svg')) throw Error('connection interrupted');
    return put(key, bytes);
  };
  const next = [file('draft.md', 'v2'), file('images/a.svg', 'new')];
  await assert.rejects(saveArticleFiles(article, next, s), /connection interrupted/);
  assert.equal(s.body.objects.get(`${article.r2Path}/draft.md`).toString(), 'v2');
  assert.ok(s.archive.objects.has(blobKey(sha256(Buffer.from('v1')))));
  s.body.put = put;
  const result = await saveArticleFiles(article, next, s);
  assert.equal(result.uploaded, 1);
  article.body.manifest = result.record;
  assert.deepEqual(await verifyArticleStorage(article, s, { deep: true }), []);
  s.body.objects.set(`${article.r2Path}/draft.md`, Buffer.from('unknown remote edit'));
  await assert.rejects(saveArticleFiles(article, next, s), /別の端末/);
});

test('a concurrent archive of identical old bytes is accepted, conflicting archive bytes are rejected', async () => {
  for (const matching of [true, false]) {
    const article = freeArticle();
    const s = stores(article);
    article.body.manifest = (await saveArticleFiles(article, [file('draft.md', 'v1')], s)).record;
    const put = s.archive.put.bind(s.archive);
    s.archive.put = async (key, bytes) => {
      if (key.startsWith('note-archive/blobs/')) {
        s.archive.objects.set(key, matching ? Buffer.from(bytes) : Buffer.from('different bytes'));
        throw Error('conditional write conflict');
      }
      return put(key, bytes);
    };
    const result = saveArticleFiles(article, [file('draft.md', 'v2')], s);
    if (matching) assert.equal((await result).uploaded, 1);
    else {
      await assert.rejects(result, /conditional write conflict/);
      assert.equal(s.body.objects.get(`${article.r2Path}/draft.md`).toString(), 'v1');
    }
  }
});

test('verify reports a paid body left in the public bucket and files missing from the manifest', async () => {
  const article = { key: 'p-test', isPaid: true, r2Path: 'note/koumuin-claude-code/p-test', body: { store: 'r2-private', manifest: null } };
  const s = stores(article);
  article.body.manifest = (await saveArticleFiles(article, [file('draft.md', 'paid body')], s)).record;
  s.public.objects.set('note/koumuin-claude-code/p-test/public.json', Buffer.from('{}'));
  assert.deepEqual(await verifyArticleStorage(article, s), [], 'public.json alone is the allowed sales metadata');
  s.public.objects.set('note/koumuin-claude-code/p-test/draft.md', Buffer.from('paid body'));
  s.body.objects.set('note/koumuin-claude-code/p-test/stray.png', Buffer.from('x'));
  const problems = await verifyArticleStorage(article, s);
  assert.equal(problems.length, 2);
  assert.match(problems.join('\n'), /公開 R2/);
  assert.match(problems.join('\n'), /マニフェストに無い/);
});

test('manifest rejects missing draft.md and path traversal; note-only has no R2 bucket', () => {
  assert.throws(() => buildManifest('k', [file('notes.txt', 'x')]), /draft.md/);
  assert.throws(() => buildManifest('k', [file('draft.md', 'x'), file('../escape.md', 'x')]), /不正なファイル名/);
  assert.throws(() => bodyBucket({ key: 'r', body: { store: 'note-only' } }), /note-only/);
  const a = buildManifest('k', [file('draft.md', 'x'), file('b.txt', 'y')]);
  const b = buildManifest('k', [file('b.txt', 'y'), file('draft.md', 'x')]);
  assert.equal(a.sha256, b.sha256, 'manifest SHA does not depend on input order');
});
