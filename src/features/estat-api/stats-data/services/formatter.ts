import {
  DataNote,
  EstatStatsDataResponse,
  EstatValue,
  FormattedEstatData,
  FormattedMetadata,
  FormattedTableInfo,
  FormattedValue,
  parseEstatValue,
} from "@/features/estat-api/stats-data/types";

import { StatsSchema } from "@/types/stats";

import { EstatClassObject } from "../../core";

type DimensionInfo = {
  code: string;
  name: string;
  level?: string;
  parentCode?: string;
  unit?: string;
};

/**
 * 統計データレスポンスを整形（最適化版）
 *
 * 責務: データ構造の変換のみを担当（純粋関数）
 *
 * 改善点:
 * - O(n×m) → O(n) のパフォーマンス最適化
 * - 全次元対応（area, time, tab, cat01-15）
 * - 特殊文字の適切な処理（null変換）
 * - 型安全性の向上
 *
 * @param response - e-Stat APIの統計データレスポンス
 * @returns 整形された統計データ
 * @throws {Error} 統計データが見つからない場合
 */
export function formatStatsData(
  response: EstatStatsDataResponse
): FormattedEstatData {
  const startTime = Date.now();
  console.log("🔵 Formatter: formatStatsData 開始");

  const data = response.GET_STATS_DATA?.STATISTICAL_DATA;
  if (!data) {
    throw new Error("統計データが見つかりません");
  }

  const tableInf = data.TABLE_INF;
  if (!tableInf) {
    throw new Error("TABLE_INFが見つかりません");
  }

  // テーブル情報（既存の実装を維持）
  const tableInfo: FormattedTableInfo = {
    // 基本情報
    id: tableInf?.["@id"] || "",
    title: tableInf?.TITLE?.$ || "",
    statName: tableInf?.STAT_NAME?.$ || "",
    statCode:
      (tableInf?.STAT_NAME as { "@code"?: string } | undefined)?.["@code"] ||
      "",
    govOrg: tableInf?.GOV_ORG?.$ || "",
    govOrgCode:
      (tableInf?.GOV_ORG as { "@code"?: string } | undefined)?.["@code"] || "",
    statisticsName: tableInf?.STATISTICS_NAME || "",

    // データ範囲
    totalNumber: parseInt(tableInf?.TOTAL_NUMBER || "0"),
    fromNumber: parseInt(tableInf?.FROM_NUMBER || "0"),
    toNumber: parseInt(tableInf?.TO_NUMBER || "0"),

    // 追加: 日付情報（ネスト）
    dates: {
      surveyDate: tableInf?.SURVEY_DATE || 0,
      openDate: tableInf?.OPEN_DATE || "",
      updatedDate: tableInf?.UPDATED_DATE || "",
    },

    // 追加: データ特性（ネスト）
    characteristics: {
      cycle: tableInf?.CYCLE || "",
      smallArea: parseInt(tableInf?.SMALL_AREA || "0"),
      collectArea: tableInf?.COLLECT_AREA || "",
    },

    // 分類情報
    classification: {
      mainCategory: {
        code:
          (tableInf?.MAIN_CATEGORY as { "@code"?: string } | undefined)?.[
            "@code"
          ] || "",
        name: tableInf?.MAIN_CATEGORY?.$ || "",
      },
      subCategory: tableInf?.SUB_CATEGORY
        ? {
            code:
              (tableInf.SUB_CATEGORY as { "@code"?: string })?.["@code"] || "",
            name: tableInf.SUB_CATEGORY.$ || "",
          }
        : undefined,
    },

    // 統計名仕様
    statisticsNameSpec: tableInf?.STATISTICS_NAME_SPEC
      ? {
          tabulationCategory:
            tableInf.STATISTICS_NAME_SPEC.TABULATION_CATEGORY || "",
          tabulationSubCategory1:
            tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY1,
          tabulationSubCategory2:
            tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY2,
          tabulationSubCategory3:
            tableInf.STATISTICS_NAME_SPEC.TABULATION_SUB_CATEGORY3,
        }
      : undefined,

    // 説明
    description: (
      tableInf as unknown as {
        DESCRIPTION?: { TABULATION_CATEGORY_EXPLANATION?: string; $?: string };
      }
    )?.DESCRIPTION
      ? {
          tabulationCategoryExplanation: (
            tableInf as unknown as {
              DESCRIPTION: {
                TABULATION_CATEGORY_EXPLANATION?: string;
                $?: string;
              };
            }
          ).DESCRIPTION.TABULATION_CATEGORY_EXPLANATION,
          general: (tableInf as unknown as { DESCRIPTION: { $?: string } })
            .DESCRIPTION.$,
        }
      : undefined,
  };

  // クラス情報
  const classInfo = data.CLASS_INF?.CLASS_OBJ || [];

  // データ値（最適化版）
  const rawValues = data.DATA_INF?.VALUE || [];
  const valuesArray = Array.isArray(rawValues) ? rawValues : [rawValues];
  const values = formatValues(valuesArray, classInfo);

  // 注記情報
  const notes: DataNote[] = data.DATA_INF?.NOTE
    ? (Array.isArray(data.DATA_INF.NOTE)
        ? data.DATA_INF.NOTE
        : [data.DATA_INF.NOTE]
      ).map((note) => ({
        char: note["@char"] || "",
        description: note.$ || "",
      }))
    : [];

  // メタデータ計算（改善版）
  const validValues = values.filter((v) => v.value !== null).length;
  const nullValues = values.length - validValues;
  const nullPercentage =
    values.length > 0 ? (nullValues / values.length) * 100 : 0;

  // 年度範囲の計算
  const yearCodes = values
    .map((v) => v.dimensions.time.code)
    .filter((code, index, arr) => arr.indexOf(code) === index)
    .sort();

  const yearRange =
    yearCodes.length > 0
      ? {
          min: yearCodes[0],
          max: yearCodes[yearCodes.length - 1],
          count: yearCodes.length,
        }
      : undefined;

  // 地域範囲の計算
  const areaCodes = values
    .map((v) => v.dimensions.area.code)
    .filter((code, index, arr) => arr.indexOf(code) === index);

  const prefectures = values.filter(
    (v) => v.dimensions.area.level === "2" && v.dimensions.area.code !== "00000"
  );
  const hasNational = values.some((v) => v.dimensions.area.code === "00000");

  const areaRange = {
    count: areaCodes.length,
    prefectureCount: prefectures.length,
    hasNational,
  };

  // カテゴリ範囲の計算
  const categoryCount = values.reduce((count, v) => {
    Object.keys(v.dimensions).forEach((key) => {
      if (
        key !== "area" &&
        key !== "time" &&
        v.dimensions[key as keyof typeof v.dimensions]
      ) {
        count++;
      }
    });
    return count;
  }, 0);

  const categoryRange = {
    count: categoryCount,
  };

  const completenessScore = Math.round(
    (validValues / values.length) * 100 || 0
  );

  const metadata: FormattedMetadata = {
    processedAt: new Date().toISOString(),
    dataSource: "e-stat",
    stats: {
      totalRecords: values.length,
      validValues,
      nullValues,
      nullPercentage: Math.round(nullPercentage * 100) / 100,
    },
    range: yearRange
      ? {
          years: yearRange,
          areas: areaRange,
          categories: categoryRange,
        }
      : undefined,
    quality: {
      completenessScore,
      lastVerified: new Date().toISOString(),
    },
  };

  const result: FormattedEstatData = {
    tableInfo,
    areas: [], // 旧形式は削除
    categories: [], // 旧形式は削除
    years: [], // 旧形式は削除
    values,
    metadata,
    notes,
  };

  console.log(
    `✅ Formatter: formatStatsData 完了 (${Date.now() - startTime}ms) - ${
      values.length
    }件の値`
  );

  return result;
}

