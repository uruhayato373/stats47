import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * SingleMetricCard の契約 (2026-09-17 新設)。
 *
 * 有効指標が 1 件しかないグループのカード。選択肢が 1 つしかないので
 * MetricSwitcherPanel が持つ選択 UI (チェックボックス・タブ・選択タイル) を出さない。
 * 守りたいのは:
 *  (a) 選択 UI を一切描かない (選択肢が無いので意味がない)
 *  (b) 見出しと本文で指標名を重複表示しない
 *  (c) 推移は県選択時だけ、この指標 1 件分を自地域+全国の 2 回で遅延取得する
 *      (summaryOnly / 未選択では取得しない)
 *  (d) 異なる年が 5 件以上のときだけ MiniLineChart を描く (2〜4 年は直線に近い線にしかならない。2026-10-30)。固定高のローディング枠・
 *      空状態枠は置かない (情報密度優先)
 *  (e) 計算型指標は R2 平均へ退避し「都道府県平均」と称す (「全国」ではない)
 *  (f) 単年しかない指標は推移も理由の案内も置かない (2026-10-29 に変更。参考サイトも理由を書かない)
 *  (g) 部品は数値タイル StatTile (台帳 data/design/components.json の stat-tile)
 */

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock('../../lib/batched-metric-timeseries', () => ({
  fetchMetricTimeseriesBatched: (...args: unknown[]) => fetchMock(...args),
}));

/** MiniLineChart は D3 実描画なので、渡された points/seriesName を data 属性で覗ける stub にする */
vi.mock('@/components/charts/MiniCharts', () => ({
  MiniLineChart: ({
    points,
    seriesName,
    unit,
  }: {
    points: { year: number; value: number }[];
    seriesName: string;
    unit?: string;
  }) => (
    <div
      data-testid="mini-line-chart"
      data-points={JSON.stringify(points)}
      data-series-name={seriesName}
      data-unit={unit ?? ''}
    />
  ),
}));

import { SingleMetricCard } from '../SingleMetricCard';

import type { MetricKpi } from '../metric-kpi';

const kpi = (metricKey: string, over: Partial<MetricKpi> = {}): MetricKpi => ({
  metricKey,
  trendDomain: {mode: "extent", padding: 0.08},
  title: `${metricKey} タイトル`,
  unit: '円',
  value: 100,
  rank: null,
  total: 47,
  series: [],
  isLoading: false,
  ...over,
});

const points = (values: number[]) =>
  values.map((v, i) => ({
    year: `${2020 + i}`,
    yearName: `${2020 + i}年`,
    value: v,
  }));

function renderCard(
  over: Partial<React.ComponentProps<typeof SingleMetricCard>> = {}
) {
  return render(
    <SingleMetricCard
      metric={kpi('wage')}
      tabLabels={{}}
      selectedPrefectureCode={null}
      areaName="47都道府県"
      {...over}
    />
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ points: points([1, 2, 3]), source: 'national' });
});

describe('SingleMetricCard — 値の表示', () => {
  it('全国の値が無い指標は全国のページで値が「—」になる (47 県の平均や 1 位の県で埋めない)', () => {
    const { container } = renderCard({
      metric: kpi('unsupported-metric', { value: null }),
    });
    expect(container.textContent).toContain('—');
    expect(container.textContent).toContain('全国の値は未収録');
    const wrapper = container.querySelector('[data-theme-component-type="kpi-card"]');
    expect(wrapper).toHaveAttribute('data-data-state', 'no-data');
  });
});

