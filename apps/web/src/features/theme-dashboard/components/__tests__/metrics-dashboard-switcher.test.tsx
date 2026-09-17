import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

/**
 * ThemeMetricsDashboard が KPI をどう描くかの契約。
 *
 * 2026-09-17 に件数契約へ置換: 1 件=SingleMetricCard / 2 件以上=MetricSwitcherPanel /
 * 判定は観測不足フィルタ後の実件数 / テーマ固有分岐なし。
 */

vi.mock('../MetricSwitcherPanel', () => ({
  MetricSwitcherPanel: ({
    metrics,
    title,
    defaultCheckedKeys,
  }: {
    metrics: { metricKey: string; title: string }[];
    title?: string;
    defaultCheckedKeys?: string[];
  }) => (
    <div
      data-testid="switcher-panel"
      data-keys={metrics.map((m) => m.metricKey).join(',')}
      data-metric-titles={metrics.map((m) => m.title).join(',')}
      data-title={title ?? ''}
      data-default={(defaultCheckedKeys ?? []).join(',')}
    />
  ),
}));
vi.mock('../SingleMetricCard', () => ({
  SingleMetricCard: ({
    metric,
    title,
  }: {
    metric: { metricKey: string; title: string };
    title?: string;
  }) => (
    <div
      data-testid="single-card"
      data-keys={metric.metricKey}
      data-metric-titles={metric.title}
      data-title={title ?? ''}
    />
  ),
}));
vi.mock('../ThemeDbChartRenderer', () => ({
  ThemeDbChartRenderer: () => <div />,
}));

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock('../../actions', () => ({
  fetchMetricTimeseriesAction: (...args: unknown[]) => fetchMock(...args),
}));

import type { PageComponent } from '@/components/stat-charts';

import { ThemeMetricsDashboard } from '../ThemeMetricsDashboard';

import type { ThemeConfig, ThemeIndicatorData } from '../../types';

const METRIC_KEY = 'wage';

/** KPI に採用されるには MIN_VALUES_FOR_KPI (=10) 以上の観測が要る */
function indicatorData(
  title: string,
  unit: string,
  valueCount = 12,
  readerLabel?: string
): ThemeIndicatorData {
  return {
    rankingItem: { title, readerLabel, unit },
    rankingValues: Array.from({ length: valueCount }, (_, i) => ({
      areaCode: String(i + 1).padStart(5, '0'),
      value: 100 + i,
      rank: i + 1,
    })),
    nationalSeries: [
      { year: 2020, value: 1 },
      { year: 2021, value: 2 },
    ],
  } as unknown as ThemeIndicatorData;
}

const indicatorDataMap: Record<string, ThemeIndicatorData> = {
  [METRIC_KEY]: indicatorData('賃金', '円'),
  ratio: indicatorData('有効求人辺率', '倍'),
  telework: indicatorData('テレワーク率', '％'),
  /** 観測 3 件 = MIN_VALUES_FOR_KPI 未満なので KPI に採用されない */
  thin: indicatorData('観測不足', '円', 3),
};

function themeConfig(
  themeKey: string,
  keys: string[] = [METRIC_KEY]
): ThemeConfig {
  return {
    themeKey,
    tabIndicators: keys.map((k) => ({ rankingKey: k, tabLabel: k })),
    defaultRankingKey: keys[0],
  } as unknown as ThemeConfig;
}

function renderDashboard(
  themeKey: string,
  over: Partial<React.ComponentProps<typeof ThemeMetricsDashboard>> = {}
) {
  return render(
    <ThemeMetricsDashboard
      themeConfig={themeConfig(themeKey)}
      indicatorDataMap={indicatorDataMap}
      selectedPrefectureCode={null}
      {...over}
    />
  );
}

function panels() {
  return screen.queryAllByTestId('switcher-panel');
}

function singleCards() {
  return screen.queryAllByTestId('single-card');
}

