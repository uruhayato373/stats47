import React from 'react';

import { DEPOPULATED_SETTLEMENTS_SOURCE as source } from '@stats47/data-configs/theme-catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ThemePrefectureProvider,
  useThemePrefecture,
} from '@/features/theme-dashboard/components/ThemePrefectureContext';

import { ThemeDepopulatedSettlementsClient } from '../components/ThemeDepopulatedSettlementsClient';
import { ThemeDepopulatedSettlementsSection } from '../components/ThemeDepopulatedSettlementsSection';
import { selectDepopulatedSettlementsView } from '../lib/depopulated-settlements-view';

import { depopulatedSettlementsFixture } from './depopulated-settlements-fixture';
vi.mock(
  '@/features/theme-dashboard',
  async () =>
    await import('@/features/theme-dashboard/components/ThemePrefectureContext')
);
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: fetchMock }));
const snapshot = depopulatedSettlementsFixture();
function Switch() {
  const { setSelected } = useThemePrefecture();
  return (
    <>
      {[
        ['15000', '新潟'],
        ['18000', '福井'],
        ['47000', '沖縄'],
        ['00000', '全国'],
      ].map(([code, name]) => (
        <button
          key={code}
          onClick={() => setSelected(code === '00000' ? null : code)}
        >
          {name}へ切替
        </button>
      ))}
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
      <Switch />
      {children}
    </ThemePrefectureProvider>
  );
}
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  fetchMock.mockReset();
});
describe('県選択と公表地理を混同しない集落表示', () => {
  it('47県の選択から公式ブロック行を返し、県の観測値を作らない', () => {
    for (const block of source.blocks)
      for (const code of block.prefectureCodes) {
        const view = selectDepopulatedSettlementsView(snapshot, code)!;
        expect(view.blockCode).toBe(block.blockCode);
        expect(view.total).toBe(
          snapshot.rows.find((row) => row.blockCode === block.blockCode)!.total
        );
        expect(view.geography).toBe('survey-block');
        expect(
          view.categories.reduce((sum, category) => sum + category.share, 0)
        ).toBeCloseTo(100, 10);
        expect('areaCode' in view).toBe(false);
      }
    expect(selectDepopulatedSettlementsView(snapshot, '15000')?.blockName).toBe(
      '東北圏'
    );
    expect(selectDepopulatedSettlementsView(snapshot, '18000')?.blockName).toBe(
      '北陸圏'
    );
    expect(selectDepopulatedSettlementsView(snapshot, '19000')?.blockName).toBe(
      '首都圏'
    );
    expect(selectDepopulatedSettlementsView(snapshot, '24000')?.blockName).toBe(
      '中部圏'
    );
    expect(selectDepopulatedSettlementsView(snapshot, '99999')).toBeNull();
  });
  it('全国で7区分と10ブロックを表示し、無回答を分母へ残す', () => {
    const { container } = render(
      <Context>
        <ThemeDepopulatedSettlementsClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.getAllByRole('table')).toHaveLength(2);
    expect(
      screen.getAllByRole('table')[0].querySelectorAll('tbody tr')
    ).toHaveLength(7);
    expect(
      screen.getAllByRole('table')[1].querySelectorAll('tbody tr')
    ).toHaveLength(10);
    expect(container.querySelector('[data-total]')?.textContent).toBe('78,485');
    expect(
      container.querySelector(
        '[data-category-key="unknownAgeShare"] [data-count]'
      )?.textContent
    ).toBe('1,388');
    expect(
      Number(
        container
          .querySelector('[data-category-key="unknownAgeShare"] [data-share]')
          ?.getAttribute('data-share')
      )
    ).toBeCloseTo((1388 / 78485) * 100, 10);
    expect(
      container.querySelector('[data-half-or-more]')?.textContent
    ).toContain('31,515集落（40.2%）');
    expect(
      container.querySelector('[data-half-or-more]')?.textContent
    ).toContain('1,458集落');
  });
  it('共通県選択で新潟→東北、福井→北陸、沖縄→沖縄県の明示を切り替える', () => {
    const { container } = render(
      <Context>
        <ThemeDepopulatedSettlementsClient snapshot={snapshot} />
      </Context>
    );
    for (const [label, code, block] of [
      ['新潟', '15000', '東北圏'],
      ['福井', '18000', '北陸圏'],
      ['沖縄', '47000', '沖縄県'],
    ]) {
      fireEvent.click(screen.getByRole('button', { name: `${label}へ切替` }));
      const view = selectDepopulatedSettlementsView(snapshot, code)!;
      expect(screen.getAllByRole('table')).toHaveLength(1);
      expect(screen.getByRole('table').getAttribute('aria-label')).toContain(
        `${block}（地方ブロックの集計）`
      );
      expect(
        container.querySelector('[data-geography-notice]')?.textContent
      ).toContain(
        code === '47000'
          ? 'このブロックは1道県だけで構成されます'
          : '県単独の値はこの表に公表されていません'
      );
      expect(
        container
          .querySelector('[data-block-code]')
          ?.getAttribute('data-block-code')
      ).toBe(view.blockCode);
      expect(
        Number(
          container.querySelector('[data-total]')?.getAttribute('data-total')
        )
      ).toBe(view.total);
    }
    fireEvent.click(screen.getByRole('button', { name: '全国へ切替' }));
    expect(screen.getAllByRole('table')).toHaveLength(2);
  });
  it('年・調査対象区域・原表・ブロック定義を読者へ表示する', () => {
    render(
      <Context code="15000">
        <ThemeDepopulatedSettlementsClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.getByText(/2024年4月1日時点/)).toBeTruthy();
    expect(screen.getByText(source.universe)).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: `出典: ${source.title}` })
        .getAttribute('href')
    ).toBe(`${source.url}#page=81`);
    expect(
      screen
        .getByRole('link', { name: /原典の地方ブロック定義/ })
        .getAttribute('href')
    ).toBe(`${source.url}#page=19`);
    expect(screen.getByRole('table').parentElement?.className).toContain(
      'overflow-auto'
    );
  });
  it('不明な県を全国やブロックへ置換しない', () => {
    render(
      <Context code="99999">
        <ThemeDepopulatedSettlementsClient snapshot={snapshot} />
      </Context>
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
describe('R2 source gate', () => {
  it('唯一のcanonical profileキーを取得し厳格検証する', async () => {
    fetchMock.mockResolvedValue(snapshot);
    const section = await ThemeDepopulatedSettlementsSection();
    expect(fetchMock).toHaveBeenCalledWith(
      'app/themes/aging-society/depopulated-settlements.json'
    );
    expect(section.props.snapshot).toEqual(snapshot);
  });
  it.each([
    null,
    { ...snapshot, geography: 'prefecture' },
    { ...snapshot, period: '2019-04-01' },
  ])('不正/欠測snapshotを表示しない', async (invalid) => {
    fetchMock.mockResolvedValue(invalid);
    render(await ThemeDepopulatedSettlementsSection());
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('取得できません');
  });
  it('取得例外時に未確認値を作らない', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    render(await ThemeDepopulatedSettlementsSection());
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
