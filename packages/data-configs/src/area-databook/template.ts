/**
 * AREA_DATABOOK_TEMPLATE — 47 県共通の県データブック構成 (単一 SSOT)。
 *
 * 規約: `.claude/rules/area-databook-standards.md`
 *
 * - chart ブロックは generator で `apps/web/scripts/data/page-components/area/<code>.json`
 *   に出力される (手編集禁止・byte 一致)。既存 6 チャートを各セクションに温存し、
 *   listTemplateCharts の収集順 (人口→経済→安全) を保つことで golden diff をゼロに保つ。
 * - ranked-kpi-grid / gender-paired-kpi / agri-top10 は R2 `app/areas/<code>/databook.json`
 *   (exporter が values.json から値+全国順位を焼き込み) を app が読んで描画する。
 * - specialty-list / symbol-card は editorial/<code>.ts を app が直接 import して描画する。
 *
 * 書籍「2021 都道府県 Data Book」(日本食糧新聞社) の章立てを設計図に、県軸・回遊面の
 * 責務内 (自県の値+全国順位) で encode する。47 県横並び可視化は置かない (theme の責務)。
 * selection (provenance) は Phase 3 で area-databook-designer が各指標に補記する
 * (現状は未記入=validator warn、非ブロック)。
 */
import type { AreaDatabookTemplate } from "./types";

const BOOK = "都道府県 Data Book (日本食糧新聞社)";

