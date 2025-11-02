/**
 * Category Domain 統一エクスポート
 *
 * カテゴリ・サブカテゴリ管理機能を提供するドメインの統一エクスポート。
 * 型定義、ユーティリティ関数、リポジトリ、サービスのすべてを再エクスポートする。
 *
 * ## エクスポート内容
 * - **型定義**: カテゴリ、サブカテゴリの型定義
 * - **ユーティリティ**: カテゴリアイコン取得関数など
 * - **リポジトリ**: カテゴリ・サブカテゴリデータの取得
 * - **サービス**: カテゴリ・サブカテゴリのビジネスロジック
 *
 * ## 注意事項
 * - Server Actions は manifest 解決の安定性の観点から、
 *   このバレル（index.ts）越しの再エクスポートを避け、
 *   呼び出し側は `@/features/category/actions` を直接 import してください。
 * - コンポーネントは特定用途のため、直接インポートしてください。
 *   例: `import { CategoriesManagement } from "@/features/category/components/admin/CategoriesManagement";`
 *
 * @module CategoryDomain
 *
 * @example
 * ```ts
 * // 型定義のインポート
 * import type { Category, Subcategory } from "@/features/category";
 *
 * // ユーティリティ関数のインポート
 * import { getCategoryIcon } from "@/features/category";
 *
 * // サービスのインポート（サーバーコンポーネントのみ）
 * import { listCategoriesWithSubcategories } from "@/features/category";
 *
 * // リポジトリのインポート（サーバーコンポーネントのみ）
 * import { listCategories } from "@/features/category";
 *
 * // Server Actions は直接インポート（推奨）
 * import { listCategoriesAction } from "@/features/category/actions";
 * ```
 */

export * from "./repositories";
export * from "./services";
export * from "./types";
export * from "./utils";
