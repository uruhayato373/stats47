/**
 * @stats47/product-factory — ココナラ商品ファクトリーの公開 API。
 * Phase 1: 型付き商品カタログ + 決定的 validator。
 * Phase 2: 共通デザイン・データ・地図・チャート・出典・ライセンスの基盤 + 47 県 fixture。
 * 正典: .claude/rules/coconala-product-standards.md
 */
export * from "./catalog";
export * from "./validators/catalog-validator";
export * from "./validators/dataset-validator";
export * from "./design/tokens";
export * from "./design/palettes";
export * from "./design/layouts";
export * from "./data/prefectures";
export * from "./data/sources";
export * from "./data/dataset";
export * from "./charts/chart-spec";
export * from "./licenses/license-text";
export * from "./maps/prefecture-geometry";
export * from "./fixtures/sample-dataset";
export * from "./sales";
