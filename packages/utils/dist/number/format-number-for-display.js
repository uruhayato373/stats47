/**
 * 文字列末尾の "0" を線形時間で除去する（正規表現のバックトラッキング回避）。
 * `s.replace(/0+$/, "")` と完全に同一の結果を返す。
 */
function stripTrailingZeros(s) {
    let end = s.length;
    while (end > 0 && s.charCodeAt(end - 1) === 48 /* '0' */)
        end--;
    return s.slice(0, end);
}
/**
 * 表示用に数値をフォーマットする
 * - 整数値の場合は小数点以下を表示しない
 * - 小数値の場合は適切な桁数で表示（末尾の0を削除）
 * - カンマ区切りを適用
 */
export function formatNumberForDisplay(value, options) {
    // 浮動小数点精度を考慮した整数判定
    const isInteger = Math.abs(value - Math.round(value)) < Number.EPSILON * 10;
    if (isInteger) {
        return value.toLocaleString("ja-JP", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    }
    // 小数値の場合
    if ((options === null || options === void 0 ? void 0 : options.maxDecimalPlaces) !== undefined) {
        return value.toLocaleString("ja-JP", {
            minimumFractionDigits: 0,
            maximumFractionDigits: options.maxDecimalPlaces,
        });
    }
    const str = String(value);
    const decimalIndex = str.indexOf(".");
    if (decimalIndex !== -1) {
        const fractionalPart = str.slice(decimalIndex + 1);
        const trimmedPart = stripTrailingZeros(fractionalPart);
        if (trimmedPart.length > 0) {
            return value.toLocaleString("ja-JP", {
                minimumFractionDigits: 0,
                maximumFractionDigits: trimmedPart.length,
            });
        }
    }
    return value.toLocaleString("ja-JP", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}
