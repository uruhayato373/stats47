import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArticleShell } from '../ArticleShell';

const MAIN = <p>article-content</p>;
const LEFT = <nav aria-label="article-left-rail">left</nav>;
const RIGHT = <aside aria-label="article-right-rail">right</aside>;

describe('ArticleShell — leftRail', () => {
  it('ページ内ナビを列にせず、本文の上に置く', () => {
    const { container } = render(
      <ArticleShell leftRail={LEFT}>{MAIN}</ArticleShell>
    );

    expect(screen.getByLabelText('article-left-rail')).toBeInTheDocument();
    expect(screen.getByText('article-content')).toBeInTheDocument();
    const nav = screen.getByLabelText('article-left-rail').parentElement;
    expect(nav).toHaveAttribute('data-slot', 'page-nav');
    expect(nav).not.toHaveClass('hidden');
    expect(nav).not.toHaveClass('sticky');
    expect(nav?.parentElement?.className ?? '').not.toMatch(/grid-cols/);
    expect(nav?.parentElement?.parentElement).toHaveClass('@container/shell');
    // ページで唯一の main はルートレイアウトが持つ
    expect(container.querySelector('main')).toBeNull();
  });

  it('パンくずはページ内ナビより先 (コンテナの先頭) に置く', () => {
    const { container } = render(
      <ArticleShell
        leftRail={LEFT}
        breadcrumb={<nav aria-label="crumb">crumb</nav>}
      >
        {MAIN}
      </ArticleShell>
    );
    const shell = container.querySelector('.reading-zone')?.firstElementChild;
    expect(shell?.firstElementChild).toBe(screen.getByLabelText('crumb'));
  });

  it('右レールと同時指定された場合は既存の右レール契約を優先する', () => {
    const { container } = render(
      <ArticleShell leftRail={LEFT} rail={RIGHT}>
        {MAIN}
      </ArticleShell>
    );

    expect(screen.queryByLabelText('article-left-rail')).toBeNull();
    expect(screen.getAllByLabelText('article-right-rail')).toHaveLength(2);
    expect(container.querySelector('main')).toBeNull();
    expect(
      container.querySelector('div[data-slot="shell-main"]')
    ).toHaveTextContent('article-content');
  });

  it('余白はルートの main#main-content (p-4) に任せる', () => {
    const { container } = render(<ArticleShell>{MAIN}</ArticleShell>);
    const shell = container.querySelector('.reading-zone')?.firstElementChild;
    expect(shell).toHaveClass('@container/shell');
    expect(shell).not.toHaveClass('px-4', 'py-4', 'lg:px-6');
    expect(container.querySelector('main')).toBeNull();
  });
});
