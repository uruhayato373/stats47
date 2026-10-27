import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  LEFT_RAIL_GRID_CLASS,
  LEFT_RAIL_NARROW_ONLY_CLASS,
  LEFT_RAIL_VISIBLE_CLASS,
  LeftRailLayout,
} from '../LeftRailLayout';

describe('LeftRailLayout — shared contract', () => {
  it('shell コンテナ 936px から共通の列幅と gap で左レールを表示する', () => {
    const { container } = render(
      <LeftRailLayout
        leftRail={<nav aria-label="contract-left-rail">rail</nav>}
      >
        <p>main</p>
      </LeftRailLayout>
    );

    expect(container.firstElementChild).toHaveClass(LEFT_RAIL_GRID_CLASS);
    expect(LEFT_RAIL_GRID_CLASS).toContain(
      '@min-[936px]/shell:grid-cols-[264px_minmax(0,1fr)]'
    );
    expect(
      screen.getByLabelText('contract-left-rail').parentElement
    ).toHaveClass(LEFT_RAIL_VISIBLE_CLASS);
    // 狭い幅の代替 UI は、レール本体と同じ境界で入れ替わる
    expect(LEFT_RAIL_VISIBLE_CLASS).toBe('hidden @min-[936px]/shell:block');
    expect(LEFT_RAIL_NARROW_ONLY_CLASS).toBe('@min-[936px]/shell:hidden');
  });

  it('compact は shell コンテナ 896px から 224px 列で表示する (本文 656px を保つ)', () => {
    const { container } = render(
      <LeftRailLayout
        leftRail={<nav aria-label="compact-left-rail">rail</nav>}
        density="compact"
      >
        <p>main</p>
      </LeftRailLayout>
    );

    expect(container.firstElementChild).toHaveClass(
      '@min-[896px]/shell:grid',
      '@min-[896px]/shell:grid-cols-[224px_minmax(0,1fr)]'
    );
    expect(
      screen.getByLabelText('compact-left-rail').parentElement
    ).toHaveClass('hidden', '@min-[896px]/shell:block');
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