/**
 * データ値を整形（最適化版）
 * O(n×m) → O(n)に改善
 *
 * @param values - 生のデータ値配列
 * @param classInfo - 分類情報
 * @returns 整形されたデータ値配列
 */
function formatValues(
  values: EstatValue[],
  classInfo: EstatClassObject[]
): FormattedValue[] {
  // ✅ Step 1: 全次元のMapを構築（O(c)）
  const dimMaps = buildDimensionMaps(classInfo);

  // ✅ Step 2: O(n)でデータ変換
  return values.map((value) => ({
    value: parseEstatValue(value.$ || ""),
    unit: value["@unit"] || null,
    dimensions: {
      area: extractDimension(value, dimMaps, "area") ?? { code: "", name: "" },
      time: extractDimension(value, dimMaps, "time") ?? { code: "", name: "" },
      tab: extractDimension(value, dimMaps, "tab") ?? { code: "", name: "" },
      cat01: extractDimension(value, dimMaps, "cat01") ?? {
        code: "",
        name: "",
      },
      cat02: extractDimension(value, dimMaps, "cat02") ?? {
        code: "",
        name: "",
      },
      cat03: extractDimension(value, dimMaps, "cat03") ?? {
        code: "",
        name: "",
      },
      cat04: extractDimension(value, dimMaps, "cat04") ?? {
        code: "",
        name: "",
      },
      cat05: extractDimension(value, dimMaps, "cat05") ?? {
        code: "",
        name: "",
      },
      cat06: extractDimension(value, dimMaps, "cat06") ?? {
        code: "",
        name: "",
      },
      cat07: extractDimension(value, dimMaps, "cat07") ?? {
        code: "",
        name: "",
      },
      cat08: extractDimension(value, dimMaps, "cat08") ?? {
        code: "",
        name: "",
      },
      cat09: extractDimension(value, dimMaps, "cat09") ?? {
        code: "",
        name: "",
      },
      cat10: extractDimension(value, dimMaps, "cat10") ?? {
        code: "",
        name: "",
      },
      cat11: extractDimension(value, dimMaps, "cat11") ?? {
        code: "",
        name: "",
      },
      cat12: extractDimension(value, dimMaps, "cat12") ?? {
        code: "",
        name: "",
      },
      cat13: extractDimension(value, dimMaps, "cat13") ?? {
        code: "",
        name: "",
      },
      cat14: extractDimension(value, dimMaps, "cat14") ?? {
        code: "",
        name: "",
      },
      cat15: extractDimension(value, dimMaps, "cat15") ?? {
        code: "",
        name: "",
      },
    },
  }));
}

