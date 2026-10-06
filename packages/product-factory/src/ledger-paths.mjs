/**
 * 販売チャネル (ココナラ / Kindle / note) の台帳・アカウント設定の置き場。
 * 値は repo root からの相対パス (POSIX 区切り)。読む側が自分の root と join する。
 *
 * パスを各所に直書きしない。置き場を移したとき直書きが旧パスに残ると、
 * ファイルが読めずに黙って空を返す。`tests/ledger-paths.test.ts` が直書きと実在を検査する。
 * 置き場の区分は `.claude/rules/data-storage.md`。
 *
 * Node の .mjs (`.claude/scripts`) と TS (product-factory / apps) の両方から import するため、
 * 型は隣の `ledger-paths.d.mts` に置く。
 */
export const COCONALA_LISTINGS = "config/coconala-listings.json";
export const COCONALA_ACCOUNT = "config/coconala-account.json";
export const COCONALA_PROFILE = "config/coconala-profile.ts";
export const COCONALA_ASSETS_DIR = "config/coconala/assets";
export const KDP_LISTINGS = "config/kdp-listings.json";
export const KDP_ACCOUNT = "config/kdp-account.json";
export const NOTE_ACCOUNT = "config/note-account.json";
