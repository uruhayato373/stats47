import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageSections, PageShell } from '../PageShell';

/**
 * PageShell のレール契約。
 *
 * ★2026-10-28 (2 巡目): ページ内ナビ (leftRail) は幅で出し入れせず、どの幅でも本文の上の 1 か所に出す。
 * 旧来の「狭い幅でナビを隠す / 本文の下に積む」切替と、常に隠す代替 UI は撤去した。
 * パンくずと h1 は `header` に渡し、ページ内ナビより先に出す。
 */

const MAIN = <p>main-content</p>;
const LEFT = <nav aria-label="left-rail">left</nav>;
const RIGHT = <aside aria-label="right-rail">right</aside>;
const HEADER = <h1>page-title</h1>;

describe('PageShell — leftRail', () => {
  it('ページ内ナビは本文の上の 1 か所だけに描き、幅で隠さない', () => {
    render(<PageShell leftRail={LEFT}>{MAIN}</PageShell>);
    const rails = screen.getAllByLabelText('left-rail');
    expect(rails).toHaveLength(1);
    expect(rails[0].parentElement).toHaveAttribute('data-slot', 'page-nav');
    expect(rails[0].parentElement?.className ?? '').not.toMatch(/hidden/);
  });

  it('header (パンくず + h1) → ページ内ナビ → 本文の順に描く', () => {
    const { container } = render(
      <PageShell header={HEADER} leftRail={LEFT}>
        {MAIN}
      </PageShell>
    );
    // 見出し・ページ内ナビ・本文は 1 本の線の格子 (本文の列)。見出しはその先頭のセル
    const column = container.firstElementChild?.firstElementChild;
    expect(column).toHaveAttribute('data-slot', 'panel-grid');
    expect(column?.firstElementChild).toBe(screen.getByRole('heading', { name: 'page-title' }));
    const nav = screen.getByLabelText('left-rail');
    const heading = screen.getByRole('heading', { name: 'page-title' });
    const main = container.querySelector('div[data-slot="shell-main"]');
    expect(heading.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nav.compareDocumentPosition(main as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /**
   * ★2026-10-28: サイト全体のナビはサイドバーが持つので、ページ内ナビのために
   * サイドバーの右へもう 1 本の列を作らない。幅の境界も持たない。
   */
  it('ページ内ナビのために 2 列目を作らない', () => {
    const { container } = render(<PageShell leftRail={LEFT}>{MAIN}</PageShell>);
    const shell = container.firstElementChild;
    expect(shell).toHaveClass('@container/shell');
    const layout = shell?.firstElementChild;
    expect(layout?.className ?? '').not.toMatch(/grid-cols/);
    expect(layout?.firstElementChild).toHaveAttribute('data-slot', 'page-nav');
  });

  it('leftRail と rightRail を同時に渡すと右が勝ち、左は描かれない', () => {
    render(
      <PageShell leftRail={LEFT} rightRail={RIGHT}>
        {MAIN}
      </PageShell>
    );
    expect(screen.queryByLabelText('left-rail')).toBeNull();
    expect(screen.getAllByLabelText('right-rail').length).toBeGreaterThan(0);
  });

  it('レール無しでも本文を描く', () => {
    render(<PageShell>{MAIN}</PageShell>);
    expect(screen.getByText('main-content')).toBeInTheDocument();
    expect(screen.queryByLabelText('left-rail')).toBeNull();
  });

  it('余白はルートの main#main-content (p-4) に任せ、main を入れ子にしない', () => {
    const { container } = render(
      <PageShell leftRail={LEFT}>{MAIN}</PageShell>
    );
    const shell = container.firstElementChild;
    expect(shell).not.toHaveClass('px-4', 'py-4', 'lg:px-6');
    expect(container.querySelector('main')).toBeNull();
    expect(
      container.querySelector('div[data-slot="shell-main"]')
    ).toHaveTextContent('main-content');
  });
});

describe('PageShell — rightRail', () => {
  it('同じレールを複製せず、狭幅では本文下・shell 988px 以上では右列に置く', () => {
    render(<PageShell rightRail={RIGHT}>{MAIN}</PageShell>);
    const rail = screen.getAllByLabelText('right-rail');
    expect(rail).toHaveLength(1);
    expect(rail[0].parentElement).toHaveClass(
      'mt-4',
      '@min-[988px]/shell:mt-0'
    );
  });

  it('右レールの列は shell コンテナ 988px 境界で出す (ビューポート境界を使わない)', () => {
    const { container } = render(
      <PageShell rightRail={RIGHT}>{MAIN}</PageShell>
    );
    const grid = container.firstElementChild?.firstElementChild;
    expect(grid).toHaveClass(
      '@min-[988px]/shell:grid',
      '@min-[988px]/shell:grid-cols-[minmax(0,1fr)_316px]',
      '@min-[988px]/shell:gap-4'
    );
    expect(grid).not.toHaveClass('lg:grid', 'xl:grid');
  });

});

describe('PageSections', () => {
  it('節 (カード) の間にだけ点線の帯を置き、空の子は数えない', () => {
    const { container } = render(
      <PageSections>
        <section aria-label="a">a</section>
        {false}
        {null}
        <section aria-label="b">b</section>
        <section aria-label="c">c</section>
      </PageSections>
    );
    const root = container.firstElementChild as HTMLElement;
    // 節は線の格子に並ぶ (1px の隙間をセルの外側 1px の影で線にする。親の地は塗らないので空いた所が灰色にならない)
    expect(root).toHaveAttribute('data-slot', 'panel-grid');
    expect(root.className).toMatch(/\bgap-px\b/);
    expect(root.className).toContain('*:shadow-[0_0_0_1px_hsl(var(--border))]!');
    expect(root.className).not.toMatch(/\bbg-border/);
    const kinds = [...root.children].map((child) => child.getAttribute('data-slot') ?? child.tagName);
    expect(kinds).toEqual(['SECTION', 'section-divider', 'SECTION', 'section-divider', 'SECTION']);
    // 帯は読み上げない (装飾)
    expect(root.querySelector('[data-slot="section-divider"]')).toHaveAttribute('aria-hidden', 'true');
  });
});
