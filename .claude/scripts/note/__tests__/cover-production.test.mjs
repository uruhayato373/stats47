import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyCoverArticle, coverSha, coverAssetKey, coverInputKey, addCoverRevision, reviewCoverRevision, validateCoverLedger } from '../lib/cover-assets.mjs';
import { readCoverPolicies, validateCoverPolicies, latestCoverPolicy, seedCoverProduction, buildCoverPlan, coverProductionView, assertCoverPlan, assertCurrentCoverCandidate } from '../lib/cover-production.mjs';

const articles = [{ key: 'pinned-intro', title: '統計サイトの紹介', category: 'intro', noteUrl: 'https://note.com/stats47/n/n123' }];
function fixture() {
  const policies = readCoverPolicies();
  const ledger = { schemaVersion: 1, account: 'stats47', updatedAt: new Date().toISOString(), articles: articles.map(emptyCoverArticle) };
  seedCoverProduction(ledger, articles, policies);
  const row = ledger.articles[0];
  row.production.brief = { headline: '地域の違いを知る', subline: '統計で見る都道府県', subject: '資料を持つ案内役', evidence: '自己紹介記事の活動内容' };
  return { policies, ledger, row, article: articles[0] };
}
function candidate(f) {
  const plan = buildCoverPlan(f.row, f.article, f.policies), sha = coverSha('image'), inputSha = coverSha('input');
  const storage = { provider: 'r2-private', bucket: 'stats47-private' };
  return { id: sha, sha256: sha, kind: 'candidate', version: 'pop-v1', createdAt: new Date().toISOString(), bytes: 10, width: 1280, height: 670,
    storage: { ...storage, key: coverAssetKey(f.article.key, sha) },
    quality: { textBounds: 'pass', textOverlap: 'pass', evidenceSha256: inputSha }, review: { status: 'pending', reason: null, reviewedAt: null },
    provenance: { renderer: plan.renderer, sourceUrl: null, sourceSha256: null,
      production: assertCoverPlan(f.row, f.article, f.policies, plan), input: { sha256: inputSha, bytes: 10, storage: { ...storage, key: coverInputKey(f.article.key, inputSha) } } } };
}
test('8カテゴリの方針は一意なIDと版で管理し、欠落・重複・別口座を拒否する', () => {
  const policies = readCoverPolicies();
  const categories = [...new Set(policies.policies.map(p => p.category))].map(key => ({ key }));
  assert.equal(categories.length, 8);
  assert.throws(() => validateCoverPolicies({ ...policies, account: 'doboku-note' }));
  assert.throws(() => validateCoverPolicies({ ...policies, policies: policies.policies.filter(p => p.id !== 'NCP-001') }, categories), /coverage/);
  assert.throws(() => validateCoverPolicies({ ...policies, policies: [...policies.policies, policies.policies[0]] }), /duplicate/);
});
test('記事を追加・並べ替えても制作IDを振り直さず、再実行で変わらない', () => {
  const f = fixture(); const before = f.row.production.id;
  const added = { ...f.article, key: 'aaa', noteUrl: undefined };
  seedCoverProduction(f.ledger, [added, f.article], f.policies);
  assert.equal(f.row.production.id, before);
  assert.equal(f.ledger.articles[1].production.id, 'NCI-00002');
  const saved = JSON.stringify(f.ledger);
  seedCoverProduction(f.ledger, [f.article, added], f.policies);
  assert.equal(JSON.stringify(f.ledger), saved);
  f.ledger.articles[1].production.id = before;
  assert.throws(() => validateCoverLedger(f.ledger), /duplicate cover production/);
});
test('コピー・題材・根拠を固定した生成仕様を出し、書き換えを拒否する', () => {
  const f = fixture(), plan = buildCoverPlan(f.row, f.article, f.policies);
  assert.match(plan.imagePrompt, /資料を持つ案内役/);
  assert.equal(plan.composition.headline, f.row.production.brief.headline);
  assert.doesNotThrow(() => assertCoverPlan(f.row, f.article, f.policies, plan));
  assert.throws(() => assertCoverPlan(f.row, f.article, f.policies, { ...plan, evidence: '別の根拠' }), /stale/);
  f.row.production.brief.headline = '別の見出し';
  assert.throws(() => assertCoverPlan(f.row, f.article, f.policies, plan), /stale/);
});
test('公開中の旧候補の承認を新しい制作IDへ引き継がない', () => {
  const f = fixture(), revision = candidate(f);
  delete revision.provenance.production;
  addCoverRevision(f.row, revision, { candidate: true }); reviewCoverRevision(f.row, revision.id, 'pass', '旧デザイン確認');
  f.row.published = { status: 'configured', url: 'https://assets.st-note.com/old.png', observedAt: new Date().toISOString(), revisionId: revision.id };
  assert.equal(coverProductionView(f.row, f.article, f.policies).stage, 'ready');
});
test('制作・確認・修正・採用・公開の状態を同じ画像台帳から導出する', () => {
  const f = fixture(); const view = () => coverProductionView(f.row, f.article, f.policies);
  assert.equal(view().stage, 'ready');
  const revision = candidate(f); addCoverRevision(f.row, revision, { candidate: true });
  assert.equal(view().stage, 'review');
  reviewCoverRevision(f.row, revision.id, 'needs-revision', '文字が小さい'); assert.equal(view().stage, 'changes');
  reviewCoverRevision(f.row, revision.id, 'pass', '原寸と縮小を確認'); assert.equal(view().stage, 'approved');
  f.row.published = { status: 'configured', url: 'https://assets.st-note.com/new.png', observedAt: new Date().toISOString(), revisionId: revision.id };
  assert.equal(view().stage, 'published');
  reviewCoverRevision(f.row, revision.id, 'needs-revision', '公開後に修正点を発見'); assert.equal(view().stage, 'changes');
  assert.equal(f.row.published.revisionId, revision.id);
  f.row.production.brief.subject = '新しい絵'; assert.equal(view().stage, 'stale'); assert.equal(view().candidateMatches, false);
});
test('共通プロンプトまたは方針が変わると旧仕様の画像を再確認に戻す', () => {
  const f = fixture(); addCoverRevision(f.row, candidate(f), { candidate: true });
  f.policies.completePromptV2 += '\n構図変更'; assert.equal(coverProductionView(f.row, f.article, f.policies).stage, 'stale');
  const current = latestCoverPolicy(f.policies, f.article.category); f.policies.policies.push({ ...current, version: current.version + 1 });
  const plan = buildCoverPlan(f.row, f.article, f.policies);
  assert.throws(() => assertCoverPlan(f.row, f.article, f.policies, plan), /stale/);
});
test('同じ画像SHAに別のプロンプト履歴を上書きしない', () => {
  const f = fixture(), revision = candidate(f); addCoverRevision(f.row, revision, { candidate: true });
  const changed = structuredClone(revision); changed.provenance.production.planSha256 = coverSha('changed');
  assert.throws(() => addCoverRevision(f.row, changed, { candidate: true }), /provenance/);
});

