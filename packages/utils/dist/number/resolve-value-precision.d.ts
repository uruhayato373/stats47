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
 * @param maxDecimals 上限。桁が多すぎるとラベルが読めなくなるため既定 2
 */
export declare function resolveValuePrecision(values: readonly number[], maxDecimals?: number): number;
