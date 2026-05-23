/**
 * Phase 1 S1: SSG 対象の政令指定都市 20 市
 *
 * area_profiles に強みデータが揃っており、indexed 化の効果が高い。
 * S2 (中核市 60 市追加)、S3 (全 2,701 cities) は次フェーズ。
 *
 * 詳細: docs/02_実装計画/cities-revival-plan.md §2.2
 */
export const STAGE_1_DESIGNATED_CITIES: Array<{ areaCode: string; cityCode: string }> = [
    { areaCode: "01000", cityCode: "01100" }, // 札幌市
    { areaCode: "04000", cityCode: "04100" }, // 仙台市
    { areaCode: "11000", cityCode: "11100" }, // さいたま市
    { areaCode: "12000", cityCode: "12100" }, // 千葉市
    { areaCode: "14000", cityCode: "14100" }, // 横浜市
    { areaCode: "14000", cityCode: "14130" }, // 川崎市
    { areaCode: "14000", cityCode: "14150" }, // 相模原市
    { areaCode: "15000", cityCode: "15100" }, // 新潟市
    { areaCode: "22000", cityCode: "22100" }, // 静岡市
    { areaCode: "22000", cityCode: "22130" }, // 浜松市
    { areaCode: "23000", cityCode: "23100" }, // 名古屋市
    { areaCode: "26000", cityCode: "26100" }, // 京都市
    { areaCode: "27000", cityCode: "27100" }, // 大阪市
    { areaCode: "27000", cityCode: "27140" }, // 堺市
    { areaCode: "28000", cityCode: "28100" }, // 神戸市
    { areaCode: "33000", cityCode: "33100" }, // 岡山市
    { areaCode: "34000", cityCode: "34100" }, // 広島市
    { areaCode: "40000", cityCode: "40100" }, // 北九州市
    { areaCode: "40000", cityCode: "40130" }, // 福岡市
    { areaCode: "43000", cityCode: "43100" }, // 熊本市
];
