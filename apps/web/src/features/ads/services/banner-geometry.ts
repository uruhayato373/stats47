/**
 * バナー寸法の純粋判定。client / server どちらからも import できる。
 *
 * ★ resolve-affiliate-ad.ts に置いてはならない — あちらは repository (server-only) を
 *   値 import しており、client-safe barrel (index.ts) 経由の NativeAffiliateRow から
 *   値 import すると client の module graph に server-only が混入して build が落ちる
 *   (2026-08-05 の Build Check 失敗で実証。FurusatoNozeiCard の server.ts 移動と同じ轍)。
 */

/**
 * 横長 (または正方形) クリエイティブか。native 行や本文の横並び枠は 4:3 前提のため、
 * 縦長 (スカイスクレイパー 120x600 / 160x600) が混ざると極細の縦帯に潰れる。
 * 縦長の受け皿は locationCode "sidebar-sticky" のサイドバースロットのみ
 * (.claude/rules/affiliate-ads-standards.md §3)。banner 解決は locationCode を見ない
 * 設計 (同 §1 の非対称) なので、本文系の描画側がこれで除外する。
 */
export function isLandscapeBanner(b: { width: number; height: number }): boolean {
  return b.height <= b.width;
}
