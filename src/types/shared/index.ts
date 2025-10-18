/**
 * 共有型定義の集約エクスポート
 *
 * このディレクトリには、複数のドメインで共有される汎用的な型定義を配置します。
 * ドメイン固有の型は各ドメインディレクトリ（例: src/lib/ranking/types/）に配置してください。
 */

// テーブル関連の共通型
export * from "./table";

// ページネーション関連の共通型
export * from "./pagination";

// プリミティブ型の拡張
export * from "./primitives";

// サブカテゴリ関連の共通型
export * from "./subcategory";

// ユーティリティ型
export * from "./utility";
