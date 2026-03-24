/**
 * ブログ記事チャート用データファイルの型定義
 *
 * e-Stat API から取得したデータを静的 JSON として保存し、
 * Blog チャートコンポーネントが dataPath 経由でロードする形式。
 */

/** データ取得元の情報 */
export interface BlogChartDataSource {
  type: "estat-api";
  statsDataId: string;
  /** GetStatsDataParams のシリアライズ済み形式 */
  params: Record<string, string>;
  /** ISO 8601 */
  fetchedAt: string;
}

/** チャート表示用メタデータ */
export interface BlogChartMeta {
  title?: string;
  unit?: string;
  xLabel?: string;
  yLabel?: string;
}

/** ブログ記事チャート用データファイル */
export interface BlogChartDataFile<T = unknown> {
  source: BlogChartDataSource;
  chartType:
    | "bar"
    | "line"
    | "donut"
    | "scatterplot"
    | "treemap"
    | "sunburst"
    | "column"
    | "choropleth";
  meta: BlogChartMeta;
  data: T;
}
