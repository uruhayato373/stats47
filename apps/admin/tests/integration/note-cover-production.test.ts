import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COVER_ROOT, coverSha, coverAssetKey, coverInputKey, emptyCoverArticle, readCoverLedger, type CoverLedger, type CoverRevision } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';
import { readCoverPolicies, seedCoverProduction, buildCoverPlan, assertCoverPlan } from '../../../../.claude/scripts/note/lib/cover-production.mjs';

const fixture = vi.hoisted(() => ({ root: '' }));
const articles = vi.hoisted(() => [{ key: 'pinned-intro', title: '統計サイトの紹介', vertical: 'stats47-note', status: 'published', noteUrl: 'https://note.com/stats47/n/n123' }]);
vi.mock('@/lib/server/project-root', () => ({ projectRoot: () => fixture.root }));
vi.mock('../../../../.claude/scripts/note/catalog', () => ({ NOTE_ARTICLES: articles }));
vi.mock('../../../../.claude/scripts/note/lib/cover-storage.mjs', () => ({ readStoredCover: vi.fn(async () => Buffer.from('image')), readStoredCoverInput: vi.fn(async () => Buffer.from('input')) }));
import { PATCH } from '@/app/api/note-covers/[key]/production/route';
import { noteCoverManagement } from '@/lib/server/note-covers';
import { readStoredCover } from '../../../../.claude/scripts/note/lib/cover-storage.mjs';

