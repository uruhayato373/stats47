/**
 * 文字列末尾の "0" を線形時間で除去する（正規表現のバックトラッキング回避）。
 * `s.replace(/0+$/, "")` と完全に同一の結果を返す。
 */
function stripTrailingZeros(s: string): string {
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 48 /* '0' */) end--;
  return s.slice(0, end);
}

/**
 * 数値が整数値かどうかを判定する関数（浮動小数点数の精度問題を考慮）
 */
function isIntegerValue(value: number): boolean {
  return Math.abs(value - Math.round(value)) < Number.EPSILON * 10;
}

/**
 * 数値の小数点以下の桁数を取得
 */
export function getDecimalPlaces(value: number): number {
  if (!Number.isFinite(value) || isIntegerValue(value)) return 0;

  const str = String(value);
  const decimalIndex = str.indexOf(".");
  if (decimalIndex === -1) return 0;

  // 末尾の0を無視するためにトリミングが必要な場合がある（toStringの仕様によるが念のため）
  // 注: 正規表現 /0+$/ は末尾アンカーでバックトラッキングが起き得るため、
  // 線形時間の手動トリムにする（入力は number の文字列で挙動は同一）。
  const fractionalPart = str.slice(decimalIndex + 1);
  const trimmedPart = stripTrailingZeros(fractionalPart);

  if (trimmedPart.length === 0) return 0;

  // 指数表記の場合を処理
  const eIndex = str.toLowerCase().indexOf("e");
  if (eIndex !== -1) {
    const mantissaDecimals = eIndex - decimalIndex - 1;
    const exponent = parseInt(str.slice(eIndex + 1), 10);
    return Math.max(0, mantissaDecimals - exponent);
  }

  return trimmedPart.length;
}

/**
 * 数値配列から最大の小数点以下桁数を取得
 */
export function getMaxDecimalPlaces(values: number[]): number {
  if (values.length === 0) return 0;

  return values.reduce((max, value) => {
    const decimals = getDecimalPlaces(value);
    return decimals > max ? decimals : max;
  }, 0);
}
