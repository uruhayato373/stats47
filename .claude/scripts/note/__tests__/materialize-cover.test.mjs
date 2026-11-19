// materialize-cover.mjs は R2 から取り出した承認済みの表紙を一時ディレクトリへ復元する入口。
// 実行には `--experimental-test-module-mocks` が要る (package.json の note:cover-materialize:test)。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ops = (name) => fileURLToPath(new URL(`../../../../packages/ops/src/note/${name}`, import.meta.url));
const state = { ledger: null, inputError: false };
const readStoredCover = mock.fn(async () => Buffer.from('checked-image'));
const readStoredCoverInput = mock.fn(async () => {
  if (state.inputError) throw Error('private cover production evidence mismatch');
  return Buffer.from('checked-evidence');
});
// モックは読み込みより前に張る (cover-production が本物の article-ledger を先に取り込まないように)。
mock.module(ops('article-ledger.mjs'), { namedExports: { readArticleLedger: () => ({ articles: [{ key: 'pinned-intro', title: 'サイト紹介', vertical: 'stats47-note' }] }) } });
mock.module(ops('cover-storage.mjs'), { namedExports: { readStoredCover, readStoredCoverInput } });
const coverAssets = await import(ops('cover-assets.mjs'));
mock.module(ops('cover-assets.mjs'), { namedExports: { ...coverAssets, readCoverLedger: () => state.ledger } });
const { addCoverRevision, coverAssetKey, coverInputKey, coverSha, emptyCoverArticle, reviewCoverRevision } = coverAssets;
const { assertCoverPlan, buildCoverPlan, readCoverPolicies, seedCoverProduction } = await import(ops('cover-production.mjs'));

const originalArgv = process.argv;
let output;
let runs = 0;
beforeEach(() => {
  readStoredCover.mock.resetCalls(); readStoredCoverInput.mock.resetCalls(); state.inputError = false;
  process.argv = ['node', 'materialize-cover.mjs', 'pinned-intro'];
  output = mock.method(console, 'log', () => {});
  const article = { key: 'pinned-intro', title: 'サイト紹介', category: 'intro' };
  state.ledger = { schemaVersion: 1, account: 'stats47', updatedAt: new Date().toISOString(), articles: [emptyCoverArticle(article)] };
  const row = state.ledger.articles[0], policies = readCoverPolicies(); seedCoverProduction(state.ledger, [article], policies);
  row.production.brief = { headline: '地域を知る', subline: '', subject: 'ノート', evidence: '紹介文' };
  const plan = buildCoverPlan(row, article, policies);
  const sha = coverSha('checked-image'), inputSha = coverSha('checked-evidence');
  const storage = { provider: 'r2-private', bucket: 'stats47-private' };
  addCoverRevision(row, { id: sha, sha256: sha, kind: 'candidate', version: 'test-v2', createdAt: new Date().toISOString(), bytes: 13, width: 1280, height: 670,
    storage: { ...storage, key: coverAssetKey(article.key, sha) }, quality: { textBounds: 'pass', textOverlap: 'pass', evidenceSha256: inputSha },
    review: { status: 'pending', reason: null, reviewedAt: null }, provenance: { renderer: plan.renderer, sourceUrl: null, sourceSha256: null,
      production: assertCoverPlan(row, article, policies, plan), input: { storage: { ...storage, key: coverInputKey(article.key, inputSha) }, bytes: 16, sha256: inputSha } } }, { candidate: true });
  reviewCoverRevision(row, sha, 'pass', '原寸と縮小を確認');
});
afterEach(() => {
  for (const { arguments: [file] } of output.mock.calls) if (typeof file === 'string' && path.basename(file) === 'cover.png' && path.basename(path.dirname(file)).startsWith('stats47-note-cover-upload-')) fs.rmSync(path.dirname(file), { recursive: true, force: true });
  output.mock.restore(); process.argv = originalArgv;
});
// The actual upload-entry module must stop before producing any usable path (毎回新しく評価する).
const materialize = () => import(`../materialize-cover.mjs?run=${runs++}`);

test('新規記事も旧方式の承認済み画像をR2取得前に拒否する', async () => {
  state.ledger.articles[0].revisions[0].provenance.renderer = 'note-pop-cover-v1';
  await assert.rejects(materialize(), /legacy covers are read-only/);
  assert.equal(readStoredCover.mock.callCount(), 0); assert.equal(output.mock.callCount(), 0);
});
test('生成後にコピーを変えた画像を新規投稿へ渡さない', async () => {
  state.ledger.articles[0].production.brief.headline = '別の見出し';
  await assert.rejects(materialize(), /stale/);
  assert.equal(readStoredCover.mock.callCount(), 0); assert.equal(output.mock.callCount(), 0);
});
test('R2の生成根拠が検証できなければアップロード用パスを出さない', async () => {
  state.inputError = true;
  await assert.rejects(materialize(), /evidence mismatch/); assert.equal(output.mock.callCount(), 0);
});
test('採用済みの現行仕様と保存根拠を確認した画像だけを一時復元する', async () => {
  await materialize();
  assert.equal(readStoredCover.mock.callCount(), 1); assert.equal(readStoredCoverInput.mock.callCount(), 1);
  const file = output.mock.calls[0].arguments[0];
  assert.equal(fs.readFileSync(file).toString(), 'checked-image');
});
