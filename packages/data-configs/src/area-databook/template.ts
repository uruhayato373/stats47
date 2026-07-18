/**
 * AREA_DATABOOK_TEMPLATE — 47 県共通の県データブック構成 (単一 SSOT)。
 *
 * 規約: `.claude/rules/area-databook-standards.md`
 *
 * - chart ブロックは generator で `apps/web/scripts/data/page-components/area/<code>.json`
 *   に出力される (手編集禁止・byte 一致)。
 * - それ以外のブロックは app が本テンプレを直接 import し、R2 databook.json
 *   (値+全国順位の焼き込み) と editorial/<code>.ts で描画する。
 *
 * ⚠️ Phase 1 時点は既存 area ページの 6 チャートをそのまま encode した状態
 * (golden diff = 生成物が既存 JSON と byte 一致することを担保)。
 * 書籍相当の全セクション化は Phase 2 で行う。
 */
import type { AreaDatabookTemplate } from "./types";

export const AREA_DATABOOK_TEMPLATE: AreaDatabookTemplate = {
  sections: [
    {
      sectionKey: "population-household",
      kind: "civic-population",
      title: "人口・世帯",
      sortOrder: 10,
      blocks: [
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-age-structure",
            componentType: "stacked-area",
            title: "年齢3区分人口の推移",
            componentProps: {
              estatParams: [
                { statsDataId: "0000010101", cdCat01: "A1301" },
                { statsDataId: "0000010101", cdCat01: "A1302" },
                { statsDataId: "0000010101", cdCat01: "A1303" },
              ],
              labels: ["15歳未満", "15〜64歳", "65歳以上"],
              rankingLinks: [
                {
                  label: "年少人口割合ランキング",
                  url: "/ranking/young-population-ratio",
                },
                { label: "高齢化率ランキング", url: "/ranking/ratio-65-plus" },
              ],
            },
            relatedRankingKeys: ["young-population-ratio", "ratio-65-plus"],
            sourceName: "社会・人口統計体系",
            gridColumnSpan: 12,
            sortOrder: 10,
          },
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-aging-young",
            componentType: "line-chart",
            title: "高齢化率・年少人口割合の推移",
            componentProps: {
              estatParams: [
                { statsDataId: "0000010201", cdCat01: "#A03503" },
                { statsDataId: "0000010201", cdCat01: "#A03501" },
              ],
              labels: ["高齢化率（65歳以上）", "年少人口割合（15歳未満）"],
              rankingLinks: [
                { label: "高齢化率ランキング", url: "/ranking/ratio-65-plus" },
                {
                  label: "年少人口割合ランキング",
                  url: "/ranking/young-population-ratio",
                },
              ],
            },
            relatedRankingKeys: ["ratio-65-plus", "young-population-ratio"],
            sourceName: "社会・人口統計体系",
            gridColumnSpan: 6,
            sortOrder: 20,
          },
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-elderly-household",
            componentType: "line-chart",
            title: "高齢者世帯の推移",
            componentProps: {
              estatParams: [
                { statsDataId: "0000010201", cdCat01: "#A06301" },
                { statsDataId: "0000010201", cdCat01: "#A06304" },
                { statsDataId: "0000010201", cdCat01: "#A06302" },
              ],
              labels: [
                "65歳以上世帯員のいる世帯",
                "65歳以上単独世帯",
                "高齢夫婦のみ世帯",
              ],
              rankingLinks: [
                {
                  label: "65歳以上単独世帯割合ランキング",
                  url: "/ranking/single-person-household-old-population-ratio",
                },
              ],
            },
            relatedRankingKeys: [
              "single-person-household-old-population-ratio",
            ],
            sourceName: "社会・人口統計体系",
            gridColumnSpan: 6,
            sortOrder: 30,
          },
        },
      ],
    },
    {
      sectionKey: "economy-employment",
      kind: "civic-economy",
      title: "経済・雇用",
      sortOrder: 20,
      blocks: [
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-prefectural-income",
            componentType: "line-chart",
            title: "1人当たり県民所得の推移",
            componentProps: {
              estatParams: [{ statsDataId: "0000010203", cdCat01: "#C01321" }],
              labels: ["1人当たり県民所得"],
            },
            relatedRankingKeys: ["prefectural-income-per-capita"],
            sourceName: "社会・人口統計体系",
            rankingLink: "/ranking/prefectural-income-per-capita",
            gridColumnSpan: 6,
            sortOrder: 40,
          },
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-job-opening",
            componentType: "line-chart",
            title: "有効求人倍率の推移",
            componentProps: {
              estatParams: [{ statsDataId: "0000010206", cdCat01: "#F03103" }],
              labels: ["有効求人倍率"],
            },
            relatedRankingKeys: ["active-job-opening-ratio"],
            sourceName: "社会・人口統計体系",
            rankingLink: "/ranking/active-job-opening-ratio",
            gridColumnSpan: 6,
            sortOrder: 50,
          },
        },
      ],
    },
    {
      sectionKey: "safety-living",
      kind: "civic-living",
      title: "安全・くらし",
      sortOrder: 30,
      blocks: [
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-traffic-accident",
            componentType: "line-chart",
            title: "交通事故 発生件数と負傷者数の推移",
            componentProps: {
              estatParams: [
                { statsDataId: "0000010111", cdCat01: "K3101" },
                { statsDataId: "0000010111", cdCat01: "K3104" },
              ],
              labels: ["事故発生件数", "負傷者数"],
            },
            relatedRankingKeys: ["traffic-accident-count"],
            sourceName: "社会・人口統計体系",
            rankingLink: "/ranking/traffic-accident-count",
            gridColumnSpan: 6,
            sortOrder: 60,
          },
        },
      ],
    },
  ],
};
