import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { CANONICAL_ARTICLES } from '../src/channels/note/article-plan';
import { buildNoteRevision, validateNoteRevision } from '../src/channels/note/build/build-revision';
import { buildNoteArticle } from '../src/channels/note/build/build-note';
import { promoteAllNoteArticles, promoteNoteArticle } from '../src/channels/note/build/promote-note';

const sha = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'note-revision-'));
  const dir = join(root, '.local/coconala-products/P-01/v2-test');
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(root, '.claude/config'), { recursive: true });
  const zip = new JSZip();
  for (let i = 1; i <= 9; i++) zip.file(`ppt/slides/slide${i}.xml`, '<slide/>');
  const contents: Record<string, Buffer | string> = {
    'data.csv': 'code,name,図書館数（人口100万人当たり・館・2024）,missing\n' + Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, '0')}000,県${i + 1},${i},`).join('\n'),
    'SOURCES.csv': 'tableName,year,unit\n図書館数（人口100万人当たり）,2024,館\n',
    'LICENSE-ja.txt': '原典の利用条件を維持',
    'product.pptx': await zip.generateAsync({ type: 'nodebuffer' }),
  };
  for (const [name, bytes] of Object.entries(contents)) writeFileSync(join(dir, name), bytes);
  const manifest = { productId: 'P-01', version: 'v2-test', year: '2024', files: Object.entries(contents).map(([path, bytes]) => ({ path, bytes: Buffer.byteLength(bytes), sha256: sha(bytes) })) };
  const bytes = JSON.stringify(manifest);
  writeFileSync(join(dir, 'manifest.json'), bytes);
  const listing = { title: '検証用統計パック', _delivery: {
    artifactDirectory: '.local/coconala-products/P-01/v2-test', manifestSha256: sha(bytes),
    indicatorCount: 1, pptxIndicatorCount: 1, hasXlsx: false, officeValidation: 'owner-pending',
  } };
  writeFileSync(join(root, '.claude/config/coconala-listings.json'), JSON.stringify({ listings: { 'P-01': listing } }));
  return { root, dir, listing };
}

describe('note private revisions', () => {
  it('blocks legacy default generation and every apply route before writing', () => {
    expect(() => buildNoteArticle(CANONICAL_ARTICLES[0])).toThrow('use generate --revision');
    expect(() => promoteNoteArticle(CANONICAL_ARTICLES[0])).toThrow('promote --apply is blocked');
    expect(() => promoteNoteArticle(CANONICAL_ARTICLES[0], undefined, { dryRun: false })).toThrow('promote --apply is blocked');
    expect(() => promoteAllNoteArticles([], undefined, { dryRun: false })).toThrow('must not be overwritten');
    const outRoot = mkdtempSync(join(tmpdir(), 'note-legacy-fixture-'));
    const opts = { outRoot, coconalaRoot: join(outRoot, 'absent-inputs') };
    buildNoteArticle(CANONICAL_ARTICLES[0], undefined, opts);
    expect(() => buildNoteArticle(CANONICAL_ARTICLES[0], undefined, opts)).toThrow('never overwrite');
  });
  it('uses pinned complete delivery, retains denominator and stays publication blocked', async () => {
    const { root } = await fixture();
    const report = await buildNoteRevision({ root, revision: 'r1', articles: [CANONICAL_ARTICLES[0]] });
    const item = report.items[0];
    expect(item.sourceRevision).toBe('v2-test');
    expect(item.sourceFiles).toHaveLength(4);
    expect(item.validationErrors).toEqual([]);
    expect(item.attachments.every(a => a.sourcePath.includes('/v2-test/') && !a.verified)).toBe(true);
    expect(item.blockers).toContain('office-real-device-validation-pending');
    expect(item.blockers).toContain('semantic-review-pending');
    const draft = readFileSync(join(root, item.outDir, 'draft.md'), 'utf8');
    expect(draft).toContain('人口100万人当たり');
    expect(draft).toContain('Excel: 非同梱');
    expect(draft.match(/<!-- paid:start -->/g)).toHaveLength(1);
    expect(report.readyToPublish).toBe(false);
    expect(await validateNoteRevision('r1', root)).toEqual([]);
    writeFileSync(join(root, item.outDir, 'draft.md'), 'changed');
    expect((await validateNoteRevision('r1', root))[0]).toContain('generated file changed');
    await expect(buildNoteRevision({ root, revision: 'r1' })).rejects.toThrow('never overwrite');
  });
  it('does not fall back to old files or falsely promise a free sample', async () => {
    const { root } = await fixture();
    const free = CANONICAL_ARTICLES.find(a => a.memberProductIds[0] === 'P-13')!;
    const report = await buildNoteRevision({ root, revision: 'r2', articles: [free] });
    expect(report.items[0].missingProducts).toEqual(['P-13']);
    expect(report.items[0].attachments).toEqual([]);
    expect(readFileSync(join(root, report.items[0].outDir, 'draft.md'), 'utf8')).not.toContain('<!-- paid:start -->');
  });
  it('fails closed on tampered bytes and attaches nothing', async () => {
    const { root, dir } = await fixture();
    writeFileSync(join(dir, 'LICENSE-ja.txt'), 'tampered');
    const report = await buildNoteRevision({ root, revision: 'r3', articles: [CANONICAL_ARTICLES[0]] });
    expect(report.items[0].validationErrors[0]).toContain('artifact mismatch');
    expect(report.items[0].attachments).toEqual([]);
  });
  it('refuses an unpinned manifest and traversal revision', async () => {
    const { root, listing } = await fixture();
    listing._delivery.manifestSha256 = '';
    writeFileSync(join(root, '.claude/config/coconala-listings.json'), JSON.stringify({ listings: { 'P-01': listing } }));
    const report = await buildNoteRevision({ root, revision: 'r4', articles: [CANONICAL_ARTICLES[0]] });
    expect(report.items[0].validationErrors).toContain('pinned delivery contract missing');
    await expect(buildNoteRevision({ root, revision: '../escape' })).rejects.toThrow('invalid revision');
  });
});