describe('ThemeMetricsDashboard — KPI の描画', () => {
  it.each([
    'labor-wages',
    'population-dynamics',
    'safety',
    'occupation-salary',
  ])(
    '%s は複数指標で切替パネル・単一指標でカードになる (テーマ別の分岐を持たない)',
    (themeKey) => {
      const { unmount } = renderDashboard(themeKey, {
        themeConfig: themeConfig(themeKey, [METRIC_KEY, 'ratio', 'telework']),
      });
      expect(screen.getByTestId('switcher-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('single-card')).toBeNull();
      unmount();

      renderDashboard(themeKey);
      expect(screen.getByTestId('single-card')).toBeInTheDocument();
      expect(screen.queryByTestId('switcher-panel')).toBeNull();
    }
  );

  it('旧 ChartCard グリッドの導線を描かない (二重表示の復活防止)', () => {
    renderDashboard('population-dynamics');
    // 旧グリッドは各カード footer に /ranking/<key> リンクを持っていた。
    // 現在この導線はパネル内のフッター 1 本だけが担う (パネルは mock 済 = 0 本)
    expect(screen.queryByRole('link', { name: /ランキングを見る/ })).toBeNull();
  });

  it('★KPI の一括全国 fetch を行わない (選択指標だけをパネルが遅延取得する)', () => {
    fetchMock.mockClear();
    renderDashboard('population-dynamics');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("主要指標の重複見出しは読み上げ用だけに残す ('47都道府県'、'全国'ではない)", () => {
    renderDashboard('education-culture');
    expect(
      screen.getByRole('heading', { name: '47都道府県の主要指標' })
    ).toHaveClass('sr-only');
  });

  it('カードには tabIndicators 由来の指標が渡る', () => {
    renderDashboard('labor-wages');
    expect(screen.getByTestId('single-card')).toHaveAttribute(
      'data-keys',
      METRIC_KEY
    );
  });

  it('正式指標名ではなく読者向けラベルをカードへ渡す', () => {
    renderDashboard('education-culture', {
      indicatorDataMap: {
        [METRIC_KEY]: indicatorData(
          '日曜大工の行動者率',
          '％',
          12,
          '日曜大工をした人の割合'
        ),
      },
    });
    expect(screen.getByTestId('single-card')).toHaveAttribute(
      'data-metric-titles',
      '日曜大工をした人の割合'
    );
  });
});

describe('ThemeMetricsDashboard — 指標カードの編成 (metricGroups)', () => {
  const THREE = [METRIC_KEY, 'ratio', 'telework'];

  it('metricGroups があればグループ数ぶんのカードに分かれ、件数で種類が決まる', () => {
    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig('labor-wages', THREE)}
        metricGroups={[
          {
            key: 'level',
            title: '賃金の水準',
            rankingKeys: [METRIC_KEY],
            defaultCheckedKeys: [METRIC_KEY],
          },
          {
            key: 'market',
            title: '労働市場',
            rankingKeys: ['ratio', 'telework'],
            defaultCheckedKeys: ['ratio', 'telework'],
          },
        ]}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />
    );
    const single = singleCards();
    const multi = panels();
    expect(single).toHaveLength(1);
    expect(single[0]).toHaveAttribute('data-title', '賃金の水準');
    expect(single[0]).toHaveAttribute('data-keys', METRIC_KEY);
    expect(multi).toHaveLength(1);
    expect(multi[0]).toHaveAttribute('data-title', '労働市場');
    expect(multi[0]).toHaveAttribute('data-keys', 'ratio,telework');
    expect(multi[0]).toHaveAttribute('data-default', 'ratio,telework');
  });

  it('metricGroups 未定義なら全 KPI を 1 枚に倒す (カタログ未登録テーマを壊さない)', () => {
    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig('climate', THREE)}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />
    );
    const found = panels();
    expect(found).toHaveLength(1);
    expect(found[0]).toHaveAttribute('data-keys', THREE.join(','));
    // 見出しは section の h2 が言うのでパネル側には渡さない
    expect(found[0]).toHaveAttribute('data-title', '');
    expect(found[0]).toHaveAttribute('data-default', METRIC_KEY);
  });

  it('観測不足で KPI から落ちたキーはグループからも除き、生存 1 件なら SingleMetricCard になる', () => {
    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig('labor-wages', [METRIC_KEY, 'thin'])}
        metricGroups={[
          {
            key: 'level',
            title: '賃金の水準',
            rankingKeys: [METRIC_KEY, 'thin'],
            defaultCheckedKeys: [METRIC_KEY, 'thin'],
          },
        ]}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />
    );
    expect(panels()).toHaveLength(0);
    const found = singleCards();
    expect(found).toHaveLength(1);
    expect(found[0]).toHaveAttribute('data-keys', METRIC_KEY);
  });

  it('グループの指標が全滅したらそのカードは描かない (空カードを置かない)', () => {
    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig('labor-wages', [METRIC_KEY, 'thin'])}
        metricGroups={[
          {
            key: 'level',
            title: '賃金の水準',
            rankingKeys: [METRIC_KEY],
            defaultCheckedKeys: [METRIC_KEY],
          },
          {
            key: 'dead',
            title: '観測不足のみ',
            rankingKeys: ['thin'],
            defaultCheckedKeys: ['thin'],
          },
        ]}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />
    );
    const found = singleCards();
    expect(found).toHaveLength(1);
    expect(found[0]).toHaveAttribute('data-title', '賃金の水準');
    expect(panels()).toHaveLength(0);
  });
});

