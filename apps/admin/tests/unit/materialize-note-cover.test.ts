import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { addCoverRevision, coverAssetKey, coverInputKey, coverSha, emptyCoverArticle, reviewCoverRevision, type CoverLedger } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';
import { assertCoverPlan, buildCoverPlan, readCoverPolicies, seedCoverProduction } from '../../../../.claude/scripts/note/lib/cover-production.mjs';

const state = vi.hoisted(() => ({ ledger: null as CoverLedger | null, inputError: false }));
vi.mock('../../../../.claude/scripts/note/lib/cover-assets.mjs', async original => ({
  ...await original<typeof import('../../../../.claude/scripts/note/lib/cover-assets.mjs')>(), readCoverLedger: () => state.ledger,
}));
vi.mock('../../../../.claude/scripts/note/lib/article-ledger.mjs', () => ({ readArticleLedger: () => ({ articles: [{ key: 'pinned-intro', title: 'サイト紹介', vertical: 'stats47-note' }] }) }));
vi.mock('../../../../.claude/scripts/note/lib/cover-storage.mjs', () => ({
  readStoredCover: vi.fn(async () => Buffer.from('checked-image')),
  readStoredCoverInput: vi.fn(async () => { if (state.inputError) throw Error('private cover production evidence mismatch'); return Buffer.from('checked-evidence'); }),
}));
import { readStoredCover, readStoredCoverInput } from '../../../../.claude/scripts/note/lib/cover-storage.mjs';

const originalArgv = process.argv;
let output: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); state.inputError = false;
  process.argv = ['node', 'materialize-cover.mjs', 'pinned-intro'];
  output = vi.spyOn(console, 'log').mockImplementation(() => {});
  const article = { key: 'pinned-intro', title: 'サイト紹介', category: 'intro' };
  state.ledger = { schemaVersion: 1, account: 'stats47', updatedAt: new Date().toISOString(), articles: [emptyCoverArticle(article)] };
  const row = state.ledger.articles[0], policies = readCoverPolicies(); seedCoverProduction(state.ledger, [article], policies);
  row.production!.brief = { headline: '地域を知る', subline: '', subject: 'ノート', evidence: '紹介文' };
  const plan = buildCoverPlan(row, article, policies)!;
  const sha = coverSha('checked-image'), inputSha = coverSha('checked-evidence');
  const storage = { provider: 'r2-private' as const, bucket: 'stats47-private' as const };
  addCoverRevision(row, { id: sha, sha256: sha, kind: 'candidate', version: 'test-v2', createdAt: new Date().toISOString(), bytes: 13, width: 1280, height: 670,
    storage: { ...storage, key: coverAssetKey(article.key, sha) }, quality: { textBounds: 'pass', textOverlap: 'pass', evidenceSha256: inputSha },
    review: { status: 'pending', reason: null, reviewedAt: null }, provenance: { renderer: plan.renderer, sourceUrl: null, sourceSha256: null,
      production: assertCoverPlan(row, article, policies, plan), input: { storage: { ...storage, key: coverInputKey(article.key, inputSha) }, bytes: 16, sha256: inputSha } } }, { candidate: true });
  reviewCoverRevision(row, sha, 'pass', '原寸と縮小を確認');
});
afterEach(() => {
  for (const [file] of output.mock.calls) if (typeof file === 'string' && path.basename(file) === 'cover.png' && path.basename(path.dirname(file)).startsWith('stats47-note-cover-upload-')) fs.rmSync(path.dirname(file), { recursive: true, force: true });
  output.mockRestore(); process.argv = originalArgv;
});
// The actual upload-entry module must stop before producing any usable path.
const materialize = () => import('../../../../.claude/scripts/note/materialize-cover.mjs');
it('新規記事も旧方式の承認済み画像をR2取得前に拒否する', async () => {
  state.ledger!.articles[0].revisions[0].provenance.renderer = 'note-pop-cover-v1';
  await expect(materialize()).rejects.toThrow('legacy covers are read-only');
  expect(readStoredCover).not.toHaveBeenCalled(); expect(output).not.toHaveBeenCalled();
});
it('生成後にコピーを変えた画像を新規投稿へ渡さない', async () => {
  state.ledger!.articles[0].production!.brief!.headline = '別の見出し';
  await expect(materialize()).rejects.toThrow('stale');
  expect(readStoredCover).not.toHaveBeenCalled(); expect(output).not.toHaveBeenCalled();
});
it('R2の生成根拠が検証できなければアップロード用パスを出さない', async () => {
  state.inputError = true;
  await expect(materialize()).rejects.toThrow('evidence mismatch'); expect(output).not.toHaveBeenCalled();
});
it('採用済みの現行仕様と保存根拠を確認した画像だけを一時復元する', async () => {
  await materialize();
  expect(readStoredCover).toHaveBeenCalledOnce(); expect(readStoredCoverInput).toHaveBeenCalledOnce();
  const file = output.mock.calls[0][0] as string;
  expect(fs.readFileSync(file).toString()).toBe('checked-image');
});
