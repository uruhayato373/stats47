/**
 * 総人口（basic-population）関連の主要指標定義
 * CSVファイルから抽出した指標のマッピング
 */

/**
 * 主要指標のマッピング
 * stats_data_id='0000010101'（人口推計）のデータを使用
 */
export const BASIC_POPULATION_INDICATORS = {
  /** 総人口 */
  TOTAL_POPULATION: {
    cat01: "A1101",
    itemCode: "total-population",
    itemName: "総人口",
  },
  /** 日本人人口 */
  JAPANESE_POPULATION: {
    cat01: "A1102",
    itemCode: "japanese-population",
    itemName: "日本人人口",
  },
  /** 年齢別人口（5歳刻み） */
  AGE_GROUPS: [
    { cat01: "A1201", itemCode: "population-0-4", itemName: "0～4歳人口" },
    { cat01: "A1202", itemCode: "population-5-9", itemName: "5～9歳人口" },
    { cat01: "A1203", itemCode: "population-10-14", itemName: "10～14歳人口" },
    { cat01: "A1204", itemCode: "population-15-19", itemName: "15～19歳人口" },
    { cat01: "A1205", itemCode: "population-20-24", itemName: "20～24歳人口" },
    { cat01: "A1206", itemCode: "population-25-29", itemName: "25～29歳人口" },
    { cat01: "A1207", itemCode: "population-30-34", itemName: "30～34歳人口" },
    { cat01: "A1208", itemCode: "population-35-39", itemName: "35～39歳人口" },
    { cat01: "A1209", itemCode: "population-40-44", itemName: "40～44歳人口" },
    { cat01: "A1210", itemCode: "population-45-49", itemName: "45～49歳人口" },
    { cat01: "A1211", itemCode: "population-50-54", itemName: "50～54歳人口" },
    { cat01: "A1212", itemCode: "population-55-59", itemName: "55～59歳人口" },
    { cat01: "A1213", itemCode: "population-60-64", itemName: "60～64歳人口" },
    { cat01: "A1214", itemCode: "population-65-69", itemName: "65～69歳人口" },
    { cat01: "A1215", itemCode: "population-70-74", itemName: "70～74歳人口" },
    { cat01: "A1216", itemCode: "population-75-79", itemName: "75～79歳人口" },
    { cat01: "A1217", itemCode: "population-80-84", itemName: "80～84歳人口" },
    { cat01: "A1218", itemCode: "population-85-89", itemName: "85～89歳人口" },
    { cat01: "A1219", itemCode: "population-90-94", itemName: "90～94歳人口" },
    { cat01: "A1220", itemCode: "population-95-99", itemName: "95～99歳人口" },
  ],
} as const;

/**
 * 統計表ID
 */
export const STATS_DATA_ID = "0000010101";

/**
 * 全国地域コード
 */
export const NATIONAL_AREA_CODE = "00000";

/**
 * 主要指標のcat01コード一覧を取得
 */
export function getMainIndicatorCat01Codes(): string[] {
  return [
    BASIC_POPULATION_INDICATORS.TOTAL_POPULATION.cat01,
    BASIC_POPULATION_INDICATORS.JAPANESE_POPULATION.cat01,
    ...BASIC_POPULATION_INDICATORS.AGE_GROUPS.map((group) => group.cat01),
  ];
}

/**
 * 指標名からcat01コードを取得
 */
export function getCat01ByItemCode(itemCode: string): string | undefined {
  if (itemCode === BASIC_POPULATION_INDICATORS.TOTAL_POPULATION.itemCode) {
    return BASIC_POPULATION_INDICATORS.TOTAL_POPULATION.cat01;
  }
  if (itemCode === BASIC_POPULATION_INDICATORS.JAPANESE_POPULATION.itemCode) {
    return BASIC_POPULATION_INDICATORS.JAPANESE_POPULATION.cat01;
  }
  return BASIC_POPULATION_INDICATORS.AGE_GROUPS.find(
    (group) => group.itemCode === itemCode
  )?.cat01;
}

