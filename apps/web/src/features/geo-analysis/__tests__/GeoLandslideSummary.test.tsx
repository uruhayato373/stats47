import { LANDSLIDE_EXPOSURE_SOURCE as S } from '@stats47/data-configs/theme-catalog';
import { LANDSLIDE_EXPOSURE_DEFINITION as D, type GeoAnalysisSnapshot } from '@stats47/gis';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { GeoLandslideSummary } from '../components/GeoLandslideSummary';


afterEach(cleanup);
const snapshot: GeoAnalysisSnapshot = {
  ...D,
  generatedAt: '2026-09-11T00:00:00.000Z',
  rows: S.prefectures.map((p, i) => ({
    areaCode: p.areaCode,
    areaName: p.areaName,
    rank: i + 1,
    values: {
      exposedCenterPopulation: i === 25 ? null : 10,
      warningCenterPopulation: i === 25 ? null : 9,
      specialCenterPopulation: i === 25 ? null : 2,
      exposedCenterPopulationShare: i === 25 ? null : 10,
      population2020: i === 25 ? null : 100,
      exposedAdministrativeFacilities: i === 25 ? null : 1,
      administrativeFacilities: i === 25 ? null : 3,
      exposedMeetingFacilities: i === 25 ? null : 2,
      meetingFacilities: i === 25 ? null : 4,
    },
  })),
  summary: {
    observationCount: 46,
    medianValue: 10,
    topAreaCodes: ['01000'],
    bottomAreaCodes: ['47000'],
  },
  dataQuality: {
    expectedAreas: 47,
    actualAreas: 47,
    missingAreaCodes: ['26000'],
    inputCounts: { a33Archives: 46 },
    coverageNote: 'synthetic UI fixture',
  },
};
describe('landslide summary scope', () => {
  it('shows an explicit 46-prefecture pooled total and all47 rows', () => {
    render(<GeoLandslideSummary snapshot={snapshot} />);
    expect(screen.getByText('対象46県計（京都府除外）')).toBeTruthy();
    expect(screen.getByText('460')).toBeTruthy();
    expect(screen.getByText('4,600')).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(49);
  });
  it('keeps Kyoto unavailable, not a numeric zero', () => {
    render(
      <GeoLandslideSummary snapshot={snapshot} selectedAreaCode="26000" />
    );
    expect(screen.getByRole('status').textContent).toContain(
      '曝露が0という意味ではありません'
    );
    expect(screen.queryByText('0／0')).toBeNull();
    expect(screen.getAllByText('対象外')).toHaveLength(5);
  });
  it('responds to a shared-pref change by rerendering one selected row', () => {
    const r = render(
      <GeoLandslideSummary snapshot={snapshot} selectedAreaCode="13000" />
    );
    expect(screen.getByText('東京都の指定区域面と人口・公共施設')).toBeTruthy();
    r.rerender(
      <GeoLandslideSummary snapshot={snapshot} selectedAreaCode="01000" />
    );
    expect(screen.getByText('北海道の指定区域面と人口・公共施設')).toBeTruthy();
    expect(screen.queryByText('東京都の指定区域面と人口・公共施設')).toBeNull();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
  it('sends the exact 5-digit prefecture through the shared selection callback', () => {
    const f = vi.fn();
    render(<GeoLandslideSummary snapshot={snapshot} onSelectArea={f} />);
    fireEvent.click(
      screen.getByRole('button', { name: /^東京都$/ })
    );
    expect(f).toHaveBeenCalledWith('13000', '東京都');
  });
  it('keeps administrative and meeting denominators separate', () => {
    render(
      <GeoLandslideSummary snapshot={snapshot} selectedAreaCode="13000" />
    );
    expect(screen.getByText('1／3')).toBeTruthy();
    expect(screen.getByText('2／4')).toBeTruthy();
  });
  it('provides the canonical Geo evidence and official source links', () => {
    render(
      <GeoLandslideSummary snapshot={snapshot} selectedAreaCode="01000" />
    );
    expect(
      screen
        .getByRole('link', { name: '計算入力・県別途中データ・保存則を確認' })
        .getAttribute('href')
    ).toBe('/geo/population-landslide-exposure');
    expect(
      screen.getByRole('link', { name: S.a33.title }).getAttribute('href')
    ).toBe(S.a33.pageUrl);
  });
  it('makes the wide comparison table keyboard-scrollable', () => {
    render(<GeoLandslideSummary snapshot={snapshot} />);
    expect(
      screen
        .getByLabelText('人口と施設の表。横方向にスクロールできます')
        .getAttribute('tabindex')
    ).toBe('0');
  });
});
