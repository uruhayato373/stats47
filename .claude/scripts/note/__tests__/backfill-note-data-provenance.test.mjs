/**
 * backfill-note-data-provenance は、記事のファイル一覧を台帳のマニフェスト (private R2) から読み、
 * 結果を作業コピーへ置くだけで R2 へは書かない (保存は note:article save が台帳を通して行う)。
 * 廃止した sync-note-r2 の manifest.json と staging (.local/r2) には戻さない。
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { backfillArticle, PROVENANCE_FILE } from '../catalog/backfill-note-data-provenance.mjs';
import { buildManifest, manifestKey, readLocalFiles, saveArticleFiles, workingDir } from '../lib/article-store.mjs';

const require = createRequire(import.meta.url);
const { R2_BUCKET, R2_PRIVATE_BUCKET } = require('../../lib/site-config.cjs');
const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../catalog/backfill-note-data-provenance.mjs');

/** R2 の代わり。読んだキーと書き込みを記録する。 */
function fakeStore(bucket, { writeOnce = false } = {}) {
  const objects = new Map();
  const reads = [];
  const writes = [];
  return {
    bucket, objects, reads, writes,
    async get(key) { reads.push(key); return objects.has(key) ? Buffer.from(objects.get(key)) : null; },
    async put(key, bytes) {
      if (writeOnce && objects.has(key)) throw Error('exists');
      writes.push(`put ${key}`);
      objects.set(key, Buffer.from(bytes));
    },
    async delete(key) { writes.push(`delete ${key}`); objects.delete(key); },
    async list(prefix) { return [...objects].filter(([k]) => k.startsWith(prefix)).map(([key, v]) => ({ key, size: v.length })); },
  };
}
const file = (name, text) => ({ name, bytes: Buffer.from(text) });
const DRAFT = '# 【2024年】人口ランキング\n\n1位: 東京都（1400.0万人）\n47位: 鳥取県（54.0万人）\n\nhttps://stats47.jp/ranking/total-population\n';
const VALUES = {
  partitions: [{
    yearCode: '2024',
    values: [{ rank: 1, areaName: '東京都', value: 1400 }, { rank: 47, areaName: '鳥取県', value: 54 }],
  }],
};

/** 保存済みの記事 1 本と、その R2 の中身・一時の作業ルートを用意する。 */
async function setup(files, { isPaid = false } = {}) {
  const article = {
    key: 'a-total-population', vertical: 'stats47-note', title: '【2024年】人口ランキング', isPaid,
    r2Path: 'note/stats47-note/a-total-population', body: { store: isPaid ? 'r2-private' : 'r2-public', manifest: null },
  };
  const pub = fakeStore(R2_BUCKET);
  const priv = fakeStore(R2_PRIVATE_BUCKET);
  const stores = { body: isPaid ? priv : pub, public: pub, archive: fakeStore(R2_PRIVATE_BUCKET, { writeOnce: true }) };
  article.body.manifest = (await saveArticleFiles(article, files, stores)).record;
  for (const store of new Set(Object.values(stores))) { store.reads.length = 0; store.writes.length = 0; }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'note-provenance-backfill-'));
  const valuesRequests = [];
  const deps = {
    stores, root, known: new Set(['total-population']),
    fetchValues: async (key) => { valuesRequests.push(key); return VALUES; },
  };
  const allWrites = () => [...new Set(Object.values(stores))].flatMap((s) => s.writes);
  return { article, stores, root, deps, valuesRequests, allWrites, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test('チャートの一覧は台帳のマニフェストから取り、旧 manifest.json は読まない', async () => {
  const s = await setup([file('draft.md', DRAFT), file('images/chart-1.svg', '<svg/>'), file('images/cover-1.png', 'cover')]);
  try {
    // 廃止した sync-note-r2 が残したファイル一覧。台帳のマニフェストには無い画像を指している
    s.stores.body.objects.set(`${s.article.r2Path}/manifest.json`, Buffer.from(JSON.stringify({ files: ['draft.md', 'images/legacy-only.png'] })));
    const result = await backfillArticle(s.article, s.deps);
    assert.equal(result.status, 'confirmed');
    assert.deepEqual(result.charts, ['images/chart-1.svg'], 'カバー以外の、マニフェストにある画像だけ');
    assert.ok(s.stores.archive.reads.includes(manifestKey(s.article.key, s.article.body.manifest.sha256)), '台帳が指すマニフェストを読む');
    const everyRead = [...s.stores.body.reads, ...s.stores.public.reads, ...s.stores.archive.reads];
    assert.deepEqual(everyRead.filter((key) => key.endsWith('/manifest.json')), [], '旧 manifest.json を取りに行かない');
  } finally { s.cleanup(); }
});

test('結果は R2 へ書かず、note:article save がそのまま保存できる作業コピーへ置く', async () => {
  const s = await setup([file('draft.md', DRAFT), file('images/chart-1.svg', '<svg/>')]);
  try {
    const result = await backfillArticle(s.article, s.deps);
    assert.equal(result.output, 'working-copy');
    assert.deepEqual(s.allWrites(), [], 'R2 への put・delete は 1 回も無い');
    assert.equal(fs.existsSync(path.join(s.root, '.local')), false, '.local/r2 の staging を作らない');

    const dir = workingDir(s.article, s.root);
    const local = readLocalFiles(dir);
    assert.deepEqual(local.map((f) => f.name), [PROVENANCE_FILE, 'draft.md', 'images/chart-1.svg'], '保存済みの全ファイル + 復元マニフェスト');
    const provenance = JSON.parse(local.find((f) => f.name === PROVENANCE_FILE).bytes.toString());
    assert.equal(provenance.rankingKey, 'total-population');
    assert.equal(provenance.year, '2024');
    assert.deepEqual(provenance.charts, ['images/chart-1.svg']);

    // save 相当: 作業コピーをそのまま保存しても既存ファイルは消えず、復元マニフェストだけが増える
    const { uploaded, removed } = await saveArticleFiles(s.article, local, s.stores);
    assert.deepEqual([uploaded, removed], [1, 0]);
  } finally { s.cleanup(); }
});

test('有料記事の本文は private R2 から読む (公開 R2 の URL を叩かない)', async () => {
  const s = await setup([file('draft.md', DRAFT), file('images/chart-1.svg', '<svg/>')], { isPaid: true });
  try {
    const result = await backfillArticle(s.article, s.deps);
    assert.equal(result.status, 'confirmed');
    assert.deepEqual(s.stores.public.reads, []);
    assert.ok(s.stores.body.reads.includes(`${s.article.r2Path}/draft.md`));
  } finally { s.cleanup(); }
});

test('保存済みと同じ復元マニフェストなら作業コピーを作らない', async () => {
  const first = await setup([file('draft.md', DRAFT), file('images/chart-1.svg', '<svg/>')]);
  let provenanceText;
  try {
    await backfillArticle(first.article, first.deps);
    provenanceText = fs.readFileSync(path.join(workingDir(first.article, first.root), PROVENANCE_FILE), 'utf8');
  } finally { first.cleanup(); }
  const s = await setup([file('draft.md', DRAFT), file('images/chart-1.svg', '<svg/>'), file(PROVENANCE_FILE, provenanceText)]);
  try {
    const result = await backfillArticle(s.article, s.deps);
    assert.equal(result.output, 'unchanged');
    assert.equal(fs.existsSync(workingDir(s.article, s.root)), false);
  } finally { s.cleanup(); }
});

test('作業コピーに未保存の変更がある記事には手を付けない', async () => {
  const s = await setup([file('draft.md', DRAFT), file('images/chart-1.svg', '<svg/>')]);
  try {
    const dir = workingDir(s.article, s.root);
    fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'draft.md'), `${DRAFT}\n書きかけ\n`);
    fs.writeFileSync(path.join(dir, 'images/chart-1.svg'), '<svg/>');
    const result = await backfillArticle(s.article, s.deps);
    assert.equal(result.output, 'local-modified');
    assert.equal(fs.existsSync(path.join(dir, PROVENANCE_FILE)), false);
    assert.equal(fs.readFileSync(path.join(dir, 'draft.md'), 'utf8'), `${DRAFT}\n書きかけ\n`);
  } finally { s.cleanup(); }
});

