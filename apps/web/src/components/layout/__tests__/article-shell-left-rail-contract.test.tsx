import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArticleShell } from '../ArticleShell';

const MAIN = <p>article-content</p>;
const LEFT = <nav aria-label="article-left-rail">left</nav>;
const RIGHT = <aside aria-label="article-right-rail">right</aside>;

describe('ArticleShell — leftRail', () => {
  it('記事本文の前に共通の 992px+ 左レールを描く', () => {
    render(<ArticleShell leftRail={LEFT}>{MAIN}</ArticleShell>);

    expect(screen.getByLabelText('article-left-rail')).toBeInTheDocument();
    expect(screen.getByText('article-content')).toBeInTheDocument();
    const grid =
      screen.getByLabelText('article-left-rail').parentElement?.parentElement;
    expect(grid).toHaveClass('min-[992px]:grid');
    expect(
      screen.getByLabelText('article-left-rail').parentElement
    ).toHaveClass('hidden', 'min-[992px]:block');
    expect(
      screen.getByLabelText('article-left-rail').parentElement
    ).not.toHaveClass('sticky');
  });

  it('右レールと同時指定された場合は既存の右レール契約を優先する', () => {
    render(
      <ArticleShell leftRail={LEFT} rail={RIGHT}>
        {MAIN}
      </ArticleShell>
    );

    expect(screen.queryByLabelText('article-left-rail')).toBeNull();
    expect(screen.getAllByLabelText('article-right-rail')).toHaveLength(2);
  });
});
