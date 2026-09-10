import React from 'react';

import { GRADUATION_PATHS_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ThemePrefectureProvider,
  useThemePrefecture,
} from '@/features/theme-dashboard/components/ThemePrefectureContext';

import { ThemeGraduationPathsClient } from '../components/ThemeGraduationPathsClient';
import { ThemeGraduationPathsSection } from '../components/ThemeGraduationPathsSection';
import { parseGraduationPathsSnapshot } from '../lib/graduation-paths-snapshot';
import { selectGraduationPathsView } from '../lib/graduation-paths-view';

import { graduationPathsFixture } from './graduation-paths-fixture';

vi.mock(
  '@/features/theme-dashboard',
  async () =>
    await import('@/features/theme-dashboard/components/ThemePrefectureContext')
);
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: fetchMock }));
function SwitchPrefecture() {
  const { setSelected } = useThemePrefecture();
  return (
    <>
      <button onClick={() => setSelected('13000')}>東京へ切替</button>
      <button onClick={() => setSelected('47000')}>沖縄へ切替</button>
      <button onClick={() => setSelected(null)}>全国へ切替</button>
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
      <SwitchPrefecture />
      {children}
    </ThemePrefectureProvider>
  );
}
const snapshot = parseGraduationPathsSnapshot(graduationPathsFixture())!;
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  fetchMock.mockReset();
});

describe('進路8区分と同一分母', () => {
  it('47県と全国の人数・割合を同じ選択行から返す', () => {
    for (const area of [...snapshot.rows, snapshot.national]) {
      const view = selectGraduationPathsView(snapshot, area.areaCode)!;
      expect(view.categories).toHaveLength(8);
      expect(
        view.categories.reduce((total, category) => total + category.count, 0)
      ).toBe(view.total);
      expect(
        view.categories.reduce((total, category) => total + category.share, 0)
      ).toBeCloseTo(100, 10);
      view.categories.forEach((category, index) => {
        expect(category.count).toBe(area.categories[index].count);
        expect(category.share).toBeCloseTo(
          (area.categories[index].count / area.total) * 100,
          10
        );
      });
    }
    expect(selectGraduationPathsView(snapshot, null)).toEqual(
      selectGraduationPathsView(snapshot, '00000')
    );
    expect(selectGraduationPathsView(snapshot, '99999')).toBeNull();
  });
  it('内数112人を8区分へ加算せず不詳37人を残す', () => {
    const view = selectGraduationPathsView(snapshot, null)!;
    expect(view.total).toBe(929157);
    expect(view.overlapEmployed).toBe(112);
    expect(
      view.categories.find((category) => category.key === 'unknown')?.count
    ).toBe(37);
    const { container } = render(
      <Context>
        <ThemeGraduationPathsClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(
      8
    );
    expect(container.querySelector('[data-total]')?.textContent).toBe(
      '929,157'
    );
    expect(
      container.querySelector('[data-overlap-employed]')?.textContent
    ).toContain('112人');
    expect(
      container.querySelector('[data-category-key="unknown"] [data-count]')
        ?.textContent
    ).toBe('37');
  });
  it('共通県選択で東京・沖縄・全国へ人数と割合の分母を切り替える', () => {
    const { container } = render(
      <Context>
        <ThemeGraduationPathsClient snapshot={snapshot} />
      </Context>
    );
    for (const [button, code] of [
      ['東京へ切替', '13000'],
      ['沖縄へ切替', '47000'],
      ['全国へ切替', '00000'],
    ]) {
      fireEvent.click(screen.getByRole('button', { name: button }));
      const view = selectGraduationPathsView(snapshot, code)!;
      expect(
        container
          .querySelector('[data-area-code]')
          ?.getAttribute('data-area-code')
      ).toBe(code);
      expect(
        Number(
          container.querySelector('[data-total]')?.getAttribute('data-total')
        )
      ).toBe(view.total);
      expect(
        Number(
          container
            .querySelector('[data-category-key="university"] [data-share]')
            ?.getAttribute('data-share')
        )
      ).toBeCloseTo(view.categories[0].share, 10);
      expect(screen.getByRole('table').getAttribute('aria-label')).toContain(
        code === '00000' ? '全国' : view.areaName
      );
    }
  });
  it('初期県を受け取り、未知の県を全国値で代用しない', () => {
    const { unmount } = render(
      <Context code="13000">
        <ThemeGraduationPathsClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.getByRole('table').getAttribute('aria-label')).toContain(
      '東京都'
    );
    unmount();
    render(
      <Context code="99999">
        <ThemeGraduationPathsClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('選択した地域');
  });
  it('学校所在地・課程・卒業年・別定義の就職割合を明記する', () => {
    render(
      <Context>
        <ThemeGraduationPathsClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.getByText(/2025年3月卒業/)).toBeTruthy();
    expect(screen.getByText(/卒業した学校の所在地/).textContent).toContain(
      '通信制高校・中等教育学校・特別支援学校'
    );
    expect(screen.getByText(/この表の「就職者等」/).textContent).toContain(
      '公式の就職割合とは定義が異なります'
    );
    expect(
      screen
        .getByRole('link', { name: '出典: ' + GRADUATION_PATHS_SOURCE.title })
        .getAttribute('href')
    ).toBe(GRADUATION_PATHS_SOURCE.url);
    expect(screen.getByRole('table').parentElement?.className).toContain(
      'overflow-auto'
    );
  });
});
describe('R2取得境界', () => {
  it('canonical keyだけを取得して検証済みsnapshotをclientへ渡す', async () => {
    fetchMock.mockResolvedValue(snapshot);
    const result = await ThemeGraduationPathsSection();
    expect(fetchMock).toHaveBeenCalledWith(
      'app/themes/education-culture/graduation-paths.json'
    );
    expect(result.props.snapshot).toEqual(snapshot);
  });
  it.each([
    null,
    { ...snapshot, period: '2024-03' },
    { ...snapshot, source: { ...snapshot.source, sha256: '0'.repeat(64) } },
  ])('欠損/違う年/違う原典を描画しない', async (invalid) => {
    fetchMock.mockResolvedValue(invalid);
    render(await ThemeGraduationPathsSection());
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('取得失敗時は確認済みデータの取得不能を表示する', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    render(await ThemeGraduationPathsSection());
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('取得できません');
  });
});