const brief = { headline: '地域の違いを知る', subline: '', subject: 'ノートと案内役', evidence: '自己紹介記事の活動内容' };
const file = () => path.join(fixture.root, 'data/note/cover-assets.json');
const view = () => noteCoverManagement().rows[0].production;
function request(body: object, headers: Record<string, string> = {}, serverHost = '127.0.0.1:4747') {
  return PATCH(new Request(`http://${serverHost}/api/note-covers/pinned-intro/production`, {
    method: 'PATCH', headers: { origin: 'http://127.0.0.1:4747', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  }), { params: Promise.resolve({ key: 'pinned-intro' }) });
}
function addCandidate() {
  const ledger = readCoverLedger(fixture.root), row = ledger.articles[0], policies = readCoverPolicies(fixture.root);
  const article = { ...articles[0], category: 'intro' }, plan = buildCoverPlan(row, article, policies)!;
  const sha = coverSha('image'), input = coverSha('input');
  const revision: CoverRevision = { id: sha, sha256: sha, kind: 'candidate', version: 'pop-v1', createdAt: new Date().toISOString(), width: 1280, height: 670, bytes: 5,
    storage: { provider: 'r2-private', bucket: 'stats47-private', key: coverAssetKey(row.articleKey, sha) },
    quality: { textBounds: 'pass', textOverlap: 'pass', evidenceSha256: input }, review: { status: 'pending', reason: null, reviewedAt: null },
    provenance: { renderer: plan.renderer, sourceUrl: null, sourceSha256: null, production: assertCoverPlan(row, article, policies, plan),
      input: { sha256: input, bytes: 5, storage: { provider: 'r2-private', bucket: 'stats47-private', key: coverInputKey(row.articleKey, input) } } } };
  row.revisions.push(revision); row.candidateRevisionId = sha;
  fs.writeFileSync(file(), JSON.stringify(ledger)); return sha;
}
describe('カバー制作と確認の保存', () => {
  beforeEach(() => {
    fixture.root = fs.mkdtempSync(path.join(os.tmpdir(), 'note-production-route-'));
    fs.mkdirSync(path.dirname(file()), { recursive: true });
    fs.copyFileSync(path.join(COVER_ROOT, 'data/note/cover-policies.json'), path.join(fixture.root, 'data/note/cover-policies.json'));
    const ledger: CoverLedger = { schemaVersion: 1, account: 'stats47', updatedAt: new Date().toISOString(), articles: articles.map(emptyCoverArticle) };
    seedCoverProduction(ledger, articles.map(a => ({ ...a, category: 'intro' })), readCoverPolicies(fixture.root));
    ledger.articles[0].published = { status: 'configured', url: 'https://assets.st-note.com/old.png', observedAt: new Date().toISOString(), revisionId: null };
    fs.writeFileSync(file(), JSON.stringify(ledger));
  });
  afterEach(() => { fs.rmSync(fixture.root, { recursive: true, force: true }); vi.clearAllMocks(); });
  it('入力を保存し、公開画像を保ったまま生成プロンプトへ接続する', async () => {
    const response = await request({ action: 'brief', revision: view().revision, brief });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.row.production.stage).toBe('ready');
    expect(data.row.production.plan.imagePrompt).toContain(brief.subject);
    expect(data.row.currentImageUrl).toBe('https://assets.st-note.com/old.png');
    expect(readStoredCover).not.toHaveBeenCalled();
  });
  it('古い画面からの保存・別origin・入力不足を拒否して台帳を保つ', async () => {
    const revision = view().revision;
    await request({ action: 'brief', revision, brief });
    const saved = fs.readFileSync(file(), 'utf8');
    expect((await request({ action: 'brief', revision, brief: { ...brief, headline: '古い入力' } })).status).toBe(409);
    expect((await request({ action: 'brief', revision: view().revision, brief }, { origin: 'https://example.com' })).status).toBe(403);
    expect((await request({ action: 'brief', revision: view().revision, brief: { ...brief, evidence: ' ' } })).status).toBe(400);
    expect(fs.readFileSync(file(), 'utf8')).toBe(saved);
  });
  it('NextがURLをlocalhostに正規化しても、ブラウザの同一originをHostで検証する', async () => {
    const edit = () => ({ action: 'brief', revision: view().revision, brief });
    expect((await request(edit(), { host: '127.0.0.1:4747' }, 'localhost:4747')).status).toBe(200);
    const saved = fs.readFileSync(file(), 'utf8');
    expect((await request(edit(), { host: 'localhost:4747' }, 'localhost:4747')).status).toBe(403);
    expect((await request(edit(), { host: 'evil.example:4747', origin: 'http://evil.example:4747' }, 'localhost:4747')).status).toBe(403);
    expect((await request(edit(), { host: '127.0.0.1:4747', 'sec-fetch-site': 'cross-site' }, 'localhost:4747')).status).toBe(403);
    expect(fs.readFileSync(file(), 'utf8')).toBe(saved);
  });
  it('現在の仕様と正確な画像版を確認して採用し、入力変更で承認を解除する', async () => {
    await request({ action: 'brief', revision: view().revision, brief });
    const sha = addCandidate();
    expect((await request({ action: 'review', revision: view().revision, candidateRevisionId: sha, status: 'pass', reason: '原寸・縮小と本文を確認した' })).status).toBe(200);
    expect(view().stage).toBe('approved');
    expect(readStoredCover).toHaveBeenCalledOnce();
    await request({ action: 'brief', revision: view().revision, brief: { ...brief, headline: '変更した見出し' } });
    expect(view().candidateMatches).toBe(false);
    expect(readCoverLedger(fixture.root).articles[0].approvedRevisionId).toBeNull();
    expect((await request({ action: 'review', revision: view().revision, candidateRevisionId: sha, status: 'pass', reason: '古い画像を採用' })).status).toBe(409);
  });
  it('壊れたremote画像を採用せず、接続エラーの秘密を返さない', async () => {
    await request({ action: 'brief', revision: view().revision, brief }); const sha = addCandidate();
    vi.mocked(readStoredCover).mockRejectedValueOnce(Error('secret-token'));
    const response = await request({ action: 'review', revision: view().revision, candidateRevisionId: sha, status: 'pass', reason: '確認' });
    expect(response.status).toBe(500); expect(await response.text()).not.toContain('secret-token');
    expect(readCoverLedger(fixture.root).articles[0].approvedRevisionId).toBeNull();
  });
});
