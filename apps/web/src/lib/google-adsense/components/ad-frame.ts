/**
 * 広告枠の「外枠」定義（本番の <ins> と開発用プレースホルダーの共有 SSOT）
 *
 * 本番とプレースホルダーで別々にサイズを持たせると、ローカルで見た枠と本番で確保される枠が
 * 食い違い、配置の崩れをローカルで検出できなくなる。実際 2026-07-29 まで
 * プレースホルダーは全フレキシブル枠を一律 250px の固定高で描いており、本番の
 * 予約高（記事内 120px / Multiplex 300px）と一致していなかった。
 * 予約高と外枠 class はこのファイルだけが持ち、両方がここを読む。
 */

import { AD_SIZES, type AdFormat } from "../types";

/**
 * 広告枠の最小高さ（CLS 対策）
 *
 * Cloudflare Web Analytics で `ins.adsbygoogle` の CLS が 0.732 と致命値（基準 0.1 の 7 倍）
 * だったため、広告読み込み前にレイアウト領域を予約する。desktop / mobile の大きい方を採用して
 * 予約不足を防ぐ。
 *
 * - `article`（fluid / in-article）は 0×0 フレキシブルで高さが予測困難なため 120px（infeed と同水準）
 * - `multiplex`（autorelaxed）はグリッド型で高さが出るため 300px
 * - それ以外で AD_SIZES が 0 の場合は 250px（rectangle mobile 相当）にフォールバック
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
