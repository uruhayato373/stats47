/**
 * テーマページの KPI 1 件。
 *
 * `ThemeMetricsDashboard` が indicatorDataMap から導出し、旧カードグリッドと
 * `MetricSwitcherPanel` の両方が同じ形を受け取る (導出を二重実装しない)。
 */
export interface MetricKpi {
  metricKey: string;
  title: string;
  unit: string;
  /** 都道府県選択時はその県の値、未選択時は全国値（取得できなければ 47 県平均） */
  value: number | null;
  rank: number | null;
  total: number;
  /** 年次推移 */
  series: { year: number; value: number }[];
  /**
   * 全国表示で値・系列が 47 県の単純平均のとき true。
   * 総人口のような実数系は全国値の 1/47 になるため「全国」と称してはならない
   * (2026-08-04 の不具合。正典は aggregate-metric-timeseries.ts の source 申告)。
   */
  isNationalAverage: boolean;
  /** 全国値をまだ取得中 */
  isLoading: boolean;
}
