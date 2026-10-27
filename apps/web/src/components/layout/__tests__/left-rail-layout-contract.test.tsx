import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LeftRailLayout } from '../LeftRailLayout';

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
    // 2 列のグリッド (旧 264px 列) を作らない
    expect(outer?.className ?? '').not.toMatch(/grid-cols/);
    const nav = screen.getByLabelText('contract-left-rail').parentElement;
    expect(nav).toHaveAttribute('data-slot', 'page-nav');
    // 幅で出し入れしない (どの幅でも同じ 1 か所に出す)
    expect(nav?.className ?? '').not.toMatch(/hidden/);
    // ナビは本文より先に描き、同じナビを 2 か所に出さない
    expect(outer?.firstElementChild).toBe(nav);
    expect(screen.getAllByLabelText('contract-left-rail')).toHaveLength(1);
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
