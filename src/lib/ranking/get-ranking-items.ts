/**
 * ランキング項目データ取得関数
 * データベースからランキング設定を取得し、型安全な形式で返す
 */

export interface RankingItem {
  rankingKey: string;
  label: string;
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface SubcategoryConfig {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  defaultRankingKey: string;
}

export interface RankingConfigResponse {
  subcategory: SubcategoryConfig;
  rankingItems: RankingItem[];
}

/**
 * サブカテゴリのランキング設定を取得
 * @param subcategoryId - サブカテゴリID（例: 'land-area', 'land-use'）
 * @returns Promise<RankingConfigResponse | null>
 */
export async function getRankingConfig(
  subcategoryId: string
): Promise<RankingConfigResponse | null> {
  try {
    // サーバーサイドとクライアントサイドでURLを適切に構築
    const baseUrl =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        : "";

    const url = `${baseUrl}/api/ranking-items/${encodeURIComponent(
      subcategoryId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`サブカテゴリ '${subcategoryId}' が見つかりません`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RankingConfigResponse = await response.json();
    return data;
  } catch (error) {
    console.error(
      `ランキング設定の取得に失敗しました (${subcategoryId}):`,
      error
    );
    return null;
  }
}

/**
 * ランキング項目をランキングデータ形式に変換
 * @param rankingItems - ランキング項目配列
 * @returns Record<string, RankingData>
 */
export function convertToRankingData(
  rankingItems: RankingItem[]
): Record<
  string,
  { statsDataId: string; cdCat01: string; unit: string; name: string }
> {
  const rankingData: Record<
    string,
    { statsDataId: string; cdCat01: string; unit: string; name: string }
  > = {};

  rankingItems.forEach((item) => {
    rankingData[item.rankingKey] = {
      statsDataId: item.statsDataId,
      cdCat01: item.cdCat01,
      unit: item.unit,
      name: item.name,
    };
  });

  return rankingData;
}

/**
 * ランキング項目をタブオプション形式に変換
 * @param rankingItems - ランキング項目配列
 * @returns Array<{key: string, label: string}>
 */
export function convertToTabOptions(
  rankingItems: RankingItem[]
): Array<{ key: string; label: string }> {
  return rankingItems
    .filter((item) => item.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => ({
      key: item.rankingKey,
      label: item.label,
    }));
}

/**
 * フォールバック用のランキング設定
 * データベース接続失敗時に使用
 */
export const FALLBACK_CONFIGS: Record<string, RankingConfigResponse> = {
  "land-area": {
    subcategory: {
      id: "land-area",
      categoryId: "landweather",
      name: "土地面積",
      description: "都道府県別の土地面積統計",
      defaultRankingKey: "totalAreaExcluding",
    },
    rankingItems: [
      {
        rankingKey: "totalAreaExcluding",
        label: "総面積（除く）",
        statsDataId: "0000010102",
        cdCat01: "B1101",
        unit: "ha",
        name: "総面積（北方地域及び竹島を除く）",
        displayOrder: 1,
        isActive: true,
      },
      {
        rankingKey: "totalAreaIncluding",
        label: "総面積（含む）",
        statsDataId: "0000010102",
        cdCat01: "B1102",
        unit: "ha",
        name: "総面積（北方地域及び竹島を含む）",
        displayOrder: 2,
        isActive: true,
      },
      {
        rankingKey: "habitableArea",
        label: "可住地面積",
        statsDataId: "0000010102",
        cdCat01: "B1103",
        unit: "ha",
        name: "可住地面積",
        displayOrder: 3,
        isActive: true,
      },
      {
        rankingKey: "majorLakeArea",
        label: "主要湖沼面積",
        statsDataId: "0000010102",
        cdCat01: "B1104",
        unit: "ha",
        name: "主要湖沼面積",
        displayOrder: 4,
        isActive: true,
      },
      {
        rankingKey: "totalAreaIncludingRatio",
        label: "総面積（100km²）",
        statsDataId: "0000010202",
        cdCat01: "#B011001",
        unit: "100km²",
        name: "総面積（北方地域及び竹島を含む）",
        displayOrder: 5,
        isActive: true,
      },
      {
        rankingKey: "areaRatio",
        label: "面積割合",
        statsDataId: "0000010202",
        cdCat01: "#B01101",
        unit: "%",
        name: "面積割合（全国面積に占める割合）",
        displayOrder: 6,
        isActive: true,
      },
      {
        rankingKey: "habitableAreaRatio",
        label: "可住地面積割合",
        statsDataId: "0000010202",
        cdCat01: "#B01301",
        unit: "%",
        name: "可住地面積割合",
        displayOrder: 7,
        isActive: true,
      },
    ],
  },
  "land-use": {
    subcategory: {
      id: "land-use",
      categoryId: "landweather",
      name: "土地利用",
      description: "都道府県別の土地利用統計",
      defaultRankingKey: "agriculturalLand",
    },
    rankingItems: [
      {
        rankingKey: "agriculturalLand",
        label: "農用地",
        statsDataId: "0000010201",
        cdCat01: "#A01201",
        unit: "ha",
        name: "農用地",
        displayOrder: 1,
        isActive: true,
      },
      {
        rankingKey: "forestLand",
        label: "森林",
        statsDataId: "0000010201",
        cdCat01: "#A01202",
        unit: "ha",
        name: "森林",
        displayOrder: 2,
        isActive: true,
      },
      {
        rankingKey: "residentialLand",
        label: "宅地",
        statsDataId: "0000010201",
        cdCat01: "#A01203",
        unit: "ha",
        name: "宅地",
        displayOrder: 3,
        isActive: true,
      },
      {
        rankingKey: "commercialLand",
        label: "商業地",
        statsDataId: "0000010201",
        cdCat01: "#A01204",
        unit: "ha",
        name: "商業地",
        displayOrder: 4,
        isActive: true,
      },
      {
        rankingKey: "industrialLand",
        label: "工業地",
        statsDataId: "0000010201",
        cdCat01: "#A01205",
        unit: "ha",
        name: "工業地",
        displayOrder: 5,
        isActive: true,
      },
      {
        rankingKey: "agriculturalLandRatio",
        label: "農用地割合",
        statsDataId: "0000010201",
        cdCat01: "#A01206",
        unit: "%",
        name: "農用地割合",
        displayOrder: 6,
        isActive: true,
      },
      {
        rankingKey: "forestLandRatio",
        label: "森林割合",
        statsDataId: "0000010201",
        cdCat01: "#A01207",
        unit: "%",
        name: "森林割合",
        displayOrder: 7,
        isActive: true,
      },
      {
        rankingKey: "residentialLandRatio",
        label: "宅地割合",
        statsDataId: "0000010201",
        cdCat01: "#A01208",
        unit: "%",
        name: "宅地割合",
        displayOrder: 8,
        isActive: true,
      },
    ],
  },
};
