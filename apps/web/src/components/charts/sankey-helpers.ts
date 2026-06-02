import type { HubNode } from "./HubSankey";

/**
 * パートナー配列を value 降順で上位 `topN` + 「その他N県」に集約して HubNode[] にする。
 * commute / migration の Sankey で重複していた `topWithOther` を汎用化（挙動は同一）。
 *
 * @param valueOf 各パートナーの集計対象値（inflow / outflow など）を取り出す
 */
export function topNWithOther<T extends { name: string }>(
  partners: readonly T[],
  valueOf: (p: T) => number,
  topN: number,
): HubNode[] {
  const sorted = [...partners].sort((a, b) => valueOf(b) - valueOf(a));
  const head = sorted.slice(0, topN).map((p) => ({ name: p.name, value: valueOf(p) }));
  const tail = sorted.slice(topN);
  const otherSum = tail.reduce((s, p) => s + valueOf(p), 0);
  if (otherSum > 0) head.push({ name: `その他${tail.length}県`, value: otherSum });
  return head;
}
