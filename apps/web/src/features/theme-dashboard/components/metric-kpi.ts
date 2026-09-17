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
  /** 実際に表示する観測値の年次。 */
  yearName?: string;
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

/**
 * 指標グループの件数契約 (2026-09-17)。
 *
 * 選択 UI は「有効な選択肢が 2 件以上」のときだけ意味を持つ。1 件のグループに
 * チェックボックス・タブ・選択タイルを出すと、外せない checked 状態と見出しの重複だけが残る。
 * `MetricSwitcherPanel` は `MultiMetricGroup` しか受け取らず、1 件は `SingleMetricCard` が描く。
 * 判定は ThemeCatalog の定義件数ではなく、観測不足で落とした**後**の実件数で行う。
 * 正典: docs/01_技術設計/04_デザインシステム.md「選択 UI と集合レイアウトの件数規則」
 */
export type SingleMetricGroup = [MetricKpi];
export type MultiMetricGroup = [MetricKpi, MetricKpi, ...MetricKpi[]];

export function isSingleMetricGroup(
  metrics: MetricKpi[]
): metrics is SingleMetricGroup {
  return metrics.length === 1;
}

export function isMultiMetricGroup(
  metrics: MetricKpi[]
): metrics is MultiMetricGroup {
  return metrics.length >= 2;
}