/**
 * 全次元のMapを構築（O(c)）
 *
 * @param classInfo - 分類情報
 * @returns 次元ID → コード → 情報のMap
 */
function buildDimensionMaps(
  classInfo: EstatClassObject[]
): Map<string, Map<string, DimensionInfo>> {
  const maps = new Map();

  // 全次元IDを定義
  const dimensionIds = [
    "area",
    "time",
    "tab",
    ...Array.from(
      { length: 15 },
      (_, i) => `cat${String(i + 1).padStart(2, "0")}`
    ),
  ];

  dimensionIds.forEach((dimId) => {
    const dimClass = classInfo.find((c) => c["@id"] === dimId);
    if (!dimClass?.CLASS) return;

    const items = Array.isArray(dimClass.CLASS)
      ? dimClass.CLASS
      : [dimClass.CLASS];

    maps.set(
      dimId,
      new Map(
        items.map((item) => [
          item["@code"],
          {
            code: item["@code"],
            name: item["@name"],
            level: item["@level"],
            parentCode: item["@parentCode"],
            unit: item["@unit"],
          },
        ])
      )
    );
  });

  return maps;
}

/**
 * 特定の次元情報を抽出
 *
 * @param value - データ値
 * @param dimMaps - 次元Map
 * @param dimensionId - 次元ID
 * @returns 次元情報またはundefined
 */
function extractDimension(
  value: EstatValue,
  dimMaps: Map<string, Map<string, DimensionInfo>>,
  dimensionId: string
):
  | { code: string; name: string; level?: string; parentCode?: string }
  | undefined {
  const code = value[`@${dimensionId}` as keyof EstatValue] as string;
  if (!code) return undefined;

  const dimMap = dimMaps.get(dimensionId);
  if (!dimMap) return undefined;

  const info = dimMap.get(code);
  if (!info) return undefined;

  return {
    code: info.code,
    name: info.name,
    level: info.level,
    parentCode: info.parentCode,
  };
}

/**
 * FormattedValueをStatsSchemaに変換
 *
 * 現在はcat01のみサポート。cat02以降の情報がある場合は
 * 変換できないため、undefinedを返す。
 *
 * @param formattedValue - 変換元のFormattedValue
 * @returns StatsSchemaまたはundefined（cat01が存在しない場合、またはcat02以降の情報がある場合）
 */
export function convertToStatsSchema(
  formattedValue: FormattedValue
): StatsSchema | undefined {
  // cat01が存在しない場合は変換不可
  if (!formattedValue.dimensions.cat01) {
    return undefined;
  }

  // cat02以降の情報がある場合は将来的に実装予定
  // TODO: cat02-cat15の対応を追加（複数のカテゴリがある場合は変換方法を検討する必要がある）
  const hasAdditionalCategories =
    formattedValue.dimensions.cat02 ||
    formattedValue.dimensions.cat03 ||
    formattedValue.dimensions.cat04 ||
    formattedValue.dimensions.cat05 ||
    formattedValue.dimensions.cat06 ||
    formattedValue.dimensions.cat07 ||
    formattedValue.dimensions.cat08 ||
    formattedValue.dimensions.cat09 ||
    formattedValue.dimensions.cat10 ||
    formattedValue.dimensions.cat11 ||
    formattedValue.dimensions.cat12 ||
    formattedValue.dimensions.cat13 ||
    formattedValue.dimensions.cat14 ||
    formattedValue.dimensions.cat15;

  if (hasAdditionalCategories) {
    // cat02以降がある場合は現時点では変換しない
    // 将来的に複数カテゴリを扱う方法を検討する必要がある
    return undefined;
  }

  return {
    areaCode: formattedValue.dimensions.area.code,
    areaName: formattedValue.dimensions.area.name,
    timeCode: formattedValue.dimensions.time.code,
    timeName: formattedValue.dimensions.time.name,
    categoryCode: formattedValue.dimensions.cat01.code,
    categoryName: formattedValue.dimensions.cat01.name,
    value: formattedValue.value ?? 0, // nullの場合は0
    unit: formattedValue.unit || "",
  };
}
