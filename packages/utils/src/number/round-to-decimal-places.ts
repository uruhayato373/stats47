/**
 * 指定した小数点以下桁数で数値を丸める
 *
 * @param value - 対象の数値
 * @param decimalPlaces - 小数点以下の桁数
 * @returns 丸められた数値
 */
export function roundToDecimalPlaces(
  value: number,
  decimalPlaces: number
): number {
  if (!Number.isFinite(value)) return value;
  if (decimalPlaces < 0) return value;

  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}
