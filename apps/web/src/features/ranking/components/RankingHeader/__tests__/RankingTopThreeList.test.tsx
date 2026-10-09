import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RankingTopThreeList } from '../RankingTopThreeList';

import type { RankingHeaderStats } from '../../../utils/compute-ranking-header-stats';

const stats: RankingHeaderStats = {
  top3: [
    { areaCode: '01000', areaName: '北海道', rank: 1, value: 81.9 },
    { areaCode: '02000', areaName: '青森県', rank: 2, value: 81.2 },
  ],
  last: { areaCode: '47000', areaName: '沖縄県', rank: 47, value: 73.2 },
  average: 76.8,
  count: 47,
};
describe('Ranking summary meaning', () => {
  it('expresses the absolute gap between percentages in percentage points', () => {
    render(
      <RankingTopThreeList
        stats={stats}
        unit="％"
        precision={1}
        domainPolicy={{ mode: 'extent' }}
      />
    );
    expect(screen.getByText('0.7pt')).toBeTruthy();
  });
  it('identifies tied ranks without calling them first versus first', () => {
    const tied = {
      ...stats,
      top3: [stats.top3[0], { ...stats.top3[1], rank: 1, value: 81.9 }],
    };
    const { container } = render(
      <RankingTopThreeList
        stats={tied}
        unit="人"
        precision={1}
        domainPolicy={{ mode: 'extent' }}
      />
    );
    expect(container.textContent).toContain('上位2件は同順位（差なし）');
    expect(container.textContent).not.toContain('1位と1位');
  });
});
