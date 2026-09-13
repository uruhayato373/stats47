import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../ThemeOverviewMap', () => ({
  ThemeOverviewMap: ({
    data,
    onSelect,
  }: {
    data: { rankingItem: { title: string } };
    onSelect: (code: string) => void;
  }) => (
    <button onClick={() => onSelect('13000')}>
      地図で東京都を選択: {data.rankingItem.title}
    </button>
  ),
}));

import { ThemeComparisonSection } from '../ThemeComparisonSection';
import {
  ThemePrefectureProvider,
  useThemePrefecture,
} from '../ThemePrefectureContext';

import type { ThemeConfig, ThemeIndicatorData } from '../../types';
import type { CatalogMetricGroup } from '@stats47/data-configs/theme-catalog';

const themeConfig = {
  themeKey: 'example',
  defaultRankingKey: 'rate',
  tabIndicators: [
    { rankingKey: 'rate', tabLabel: '割合' },
    { rankingKey: 'count', tabLabel: '件数' },
  ],
} as ThemeConfig;
const data = (key: string, unit: string): ThemeIndicatorData =>
  ({
    rankingItem: {
      title: key,
      unit,
      latestYear: { yearCode: '2023', yearName: '2023年' },
      annotation: '対象は都道府県です。',
    },
    rankingValues: [
      {
        areaCode: '01000',
        value: 10,
        yearCode: '2023',
        yearName: '2023年',
        rank: 0,
      },
      {
        areaCode: '13000',
        value: 20,
        yearCode: '2023',
        yearName: '2023年',
        rank: 0,
      },
      {
        areaCode: '00000',
        value: 999,
        yearCode: '2023',
        yearName: '2023年',
        rank: 0,
      },
    ],
  }) as ThemeIndicatorData;
const indicatorDataMap = { rate: data('割合', '%'), count: data('件数', '件') };

function ConnectedSection({ groups }: { groups?: CatalogMetricGroup[] }) {
  const { selectedPrefectureCode } = useThemePrefecture();
  return (
    <ThemeComparisonSection
      themeConfig={themeConfig}
      metricGroups={groups}
      indicatorDataMap={indicatorDataMap}
      selectedPrefectureCode={selectedPrefectureCode}
    />
  );
}

function renderSection(groups?: CatalogMetricGroup[]) {
  return render(
    <ThemePrefectureProvider initialAreaCode="01000" initialAreaName="北海道">
      <ConnectedSection groups={groups} />
    </ThemePrefectureProvider>
  );
}

describe('章に追加する横断比較', () => {
  it('同年県値の中央値とポイント差を表示し、地図の選択を共有する', async () => {
    const user = userEvent.setup();
    renderSection();
    const table = screen.getByRole('table', { name: '指標の横断比較' });
    expect(
      within(table).getByRole('row', {
        name: /割合.*10 15 -5 ポイント.*2023年.*2県/,
      })
    ).toBeVisible();
    expect(screen.getByText('対象は都道府県です。')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: '地図で東京都を選択: 割合' })
    );
    expect(
      within(table).getByRole('row', {
        name: /割合.*20 15 \+5 ポイント.*2023年.*2県/,
      })
    ).toBeVisible();
    expect(window.location.search).toContain('pref=13000');
  });

  it('既存グループの地図を複製せず、比較表への到達は残す', () => {
    renderSection([
      {
        key: 'fixed',
        title: '既存比較',
        rankingKeys: ['rate', 'count'],
        defaultCheckedKeys: ['rate'],
        comparisonYear: '2023',
        comparisonMap: true,
      },
    ]);
    expect(screen.queryByRole('button', { name: /地図で/ })).toBeNull();
    expect(screen.getByRole('table', { name: '指標の横断比較' })).toBeVisible();
  });

  it('指標切替で地図の対象だけを切り替え、横断表の指標は失わない', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(
      screen.getByRole('combobox', { name: '地図と一覧の指標' })
    );
    await user.click(screen.getByRole('option', { name: '件数' }));
    expect(
      screen.getByRole('button', { name: '地図で東京都を選択: 件数' })
    ).toBeVisible();
    expect(
      within(
        screen.getByRole('table', { name: '指標の横断比較' })
      ).getAllByRole('row')
    ).toHaveLength(3);
  });
});
