import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadContentOperations } from '@/lib/content-operations/load';

// 参考文献の展開状況は、公開ブログをページID台帳 (data/content/pages/blog.json) から数える。
// 手元の R2 の写し (.local/r2/app/blog) が無い CI でも、公開済みの記事を 0 本と数えない
// (2026-10-08〜09 に写しが無く「教材由来のブログ 0 本」と誤って報告した。ADMIN-REFERENCE-BLOG-MIRROR-01)。
describe('参考文献の展開状況のブログの数え方', () => {
  it('手元の写しの有無に関係なく、ID 台帳の公開記事から済みを数える', () => {
    const root = path.resolve(process.cwd(), '../..');
    const registry = JSON.parse(
      fs.readFileSync(path.join(root, 'data/content/pages/blog.json'), 'utf8')
    ) as { pages: Array<{ published: boolean; rankingKeys?: string[] }> };
    const publishedWithMetrics = registry.pages.filter(
      (page) => page.published && (page.rankingKeys?.length ?? 0) > 0
    ).length;
    expect(publishedWithMetrics).toBeGreaterThan(0);

    const blog = loadContentOperations(root).references.summary.byChannel.blog;
    expect(blog.integrated).toBeGreaterThan(0);
  });
});
