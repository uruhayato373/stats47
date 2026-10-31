"use server";

import { loadDepopulationMedicalSummary } from "@/features/depopulation-medical/server";

import type { DepopulationMedicalSummary } from "../lib/types";

export interface DepopulationMedicalBase {
  summary: DepopulationMedicalSummary;
}

/**
 * テーマ埋め込み用に 47 県サマリを取得する server action。
 *
 * 旧 /gis-cross/depopulation-medical の page.tsx が server で行っていた読み込みを、
 * テーマ section (client + IntersectionObserver lazy) から呼べるよう action 化したもの。
 * 都道府県の地形は地図の部品 (ランキングと同じ) が自分で取るので、ここでは取らない。
 */
export async function fetchDepopulationMedicalBase(): Promise<DepopulationMedicalBase> {
  return { summary: await loadDepopulationMedicalSummary() };
}
