/**
 * Google AdSense 配置別スロット定数
 *
 * 広告ユニットの配置ごとに slotId と format を定義する。
 * 同一ページで複数広告を出す場合は、AdSense ポリシーに従い配置ごとに別スロットの利用を推奨。
 */

import type { AdFormat } from "./types";

export interface AdSlotConfig {
  /** 広告スロットID（AdSense 管理画面で発行） */
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

/** メインサイドバー: カテゴリ選択の下 */
export const MAIN_SIDEBAR: AdSlotConfig = {
  slotId: "7716393084",
  format: "rectangle",
};

/** ランキングページ: メインコンテンツ最下部 */
export const RANKING_PAGE_FOOTER: AdSlotConfig = {
  slotId: "2607536637",
  format: "rectangle",
};

/** ブログ記事内インライン広告（記事内 / fluid） */
export const BLOG_ARTICLE_INLINE: AdSlotConfig = {
  slotId: "5610987738",
  format: "article",
};

/** 比較ページ: 右サイドバー */
export const COMPARE_PAGE_SIDEBAR: AdSlotConfig = {
  slotId: "6180558947",
  format: "rectangle",
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
