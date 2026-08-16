/**
 * Google AdSense 配置別スロット定数
 *
 * 広告ユニットの配置ごとに slotId と format を定義する。
 * 同一ページで複数広告を出す場合は、AdSense ポリシーに従い配置ごとに別スロットの利用を推奨。
 */

import type { AdFormat } from "./types";

/**
 * AdSense表示の全体スイッチ。
 *
 * 2026-08-16のオーナー判断で一時停止。falseの間は環境変数がtrueでも、
 * script / preconnect / Auto ads / 手動枠 / AdSense fallbackを一切描画しない。
 * 再開時は効果測定を完了してから、この1箇所だけをtrueへ戻す。
 */
export const ADSENSE_DISPLAY_ENABLED: boolean = false;

export interface AdSlotConfig {
  /** 広告スロットID（AdSense 管理画面で発行）。空文字 = 未発行プレースホルダ（slot 部品は描画しない） */
  slotId: string;
  /** 広告フォーマット */
  format: AdFormat;
}

/** ランキングページ: データテーブル横（PC）/ テーブル下（モバイル） */
export const RANKING_PAGE_TABLE_SIDE: AdSlotConfig = {
  slotId: "3604399166",
  format: "rectangle",
};

/** ランキングページ: 右サイドバー上部 */
export const RANKING_SIDEBAR_TOP: AdSlotConfig = {
  slotId: "6180558947",
  format: "rectangle",
};

/** ランキングページ: 右サイドバー */
export const RANKING_PAGE_SIDEBAR: AdSlotConfig = {
  slotId: "1047042956",
  format: "skyscraper",
};

/**
 * 右レール共通のレクタングル枠（RailAdSlot 用）
 * 旧 MAIN_SIDEBAR（未使用スロット 7716393084）を転用。category / areas の右レールに配置する。
 * ADSENSE-SLOT-DEDUPE-01: 同一ページ内で slot を二重使用していた不具合
 * （category は 6137206504 を rail+本文で重複、areas は 6180558947 を 3 回）を、
 * 右レール専用の独立スロットに寄せて解消するためのユニット。
 */
export const RAIL_RECT: AdSlotConfig = {
  slotId: "7716393084",
  format: "rectangle",
};

/**
 * ランキングページ: メインコンテンツ最下部
 * ADSENSE-FOOTER-02 (2026-07-03): 旧 rectangle (slot 2607536637・W26 viewability 26.2%) を
 * Multiplex (関連コンテンツ型グリッド・横長) に差し替え。読了後の全幅フッターに適した形式。
 * AdSense ユニット: stats47-content-footer-multiplex（Multiplex / autorelaxed）
 */
export const RANKING_PAGE_FOOTER: AdSlotConfig = {
  slotId: "6137206504",
  format: "multiplex",
};

/** ブログ記事内インライン広告（記事内 / fluid） */
export const BLOG_ARTICLE_INLINE: AdSlotConfig = {
  slotId: "5610987738",
  format: "article",
};

/**
 * ランキング詳細ページ: モバイル専用・解析セクション中盤の記事内広告
 *
 * モバイルはサイドバー広告が非表示で、収益のあるユニットが実質テーブル直後の
 * フッター 1 枠のみだった（W21 実測: Mobile Impressions/PV 0.32 / RPM ¥20）。
 * 解析セクションを読み進める層に中盤で 1 枠出すための専用スロット。
 * AdSense ユニット名: ranking-incontent-mobile（記事内 / fluid）
 */
export const RANKING_INCONTENT_MOBILE: AdSlotConfig = {
  slotId: "5555350674",
  format: "article",
};

/**
 * テーマダッシュボードページ: ダッシュボード下のディスプレイ広告
 * 17 テーマページ共通（ThemePageLayout）。
 * AdSense ユニット名: themes-content（ディスプレイ広告 / auto）
 */
export const THEMES_CONTENT: AdSlotConfig = {
  slotId: "4317152551",
  format: "rectangle",
};

/**
 * ハブ / 一覧ページ共通の記事内広告（fluid / in-article）
 * top / category / theme / blog一覧 / survey / tag のセクション区切りに 1 枠だけ配置する。
 * ADSENSE-HUB-INCONTENT-01: モバイル imp/PV（W26 実測 0.37）改善のためハブ面に in-content を新設。
 * ranking 詳細の RANKING_INCONTENT_MOBILE とは別ユニットにして units.csv で効果を分離する。
 *
 * ★人間タスク: AdSense 管理画面で「stats47-hub-incontent」記事内/fluid ユニットを 1 件発行し
 *   slotId を記入する。空文字の間は InContentAdSlot が描画されない（graceful degradation）。
 */
export const HUB_INCONTENT: AdSlotConfig = {
  slotId: "8185387982",
  format: "article",
};

/**
 * コンテンツ / 一覧ページ共通フッター広告
 * 地域別カテゴリ・市区町村ページ・各一覧ページ（/blog, /survey, /ports 等）・/search の
 * メインコンテンツ最下部に配置する汎用スロット。
 * ADSENSE-FOOTER-02 (2026-07-03): 旧 rectangle (slot 6635359989・W26 viewability 49.1%) を
 * Multiplex に差し替え。RANKING_PAGE_FOOTER と同一 slot を共用（同一ページに同時表示されない）。
 * AdSense ユニット: stats47-content-footer-multiplex（Multiplex / autorelaxed）
 */
export const CONTENT_FOOTER: AdSlotConfig = {
  slotId: "6137206504",
  format: "multiplex",
};
