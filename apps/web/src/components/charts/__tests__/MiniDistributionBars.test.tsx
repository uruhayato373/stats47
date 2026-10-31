import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MiniDistributionBars } from '../MiniDistributionBars';

describe('MiniDistributionBars', () => {
  it('名前が無ければ装飾として読み上げから外す (市区町村のカードはリンクの中に置く)', () => {
    const { container } = render(<MiniDistributionBars bins={[{ count: 3 }, { count: 1 }]} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('選んだ県の 1 本だけを強調し、47 の中の位置を読み上げの名前で伝える', () => {
    render(
      <MiniDistributionBars
        bins={[5, 4, 3, 2, 1].map((count) => ({ count }))}
        highlightIndex={2}
        label="5都道府県を値の順に並べた中の東京都 (3位)"
      />
    );
    const svg = screen.getByRole('img', { name: '5都道府県を値の順に並べた中の東京都 (3位)' });
    const highlighted = svg.querySelectorAll('rect[data-highlight]');
    expect(highlighted).toHaveLength(1);
    expect(svg.querySelectorAll('rect')[2]).toBe(highlighted[0]);
  });

  it('負の値は 0 の線から下へ伸ばす (増減率などで棒が上下に分かれる)', () => {
    const { container } = render(<MiniDistributionBars bins={[{ count: 2 }, { count: -2 }]} />);
    const [up, down] = Array.from(container.querySelectorAll('rect'));
    const upBottom = Number(up.getAttribute('y')) + Number(up.getAttribute('height'));
    expect(Number(down.getAttribute('y'))).toBeCloseTo(upBottom);
  });
});
