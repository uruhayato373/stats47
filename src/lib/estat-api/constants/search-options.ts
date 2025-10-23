export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 統計分野の選択肢
 */
export const STATS_FIELD_OPTIONS: SelectOption[] = [
  { value: "", label: "選択してください" },
  { value: "01", label: "国土・気象" },
  { value: "02", label: "人口・世帯" },
  { value: "03", label: "労働・賃金" },
  { value: "04", label: "事業所" },
  { value: "05", label: "農林水産業" },
  { value: "06", label: "鉱工業" },
  { value: "07", label: "商業・サービス業" },
  { value: "08", label: "企業・家計・経済" },
  { value: "09", label: "住宅・土地・建設" },
  { value: "10", label: "エネルギー・水" },
  { value: "11", label: "運輸・観光" },
  { value: "12", label: "情報通信・科学技術" },
  { value: "13", label: "教育・文化・スポーツ・生活" },
  { value: "14", label: "行財政" },
  { value: "15", label: "司法・安全・環境" },
  { value: "16", label: "社会保障・衛生" },
  { value: "17", label: "国際" },
];

/**
 * 集計地域区分の選択肢
 */
export const COLLECT_AREA_OPTIONS: SelectOption[] = [
  { value: "", label: "すべて" },
  { value: "1", label: "全国" },
  { value: "2", label: "都道府県" },
  { value: "3", label: "市区町村" },
];

/**
 * 取得件数の選択肢
 */
export const LIMIT_OPTIONS: SelectOption[] = [
  { value: "50", label: "50件" },
  { value: "100", label: "100件" },
  { value: "500", label: "500件" },
  { value: "1000", label: "1000件" },
];
