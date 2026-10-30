import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// 地図と表はランキングのページと同じ部品 (RankingVisualizationSection) で描く (2026-10-30)。Leaflet を描かない stub にして、
// 渡された題名・指標・強調する県だけを確かめる
vi.mock('@/features/ranking/widgets', () => ({
  RankingVisualizationSection: ({
    title,
    rankingItem,
    highlightAreaCode,
  }: {
    title: string;
    rankingItem: { title: string };
    highlightAreaCode: string | null;
  }) => (
    <div data-testid="map-and-table" data-highlight={highlightAreaCode ?? ''}>
      {title} / {rankingItem.title}
    </div>
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
  it('同年県値の中央値とポイント差を表示し、地図と表はランキングと同じ部品で県を強調する', () => {
    renderSection();
    const table = screen.getByRole('table', { name: '指標の横断比較' });
    expect(
      within(table).getByRole('row', {
        name: /割合.*10 15 -5 ポイント.*2023年.*2県/,
      })
    ).toBeVisible();
    expect(screen.getByText('対象は都道府県です。')).toBeVisible();
    // 地図と表は 1 枚のパネル。ページの県 (北海道) を強調する
    const panel = screen.getByTestId('map-and-table');
    expect(panel).toHaveTextContent('割合の地図と表');
    expect(panel).toHaveAttribute('data-highlight', '01000');
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
    expect(screen.queryByTestId('map-and-table')).toBeNull();
    expect(screen.getByRole('table', { name: '指標の横断比較' })).toBeVisible();
  });

  it('指標切替で地図の対象だけを切り替え、横断表の指標は失わない', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(
      screen.getByRole('combobox', { name: '地図と一覧の指標' })
    );
    // Base UI の選択肢はポップアップを開いた後に描かれるので、出るまで待ってから押す
    await user.click(await screen.findByRole('option', { name: '件数' }));
    expect(screen.getByTestId('map-and-table')).toHaveTextContent('件数の地図と表');
    expect(
      within(
        screen.getByRole('table', { name: '指標の横断比較' })
      ).getAllByRole('row')
    ).toHaveLength(3);
  });
});
