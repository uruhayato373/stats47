
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import {
  ThemePrefectureProvider,
  useThemePrefecture,
} from '@/features/theme-dashboard/components/ThemePrefectureContext';

import { ThemeWaterQualityClient } from '../components/ThemeWaterQualityClient';
import { ThemeWaterQualitySection } from '../components/ThemeWaterQualitySection';

import { waterQualityFixture } from './water-quality-fixture';
vi.mock(
  '@/features/theme-dashboard',
  async () =>
    await import('@/features/theme-dashboard/components/ThemePrefectureContext')
);
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: fetchMock }));
const snapshot = waterQualityFixture();
function Controls() {
  const { setSelected } = useThemePrefecture();
  return (
    <>
      {snapshot.prefectures.map((p) => (
        <button key={p.areaCode} onClick={() => setSelected(p.areaCode)}>
          {p.areaName}
        </button>
      ))}
      <button onClick={() => setSelected(null)}>全国</button>
    </>
  );
}
beforeEach(() => {
  window.history.replaceState(null, '', '/themes/environmental-quality');
  fetchMock.mockReset();
});
afterEach(cleanup);
describe('水質原表の共通県選択と状態表示', () => {
  it.each(snapshot.prefectures)('全国47行から$areaName欄だけへ切り替え、全国表示へ戻る', (p) => {
    const { container } = render(
      <ThemePrefectureProvider initialAreaCode={null}>
        <Controls />
        <ThemeWaterQualityClient snapshot={snapshot} />
      </ThemePrefectureProvider>
    );
    expect(container.querySelectorAll('[data-prefecture-code]')).toHaveLength(
      47
    );
    fireEvent.click(screen.getByRole('button', { name: p.areaName }));
    expect(
      container
        .querySelector('[data-area-code]')
        ?.getAttribute('data-area-code')
    ).toBe(p.areaCode);
    expect(container.querySelectorAll('[data-prefecture-code]')).toHaveLength(
      1
    );
    expect(container.querySelectorAll('[data-water-row]')).toHaveLength(
      snapshot.rows.filter(
        (r) => r.kind === 'river' && r.listingAreaCode === p.areaCode
      ).length
    );
    fireEvent.click(screen.getByRole('button', { name: '全国' }));
    expect(container.querySelectorAll('[data-water-row]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-prefecture-code]')).toHaveLength(
      47
    );
  });
  it('下限未満の記号と平均値を別々の列で保持する', () => {
    const { container } = render(
      <ThemePrefectureProvider initialAreaCode="01000">
        <ThemeWaterQualityClient snapshot={snapshot} />
      </ThemePrefectureProvider>
    );
    expect(container.querySelector('[data-value75]')?.textContent).toBe('<0.5');
    expect(container.querySelector('[data-mean]')?.textContent).toBe('0.6');
  });
  it('西汐入川の原典間相違を該当行へ示す', () => {
    render(
      <ThemePrefectureProvider initialAreaCode="37000">
        <ThemeWaterQualityClient snapshot={snapshot} />
      </ThemePrefectureProvider>
    );
    expect(screen.getByText('類型と基準値に原典間の相違あり')).toBeTruthy();
  });
  it('全国の独立集計は県の選択で置換しない', () => {
    render(
      <ThemePrefectureProvider initialAreaCode="01000">
        <ThemeWaterQualityClient snapshot={snapshot} />
      </ThemePrefectureProvider>
    );
    expect(screen.getByText(/全国の公式集計/).textContent).toContain(
      '2,416 / 2,576'
    );
  });
  it('取得失敗を空表や達成率ゼロへ変換しない', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    render(await ThemeWaterQualitySection());
    expect(screen.getByRole('status').textContent).toContain('取得できません');
    expect(screen.queryByRole('table')).toBeNull();
  });
  it('不正payloadを未達成の県として表示しない', async () => {
    fetchMock.mockResolvedValue({ rows: [] });
    render(await ThemeWaterQualitySection());
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
