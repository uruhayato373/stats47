import { EstatClassObject } from "../types";

type DimensionInfo = {
  code: string;
  name: string;
  level?: string;
  parentCode?: string;
  unit?: string;
};

/**
 * 全次元のMapを構築（O(c)）
 *
 * @param classInfo - 分類情報
 * @returns 次元ID → コード → 情報のMap
 */
export function buildDimensionMaps(
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
