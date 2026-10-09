/**
 * 正典 (page-data-batch) と同一規則で rank を導出する。
 *
 * 規則: 値の降順・同値は同順位 (競技順位)。方向による分岐は無い
 * (`packages/data-configs/scripts/page-data-batch.ts` の rank 計算と一致させること。
 *  `isReversed` はカラースケール用の設定で順位方向ではない)。
 *
 * 手動投入 metric (fetcherKey:"manual") は page-data-batch を通らないため app/stats の行が
 * rank を持たない。2026-07-27 に ambulance-hospital-arrival-time /
 * pachinko-shop-density-per-10k がこれに該当し、rank 欠落行を捨てる実装だったため
 * values.json が生成されず OGP パイプラインを止めていた。
 */
export function deriveRanks<T extends { value: number | null; rank: number | null }>(
  entries: T[],
): void {
  const ranked = entries
    .filter((e) => e.value != null)
    .sort((a, b) => (b.value as number) - (a.value as number));
  let prevValue: number | null = null;
  let prevRank = 0;
  ranked.forEach((e, i) => {
    if (prevValue !== null && e.value === prevValue) {
      e.rank = prevRank;
    } else {
      e.rank = i + 1;
      prevRank = i + 1;
      prevValue = e.value;
    }
  });
}
