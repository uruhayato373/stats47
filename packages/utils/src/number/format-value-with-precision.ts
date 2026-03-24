/**
 * 指定された精度で数値をフォーマット
 *
 * @param value - フォーマットする数値
 * @param precision - 小数点以下の桁数
 * @returns フォーマットされた文字列
 */
export function formatValueWithPrecision(
  value: number,
  precision: number
): string {
  if (!Number.isFinite(value)) return String(value);
  if (precision < 0) precision = 0;
  return new Intl.NumberFormat("ja-JP", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}
