import type {NumericDomainPolicy} from "@stats47/types";
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
  trendDomain: NumericDomainPolicy;
  title: string;
  unit: string;
  /** 実際に表示する観測値の年次。 */
  yearName?: string;
  /**
   * ページの地域の値。県のページはその県の値、全国のページは全国の値 (e-Stat の全国行)。全国行の無い指標の全国のページは
   * null (47 県の平均や 1 位の県の値を代わりに出さない。2026-10-31)
   */
  value: number | null;
  /** 県のページだけ、その県の全国順位。全国のページは null。 */
  rank: number | null;
  total: number;
  /** ランキング snapshot の provenance。フッターの出典導線に使用する。 */
  sourceName?: string;
  sourceLink?: string;
  sourceLinks?: Array<{ label: string; url: string }>;
  /** 各年の 47 都道府県の平均 (全国の値ではない。県の系列が取れないときの代わりで「都道府県平均」と呼ぶ) */
  series: { year: number; value: number }[];
  /** 公式の全国の系列。全国のページの推移に使う。無い指標は undefined */
  officialNationalSeries?: { year: number; value: number }[];
  /** 選択中都道府県の値をまだ取得中 (都道府県選択時のみ意味を持つ) */
  isLoading: boolean;
  /** 全国の値 (公式の全国の系列の最新の値)。無い指標は undefined (47 県の平均を代わりに作らない) */
  nationalValue?: number;
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
/**
 * 指標の値の表示 (小数 2 桁まで)。数値タイルと県のページの説明文で同じ書き方にする (2026-10-30。
 * 旧: 説明文だけ丸めず「30.124%」、タイルは「30.12%」だった)
 */
export function formatMetricValue(value: number): string {
  return value.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
}

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
