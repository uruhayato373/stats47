/**
 * 47 県の検証用サンプルデータセット。**架空値 (実データではない)** で、テンプレート検証と
 * generators のゴールデンテストに使う。販売時は実データ版に差し替える。
 * 値は都道府県コードから決定的に生成する (乱数を使わない = 再現可能)。
 */
import { normalizeDataset, type Dataset } from "../data/dataset";
import { PREFECTURES } from "../data/prefectures";
import type { SourceRow } from "../data/sources";

const SAMPLE_SOURCE: SourceRow = {
  surveyName: "サンプル (架空データ・実在の調査ではありません)",
  tableName: "-",
  statsDataId: "-",
  url: "https://stats47.jp/",
  year: "2024",
  retrievedAt: "2026-07-18",
  unit: "指数",
  transform: "都道府県コードから決定的に生成した架空値",
  notes: "実データではありません。テンプレート検証用の架空サンプルです。販売時は実データ版へ差し替えます。",
};

/** 47 県の架空サンプル (検証専用)。 */
export const SAMPLE_DATASET: Dataset = normalizeDataset({
  indicator: "サンプル指標 (架空)",
  unit: "指数",
  year: "2024",
  source: SAMPLE_SOURCE,
  isSample: true,
  values: PREFECTURES.map((p) => ({ code: p.code5, value: 40 + ((Number(p.code2) * 37) % 60) })),
});
