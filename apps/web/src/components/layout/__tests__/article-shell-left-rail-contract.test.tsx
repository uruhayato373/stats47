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
    // 右レールは 1 回だけ描く (広告の計測画像・リンクを HTML に二重に出さない)
    expect(screen.getAllByLabelText('article-right-rail')).toHaveLength(1);
    expect(container.querySelector('main')).toBeNull();
    expect(
      container.querySelector('div[data-slot="shell-main"]')
    ).toHaveTextContent('article-content');
  });

  it('右レールは本文の後に 1 回だけ描き、狭い幅は本文の下・988px 以上は右の列にする', () => {
    const { container } = render(<ArticleShell rail={RIGHT}>{MAIN}</ArticleShell>);
    expect(screen.getAllByLabelText('article-right-rail')).toHaveLength(1);
    const rails = container.querySelectorAll('div[data-slot="shell-main"] ~ aside');
    expect(rails).toHaveLength(1);
    expect(rails[0]).not.toHaveClass('hidden');
    expect(rails[0]).toHaveClass('mt-4', '@min-[988px]/shell:mt-0', '@min-[988px]/shell:w-[316px]');
    const main = container.querySelector('div[data-slot="shell-main"]');
    expect(main?.nextElementSibling).toBe(rails[0]);
  });

  it('見出し (header) はパンくずの後・本文と右レールの列より前に全幅で置く', () => {
    const { container } = render(
      <ArticleShell
        rail={RIGHT}
        breadcrumb={<nav aria-label="crumb">crumb</nav>}
        header={<h1>title</h1>}
      >
        {MAIN}
      </ArticleShell>
    );
    const shell = container.querySelector('.reading-zone')?.firstElementChild;
    expect(shell?.children[0]).toBe(screen.getByLabelText('crumb'));
    expect(shell?.children[1]).toBe(screen.getByRole('heading', { name: 'title' }));
    // 右レールの列は見出しの後から始まる (列の中に見出しが無い)
    expect(shell?.children[2]?.querySelector('h1')).toBeNull();
    expect(shell?.children[2]?.querySelector('aside')).not.toBeNull();
  });

  it('余白はルートの main#main-content (p-4) に任せる', () => {
    const { container } = render(<ArticleShell>{MAIN}</ArticleShell>);
    const shell = container.querySelector('.reading-zone')?.firstElementChild;
    expect(shell).toHaveClass('@container/shell');
    expect(shell).not.toHaveClass('px-4', 'py-4', 'lg:px-6');
    expect(container.querySelector('main')).toBeNull();
  });
});
