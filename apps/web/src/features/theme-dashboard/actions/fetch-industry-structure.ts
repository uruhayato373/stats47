"use server";

import type { RankingValue } from "@stats47/ranking";
import { findRankingItem, listRankingValues } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

export interface IndustryStructureData {
  name: string;
  value: number;
  color: string;
}

const INDUSTRY_KEYS: { key: string; name: string; color: string }[] = [
  { key: "employed-people-ratio-primary", name: "第1次産業", color: "#22c55e" },
  { key: "employed-people-ratio-secondary", name: "第2次産業", color: "#3b82f6" },
  { key: "employed-people-ratio-tertiary", name: "第3次産業", color: "#f97316" },
];

/**
 * 産業別就業者比率（第1次/2次/3次）を取得
 *
 * ドーナツチャート用に3セクターの構成比を返す。
 */
export async function fetchIndustryStructureAction(
  prefCode: string,
): Promise<IndustryStructureData[] | null> {
  try {
    const results = await Promise.all(
      INDUSTRY_KEYS.map(async ({ key, name, color }) => {
        // 最新年コードを取得
        const itemResult = await findRankingItem(key, "prefecture");
        if (!isOk(itemResult) || !itemResult.data?.latestYear) return null;

        const yearCode = itemResult.data.latestYear.yearCode;
        const valResult = await listRankingValues(key, "prefecture", yearCode);
        if (!isOk(valResult)) return null;

        const match = valResult.data.find((v: RankingValue) => v.areaCode === prefCode);
        if (!match) return null;
        return { name, value: match.value, color };
      })
    );

    const valid = results.filter((r): r is IndustryStructureData => r !== null);
    return valid.length === 3 ? valid : null;
  } catch {
    return null;
  }
}
