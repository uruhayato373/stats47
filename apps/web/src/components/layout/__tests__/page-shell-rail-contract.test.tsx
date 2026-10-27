import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LEFT_RAIL_NARROW_ONLY_CLASS } from '../LeftRailLayout';
import { PageShell } from '../PageShell';

/**
 * PageShell のレール契約。
 *
 * ★2026-08-04 にテーマページの左レール (ThemeSideNav) で `leftRail` を初めて実用したときに
 * 固定した挙動。特に `leftRailNarrowBehavior` は「ページ内容を切り替えるナビを本文の後ろに
 * 積むと操作対象より後ろに回って意味を失う」ために足した分岐で、既定 (`stack`) との違いが
 * 崩れると狭幅でナビが二重に出る / 消えるのどちらかになる。
 */

const MAIN = <p>main-content</p>;
const LEFT = <nav aria-label="left-rail">left</nav>;
const RIGHT = <aside aria-label="right-rail">right</aside>;

describe('PageShell — leftRail', () => {
  it('既定 (stack): 旧来の積み下ろし領域は残るが、常に隠れて二重表示にならない', () => {
    render(<PageShell leftRail={LEFT}>{MAIN}</PageShell>);
    const rails = screen.getAllByLabelText('left-rail');
    expect(rails).toHaveLength(2);
    expect(rails[0].parentElement).toHaveAttribute('data-slot', 'page-nav');
    expect(rails[1].parentElement).toHaveClass(LEFT_RAIL_NARROW_ONLY_CLASS);
    expect(LEFT_RAIL_NARROW_ONLY_CLASS).toBe('hidden');
  });

  it('hide: ページ内ナビは本文の上の 1 か所だけに描く', () => {
    render(
      <PageShell leftRail={LEFT} leftRailNarrowBehavior="hide">
        {MAIN}
      </PageShell>
    );
    const rails = screen.getAllByLabelText('left-rail');
    expect(rails).toHaveLength(1);
    expect(rails[0].parentElement).toHaveAttribute('data-slot', 'page-nav');
    expect(rails[0].parentElement).not.toHaveClass('hidden');
  });

  /**
   * ★2026-10-28: サイト全体のナビはサイドバーが持つので、ページ内ナビのために
   * サイドバーの右へもう 1 本の列を作らない。幅の境界も持たない。
   */
  it('ページ内ナビのために 2 列目を作らない', () => {
    const { container } = render(
      <PageShell leftRail={LEFT} leftRailNarrowBehavior="hide">
        {MAIN}
      </PageShell>
    );
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
