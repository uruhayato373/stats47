/**
 * 数値が整数値かどうかを判定する関数（浮動小数点数の精度問題を考慮）
 */
function isIntegerValue(value) {
    return Math.abs(value - Math.round(value)) < Number.EPSILON * 10;
}
/**
 * 数値の小数点以下の桁数を取得
 */
export function getDecimalPlaces(value) {
    if (!Number.isFinite(value) || isIntegerValue(value))
        return 0;
    const str = String(value);
    const decimalIndex = str.indexOf(".");
    if (decimalIndex === -1)
        return 0;
    // 末尾の0を無視するためにトリミングが必要な場合がある（toStringの仕様によるが念のため）
    const fractionalPart = str.slice(decimalIndex + 1);
    const trimmedPart = fractionalPart.replace(/0+$/, "");
    if (trimmedPart.length === 0)
        return 0;
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
export function getMaxDecimalPlaces(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((max, value) => {
        const decimals = getDecimalPlaces(value);
        return decimals > max ? decimals : max;
    }, 0);
}
