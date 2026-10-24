import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { coverSha, emptyCoverArticle, coverAssetKey, coverInputKey } from '../lib/cover-assets.mjs';
import { readCoverPolicies, validateCoverPolicies, latestCoverPolicy, seedCoverProduction, buildCoverPlan, coverProductionView } from '../lib/cover-production.mjs';
import { prefectureCoverReference, renderCoverReference } from '../lib/cover-geography.mjs';
import { expectedCoverText, expectedCoverChecks, prepareGeneratedCover } from '../lib/generated-cover.mjs';
import { readStoredCoverInput } from '../lib/cover-storage.mjs';

function fixture() {
  const article = { key: 'a-kakei-yamanashi', title: '甲府市の家計', category: 'household', noteUrl: 'https://note.com/stats47/n/n123' };
  const policies = readCoverPolicies(), row = emptyCoverArticle(article);
  seedCoverProduction({ articles: [row] }, [article], policies);
  row.production.brief = { headline: '山梨県の家計\n交通費に注目', subline: '甲府市・2024年\n二人以上の世帯', subject: '参照の県輪郭と小さな車', evidence: '2024年の甲府市の公開本文', dataScope: { place: '甲府市', year: '2024', households: '二人以上の世帯' } };
  return { article, policies, row };
}

test('全8分類で人物禁止・補足確認を必須とし、県別家計だけ地図主体に固定する', () => {
  const policies = readCoverPolicies();
  for (const category of new Set(policies.policies.map(p => p.category))) {
    const policy = latestCoverPolicy(policies, category);
    assert.equal(policy.visualRules.characters, 'forbidden');
    assert.ok(policy.visualRules.checks.includes('supplementReadable'));
    assert.equal(policy.visualRules.layout === 'prefecture-map', category === 'household');
    const changed = structuredClone(policies);
    delete changed.policies.find(p => p.id === policy.id && p.version === policy.version).visualRules;
    assert.throws(() => validateCoverPolicies(changed), /visual contract/);
  }
});

test('県の輪郭だけでは制作せず、都市・年・世帯区分と県名の掲載を要求する', () => {
  const f = fixture(), plan = () => buildCoverPlan(f.row, f.article, f.policies);
  assert.equal(plan().mapReference.name, '山梨県');
  assert.equal(plan().dataScope.place, '甲府市');
  delete f.row.production.brief.dataScope;
  assert.equal(plan(), null);
  assert.match(coverProductionView(f.row, f.article, f.policies).blockers.join(' '), /対象都市/);
  f.row.production.brief.dataScope = { place: '甲府市', year: '2024', households: '二人以上の世帯' };
  f.row.production.brief.subline = '2024年・二人以上の世帯';
  assert.equal(plan(), null);
  f.row.production.brief.subline = '甲府市・2024年\n二人以上の世帯';
  f.row.production.brief.headline = '東京の家計';
  assert.equal(plan(), null);
});

test('公開題名の根拠付き是正では生成時の画像計画を保持し、別題名への変更は拒否する', () => {
  const f = fixture();
  const original = buildCoverPlan(f.row, f.article, f.policies);
  f.row.production.titleCorrection = {
    generatedTitle: f.article.title,
    publishedTitle: '甲府市の家計（対象を訂正）',
    reason: '本文と一次データで対象を確認した',
  };
  f.article.title = f.row.production.titleCorrection.publishedTitle;
  assert.equal(buildCoverPlan(f.row, f.article, f.policies).planSha256, original.planSha256);
  f.article.title = '別の記事題名';
  assert.throws(() => buildCoverPlan(f.row, f.article, f.policies), /title correction mismatch/);
});

test('地図は記事キーから県を決め、別県や改変した参照を拒否する', async () => {
  const f = fixture(), plan = buildCoverPlan(f.row, f.article, f.policies);
  assert.equal(prefectureCoverReference('a-kakei-tokyo').reference.code, '13');
  assert.throws(() => prefectureCoverReference('a-kakei-unknown'), /identity/);
  await assert.rejects(renderCoverReference({ ...plan, mapReference: { ...plan.mapReference, code: '13' } }), /mismatched/);
  const png = await renderCoverReference(plan);
  assert.equal((await sharp(png).metadata()).width, 512);
  const source = await sharp({ create: { width: 1280, height: 670, channels: 3, background: '#fffdf7' } }).png().toBuffer();
  const review = { planSha256: plan.planSha256, sourceSha256: coverSha(source), tool: 'imagegen', prompt: plan.imagePrompt, checkedAt: new Date().toISOString(), original: true, thumbnailWidth: 320, textBounds: 'pass', textOverlap: 'pass', reason: 'テスト用の確認記録', transcription: expectedCoverText(plan), checks: Object.fromEntries(expectedCoverChecks(plan).map(key => [key, 'pass'])), referenceSha256: coverSha(png) };
  await assert.rejects(prepareGeneratedCover(plan, source, { ...review, checks: { ...review.checks, noCharacters: 'fail' } }, png), /category visual checks/);
  await assert.rejects(prepareGeneratedCover(plan, source, review), /reference required/);
  await assert.rejects(prepareGeneratedCover(plan, source, review, source), /reference required/);
  const prepared = await prepareGeneratedCover(plan, source, review, png);
  assert.equal(prepared.evidence.referenceImageSha256, coverSha(png));
});

test('保存した地図参照が欠落・破損した候補は公開用の読み戻しでも止まる', async () => {
  const f = fixture(), plan = buildCoverPlan(f.row, f.article, f.policies);
  const reference = await renderCoverReference(plan), source = await sharp({ create: { width: 1280, height: 670, channels: 3, background: '#fffdf7' } }).png().toBuffer();
  const asset = bytes => ({ sha256: coverSha(bytes), bytes: bytes.length, storage: { provider: 'r2-private', bucket: 'stats47-private', key: coverAssetKey(f.article.key, coverSha(bytes)) } });
  const review = { planSha256: plan.planSha256, sourceSha256: coverSha(source), tool: 'imagegen', prompt: plan.imagePrompt, checkedAt: new Date().toISOString(), original: true, thumbnailWidth: 320, textBounds: 'pass', textOverlap: 'pass', reason: 'テスト用の確認記録', transcription: expectedCoverText(plan), checks: Object.fromEntries(expectedCoverChecks(plan).map(key => [key, 'pass'])), referenceSha256: coverSha(reference) };
  const prepared = await prepareGeneratedCover(plan, source, review, reference);
  const evidence = { ...prepared.evidence, original: asset(source), referenceImage: asset(reference) }, bytes = Buffer.from(JSON.stringify(evidence)), sha = coverSha(bytes);
  const revision = { storage: asset(source).storage, quality: { evidenceSha256: sha }, provenance: { renderer: plan.renderer, production: { id: plan.productionId, policyId: plan.policyId, policyVersion: plan.policyVersion, planSha256: plan.planSha256 }, input: { sha256: sha, bytes: bytes.length, storage: { key: coverInputKey(f.article.key, sha) } } } };
  const objects = new Map([[revision.provenance.input.storage.key, bytes], [evidence.original.storage.key, source], [evidence.referenceImage.storage.key, reference]]);
  const store = { get: async key => objects.get(key) ?? null };
  await assert.doesNotReject(readStoredCoverInput(revision, store));
  objects.delete(evidence.referenceImage.storage.key);
  await assert.rejects(readStoredCoverInput(revision, store), /geographic reference missing/);
});
