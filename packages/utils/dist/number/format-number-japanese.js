/**
 * 数値を日本語表記（カンマ区切り）に整形する
 */
export function formatNumberJapanese(value) {
    return value.toLocaleString("ja-JP");
}
/**
 * 指定された小数点以下桁数で数値をフォーマットする
 */
export function formatNumberWithDecimalPlaces(value, decimalPlaces) {
    return value.toLocaleString("ja-JP", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    });
}
