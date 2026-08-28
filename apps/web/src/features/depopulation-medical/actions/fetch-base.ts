"use server";

import { fetchPrefectureTopology } from "@stats47/gis/geoshape";

import { loadDepopulationMedicalSummary } from "@/features/depopulation-medical/server";

import type { DepopulationMedicalSummary } from "../lib/types";
import type { TopoJSONTopology } from "@stats47/types";

export interface DepopulationMedicalBase {
  summary: DepopulationMedicalSummary;
  topology: TopoJSONTopology | null;
}

/**
 * テーマ埋め込み用に 47 県サマリ + 都道府県 topology をまとめて取得する server action。
 *
 * 旧 /gis-cross/depopulation-medical の page.tsx が server で行っていた読み込みを、
 * テーマ section (client + IntersectionObserver lazy) から呼べるよう action 化したもの。
 * topology は ~0.5-1MB あるため、スクロール到達時にのみ取得して
 * healthcare / aging-society テーマページの初期 SSR を膨らませない。
 */
export async function fetchDepopulationMedicalBase(): Promise<DepopulationMedicalBase> {
  const summary = await loadDepopulationMedicalSummary();

  let topology: TopoJSONTopology | null = null;
  try {
    topology = await fetchPrefectureTopology();
  } catch {
    topology = null;
  }

  return { summary, topology };
}
