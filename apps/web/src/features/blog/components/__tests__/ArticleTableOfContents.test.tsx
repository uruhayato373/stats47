import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ArticleTableOfContents,
  TOC_COLLAPSE_FROM,
  TOC_VISIBLE_WHEN_COLLAPSED,
} from '../ArticleTableOfContents';

const markdown = (count: number) =>
  Array.from({ length: count }, (_, i) => `## 見出し${i + 1}\n\n本文${i + 1}。`).join('\n\n');

/**
 * 長い記事の目次は先頭の数項目だけ見せて残りを開閉にする (BLOG-MOBILE-READABILITY-01 ④)。
 * スマホで目次が本文の始まりを押し下げないようにするためで、残りも HTML には全件を出す (ページ内検索・検索エンジン)。
 */
describe('ArticleTableOfContents', () => {
  it('見出しが少ない記事は全件を見せ、開閉を出さない', () => {
    const { container } = render(<ArticleTableOfContents content={markdown(TOC_COLLAPSE_FROM - 1)} />);
    expect(container.querySelector('details')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(TOC_COLLAPSE_FROM - 1);
  });

  it('見出しが多い記事は先頭だけを開いて見せ、残りを「すべての見出しを表示」の中に全件出す', () => {
    const total = TOC_COLLAPSE_FROM + 3;
    const { container } = render(<ArticleTableOfContents content={markdown(total)} />);
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details?.querySelector('summary')?.textContent).toContain(`残り ${total - TOC_VISIBLE_WHEN_COLLAPSED} 件`);
    // 開閉の外に見える項目は先頭の数件だけ
    const outside = [...container.querySelectorAll('nav > ol a')];
    expect(outside.map((a) => a.textContent)).toEqual(
      Array.from({ length: TOC_VISIBLE_WHEN_COLLAPSED }, (_, i) => `見出し${i + 1}`),
    );
    // 残りも DOM には全件ある (閉じていても検索に見える)
    expect(details?.querySelectorAll('a')).toHaveLength(total - TOC_VISIBLE_WHEN_COLLAPSED);
  });

  it('見出しが 1 件以下の記事は目次を描かない', () => {
    const { container } = render(<ArticleTableOfContents content={markdown(1)} />);
    expect(container.firstChild).toBeNull();
  });
});
