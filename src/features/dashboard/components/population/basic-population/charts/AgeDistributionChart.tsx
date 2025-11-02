/**
 * 年齢別人口分布チャートコンポーネント（Server Component）
 * e-Stat APIから直接データを取得
 */

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data/services/formatter";

import { AgeDistributionChartClient } from "./AgeDistributionChartClient";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計

// 年齢別人口（5歳刻み）のcat01コード
const AGE_GROUP_CAT01_CODES = [
  { cat01: "A1201", itemName: "0～4歳人口" },
  { cat01: "A1202", itemName: "5～9歳人口" },
  { cat01: "A1203", itemName: "10～14歳人口" },
  { cat01: "A1204", itemName: "15～19歳人口" },
  { cat01: "A1205", itemName: "20～24歳人口" },
  { cat01: "A1206", itemName: "25～29歳人口" },
  { cat01: "A1207", itemName: "30～34歳人口" },
  { cat01: "A1208", itemName: "35～39歳人口" },
  { cat01: "A1209", itemName: "40～44歳人口" },
  { cat01: "A1210", itemName: "45～49歳人口" },
  { cat01: "A1211", itemName: "50～54歳人口" },
  { cat01: "A1212", itemName: "55～59歳人口" },
  { cat01: "A1213", itemName: "60～64歳人口" },
  { cat01: "A1214", itemName: "65～69歳人口" },
  { cat01: "A1215", itemName: "70～74歳人口" },
  { cat01: "A1216", itemName: "75～79歳人口" },
  { cat01: "A1217", itemName: "80～84歳人口" },
  { cat01: "A1218", itemName: "85～89歳人口" },
  { cat01: "A1219", itemName: "90～94歳人口" },
  { cat01: "A1220", itemName: "95～99歳人口" },
] as const;

interface AgeDistributionChartProps {
  /** 地域コード */
  areaCode: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
}

/**
 * 年齢別人口分布チャート（Server Component）
 */
export async function AgeDistributionChart({
  areaCode,
  title,
  description,
  timeCode,
}: AgeDistributionChartProps) {
  try {
    // 年齢区分のcat01コードを取得
    const ageGroupCat01Codes = AGE_GROUP_CAT01_CODES.map(
      (group) => group.cat01
    );

    // 全ての年齢区分データを並列取得
    const ageGroupResponses = await Promise.all(
      ageGroupCat01Codes.map((cat01) =>
        fetchStatsData(STATS_DATA_ID, {
          categoryFilter: cat01,
          areaFilter: areaCode,
        })
      )
    );

    // データを整形してStatsSchema形式に変換
    const ageGroupDataMap = new Map<
      string,
      {
        itemCode: string;
        itemName: string;
        data: Array<{
          timeCode: string;
          timeName: string;
          value: number;
          unit: string;
        }>;
      }
    >();

    for (let i = 0; i < ageGroupResponses.length; i++) {
      const response = ageGroupResponses[i];
      const ageGroupInfo = AGE_GROUP_CAT01_CODES[i];

      if (!ageGroupInfo) continue;

      const formattedData = formatStatsData(response);
      const statsSchemas = formattedData.values
        .filter((value) => value.dimensions.area?.code === areaCode)
        .map((value) => convertToStatsSchema(value))
        .filter(
          (schema): schema is NonNullable<typeof schema> => schema !== undefined
        );

      // 年度順にソート
      statsSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

      ageGroupDataMap.set(ageGroupInfo.cat01, {
        itemCode: ageGroupInfo.cat01,
        itemName: ageGroupInfo.itemName,
        data: statsSchemas.map((schema) => ({
          timeCode: schema.timeCode,
          timeName: schema.timeName,
          value: schema.value,
          unit: schema.unit,
        })),
      });
    }

    const ageGroups = Array.from(ageGroupDataMap.values());

    if (ageGroups.length === 0) {
      return (
        <AgeDistributionChartClient
          chartData={[]}
          title={title}
          description={description}
        />
      );
    }

    // 指定年度のデータを取得（指定がない場合は最新年度）
    let targetTimeCode = timeCode;
    let targetTimeName = "";

    if (!targetTimeCode && ageGroups.length > 0) {
      // 最新年度を取得
      const latestData = ageGroups[0].data[ageGroups[0].data.length - 1];
      if (latestData) {
        targetTimeCode = latestData.timeCode;
        targetTimeName = latestData.timeName;
      }
    } else if (targetTimeCode) {
      // 指定年度の名前を取得
      const firstData = ageGroups[0]?.data.find(
        (d) => d.timeCode === targetTimeCode
      );
      if (firstData) {
        targetTimeName = firstData.timeName;
      }
    }

    // チャート用のデータ形式に変換
    const chartData = ageGroups
      .map((group) => {
        const data = group.data.find((d) => d.timeCode === targetTimeCode);
        if (!data) return null;

        // 年齢区分の範囲を取得（例: "0～4歳人口" → "0-4"）
        const ageRange = group.itemName
          .replace(/人口$/, "")
          .replace(/～/g, "-");

        return {
          ageRange,
          ageGroup: group.itemName,
          value: data.value,
          unit: data.unit,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        // 年齢順にソート（0-4, 5-9, ...）
        const ageA = parseInt(a.ageRange.split("-")[0]);
        const ageB = parseInt(b.ageRange.split("-")[0]);
        return ageA - ageB;
      });

    return (
      <AgeDistributionChartClient
        chartData={chartData}
        title={title}
        description={description}
        timeName={targetTimeName}
      />
    );
  } catch (error) {
    console.error("[AgeDistributionChart] データ取得エラー:", error);
    return (
      <AgeDistributionChartClient
        chartData={[]}
        title={title}
        description={description}
      />
    );
  }
}
