// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { generateMetadata } from '../page';

describe('ブログ一覧のページ分割', () => {
  it('各ページの canonical と OGP URL が、そのページの URL を指す', async () => {
    const first = await generateMetadata({ searchParams: Promise.resolve({}) });
    const second = await generateMetadata({ searchParams: Promise.resolve({ page: '2' }) });

    expect(first.alternates?.canonical).toBe('/blog');
    expect(first.openGraph?.url).toBe('https://stats47.jp/blog');
    expect(second.alternates?.canonical).toBe('/blog?page=2');
    expect(second.openGraph?.url).toBe('https://stats47.jp/blog?page=2');
    expect(second.title).toContain('2ページ目');
  });

  it('1ページ目の別表記は同じ URL に正規化する', async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ page: '1' }) });
    expect(metadata.alternates?.canonical).toBe('/blog');
  });
});
