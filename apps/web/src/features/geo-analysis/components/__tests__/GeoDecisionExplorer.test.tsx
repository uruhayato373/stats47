import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics/events', () => ({ trackGeoRegionSelect: vi.fn() }));
vi.mock('@stats47/components/atoms/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select
      aria-label="県"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

import { GeoDecisionExplorer } from '../GeoDecisionExplorer';

import type { GeoDecisionRow } from '../../lib/build-geo-decision-rows';

describe('Geo比較の共有URL', () => {
  it('県選択・再読込・詳細導線が同じ県を指し、UTMとhashを保持する', () => {
    const rows: GeoDecisionRow[] = ['13000', '28000'].map(
      (areaCode, index) => ({
        areaCode,
        areaName: index === 0 ? '東京都' : '兵庫県',
        population2050: 100,
        populationChangeRate: -20,
        landPriceChange: 1,
        medianResidentialLandPrice: 10000,
        risingDecliningPointShare: 50,
        comparablePointCount: 10,
        floodExposurePopulation: 30,
        floodExposureShare: 30,
        stationAccessPopulation: 40,
        stationAccessShare: 40,
      })
    );
    window.history.replaceState(
      null,
      '',
      '/geo/compare?pref=13000&utm_source=x#compare'
    );
    const view = render(
      <GeoDecisionExplorer rows={rows} initialAreaCode="13000" />
    );
    fireEvent.change(screen.getByRole('combobox', { name: '県' }), {
      target: { value: '28000' },
    });
    expect(window.location.search).toBe('?pref=28000&utm_source=x');
    expect(window.location.hash).toBe('#compare');
    expect(
      screen.getByRole('heading', { name: '兵庫県を4つの問いで読む' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'この県の地点の重なりを見る →' })
    ).toHaveAttribute('href', '/geo/population-land-price/28/overlap');
    view.unmount();
    render(
      <GeoDecisionExplorer
        rows={rows}
        initialAreaCode={
          new URLSearchParams(window.location.search).get('pref') ?? undefined
        }
      />
    );
    expect(screen.getByRole('combobox', { name: '県' })).toHaveValue('28000');
  });
});