test('CLIの採用・公開でも古い制作内容を拒否する', () => {
  const f = fixture(), revision = candidate(f); addCoverRevision(f.row, revision, { candidate: true });
  assert.doesNotThrow(() => assertCurrentCoverCandidate(f.row, revision.id, f));
  f.row.production.brief.evidence = '根拠を更新';
  assert.throws(() => assertCurrentCoverCandidate(f.row, revision.id, f), /stale/);
  f.row.production.brief = null;
  assert.throws(() => assertCurrentCoverCandidate(f.row, revision.id, f), /required/);
});

test('文字込み方針はコピーをプロンプトへ含め、旧版を上書きしない', () => {
  const f = fixture(); f.row.production.policyVersion = 1;
  const old = buildCoverPlan(f.row, f.article, f.policies);
  const policies = readCoverPolicies();
  assert.deepEqual(buildCoverPlan(f.row, f.article, policies), old);
  f.row.production.policyVersion = 2;
  const next = buildCoverPlan(f.row, f.article, policies);
  assert.equal(next.renderer, 'note-imagegen-cover-v1');
  assert.match(next.imagePrompt, /「地域の違いを知る」/);
  assert.match(next.imagePrompt, /「stats47」/);
  assert.equal(next.backgroundPrompt, undefined);
  assert.throws(() => assertCoverPlan(f.row, f.article, policies, old), /stale/);
});

test('全カテゴリの最新方針をimagegenに固定し、旧方式への巻き戻しを拒否する', () => {
  const policies = readCoverPolicies();
  const categories = [...new Set(policies.policies.map(p => p.category))];
  for (const category of categories) {
    const current = policies.policies.filter(p => p.category === category).at(-1);
    assert.equal(current.generation, 'imagegen-complete');
    const changed = structuredClone(policies);
    delete changed.policies.find(p => p.id === current.id && p.version === current.version).generation;
    assert.throws(() => validateCoverPolicies(changed), /must use Codex imagegen/);
  }
});

test('制作内容の無い旧記事でも旧候補の採用・再公開は通さず、公開履歴は維持する', () => {
  const f = fixture(), revision = candidate(f);
  delete revision.provenance.production;
  revision.provenance.renderer = 'bold-note-cover';
  addCoverRevision(f.row, revision, { candidate: true });
  reviewCoverRevision(f.row, revision.id, 'pass', '旧版の確認履歴');
  f.row.production.brief = null;
  const before = JSON.stringify(f.row);
  assert.throws(() => assertCurrentCoverCandidate(f.row, revision.id, f), /legacy covers are read-only/);
  assert.equal(JSON.stringify(f.row), before);
});

test('新記事と未着手記事には最新方針を適用し、編集中の制作内容とIDを保つ', () => {
  const f = fixture(); f.row.production.policyVersion = 1;
  const added = { ...f.article, key: 'new-note', noteUrl: undefined };
  seedCoverProduction(f.ledger, [f.article, added], f.policies);
  assert.equal(f.row.production.policyVersion, 1);
  assert.equal(f.ledger.articles[1].production.policyVersion, latestCoverPolicy(f.policies, f.article.category).version);
  assert.equal(f.ledger.articles[1].production.id, 'NCI-00002');
  f.row.production.brief = null;
  seedCoverProduction(f.ledger, [f.article, added], f.policies);
  assert.equal(f.row.production.policyVersion, latestCoverPolicy(f.policies, f.article.category).version);
  assert.equal(f.row.production.id, 'NCI-00001');
});
