/**
 * リポジトリ直下 `config/` (事業の台帳と設定) の置き場の一覧。
 * 値は repo root からの相対パス (POSIX 区切り)。読む側が自分の root と join する。
 *
 * パスを各所に直書きしない。置き場を移したとき直書きが旧パスに残ると、
 * ファイルが読めずに黙って空を返す。`packages/product-factory/tests/config-paths.test.ts` が
 * 直書きと実在を検査する。置き場の区分は `.claude/rules/data-storage.md`。
 *
 * Node の .mjs / .cjs (`.claude/scripts`。.cjs は require(esm) = Node 20.19 / 22.12 以降) と
 * TS (product-factory / apps) の両方から読むため、型は隣の `paths.d.mts` に置く。
 */

// 販売チャネル (ココナラ / Kindle / note) の出品台帳・アカウント・プロフィール
export const COCONALA_LISTINGS = "config/coconala-listings.json";
export const COCONALA_ACCOUNT = "config/coconala-account.json";
export const COCONALA_PROFILE = "config/coconala-profile.ts";
export const COCONALA_ASSETS_DIR = "config/coconala/assets";
export const KDP_LISTINGS = "config/kdp-listings.json";
export const KDP_ACCOUNT = "config/kdp-account.json";
export const NOTE_ACCOUNT = "config/note-account.json";

// アフィリエイト (ASP の接続設定・A8 レポート収集)
export const AFFILIATE_ASP = "config/affiliate-asp.json";
export const A8_REPORT_AUTOMATION = "config/a8-report-automation.json";

// 運用 (管理画面の領域・計測対象・端末資源・参考文献 vault・バッチ)
export const DOMAINS = "config/domains.json";
export const PSI_URLS = "config/psi-urls.txt";
export const LOCAL_RESOURCES = "config/local-resources.json";
export const SOURCE_VAULT = "config/source-vault.json";
export const YOY_BATCH = "config/yoy-batch.json";

// テーマページの指標を選ぶ視点 (採用基準・判断規則。管理画面と提案文書が読む)
export const THEME_SELECTION_VIEWPOINTS = "config/theme-selection-viewpoints.json";

// 指標正本と、その型から生成する契約・逆引き索引
export const METRIC_DEFINITIONS_DIR = "data/metrics";
export const METRIC_SOURCES_DIR = "data/metric-sources";
export const METRIC_SCHEMA = `${METRIC_DEFINITIONS_DIR}/schema/metric.schema.json`;
export const METRIC_LINKAGE_DIR = `${METRIC_DEFINITIONS_DIR}/index`;
