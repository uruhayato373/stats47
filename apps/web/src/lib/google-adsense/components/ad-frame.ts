/**
 * 広告枠の「外枠」定義（本番の <ins> と開発用プレースホルダーの共有 SSOT）
 *
 * 本番とプレースホルダーで別々にサイズを持たせると、ローカルで見た枠と本番で確保される枠が
 * 食い違い、配置の崩れをローカルで検出できなくなる。実際 2026-07-29 まで
 * プレースホルダーは全フレキシブル枠を一律 250px の固定高で描いており、本番の
 * 予約高（記事内 120px / Multiplex 300px）と一致していなかった。
 * 予約高と外枠 class はこのファイルだけが持ち、両方がここを読む。
 */

import { AD_SIZES, type AdFormat, type AdSlotBoxProp } from "../types";

/**
 * 広告枠の最小高さ（CLS 対策）
 *
 * Cloudflare Web Analytics で `ins.adsbygoogle` の CLS が 0.732 と致命値（基準 0.1 の 7 倍）
 * だったため、広告読み込み前にレイアウト領域を予約する。desktop / mobile の大きい方を採用して
 * 予約不足を防ぐ。
 *
 * 今の値 (AD_SIZES の desktop / mobile の高さの大きい方。ad-frame.test.ts が固定する):
 * - `rectangle` 280px (336×280 / 300×250) / `banner` 90px (728×90 / 320×50) / `skyscraper` 600px (160×600)
 * - `article`（fluid / in-article）は 0×0 フレキシブルで高さが予測困難なため 120px
 * - `multiplex`（autorelaxed）はグリッド型で高さが出るため 300px
 * - `infeed` は AD_SIZES が 0×0 なので 250px（rectangle mobile の高さ）にフォールバック
 */
export function getAdReservedMinHeight(format: AdFormat): number {
  if (format === "article") return 120;
  if (format === "multiplex") return 300;
  const size = AD_SIZES[format];
  const height = Math.max(size.desktop.height, size.mobile.height);
  return height > 0 ? height : 250;
}

/**
 * responsive display広告の形状を配置契約へ固定する。
 * `auto` のままだとrectangle railへ縦長広告が配信され、予約高を超えてCLSを起こしうる。
 */
export function getResponsiveAdFormat(
  format: AdFormat,
): "rectangle" | "horizontal" | "vertical" | "auto" {
  if (format === "rectangle") return "rectangle";
  if (format === "banner") return "horizontal";
  if (format === "skyscraper") return "vertical";
  return "auto";
}

/**
 * 広告枠の外枠 class。
 *
 * `.ad-container` は本番・開発とも必ず付く唯一の DOM マーカーで、レンダリング後に
 * 広告枠を数えたい場合（隣接検出など）の手掛かりになる。
 */
export const AD_CONTAINER_CLASS = "ad-container w-full flex flex-col items-center";

/** フレキシブル（幅いっぱいに伸びる）フォーマットか。 */
export function isFlexibleAdFormat(format: AdFormat): boolean {
  return format === "infeed" || format === "article" || format === "multiplex";
}

/**
 * 広告の枠の台帳の箱を、予約の高さ (と代わりの表示の幅) の CSS 変数に写す。モバイルで寸法が違う枠は md (768px) で切り替える。
 * class は SLOT_BOX_HEIGHT_CLASS / SLOT_BOX_WIDTH_CLASS と組で使う (本番の予約と代わりの表示が同じ値になる)。
 */
export function slotBoxStyle(box: AdSlotBoxProp): Record<string, string> {
  const px = (value: number | "full") => (value === "full" ? "100%" : `${value}px`);
  return {
    "--ad-h": `${box.height}px`,
    "--ad-h-mobile": `${box.mobileHeight ?? box.height}px`,
    "--ad-w": px(box.width),
    "--ad-w-mobile": px(box.mobileWidth ?? box.width),
    "--ad-max-w": box.maxWidth ? `min(100%, ${box.maxWidth}px)` : "100%",
  };
}
export const SLOT_BOX_HEIGHT_CLASS = "min-h-(--ad-h-mobile) md:min-h-(--ad-h)";
export const SLOT_BOX_WIDTH_CLASS = "w-(--ad-w-mobile) md:w-(--ad-w) max-w-(--ad-max-w)";
/** 本番の広告の外枠を台帳の幅の上限に収め、中央に置く (代わりの表示は SLOT_BOX_WIDTH_CLASS が同じ上限を持つ) */
export const SLOT_BOX_MAX_WIDTH_CLASS = "mx-auto max-w-(--ad-max-w)";
