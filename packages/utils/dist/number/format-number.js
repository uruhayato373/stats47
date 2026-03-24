/**
 * 数値をフォーマットします (3桁区切り)
 * @param value フォーマットする数値
 * @returns フォーマットされた文字列
 */
export function formatNumber(value) {
    if (value === null || value === undefined || value === "") {
        return "";
    }
    const num = Number(value);
    if (isNaN(num)) {
        return String(value);
    }
    return new Intl.NumberFormat("ja-JP").format(num);
}