describe('ThemeMetricsDashboard — 連続する 1 指標カードのグリッド化', () => {
  const compactIndicatorDataMap: Record<string, ThemeIndicatorData> = {
    a1: indicatorData('A指標', '円'),
    b1: indicatorData('B指標', '円'),
    c1: indicatorData('C1指標', '円'),
    c2: indicatorData('C2指標', '円'),
    d1: indicatorData('D指標', '円'),
  };

  it('連続する 1 指標カードが 2 件以上のときだけ compact grid で包み、順序を保ち、切替パネルは grid の外', () => {
    const { container } = render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig('labor-wages', ['a1', 'b1', 'c1', 'c2', 'd1'])}
        metricGroups={[
          { key: 'a', title: 'A', rankingKeys: ['a1'], defaultCheckedKeys: ['a1'] },
          { key: 'b', title: 'B', rankingKeys: ['b1'], defaultCheckedKeys: ['b1'] },
          {
            key: 'c',
            title: 'C',
            rankingKeys: ['c1', 'c2'],
            defaultCheckedKeys: ['c1', 'c2'],
          },
          { key: 'd', title: 'D', rankingKeys: ['d1'], defaultCheckedKeys: ['d1'] },
        ]}
        indicatorDataMap={compactIndicatorDataMap}
        selectedPrefectureCode={null}
      />
    );

    // DOM 順は metricGroups の定義順 (A, B, C, D) のまま
    const order = [...container.querySelectorAll('[data-testid]')].map((el) =>
      el.getAttribute('data-keys')
    );
    expect(order).toEqual(['a1', 'b1', 'c1,c2', 'd1']);

    const grids = container.querySelectorAll('[data-theme-panel-grid="compact"]');
    expect(grids).toHaveLength(1);
    const grid = grids[0] as HTMLElement;
    expect(grid).toHaveClass('grid', 'grid-cols-1', '@md:grid-cols-2');
    expect(
      within(grid)
        .getAllByTestId('single-card')
        .map((el) => el.getAttribute('data-keys'))
    ).toEqual(['a1', 'b1']);

    // 切替パネル (C) は grid の外
    expect(grid.contains(screen.getByTestId('switcher-panel'))).toBe(false);
    // 単独の D も grid の外 (連続していないので compact grid に含めない)
    const dCard = screen
      .getAllByTestId('single-card')
      .find((el) => el.getAttribute('data-keys') === 'd1');
    expect(dCard).toBeDefined();
    expect(grid.contains(dCard!)).toBe(false);
  });

  it('1 指標カードが 1 枚だけなら grid wrapper を作らない', () => {
    renderDashboard('labor-wages');
    expect(
      document.querySelector('[data-theme-panel-grid="compact"]')
    ).toBeNull();
    expect(screen.getByTestId('single-card')).toBeInTheDocument();
  });
});

describe('ThemeMetricsDashboard — 未割当チャートのグリッド', () => {
  const minimalChart = (key: string): PageComponent => ({
    componentKey: key,
    componentType: 'line-chart',
    title: key,
    description: null,
    componentProps: {},
    sourceName: null,
    sourceLink: null,
    rankingLink: null,
    gridColumnSpan: 12,
    gridColumnSpanTablet: null,
    gridColumnSpanSm: null,
    dataSource: null,
    section: null,
    sortOrder: 0,
  });

  it('1 chart しか無い未割当チャートは 2 列 grid にしない', () => {
    renderDashboard('population-dynamics', {
      pageCharts: [minimalChart('only-chart')],
    });
    const grid = document.getElementById('theme-charts');
    expect(grid).not.toBeNull();
    expect(grid?.className).not.toContain('@md:grid-cols-2');
  });

  it('2 chart 以上の未割当チャートは 2 列 grid にする', () => {
    renderDashboard('population-dynamics', {
      pageCharts: [minimalChart('chart-a'), minimalChart('chart-b')],
    });
    const grid = document.getElementById('theme-charts');
    expect(grid?.className).toContain('@md:grid-cols-2');
  });
});

