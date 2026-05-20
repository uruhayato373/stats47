"use server";

import { loadDepopulationMedicalPrefDetail } from "@/features/depopulation-medical/server";
import type { DepopulationMedicalPrefDetail } from "@/features/depopulation-medical/server";

/**
 * 県別詳細 (過疎ポリゴン + 医療機関 point) を遅延取得する server action。
 * choropleth で県をクリックした時にクライアントから呼ぶ。
 *
 * @param prefCode2 2 桁の都道府県コード ("13" 等)
 */
export async function fetchPrefDetail(
  prefCode2: string,
): Promise<DepopulationMedicalPrefDetail | null> {
  return loadDepopulationMedicalPrefDetail(prefCode2);
}
