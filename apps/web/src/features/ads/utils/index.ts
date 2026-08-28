/**
 * 横長 (または正方形) クリエイティブか。
 *
 * repository を読む server service と分離し、client component から安全に利用する。
 * 縦長の受け皿は locationCode "sidebar-sticky" のサイドバースロットのみ。
 */
export function isLandscapeBanner(b: { width: number; height: number }): boolean {
  return b.height <= b.width;
}
