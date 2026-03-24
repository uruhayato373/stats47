/**
 * Category Domain Public API (Client)
 *
 * カテゴリ・サブカテゴリのクライアント向け機能を提供します。
 * サーバー専用のデータ取得関数は`@/features/category/server`に分離されました。
 */

// packages/category から必要なものをインポートし、再エクスポート
export type {
  Category,
} from "@stats47/category";

// コンポーネント
export { CategoryIcon } from "./components/CategoryIcon";
export { CategoryGrid } from "./components/CategoryGrid";
export type { CategoryGridItem } from "./components/CategoryGrid";

// ユーティリティ
export { getCategoryColor } from "./utils/category-colors";