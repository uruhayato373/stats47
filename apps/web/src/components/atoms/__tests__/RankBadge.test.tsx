import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RankBadge, rankToneByPosition } from '../RankBadge';

describe('RankBadge', () => {
  it.each([1, 47, 1741])('%i位を 1 行のまま表示する (折り返さず、幅を固定しない)', (rank) => {
    render(<RankBadge rank={rank} />);
    const badge = screen.getByText(`${rank}位`);
    // 固定幅 (w-7 など) だと「47位」「1741位」が折り返す。2026-09-25 /areas/13000 で発生
    expect(badge).toHaveClass('whitespace-nowrap');
    expect(badge.className).not.toMatch(/(?:^|\s)w-\d/);
    // 最小幅で一覧の縦位置を揃える
    expect(badge.className).toMatch(/(?:^|\s)min-w-/);
  });

  it('色は意味の tone で決まり、状態色トークンを使う', () => {
    const { rerender } = render(<RankBadge rank={1} tone="positive" />);
    expect(screen.getByText('1位')).toHaveClass('bg-positive-soft', 'text-positive');
    rerender(<RankBadge rank={47} tone="negative" />);
    expect(screen.getByText('47位')).toHaveClass('bg-negative-soft', 'text-negative');
  });
});

describe('rankToneByPosition', () => {
  it('47 都道府県の上位 10 / 中位 / 下位 10 を塗り分ける', () => {
    expect([1, 10, 11, 37, 38, 47].map((r) => rankToneByPosition(r))).toEqual([
      'primary',
      'primary',
      'neutral',
      'neutral',
      'muted',
      'muted',
    ]);
  });

  it('total を渡すと市区町村など 47 以外の母数でも下位 10 を判定する', () => {
    expect(rankToneByPosition(1731, 1741)).toBe('neutral');
    expect(rankToneByPosition(1732, 1741)).toBe('muted');
  });
});
