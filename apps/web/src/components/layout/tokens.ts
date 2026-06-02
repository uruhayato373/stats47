/**
 * 統一レイアウトトークン (SSOT)
 *
 * 全ページの横幅・サイドレール・可読幅の単一ソース。
 * 設計仕様: docs/01_技術設計/21_統一レイアウト設計.md
 *
 * Tailwind の arbitrary value はビルド時に静的解決される必要があるため、
 * これらの定数は「ドキュメント兼参照値」であり、実際の className は
 * PageShell 内に静的文字列としてハードコードする（JIT 安全）。
 */

/** ページ外側の最大幅 */
export const SHELL_MAX = "1700px";

/** 右レール幅（関連 widget / 広告）。xl+ でのみ表示 */
export const RAIL_RIGHT = "360px";

/** 左レール幅（blog 記事 TOC）。xl+ でのみ表示 */
export const RAIL_LEFT = "280px";

/** 記事本文の可読幅（measure） */
export const READING_MAX = "760px";
