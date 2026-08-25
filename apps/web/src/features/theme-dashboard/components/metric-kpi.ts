/**
 * テーマページの KPI 1 件。
 *
 * `ThemeMetricsDashboard` が indicatorDataMap から導出し、旧カードグリッドと
 * `MetricSwitcherPanel` の両方が同じ形を受け取る (導出を二重実装しない)。
 *
 * ★GEO-SCOPE-SEPARATION-01 WP2: Theme Dashboard は 47都道府県比較面であり、既定 (未選択) は
 * 「日本」を表さない。`value`/`rank` は**都道府県選択時にだけ**その県の実値・順位を持つ。
 * 未選択時は `value`/`rank` を null にし、代わりに `topRanked` (実在する1位県の事実) を持つ。
 * 「47県平均」や「全国」を value に紛れ込ませる経路はこの型を経由できない
 * (`docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md`)。
 */
export interface MetricKpi {
  metricKey: string;
  title: string;
  unit: string;
  /** 都道府県選択時のみ、その県の実値。未選択時は null (47県平均や全国値を代入しない)。 */
  value: number | null;
  /** 都道府県選択時のみ、その県の全国順位。未選択時は null。 */
  rank: number | null;
  total: number;
  /** ランキング snapshot の provenance。フッターの出典導線に使用する。 */
  sourceName?: string;
  sourceLink?: string;
  sourceLinks?: Array<{ label: string; url: string }>;
  /** 選択中都道府県の年次推移 (都道府県選択時のみ使用)。 */
  series: { year: number; value: number }[];
  /**
   * 未選択 (47都道府県一覧) 時に表示する「1位」の事実。実データの中から実際にランク1位の
   * 都道府県とその値を渡す (捏造・平均ではない)。都道府県選択時は使わない。
   */
  topRanked: { areaCode: string; areaName: string; value: number } | null;
  /** 選択中都道府県の値をまだ取得中 (都道府県選択時のみ意味を持つ) */
  isLoading: boolean;
}
