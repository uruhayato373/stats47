// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { readArticleMarkdownForImage } from '../blog-article-background';

// 書き直しでタイトルを変えた記事は、送り箱の新しいタイトルで背景を作らないと公開時の検査で止まり続ける。
describe('readArticleMarkdownForImage', () => {
  const root = mkdtempSync(join(tmpdir(), 'article-source-'));
  mkdirSync(join(root, 'outbox', 'rewritten'), { recursive: true });
  writeFileSync(join(root, 'outbox', 'rewritten', 'article.md'), 'title: "新しいタイトル"\n');
  const fetchPublished = async (slug: string) => `title: "公開版 ${slug}"\n`;

  it('送り箱に記事があれば、公開版ではなく送り箱の記事を読む', async () => {
    const result = await readArticleMarkdownForImage({ projectRoot: root, slug: 'rewritten', articleDir: 'outbox', fetchPublished });
    expect(result).toEqual({ markdown: 'title: "新しいタイトル"\n', origin: 'outbox' });
  });

  it('送り箱に無い記事と、送り箱を指定しないときは公開版を読む', async () => {
    const missing = await readArticleMarkdownForImage({ projectRoot: root, slug: 'other', articleDir: 'outbox', fetchPublished });
    const unset = await readArticleMarkdownForImage({ projectRoot: root, slug: 'rewritten', articleDir: null, fetchPublished });
    expect(missing).toEqual({ markdown: 'title: "公開版 other"\n', origin: 'published' });
    expect(unset).toEqual({ markdown: 'title: "公開版 rewritten"\n', origin: 'published' });
  });
});
