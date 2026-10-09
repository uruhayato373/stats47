// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  backgroundRecord,
  decideBlogBackgroundStatus,
} from '../blog-background-status';

// 公開時のサムネイル生成と同じ選択順 (記事固有背景 > 旧カタログ > 公開済み AI 背景の再利用) で、
// 書き直しでタイトルを変えた記事を push 前に止めることを固定する (2026-10-07 に公開 run で初めて止まった)。
const base = {
  slug: 'example',
  articlePath: 'contents/blog/example/article.md',
  hasArticleAsset: false,
  hasCodexCatalog: false,
  publishedBackground: { source: 'ai', promptHash: 'sha256-current' } as Record<string, unknown>,
  currentPromptHashes: ['sha256-current', 'sha256-legacy'],
};

describe('decideBlogBackgroundStatus', () => {
  it('git の記事固有背景か旧カタログがあれば、公開済みの背景を見ずに通す', () => {
    expect(decideBlogBackgroundStatus({ ...base, hasArticleAsset: true, publishedBackground: null }).kind).toBe('article-asset');
    expect(decideBlogBackgroundStatus({ ...base, hasCodexCatalog: true, publishedBackground: null }).kind).toBe('codex-catalog');
  });

  it('公開済み AI 背景の promptHash が今の記事 (現行版か旧版) と一致すれば通す', () => {
    expect(decideBlogBackgroundStatus(base)).toEqual({ kind: 'published-ai', ok: true });
    const legacy = decideBlogBackgroundStatus({ ...base, publishedBackground: { source: 'ai', promptHash: 'sha256-legacy' } });
    expect(legacy.ok).toBe(true);
  });

  it('タイトルを変えて promptHash が外れたら止め、Codex で作る手順を示す', () => {
    const status = decideBlogBackgroundStatus({ ...base, publishedBackground: { source: 'ai', promptHash: 'sha256-old-title' } });
    expect(status.kind).toBe('stale-ai');
    expect(status.ok).toBe(false);
    expect(status.ok === false && status.message).toContain(
      'request-article --slug example --article contents/blog/example/article.md'
    );
    expect(status.ok === false && status.message).not.toContain('--ai-background');
  });

  it('背景が無い・AI 製でない記事は止め、R2 を読めないときは止めずに知らせる', () => {
    expect(decideBlogBackgroundStatus({ ...base, publishedBackground: null }).kind).toBe('missing');
    expect(decideBlogBackgroundStatus({ ...base, publishedBackground: { source: 'brand' } }).kind).toBe('missing');
    expect(decideBlogBackgroundStatus({ ...base, publishedBackground: 'unavailable' })).toMatchObject({ kind: 'unavailable', ok: null });
  });
});

describe('backgroundRecord', () => {
  it('共通 manifest (metadata.background) と旧形式 (background) の両方から背景の記録を取り出す', () => {
    expect(backgroundRecord({ metadata: { background: { source: 'ai' } } })).toEqual({ source: 'ai' });
    expect(backgroundRecord({ background: { source: 'ai' } })).toEqual({ source: 'ai' });
    expect(backgroundRecord({ metadata: {} })).toBeNull();
    expect(backgroundRecord([])).toBeNull();
  });
});
