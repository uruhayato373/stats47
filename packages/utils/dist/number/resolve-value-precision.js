import { getMaxDecimalPlaces } from "./get-max-decimal-places";
/**
 * データセット全体から小数桁数を 1 度だけ解決する。
 *
 * 小数桁は 1 つの値では決まらない。`44` を単独で見ると整数だが、同じ指標に `60.4` が
 * あるなら `44.0` と表示しないと図の中で桁が揃わない。値ごとに整形している限り
 * 揃わないので、**描画の前にデータセット全体から 1 度だけ**解決する。
 *
 * 解決した精度は `formatValueWithPrecision(value, precision)` に渡す
 * (min=max を指定しないと `44.0` は number の `44` に戻って小数が消える)。
 *
 * @param values 同じ図・同じ表に並ぶ値の全体
 * @param maxDecimals 上限。桁が多すぎるとラベルが読めなくなるため既定 2。
 *   既定のままで全値の絶対値が 1 未満なら 3 まで許す (家計調査の耐久財の購入数量 0.086 台を
 *   0.09 に丸めると、上位 3 都市が同じ値に並び「1位と2位の差 0.00台」になった。2026-11-02)
 */
export function resolveValuePrecision(values, maxDecimals) {
    const finite = values.filter((v) => Number.isFinite(v));
    if (finite.length === 0)
        return 0;
    const isSubUnit = finite.every((v) => Math.abs(v) < 1);
    const cap = maxDecimals !== null && maxDecimals !== void 0 ? maxDecimals : (isSubUnit ? SUB_UNIT_MAX_DECIMALS : DEFAULT_MAX_DECIMALS);
    return Math.min(getMaxDecimalPlaces(finite), cap);
}
const DEFAULT_MAX_DECIMALS = 2;
const SUB_UNIT_MAX_DECIMALS = 3;
