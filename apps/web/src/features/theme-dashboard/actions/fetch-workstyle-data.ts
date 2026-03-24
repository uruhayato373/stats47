"use server";

import type { RankingValue } from "@stats47/ranking";
import { findRankingItem, listRankingValues } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

export interface WorkstyleBarItem {
  label: string;
  value: number;
  nationalAvg: number;
}

const WORKSTYLE_KEYS: { key: string; label: string }[] = [
  { key: "telework-rate", label: "テレワーク率" },
  { key: "side-job-rate", label: "副業率" },
  { key: "dual-income-household-ratio", label: "共働き世帯割合" },
  { key: "childcare-employment-rate", label: "育児中就業率" },
];

/**
 * 新しい働き方の4指標を取得
 *
 * 選択都道府県の値 + 全国平均を返す（HorizontalDivergingBarChart で全国平均基準表示用）
 */
export async function fetchWorkstyleDataAction(
  prefCode: string,
): Promise<WorkstyleBarItem[] | null> {
  try {
    const results = await Promise.all(
      WORKSTYLE_KEYS.map(async ({ key, label }) => {
        const itemResult = await findRankingItem(key, "prefecture");
        if (!isOk(itemResult) || !itemResult.data?.latestYear) return null;

        const yearCode = itemResult.data.latestYear.yearCode;
        const valResult = await listRankingValues(key, "prefecture", yearCode);
        if (!isOk(valResult)) return null;

        const prefValue = valResult.data.find((v: RankingValue) => v.areaCode === prefCode);
        const nationalValue = valResult.data.find((v: RankingValue) => v.areaCode === "00000");

        if (!prefValue) return null;

        // 全国平均がない場合は全都道府県の平均を計算
        const avg = nationalValue?.value
          ?? valResult.data
            .filter((v: RankingValue) => v.areaCode !== "00000")
            .reduce((sum: number, v: RankingValue) => sum + v.value, 0)
            / valResult.data.filter((v: RankingValue) => v.areaCode !== "00000").length;

        return { label, value: prefValue.value, nationalAvg: avg };
      })
    );

    const valid = results.filter((r): r is WorkstyleBarItem => r !== null);
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}
