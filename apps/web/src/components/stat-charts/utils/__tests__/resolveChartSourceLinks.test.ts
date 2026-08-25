import { describe, expect, it } from 'vitest';

import { resolveChartSourceLinks } from '../resolveChartSourceLinks';

describe('resolveChartSourceLinks', () => {
  it('主・副ランキングのmetric lineageを調査ハブへ解決し重複を除く', () => {
    const links = resolveChartSourceLinks({
      rankingLink: '/ranking/crude-birth-rate',
      rankingLinks: [
        {
          label: '出生数の定義・ランキング',
          url: '/ranking/births',
        },
      ],
    });

    expect(links).toContainEqual({
      label: '人口動態統計',
      url: '/survey/vital-statistics',
    });
    expect(new Set(links.map((link) => link.url)).size).toBe(links.length);
  });

  it('系譜を解決できない自由URLには調査リンクを捏造しない', () => {
    expect(
      resolveChartSourceLinks({ rankingLink: 'https://example.com/ranking' })
    ).toEqual([]);
  });
});