test('前回この backfill が置いた作業コピーには、もう一度置ける', async () => {
  const s = await setup([file('draft.md', DRAFT), file('images/chart-1.svg', '<svg/>')]);
  try {
    assert.equal((await backfillArticle(s.article, s.deps)).output, 'working-copy');
    assert.equal((await backfillArticle(s.article, s.deps)).output, 'working-copy');
    const local = readLocalFiles(workingDir(s.article, s.root));
    assert.doesNotThrow(() => buildManifest(s.article.key, local));
    assert.equal(local.length, 3);
  } finally { s.cleanup(); }
});

test('本文を R2 に保存していない記事 (note のみ・未保存の下書き) は R2 を読まずに no-r2', async () => {
  const s = await setup([file('draft.md', DRAFT)]);
  try {
    for (const body of [{ store: 'note-only', manifest: null }, { store: 'r2-public', manifest: null }]) {
      const result = await backfillArticle({ ...s.article, body }, s.deps);
      assert.equal(result.status, 'no-r2');
    }
    assert.deepEqual([...s.stores.body.reads, ...s.stores.archive.reads], []);
    assert.deepEqual(s.valuesRequests, []);
  } finally { s.cleanup(); }
});

test('チャートの無い記事は no-chart、rankingKey を決められない記事は ambiguous で、どちらも何も置かない', async () => {
  const noChart = await setup([file('draft.md', DRAFT), file('images/cover-1.png', 'cover')]);
  try {
    assert.equal((await backfillArticle(noChart.article, noChart.deps)).status, 'no-chart');
    assert.equal(fs.existsSync(workingDir(noChart.article, noChart.root)), false);
  } finally { noChart.cleanup(); }
  const unknown = await setup([file('draft.md', DRAFT), file('images/chart-1.svg', '<svg/>')]);
  try {
    const result = await backfillArticle(unknown.article, { ...unknown.deps, known: new Set() });
    assert.equal(result.status, 'ambiguous');
    assert.equal(fs.existsSync(workingDir(unknown.article, unknown.root)), false);
  } finally { unknown.cleanup(); }
});

test('スクリプトに旧 manifest.json の参照・staging・R2 を直接書く手段が残っていない', () => {
  const source = fs.readFileSync(SCRIPT, 'utf8');
  assert.doesNotMatch(source, /\/manifest\.json/, '記事ディレクトリの manifest.json を読まない');
  assert.doesNotMatch(source, /\.local\/r2/, 'staging (.local/r2) へ書かない');
  assert.doesNotMatch(source, /diff-push-r2|saveArticleFiles|\.put\(|\.delete\(|wrangler/, 'R2 へ書く手段を持たない (保存は note:article save)');
});
