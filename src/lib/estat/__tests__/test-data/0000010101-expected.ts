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
      { code: "A1101", name: "A1101_総人口", unit: "人" },
      { code: "A110101", name: "A110101_総人口（男）", unit: "人" },
      { code: "A110102", name: "A110102_総人口（女）", unit: "人" },
      { code: "A1102", name: "A1102_日本人人口", unit: "人" },
      { code: "A110201", name: "A110201_日本人人口（男）", unit: "人" },
      { code: "A110202", name: "A110202_日本人人口（女）", unit: "人" },
    ],
    totalCount: 576, // 実際のcat01項目数
  },
  area: {
    name: "地域",
    items: [
      { code: "00000", name: "全国" },
      { code: "01000", name: "北海道" },
      { code: "02000", name: "青森県" },
      { code: "13000", name: "東京都" },
      { code: "14000", name: "神奈川県" },
      { code: "47000", name: "沖縄県" },
    ],
    totalCount: 48, // 実際のarea項目数
  },
  time: {
    name: "調査年",
    items: [
      { code: "1975100000", name: "1975年度" },
      { code: "1980100000", name: "1980年度" },
      { code: "1990100000", name: "1990年度" },
      { code: "2000100000", name: "2000年度" },
      { code: "2010100000", name: "2010年度" },
      { code: "2020100000", name: "2020年度" },
    ],
    totalCount: 50, // 実際のtime項目数
  },
};
