import { describe, expect, it } from 'vitest';

import { listThemeCatalogs, listThemesUsingRankingKeys } from '../index';
import type { ThemeCatalog } from '../types';

const catalog = (key: string, metrics: ThemeCatalog['metrics']): ThemeCatalog =>
  ({ key, title: key, description: '', category: 'population', usage: 'theme', metrics, charts: [] }) as unknown as ThemeCatalog;

describe('指標を使うテーマの逆引き', () => {
  const catalogs = [
    catalog('a-theme', [{ rankingKey: 'x', shortLabel: 'x', role: 'secondary' }]),
    catalog('b-theme', [
      { rankingKey: 'x', shortLabel: 'x', role: 'primary' },
      { rankingKey: 'y', shortLabel: 'y', role: 'primary' },
    ]),
    catalog('c-theme', [{ rankingKey: 'x', shortLabel: 'x', role: 'context' }]),
  ];

  it('主指標として使うテーマを先に並べ、一致した指標を返す', () => {
    expect(listThemesUsingRankingKeys(['x', 'y'], catalogs)).toEqual([
      { key: 'b-theme', title: 'b-theme', rankingKeys: ['x', 'y'] },
      { key: 'a-theme', title: 'a-theme', rankingKeys: ['x'] },
    ]);
  });

  it('背景として添えただけ (context) の一致では回遊させない', () => {
    expect(listThemesUsingRankingKeys(['x'], [catalogs[2]!])).toEqual([]);
  });

  it('実カタログでも総人口を主指標に持つテーマが見つかる (逆引きが空でないこと)', () => {
    const themes = listThemesUsingRankingKeys(['total-population'], listThemeCatalogs());
    expect(themes.length).toBeGreaterThan(0);
  });
});
