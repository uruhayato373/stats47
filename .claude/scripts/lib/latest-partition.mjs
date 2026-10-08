/**
 * latest-partition — R2 `app/ranking/<key>/values.json` の partitions から最新年を選ぶ (純粋関数)。
 *
 * なぜ要るか (ARTICLE-WRITER-PARTITION-ORDER-01): partitions の並びは生成元で決まり、
 * 新しい順 (generate-ranking-values の buildPartitions) の values.json もあれば、そうでないものもある。
 * article-writer の手順が `partitions[partitions.length - 1]` を最新年としていたため、
 * 新しい順の values.json (例: soba-udon-dining-consumption-expenditure は末尾が 2007 年) で古い年を使った。
 * 並びに頼らず yearCode の数値の最大で選ぶ。
 */

/**
 * @template {{ yearCode: string|number }} P
 * @param {P[]|null|undefined} partitions
 * @returns {P|null} yearCode が最大の partition (無ければ null)
 */
export function latestPartition(partitions) {
  let latest = null;
  for (const partition of partitions ?? []) {
    const year = Number.parseInt(String(partition?.yearCode ?? ""), 10);
    if (!Number.isFinite(year)) continue;
    if (latest === null || year > latest.year) latest = { year, partition };
  }
  return latest?.partition ?? null;
}
