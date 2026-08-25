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
  it('既定 (stack): 狭幅用の積み下ろし領域にも leftRail を描く', () => {
    render(<PageShell leftRail={LEFT}>{MAIN}</PageShell>);
    // グリッド内 (992px+) と積み下ろし (992px 未満) の 2 か所
    expect(screen.getAllByLabelText('left-rail')).toHaveLength(2);
  });

  it('hide: 積み下ろし領域に leftRail を描かない (992px+ のみ)', () => {
    render(
      <PageShell leftRail={LEFT} leftRailNarrowBehavior="hide">
        {MAIN}
      </PageShell>
    );
    const rails = screen.getAllByLabelText('left-rail');
    expect(rails).toHaveLength(1);
    // 残る 1 つは 992px+ でのみ表示されるグリッド側
    expect(rails[0].parentElement).toHaveClass('hidden', 'min-[992px]:block');
  });

  /**
   * ★992px は全 Shell 共通の左レール境界。列の詳細は
   * left-rail-layout-contract.test.tsx が固定する。
   */
  it('左レールは専用の 992px 境界から出す', () => {
    const { container } = render(
      <PageShell leftRail={LEFT} leftRailNarrowBehavior="hide">
        {MAIN}
      </PageShell>
    );
    const grid = container.firstElementChild?.firstElementChild;
    expect(grid).toHaveClass(
      'min-[992px]:grid',
      'min-[992px]:grid-cols-[264px_minmax(0,1fr)]',
      'min-[992px]:gap-6'
    );
    expect(grid).not.toHaveClass('lg:grid', 'xl:grid');
  });

  /**
   * 狭幅の積み下ろし境界がレール本体とずれると、両方出る幅 / どちらも出ない幅ができる。
   * `hide` でも積み下ろしコンテナ自体は描かれるので、その境界クラスを固定する。
   */
  it('積み下ろし境界がレール本体と同じ 992px になっている', () => {
    render(<PageShell leftRail={LEFT}>{MAIN}</PageShell>);
    const stacked = screen.getAllByLabelText('left-rail')[1].parentElement;
    expect(stacked).toHaveClass(LEFT_RAIL_NARROW_ONLY_CLASS);
    expect(stacked).not.toHaveClass('lg:hidden', 'xl:hidden');
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
});

describe('PageShell — rightRail', () => {
  it('既定 (xl) は本文下にも積む', () => {
    render(<PageShell rightRail={RIGHT}>{MAIN}</PageShell>);
    expect(screen.getAllByLabelText('right-rail')).toHaveLength(2);
  });

  it('rightRailBreakpoint=lg で lg 境界のクラスに切り替わる', () => {
    const { container } = render(
      <PageShell rightRail={RIGHT} rightRailBreakpoint="lg">
        {MAIN}
      </PageShell>
    );
    expect(container.querySelector('.lg\\:grid')).not.toBeNull();
  });
});
