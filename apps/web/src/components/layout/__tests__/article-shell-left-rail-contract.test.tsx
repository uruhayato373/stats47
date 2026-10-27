import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArticleShell } from '../ArticleShell';

const MAIN = <p>article-content</p>;
const LEFT = <nav aria-label="article-left-rail">left</nav>;
const RIGHT = <aside aria-label="article-right-rail">right</aside>;

describe('ArticleShell — leftRail', () => {
  it('記事本文の前に共通の shell 936px+ 左レールを描く', () => {
    const { container } = render(
      <ArticleShell leftRail={LEFT}>{MAIN}</ArticleShell>
    );

    expect(screen.getByLabelText('article-left-rail')).toBeInTheDocument();
    expect(screen.getByText('article-content')).toBeInTheDocument();
    const grid =
      screen.getByLabelText('article-left-rail').parentElement?.parentElement;
    expect(grid).toHaveClass('@min-[936px]/shell:grid');
    expect(grid?.parentElement).toHaveClass('@container/shell');
    expect(
      screen.getByLabelText('article-left-rail').parentElement
    ).toHaveClass('hidden', '@min-[936px]/shell:block');
    expect(
      screen.getByLabelText('article-left-rail').parentElement
    ).not.toHaveClass('sticky');
    // ページで唯一の main はルートレイアウトが持つ
    expect(container.querySelector('main')).toBeNull();
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
