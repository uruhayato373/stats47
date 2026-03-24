
import { parseEstatValue } from "./parse-estat-value";
import { buildDimensionMaps } from "./build-dimension-maps";
import { EstatClassObject, EstatValue, FormattedValue } from "../types";

type DimensionInfo = {
  code: string;
  name: string;
  level?: string;
  parentCode?: string;
  unit?: string;
};

/**
 * データ値を整形（最適化版）
 * O(n×m) → O(n)に改善
 *
 * @param values - 生のデータ値配列
 * @param classInfo - 分類情報
 * @returns 整形されたデータ値配列
 */
export function formatValues(
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
