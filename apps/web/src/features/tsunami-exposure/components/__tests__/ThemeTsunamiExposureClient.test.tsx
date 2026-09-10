import {
  TSUNAMI_EXPOSURE_SOURCE as source,
  type TsunamiSnapshot,
} from '@stats47/data-configs/theme-catalog';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeTsunamiExposureClient } from '../ThemeTsunamiExposureClient';
const selection = vi.hoisted(() => ({
  selectedPrefectureCode: null as string | null,
  setSelected: vi.fn(),
}));
vi.mock('@/features/theme-dashboard', () => ({
  useThemePrefecture: () => selection,
}));
afterEach(() => {
  cleanup();
  selection.setSelected.mockReset();
  selection.selectedPrefectureCode = null;
});
function fixture(): TsunamiSnapshot {
  return {
    schemaVersion: 1,
    definitionVersion: source.definitionVersion,
    generatedAt: '2026-09-11T00:00:00Z',
    rows: source.scenarios.map((s) => ({
      areaCode: s.areaCode,
      areaName: source.coverage.find((a) => a.areaCode === s.areaCode)!
        .areaName,
      scenarioKey: s.key,
      bands: s.bands.map((b, i) => ({
        key: b.key,
        populationRecords: i === 0 ? 1 : 0,
        population2020Units: i === 0 ? 1000000 : 0,
        population2050Units: i === 0 ? 800000 : 0,
        administrativeFacilities: i === 0 ? 2 : 0,
        publicMeetingFacilities: i === 0 ? 3 : 0,
      })),
      total: {
        populationRecords: 1,
        population2020Units: 1000000,
        population2050Units: 800000,
        administrativeFacilities: 2,
        publicMeetingFacilities: 3,
      },
    })),
  };
}
describe('Tsunami scenario selection', () => {
  it('national selection is a coverage entry, not a nationwide exposure total', () => {
    render(<ThemeTsunamiExposureClient snapshot={fixture()} />);
    expect(screen.queryByRole('table')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '徳島県を確認' }));
    expect(selection.setSelected).toHaveBeenCalledWith('36000');
    expect(screen.getByText(/全国合計や県別の安全順位/)).toBeTruthy();
  });
  it.each([
    ['22000', '静岡県', '2016年基準'],
    ['36000', '徳島県', '2025年9月12日'],
  ])('uses %s scenario and same county counts', (code, name, version) => {
    selection.selectedPrefectureCode = code;
    render(<ThemeTsunamiExposureClient snapshot={fixture()} />);
    expect(
      screen.getByRole('table', {
        name: `${name}の津波浸水深別人口と公共施設`,
      })
    ).toBeTruthy();
    expect(screen.getAllByText(new RegExp(version)).length).toBeGreaterThan(0);
    expect(screen.getByText('採用した原典の浸水区域外')).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: `${name}の地点別判定と途中集計（JSON）` })
        .getAttribute('href')
    ).toContain(`/pref/${code.slice(0, 2)}.json`);
  });
  it.each([
    ['37000', '提供されていません'],
    ['26000', '事前連絡'],
    ['39000', '利用条件確認中'],
    ['29000', '40県の浸水想定に含まれません'],
    ['15000', '整合が未解決'],
  ])('keeps %s unavailable reason distinct from zero', (code, reason) => {
    selection.selectedPrefectureCode = code;
    render(<ThemeTsunamiExposureClient snapshot={fixture()} />);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(reason);
  });
});

it.each(
  source.scenarios.map((s) => [
    s.areaCode,
    source.coverage.find((c) => c.areaCode === s.areaCode)!.areaName,
  ])
)('renders original depth labels for %s', (code, name) => {
  selection.selectedPrefectureCode = code;
  render(<ThemeTsunamiExposureClient snapshot={fixture()} />);
  expect(
    screen.getByRole('table', { name: `${name}の津波浸水深別人口と公共施設` })
  ).toBeTruthy();
  const s = source.scenarios.find((s) => s.areaCode === code)!;
  for (const b of s.bands) expect(screen.getByText(b.label)).toBeTruthy();
});
it('Tokyo keeps known unmodelled mainland and unclassified island remainder explicit', () => {
  selection.selectedPrefectureCode = '13000';
  render(<ThemeTsunamiExposureClient snapshot={fixture()} />);
  expect(screen.getByText('想定対象9町村以外（本土等・未対象）')).toBeTruthy();
  expect(screen.getByText('浸水ポリゴン非該当（未判定）')).toBeTruthy();
  expect(screen.queryByText('採用した原典の浸水区域外')).toBeNull();
});
