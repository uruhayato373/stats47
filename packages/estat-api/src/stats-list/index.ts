/**
 * e-Stat API stats-list 機能
 *
 * 統計表一覧の検索と表示機能を提供するドメイン。
 * ビジネスロジックとユーティリティを統合してエクスポートします。
 *
 * ## 主要機能
 * - 統計表一覧の検索（キーワード、統計調査、統計分野など）
 * - 統計表の詳細情報取得
 * - 統計表一覧表示UIコンポーネント
 * - キャッシュキーの生成と管理
 *
 * ## エクスポート内容
 * - **コンポーネント**: 統計表一覧表示コンポーネント
 *   - `StatsListSearch`: 統計表検索コンポーネント
 *   - `StatsListResults`: 検索結果表示コンポーネント
 *   - `StatsTableDetailModal`: 統計表詳細モーダルコンポーネント
 *   - `StatsFieldSidebar`: 統計分野サイドバーコンポーネント
 * - **ビジネスロジック（Services）**: 統計表一覧の取得と変換
 *   - `EstatStatsListFetcher`: 統計表一覧取得クラス
 *   - `EstatStatsListFormatter`: 統計表一覧フォーマッター
 *   - `generateStatsListCacheKey`: キャッシュキーの生成
 *   - `statsListFetcher`: SWR用フェッチャー関数
 * - **型定義**: 統計表一覧関連の型定義
 *   - `StatsListSearchOptions`: 検索オプション型
 *   - `StatsListTableInfo`: 統計表情報型
 *   - `DetailedStatsListTableInfo`: 詳細統計表情報型
 * - **定数**: 統計分野の定数定義
 *   - `STATS_FIELDS`: 統計分野コードと名称のマッピング
 *
 * ## 注意事項
 * - 統計表一覧の検索は高度な検索オプション（キーワード、統計調査、統計分野など）をサポートしています。
 * - キャッシュキーにより、検索結果を効率的にキャッシュします。
 * - SWRを使用したデータフェッチングをサポートしています。
 * - 統計表の詳細情報は別途取得する必要があります。
 *
 * @module EstatAPIStatsList
 *
 * @example
 * ```ts
 * // 統計表一覧の検索（サーバーコンポーネント）
 * import { EstatStatsListFetcher } from "@/stats-list";
 *
 * const fetcher = new EstatStatsListFetcher();
 * const result = await fetcher.search({
 *   keyword: "人口",
 *   statsField: "00200503",
 * });
 *
 * // UIコンポーネントの使用
 * import { StatsListSearch, StatsListResults } from "@/stats-list";
 *
 * <StatsListSearch onSearch={handleSearch} />
 * <StatsListResults results={results} />
 * ```
 */

// ============================================================================
// コンポーネント
// ============================================================================
// TODO: components ディレクトリが存在しない
// export {
//   StatsFieldSidebar,
//   StatsListResults,
//   StatsListSearch,
//   StatsTableDetailModal,
// } from "./components";

// ============================================================================
// ビジネスロジック（Services）
// ============================================================================

// Fetcher
export {
  EstatErrorType,
  EstatStatsListError,
  EstatStatsListFetcher,
} from "./services/fetcher";

// Formatter
export { EstatStatsListFormatter } from "./services/formatter";

// Utils
export * from "./services/utils";

// Cache Key
export {
  generateStatsListCacheKey,
  isValidStatsListCacheKey,
  parseStatsListCacheKey,
} from "./services/cache-key";

// SWR Fetcher
export {
  statsListFetcher,
  statsListFetcherWithErrorHandling,
} from "./services/swr-fetcher";

// ============================================================================
// 型定義（coreから再エクスポート）
// ============================================================================
export type {
  AdvancedStatsListSearchOptions,
  DetailedStatsListTableInfo,
  PagingOptions,
  StatsFieldCode,
  StatsListSearchOptions,
  StatsListSearchResult,
  StatsListTableInfo,
} from "./types";

// Constants
export { STATS_FIELDS } from "./types/stats-list-response";
