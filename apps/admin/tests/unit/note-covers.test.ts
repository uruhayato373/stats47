import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCoverArticle, coverSha, coverAssetKey, type CoverLedger, type CoverRevision } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';

const fixture = vi.hoisted(() => ({ root: '', bytes: Buffer.from('remote cover') }));
const articles = vi.hoisted(() => [{ key: 'pinned-intro', title: '自己紹介', vertical: 'stats47-note', noteUrl: 'https://note.com/stats47/n/n123' }]);
vi.mock('@/lib/server/project-root', () => ({ projectRoot: () => fixture.root }));
vi.mock('../../../../.claude/scripts/note/catalog', () => ({ NOTE_ARTICLES: articles, publishedArticles: () => articles }));
vi.mock('../../../../.claude/scripts/note/lib/cover-storage.mjs', () => ({ readStoredCover: vi.fn(async () => fixture.bytes) }));
import { noteCoverManagement } from '@/lib/server/note-covers';
import { GET } from '@/app/note-cover/[key]/route';
import { readStoredCover } from '../../../../.claude/scripts/note/lib/cover-storage.mjs';

function revision(kind: CoverRevision['kind']): CoverRevision {
  const sha = coverSha(fixture.bytes);
  return { id: sha, sha256: sha, kind, version: 'test-r1', createdAt: '2026-10-02T00:00:00Z',
    storage: { provider: 'r2-private', bucket: 'stats47-private', key: coverAssetKey('pinned-intro', sha) },
    bytes: fixture.bytes.length, width: 1280, height: 670,
    ...(kind === 'candidate' ? { quality: { textBounds: 'pass', textOverlap: 'pass', evidenceSha256: sha } as const } : {}),
    review: { status: kind === 'candidate' ? 'pending' : 'not-required', reason: null, reviewedAt: null },
    provenance: { renderer: null, sourceUrl: null, sourceSha256: null } };
}
function writeLedger(change?: (ledger: CoverLedger) => void) {
  const ledger: CoverLedger = { schemaVersion: 1, account: 'stats47', updatedAt: '2026-10-02T00:00:00Z', articles: [emptyCoverArticle(articles[0])] };
  change?.(ledger);
  fs.mkdirSync(path.join(fixture.root, 'data/note'), { recursive: true });
  fs.writeFileSync(path.join(fixture.root, 'data/note/cover-assets.json'), JSON.stringify(ledger));
}
const requestImage = (sha: string, key = 'pinned-intro') => GET(new Request(`http://127.0.0.1:4747/note-cover/${key}?revision=${sha}`), { params: Promise.resolve({ key }) });

describe('共通画像台帳と非公開画像表示', () => {
  beforeEach(() => { fixture.root = fs.mkdtempSync(path.join(os.tmpdir(), 'note-cover-admin-test-')); vi.mocked(readStoredCover).mockResolvedValue(fixture.bytes); writeLedger(); });
  afterEach(() => { fs.rmSync(fixture.root, { recursive: true, force: true }); vi.clearAllMocks(); });
  it('公開画像は候補のレビューと独立して表示する', () => {
    writeLedger((l) => { l.articles[0].published = { status: 'configured', url: 'https://assets.st-note.com/public.png', observedAt: '2026-10-02T00:00:00Z', revisionId: null }; });
    expect(noteCoverManagement().rows[0]).toMatchObject({ currentImageUrl: 'https://assets.st-note.com/public.png', candidateImageUrl: null, review: 'missing' });
  });
  it('ローカル画像なしで保管済み候補を表示し、公開済みと混同しない', () => {
    const rev = revision('candidate'); writeLedger(l => { l.articles[0].revisions.push(rev); l.articles[0].candidateRevisionId = rev.id; });
    expect(noteCoverManagement().rows[0]).toMatchObject({ candidateImageUrl: `/note-cover/pinned-intro?revision=${rev.id}`, review: 'pending', publication: 'unapproved', candidateVersion: 'test-r1' });
  });
  it('未回収の旧候補を、候補なしと分ける', () => {
    writeLedger(l => l.articles[0].missingVersions.push('old-r4'));
    expect(noteCoverManagement().rows[0].review).toBe('unavailable');
  });
  it('別口座や壊れた台帳は表示を停止する', () => {
    const file = path.join(fixture.root, 'data/note/cover-assets.json');
    fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), account: 'doboku-note' }));
    expect(() => noteCoverManagement()).toThrow(/schema/);
  });
  it('台帳にある正確な版だけをキャッシュせず返す', async () => {
    const r = revision('published-original'); writeLedger(l => l.articles[0].revisions.push(r));
    const response = await requestImage(r.id);
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('no-store');
    expect(Buffer.from(await response.arrayBuffer())).toEqual(fixture.bytes);
  });
  it('他記事・不明SHA・パストラバーサルを許可しない', async () => {
    expect((await requestImage(coverSha('unknown'))).status).toBe(404);
    expect((await requestImage(coverSha('unknown'), 'other')).status).toBe(404);
    expect((await requestImage('../secret')).status).toBe(404);
    expect(readStoredCover).not.toHaveBeenCalled();
  });
  it('取得失敗を画像なしと偽らず、認証情報も返さない', async () => {
    const r = revision('published-original'); writeLedger(l => l.articles[0].revisions.push(r));
    vi.mocked(readStoredCover).mockRejectedValue(new Error('secret token example'));
    const response = await requestImage(r.id); expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('secret token');
  });
});
