/**
 * Google AdSense関連の型定義
 */

/**
 * 広告フォーマット
 */
export type AdFormat =
  | "rectangle" // レクタングル（336x280 → 300x250 on mobile）
  | "banner" // バナー（728x90 → 320x50 on mobile）
  | "skyscraper" // スカイスクレイパー（160x600）
  | "infeed" // インフィード広告
  | "article" // 記事内広告
  | "multiplex"; // Multiplex（関連コンテンツ型グリッド、コンテンツ末尾向け）

/**
 * 広告スロットのプロパティ
 */
export interface AdSlotProps {
  /**
   * 広告フォーマット
   */
  format: AdFormat;

  /**
   * 広告スロットID（AdSenseで生成されたID）
   */
  slotId?: string;

  /**
   * カスタムクラス名
   */
  className?: string;

  /**
   * 広告のラベルを表示するか
   * @default true
   */
  showLabel?: boolean;

  /**
   * 遅延ロードを使用するか
   * @default true
   */
  lazyLoad?: boolean;

  /**
   * 遅延ロードの閾値（ピクセル）
   *
   * ビューポート手前この距離で広告リクエストを開始する。100px では表示前に離脱され
   * imp/PV が低かった (W26 実測 0.71) ため 600px に前倒し (ADSENSE-LAZYLOAD-01)。
   * ただしモバイルでは先読みしすぎて viewability が落ちた (W27 39.1%) ため、未指定時は
   * デバイス別デフォルト（desktop 600 / mobile 250）を使う (ADSENSE-LAZYLOAD-02)。
   * 数値を明示した場合はデバイスに依らずその値を使う。
   * @default undefined — device-aware: desktop 600px / mobile 250px
   */
  rootMargin?: number;

  /**
   * data-full-width-responsive属性を強制的に設定するか
   */
  fullWidthResponsive?: boolean;
}

/**
 * 広告フォーマットごとのサイズ情報
 */
export const AD_SIZES: Record<
  AdFormat,
  {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
    description: string;
  }
> = {
  rectangle: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    description: "レスポンシブレクタングル",
  },
  banner: {
    desktop: { width: 728, height: 90 },
    mobile: { width: 320, height: 50 },
    description: "レスポンシブバナー",
  },
  skyscraper: {
    desktop: { width: 160, height: 600 },
    mobile: { width: 160, height: 600 },
    description: "スカイスクレイパー",
  },
  infeed: {
    desktop: { width: 0, height: 0 }, // フレキシブル
    mobile: { width: 0, height: 0 }, // フレキシブル
    description: "インフィード広告",
  },
  article: {
    desktop: { width: 0, height: 0 }, // フレキシブル
    mobile: { width: 0, height: 0 }, // フレキシブル
    description: "記事内広告",
  },
  multiplex: {
    desktop: { width: 0, height: 0 }, // フレキシブル（autorelaxed グリッド）
    mobile: { width: 0, height: 0 }, // フレキシブル
    description: "Multiplex（関連コンテンツ型グリッド）",
  },
};
