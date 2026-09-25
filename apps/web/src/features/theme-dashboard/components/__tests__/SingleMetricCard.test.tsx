import { render, screen, waitFor } from '@testing-library/react';
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
 *  (d) 異なる年が 2 件以上のときだけ MiniLineChart を描く。固定高のローディング枠・
 *      空状態枠は置かない (情報密度優先)
 *  (e) 計算型指標は R2 平均へ退避し「都道府県平均」と称す (「全国」ではない)
 *  (f) 単年しかない指標は「単年データ」と理由を書く (取得失敗と区別する)
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
  title: `${metricKey} タイトル`,
  unit: '円',
  value: 100,
  rank: null,
  total: 47,
  series: [],
  topRanked: { areaCode: '13000', areaName: '東京都', value: 999 },
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
  it('topRanked が無い指標は値が「—」になる (0 を捏造しない)', () => {
    const { container } = renderCard({
      metric: kpi('unsupported-metric', { topRanked: null, value: null }),
    });
    expect(container.textContent).toContain('—');
    const wrapper = container.querySelector('[data-theme-component-type="kpi-card"]');
    expect(wrapper).toHaveAttribute('data-data-state', 'no-data');
  });
});

describe('SingleMetricCard — 推移の退避表記', () => {
  it('計算型指標は R2 平均へ退避し「都道府県平均」と示す', async () => {
    fetchMock.mockResolvedValue({ points: [], source: 'none' });
    renderCard({
      metric: kpi('calc', {
        series: [
          { year: 2020, value: 5 },
          { year: 2021, value: 6 },
        ],
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

  it('単年しかない指標は「単年データ」と理由を書く (取得失敗と区別する)', async () => {
    fetchMock.mockResolvedValue({ points: points([42]), source: 'national' });
    renderCard({ selectedPrefectureCode: '13000', areaName: '東京都' });

    await waitFor(() =>
      expect(screen.getByText(/2020年の単年データのため/)).toBeInTheDocument()
    );
    expect(screen.queryByText('推移データがありません')).toBeNull();
    expect(screen.queryByTestId('mini-line-chart')).toBeNull();
  });

  it('単年のときも重複するカード説明を追加しない', async () => {
    fetchMock.mockResolvedValue({ points: points([42]), source: 'national' });
    renderCard({ selectedPrefectureCode: '13000', areaName: '東京都' });
    await waitFor(() =>
      expect(screen.getByText(/2020年の単年データのため/)).toBeInTheDocument()
    );
    expect(screen.queryByText('2020年時点の値')).toBeNull();
  });

  it('単年は自然高の案内と実年を示す', async () => {
    fetchMock.mockResolvedValue({ points: points([1]), source: 'area' });
    const { container } = renderCard({
      metric: kpi('wage', { yearName: '2020年' }),
      selectedPrefectureCode: '13000',
      areaName: '東京都',
    });
    const message = await screen.findByText(/2020年の単年データ/);
    expect(message.tagName).toBe('P');
    expect(message).not.toHaveStyle({ height: '250px' });
    // 本文の値行にも実年 (yearName) を示す
    expect(container.textContent).toContain('2020年');
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

  it('異なる年が 2 件以上のときだけ MiniLineChart を描く', async () => {
    fetchMock.mockResolvedValue({
      points: points([1, 2]),
      source: 'area',
    });
    renderCard({ selectedPrefectureCode: '13000', areaName: '東京都' });
    await waitFor(() =>
      expect(screen.getByTestId('mini-line-chart')).toBeInTheDocument()
    );
    const chartPoints = JSON.parse(
      screen.getByTestId('mini-line-chart').getAttribute('data-points') ?? '[]'
    );
    expect(chartPoints).toHaveLength(2);
  });
});

describe('SingleMetricCard — data 属性とランキング導線', () => {
  it('data 属性 (kpi-card / ready) とランキング導線を持つ', async () => {
    const { container } = renderCard({ metric: kpi('wage') });
    const wrapper = container.querySelector(
      '[data-theme-component-type="kpi-card"]'
    );
    expect(wrapper).toHaveAttribute('data-data-state', 'ready');
    expect(wrapper).toHaveAttribute('data-unit', '円');
    const link = await screen.findByRole('link', { name: /ランキングを見る/ });
    expect(link).toHaveAttribute('href', '/ranking/wage');
  });
});
