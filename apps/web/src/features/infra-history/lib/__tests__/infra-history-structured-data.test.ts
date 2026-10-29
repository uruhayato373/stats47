import { INFRA_NETWORKS, type InfraLengthSeries } from '@stats47/gis/infra-history';
import { describe, expect, it } from 'vitest';

import { invalidDatasetDescriptions } from '@/lib/structured-data/dataset';

import { resolveInfraScope } from '../infra-history-scope';
import { buildInfraHistoryDescription, buildInfraHistoryStructuredData } from '../infra-history-structured-data';

const series: InfraLengthSeries = { total: [0, 120.4, 13441.2], byCategory: {} };

describe('交通網の変遷の description と Dataset 構造化データ', () => {
  it('全ての網と範囲 (全国・地方・県) で Google の description 字数 (50〜5,000 字) を満たす', () => {
    for (const network of INFRA_NETWORKS) {
      for (const slug of [null, 'kanto', '13']) {
        const scope = resolveInfraScope(network.key, slug);
        if (!scope) throw new Error(`${network.key}/${slug} が解決できない`);
        const data = buildInfraHistoryStructuredData({ network, scope, series, generatedAt: null, siteUrl: 'https://stats47.jp' });
        expect(invalidDatasetDescriptions(data)).toEqual([]);
      }
    }
  });

  it('最新年の値を description に入れ、系列が読めないときは数字を書かない', () => {
    const network = INFRA_NETWORKS.find((item) => item.key === 'expressway');
    const scope = network && resolveInfraScope(network.key, null);
    if (!network || !scope) throw new Error('expressway が無い');
    expect(buildInfraHistoryDescription(network, scope, series)).toContain('2024年の延長は13,441 km。');
    expect(buildInfraHistoryDescription(network, scope, null)).not.toMatch(/\d+ km/);
  });

  it('canonical・期間・原典・利用条件を画面と同じ値で持ち、配布しないので distribution を付けない', () => {
    const network = INFRA_NETWORKS.find((item) => item.key === 'railway');
    const scope = network && resolveInfraScope(network.key, 'kanto');
    if (!network || !scope) throw new Error('railway/kanto が無い');
    const data = buildInfraHistoryStructuredData({ network, scope, series, generatedAt: '2026-10-29T00:00:00Z', siteUrl: 'https://stats47.jp/' });
    expect(data.url).toBe('https://stats47.jp/geo/history/railway/kanto');
    expect(data.temporalCoverage).toBe(`${network.years.first}/${network.years.last}`);
    expect(data.isBasedOn.name).toBe(network.source.name);
    expect(data.license.name).toContain('商用利用はできません');
    expect(data).not.toHaveProperty('distribution');
  });
});
