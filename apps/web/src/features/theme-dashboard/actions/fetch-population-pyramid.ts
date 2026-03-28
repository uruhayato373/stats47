"use server";

import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";

import { getEstatCacheStorage } from "@/features/stat-charts/server";

import type { PyramidChartData } from "@stats47/visualization/d3";


/**
 * 5歳階級別人口ピラミッドデータを取得
 *
 * e-Stat 社会・人口統計体系（statsDataId: 0000010101）から
 * 0〜4歳〜100歳以上の21年齢階級 × 男女 = 42コードを並列取得。
 * cdArea/cdTime 指定なしで全都道府県・全年度を一括取得し、R2 キャッシュを共有する。
 */

const STATS_DATA_ID = "0000010101";

/**
 * 17 年齢階級の定義（コード接尾 01=男, 02=女）
 *
 * 社会・人口統計体系（0000010101）では5歳階級男女別が A1201〜A1216（0〜79歳）まで。
 * 80歳以上は A1418（男: A141801, 女: A141802）で一括提供。
 */
const AGE_GROUPS = [
  { base: "A1201", label: "0〜4歳" },
  { base: "A1202", label: "5〜9歳" },
  { base: "A1203", label: "10〜14歳" },
  { base: "A1204", label: "15〜19歳" },
  { base: "A1205", label: "20〜24歳" },
  { base: "A1206", label: "25〜29歳" },
  { base: "A1207", label: "30〜34歳" },
  { base: "A1208", label: "35〜39歳" },
  { base: "A1209", label: "40〜44歳" },
  { base: "A1210", label: "45〜49歳" },
  { base: "A1211", label: "50〜54歳" },
  { base: "A1212", label: "55〜59歳" },
  { base: "A1213", label: "60〜64歳" },
  { base: "A1214", label: "65〜69歳" },
  { base: "A1215", label: "70〜74歳" },
  { base: "A1216", label: "75〜79歳" },
  { base: "A1418", label: "80歳以上" },
] as const;

export interface PopulationPyramidResult {
  pyramidData: PyramidChartData[];
  yearName: string;
}

export async function fetchPopulationPyramidAction(
  prefCode: string,
): Promise<PopulationPyramidResult | null> {
  try {
    const storage = await getEstatCacheStorage();

    // 42コードを並列取得（各コードは R2 キャッシュ済みなら即返却）
    const codes = AGE_GROUPS.flatMap((ag) => [
      { code: `${ag.base}01`, label: ag.label, sex: "male" as const },
      { code: `${ag.base}02`, label: ag.label, sex: "female" as const },
    ]);

    const results = await Promise.all(
      codes.map(async (c) => {
        const params: GetStatsDataParams = {
          statsDataId: STATS_DATA_ID,
          cdCat01: c.code,
        };
        const data = await fetchFormattedStats(params, storage);
        return { ...c, data };
      }),
    );

    // 最新年度を特定（最初の結果から）
    const firstResult = results[0]?.data.filter((d) => d.areaCode === prefCode);
    if (!firstResult || firstResult.length === 0) return null;

    const latestYear = firstResult.reduce((latest, d) =>
      d.yearCode > latest.yearCode ? d : latest,
    );
    const yearCode = latestYear.yearCode;
    const yearName = latestYear.yearName ?? yearCode;

    // 各年齢階級の男女データを PyramidChartData に変換
    const pyramidData: PyramidChartData[] = AGE_GROUPS.map((ag) => {
      const maleResult = results.find(
        (r) => r.code === `${ag.base}01`,
      );
      const femaleResult = results.find(
        (r) => r.code === `${ag.base}02`,
      );

      const maleValue =
        maleResult?.data.find(
          (d) => d.areaCode === prefCode && d.yearCode === yearCode,
        )?.value ?? 0;
      const femaleValue =
        femaleResult?.data.find(
          (d) => d.areaCode === prefCode && d.yearCode === yearCode,
        )?.value ?? 0;

      return {
        ageGroup: ag.label,
        male: -Math.abs(Number(maleValue)),
        female: Math.abs(Number(femaleValue)),
      };
    });

    return { pyramidData, yearName };
  } catch {
    return null;
  }
}
