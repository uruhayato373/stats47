import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RankingMapChartClient } from '../RankingMapChartClient';

import type { RankingItem } from '@stats47/ranking';

const captured = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock('next/dynamic', () => ({
  default: () => (props: Record<string, unknown>) => {
    captured.props = props;
    return <div data-testid="map" />;
  },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/hooks/useTheme', () => ({ useTheme: () => ({ theme: 'light' }) }));
vi.mock('../map-shapes', () => ({ buildMapShapes: () => ({ shapes: [] }) }));

const rankingItem = {
  title: '公認会計士の年収',
  unit: '万円',
  visualization: { colorScheme: 'interpolateBlues', colorSchemeType: 'sequential' },
  // 表示単位を持たず、小数桁だけを書いた指標 (表示単位を掛けない指標)
  valueDisplay: { decimalPlaces: 1 },
} as unknown as Pick<RankingItem, 'title' | 'unit' | 'visualization' | 'valueDisplay'>;
const rankingValues = [
  { areaCode: '13000', areaName: '東京都', value: 1012 },
  { areaCode: '27000', areaName: '大阪府', value: 856 },
];
const topology = { type: 'Topology', objects: {}, arcs: [] } as never;

/**
 * UI-FOLLOWUP-02: 表示単位を掛けない指標 (valueDisplay = null) で、地図のホバーの小数桁を
 * 指標の定義の decimalPlaces、表の小数桁を観測値の桁で決めていて、同じ県の値の桁が地図と表で食い違っていた
 * (地図「1,012.0万円」・表「1,012万円」)。地図も表 (RankingDataTable) と同じく、ページが決めた表示単位が
 * 無ければ観測値の桁 (RankingSvgMap の resolveValuePrecision) で書く。
 */
describe('RankingMapChartClient の小数桁', () => {
  it('表示単位が無いときは定義の decimalPlaces を地図へ渡さず、観測値の桁に任せる', () => {
    render(
      <RankingMapChartClient
        rankingItem={rankingItem}
        rankingValues={rankingValues}
        areaType="prefecture"
        topology={topology}
        bare
        valueDisplay={null}
      />
    );
    expect(captured.props.decimalPlaces).toBeUndefined();
  });

  it('ページが表示単位を決めたときは、その小数桁を表と同じく地図へ渡す', () => {
    render(
      <RankingMapChartClient
        rankingItem={rankingItem}
        rankingValues={rankingValues}
        areaType="prefecture"
        topology={topology}
        bare
        valueDisplay={{ unit: '億円', factor: 0.0001, precision: 2 }}
      />
    );
    expect(captured.props.decimalPlaces).toBe(2);
  });
});
