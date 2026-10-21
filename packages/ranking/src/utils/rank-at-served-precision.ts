/**
 * 再計算した値を、配信値と同じ小数桁に丸めてから順位を付け直す。
 *
 * 配信の values.json は表示桁 (例: 小数 1 桁) に丸めた値で順位を付けるので、丸めて同じ値になった県は同順位になる。
 * 丸める前の値で付けた順位と比べると、同順位の県の数だけ「不一致」になる (2026-10-03 の週次監査で
 * 開業率・廃業率・エンゲル係数・情報通信係数の 4 件が rankDiff 26〜30 と出た。すべて同順位の数と一致。
 * RANKING-RATIO-RANK-MISMATCH-01)。順位の向き (大きいほど上位か) は再計算の順位から読み取る。
 */
export function decimalsOf(values: readonly number[]): number {
  return Math.max(0, ...values.map((v) => (String(v).split(".")[1] ?? "").length));
}

export function rankAtServedPrecision(
  computed: readonly { areaCode: string; value: number; rank: number }[],
  decimals: number,
): Map<string, { value: number; rank: number }> {
  const rounded = computed.map((c) => ({ areaCode: c.areaCode, value: Number(c.value.toFixed(decimals)), rank: c.rank }));
  const first = [...rounded].sort((a, b) => a.rank - b.rank)[0];
  const descending = !first || rounded.every((r) => r.value <= first.value);
  const result = new Map<string, { value: number; rank: number }>();
  for (const r of rounded) {
    const ahead = rounded.filter((o) => (descending ? o.value > r.value : o.value < r.value)).length;
    result.set(r.areaCode, { value: r.value, rank: ahead + 1 });
  }
  return result;
}
