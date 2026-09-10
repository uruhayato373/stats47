import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { airportTrafficFixture } from '../../lib/__tests__/airport-traffic-fixture';
import { airportTrafficSnapshotSchema } from '../../lib/airport-traffic-snapshot';
import { ThemeAirportTrafficClient } from '../ThemeAirportTrafficClient';
const selection = vi.hoisted(() => ({
  code: null as string | null,
  name: '全国',
}));
vi.mock('@/features/theme-dashboard', () => ({
  useThemePrefecture: () => ({
    selectedPrefectureCode: selection.code,
    selectedAreaName: selection.name,
  }),
}));
vi.mock('@/components/charts/ChartFooter', () => ({
  ChartFooter: ({
    source,
    sourceLink,
  }: {
    source: string;
    sourceLink: string;
  }) => <a href={sourceLink}>{source}</a>,
}));
afterEach(() => {
  cleanup();
  selection.code = null;
  selection.name = '全国';
});
const snapshot = () =>
  airportTrafficSnapshotSchema.parse(airportTrafficFixture());
describe('空港の所在地による絞り込み', () => {
  it('全国は96空港を旅客と貨物で分けて表示する', () => {
    render(<ThemeAirportTrafficClient snapshot={snapshot()} />);
    expect(screen.getAllByRole('table')).toHaveLength(2);
    for (const table of screen.getAllByRole('table')) {
      expect(table.querySelectorAll('tbody tr')).toHaveLength(96);
      expect(table.parentElement?.className).toContain('overflow-auto');
    }
    expect(screen.getByText(/96空港合計/)).toBeTruthy();
  });
  it('大阪国際は大阪と兵庫の両フィルタで1回表示する', () => {
    selection.code = '27000';
    selection.name = '大阪府';
    const s = snapshot();
    const { rerender } = render(<ThemeAirportTrafficClient snapshot={s} />);
    expect(
      screen
        .getAllByRole('table')[0]
        .querySelectorAll('[data-airport-name="大阪国際"]')
    ).toHaveLength(1);
    expect(screen.getByText(/大阪府・兵庫県（複数県にまたがる）/)).toBeTruthy();
    selection.code = '28000';
    selection.name = '兵庫県';
    rerender(<ThemeAirportTrafficClient snapshot={s} />);
    expect(
      screen
        .getAllByRole('table')[0]
        .querySelectorAll('[data-airport-name="大阪国際"]')
    ).toHaveLength(1);
  });
  it('対象空港なしは欠測でも県民利用ゼロでもない', () => {
    selection.code = '11000';
    selection.name = '埼玉県';
    const { container } = render(
      <ThemeAirportTrafficClient snapshot={snapshot()} />
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(
      container.querySelector('[data-data-state="no-airports"]')
    ).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      '県民の航空利用がゼロという意味ではありません'
    );
  });
  it('不正県コードは対象空港なしと区別する', () => {
    selection.code = '99999';
    const { container } = render(
      <ThemeAirportTrafficClient snapshot={snapshot()} />
    );
    expect(
      container.querySelector('[data-data-state="unavailable"]')
    ).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain(
      '地域を確認できません'
    );
  });
});
