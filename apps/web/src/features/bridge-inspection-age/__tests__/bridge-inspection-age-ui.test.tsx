import React from 'react';

import { BRIDGE_INSPECTION_AGE_SOURCE as SOURCE } from '@stats47/data-configs/theme-catalog';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import {
  ThemePrefectureProvider,
  useThemePrefecture,
} from '@/features/theme-dashboard/components/ThemePrefectureContext';

import { ThemeBridgeInspectionAgeClient } from '../components/ThemeBridgeInspectionAgeClient';
import { ThemeBridgeInspectionAgeSection } from '../components/ThemeBridgeInspectionAgeSection';
import { parseBridgeInspectionAgeSnapshot } from '../lib/bridge-inspection-age-snapshot';

import { bridgeInspectionAgeFixture } from './bridge-inspection-age-fixture';

vi.mock(
  '@/features/theme-dashboard',
  async () =>
    await import('@/features/theme-dashboard/components/ThemePrefectureContext')
);
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: fetchMock }));
const snapshot = parseBridgeInspectionAgeSnapshot(bridgeInspectionAgeFixture());
function Controls() {
  const { setSelected } = useThemePrefecture();
  return (
    <>
      {snapshot.areas.map((a) => (
        <button key={a.areaCode} onClick={() => setSelected(a.areaCode)}>
          {a.areaName}
        </button>
      ))}
      <button onClick={() => setSelected(null)}>全国</button>
    </>
  );
}
function Context({
  code = null,
  children,
}: {
  code?: string | null;
  children: React.ReactNode;
}) {
  return (
    <ThemePrefectureProvider initialAreaCode={code}>
      <Controls />
      {children}
    </ThemePrefectureProvider>
  );
}
beforeEach(() => {
  window.history.replaceState(null, '', '/themes/roads');
  fetchMock.mockReset();
});
afterEach(cleanup);
describe('共通県選択に連動する架設年度表', () => {
  it('全国→全47県→全国で7帯の人数と不明を含む分母を切り替える', () => {
    const { container } = render(
      <Context>
        <ThemeBridgeInspectionAgeClient snapshot={snapshot} />
      </Context>
    );
    const rows = [
      ...snapshot.areas,
      { ...snapshot.national, areaCode: '00000', areaName: '全国' },
    ];
    for (const area of rows) {
      fireEvent.click(screen.getByRole('button', { name: area.areaName }));
      expect(
        container
          .querySelector('[data-area-code]')
          ?.getAttribute('data-area-code')
      ).toBe(area.areaCode);
      expect(
        container
          .querySelector('[data-published-count]')
          ?.getAttribute('data-published-count')
      ).toBe(String(area.publishedCount));
      expect(screen.getByRole('table').getAttribute('aria-label')).toContain(
        area.areaName
      );
      expect(
        screen.getByRole('table').querySelectorAll('tbody tr')
      ).toHaveLength(7);
      for (const band of area.bands) {
        const row = container.querySelector(`[data-band-key="${band.key}"]`)!;
        expect(row.querySelector('[data-count]')?.textContent).toBe(
          band.count.toLocaleString('ja-JP')
        );
        expect(
          Number(row.querySelector('[data-share]')?.getAttribute('data-share'))
        ).toBeCloseTo((band.count / area.publishedCount) * 100, 10);
        expect(
          row
            .querySelector('[data-denominator]')
            ?.getAttribute('data-denominator')
        ).toBe(String(area.publishedCount));
      }
      expect(window.location.pathname).toBe('/themes/roads');
      expect(new URL(window.location.href).searchParams.get('pref')).toBe(
        area.areaCode === '00000' ? null : area.areaCode
      );
    }
  });
  it('初期の東京を使い、架設年度不明と0橋の区分を区別する', () => {
    const { container } = render(
      <Context code="13000">
        <ThemeBridgeInspectionAgeClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.getByRole('table').getAttribute('aria-label')).toContain(
      '東京都'
    );
    expect(
      container.querySelector('[data-band-key="unknown"] [data-count]')
        ?.textContent
    ).toBe('1');
    expect(
      container.querySelector('[data-band-key="0-9"] [data-count]')?.textContent
    ).toBe('0');
  });
  it('未知の地域を全国値で補完しない', () => {
    render(
      <Context code="99999">
        <ThemeBridgeInspectionAgeClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('この地域');
  });
  it('対象年度・年度差の限界・診断中除外・原表への出典を表示する', () => {
    render(
      <Context>
        <ThemeBridgeInspectionAgeClient snapshot={snapshot} />
      </Context>
    );
    for (const note of SOURCE.notes)
      expect(screen.getByText(note)).toBeTruthy();
    for (const s of SOURCE.sources)
      expect(
        screen.getByRole('link', { name: s.title }).getAttribute('href')
      ).toBe(s.url);
    expect(screen.getByRole('table').parentElement?.className).toContain(
      'overflow-auto'
    );
  });
});
describe('取得境界', () => {
  it('厳格に検証したcanonical snapshotを渡す', async () => {
    fetchMock.mockResolvedValue(snapshot);
    const rendered = await ThemeBridgeInspectionAgeSection();
    expect(fetchMock).toHaveBeenCalledWith(SOURCE.r2Key);
    expect(rendered.props.snapshot).toEqual(snapshot);
  });
  it.each([
    null,
    { ...snapshot, year: '2024' },
    { ...snapshot, national: { ...snapshot.national, publishedCount: 730788 } },
  ])('欠測・年違い・管理全橋梁の分母を描画しない', async (invalid) => {
    fetchMock.mockResolvedValue(invalid);
    render(await ThemeBridgeInspectionAgeSection());
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('取得失敗を0橋で表示しない', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    render(await ThemeBridgeInspectionAgeSection());
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('取得できません');
  });
});
