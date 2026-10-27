import { describe, expect, it } from 'vitest';

import { parseBlogSnapshotFrontmatter } from '../blog-snapshot-frontmatter';

describe('blog snapshot frontmatter', () => {
  it('stops on invalid quoted descriptions instead of erasing the publication date', () => {
    const source = '---\ntitle: 水インフラ\ndescription: "浄化槽という"もう一つの汚水処理""\npublished: true\npublishedAt: 2026-03-06\n---\n本文';
    expect(() => parseBlogSnapshotFrontmatter(source, 'sewerage-water-supply-gap'))
      .toThrow(/Invalid blog frontmatter \(sewerage-water-supply-gap\)/);
  });

  it('preserves the original date and quoted description after a syntax-only repair', () => {
    const description = '浄化槽という"もう一つの汚水処理"';
    const fm = parseBlogSnapshotFrontmatter(`---\ntitle: 水インフラ\ndescription: ${JSON.stringify(description)}\npublished: true\npublishedAt: 2026-03-06\n---\n本文`, 'water');
    expect(fm.description).toBe(description);
    expect(fm.published).toBe(true);
    expect(fm.publishedAt).toEqual(new Date('2026-03-06T00:00:00Z'));
  });

  it.each(['本文だけ', '---\nnull\n---\n本文', '---\n- title\n---\n本文'])('rejects missing or non-mapping metadata', (source) => {
    expect(() => parseBlogSnapshotFrontmatter(source, 'water')).toThrow(/water/);
  });
});
