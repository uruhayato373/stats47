/**
 * ランキング項目のMockデータ
 * 開発・テスト用のランキング項目データを提供
 */

export interface RankingItem {
  id: number;
  ranking_key: string;
  label: string;
  name: string;
  description?: string;
  unit: string;
  data_source_id: string;
  map_color_scheme: string;
  map_diverging_midpoint: string;
  ranking_direction: string;
  conversion_factor: number;
  decimal_places: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export const mockRankingItems: RankingItem[] = [
  {
    id: 1,
    ranking_key: "accommodations",
    label: "宿泊施設数",
    name: "宿泊施設数",
    description: "宿泊施設の総数",
    unit: "施設",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:20:14",
    updated_at: "2025-10-11 00:20:14",
  },
  {
    id: 2,
    ranking_key: "adultClassLecture",
    label: "成人一般学級・講座数（人口100万人当たり）",
    name: "成人一般学級・講座数（人口100万人当たり）",
    description: "成人向けの学級・講座数を人口100万人当たりで算出",
    unit: "学級・講座",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:20:14",
    updated_at: "2025-10-11 00:20:14",
  },
  {
    id: 3,
    ranking_key: "agriculturalHouseholds",
    label: "農業世帯数",
    name: "農業世帯数",
    description: "農業を営む世帯の総数",
    unit: "世帯",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:20:14",
    updated_at: "2025-10-11 00:20:14",
  },
  {
    id: 4,
    ranking_key: "agriculturalLand",
    label: "農用地",
    name: "農用地",
    description: "農業に使用される土地の総面積",
    unit: "ha",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:07:51",
    updated_at: "2025-10-11 00:07:51",
  },
  {
    id: 5,
    ranking_key: "agriculturalLandRatio",
    label: "農用地割合",
    name: "農用地割合",
    description: "総面積に占める農用地の割合",
    unit: "%",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:07:51",
    updated_at: "2025-10-11 00:07:51",
  },
  {
    id: 6,
    ranking_key: "areaRatio",
    label: "面積割合",
    name: "面積割合（全国面積に占める割合）",
    description: "全国面積に占める都道府県の面積割合",
    unit: "%",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:07:51",
    updated_at: "2025-10-11 00:07:51",
  },
  {
    id: 7,
    ranking_key: "averageHouseholdSize",
    label: "平均世帯人員",
    name: "平均世帯人員",
    description: "1世帯あたりの平均人員数",
    unit: "人",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:20:14",
    updated_at: "2025-10-11 00:20:14",
  },
  {
    id: 8,
    ranking_key: "averageIncome",
    label: "平均収入",
    name: "平均収入",
    description: "世帯の平均収入",
    unit: "円",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:20:14",
    updated_at: "2025-10-11 00:20:14",
  },
  {
    id: 9,
    ranking_key: "avgTemperature",
    label: "年平均気温",
    name: "年平均気温",
    description: "年間の平均気温",
    unit: "℃",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:20:14",
    updated_at: "2025-10-11 00:20:14",
  },
  {
    id: 10,
    ranking_key: "birthRate",
    label: "出生率",
    name: "出生率",
    description: "人口1000人当たりの出生数",
    unit: "‰",
    data_source_id: "estat",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
    is_active: 1,
    created_at: "2025-10-11 00:20:14",
    updated_at: "2025-10-11 00:20:14",
  },
];

/**
 * 有効なランキング項目のみを取得
 */
export function getActiveRankingItems(): RankingItem[] {
  return mockRankingItems.filter((item) => item.is_active === 1);
}

/**
 * ランキングキーでランキング項目を検索
 */
export function getRankingItemByKey(rankingKey: string): RankingItem | null {
  return (
    mockRankingItems.find((item) => item.ranking_key === rankingKey) || null
  );
}
