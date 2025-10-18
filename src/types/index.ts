/**
 * Stats47 プロジェクトの型定義
 *
 * @remarks
 * このファイルはプロジェクト全体で使用される型定義を集約してエクスポートします。
 * 型定義は以下のカテゴリに分類されています：
 *
 * - Shared: 共有型定義（primitives, utility, pagination, table）
 * - Models: ドメインモデル（user, prefecture, subcategory）
 * - Visualization: 可視化関連の型（choropleth, topojson）
 * - External: 外部ライブラリの型拡張（next-auth）
 *
 * ドメイン固有の型は各ドメインディレクトリから直接インポートしてください：
 * - ランキング型: @/lib/ranking/types
 * - データベース型: @/lib/database/DOMAIN/types
 */

// Shared Types - 複数ドメインで共有される汎用型
export * from "./shared";

// Model Types
export * from "./models";

// Visualization Types
export * from "./visualization";

// External Types
export * from "./external";
