/**
 * 値に基づくランク付与
 */

export interface RankOptions {
  /** ソート方向。デフォルト: "desc" */
  direction?: "asc" | "desc";
  /** 同値タイ処理を行うか。デフォルト: true（同値には同じランクを付与） */
  handleTies?: boolean;
}

/**
 * value でソートして rank を付与する
 *
 * - ソートとランク付与を一体化。内部で必ずソートを行う。
 * - `handleTies: true`（デフォルト）: 同値には同じランクを付与（例: 1,1,3,4）
 * - `handleTies: false`: インデックスベースの連番（例: 1,2,3,4）
 * - NaN 値は末尾へ
 *
 * @param data - ランク付与対象データ配列
 * @param options - オプション
 * @returns rank プロパティが付与された新しい配列
 */
export function rankByValue<T extends { value: unknown }>(
  data: T[],
  options?: RankOptions
): (T & { rank: number })[] {
  if (data.length === 0) return [];

  const { direction = "desc", handleTies = true } = options ?? {};

  const sorted = [...data].sort((a, b) => {
    const valA = Number(a.value);
    const valB = Number(b.value);

    if (isNaN(valA)) return 1;
    if (isNaN(valB)) return -1;

    return direction === "desc" ? valB - valA : valA - valB;
  });

  if (!handleTies) {
    return sorted.map((item, index) => ({ ...item, rank: index + 1 }));
  }

  // タイ処理: 同値には同じランク
  let currentRank = 1;
  return sorted.map((item, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (Number(item.value) !== Number(prev.value)) {
        currentRank = index + 1;
      }
    }
    return { ...item, rank: currentRank };
  });
}
