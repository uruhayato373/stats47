/**
 * 総人口（basic-population）データ取得サービス
 * e-Stat APIから統計データを取得し、StatsSchema形式に変換
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  formatStatsData,
  convertToStatsSchema,
} from "@/features/estat-api/stats-data/services/formatter";
import type { StatsSchema } from "@/types/stats";
import {
  STATS_DATA_ID,
  NATIONAL_AREA_CODE,
  getMainIndicatorCat01Codes,
  BASIC_POPULATION_INDICATORS,
} from "./basic-population-indicators";

/**
 * 全国総人口データの型定義
 */
export interface NationalBasicPopulationData {
  /** 総人口データ（年度別） */
  totalPopulation: StatsSchema[];
  /** 日本人人口データ（年度別） */
  japanesePopulation: StatsSchema[];
  /** 年齢別人口データ（年度別） */
  ageGroups: {
    itemCode: string;
    itemName: string;
    data: StatsSchema[];
  }[];
}

/**
 * 全国総人口データを取得
 *
 * @param areaCode - 地域コード（デフォルト: 00000（全国））
 * @returns 全国総人口データ
 */
export async function getNationalBasicPopulationData(
  areaCode: string = NATIONAL_AREA_CODE
): Promise<NationalBasicPopulationData> {
  console.log(
    `[getNationalBasicPopulationData] データ取得開始: areaCode=${areaCode}`
  );

  // 主要指標のcat01コードを取得
  const cat01Codes = getMainIndicatorCat01Codes();

  // 全てのcat01コードを一度に取得（複数リクエストを並列実行）
  const dataPromises = cat01Codes.map(async (cat01) => {
    try {
      const response = await fetchStatsData(STATS_DATA_ID, {
        categoryFilter: cat01,
        areaFilter: areaCode,
      });

      // データを整形
      const formattedData = formatStatsData(response);

      // StatsSchema形式に変換
      const statsSchemas: StatsSchema[] = [];
      for (const value of formattedData.values) {
        // areaCodeが指定されたもの（全国データ）のみを取得
        if (value.dimensions.area?.code === areaCode) {
          const schema = convertToStatsSchema(value);
          if (schema) {
            statsSchemas.push(schema);
          }
        }
      }

      return {
        cat01,
        data: statsSchemas,
      };
    } catch (error) {
      console.error(
        `[getNationalBasicPopulationData] cat01=${cat01}のデータ取得失敗:`,
        error
      );
      return {
        cat01,
        data: [],
      };
    }
  });

  // 全てのリクエストを並列実行
  const results = await Promise.all(dataPromises);

  // 結果を整理
  const totalPopulationData: StatsSchema[] = [];
  const japanesePopulationData: StatsSchema[] = [];
  const ageGroupDataMap = new Map<
    string,
    { itemCode: string; itemName: string; data: StatsSchema[] }
  >();

  for (const result of results) {
    const { cat01, data } = result;

    if (cat01 === "A1101") {
      totalPopulationData.push(...data);
    } else if (cat01 === "A1102") {
      japanesePopulationData.push(...data);
    } else {
      // 年齢別データ
      const ageGroup = findAgeGroupByCat01(cat01);
      if (ageGroup) {
        const existing = ageGroupDataMap.get(ageGroup.itemCode);
        if (existing) {
          existing.data.push(...data);
        } else {
          ageGroupDataMap.set(ageGroup.itemCode, {
            itemCode: ageGroup.itemCode,
            itemName: ageGroup.itemName,
            data: [...data],
          });
        }
      }
    }
  }

  // 年度順にソート
  const sortByTime = (a: StatsSchema, b: StatsSchema) =>
    a.timeCode.localeCompare(b.timeCode);

  totalPopulationData.sort(sortByTime);
  japanesePopulationData.sort(sortByTime);
  ageGroupDataMap.forEach((value) => {
    value.data.sort(sortByTime);
  });

  const ageGroups = Array.from(ageGroupDataMap.values());

  console.log(
    `[getNationalBasicPopulationData] データ取得完了: 総人口=${totalPopulationData.length}件, 日本人人口=${japanesePopulationData.length}件, 年齢別=${ageGroups.length}グループ`
  );

  return {
    totalPopulation: totalPopulationData,
    japanesePopulation: japanesePopulationData,
    ageGroups,
  };
}

/**
 * cat01コードから年齢区分情報を取得
 */
function findAgeGroupByCat01(cat01: string): {
  itemCode: string;
  itemName: string;
} | undefined {
  return BASIC_POPULATION_INDICATORS.AGE_GROUPS.find(
    (group) => group.cat01 === cat01
  );
}

