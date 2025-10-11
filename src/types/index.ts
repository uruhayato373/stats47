/**
 * Stats47 プロジェクトの型定義
 *
 * @remarks
 * このファイルはプロジェクト全体で使用される型定義を集約してエクスポートします。
 * 型定義は以下のカテゴリに分類されています：
 *
 * - **Common**: 共通型定義（primitives, utility, pagination）
 * - **Models**: ドメインモデル（user, prefecture, subcategory, ranking）
 * - **Visualization**: 可視化関連の型（choropleth, topojson）
 * - **External**: 外部ライブラリの型拡張（next-auth）
 *
 * @example
 * ```typescript
 * import { User, Prefecture, ApiResponse } from '@/types';
 * ```
 */

// Common Types
export * from "./common";

// Model Types
export * from "./models";

// Visualization Types
export * from "./visualization";

// External Types
export * from "./external";
