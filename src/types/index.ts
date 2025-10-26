/**
 * Stats47 プロジェクトの型定義
 *
 * @remarks
 * このファイルは真に共有される汎用型のみを集約してエクスポートします。
 * 型定義は以下のカテゴリに分類されています：
 *
 * - Shared: 共有型定義（primitives, utility, pagination, table）
 * - External: 外部ライブラリの型拡張（next-auth）
 *
 * ドメイン固有の型は各ドメインディレクトリから直接インポートしてください：
 * - 地域型: @/infrastructure/area/types
 * - 認証型: @/infrastructure/auth/types
 * - カテゴリ型: @/features/category
 * - e-Stat API型: @/features/estat-api/core/types
 * - ランキング型: @/infrastructure/ranking/types
 * - データベース型: @/infrastructure/database/estat/types
 * - 可視化型: @/infrastructure/visualization/types
 *
 * 詳細は docs/01_development_guide/type-management-guide.md を参照してください。
 */

// Shared Types - 複数ドメインで共有される汎用型
export * from "./shared";

// External Types - 外部ライブラリの型拡張
export * from "./external";
