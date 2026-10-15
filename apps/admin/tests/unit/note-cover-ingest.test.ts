import { beforeEach, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { coverSha, emptyCoverArticle, readCoverLedger, type CoverLedger } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';
import { buildCoverPlan, readCoverPolicies, seedCoverProduction } from '../../../../.claude/scripts/note/lib/cover-production.mjs';
import { registerCoverCandidate } from '../../../../.claude/scripts/note/lib/cover-ingest.mjs';
import { readStoredCoverInput } from '../../../../.claude/scripts/note/lib/cover-storage.mjs';
import { prepareGeneratedCover, expectedCoverText, expectedCoverChecks } from '../../../../.claude/scripts/note/lib/generated-cover.mjs';

const state = vi.hoisted(() => ({ ledger: null as CoverLedger | null }));
const article = { key: 'pinned-intro', title: '統計の案内', category: 'intro', noteUrl: 'https://note.com/stats47/n/n123' };
vi.mock('../../../../.claude/scripts/note/lib/cover-assets.mjs', async (original) => ({
  ...await original<typeof import('../../../../.claude/scripts/note/lib/cover-assets.mjs')>(),
  readCoverLedger: () => state.ledger,
  updateCoverLedger: async (update: (ledger: CoverLedger) => void) => { update(state.ledger!); },
}));
vi.mock('../../../../.claude/scripts/note/lib/article-ledger.mjs', () => ({ readArticleLedger: () => ({ articles: [{ key: 'pinned-intro', title: '統計の案内', noteUrl: 'https://note.com/stats47/n/n123' }] }) }));

beforeEach(() => {
  state.ledger = { schemaVersion: 1, account: 'stats47', updatedAt: new Date().toISOString(), articles: [emptyCoverArticle(article)] };
  seedCoverProduction(state.ledger, [article], readCoverPolicies());
  state.ledger.articles[0].production!.brief = { headline: '地域を知る', subline: '', subject: 'ノート', evidence: '記事の紹介文' };
});

it('文字込み画像は目視確認を元画像SHAと結び、改変した完成画像をremote保存前に拒否する', async () => {
  const row = readCoverLedger().articles[0];
  const plan = buildCoverPlan(row, article, readCoverPolicies())!;
  const source = await sharp({ create: { width: 1734, height: 907, channels: 3, background: '#ffeecc' } }).png().toBuffer();
  const review = { planSha256: plan.planSha256, sourceSha256: coverSha(source), tool: 'imagegen', prompt: plan.imagePrompt!, checkedAt: new Date().toISOString(), original: true, thumbnailWidth: 320, textBounds: 'pass', textOverlap: 'pass', reason: '原寸と縮小で全コピーを確認', transcription: expectedCoverText(plan), checks: Object.fromEntries(expectedCoverChecks(plan).map(key => [key, 'pass'])) };
  await expect(prepareGeneratedCover(plan, source, { ...review, transcription: ['誤字'] })).rejects.toThrow('matching copy');
  await expect(prepareGeneratedCover(plan, source, { ...review, sourceSha256: 'a'.repeat(64) })).rejects.toThrow('exact-source');
  const prepared = await prepareGeneratedCover(plan, source, review);
  const objects = new Map<string, Buffer>();
  const store = { get: async (key: string) => objects.get(key) ?? null, put: vi.fn(async (key: string, value: Buffer) => { objects.set(key, value); }) };
  const quality = { textBounds: 'pass', textOverlap: 'pass' };
  const proposal = { key: article.key, noteUrl: article.noteUrl, sha256: coverSha(prepared.png), quality, evidence: prepared.evidence };
  const altered = await sharp(prepared.png).negate().png().toBuffer();
  await expect(registerCoverCandidate({ ...proposal, sha256: coverSha(altered) }, altered, 'test-complete', store, source)).rejects.toThrow('normalization mismatch');
  expect(store.put).not.toHaveBeenCalled();
  const revision = await registerCoverCandidate(proposal, prepared.png, 'test-complete', store, source);
  const input = JSON.parse((await readStoredCoverInput(revision, store))!.toString());
  expect(input.validationMethod).toBe('visual');
  expect(objects.get(input.original.storage.key)).toEqual(source);
  expect(revision.review.status).toBe('pending');
  expect(row.approvedRevisionId).toBeNull();
});

it('制作未着手でも旧方式・仕様なしのカバーをremote保存前に拒否する', async () => {
  const bytes = await sharp({ create: { width: 1280, height: 670, channels: 3, background: '#fffdf7' } }).png().toBuffer();
  const background = await sharp({ create: { width: 1280, height: 670, channels: 3, background: '#ffeecc' } }).png().toBuffer();
  const objects = new Map<string, Buffer>();
  const store = { get: async (key: string) => objects.get(key) ?? null, put: vi.fn(async (key: string, value: Buffer) => { objects.set(key, value); }) };
  const row = readCoverLedger().articles[0];
  row.production!.policyVersion = 1;
  const proposal = { key: article.key, noteUrl: article.noteUrl, sha256: coverSha(bytes), quality: { textBounds: 'pass', textOverlap: 'pass' },
    evidence: { renderer: 'note-pop-cover-v1', production: buildCoverPlan(row, article, readCoverPolicies()), backgroundSha256: coverSha(background) } };
  await expect(registerCoverCandidate(proposal, bytes, 'test-v1', store, background)).rejects.toThrow('legacy covers are read-only');
  expect(store.put).not.toHaveBeenCalled();
  row.production!.brief = null;
  await expect(registerCoverCandidate({ ...proposal, evidence: { renderer: 'bold-note-cover' } }, bytes, 'old-manifest', store)).rejects.toThrow('legacy covers are read-only');
  expect(row.candidateRevisionId).toBeNull();
  expect(row.approvedRevisionId).toBeNull();
  expect(store.put).not.toHaveBeenCalled();
});