describe('ThemeMetricsDashboard — chart編集情報', () => {
  const chart: PageComponent = {
    componentKey: 'test-trend',
    componentType: 'line-chart',
    title: '出生率の推移',
    description: '線の傾きから変化を確認できます。',
    componentProps: {
      annotation: '2020年に系列が接続しません。',
      rankingLinks: [
        { label: '第2指標の定義・ランキング', url: '/ranking/second' },
        { label: '第3指標の定義・ランキング', url: '/ranking/third' },
        { label: '第4指標の定義・ランキング', url: '/ranking/fourth' },
      ],
    },
    sourceName: '人口動態統計',
    sourceLink: null,
    rankingLink: '/ranking/primary',
    gridColumnSpan: 12,
    gridColumnSpanTablet: null,
    gridColumnSpanSm: null,
    dataSource: null,
    section: null,
    sortOrder: 0,
  };

  it('header定型文を隠し、footerへ固有注釈・全hub・調査導線を置く', async () => {
    const user = userEvent.setup();
    renderDashboard('population-dynamics', {
      pageCharts: [chart],
      chartSourceLinks: {
        'test-trend': [
          { label: '人口動態統計', url: '/survey/vital-statistics' },
        ],
      },
    });

    expect(screen.getByRole('region', { name: '出生率の推移' })).toBeVisible();
    expect(screen.queryByText('線の傾きから変化を確認できます。')).toBeNull();
    expect(screen.getByText('2020年に系列が接続しません。')).toBeVisible();
    expect(screen.getByRole('link', { name: '出典: 人口動態統計' })).toHaveAttribute(
      'href',
      '/survey/vital-statistics'
    );
    await user.click(screen.getByRole('button', { name: 'ランキング4件を表示' }));
    expect(
      screen.getByRole('menuitem', { name: '指標の定義・ランキング' })
    ).toHaveAttribute('href', '/ranking/primary');
    expect(screen.getByRole('menuitem', { name: '第2指標の定義・ランキング' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '第3指標の定義・ランキング' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '第4指標の定義・ランキング' })).toBeVisible();
  });
});

describe('問いごとの章', () => {
  it('指標と埋込を指定した章に置き、残余も脱落させず一度だけ描画する', () => {
    renderDashboard('population-dynamics', {
      sections: [
        { key: 'change', title: '人口はどう変わったか', description: '自然増減と社会増減を確認します。', metricGroupKeys: ['default'], embeddedSectionKeys: ['migration'] },
        { key: 'age', title: '年齢構成はどう変わったか', metricGroupKeys: ['default'], embeddedSectionKeys: ['migration'] },
      ],
      embeddedSections: { migration: <div>人口移動の地図</div>, extra: <div>補足の地図</div> },
    });
    const chapter = screen.getByRole('region', { name: '人口はどう変わったか' });
    expect(chapter).toContainElement(screen.getByTestId('single-card'));
    expect(chapter).toContainElement(screen.getByText('人口移動の地図'));
    expect(screen.getAllByText('人口移動の地図')).toHaveLength(1);
    expect(screen.getByText('補足の地図')).toBeInTheDocument();
  });
});


describe('固定年の比較グループ', () => {
  it('context指標も比較切替から到達でき、単年を時系列パネルへ送らない', async () => {
    const user = userEvent.setup();
    const first = indicatorData('元請', '百万円');
    const second = indicatorData('下請', '百万円');
    for (const data of [first, second]) {
      data.rankingValues = data.rankingValues.map((row, index) => ({
        ...row, areaCode: `${String(index + 1).padStart(2, '0')}000`, yearCode: '2023', yearName: '2023年度',
      }));
    }
    renderDashboard('fixed', {
      themeConfig: themeConfig('fixed', ['primary']),
      metricGroups: [{ key: 'fixed', title: '完成工事高', rankingKeys: ['primary', 'context'], defaultCheckedKeys: ['primary'], comparisonYear: '2023' }],
      indicatorDataMap: { primary: first, context: second },
    });
    expect(screen.queryByTestId('switcher-panel')).toBeNull();
    expect(screen.queryByTestId('single-card')).toBeNull();
    await user.click(screen.getByRole('button', { name: '下請' }));
    expect(screen.getByRole('table', { name: '2023年の都道府県比較' })).toBeVisible();
  });
});
