import { describe, expect, it, vi } from 'vitest';
import type { ImageObjectStore } from '../../../image-pipeline';
import { publishExactR2Assets } from '../../push-exact-r2-assets-core';
import { assertBlogPublicAssetsAllowed, BLOG_INDEX_KEY, blogPublicationContract, blogSnapshotWriteCondition } from '../blog-publication-guard';

const base = { articles: [{ slug: 'kept', surveyIds: ['census'] }] };
const candidate = () => ({ ...base, publication: blogPublicationContract(base) });
function store(current: unknown): ImageObjectStore {
  const object = { body: Buffer.from(JSON.stringify(current)), etag: 'base-etag', contentType: 'application/json', contentEncoding: null, contentLength: 1, metadata: {} };
  return { get: vi.fn(async () => object), head: vi.fn(async () => object), put: vi.fn(async () => {}), delete: vi.fn(async () => {}) };
}
const check = (value: unknown) => assertBlogPublicAssetsAllowed([BLOG_INDEX_KEY], () => Buffer.from(JSON.stringify(value)));

describe('shared blog index publication boundary', () => {
  it('rejects pre-guard and differently generated staging', () => {
    expect(() => check(base)).toThrow('再生成');
    expect(() => check({ ...candidate(), publication: { contractSha256: 'old' } })).toThrow('再生成');
  });
  it('accepts current generator contract', () => expect(() => check(candidate())).not.toThrow());
  it('rejects malformed rows and null snapshots without trusting JSON types', () => {
    expect(() => check(null)).toThrow('再生成');
    expect(() => check({ ...candidate(), articles: [null] })).toThrow('不正');
  });
  it('rejects retired rows even with the current generator contract', () => {
    expect(() => check({ ...candidate(), articles: [{ slug: 'dam-count-prefecture-gap' }] })).toThrow('公開終了');
  });
  it('rejects retired article assets and preserves unrelated asset handling', () => {
    expect(() => assertBlogPublicAssetsAllowed(['app/blog/dam-count-prefecture-gap/article.md'], () => Buffer.from(''))).toThrow('再送禁止');
    assertBlogPublicAssetsAllowed(['app/blog/kept/chart.svg'], () => { throw Error('should not read'); });
  });
  it('returns the generation-base ETag for conditional write', async () => {
    expect(await blogSnapshotWriteCondition(Buffer.from(JSON.stringify(candidate())), store(base))).toEqual({ ifMatch: 'base-etag' });
  });
  it('rejects another writer update, including metadata-only changes', async () => {
    await expect(blogSnapshotWriteCondition(Buffer.from(JSON.stringify(candidate())), store({ ...base, updatedAt: 'new' }))).rejects.toThrow('別writer');
  });
  it('permits idempotent readback, not stale replacement', async () => {
    const body = candidate();
    expect(await blogSnapshotWriteCondition(Buffer.from(JSON.stringify(body)), store(body))).toEqual({ ifMatch: 'base-etag' });
  });
  it('fails closed without an ETag and handles an absent initial index', async () => {
    const remote = store(base);
    const object = await remote.get(BLOG_INDEX_KEY);
    vi.mocked(remote.get).mockResolvedValue({ ...object!, etag: null });
    await expect(blogSnapshotWriteCondition(Buffer.from(JSON.stringify(candidate())), remote)).rejects.toThrow('ETag');
    vi.mocked(remote.get).mockResolvedValue(null);
    const initial = { articles: [], publication: blogPublicationContract(null) };
    expect(await blogSnapshotWriteCondition(Buffer.from(JSON.stringify(initial)), remote)).toEqual({ ifNoneMatch: '*' });
    await expect(blogSnapshotWriteCondition(Buffer.from(JSON.stringify(candidate())), remote)).rejects.toThrow('別writer');
  });
  it('fails stale mixed batches before any asset PUT', async () => {
    const remote = store({ articles: [] });
    const body = Buffer.from(JSON.stringify(candidate()));
    await expect(publishExactR2Assets({ store: remote, dryRun: false, candidates: [
      { key: 'app/blog/kept/chart.svg', body: Buffer.from('<svg/>'), absolutePath: '/tmp/chart.svg', sha256: 'x', size: 6, contentType: 'image/svg+xml', contentEncoding: null },
      { key: BLOG_INDEX_KEY, body, absolutePath: '/tmp/all.json', sha256: 'x', size: body.length, contentType: 'application/json', contentEncoding: null },
    ] })).rejects.toThrow('別writer');
    expect(remote.put).not.toHaveBeenCalled();
  });
});
