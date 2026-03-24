/**
 * e-Stat APIの値を数値に変換する
 *
 * 特殊文字の扱い:
 * - "-": 該当なし → null
 * - "***": 秘匿 → null
 * - "X": 不詳 → null
 * - "…": 省略 → null
 * - 空文字・空白のみ → null
 *
 * @param value - e-Stat APIから取得した値（文字列）
 * @returns 数値またはnull
 */
export function parseEstatValue(value: string): number | null {
  const trimmed = value.trim();

  // 空文字・空白のみの場合
  if (trimmed === '') {
    return null;
  }

  // 特殊文字の場合
  if (trimmed === '-' || trimmed === '***' || trimmed === 'X' || trimmed === '…') {
    return null;
  }

  const num = Number(trimmed);
  return Number.isNaN(num) ? null : num;
}
