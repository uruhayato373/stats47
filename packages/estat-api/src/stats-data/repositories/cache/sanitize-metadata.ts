/**
 * メタデータの値をサニタイズ（S3互換APIの制限に対応）
 *
 * @param value - サニタイズする値
 * @returns サニタイズされた値
 */
export function sanitizeMetadata(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "") // 非ASCII文字を削除
    .replace(/[\r\n\t]/g, " ") // 改行・タブをスペースに変換
    .trim()
    .substring(0, 1024); // 長さ制限
}
