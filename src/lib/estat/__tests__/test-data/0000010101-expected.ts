import { EstatTransformedData } from "../../data-transformer";

// 0000010101のデータ変換後の期待結果
export const expectedTransformedData: EstatTransformedData[] = [
  {
    stats_data_id: "0000010101",
    stat_name: "社会・人口統計体系",
    title: "Ａ　人口・世帯",
    cat01: "A140401",
    item_name: "0～3歳人口（男）",
    unit: "人",
  },
  {
    stats_data_id: "0000010101",
    stat_name: "社会・人口統計体系",
    title: "Ａ　人口・世帯",
    cat01: "A140402",
    item_name: "0～3歳人口（女）",
    unit: "人",
  },
];

// 統計表の基本情報
export const expectedTableInfo = {
  stats_data_id: "0000010101",
  stat_name: "社会・人口統計体系",
  title: "Ａ　人口・世帯",
  gov_org: "総務省",
  cycle: "年度次",
  collect_area: "全国",
  overall_total_number: 546720,
  open_date: "2025-06-30",
  updated_date: "2025-06-30",
};

// 分類情報
export const expectedClassifications = {
  cat01: {
    name: "Ａ　人口・世帯",
    items: [
      { code: "A140401", name: "0～3歳人口（男）", unit: "人" },
      { code: "A140402", name: "0～3歳人口（女）", unit: "人" },
    ],
  },
  area: {
    name: "地域",
    items: [
      { code: "00000", name: "全国" },
      { code: "13000", name: "東京都" },
    ],
  },
  time: {
    name: "調査年",
    items: [
      { code: "2020100000", name: "2020年度" },
      { code: "2021100000", name: "2021年度" },
    ],
  },
};
