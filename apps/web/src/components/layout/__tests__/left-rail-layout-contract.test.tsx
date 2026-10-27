import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  LEFT_RAIL_GRID_CLASS,
  LEFT_RAIL_NARROW_ONLY_CLASS,
  LEFT_RAIL_VISIBLE_CLASS,
  LeftRailLayout,
} from '../LeftRailLayout';

describe('LeftRailLayout — shared contract', () => {
  it('ページ内ナビはサイドバーの右に列を作らず、本文の上に全幅で置く', () => {
    const { container } = render(
      <LeftRailLayout
        leftRail={<nav aria-label="contract-left-rail">rail</nav>}
      >
        <p>main</p>
      </LeftRailLayout>
    );

    const outer = container.firstElementChild;
    expect(outer).toHaveClass(LEFT_RAIL_GRID_CLASS);
    // 2 列のグリッド (旧 264px 列) を作らない
    expect(LEFT_RAIL_GRID_CLASS).not.toMatch(/grid-cols/);
    const nav = screen.getByLabelText('contract-left-rail').parentElement;
    expect(nav).toHaveAttribute('data-slot', 'page-nav');
    expect(nav).toHaveClass(LEFT_RAIL_VISIBLE_CLASS);
    // 幅で出し入れしない (どの幅でも同じ 1 か所に出す)
    expect(LEFT_RAIL_VISIBLE_CLASS).not.toMatch(/hidden/);
    // ナビは本文より先に描く
    expect(outer?.firstElementChild).toBe(nav);
    // 旧「狭い幅の代替 UI」は、ナビが全幅で出るため常に隠す (二重表示を作らない)
    expect(LEFT_RAIL_NARROW_ONLY_CLASS).toBe('hidden');
  });

  it('compact を渡しても列を作らず、同じ置き場を使う', () => {
    render(
      <LeftRailLayout
        leftRail={<nav aria-label="compact-left-rail">rail</nav>}
        density="compact"
      >
        <p>main</p>
      </LeftRailLayout>
    );

    expect(
      screen.getByLabelText('compact-left-rail').parentElement
    ).toHaveAttribute('data-slot', 'page-nav');
  });

  it('本文の列は main を入れ子にせず div[data-slot=shell-main] で描く', () => {
    const { container } = render(
      <LeftRailLayout leftRail={<nav>rail</nav>}>
        <h1>content</h1>
      </LeftRailLayout>
    );

    expect(container.querySelector('main')).toBeNull();
    const shellMain = container.querySelector('div[data-slot="shell-main"]');
    expect(shellMain).not.toBeNull();
    expect(shellMain).toHaveTextContent('content');
  });
});
