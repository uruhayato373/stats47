/**
 * Area Domain 統一エクスポート
 *
 * 都道府県・市区町村管理機能を提供するドメインの統一エクスポート。
 * 型定義、ユーティリティ関数、リポジトリ、サービスのすべてを再エクスポートする。
 *
 * ## エクスポート内容
 * - **型定義**: 地域タイプ、都道府県、市区町村、地域ブロック、エラー型など
 * - **ユーティリティ**: 地域コードの変換・正規化・検証関数
 * - **リポジトリ**: 都道府県・市区町村データの取得
 * - **サービス**: 都道府県・市区町村のビジネスロジック
 *
 * ## 注意事項
 * - Server Actions は manifest 解決の安定性の観点から、
 *   このバレル（index.ts）越しの再エクスポートを避け、
 *   呼び出し側は `@/features/area/actions` を直接 import してください。
 *
 * @module AreaDomain
 *
 * @example
 * ```ts
 * // 型定義のインポート
 * import type { Prefecture, City } from "@/features/area";
 *
 * // ユーティリティ関数のインポート
 * import { determineAreaType, validateAreaCode } from "@/features/area";
 *
 * // サービスのインポート
 * import { listPrefectures, findPrefectureByCode } from "@/features/area";
 *
 * // Server Actions は直接インポート（推奨）
 * import { listPrefecturesAction } from "@/features/area/actions";
 * ```
 */

export * from "./repositories";
export * from "./services";
export * from "./types";
export * from "./utils";