describe('SingleMetricCard — 全国のページ', () => {
  it('手元の全国の系列で推移を描き、時系列を取りに行かない', () => {
    renderCard({
      metric: kpi('national', { officialNationalSeries: [2020, 2021, 2022, 2023, 2024].map((year, i) => ({ year, value: 5 + i })) }),
    });
    expect(screen.getByTestId('mini-line-chart')).toHaveAttribute('data-series-name', '全国');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('47 都道府県を並べる位置の図を置かない (比較はランキングのページ)', () => {
    const { container } = renderCard({ metric: kpi('single', { yearName: '2020年' }) });
    expect(container.querySelector('svg[role="img"]')).toBeNull();
  });
});

describe('SingleMetricCard — 推移の退避表記', () => {
  it('計算型指標は R2 平均へ退避し「都道府県平均」と示す', async () => {
    fetchMock.mockResolvedValue({ points: [], source: 'none' });
    renderCard({
      metric: kpi('calc', {
        series: [2020, 2021, 2022, 2023, 2024].map((year, i) => ({ year, value: 5 + i })),
      }),
      selectedPrefectureCode: '13000',
      areaName: '東京都',
    });
    await waitFor(() =>
      expect(screen.getByTestId('mini-line-chart')).toBeInTheDocument()
    );
    expect(screen.getByTestId('mini-line-chart')).toHaveAttribute(
      'data-series-name',
      '都道府県平均'
    );
  });

  it('単年しかない指標は推移も理由の案内も置かない (値の行に年を示す)', async () => {
    fetchMock.mockResolvedValue({ points: points([42]), source: 'area' });
    const { container } = renderCard({
      metric: kpi('wage', { yearName: '2020年' }),
      selectedPrefectureCode: '13000',
      areaName: '東京都',
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByTestId('mini-line-chart')).toBeNull();
    expect(screen.queryByText(/単年データ/)).toBeNull();
    expect(screen.queryByText('推移データがありません')).toBeNull();
    // 補足の行に実年 (yearName) を示す
    expect(container.textContent).toContain('2020年');
  });
});

describe('SingleMetricCard — 数値タイル (部品の台帳 stat-tile)', () => {
  it('StatTile で描き、県選択時は順位をバッジ、出典・ランキングのリンク行を下端に置く', () => {
    const { container } = renderCard({
      metric: kpi('wage', { rank: 3 }),
      selectedPrefectureCode: '13000',
      areaName: '東京都',
    });
    const tile = container.querySelector('[data-slot-kind="stat-tile"]');
    expect(tile).not.toBeNull();
    expect(tile!.textContent).toContain('3位');
    const footer = tile!.querySelector('[data-slot="stat-tile-footer"]');
    expect(footer?.querySelector('a[href="/ranking/wage"]')).not.toBeNull();
  });

  it('全国のページは順位バッジも 1 位の県も出さない (全国の値だけ)', () => {
    const { container } = renderCard({ metric: kpi('wage', { rank: 3 }) });
    expect(container.textContent).not.toContain('3位');
    expect(container.textContent).not.toContain('1位');
  });
});

describe('SingleMetricCard — 選択 UI を持たない (選択肢が 1 件)', () => {
  it('選択肢が 1 件なので checkbox / tab / 選択タイルを描かない', () => {
    renderCard();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(document.querySelector('[aria-pressed]')).toBeNull();
  });
});

describe('SingleMetricCard — 見出しと本文の重複表示', () => {
  it('指標名を見出しと本文で重複表示しない (title 未指定なら見出し 1 回だけ / title 指定時はラベルを 1 回)', () => {
    const { unmount } = renderCard({ metric: kpi('wage'), tabLabels: {} });
    // title 未指定: heading = label = metric.title。本文に同じ文字列を重ねない
    expect(screen.getAllByText('wage タイトル')).toHaveLength(1);
    unmount();

    renderCard({
      metric: kpi('wage'),
      title: '賃金の水準',
      tabLabels: { wage: '所定内給与' },
    });
    // title 指定時: 見出しは「賃金の水準」、本文にラベル「所定内給与」を 1 回だけ添える
    expect(screen.getAllByText('賃金の水準')).toHaveLength(1);
    expect(screen.getAllByText('所定内給与')).toHaveLength(1);
  });
});

describe('SingleMetricCard — チャート枠の固定高を持たない', () => {
  it('時系列が 2 時点未満なら固定高のチャート枠・ローディング枠を描かない', () => {
    // 未選択 (fetch しない) → trend は必ず 'none'
    const { container } = renderCard();
    expect(container.querySelector('[style*="height: 250px"]')).toBeNull();
    expect(container.querySelector('[style*="height: 80px"]')).toBeNull();
    expect(screen.queryByTestId('mini-line-chart')).toBeNull();
  });
});

describe('SingleMetricCard — 取得の契約', () => {
  it('県選択時はこの指標の自地域+全国だけを 1 回ずつ取得し、summaryOnly と未選択では取得しない', async () => {
    const { unmount: unmountSelected } = renderCard({
      selectedPrefectureCode: '13000',
      areaName: '東京都',
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const requestedAreas = fetchMock.mock.calls.map((c) => c[1]).sort();
    expect(requestedAreas).toEqual(['00000', '13000']);
    const requestedKeys = fetchMock.mock.calls.map((c) => c[0]);
    expect(requestedKeys.every((k) => k === 'wage')).toBe(true);
    unmountSelected();

    fetchMock.mockClear();
    const { unmount: unmountSummary } = renderCard({
      summaryOnly: true,
      selectedPrefectureCode: '13000',
      areaName: '東京都',
    });
    expect(fetchMock).not.toHaveBeenCalled();
    unmountSummary();

    fetchMock.mockClear();
    renderCard({ selectedPrefectureCode: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('異なる年が 5 件以上のときだけ MiniLineChart を描く', async () => {
    fetchMock.mockResolvedValue({
      points: points([1, 2, 3, 4, 5]),
      source: 'area',
    });
    renderCard({ selectedPrefectureCode: '13000', areaName: '東京都' });
    await waitFor(() =>
      expect(screen.getByTestId('mini-line-chart')).toBeInTheDocument()
    );
    const chartPoints = JSON.parse(
      screen.getByTestId('mini-line-chart').getAttribute('data-points') ?? '[]'
    );
    expect(chartPoints).toHaveLength(5);
  });

  it('2 年 (2023・2024 の直線) では描かない', async () => {
    fetchMock.mockResolvedValue({ points: points([1, 2]), source: 'area' });
    renderCard({ selectedPrefectureCode: '13000', areaName: '東京都' });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId('mini-line-chart')).toBeNull();
  });
});

describe('SingleMetricCard — data 属性とランキング導線', () => {
  // 出典とランキングはタイルの下端に並べず、右上のアイコンから開く Sheet に置く (2026-10-30)
  it('data 属性 (kpi-card / ready) と、右上のアイコンから開くランキング導線を持つ', async () => {
    const { container } = renderCard({ metric: kpi('wage') });
    const wrapper = container.querySelector(
      '[data-theme-component-type="kpi-card"]'
    );
    expect(wrapper).toHaveAttribute('data-data-state', 'ready');
    expect(wrapper).toHaveAttribute('data-unit', '円');
    expect(screen.queryByRole('link', { name: /ランキングを見る/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '出典・指標の定義' }));
    const link = await screen.findByRole('link', { name: /ランキングを見る/ });
    expect(link).toHaveAttribute('href', '/ranking/wage');
  });
});
