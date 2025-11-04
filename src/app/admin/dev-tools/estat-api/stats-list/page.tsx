import StatsListPageClient from "./StatsListPageClient";

export const runtime = "edge";

/**
 * StatsListPage - e-Stat統計表一覧ページ（サーバーコンポーネント）
 *
 * 責務:
 * - クライアントコンポーネントへのルーティング
 * - 将来的にサーバーサイドでデータ取得する場合に拡張
 */
export default function StatsListPage() {
  return <StatsListPageClient />;
}
