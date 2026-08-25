import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  LEFT_RAIL_GRID_CLASS,
  LEFT_RAIL_NARROW_ONLY_CLASS,
  LEFT_RAIL_VISIBLE_CLASS,
  LeftRailLayout,
} from '../LeftRailLayout';

describe('LeftRailLayout — shared contract', () => {
  it('992px から共通の列幅と gap で左レールを表示する', () => {
    const { container } = render(
      <LeftRailLayout
        leftRail={<nav aria-label="contract-left-rail">rail</nav>}
      >
        <p>main</p>
      </LeftRailLayout>
    );

    expect(container.firstElementChild).toHaveClass(LEFT_RAIL_GRID_CLASS);
    expect(
      screen.getByLabelText('contract-left-rail').parentElement
    ).toHaveClass(LEFT_RAIL_VISIBLE_CLASS);
    expect(LEFT_RAIL_NARROW_ONLY_CLASS).toBe('min-[992px]:hidden');
  });

  it('ArticleShell 向けに main 要素を選べる', () => {
    const { container } = render(
      <LeftRailLayout leftRail={<nav>rail</nav>} mainAs="main">
        <h1>content</h1>
      </LeftRailLayout>
    );

    expect(container.querySelector('main')).not.toBeNull();
  });
});