export const AREA_DATABOOK_TEMPLATE: AreaDatabookTemplate = {
  sections: [
    /* ① 県シンボル ---------------------------------------------------- */
    {
      sectionKey: "symbols",
      kind: "symbols",
      title: "県のシンボル",
      sortOrder: 5,
      blocks: [{ blockType: "symbol-card", blockKey: "symbols-card" }],
    },
    /* ① 特産品 -------------------------------------------------------- */
    {
      sectionKey: "specialties",
      kind: "specialties",
      title: "特産品",
      description: "県を代表する農水産物・加工品",
      sortOrder: 8,
      blocks: [{ blockType: "specialty-list", blockKey: "specialties-list" }],
    },
    /* ② 農業生産 ------------------------------------------------------ */
    {
      sectionKey: "agriculture",
      kind: "agriculture",
      title: "農業生産",
      sortOrder: 10,
      blocks: [
        { blockType: "agri-top10", blockKey: "agri-top10" },
        {
          blockType: "ranked-kpi-grid",
          blockKey: "agri-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "agricultural-output",
              shortLabel: "農業産出額",
              selection: {
                proposedBy: BOOK,
                surveyedAt: "2026-07-18",
                rationale: "県の農業規模を示すヘッドライン指標",
              },
            },
            { rankingKey: "cultivated-land-area-ratio", shortLabel: "耕地面積率" },
          ],
        },
      ],
    },
    /* ③ 県の食 -------------------------------------------------------- */
    {
      sectionKey: "food",
      kind: "food",
      title: "県の食",
      sortOrder: 20,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "food-kpi",
          columns: 3,
          metrics: [
            { rankingKey: "rice-harvest-volume", shortLabel: "コメ収穫量" },
            { rankingKey: "marine-fishery-catch", shortLabel: "海面漁業漁獲量" },
            { rankingKey: "marine-aquaculture-harvest", shortLabel: "海面養殖収穫量" },
            {
              rankingKey: "food-self-sufficiency-rate-calorie",
              shortLabel: "食料自給率",
            },
            {
              rankingKey: "engel-coefficient",
              shortLabel: "エンゲル係数",
              capitalCityValue: true,
            },
            { rankingKey: "dairy-cattle-count", shortLabel: "乳用牛飼育頭数" },
          ],
        },
      ],
    },
    /* ④ 県民力: 人口 (＋既存の人口チャート) ---------------------------- */
    {
      sectionKey: "civic-population",
      kind: "civic-population",
      title: "人口・世帯",
      sortOrder: 30,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "population-kpi",
          columns: 4,
          metrics: [
            {
              rankingKey: "japanese-population",
              shortLabel: "人口",
              selection: {
                proposedBy: BOOK,
                surveyedAt: "2026-07-18",
                rationale: "県規模の基準指標",
              },
            },
            {
              rankingKey: "population-density-per-km2-total-area",
              shortLabel: "人口密度",
            },
            {
              rankingKey: "future-population-change-rate-2050",
              shortLabel: "2050年人口変化率",
            },
            { rankingKey: "crude-birth-rate", shortLabel: "出生率" },
            { rankingKey: "crude-death-rate", shortLabel: "死亡率" },
            {
              rankingKey: "foreign-resident-count-per-100k",
              shortLabel: "外国人(10万人比)",
            },
            {
              rankingKey: "suicide-rate-per-100k",
              shortLabel: "自殺者数(10万人比)",
            },
            {
              rankingKey: "traffic-accident-count",
              shortLabel: "交通事故発生件数",
            },
          ],
        },
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
            relatedRankingKeys: ["single-person-household-old-population-ratio"],
            sourceName: "社会・人口統計体系",
            gridColumnSpan: 6,
            sortOrder: 30,
          },
        },
      ],
    },
    /* ④ 県民力: 暮らし ------------------------------------------------ */
    {
      sectionKey: "civic-living",
      kind: "civic-living",
      title: "暮らし",
      sortOrder: 40,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "living-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "current-savings-balance-multi-person-households",
              shortLabel: "貯蓄現在高",
              capitalCityValue: true,
            },
            {
              rankingKey: "financial-debt-balance",
              shortLabel: "負債現在高",
              capitalCityValue: true,
            },
            {
              rankingKey: "owner-occupied-housing-ratio",
              shortLabel: "持ち家率",
            },
            { rankingKey: "housing-floor-area", shortLabel: "延べ床面積" },
            {
              rankingKey: "crime-rate-per-1k",
              shortLabel: "犯罪認知件数(千人比)",
            },
          ],
        },
      ],
    },
    /* ④ 県民力: 経済・労働 (＋既存の経済チャート) ---------------------- */
    {
      sectionKey: "civic-economy",
      kind: "civic-economy",
      title: "経済・雇用",
      sortOrder: 50,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "economy-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "per-capita-prefectural-income-h27",
              shortLabel: "1人当たり県民所得",
              compareNationalAvg: true,
              selection: {
                proposedBy: BOOK,
                surveyedAt: "2026-07-18",
                rationale: "全国平均対比で県の所得水準を示す主指標",
              },
            },
            {
              rankingKey: "active-job-opening-ratio",
              shortLabel: "有効求人倍率",
              compareNationalAvg: true,
            },
            { rankingKey: "unemployment-rate", shortLabel: "失業率" },
          ],
        },
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
            relatedRankingKeys: ["per-capita-prefectural-income-h27"],
            sourceName: "社会・人口統計体系",
            rankingLink: "/ranking/per-capita-prefectural-income-h27",
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
    /* ④ 県民力: 産業 -------------------------------------------------- */
    {
      sectionKey: "civic-industry",
      kind: "civic-industry",
      title: "産業",
      sortOrder: 60,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "industry-kpi",
          columns: 2,
          metrics: [
            {
              rankingKey: "manufacturing-establishments",
              shortLabel: "製造業事業所数",
            },
            {
              rankingKey: "manufacturing-shipment-amount",
              shortLabel: "製造品出荷額",
            },
          ],
        },
      ],
    },
    /* ⑤ 世帯 ---------------------------------------------------------- */
    {
      sectionKey: "household",
      kind: "household",
      title: "世帯",
      sortOrder: 70,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "household-kpi",
          columns: 3,
          metrics: [
            { rankingKey: "households", shortLabel: "世帯数" },
            {
              rankingKey: "single-person-household-ratio",
              shortLabel: "単身世帯率",
            },
            {
              rankingKey: "elderly-couple-only-household-ratio",
              shortLabel: "高齢夫婦のみ世帯率",
            },
            {
              rankingKey: "households-on-public-assistance-per-1000",
              shortLabel: "生活保護世帯(千世帯比)",
            },
          ],
        },
      ],
    },
    /* ⑤ 気候 ---------------------------------------------------------- */
    {
      sectionKey: "climate",
      kind: "climate",
      title: "気候",
      sortOrder: 80,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "climate-kpi",
          columns: 4,
          metrics: [
            { rankingKey: "average-temperature", shortLabel: "平均気温" },
            { rankingKey: "annual-sunshine-duration", shortLabel: "日照時間" },
            { rankingKey: "annual-precipitation", shortLabel: "降水量" },
            {
              rankingKey: "average-relative-humidity",
              shortLabel: "平均相対湿度",
            },
          ],
        },
      ],
    },
    /* ⑤ 男女 ---------------------------------------------------------- */
    {
      sectionKey: "gender",
      kind: "gender",
      title: "男女",
      description: "男女で対比する指標",
      sortOrder: 90,
      blocks: [
        {
          blockType: "gender-paired-kpi",
          blockKey: "gender-pairs",
          pairs: [
            {
              label: "初婚年齢",
              maleKey: "average-age-of-first-marriage-husband",
              femaleKey: "average-age-of-first-marriage-wife",
            },
            {
              label: "平均寿命",
              maleKey: "life-expectancy-0-male",
              femaleKey: "life-expectancy-0-female",
            },
            {
              label: "月額給与",
              maleKey: "male-scheduled-earnings",
              femaleKey: "female-scheduled-earnings",
            },
            {
              label: "身長(高2)",
              maleKey: "avg-height-high-school-2nd-male",
              femaleKey: "average-height-high-school-second-grade-female",
            },
            {
              label: "体重(高2)",
              maleKey: "average-weight-high-school-second-grade-male",
              femaleKey: "average-weight-high-school-second-grade-female",
            },
          ],
        },
      ],
    },
    /* ⑤ 地価 ---------------------------------------------------------- */
    {
      sectionKey: "land-price",
      kind: "land-price",
      title: "地価",
      sortOrder: 100,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "land-price-kpi",
          columns: 2,
          metrics: [
            {
              rankingKey: "residential-land-price-change-rate",
              shortLabel: "住宅地価変動率",
            },
          ],
        },
      ],
    },
    /* ⑤ 旅行者 -------------------------------------------------------- */
    {
      sectionKey: "tourism",
      kind: "tourism",
      title: "旅行者",
      sortOrder: 110,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "tourism-kpi",
          columns: 2,
          metrics: [
            {
              rankingKey: "total-overnight-guests",
              shortLabel: "延べ宿泊者数",
            },
          ],
        },
      ],
    },
    /* ⑤ 学校・施設 ---------------------------------------------------- */
    {
      sectionKey: "education-facility",
      kind: "education-facility",
      title: "学校・施設",
      description: "人口 10 万人当たりの施設数など",
      sortOrder: 120,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "facility-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "physicians-in-medical-facilities",
              shortLabel: "医師数(10万人比)",
            },
            { rankingKey: "general-hospital-count", shortLabel: "一般病院数" },
            {
              rankingKey: "general-clinic-count-per-100k",
              shortLabel: "一般診療所数(10万人比)",
            },
            {
              rankingKey: "library-count-per-million",
              shortLabel: "図書館数(100万人比)",
            },
            {
              rankingKey: "museum-count-per-million",
              shortLabel: "博物館数(100万人比)",
            },
            {
              rankingKey: "certified-childcare-center-count-per-100k-0-5",
              shortLabel: "認定こども園数(0-5歳10万人比)",
            },
          ],
        },
      ],
    },
    /* ⑥ 消費 (家計調査・県庁所在市) ----------------------------------- */
    {
      sectionKey: "consumption",
      kind: "consumption",
      title: "消費",
      description: "県庁所在市の 1 世帯当たり年間支出",
      sortOrder: 130,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "consumption-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey:
                "consumption-expenditure-multi-person-households-per-month",
              shortLabel: "消費支出",
              capitalCityValue: true,
              selection: {
                proposedBy: BOOK,
                surveyedAt: "2026-07-18",
                rationale: "県庁所在市の家計消費の総額",
              },
            },
            {
              rankingKey: "food-expenditure-ratio-multi-person-households",
              shortLabel: "食料費割合",
              capitalCityValue: true,
            },
            {
              rankingKey:
                "culture-recreation-expenditure-ratio-multi-person-households",
              shortLabel: "教養娯楽費割合",
              capitalCityValue: true,
            },
            {
              rankingKey:
                "transport-communication-expenditure-ratio-multi-person-households",
              shortLabel: "交通・通信費割合",
              capitalCityValue: true,
            },
            {
              rankingKey:
                "education-expenditure-ratio-multi-person-households",
              shortLabel: "教育費割合",
              capitalCityValue: true,
            },
          ],
        },
      ],
    },
    /* 安全・くらし (既存の交通事故チャートを温存) --------------------- */
    {
      sectionKey: "safety-living",
      kind: "civic-living",
      title: "安全・くらし",
      sortOrder: 140,
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
